from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.models import (
    db, Teacher, ClassBatch, Subject, AttendanceSession,
    AttendanceRecord, Student, TeacherAssignment, AttendanceCorrection
)
from app.utils.helpers import generate_session_token, validate_and_format_lecture_schedule

teacher_bp = Blueprint('teacher', __name__, url_prefix='/api/teacher')

@teacher_bp.before_request
def enforce_teacher_or_admin():
    if request.method == 'OPTIONS':
        return None
    try:
        verify_jwt_in_request()
        claims = get_jwt() or {}
        role = claims.get('role')
        if role not in ['teacher', 'admin']:
            return jsonify({
                'success': False,
                'error': 'Forbidden: Faculty or Administrator credentials required.'
            }), 403
    except Exception:
        return jsonify({
            'success': False,
            'error': 'Unauthorized: Valid JWT authentication token required.'
        }), 401

def get_current_teacher():
    try:
        identity = get_jwt_identity()
        claims = get_jwt() or {}
        role = claims.get('role')

        if identity:
            try:
                tch = Teacher.query.filter_by(user_id=int(identity)).first()
                if tch:
                    return tch
            except (ValueError, TypeError):
                pass

            profile_id = claims.get('profile_id')
            if profile_id:
                tch = Teacher.query.filter_by(teacher_id=str(profile_id)).first()
                if tch:
                    return tch

            email = claims.get('email')
            if email:
                tch = Teacher.query.filter_by(email=str(email)).first()
                if tch:
                    return tch

        # If admin is accessing teacher endpoints, allow them to act as the primary teacher
        if role == 'admin':
            tch_id = request.headers.get('X-Teacher-ID')
            if tch_id:
                tch = Teacher.query.filter_by(teacher_id=str(tch_id)).first()
                if tch:
                    return tch
            return Teacher.query.first()
    except Exception:
        pass

    return None

def get_teacher_assigned_classes(tch):
    if not tch:
        return []
    classes = set()
    for a in tch.assignments:
        if a.class_batch:
            classes.add(a.class_batch)
    for s in tch.subjects:
        if s.class_batch:
            classes.add(s.class_batch)
    return sorted(list(classes), key=lambda c: c.id)

@teacher_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    claims = get_jwt() or {}
    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher record not found'}), 404

    # Assigned subjects & classes
    classes = get_teacher_assigned_classes(tch)
    subjects = [s.to_dict() for s in tch.subjects]

    # Live active session if any
    active_session = AttendanceSession.query.filter(
        AttendanceSession.teacher_id == tch.id,
        AttendanceSession.status.in_(['OPEN', 'Active'])
    ).order_by(AttendanceSession.created_at.desc()).first()
    if active_session and active_session.is_expired():
        active_session.status = 'Expired'
        db.session.commit()
        active_session = None

    # Total students across assigned classes
    class_ids = [c.id for c in classes]
    total_students = Student.query.filter(Student.class_id.in_(class_ids)).count() if class_ids else 0

    # Recent student check-ins for teacher's sessions
    session_ids = [s.id for s in tch.sessions]
    recent_checkins = []
    if session_ids:
        records = AttendanceRecord.query.filter(AttendanceRecord.session_id.in_(session_ids)).order_by(AttendanceRecord.created_at.desc()).limit(10).all()
        recent_checkins = [r.to_dict() for r in records]

    # Today's attendance
    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    today_records = AttendanceRecord.query.filter(
        AttendanceRecord.session_id.in_(session_ids),
        AttendanceRecord.date == today_str
    ).all() if session_ids else []
    today_present = len([r for r in today_records if r.status in ['Present', 'Late']])

    return jsonify({
        'success': True,
        'teacher': tch.to_dict(),
        'assignedClasses': [c.to_dict() for c in classes],
        'assignedSubjects': subjects,
        'totalStudents': total_students,
        'todayPresent': today_present,
        'activeSession': active_session.to_dict() if active_session else None,
        'recentCheckins': recent_checkins
    }), 200

@teacher_bp.route('/classes', methods=['GET'])
def get_classes():
    claims = get_jwt() or {}
    if claims.get('role') == 'admin':
        classes = ClassBatch.query.all()
        return jsonify({'success': True, 'classes': [c.to_dict() for c in classes]}), 200

    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher record not found'}), 404

    classes = get_teacher_assigned_classes(tch)
    return jsonify({'success': True, 'classes': [c.to_dict() for c in classes]}), 200

@teacher_bp.route('/subjects', methods=['GET'])
def get_subjects():
    claims = get_jwt() or {}
    if claims.get('role') == 'admin':
        subjects = Subject.query.all()
        return jsonify({'success': True, 'subjects': [s.to_dict() for s in subjects]}), 200

    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher record not found'}), 404

    assigned_subject_ids = [a.subject_id for a in tch.assignments if a.subject_id]
    if assigned_subject_ids:
        subjects = Subject.query.filter(
            (Subject.teacher_id == tch.id) | (Subject.id.in_(assigned_subject_ids))
        ).all()
    else:
        subjects = Subject.query.filter_by(teacher_id=tch.id).all()
    return jsonify({'success': True, 'subjects': [s.to_dict() for s in subjects]}), 200

@teacher_bp.route('/students', methods=['GET'])
def get_students():
    claims = get_jwt() or {}
    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher record not found'}), 404

    class_id_str = request.args.get('class_id')
    assigned_classes = get_teacher_assigned_classes(tch)
    assigned_class_ids = [c.id for c in assigned_classes]

    if class_id_str:
        cls = ClassBatch.query.filter((ClassBatch.class_id == class_id_str) | (ClassBatch.id == class_id_str)).first()
        if not cls:
            return jsonify({'success': False, 'error': 'Class not found'}), 404

        # Strict check: teacher must be assigned to this class (unless admin)
        if claims.get('role') != 'admin' and cls.id not in assigned_class_ids:
            return jsonify({
                'success': False,
                'error': f'Forbidden: You are not assigned to class {cls.name}. Access restricted to your own classes.'
            }), 403

        students = Student.query.filter_by(class_id=cls.id).all()
    else:
        if claims.get('role') == 'admin':
            students = Student.query.all()
        else:
            students = Student.query.filter(Student.class_id.in_(assigned_class_ids)).all() if assigned_class_ids else []

    return jsonify({'success': True, 'students': [s.to_dict() for s in students]}), 200

@teacher_bp.route('/sessions', methods=['POST'])
def create_session():
    claims = get_jwt() or {}
    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher identity could not be verified'}), 404

    data = request.get_json() or {}
    class_id_str = data.get('classId') or data.get('class_id')
    subject_id_str = data.get('subjectId') or data.get('subject_id')

    try:
        duration_minutes = int(data.get('durationMinutes', 15))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Invalid duration specified'}), 400

    if duration_minutes < 1 or duration_minutes > 180:
        return jsonify({'success': False, 'error': 'Session duration must be between 1 and 180 minutes'}), 400

    cls = ClassBatch.query.filter_by(class_id=str(class_id_str)).first()
    if not cls:
        try:
            cls = ClassBatch.query.get(int(class_id_str))
        except (ValueError, TypeError):
            pass

    sub = Subject.query.filter_by(subject_id=str(subject_id_str)).first()
    if not sub:
        try:
            sub = Subject.query.get(int(subject_id_str))
        except (ValueError, TypeError):
            pass

    if not cls or not sub:
        return jsonify({'success': False, 'error': 'Class and subject must be valid.'}), 400

    # Strict check: teacher must be assigned to subject (unless admin)
    if claims.get('role') != 'admin':
        is_sub_assigned = (sub.teacher_id == tch.id) or (
            TeacherAssignment.query.filter_by(teacher_id=tch.id, subject_id=sub.id).first() is not None
        )
        if not is_sub_assigned:
            return jsonify({
                'success': False,
                'error': f'Forbidden: You are not authorized to generate attendance for unassigned subject {sub.name} ({sub.code}).'
            }), 403

        # Teacher must also be assigned to class
        assigned_class_ids = [c.id for c in get_teacher_assigned_classes(tch)]
        if cls.id not in assigned_class_ids and sub.class_id != cls.id:
            return jsonify({
                'success': False,
                'error': f'Forbidden: You are not authorized to generate attendance for unassigned class {cls.name}.'
            }), 403

    lecture_date_raw = data.get('lectureDate') or data.get('lecture_date')
    lecture_start_raw = data.get('lectureStartTime') or data.get('lecture_start_time')
    lecture_end_raw = data.get('lectureEndTime') or data.get('lecture_end_time')

    is_valid, err_msg, formatted_date, formatted_start, formatted_end = validate_and_format_lecture_schedule(
        lecture_date_raw, lecture_start_raw, lecture_end_raw
    )
    if not is_valid:
        return jsonify({'success': False, 'error': err_msg}), 400

    # Close any existing active sessions for this instructor
    existing_actives = AttendanceSession.query.filter(
        AttendanceSession.teacher_id == tch.id,
        AttendanceSession.status.in_(['OPEN', 'Active'])
    ).all()
    for s in existing_actives:
        s.status = 'Closed'

    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=duration_minutes)
    next_id = AttendanceSession.query.count() + 1
    session_id = f"SES-{now.strftime('%Y%m%d%H%M%S')}-{next_id:03d}"
    token = generate_session_token(sub.code)

    session = AttendanceSession(
        session_id=session_id,
        token=token,
        class_id=cls.id,
        subject_id=sub.id,
        teacher_id=tch.id,
        duration_minutes=duration_minutes,
        lecture_date=formatted_date,
        lecture_start_time=formatted_start,
        lecture_end_time=formatted_end,
        expires_at=expires_at,
        status='OPEN',
        created_at=now
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Attendance session created for {sub.name}',
        'session': session.to_dict()
    }), 201

@teacher_bp.route('/sessions', methods=['GET'])
def get_sessions():
    claims = get_jwt() or {}
    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher record not found'}), 404

    if claims.get('role') == 'admin':
        sessions = AttendanceSession.query.order_by(AttendanceSession.created_at.desc()).all()
    else:
        sessions = AttendanceSession.query.filter_by(teacher_id=tch.id).order_by(AttendanceSession.created_at.desc()).all()

    # Expire any sessions that have passed expires_at
    changed = False
    for s in sessions:
        if s.status in ['OPEN', 'Active'] and s.is_expired():
            s.status = 'Expired'
            changed = True
    if changed:
        db.session.commit()

    return jsonify({'success': True, 'sessions': [s.to_dict() for s in sessions]}), 200

@teacher_bp.route('/sessions/<id>/attendance', methods=['GET'])
def get_session_attendance(id):
    claims = get_jwt() or {}
    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher record not found'}), 404

    session = AttendanceSession.query.filter((AttendanceSession.session_id == id) | (AttendanceSession.id == id)).first()
    if not session:
        return jsonify({'success': False, 'error': 'Session not found'}), 404

    # Strict check: teacher can only view their own session attendance (unless admin)
    if claims.get('role') != 'admin' and session.teacher_id != tch.id:
        return jsonify({
            'success': False,
            'error': 'Forbidden: You cannot view attendance records for another instructor\'s class session.'
        }), 403

    # Check if expired
    if session.status in ['OPEN', 'Active'] and session.is_expired():
        session.status = 'Expired'
        db.session.commit()

    # Enrolled students count for the class
    enrolled_students = Student.query.filter_by(class_id=session.class_id).all()
    total_enrolled = len(enrolled_students) if enrolled_students else (session.class_batch.student_count if session.class_batch else 0)

    # Real attendance records from database for this session
    records = AttendanceRecord.query.filter_by(session_id=session.id).order_by(AttendanceRecord.created_at.desc()).all()
    checked_in_list = []
    for r in records:
        checked_in_list.append({
            'id': r.id,
            'recordId': f'REC-{r.id:04d}',
            'rollNo': r.student.roll_no if r.student else 'Unknown',
            'studentName': r.student.name if r.student else 'Unknown',
            'studentId': r.student.student_id if r.student else None,
            'subject': session.subject.name if session.subject else '',
            'subjectCode': session.subject.code if session.subject else '',
            'scanTime': r.time,
            'date': r.date,
            'status': r.status,
            'method': r.method,
            'blockchainStatus': r.blockchain_status
        })

    checked_in_count = len([r for r in records if r.status in ['Present', 'Late']])
    not_checked_in_count = max(0, total_enrolled - checked_in_count)

    return jsonify({
        'success': True,
        'session': session.to_dict(),
        'totalEnrolled': total_enrolled,
        'checkedInCount': checked_in_count,
        'notCheckedInCount': not_checked_in_count,
        'students': checked_in_list
    }), 200

@teacher_bp.route('/sessions/<id>/close', methods=['POST'])
def close_session(id):
    claims = get_jwt() or {}
    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher record not found'}), 404

    session = AttendanceSession.query.filter((AttendanceSession.session_id == id) | (AttendanceSession.id == id)).first()
    if not session:
        return jsonify({'success': False, 'error': 'Session not found'}), 404

    # Strict check: teacher can only close their own session (unless admin)
    if claims.get('role') != 'admin' and session.teacher_id != tch.id:
        return jsonify({
            'success': False,
            'error': 'Forbidden: You cannot close an attendance session created by another instructor.'
        }), 403

    session.status = 'Closed'
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Attendance session successfully closed.',
        'session': session.to_dict()
    }), 200

@teacher_bp.route('/attendance', methods=['GET'])
def get_attendance():
    claims = get_jwt() or {}
    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher record not found'}), 404

    if claims.get('role') == 'admin':
        records = AttendanceRecord.query.order_by(AttendanceRecord.created_at.desc()).all()
    else:
        session_ids = [s.id for s in tch.sessions]
        records = AttendanceRecord.query.filter(AttendanceRecord.session_id.in_(session_ids)).order_by(AttendanceRecord.created_at.desc()).all() if session_ids else []

    return jsonify({'success': True, 'records': [r.to_dict() for r in records]}), 200

@teacher_bp.route('/attendance/correct', methods=['POST'])
def correct_attendance():
    claims = get_jwt() or {}
    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher record not found'}), 404

    data = request.get_json() or {}
    record_id = data.get('attendanceId') or data.get('record_id')
    new_status = data.get('status')
    reason = data.get('reason')

    if not record_id or not new_status or not reason:
        return jsonify({'success': False, 'error': 'Attendance ID, new status, and reason are required for corrections.'}), 400

    if new_status not in ['Present', 'Absent', 'Late']:
        return jsonify({'success': False, 'error': 'Status must be Present, Absent, or Late.'}), 400

    record = None
    if isinstance(record_id, str) and record_id.startswith('REC-'):
        try:
            db_id = int(record_id.replace('REC-', ''))
            record = AttendanceRecord.query.get(db_id)
        except ValueError:
            pass
    if not record:
        try:
            record = AttendanceRecord.query.get(int(record_id))
        except (ValueError, TypeError):
            pass

    if not record:
        return jsonify({'success': False, 'error': 'Attendance record not found.'}), 404

    # Authorization: instructor must own the session (unless admin)
    if claims.get('role') != 'admin' and record.session.teacher_id != tch.id:
        return jsonify({
            'success': False,
            'error': 'Forbidden: You cannot correct attendance for another instructor\'s class session.'
        }), 403

    original_status = record.status
    record.status = new_status

    # Record audit log
    correction = AttendanceCorrection(
        attendance_id=record.id,
        student_id=record.student_id,
        teacher_id=tch.id,
        class_id=record.session.class_id if record.session else None,
        subject_id=record.session.subject_id if record.session else None,
        original_status=original_status,
        updated_status=new_status,
        reason=reason.strip()
    )
    db.session.add(correction)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Attendance successfully updated from {original_status} to {new_status}.',
        'record': record.to_dict(),
        'correction': correction.to_dict()
    }), 200

@teacher_bp.route('/profile', methods=['GET', 'PUT'])
def teacher_profile():
    tch = get_current_teacher()
    if not tch:
        return jsonify({'success': False, 'error': 'Teacher record not found'}), 404

    if request.method == 'PUT':
        data = request.get_json() or {}
        if 'name' in data:
            tch.name = data['name']
        if 'department' in data:
            tch.department = data['department']
        db.session.commit()

    return jsonify({'success': True, 'teacher': tch.to_dict()}), 200
