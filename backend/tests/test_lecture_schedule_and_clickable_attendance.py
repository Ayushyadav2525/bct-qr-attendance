import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, User, Teacher, Student, AttendanceSession, AttendanceRecord
from seed_data import seed

def test_lecture_schedule_and_live_clickable_attendance():
    print("================================================================")
    print("VERIFYING LECTURE SCHEDULE & CLICKABLE LIVE ATTENDANCE WORKFLOW")
    print("================================================================")

    # 0. Seed fresh database state
    print("\n[STEP 0] Seeding clean database state...")
    seed()

    app = create_app()
    client = app.test_client()

    with app.app_context():
        # Step 1: Login as Teacher (Dr. Robert Vance)
        print("\n[STEP 1] Login as Teacher (TCH-001)...")
        login_res = client.post('/api/auth/login', json={
            'email': 'teacher@demo.edu',
            'password': 'password123',
            'role': 'teacher'
        })
        assert login_res.status_code == 200, f"Teacher login failed: {login_res.get_json()}"
        teacher_token = login_res.get_json()['token']
        teacher_user = login_res.get_json()['user']
        headers_tch = {'Authorization': f'Bearer {teacher_token}'}
        print(f"[PASS] Teacher authenticated: {teacher_user['name']} ({teacher_user['id']})")

        # Step 2: Test validation for invalid lecture schedule (End Time earlier than Start Time)
        print("\n[STEP 2] Validating lecture end time must be later than start time...")
        invalid_res = client.post('/api/teacher/sessions', json={
            'classId': 'CLS-CS4A',
            'subjectId': 'SUB-BC401',
            'durationMinutes': 15,
            'lectureDate': '02 November 2026',
            'lectureStartTime': '11:00 AM',
            'lectureEndTime': '10:00 AM'
        }, headers=headers_tch)
        assert invalid_res.status_code == 400, f"Expected 400 for invalid time, got: {invalid_res.status_code}"
        assert 'must be later than' in invalid_res.get_json().get('error', '').lower()
        print(f"[PASS] Invalid lecture time correctly rejected: {invalid_res.get_json()['error']}")

        # Step 3: Teacher creates session with 10:00 AM to 11:00 AM and 15 min QR validity
        print("\n[STEP 3] Teacher generating session with Lecture: 10:00 AM - 11:00 AM, QR validity: 15 mins...")
        create_res = client.post('/api/teacher/sessions', json={
            'classId': 'CLS-CS4A',
            'subjectId': 'SUB-BC401',
            'durationMinutes': 15,
            'lectureDate': '02 November 2026',
            'lectureStartTime': '10:00 AM',
            'lectureEndTime': '11:00 AM'
        }, headers=headers_tch)
        assert create_res.status_code == 201, f"Failed to create session: {create_res.get_json()}"
        session_data = create_res.get_json()['session']
        session_id = session_data['id']
        qr_token = session_data['token']
        assert session_data['lectureDate'] == '02 November 2026'
        assert session_data['lectureStartTime'] == '10:00 AM'
        assert session_data['lectureEndTime'] == '11:00 AM'
        assert session_data['durationMinutes'] == 15
        assert session_data['status'] == 'OPEN'
        print(f"[PASS] Session successfully created in database: {session_id}")
        print(f"       - Lecture Date: {session_data['lectureDate']}")
        print(f"       - Lecture Slot: {session_data['lectureStartTime']} to {session_data['lectureEndTime']}")
        print(f"       - QR Validity: {session_data['durationMinutes']} Minutes (expiresAt: {session_data['expiresAt']})")

        # Step 4: Verify Initial Attendee State (0 Students Checked In)
        print("\n[STEP 4] Querying initial session attendance list before any scans...")
        att_res_0 = client.get(f'/api/teacher/sessions/{session_id}/attendance', headers=headers_tch)
        assert att_res_0.status_code == 200, f"Failed to get attendance: {att_res_0.get_json()}"
        data_0 = att_res_0.get_json()
        assert data_0['checkedInCount'] == 0, f"Expected 0 checked in, got {data_0['checkedInCount']}"
        assert len(data_0['students']) == 0, "Expected empty students list initially"
        assert data_0['totalEnrolled'] >= 4, f"Expected at least 4 enrolled students, got {data_0['totalEnrolled']}"
        assert data_0['notCheckedInCount'] == data_0['totalEnrolled']
        print(f"[PASS] Initial attendance list confirms: {data_0['checkedInCount']} Checked In, {data_0['notCheckedInCount']} Not Checked In (Total: {data_0['totalEnrolled']})")

        # Step 5: Student 1 (Alex Johnson - CS2024-001) scans QR code
        print("\n[STEP 5] Student 1 (Alex Johnson) logs in and scans QR code...")
        s1_login = client.post('/api/auth/login', json={
            'email': 'student@demo.edu',
            'password': 'password123',
            'role': 'student'
        })
        assert s1_login.status_code == 200
        s1_token = s1_login.get_json()['token']
        headers_s1 = {'Authorization': f'Bearer {s1_token}'}

        scan_res_1 = client.post('/api/student/attendance/scan', json={
            'token': qr_token,
            'method': 'QR Camera'
        }, headers=headers_s1)
        assert scan_res_1.status_code == 200, f"Student 1 scan failed: {scan_res_1.get_json()}"
        print(f"[PASS] Student 1 attendance marked successfully: {scan_res_1.get_json()['message']}")

        # Step 6: Verify Teacher's live attendance count increases from 0 to 1
        print("\n[STEP 6] Teacher queries live attendance list (count increases 0 -> 1)...")
        att_res_1 = client.get(f'/api/teacher/sessions/{session_id}/attendance', headers=headers_tch)
        assert att_res_1.status_code == 200
        data_1 = att_res_1.get_json()
        assert data_1['checkedInCount'] == 1, f"Expected 1 checked in, got {data_1['checkedInCount']}"
        assert len(data_1['students']) == 1, f"Expected 1 student in list, got {len(data_1['students'])}"
        s1_record = data_1['students'][0]
        assert s1_record['rollNo'] == 'CS2024-001'
        assert s1_record['studentName'] == 'Alex Johnson'
        assert s1_record['status'] == 'Present'
        assert s1_record['scanTime'] is not None
        print(f"[PASS] Live Attendance updated: Checked In: {data_1['checkedInCount']}, Not Checked In: {data_1['notCheckedInCount']}")
        print(f"       - Student: {s1_record['rollNo']} | {s1_record['studentName']} | {s1_record['subject']} | Scan Time: {s1_record['scanTime']} | Status: {s1_record['status']}")

        # Step 7: Student 2 (Marcus Chen - CS2024-002) scans QR code
        print("\n[STEP 7] Student 2 (Marcus Chen) logs in and scans QR code...")
        s2_login = client.post('/api/auth/login', json={
            'email': 'marcus.c@demo.edu',
            'password': 'password123',
            'role': 'student'
        })
        assert s2_login.status_code == 200
        s2_token = s2_login.get_json()['token']
        headers_s2 = {'Authorization': f'Bearer {s2_token}'}

        scan_res_2 = client.post('/api/student/attendance/scan', json={
            'token': qr_token,
            'method': 'QR Camera'
        }, headers=headers_s2)
        assert scan_res_2.status_code == 200, f"Student 2 scan failed: {scan_res_2.get_json()}"
        print(f"[PASS] Student 2 attendance marked successfully: {scan_res_2.get_json()['message']}")

        # Step 8: Verify Live Attendance count updates from 1 to 2
        print("\n[STEP 8] Teacher queries live attendance list (count increases 1 -> 2)...")
        att_res_2 = client.get(f'/api/teacher/sessions/{session_id}/attendance', headers=headers_tch)
        assert att_res_2.status_code == 200
        data_2 = att_res_2.get_json()
        assert data_2['checkedInCount'] == 2, f"Expected 2 checked in, got {data_2['checkedInCount']}"
        assert len(data_2['students']) == 2, f"Expected 2 students in list, got {len(data_2['students'])}"
        rolls = [s['rollNo'] for s in data_2['students']]
        assert 'CS2024-001' in rolls
        assert 'CS2024-002' in rolls
        print(f"[PASS] Live Attendance updated: Checked In: {data_2['checkedInCount']}, Not Checked In: {data_2['notCheckedInCount']}")
        for s in data_2['students']:
            print(f"       - Student: {s['rollNo']} | {s['studentName']} | {s['subject']} | Scan Time: {s['scanTime']} | Status: {s['status']}")

        # Step 9: Duplicate scan rejection
        print("\n[STEP 9] Testing duplicate scan rejection by Student 1...")
        dup_res = client.post('/api/student/attendance/scan', json={
            'token': qr_token,
            'method': 'QR Camera'
        }, headers=headers_s1)
        assert dup_res.status_code == 400
        assert 'Duplicate Scan Rejected' in dup_res.get_json().get('error', '')
        print(f"[PASS] Duplicate scan rejected: {dup_res.get_json()['error']}")

        # Step 10: Security & Authorization - Unrelated Teacher cannot access session attendance
        print("\n[STEP 10] Security verification: Unrelated teacher (TCH-002) attempting access...")
        t2_user = User.query.filter_by(email='finch@demo.edu').first()
        if not t2_user:
            t2_user = User(email='finch@demo.edu', role='teacher')
            t2_user.set_password('password123')
            db.session.add(t2_user)
            db.session.flush()
            t2 = Teacher.query.filter_by(teacher_id='TCH-002').first()
            if t2:
                t2.user_id = t2_user.id
            db.session.commit()

        t2_login = client.post('/api/auth/login', json={
            'email': 'finch@demo.edu',
            'password': 'password123',
            'role': 'teacher'
        })
        assert t2_login.status_code == 200
        t2_token = t2_login.get_json()['token']
        unauth_tch_res = client.get(f'/api/teacher/sessions/{session_id}/attendance', headers={'Authorization': f'Bearer {t2_token}'})
        assert unauth_tch_res.status_code == 403, f"Expected 403, got {unauth_tch_res.status_code}"
        print(f"[PASS] Unrelated teacher correctly blocked with 403 Forbidden.")

        # Step 11: Security verification - Student cannot access teacher attendance list
        print("\n[STEP 11] Security verification: Student attempting to access teacher attendance endpoint...")
        stu_forbidden_res = client.get(f'/api/teacher/sessions/{session_id}/attendance', headers=headers_s1)
        assert stu_forbidden_res.status_code == 403, f"Expected 403, got {stu_forbidden_res.status_code}"
        print(f"[PASS] Student access correctly blocked with 403 Forbidden.")

        # Step 12: Close session and verify no further scans accepted
        print("\n[STEP 12] Closing active session and verifying subsequent scans are stopped...")
        close_res = client.post(f'/api/teacher/sessions/{session_id}/close', headers=headers_tch)
        assert close_res.status_code == 200
        assert close_res.get_json()['session']['status'] == 'Closed'

        # Student 3 tries to scan closed session
        s3_login = client.post('/api/auth/login', json={
            'email': 'sarah.j@demo.edu',
            'password': 'password123',
            'role': 'student'
        })
        assert s3_login.status_code == 200
        s3_token = s3_login.get_json()['token']
        post_close_scan = client.post('/api/student/attendance/scan', json={
            'token': qr_token,
            'method': 'QR Camera'
        }, headers={'Authorization': f'Bearer {s3_token}'})
        assert post_close_scan.status_code == 400
        assert 'closed' in post_close_scan.get_json().get('error', '').lower()
        print(f"[PASS] Scan on closed session rejected: {post_close_scan.get_json()['error']}")

        # Step 13: Verify AttendanceRecord contains lecture schedule
        print("\n[STEP 13] Verifying AttendanceRecord database models return lectureSchedule...")
        rec = AttendanceRecord.query.filter_by(session_id=create_res.get_json()['session']['db_id']).first()
        assert rec is not None
        rec_dict = rec.to_dict()
        assert rec_dict['lectureDate'] == '02 November 2026'
        assert rec_dict['lectureStartTime'] == '10:00 AM'
        assert rec_dict['lectureEndTime'] == '11:00 AM'
        assert '02 November 2026 (10:00 AM - 11:00 AM)' in rec_dict['lectureSchedule']
        print(f"[PASS] Record audit returns lecture schedule: {rec_dict['lectureSchedule']}")

        print("\n================================================================")
        print("ALL 13 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!")
        print("================================================================")

if __name__ == '__main__':
    test_lecture_schedule_and_live_clickable_attendance()
