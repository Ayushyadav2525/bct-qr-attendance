from flask import Blueprint, request, jsonify
from datetime import datetime
from app.models import (
    db, User, Student, Teacher, ClassBatch, Subject,
    AttendanceSession, AttendanceRecord, BlockchainTransaction
)
from app.utils.helpers import compute_student_hash, role_required

from flask_jwt_extended import verify_jwt_in_request, get_jwt

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.before_request
def enforce_admin_role():
    if request.method == 'OPTIONS':
        return None
    try:
        verify_jwt_in_request()
        claims = get_jwt() or {}
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'error': 'Forbidden: Administrator credentials required.'}), 403
    except Exception as e:
        return jsonify({'success': False, 'error': 'Unauthorized: Valid JWT authentication token required.'}), 401

@admin_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    total_students = Student.query.count()
    total_teachers = Teacher.query.count()
    total_classes = ClassBatch.query.count()
    total_subjects = Subject.query.count()
    total_sessions = AttendanceSession.query.count()

    today_str = datetime.utcnow().strftime('%Y-%m-%d')
    today_records = AttendanceRecord.query.filter_by(date=today_str).all()
    today_present = len([r for r in today_records if r.status in ['Present', 'Late']])
    today_absent = len([r for r in today_records if r.status == 'Absent'])

    all_records = AttendanceRecord.query.all()
    total_recorded = len(all_records)
    total_present = len([r for r in all_records if r.status in ['Present', 'Late']])
    overall_percentage = round((total_present / total_recorded * 100)) if total_recorded > 0 else 85

    # Recent sessions
    recent_sessions = [s.to_dict() for s in AttendanceSession.query.order_by(AttendanceSession.created_at.desc()).limit(5).all()]

    # At-risk students (< 75% attendance)
    students = Student.query.all()
    at_risk = []
    for s in students:
        s_records = [r for r in all_records if r.student_id == s.id]
        if s_records:
            pres = len([r for r in s_records if r.status in ['Present', 'Late']])
            pct = round((pres / len(s_records)) * 100)
            if pct < 75:
                at_risk.append({
                    'id': s.student_id,
                    'name': s.name,
                    'rollNo': s.roll_no,
                    'className': s.class_batch.name if s.class_batch else 'CS - 4th Sem (Sec A)',
                    'rate': pct,
                    'status': 'Critical' if pct < 60 else 'Warning'
                })

    return jsonify({
        'success': True,
        'metrics': {
            'totalStudents': total_students,
            'totalTeachers': total_teachers,
            'totalClasses': total_classes,
            'totalSubjects': total_subjects,
            'totalSessions': total_sessions,
            'todayPresent': today_present,
            'todayAbsent': today_absent,
            'overallPercentage': overall_percentage,
            'totalRecords': total_recorded
        },
        'recentSessions': recent_sessions,
        'atRiskStudents': at_risk
    }), 200

# ----------------- Students CRUD -----------------
@admin_bp.route('/students', methods=['GET'])
def get_students():
    students = Student.query.order_by(Student.id.asc()).all()
    return jsonify({'success': True, 'students': [s.to_dict() for s in students]}), 200

@admin_bp.route('/students', methods=['POST'])
def create_student():
    data = request.get_json() or {}
    name = data.get('name')
    roll_no = data.get('rollNo') or data.get('roll_no')
    email = data.get('email')
    class_id_str = data.get('classId') or data.get('class_id')

    if not name or not roll_no or not email:
        return jsonify({'success': False, 'error': 'Name, roll number, and email are required.'}), 400

    if Student.query.filter((Student.roll_no == roll_no) | (Student.email == email)).first():
        return jsonify({'success': False, 'error': 'A student with this roll number or email already exists.'}), 400

    # Resolve class
    cls = None
    if class_id_str:
        cls = ClassBatch.query.filter_by(class_id=str(class_id_str)).first()
        if not cls:
            try:
                cls = ClassBatch.query.get(int(class_id_str))
            except (ValueError, TypeError):
                pass

    # Generate student_id
    next_id = Student.query.count() + 1
    student_id = f"STU-{next_id:03d}"
    student_hash = compute_student_hash(student_id, roll_no)

    # Create user account
    user = User(email=email, role='student')
    user.set_password('password123')
    db.session.add(user)
    db.session.flush()

    student = Student(
        user_id=user.id,
        student_id=student_id,
        name=name,
        roll_no=roll_no,
        email=email,
        department=data.get('department', 'Computer Science'),
        semester=data.get('semester', '4th'),
        class_id=cls.id if cls else None,
        avatar=name[:2].upper(),
        student_hash=student_hash
    )
    db.session.add(student)
    db.session.flush()

    # Automatically create enrollment record if class assigned
    if cls:
        from app.models import StudentEnrollment
        enr = StudentEnrollment(student_id=student.id, class_id=cls.id)
        db.session.add(enr)

    db.session.commit()

    return jsonify({'success': True, 'student': student.to_dict()}), 201

@admin_bp.route('/students/<id>', methods=['PUT'])
def update_student(id):
    student = Student.query.filter((Student.student_id == id) | (Student.id == id)).first()
    if not student:
        return jsonify({'success': False, 'error': 'Student not found.'}), 404

    data = request.get_json() or {}
    if 'name' in data: student.name = data['name']
    if 'department' in data: student.department = data['department']
    if 'semester' in data: student.semester = data['semester']
    if 'classId' in data:
        cls = ClassBatch.query.filter((ClassBatch.class_id == data['classId']) | (ClassBatch.id == data['classId'])).first()
        if cls: student.class_id = cls.id

    db.session.commit()
    return jsonify({'success': True, 'student': student.to_dict()}), 200

@admin_bp.route('/students/<id>', methods=['DELETE'])
def delete_student(id):
    student = Student.query.filter((Student.student_id == id) | (Student.id == id)).first()
    if not student:
        return jsonify({'success': False, 'error': 'Student not found.'}), 404

    if student.user_account:
        db.session.delete(student.user_account)
    db.session.delete(student)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Student deleted successfully.'}), 200

# ----------------- Teachers CRUD -----------------
@admin_bp.route('/teachers', methods=['GET'])
def get_teachers():
    teachers = Teacher.query.order_by(Teacher.id.asc()).all()
    return jsonify({'success': True, 'teachers': [t.to_dict() for t in teachers]}), 200

@admin_bp.route('/teachers', methods=['POST'])
def create_teacher():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')

    if not name or not email:
        return jsonify({'success': False, 'error': 'Name and email are required.'}), 400

    if Teacher.query.filter_by(email=email).first():
        return jsonify({'success': False, 'error': 'Faculty with this email already exists.'}), 400

    next_id = Teacher.query.count() + 1
    teacher_id = f"TCH-{next_id:03d}"

    user = User(email=email, role='teacher')
    user.set_password('password123')
    db.session.add(user)
    db.session.flush()

    teacher = Teacher(
        user_id=user.id,
        teacher_id=teacher_id,
        name=name,
        email=email,
        department=data.get('department', 'Computer Science'),
        avatar=name[:2].upper()
    )
    db.session.add(teacher)
    db.session.commit()

    return jsonify({'success': True, 'teacher': teacher.to_dict()}), 201

@admin_bp.route('/teachers/<id>', methods=['PUT'])
def update_teacher(id):
    teacher = Teacher.query.filter((Teacher.teacher_id == id) | (Teacher.id == id)).first()
    if not teacher:
        return jsonify({'success': False, 'error': 'Faculty not found.'}), 404

    data = request.get_json() or {}
    if 'name' in data: teacher.name = data['name']
    if 'department' in data: teacher.department = data['department']

    db.session.commit()
    return jsonify({'success': True, 'teacher': teacher.to_dict()}), 200

@admin_bp.route('/teachers/<id>', methods=['DELETE'])
def delete_teacher(id):
    teacher = Teacher.query.filter((Teacher.teacher_id == id) | (Teacher.id == id)).first()
    if not teacher:
        return jsonify({'success': False, 'error': 'Faculty not found.'}), 404

    if teacher.user_account:
        db.session.delete(teacher.user_account)
    db.session.delete(teacher)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Faculty deleted.'}), 200

# ----------------- Classes CRUD -----------------
@admin_bp.route('/classes', methods=['GET'])
def get_classes():
    classes = ClassBatch.query.all()
    return jsonify({'success': True, 'classes': [c.to_dict() for c in classes]}), 200

@admin_bp.route('/classes', methods=['POST'])
def create_class():
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'success': False, 'error': 'Class name is required.'}), 400

    next_id = ClassBatch.query.count() + 1
    class_id = f"CLS-B{next_id}"

    cls = ClassBatch(
        class_id=class_id,
        name=name,
        department=data.get('department', 'Computer Science'),
        semester=data.get('semester', '4th'),
        student_count=int(data.get('studentCount', 40))
    )
    db.session.add(cls)
    db.session.commit()
    return jsonify({'success': True, 'class': cls.to_dict()}), 201

@admin_bp.route('/classes/<id>', methods=['PUT'])
def update_class(id):
    cls = ClassBatch.query.filter((ClassBatch.class_id == id) | (ClassBatch.id == id)).first()
    if not cls:
        return jsonify({'success': False, 'error': 'Class not found.'}), 404

    data = request.get_json() or {}
    if 'name' in data: cls.name = data['name']
    if 'department' in data: cls.department = data['department']
    if 'semester' in data: cls.semester = data['semester']
    if 'studentCount' in data: cls.student_count = int(data['studentCount'])

    db.session.commit()
    return jsonify({'success': True, 'class': cls.to_dict()}), 200

@admin_bp.route('/classes/<id>', methods=['DELETE'])
def delete_class(id):
    cls = ClassBatch.query.filter((ClassBatch.class_id == id) | (ClassBatch.id == id)).first()
    if not cls:
        return jsonify({'success': False, 'error': 'Class not found.'}), 404

    db.session.delete(cls)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Class deleted.'}), 200

# ----------------- Subjects CRUD -----------------
@admin_bp.route('/subjects', methods=['GET'])
def get_subjects():
    subjects = Subject.query.all()
    return jsonify({'success': True, 'subjects': [s.to_dict() for s in subjects]}), 200

@admin_bp.route('/subjects', methods=['POST'])
def create_subject():
    data = request.get_json() or {}
    name = data.get('name')
    code = data.get('code')
    class_id_str = data.get('classId') or data.get('class_id')
    teacher_id_str = data.get('teacherId') or data.get('teacher_id')

    if not name or not code or not class_id_str:
        return jsonify({'success': False, 'error': 'Name, code, and class are required.'}), 400

    cls = ClassBatch.query.filter((ClassBatch.class_id == class_id_str) | (ClassBatch.id == class_id_str)).first()
    if not cls:
        return jsonify({'success': False, 'error': 'Target class not found.'}), 404

    tch = None
    if teacher_id_str:
        tch = Teacher.query.filter((Teacher.teacher_id == teacher_id_str) | (Teacher.id == teacher_id_str)).first()

    next_id = Subject.query.count() + 1
    subject_id = f"SUB-{code.upper()}"

    sub = Subject(
        subject_id=subject_id,
        name=name,
        code=code.upper(),
        class_id=cls.id,
        teacher_id=tch.id if tch else None
    )
    db.session.add(sub)
    db.session.commit()
    return jsonify({'success': True, 'subject': sub.to_dict()}), 201

@admin_bp.route('/subjects/<id>', methods=['PUT'])
def update_subject(id):
    sub = Subject.query.filter((Subject.subject_id == id) | (Subject.id == id)).first()
    if not sub:
        return jsonify({'success': False, 'error': 'Subject not found.'}), 404

    data = request.get_json() or {}
    if 'name' in data: sub.name = data['name']
    if 'code' in data: sub.code = data['code'].upper()
    if 'teacherId' in data:
        tch = Teacher.query.filter((Teacher.teacher_id == data['teacherId']) | (Teacher.id == data['teacherId'])).first()
        if tch: sub.teacher_id = tch.id

    db.session.commit()
    return jsonify({'success': True, 'subject': sub.to_dict()}), 200

@admin_bp.route('/subjects/<id>', methods=['DELETE'])
def delete_subject(id):
    sub = Subject.query.filter((Subject.subject_id == id) | (Subject.id == id)).first()
    if not sub:
        return jsonify({'success': False, 'error': 'Subject not found.'}), 404

    db.session.delete(sub)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Subject deleted.'}), 200

# ----------------- Attendance Records -----------------
@admin_bp.route('/attendance', methods=['GET'])
def get_attendance():
    query = AttendanceRecord.query.order_by(AttendanceRecord.created_at.desc())

    student_id = request.args.get('student_id')
    class_id = request.args.get('class_id')
    subject_id = request.args.get('subject_id')
    date = request.args.get('date')

    if student_id:
        stu = Student.query.filter((Student.student_id == student_id) | (Student.id == student_id)).first()
        if stu: query = query.filter_by(student_id=stu.id)

    if date:
        query = query.filter_by(date=date)

    records = query.all()
    # Optional subject / class filtering in Python
    filtered = []
    for r in records:
        d = r.to_dict()
        if class_id and r.session and r.session.class_batch and r.session.class_batch.class_id != class_id:
            continue
        if subject_id and r.session and r.session.subject and r.session.subject.subject_id != subject_id:
            continue
        filtered.append(d)

    return jsonify({'success': True, 'records': filtered}), 200
