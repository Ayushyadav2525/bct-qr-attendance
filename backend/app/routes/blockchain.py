from flask import Blueprint, jsonify
from datetime import datetime
from app.models import db, AttendanceRecord, BlockchainTransaction
from app.services.blockchain_service import blockchain_service

blockchain_bp = Blueprint('blockchain', __name__, url_prefix='/api/blockchain')

@blockchain_bp.route('/status', methods=['GET'])
def get_status():
    status_data = blockchain_service.get_status()
    return jsonify({'success': True, **status_data}), 200

@blockchain_bp.route('/attendance/<id>', methods=['GET'])
def verify_attendance(id):
    # Lookup by record id or REC-xxxx
    record = None
    if str(id).startswith('REC-'):
        try:
            db_id = int(str(id).replace('REC-', ''))
            record = AttendanceRecord.query.get(db_id)
        except Exception:
            pass
    if not record:
        record = AttendanceRecord.query.filter((AttendanceRecord.id == id)).first()

    if not record:
        return jsonify({'success': False, 'error': 'Attendance record not found.'}), 404

    # Perform live verification on smart contract
    on_chain_res = blockchain_service.verify_attendance_on_chain(
        session_id=record.session.session_id if record.session else 'SES-001',
        student_hash_hex=record.student_hash
    )

    return jsonify({
        'success': True,
        'record': record.to_dict(),
        'onChainVerification': on_chain_res,
        'blockchainTransaction': record.blockchain_tx.to_dict() if record.blockchain_tx else None
    }), 200

@blockchain_bp.route('/transaction/<hash>', methods=['GET'])
def get_transaction(hash):
    tx_data = blockchain_service.get_transaction_details(hash)
    if not tx_data:
        # Check local DB record
        tx = BlockchainTransaction.query.filter_by(tx_hash=hash).first()
        if tx:
            return jsonify({'success': True, 'transaction': tx.to_dict(), 'source': 'database'}), 200
        return jsonify({'success': False, 'error': 'Transaction receipt not found on blockchain.'}), 404

    return jsonify({'success': True, 'transaction': tx_data, 'source': 'blockchain_rpc'}), 200

@blockchain_bp.route('/retry/<int:attendance_id>', methods=['POST'])
def retry_blockchain_submission(attendance_id):
    record = AttendanceRecord.query.get(attendance_id)
    if not record:
        return jsonify({'success': False, 'error': 'Attendance record not found.'}), 404

    if record.blockchain_status == 'CONFIRMED':
        return jsonify({'success': True, 'message': 'Attendance is already confirmed on blockchain.', 'record': record.to_dict()}), 200

    # Retry submission
    verification_code = f"VER-{record.session.session_id if record.session else 'SES'}-{record.student.roll_no if record.student else 'STU'}"
    bc_res = blockchain_service.submit_attendance_proof(
        session_id=record.session.session_id if record.session else 'SES-001',
        student_hash_hex=record.student_hash,
        verification_code=verification_code
    )

    tx = record.blockchain_tx
    if not tx:
        tx = BlockchainTransaction(
            attendance_id=record.id,
            session_id=record.session.session_id if record.session else 'SES-001',
            student_hash=record.student_hash
        )
        db.session.add(tx)

    tx.tx_hash = bc_res.get('tx_hash')
    tx.block_number = bc_res.get('block_number')
    tx.status = bc_res.get('status', 'FAILED')
    tx.gas_used = bc_res.get('gas_used')
    tx.error_message = bc_res.get('error')
    if bc_res.get('success'):
        tx.confirmed_at = datetime.utcnow()

    record.blockchain_status = bc_res.get('status', 'FAILED')
    db.session.commit()

    return jsonify({
        'success': bc_res.get('success', False),
        'message': 'Blockchain submission retried.' if bc_res.get('success') else bc_res.get('error'),
        'record': record.to_dict(),
        'blockchain': tx.to_dict()
    }), 200 if bc_res.get('success') else 400
