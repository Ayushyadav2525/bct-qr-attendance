from datetime import datetime
from app.models import (
    db, Student, AttendanceSession, AttendanceRecord,
    BlockchainTransaction, StudentEnrollment
)
from app.services.blockchain_service import blockchain_service

class QRValidationService:
    @staticmethod
    def process_qr_scan(token, student_id_or_user_id, method='QR Camera'):
        """
        Validates QR attendance scan and records attendance atomically.
        """
        if not token:
            return {'success': False, 'error': 'Missing QR session token.'}

        # 1. Resolve student record
        student = None
        if isinstance(student_id_or_user_id, Student):
            student = student_id_or_user_id
        elif isinstance(student_id_or_user_id, int):
            student = Student.query.get(student_id_or_user_id)
            if not student:
                student = Student.query.filter_by(user_id=student_id_or_user_id).first()
        elif isinstance(student_id_or_user_id, str):
            student = Student.query.filter(
                (Student.student_id == student_id_or_user_id) |
                (Student.roll_no == student_id_or_user_id) |
                (Student.email == student_id_or_user_id)
            ).first()
            if not student and student_id_or_user_id.isdigit():
                student = Student.query.get(int(student_id_or_user_id))

        if not student:
            return {'success': False, 'error': 'Student identity could not be verified in the institution directory.'}

        # 2. Find attendance session by token
        session = AttendanceSession.query.filter_by(token=token.strip()).first()
        if not session:
            return {'success': False, 'error': 'Invalid or unrecognized QR token.'}

        # 3. Check session status
        if session.status not in ['OPEN', 'Active']:
            return {'success': False, 'error': 'This attendance session has been manually closed by the instructor.'}

        # 4. Check session expiration
        now = datetime.utcnow()
        if session.is_expired():
            session.status = 'Expired'
            db.session.commit()
            return {'success': False, 'error': 'This QR code has expired. Please request a new QR code from the instructor.'}

        # 5. Check enrollment
        is_enrolled = (
            student.class_id == session.class_id or
            StudentEnrollment.query.filter_by(student_id=student.id, class_id=session.class_id).first() is not None
        )
        if not is_enrolled:
            class_name = session.class_batch.name if session.class_batch else f"Class #{session.class_id}"
            return {
                'success': False,
                'error': f'Access Denied: You are not enrolled in {class_name}. Attendance is restricted to registered students.'
            }

        # 6. Check duplicate attendance
        existing_record = AttendanceRecord.query.filter_by(
            session_id=session.id,
            student_id=student.id
        ).first()

        if existing_record:
            return {
                'success': False,
                'error': f'Duplicate Scan Rejected: You have already checked in for this session at {existing_record.time}.'
            }

        # 7. Create attendance record in database
        today_date = now.strftime('%Y-%m-%d')
        current_time = now.strftime('%I:%M %p')

        record = AttendanceRecord(
            session_id=session.id,
            student_id=student.id,
            date=today_date,
            time=current_time,
            status='Present',
            method=method,
            student_hash=student.student_hash,
            blockchain_status='PENDING'
        )

        db.session.add(record)
        db.session.commit() # Database record safely committed

        # 8. Submit proof to blockchain
        verification_code = f"VER-{session.session_id}-{student.roll_no}"
        bc_res = blockchain_service.submit_attendance_proof(
            session_id=session.session_id,
            student_hash_hex=student.student_hash,
            verification_code=verification_code
        )

        # 9. Store blockchain transaction status
        tx = BlockchainTransaction(
            attendance_id=record.id,
            session_id=session.session_id,
            student_hash=student.student_hash,
            tx_hash=bc_res.get('tx_hash'),
            block_number=bc_res.get('block_number'),
            status=bc_res.get('status', 'FAILED'),
            gas_used=bc_res.get('gas_used'),
            error_message=bc_res.get('error'),
            confirmed_at=datetime.utcnow() if bc_res.get('success') else None
        )

        record.blockchain_status = bc_res.get('status', 'FAILED')
        db.session.add(tx)
        db.session.commit()

        return {
            'success': True,
            'message': f"Attendance successfully marked for {session.subject.name if session.subject else 'Subject'}!",
            'record': record.to_dict(),
            'blockchain': {
                'status': record.blockchain_status,
                'tx_hash': tx.tx_hash,
                'block_number': tx.block_number,
                'gas_used': tx.gas_used,
                'error': tx.error_message
            }
        }

qr_service = QRValidationService()
