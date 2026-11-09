from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import UniqueConstraint, Index

db = SQLAlchemy()

class BaseModel(db.Model):
    __abstract__ = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class User(BaseModel):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student') # admin, teacher, student
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    student_profile = db.relationship('Student', backref='user_account', uselist=False, cascade='all, delete-orphan')
    teacher_profile = db.relationship('Teacher', backref='user_account', uselist=False, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Student(BaseModel):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    student_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. STU-001
    name = db.Column(db.String(100), nullable=False)
    roll_no = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. CS2024-001
    email = db.Column(db.String(120), unique=True, nullable=False)
    department = db.Column(db.String(100), nullable=False, default='Computer Science')
    semester = db.Column(db.String(20), nullable=False, default='4th')
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='SET NULL'), nullable=True)
    avatar = db.Column(db.String(10), nullable=True)
    student_hash = db.Column(db.String(66), nullable=False, index=True) # bytes32 hex for on-chain identity
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    enrollments = db.relationship('StudentEnrollment', backref='student', lazy=True, cascade='all, delete-orphan')
    attendance_records = db.relationship('AttendanceRecord', backref='student', lazy=True)

    def to_dict(self):
        return {
            'id': self.student_id,
            'db_id': self.id,
            'name': self.name,
            'rollNo': self.roll_no,
            'email': self.email,
            'department': self.department,
            'semester': self.semester,
            'classId': self.class_batch.class_id if self.class_batch else (f'CLS-{self.class_id}' if self.class_id else None),
            'className': self.class_batch.name if self.class_batch else 'Unassigned',
            'avatar': self.avatar or self.name[:2].upper(),
            'studentHash': self.student_hash
        }


class Teacher(BaseModel):
    __tablename__ = 'teachers'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    teacher_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. TCH-001
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    department = db.Column(db.String(100), nullable=False, default='Computer Science')
    avatar = db.Column(db.String(10), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    assignments = db.relationship('TeacherAssignment', backref='teacher', lazy=True, cascade='all, delete-orphan')
    subjects = db.relationship('Subject', backref='instructor', lazy=True)
    sessions = db.relationship('AttendanceSession', backref='teacher', lazy=True)

    def to_dict(self):
        return {
            'id': self.teacher_id,
            'db_id': self.id,
            'name': self.name,
            'email': self.email,
            'department': self.department,
            'avatar': self.avatar or self.name[:2].upper(),
            'subjects': [s.name for s in self.subjects],
            'assignedClasses': list({a.class_batch.name for a in self.assignments if a.class_batch})
        }


class ClassBatch(BaseModel):
    __tablename__ = 'classes'

    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. CLS-CS4A
    name = db.Column(db.String(100), nullable=False) # e.g. CS - 4th Sem (Sec A)
    department = db.Column(db.String(100), nullable=False, default='Computer Science')
    semester = db.Column(db.String(20), nullable=False, default='4th')
    student_count = db.Column(db.Integer, default=40)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    students = db.relationship('Student', backref='class_batch', lazy=True)
    subjects = db.relationship('Subject', backref='class_batch', lazy=True)
    enrollments = db.relationship('StudentEnrollment', backref='class_batch', lazy=True, cascade='all, delete-orphan')
    sessions = db.relationship('AttendanceSession', backref='class_batch', lazy=True)

    def to_dict(self):
        return {
            'id': self.class_id,
            'db_id': self.id,
            'name': self.name,
            'department': self.department,
            'semester': self.semester,
            'studentCount': len(self.students) if self.students else self.student_count
        }


class Subject(BaseModel):
    __tablename__ = 'subjects'

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. SUB-BC401
    name = db.Column(db.String(120), nullable=False) # e.g. Blockchain Technology
    code = db.Column(db.String(20), nullable=False) # e.g. CS401
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    sessions = db.relationship('AttendanceSession', backref='subject', lazy=True)

    def to_dict(self):
        return {
            'id': self.subject_id,
            'db_id': self.id,
            'name': self.name,
            'code': self.code,
            'classId': self.class_batch.class_id if self.class_batch else None,
            'className': self.class_batch.name if self.class_batch else '',
            'teacherId': self.instructor.teacher_id if self.instructor else None,
            'teacherName': self.instructor.name if self.instructor else 'Unassigned'
        }


class StudentEnrollment(BaseModel):
    __tablename__ = 'student_enrollments'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('student_id', 'class_id', name='uq_student_class_enrollment'),
    )


class TeacherAssignment(BaseModel):
    __tablename__ = 'teacher_assignments'

    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    class_batch = db.relationship('ClassBatch', backref='teacher_assignments', lazy=True)
    subject = db.relationship('Subject', backref='teacher_assignments', lazy=True)

    __table_args__ = (
        UniqueConstraint('teacher_id', 'class_id', 'subject_id', name='uq_teacher_class_subject'),
    )


class AttendanceSession(BaseModel):
    __tablename__ = 'attendance_sessions'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. SES-2026-001
    token = db.Column(db.String(100), unique=True, nullable=False, index=True) # Secure QR Token
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False)
    duration_minutes = db.Column(db.Integer, default=15)
    lecture_date = db.Column(db.String(50), nullable=True) # e.g. '02 November 2026'
    lecture_start_time = db.Column(db.String(20), nullable=True) # e.g. '10:00 AM'
    lecture_end_time = db.Column(db.String(20), nullable=True) # e.g. '11:00 AM'
    expires_at = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='OPEN') # OPEN, Active, Closed, Expired
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    records = db.relationship('AttendanceRecord', backref='session', lazy=True, cascade='all, delete-orphan')

    def is_expired(self):
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at

    def to_dict(self):
        attendee_count = len([r for r in self.records if r.status in ['Present', 'Late']])
        display_status = self.status
        if self.status in ['OPEN', 'Active'] and self.is_expired():
            display_status = 'Expired'
        return {
            'id': self.session_id,
            'db_id': self.id,
            'token': self.token,
            'classId': self.class_batch.class_id if self.class_batch else None,
            'className': self.class_batch.name if self.class_batch else '',
            'subjectId': self.subject.subject_id if self.subject else None,
            'subjectName': self.subject.name if self.subject else '',
            'teacherId': self.teacher.teacher_id if self.teacher else None,
            'teacherName': self.teacher.name if self.teacher else '',
            'createdAt': (self.created_at.isoformat() + 'Z') if self.created_at else None,
            'expiresAt': (self.expires_at.isoformat() + 'Z') if self.expires_at else None,
            'status': display_status,
            'attendeeCount': attendee_count,
            'durationMinutes': self.duration_minutes,
            'lectureDate': self.lecture_date,
            'lectureStartTime': self.lecture_start_time,
            'lectureEndTime': self.lecture_end_time
        }


class AttendanceRecord(BaseModel):
    __tablename__ = 'attendance_records'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('attendance_sessions.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.String(20), nullable=False) # YYYY-MM-DD
    time = db.Column(db.String(20), nullable=False) # HH:MM:SS
    status = db.Column(db.String(20), default='Present') # Present, Late, Absent
    method = db.Column(db.String(50), default='QR Scan') # QR Camera, Manual, etc.
    student_hash = db.Column(db.String(66), nullable=False, index=True) # keccak256 hash
    blockchain_status = db.Column(db.String(20), default='PENDING', index=True) # PENDING, CONFIRMED, FAILED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    blockchain_tx = db.relationship('BlockchainTransaction', backref='attendance_record', uselist=False, cascade='all, delete-orphan')
    corrections = db.relationship('AttendanceCorrection', backref='attendance_record', lazy=True, cascade='all, delete-orphan')

    __table_args__ = (
        UniqueConstraint('session_id', 'student_id', name='uq_session_student_attendance'),
        Index('idx_student_date', 'student_id', 'date'),
    )

    def to_dict(self):
        tx = self.blockchain_tx
        lecture_schedule = None
        if self.session and self.session.lecture_date and self.session.lecture_start_time and self.session.lecture_end_time:
            lecture_schedule = f"{self.session.lecture_date} ({self.session.lecture_start_time} - {self.session.lecture_end_time})"

        return {
            'id': f'REC-{self.id:04d}',
            'db_id': self.id,
            'sessionId': self.session.session_id if self.session else None,
            'studentId': self.student.student_id if self.student else None,
            'studentName': self.student.name if self.student else 'Unknown',
            'rollNo': self.student.roll_no if self.student else 'Unknown',
            'className': self.session.class_batch.name if (self.session and self.session.class_batch) else (self.student.class_batch.name if self.student.class_batch else ''),
            'subjectName': self.session.subject.name if (self.session and self.session.subject) else '',
            'date': self.date,
            'time': self.time,
            'status': self.status,
            'method': self.method,
            'studentHash': self.student_hash,
            'blockchainStatus': self.blockchain_status,
            'txHash': tx.tx_hash if tx else None,
            'blockNumber': tx.block_number if tx else None,
            'verifiedOnChain': (self.blockchain_status == 'CONFIRMED' and tx is not None),
            'lectureDate': self.session.lecture_date if self.session else None,
            'lectureStartTime': self.session.lecture_start_time if self.session else None,
            'lectureEndTime': self.session.lecture_end_time if self.session else None,
            'lectureSchedule': lecture_schedule,
            'corrections': [c.to_dict() for c in self.corrections] if self.corrections else []
        }


class BlockchainTransaction(BaseModel):
    __tablename__ = 'blockchain_transactions'

    id = db.Column(db.Integer, primary_key=True)
    attendance_id = db.Column(db.Integer, db.ForeignKey('attendance_records.id', ondelete='CASCADE'), nullable=False, unique=True)
    session_id = db.Column(db.String(50), nullable=False)
    student_hash = db.Column(db.String(66), nullable=False, index=True)
    tx_hash = db.Column(db.String(66), nullable=True, unique=True, index=True)
    block_number = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(20), default='PENDING', index=True) # PENDING, CONFIRMED, FAILED
    gas_used = db.Column(db.Integer, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'attendanceId': self.attendance_id,
            'sessionId': self.session_id,
            'studentHash': self.student_hash,
            'txHash': self.tx_hash,
            'blockNumber': self.block_number,
            'status': self.status,
            'gasUsed': self.gas_used,
            'errorMessage': self.error_message,
            'submittedAt': (self.submitted_at.isoformat() + 'Z') if self.submitted_at else None,
            'confirmedAt': (self.confirmed_at.isoformat() + 'Z') if self.confirmed_at else None
        }


class AttendanceCorrection(BaseModel):
    __tablename__ = 'attendance_corrections'

    id = db.Column(db.Integer, primary_key=True)
    attendance_id = db.Column(db.Integer, db.ForeignKey('attendance_records.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=True)
    original_status = db.Column(db.String(20), nullable=False)
    updated_status = db.Column(db.String(20), nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship('Teacher')
    student = db.relationship('Student')

    def to_dict(self):
        return {
            'id': self.id,
            'attendanceId': self.attendance_id,
            'studentId': self.student.student_id if self.student else None,
            'studentName': self.student.name if self.student else '',
            'teacherId': self.teacher.teacher_id if self.teacher else None,
            'teacherName': self.teacher.name if self.teacher else '',
            'originalStatus': self.original_status,
            'updatedStatus': self.updated_status,
            'reason': self.reason,
            'timestamp': (self.created_at.isoformat() + 'Z') if self.created_at else None
        }

