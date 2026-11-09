from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.models import db, Student, AttendanceRecord, Subject, AttendanceSession, StudentEnrollment
from app.services.qr_service import qr_service

student_bp = Blueprint('student', __name__, url_prefix='/api/student')

@student_bp.before_request
def enforce_student_or_admin():
    if request.method == 'OPTIONS':
        return None
    try:
        verify_jwt_in_request()
        claims = get_jwt() or {}
        role = claims.get('role')
        if role not in ['student', 'admin']:
            return jsonify({
                'success': False,
                'error': 'Forbidden: Student credentials required.'
            }), 403
    except Exception:
        return jsonify({
            'success': False,
            'error': 'Unauthorized: Valid JWT authentication token required.'
        }), 401

def get_current_student():
    try:
        identity = get_jwt_identity()
        claims = get_jwt() or {}
        role = claims.get('role')

        stu = None
        if identity:
            try:
                stu = Student.query.filter_by(user_id=int(identity)).first()
            except (ValueError, TypeError):
                pass
            if not stu:
                profile_id = claims.get('profile_id')
                if profile_id:
                    stu = Student.query.filter_by(student_id=str(profile_id)).first()
            if not stu:
                email = claims.get('email')
                if email:
                    stu = Student.query.filter_by(email=str(email)).first()

        # Admin can view a specific student or first student
        if role == 'admin':
            req_stu_id = request.args.get('student_id') or (request.get_json(silent=True) or {}).get('student_id') or request.headers.get('X-Student-ID')
            if req_stu_id:
                admin_selected = Student.query.filter(
                    (Student.student_id == str(req_stu_id)) |
                    (Student.roll_no == str(req_stu_id)) |
                    (Student.email == str(req_stu_id))
                ).first()
                if admin_selected:
                    return admin_selected
            return stu or Student.query.first()

        # For student role: enforce that user can ONLY access their own data
        if role == 'student' and stu:
            # Check if student attempted to query another student's ID via query param or body
            req_stu_id = request.args.get('student_id') or (request.get_json(silent=True) or {}).get('student_id')
            if req_stu_id and str(req_stu_id) not in [str(stu.id), str(stu.student_id), str(stu.roll_no)]:
                return 'FORBIDDEN_OTHER_STUDENT'
            return stu
    except Exception:
        pass

    return None

@student_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    stu = get_current_student()
    if stu == 'FORBIDDEN_OTHER_STUDENT':
        return jsonify({'success': False, 'error': 'Forbidden: You cannot access another student\'s records.'}), 403
    if not stu:
        return jsonify({'success': False, 'error': 'Student identity could not be verified'}), 404

    records = AttendanceRecord.query.filter_by(student_id=stu.id).order_by(AttendanceRecord.created_at.desc()).all()
    total_classes = len(records)
    present_count = len([r for r in records if r.status in ['Present', 'Late']])
    absent_count = len([r for r in records if r.status == 'Absent'])
    overall_percentage = round((present_count / total_classes * 100)) if total_classes > 0 else 85

    # Subject-wise attendance breakdown
    subjects = Subject.query.filter_by(class_id=stu.class_id).all() if stu.class_id else []
    if not subjects:
        # Check enrollments
        enrolled_class_ids = [e.class_id for e in stu.enrollments]
        subjects = Subject.query.filter(Subject.class_id.in_(enrolled_class_ids)).all() if enrolled_class_ids else []

    subject_stats = []
    for sub in subjects:
        sub_records = [r for r in records if r.session and r.session.subject_id == sub.id]
        total = len(sub_records)
        attended = len([r for r in sub_records if r.status in ['Present', 'Late']])
        sub_absent = len([r for r in sub_records if r.status == 'Absent'])
        rate = round((attended / total * 100)) if total > 0 else 90
        subject_stats.append({
            'id': sub.subject_id,
            'name': sub.name,
            'code': sub.code,
            'rate': rate,
            'attended': attended,
            'absent': sub_absent,
            'total': total,
            'teacherName': sub.instructor.name if sub.instructor else 'Faculty Instructor'
        })

    return jsonify({
        'success': True,
        'student': stu.to_dict(),
        'overallPercentage': overall_percentage,
        'totalRecorded': total_classes,
        'presentCount': present_count,
        'absentCount': absent_count,
        'subjectStats': subject_stats,
        'recentRecords': [r.to_dict() for r in records[:5]]
    }), 200

@student_bp.route('/subjects', methods=['GET'])
def get_subjects():
    stu = get_current_student()
    if stu == 'FORBIDDEN_OTHER_STUDENT':
        return jsonify({'success': False, 'error': 'Forbidden: Access denied.'}), 403
    if not stu:
        return jsonify({'success': False, 'error': 'Student not found'}), 404

    subjects = Subject.query.filter_by(class_id=stu.class_id).all() if stu.class_id else []
    records = AttendanceRecord.query.filter_by(student_id=stu.id).all()

    result = []
    for sub in subjects:
        sub_records = [r for r in records if r.session and r.session.subject_id == sub.id]
        total = len(sub_records)
        attended = len([r for r in sub_records if r.status in ['Present', 'Late']])
        absent = len([r for r in sub_records if r.status == 'Absent'])
        rate = round((attended / total * 100)) if total > 0 else 85
        result.append({
            'id': sub.subject_id,
            'name': sub.name,
            'code': sub.code,
            'teacherName': sub.instructor.name if sub.instructor else 'Assigned Faculty',
            'department': sub.class_batch.department if sub.class_batch else 'Computer Science',
            'totalSessions': total,
            'attendedSessions': attended,
            'absentSessions': absent,
            'attendanceRate': rate
        })

    return jsonify({'success': True, 'subjects': result}), 200

@student_bp.route('/profile', methods=['GET', 'PUT'])
def get_profile():
    stu = get_current_student()
    if stu == 'FORBIDDEN_OTHER_STUDENT':
        return jsonify({'success': False, 'error': 'Forbidden: Access denied.'}), 403
    if not stu:
        return jsonify({'success': False, 'error': 'Student not found'}), 404

    if request.method == 'PUT':
        data = request.get_json() or {}
        if 'name' in data:
            stu.name = data['name']
        db.session.commit()

    return jsonify({'success': True, 'student': stu.to_dict()}), 200

@student_bp.route('/attendance/scan', methods=['POST'])
def scan_attendance():
    stu = get_current_student()
    if stu == 'FORBIDDEN_OTHER_STUDENT':
        return jsonify({'success': False, 'error': 'Forbidden: Unauthorized scan identity.'}), 403
    if not stu:
        return jsonify({'success': False, 'error': 'Authenticated student record not found'}), 401

    data = request.get_json() or {}
    token = data.get('token')
    method = data.get('method', 'QR Camera')

    result = qr_service.process_qr_scan(
        token=token,
        student_id_or_user_id=stu,
        method=method
    )

    status_code = 200 if result['success'] else 400
    return jsonify(result), status_code

@student_bp.route('/attendance', methods=['GET'])
def get_attendance():
    stu = get_current_student()
    if stu == 'FORBIDDEN_OTHER_STUDENT':
        return jsonify({'success': False, 'error': 'Forbidden: You cannot access another student\'s attendance records.'}), 403
    if not stu:
        return jsonify({'success': False, 'error': 'Student identity not verified.'}), 401

    records = AttendanceRecord.query.filter_by(student_id=stu.id).order_by(AttendanceRecord.created_at.desc()).all()
    return jsonify({'success': True, 'records': [r.to_dict() for r in records]}), 200
