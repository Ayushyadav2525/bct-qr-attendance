import sys
import os
from datetime import datetime, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.models import (
    db, User, Student, Teacher, ClassBatch, Subject,
    StudentEnrollment, TeacherAssignment, AttendanceSession,
    AttendanceRecord, BlockchainTransaction
)
from app.utils.helpers import compute_student_hash

app = create_app()

def seed():
    with app.app_context():
        print("Clearing existing database tables...")
        db.drop_all()
        db.create_all()
        print("Tables initialized successfully.")

        # 1. Create Core Users
        # Admin
        admin_user = User(email='admin@demo.edu', role='admin')
        admin_user.set_password('password123')
        db.session.add(admin_user)

        # Teacher
        teacher_user = User(email='teacher@demo.edu', role='teacher')
        teacher_user.set_password('password123')
        db.session.add(teacher_user)

        # Student 1
        student_user1 = User(email='student@demo.edu', role='student')
        student_user1.set_password('password123')
        db.session.add(student_user1)

        db.session.flush()

        # 2. Create Classes
        cls1 = ClassBatch(class_id='CLS-CS4A', name='CS - 4th Sem (Sec A)', department='Computer Science', semester='4th', student_count=42)
        cls2 = ClassBatch(class_id='CLS-CS4B', name='CS - 4th Sem (Sec B)', department='Computer Science', semester='4th', student_count=38)
        cls3 = ClassBatch(class_id='CLS-IT6A', name='IT - 6th Sem', department='Information Tech', semester='6th', student_count=45)
        db.session.add_all([cls1, cls2, cls3])
        db.session.flush()

        # 3. Create Teachers
        t1 = Teacher(
            user_id=teacher_user.id,
            teacher_id='TCH-001',
            name='Dr. Robert Vance',
            email='teacher@demo.edu',
            department='Computer Science',
            avatar='RV'
        )
        t2 = Teacher(
            teacher_id='TCH-002',
            name='Prof. Alistair Finch',
            email='finch@demo.edu',
            department='Computer Science',
            avatar='AF'
        )
        t3 = Teacher(
            teacher_id='TCH-003',
            name='Dr. Elena Rostova',
            email='rostova@demo.edu',
            department='Information Tech',
            avatar='ER'
        )
        db.session.add_all([t1, t2, t3])
        db.session.flush()

        # 4. Create Subjects
        s1 = Subject(subject_id='SUB-BC401', name='Blockchain Technology', code='CS401', class_id=cls1.id, teacher_id=t1.id)
        s2 = Subject(subject_id='SUB-CN402', name='Computer Networks', code='CS402', class_id=cls1.id, teacher_id=t1.id)
        s3 = Subject(subject_id='SUB-DB403', name='Database Management Systems', code='CS403', class_id=cls1.id, teacher_id=t2.id)
        s4 = Subject(subject_id='SUB-OS404', name='Operating Systems', code='CS404', class_id=cls2.id, teacher_id=t3.id)
        s5 = Subject(subject_id='SUB-AI501', name='Artificial Intelligence', code='CS501', class_id=cls2.id, teacher_id=t1.id)
        db.session.add_all([s1, s2, s3, s4, s5])
        db.session.flush()

        # 5. Teacher Assignments
        a1 = TeacherAssignment(teacher_id=t1.id, class_id=cls1.id, subject_id=s1.id)
        a2 = TeacherAssignment(teacher_id=t1.id, class_id=cls1.id, subject_id=s2.id)
        a3 = TeacherAssignment(teacher_id=t2.id, class_id=cls1.id, subject_id=s3.id)
        a4 = TeacherAssignment(teacher_id=t3.id, class_id=cls2.id, subject_id=s4.id)
        a5 = TeacherAssignment(teacher_id=t1.id, class_id=cls2.id, subject_id=s5.id)
        db.session.add_all([a1, a2, a3, a4, a5])

        # 6. Create Students
        stu_data = [
            ('STU-001', 'Alex Johnson', 'CS2024-001', 'student@demo.edu', cls1.id, student_user1.id, 'AJ'),
            ('STU-002', 'Marcus Chen', 'CS2024-002', 'marcus.c@demo.edu', cls1.id, None, 'MC'),
            ('STU-003', 'Sarah Jenkins', 'CS2024-003', 'sarah.j@demo.edu', cls1.id, None, 'SJ'),
            ('STU-004', 'Devin Brooks', 'CS2024-004', 'devin.b@demo.edu', cls1.id, None, 'DB'),
            ('STU-005', 'Maya Lin', 'CS2024-005', 'maya.l@demo.edu', cls2.id, None, 'ML'),
        ]

        students = []
        for s_id, s_name, s_roll, s_email, c_id, u_id, av in stu_data:
            s_hash = compute_student_hash(s_id, s_roll)
            if not u_id:
                u = User(email=s_email, role='student')
                u.set_password('password123')
                db.session.add(u)
                db.session.flush()
                u_id = u.id

            student = Student(
                user_id=u_id,
                student_id=s_id,
                name=s_name,
                roll_no=s_roll,
                email=s_email,
                department='Computer Science',
                semester='4th',
                class_id=c_id,
                avatar=av,
                student_hash=s_hash
            )
            db.session.add(student)
            students.append(student)

        db.session.flush()

        # Enrollments
        for s in students:
            enr = StudentEnrollment(student_id=s.id, class_id=s.class_id)
            db.session.add(enr)

        # 7. Create Historical Sample Attendance Session (Closed)
        now = datetime.utcnow()
        session1 = AttendanceSession(
            session_id='SES-2026-HISTORICAL',
            token='QR-SUB-BC401-HISTORICAL',
            class_id=cls1.id,
            subject_id=s1.id,
            teacher_id=t1.id,
            duration_minutes=60,
            lecture_date='02 November 2026',
            lecture_start_time='10:00 AM',
            lecture_end_time='11:00 AM',
            expires_at=now - timedelta(minutes=10),
            status='Closed',
            created_at=now - timedelta(minutes=70)
        )
        db.session.add(session1)
        db.session.flush()

        # 8. Seed Sample Attendance Records
        rec1 = AttendanceRecord(
            session_id=session1.id,
            student_id=students[0].id,
            date=now.strftime('%Y-%m-%d'),
            time='10:15 AM',
            status='Present',
            method='QR Camera',
            student_hash=students[0].student_hash,
            blockchain_status='PENDING'
        )
        rec2 = AttendanceRecord(
            session_id=session1.id,
            student_id=students[1].id,
            date=now.strftime('%Y-%m-%d'),
            time='10:16 AM',
            status='Present',
            method='QR Camera',
            student_hash=students[1].student_hash,
            blockchain_status='PENDING'
        )
        rec3 = AttendanceRecord(
            session_id=session1.id,
            student_id=students[2].id,
            date=now.strftime('%Y-%m-%d'),
            time='10:18 AM',
            status='Late',
            method='Manual Demo Entry',
            student_hash=students[2].student_hash,
            blockchain_status='PENDING'
        )

        db.session.add_all([rec1, rec2, rec3])
        db.session.flush()

        # Attach initial blockchain records
        tx1 = BlockchainTransaction(
            attendance_id=rec1.id,
            session_id=session1.session_id,
            student_hash=students[0].student_hash,
            status='PENDING'
        )
        tx2 = BlockchainTransaction(
            attendance_id=rec2.id,
            session_id=session1.session_id,
            student_hash=students[1].student_hash,
            status='PENDING'
        )
        tx3 = BlockchainTransaction(
            attendance_id=rec3.id,
            session_id=session1.session_id,
            student_hash=students[2].student_hash,
            status='PENDING'
        )
        db.session.add_all([tx1, tx2, tx3])

        db.session.commit()
        print("Database seeded with Admin, Faculty, Students, Classes, Subjects, Active QR Session, and Attendance Records!")

if __name__ == '__main__':
    seed()
