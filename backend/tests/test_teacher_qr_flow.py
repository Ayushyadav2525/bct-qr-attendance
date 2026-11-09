import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, User, Teacher, Student, AttendanceSession, AttendanceRecord

def test_teacher_qr_generation_and_student_scan():
    print("================================================================")
    print("VERIFYING TEACHER QR GENERATION AND ATTENDANCE SCAN FLOW")
    print("================================================================")

    app = create_app()
    client = app.test_client()

    with app.app_context():
        # Step 1: Login as Teacher
        print("\n[STEP 1] Login as Teacher...")
        login_res = client.post('/api/auth/login', json={
            'email': 'teacher@demo.edu',
            'password': 'password123',
            'role': 'teacher'
        })
        assert login_res.status_code == 200, f"Teacher login failed: {login_res.get_json()}"
        login_data = login_res.get_json()
        assert login_data['success'] is True
        teacher_token = login_data['token']
        teacher_user = login_data['user']
        print(f"[SUCCESS] Teacher logged in successfully: {teacher_user['name']} ({teacher_user['id']})")

        # Step 2: Load assigned classes and subjects
        print("\n[STEP 2] Load assigned classes and subjects...")
        headers = {'Authorization': f'Bearer {teacher_token}'}
        
        classes_res = client.get('/api/teacher/classes', headers=headers)
        assert classes_res.status_code == 200, f"Failed to get classes: {classes_res.get_json()}"
        assigned_classes = classes_res.get_json().get('classes', [])
        print(f"[SUCCESS] Assigned classes loaded: {[c['name'] for c in assigned_classes]}")
        assert len(assigned_classes) > 0, "No assigned classes returned for teacher"

        subjects_res = client.get('/api/teacher/subjects', headers=headers)
        assert subjects_res.status_code == 200, f"Failed to get subjects: {subjects_res.get_json()}"
        assigned_subjects = subjects_res.get_json().get('subjects', [])
        print(f"[SUCCESS] Assigned subjects loaded: {[(s['name'], s['classId']) for s in assigned_subjects]}")
        assert len(assigned_subjects) > 0, "No assigned subjects returned for teacher"

        # Select target class and matching subject for enrolled student (CLS-CS4A)
        target_class = next((c for c in assigned_classes if c['id'] == 'CLS-CS4A'), assigned_classes[0])
        matching_subjects = [s for s in assigned_subjects if s.get('classId') == target_class['id']]
        target_subject = matching_subjects[0] if matching_subjects else assigned_subjects[0]
        print(f"Target selected: Class '{target_class['name']}' ({target_class['id']}) and Subject '{target_subject['name']}' ({target_subject['id']})")

        # Step 3: Generate a QR session
        print("\n[STEP 3] Generate a QR session...")
        create_res = client.post('/api/teacher/sessions', json={
            'classId': target_class['id'],
            'subjectId': target_subject['id'],
            'durationMinutes': 15
        }, headers=headers)
        assert create_res.status_code == 201, f"Failed to create session: {create_res.get_json()}"
        create_data = create_res.get_json()
        assert create_data['success'] is True, f"Session creation unsuccessful: {create_data}"
        session_info = create_data['session']
        session_db_id = session_info['db_id']
        session_code = session_info['id']
        qr_token = session_info['token']
        print(f"[SUCCESS] Session created with ID: {session_code}, token: {qr_token}")

        # Step 4: Verify the session exists in the database
        print("\n[STEP 4] Verify the session exists in the database...")
        db_session = AttendanceSession.query.filter_by(session_id=session_code).first()
        assert db_session is not None, f"Session {session_code} not found in database!"
        print(f"[SUCCESS] Session confirmed in database with ID: {db_session.session_id} (row id: {db_session.id})")

        # Step 5: Verify its status is OPEN
        print("\n[STEP 5] Verify its status is OPEN...")
        print(f"Database session status: '{db_session.status}'")
        assert db_session.status == 'OPEN', f"Expected session status 'OPEN', got '{db_session.status}'"
        assert session_info['status'] == 'OPEN', f"Expected response session status 'OPEN', got '{session_info['status']}'"
        print("[SUCCESS] Session status is verified as 'OPEN' in both database and API response!")

        # Step 6: Verify the QR code is displayed (token & expiration valid)
        print("\n[STEP 6] Verify QR code data is valid and active...")
        assert qr_token and len(qr_token) > 10, "QR token is empty or invalid"
        assert session_info.get('expiresAt') is not None, "expiresAt is missing"
        assert not db_session.is_expired(), "Session created is already expired"
        print(f"[SUCCESS] QR Code token ready for broadcast: {qr_token}")
        print(f"Expires at: {session_info['expiresAt']}")

        # Step 7: Scan it using a Student account
        print("\n[STEP 7] Scan it using a Student account...")
        student_login = client.post('/api/auth/login', json={
            'email': 'student@demo.edu',
            'password': 'password123',
            'role': 'student'
        })
        assert student_login.status_code == 200, f"Student login failed: {student_login.get_json()}"
        student_token = student_login.get_json()['token']
        student_user = student_login.get_json()['user']
        print(f"Student authenticated: {student_user['name']} ({student_user['id']})")

        student_headers = {'Authorization': f'Bearer {student_token}'}
        scan_res = client.post('/api/student/attendance/scan', json={
            'token': qr_token,
            'method': 'QR Camera'
        }, headers=student_headers)
        assert scan_res.status_code == 200, f"Scan failed with status {scan_res.status_code}: {scan_res.get_json()}"
        scan_data = scan_res.get_json()
        assert scan_data['success'] is True, f"Scan unsuccessful: {scan_data}"
        print(f"[SUCCESS] Attendance scan processed: {scan_data['message']}")

        # Step 8: Verify attendance is saved
        print("\n[STEP 8] Verify attendance is saved in database...")
        student = Student.query.filter_by(student_id=student_user['id']).first()
        record = AttendanceRecord.query.filter_by(
            session_id=db_session.id,
            student_id=student.id
        ).first()
        assert record is not None, f"Attendance record not found in database for session {db_session.id} and student {student.id}"
        assert record.status == 'Present', f"Attendance status is not Present: {record.status}"
        print(f"[SUCCESS] Attendance record saved in database: ID {record.id}, Status '{record.status}', Date {record.date}, Time {record.time}")
        print("\n================================================================")
        print("ALL 8 VERIFICATION STEPS PASSED SUCCESSFULLY!")
        print("================================================================")

if __name__ == '__main__':
    test_teacher_qr_generation_and_student_scan()
