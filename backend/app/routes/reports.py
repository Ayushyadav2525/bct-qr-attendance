import csv
import io
from flask import Blueprint, request, jsonify, Response
from app.models import AttendanceRecord, Student, Subject, ClassBatch

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@reports_bp.route('/attendance', methods=['GET'])
def get_attendance_report():
    records = AttendanceRecord.query.order_by(AttendanceRecord.created_at.desc()).all()
    return jsonify({'success': True, 'records': [r.to_dict() for r in records]}), 200

@reports_bp.route('/student', methods=['GET'])
def get_student_report():
    student_id = request.args.get('student_id')
    stu = Student.query.filter((Student.student_id == student_id) | (Student.id == student_id)).first()
    if not stu:
        return jsonify({'success': False, 'error': 'Student not found'}), 404

    records = AttendanceRecord.query.filter_by(student_id=stu.id).all()
    total = len(records)
    present = len([r for r in records if r.status in ['Present', 'Late']])
    return jsonify({
        'success': True,
        'student': stu.to_dict(),
        'totalRecorded': total,
        'present': present,
        'attendanceRate': round((present / total * 100)) if total > 0 else 0,
        'records': [r.to_dict() for r in records]
    }), 200

@reports_bp.route('/subject', methods=['GET'])
def get_subject_report():
    subject_id = request.args.get('subject_id')
    sub = Subject.query.filter((Subject.subject_id == subject_id) | (Subject.id == subject_id)).first()
    if not sub:
        return jsonify({'success': False, 'error': 'Subject not found'}), 404

    records = AttendanceRecord.query.join(AttendanceRecord.session).filter_by(subject_id=sub.id).all()
    total = len(records)
    present = len([r for r in records if r.status in ['Present', 'Late']])
    return jsonify({
        'success': True,
        'subject': sub.to_dict(),
        'totalRecords': total,
        'presentCount': present,
        'rate': round((present / total * 100)) if total > 0 else 0
    }), 200

@reports_bp.route('/export', methods=['GET'])
def export_csv():
    records = AttendanceRecord.query.order_by(AttendanceRecord.date.desc(), AttendanceRecord.time.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'Record ID', 'Student Roll', 'Student Name', 'Class Name', 'Subject Name',
        'Date', 'Time', 'Status', 'Verification Method', 'Blockchain Status', 'Transaction Hash'
    ])

    for r in records:
        tx = r.blockchain_tx
        writer.writerow([
            f"REC-{r.id:04d}",
            r.student.roll_no if r.student else '',
            r.student.name if r.student else '',
            r.session.class_batch.name if (r.session and r.session.class_batch) else '',
            r.session.subject.name if (r.session and r.session.subject) else '',
            r.date,
            r.time,
            r.status,
            r.method,
            r.blockchain_status,
            tx.tx_hash if tx else ''
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={"Content-Disposition": "attachment;filename=attendance_audit_export.csv"}
    )
