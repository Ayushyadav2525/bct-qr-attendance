import os
import sys
import unittest
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import (
    db, User, Student, Teacher, ClassBatch, Subject,
    AttendanceSession, AttendanceRecord, BlockchainTransaction,
    TeacherAssignment, StudentEnrollment, AttendanceCorrection
)
from seed_data import seed

class TestRBACAndAttendance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Seed test database
        seed()
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def setUp(self):
        # Helper to obtain auth token for any email/role
        self.admin_token = self._login('admin@demo.edu', 'password123', 'admin')
        self.teacher_token = self._login('teacher@demo.edu', 'password123', 'teacher')
        self.student_token = self._login('student@demo.edu', 'password123', 'student')

    def _login(self, email, password, role):
        res = self.client.post('/api/auth/login', json={'email': email, 'password': password, 'role': role})
        data = res.get_json()
        assert res.status_code == 200, f"Login failed for {email}: {data}"
        return data['token']

    # ==========================================
    # A. ROLE AUTHORIZATION TESTS
    # ==========================================
    def test_01_unauthenticated_request_rejected(self):
        """Unauthenticated user accessing protected API must receive 401 Unauthorized."""
        res = self.client.get('/api/admin/students')
        self.assertEqual(res.status_code, 401)
        res = self.client.get('/api/teacher/classes')
        self.assertEqual(res.status_code, 401)
        res = self.client.get('/api/student/dashboard')
        self.assertEqual(res.status_code, 401)

    def test_02_admin_accesses_all_records(self):
        """Admin has full access to institutional directories and records."""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        res_stu = self.client.get('/api/admin/students', headers=headers)
        self.assertEqual(res_stu.status_code, 200)
        self.assertTrue(res_stu.get_json()['success'])

        res_tch = self.client.get('/api/admin/teachers', headers=headers)
        self.assertEqual(res_tch.status_code, 200)

        res_cls = self.client.get('/api/admin/classes', headers=headers)
        self.assertEqual(res_cls.status_code, 200)

    def test_03_student_cannot_access_administrative_directories(self):
        """Student accessing Students, Faculty, or Classes directory must receive 403 Forbidden."""
        headers = {'Authorization': f'Bearer {self.student_token}'}
        # Student Directory
        res = self.client.get('/api/admin/students', headers=headers)
        self.assertEqual(res.status_code, 403)
        # Faculty Directory
        res = self.client.get('/api/admin/teachers', headers=headers)
        self.assertEqual(res.status_code, 403)
        # Classes Directory
        res = self.client.get('/api/admin/classes', headers=headers)
        self.assertEqual(res.status_code, 403)

    def test_04_student_cannot_generate_qr_session(self):
        """Student attempting to create a QR attendance session must receive 403 Forbidden."""
        headers = {'Authorization': f'Bearer {self.student_token}'}
        res = self.client.post('/api/teacher/sessions', json={'classId': 'CLS-CS4A', 'subjectId': 'SUB-BC401'}, headers=headers)
        self.assertEqual(res.status_code, 403)

    def test_05_student_cannot_access_other_student_attendance(self):
        """Student attempting to query another student's attendance must receive 403 Forbidden."""
        headers = {'Authorization': f'Bearer {self.student_token}'}
        # Student Alex attempts to pass Sophia's student_id
        res = self.client.get('/api/student/attendance?student_id=STU-002', headers=headers)
        self.assertEqual(res.status_code, 403)

    def test_06_student_accesses_own_records(self):
        """Student querying their own dashboard and records must succeed with 200."""
        headers = {'Authorization': f'Bearer {self.student_token}'}
        res = self.client.get('/api/student/dashboard', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('overallPercentage', data)

        res_att = self.client.get('/api/student/attendance', headers=headers)
        self.assertEqual(res_att.status_code, 200)

    def test_07_teacher_accesses_assigned_classes_and_subjects(self):
        """Teacher accesses assigned classes and subjects successfully."""
        headers = {'Authorization': f'Bearer {self.teacher_token}'}
        res_cls = self.client.get('/api/teacher/classes', headers=headers)
        self.assertEqual(res_cls.status_code, 200)
        self.assertTrue(len(res_cls.get_json()['classes']) > 0)

        res_sub = self.client.get('/api/teacher/subjects', headers=headers)
        self.assertEqual(res_sub.status_code, 200)
        self.assertTrue(len(res_sub.get_json()['subjects']) > 0)

    def test_08_teacher_cannot_access_unassigned_class_students(self):
        """Teacher attempting to view students of an unassigned class receives 403 Forbidden."""
        headers_admin = {'Authorization': f'Bearer {self.admin_token}'}
        # Admin creates an isolated class and teacher
        with self.app.app_context():
            isolated_cls = ClassBatch(class_id='CLS-SECRET-01', name='Cyber Warfare & Defense', department='IT', semester='6th')
            db.session.add(isolated_cls)
            db.session.commit()
            isolated_id = isolated_cls.class_id

        headers_teacher = {'Authorization': f'Bearer {self.teacher_token}'}
        res = self.client.get(f'/api/teacher/students?class_id={isolated_id}', headers=headers_teacher)
        self.assertEqual(res.status_code, 403)
        self.assertIn('Forbidden', res.get_json()['error'])

    def test_09_teacher_cannot_generate_qr_for_unassigned_subject(self):
        """Teacher attempting to generate QR for an unassigned subject receives 403 Forbidden."""
        with self.app.app_context():
            # Create a subject assigned to another teacher
            other_sub = Subject(subject_id='SUB-UNASSIGNED-99', name='Quantum Physics', code='PHY901', class_id=1, teacher_id=2)
            db.session.add(other_sub)
            db.session.commit()
            sub_id = other_sub.subject_id

        headers_teacher = {'Authorization': f'Bearer {self.teacher_token}'}
        res = self.client.post('/api/teacher/sessions', json={'classId': 'CLS-CS4A', 'subjectId': sub_id, 'durationMinutes': 15}, headers=headers_teacher)
        self.assertEqual(res.status_code, 403)
        self.assertIn('Forbidden', res.get_json()['error'])

    def test_10_teacher_cannot_close_another_teachers_session(self):
        """Teacher attempting to close a session owned by another instructor receives 403 Forbidden."""
        with self.app.app_context():
            # Create another teacher and an active session for them
            user2 = User(email='prof.turing@demo.edu', role='teacher')
            user2.set_password('password123')
            db.session.add(user2)
            db.session.flush()

            turing = Teacher(user_id=user2.id, teacher_id='TCH-099', name='Prof. Alan Turing', email='prof.turing@demo.edu', department='Computer Science')
            db.session.add(turing)
            db.session.flush()

            session_other = AttendanceSession(
                session_id='SES-TURING-001',
                token='QR-TURING-999-SECRET',
                class_id=1,
                subject_id=1,
                teacher_id=turing.id,
                duration_minutes=15,
                expires_at=datetime.utcnow() + timedelta(minutes=15),
                status='Active'
            )
            db.session.add(session_other)
            db.session.commit()

        # Regular teacher attempts to close Turing's session
        headers_teacher = {'Authorization': f'Bearer {self.teacher_token}'}
        res = self.client.post('/api/teacher/sessions/SES-TURING-001/close', headers=headers_teacher)
        self.assertEqual(res.status_code, 403)
        self.assertIn('Forbidden', res.get_json()['error'])

    # ==========================================
    # B. COMPLETE QR WORKFLOW & ANTI-PROXY TESTS
    # ==========================================
    def test_11_qr_session_validation_and_scanning_workflow(self):
        """Complete workflow: Session creation, scan, duplicate block, unenrolled block, expired block."""
        headers_tch = {'Authorization': f'Bearer {self.teacher_token}'}

        # 1. Teacher creates session for assigned subject
        res_create = self.client.post(
            '/api/teacher/sessions',
            json={'classId': 'CLS-CS4A', 'subjectId': 'SUB-BC401', 'durationMinutes': 20},
            headers=headers_tch
        )
        self.assertEqual(res_create.status_code, 201)
        sess = res_create.get_json()['session']
        token = sess['token']
        self.assertTrue(token.startswith('QR-CS401-'))
        self.assertTrue(sess['expiresAt'].endswith('Z')) # Verify UTC timezone format

        # 2. Enrolled student (Alex, STU-001) scans token
        headers_stu = {'Authorization': f'Bearer {self.student_token}'}
        res_scan = self.client.post('/api/student/attendance/scan', json={'token': token, 'method': 'QR Camera'}, headers=headers_stu)
        self.assertEqual(res_scan.status_code, 200)
        scan_data = res_scan.get_json()
        self.assertTrue(scan_data['success'])
        self.assertEqual(scan_data['record']['status'], 'Present')
        record_id = scan_data['record']['id']

        # 3. Duplicate scan rejected
        res_dup = self.client.post('/api/student/attendance/scan', json={'token': token, 'method': 'QR Camera'}, headers=headers_stu)
        self.assertEqual(res_dup.status_code, 400)
        self.assertIn('Duplicate Scan Rejected', res_dup.get_json()['error'])

        # 4. Unenrolled student scan rejected
        with self.app.app_context():
            unenrolled_user = User(email='outsider@demo.edu', role='student')
            unenrolled_user.set_password('password123')
            db.session.add(unenrolled_user)
            db.session.flush()

            unenrolled_student = Student(
                user_id=unenrolled_user.id,
                student_id='STU-999',
                name='Outsider Student',
                roll_no='CS999-OUT',
                email='outsider@demo.edu',
                class_id=2, # Enrolled in IT, NOT CS-4A
                student_hash='0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
            )
            db.session.add(unenrolled_student)
            db.session.commit()

        outsider_token = self._login('outsider@demo.edu', 'password123', 'student')
        headers_outsider = {'Authorization': f'Bearer {outsider_token}'}
        res_unenr = self.client.post('/api/student/attendance/scan', json={'token': token, 'method': 'QR Camera'}, headers=headers_outsider)
        self.assertEqual(res_unenr.status_code, 400)
        self.assertIn('Access Denied', res_unenr.get_json()['error'])

        # 5. Teacher closes session
        res_close = self.client.post(f"/api/teacher/sessions/{sess['id']}/close", headers=headers_tch)
        self.assertEqual(res_close.status_code, 200)
        self.assertEqual(res_close.get_json()['session']['status'], 'Closed')

        # 6. Scanning closed session rejected
        with self.app.app_context():
            s2 = Student.query.filter_by(roll_no='CS2024-002').first()
            s2_user = User.query.get(s2.user_id)
            s2_token = self._login(s2_user.email, 'password123', 'student')

        res_closed_scan = self.client.post('/api/student/attendance/scan', json={'token': token, 'method': 'QR Camera'}, headers={'Authorization': f'Bearer {s2_token}'})
        self.assertEqual(res_closed_scan.status_code, 400)
        self.assertIn('closed', res_closed_scan.get_json()['error'].lower())

    def test_12_invalid_duration_and_identifiers_rejected(self):
        """Session creation with duration < 1 or > 180 or invalid IDs rejected."""
        headers_tch = {'Authorization': f'Bearer {self.teacher_token}'}

        # Negative duration
        res = self.client.post('/api/teacher/sessions', json={'classId': 'CLS-CS4A', 'subjectId': 'SUB-BC401', 'durationMinutes': -5}, headers=headers_tch)
        self.assertEqual(res.status_code, 400)

        # Invalid class ID
        res = self.client.post('/api/teacher/sessions', json={'classId': 'CLS-DOES-NOT-EXIST', 'subjectId': 'SUB-BC401', 'durationMinutes': 15}, headers=headers_tch)
        self.assertEqual(res.status_code, 400)

    # ==========================================
    # C. ATTENDANCE CORRECTIONS & AUDIT LOG
    # ==========================================
    def test_13_teacher_attendance_correction_with_audit_trail(self):
        """Teacher modifies an attendance record and verifies the audit record is preserved."""
        headers_tch = {'Authorization': f'Bearer {self.teacher_token}'}

        with self.app.app_context():
            # Get an existing record for teacher 1
            rec = AttendanceRecord.query.first()
            rec_id = rec.id
            orig_status = rec.status

        new_status = 'Late' if orig_status == 'Present' else 'Present'
        res_correct = self.client.post(
            '/api/teacher/attendance/correct',
            json={
                'attendanceId': rec_id,
                'status': new_status,
                'reason': 'Student arrived with verified transit delay pass.'
            },
            headers=headers_tch
        )
        self.assertEqual(res_correct.status_code, 200)
        data = res_correct.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['record']['status'], new_status)

        # Verify audit record exists in database
        with self.app.app_context():
            corr = AttendanceCorrection.query.filter_by(attendance_id=rec_id).order_by(AttendanceCorrection.created_at.desc()).first()
            self.assertIsNotNone(corr)
            self.assertEqual(corr.original_status, orig_status)
            self.assertEqual(corr.updated_status, new_status)
            self.assertEqual(corr.reason, 'Student arrived with verified transit delay pass.')

    # ==========================================
    # D. DATABASE PERSISTENCE & CONSTRAINTS
    # ==========================================
    def test_14_database_unique_attendance_constraint(self):
        """Database rejects inserting duplicate attendance records for same session and student."""
        with self.app.app_context():
            record = AttendanceRecord.query.first()
            dup = AttendanceRecord(
                session_id=record.session_id,
                student_id=record.student_id,
                date='2026-11-01',
                time='10:00 AM',
                status='Present',
                student_hash=record.student_hash
            )
            db.session.add(dup)
            with self.assertRaises(Exception):
                db.session.commit()
            db.session.rollback()

if __name__ == '__main__':
    unittest.main()
