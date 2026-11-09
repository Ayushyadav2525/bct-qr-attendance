import sys
import os
import json
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import db, User, Student, Teacher, ClassBatch, Subject, AttendanceSession, AttendanceRecord, BlockchainTransaction
from seed_data import seed

def run_e2e_test():
    print("==================================================")
    print("STARTING FULL-STACK END-TO-END WORKFLOW VERIFICATION")
    print("==================================================")

    # Seed fresh test state
    seed()

    app = create_app()
    client = app.test_client()

    with app.app_context():
        # Step 1: Admin Login
        print("\n[STEP 1] Testing Admin Login...")
        res = client.post('/api/auth/login', json={'email': 'admin@demo.edu', 'password': 'password123', 'role': 'admin'})
        data = res.get_json()
        assert res.status_code == 200 and data['success'] is True, f"Admin login failed: {data}"
        admin_token = data['token']
        print(f"[PASS] Admin authenticated. Token received.")

        # Step 2: Admin creates a Class, Subject, Teacher, Student
        print("\n[STEP 2] Admin creating academic structures...")
        admin_headers = {'Authorization': f'Bearer {admin_token}'}
        # Class
        res = client.post('/api/admin/classes', json={'name': 'BCT Final Year', 'department': 'Computer Science', 'semester': '8th', 'studentCount': 30}, headers=admin_headers)
        assert res.status_code == 201, f"Failed creating class: {res.get_json()}"
        cls_data = res.get_json()['class']
        print(f"[PASS] Class created: {cls_data['name']} ({cls_data['id']})")

        # Teacher
        res = client.post('/api/admin/teachers', json={'name': 'Prof. Satoshi Nakamoto', 'email': 'satoshi@demo.edu', 'department': 'Computer Science'}, headers=admin_headers)
        assert res.status_code == 201, f"Failed creating teacher: {res.get_json()}"
        tch_data = res.get_json()['teacher']
        print(f"[PASS] Teacher created: {tch_data['name']} ({tch_data['id']})")

        # Subject
        res = client.post('/api/admin/subjects', json={'name': 'Advanced Cryptography', 'code': 'CS801', 'classId': cls_data['id'], 'teacherId': tch_data['id']}, headers=admin_headers)
        assert res.status_code == 201, f"Failed creating subject: {res.get_json()}"
        sub_data = res.get_json()['subject']
        print(f"[PASS] Subject created: {sub_data['name']} ({sub_data['id']})")

        # Student
        res = client.post('/api/admin/students', json={'name': 'Hal Finney', 'rollNo': 'CS2026-999', 'email': 'hal@demo.edu', 'classId': cls_data['id'], 'department': 'Computer Science', 'semester': '8th'}, headers=admin_headers)
        assert res.status_code == 201, f"Failed creating student: {res.get_json()}"
        stu_data = res.get_json()['student']
        print(f"[PASS] Student created: {stu_data['name']} ({stu_data['id']}) with roll {stu_data['rollNo']}")

        # Step 3: Teacher Login
        print("\n[STEP 3] Testing Faculty Login...")
        res = client.post('/api/auth/login', json={'email': 'satoshi@demo.edu', 'password': 'password123', 'role': 'teacher'})
        assert res.status_code == 200
        tch_token = res.get_json()['token']
        print(f"[PASS] Faculty {tch_data['name']} authenticated.")

        # Step 4: Teacher creates Attendance Session (QR generation)
        print("\n[STEP 4] Teacher generating attendance session and QR token...")
        headers_tch = {'X-Teacher-ID': tch_data['id'], 'Authorization': f'Bearer {tch_token}'}
        res = client.post('/api/teacher/sessions', json={'classId': cls_data['id'], 'subjectId': sub_data['id'], 'durationMinutes': 15}, headers=headers_tch)
        assert res.status_code == 201
        session_data = res.get_json()['session']
        qr_token = session_data['token']
        print(f"[PASS] Attendance session created: {session_data['id']}")
        print(f"[PASS] Generated Secure QR Token: {qr_token}")
        print(f"[PASS] Session Expiry: {session_data['expiresAt']}")

        # Step 5: Student Login
        print("\n[STEP 5] Testing Student Login...")
        res = client.post('/api/auth/login', json={'email': 'hal@demo.edu', 'password': 'password123', 'role': 'student'})
        assert res.status_code == 200
        stu_token = res.get_json()['token']
        print(f"[PASS] Student {stu_data['name']} authenticated.")

        # Step 6: Student scans the QR Code
        print("\n[STEP 6] Student scanning QR code and submitting attendance...")
        headers_stu = {'X-Student-ID': stu_data['id'], 'Authorization': f'Bearer {stu_token}'}
        res = client.post('/api/student/attendance/scan', json={'token': qr_token, 'method': 'QR Camera', 'student_id': stu_data['id']}, headers=headers_stu)
        if res.status_code != 200:
            print("FAILED STEP 6 ERROR:", res.status_code, res.get_json())
        assert res.status_code == 200, f"Expected 200 got {res.status_code}: {res.get_json()}"
        scan_data = res.get_json()
        assert scan_data['success'] is True
        print(f"[PASS] Attendance successfully marked in Database!")
        print(f"[PASS] Blockchain Status: {scan_data['blockchain']['status']}")
        print(f"[PASS] Transaction Hash: {scan_data['blockchain']['tx_hash']}")
        print(f"[PASS] Block Number: {scan_data['blockchain']['block_number']}")

        record_id = scan_data['record']['id']

        # Step 7: Duplicate Scan Rejection Test
        print("\n[STEP 7] Testing duplicate attendance rejection...")
        res_dup = client.post('/api/student/attendance/scan', json={'token': qr_token, 'method': 'QR Camera', 'student_id': stu_data['id']}, headers=headers_stu)
        assert res_dup.status_code == 400
        assert "Duplicate Scan Rejected" in res_dup.get_json()['error']
        print(f"[PASS] Duplicate attendance correctly rejected by backend.")

        # Step 8: Unenrolled Student Scan Rejection Test
        print("\n[STEP 8] Testing unenrolled student scan rejection...")
        # Student 1 from CS 4th Sem (student@demo.edu) tries to scan BCT Final Year QR
        res_s1 = client.post('/api/auth/login', json={'email': 'student@demo.edu', 'password': 'password123', 'role': 'student'})
        assert res_s1.status_code == 200, f"Failed student login: {res_s1.get_json()}"
        s1_token = res_s1.get_json()['token']
        headers_unenrolled = {'Authorization': f'Bearer {s1_token}'}
        res_unenr = client.post('/api/student/attendance/scan', json={'token': qr_token, 'method': 'QR Camera'}, headers=headers_unenrolled)
        assert res_unenr.status_code == 400
        assert "Access Denied" in res_unenr.get_json()['error'] or "not enrolled" in res_unenr.get_json()['error'].lower()
        print(f"[PASS] Unenrolled student scan correctly rejected by backend.")

        # Step 9: Expired Session Scan Rejection Test
        print("\n[STEP 9] Testing expired session scan rejection...")
        # Manually expire session
        sess_db = AttendanceSession.query.filter_by(token=qr_token).first()
        sess_db.expires_at = datetime.utcnow() - timedelta(minutes=5)
        db.session.commit()

        # Create another student to test expired scan
        res_stu2 = client.post('/api/admin/students', json={'name': 'Nick Szabo', 'rollNo': 'CS2026-888', 'email': 'nick@demo.edu', 'classId': cls_data['id']}, headers=admin_headers)
        stu2_id = res_stu2.get_json()['student']['id']
        res_s2_login = client.post('/api/auth/login', json={'email': 'nick@demo.edu', 'password': 'password123', 'role': 'student'})
        s2_token = res_s2_login.get_json()['token']
        res_exp = client.post('/api/student/attendance/scan', json={'token': qr_token, 'method': 'QR Camera'}, headers={'Authorization': f'Bearer {s2_token}'})
        assert res_exp.status_code == 400
        assert "expired" in res_exp.get_json()['error'].lower()
        print(f"[PASS] Expired session scan correctly rejected by backend.")

        # Step 10: Live Blockchain Verification Endpoint
        print("\n[STEP 10] Querying live blockchain verification certificate endpoint...")
        res_bc = client.get(f'/api/blockchain/attendance/{record_id}')
        assert res_bc.status_code == 200
        bc_cert = res_bc.get_json()
        assert bc_cert['success'] is True
        print(f"[PASS] Blockchain Certificate Loaded:")
        print(f"       - Record ID: {bc_cert['record']['id']}")
        print(f"       - Student Name: {bc_cert['record']['studentName']} ({bc_cert['record']['rollNo']})")
        print(f"       - On-Chain Status: {bc_cert['record']['blockchainStatus']}")
        print(f"       - Tx Hash: {bc_cert['record']['txHash']}")
        print(f"       - Block Number: {bc_cert['record']['blockNumber']}")

        # Step 11: Admin Dashboard Analytics Sync
        print("\n[STEP 11] Verifying Admin Dashboard Analytics...")
        res_dash = client.get('/api/admin/dashboard', headers=admin_headers)
        assert res_dash.status_code == 200
        metrics = res_dash.get_json()['metrics']
        print(f"[PASS] Updated Metrics in Database:")
        print(f"       - Total Students: {metrics['totalStudents']}")
        print(f"       - Total Faculty: {metrics['totalTeachers']}")
        print(f"       - Total Classes: {metrics['totalClasses']}")
        print(f"       - Total Subjects: {metrics['totalSubjects']}")
        print(f"       - Total Attendance Records: {metrics['totalRecords']}")
        print(f"       - Overall Campus Rate: {metrics['overallPercentage']}%")

        print("\n==================================================")
        print("ALL END-TO-END TESTS COMPLETED AND FULLY PASSED!")
        print("==================================================")

if __name__ == '__main__':
    run_e2e_test()
