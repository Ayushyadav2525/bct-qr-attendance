import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.blockchain_service import BlockchainService
from app.utils.helpers import compute_student_hash

def test_integration():
    print("Testing Web3.py integration with Hardhat node...")
    service = BlockchainService(rpc_url='http://127.0.0.1:8545')

    assert service.is_connected(), "Web3 is NOT connected to Hardhat node!"
    print("[PASS] Web3 successfully connected to local Hardhat blockchain.")

    status = service.get_status()
    print(f"[PASS] Node Status: Block #{status['block_number']}, Chain ID: {status['chain_id']}, Operator: {status['operator_account']}")
    assert status['block_number'] is not None and status['block_number'] >= 1

    # Test student hash computation
    student_hash = compute_student_hash("STU-001", "CS2024-001")
    print(f"[PASS] Computed student pseudonym hash: {student_hash}")

    # Submit attendance proof to on-chain session with dynamic ID for test idempotency
    import time
    test_session_id = f"SES-TEST-{int(time.time())}"
    print(f"Submitting live attendance proof to Solidity contract on-chain for session {test_session_id}...")
    res = service.submit_attendance_proof(test_session_id, student_hash, f"VER-{int(time.time())}")
    print("Blockchain Submission Result:", res)

    assert res['success'] is True, f"Failed to submit attendance proof: {res.get('error')}"
    assert res['status'] == 'CONFIRMED'
    assert res['tx_hash'] is not None and res['tx_hash'].startswith('0x')
    assert res['block_number'] is not None
    print(f"[PASS] Confirmed transaction: {res['tx_hash']} in Block #{res['block_number']}")

    # Verify on-chain query
    print("Verifying on-chain state via contract view function...")
    v_res = service.verify_attendance_on_chain(test_session_id, student_hash)
    print("On-Chain Verification:", v_res)
    assert v_res['verified'] is True, "On-chain verification returned False!"
    print("[PASS] On-chain smart contract verified that student attended!")

    # Test duplicate submission rejection
    print("Testing duplicate on-chain submission rejection...")
    dup_res = service.submit_attendance_proof(test_session_id, student_hash, f"VER-{int(time.time())}-DUP")
    print("Duplicate Submission Result:", dup_res)
    assert dup_res['success'] is False, "Duplicate attendance was not rejected!"
    assert dup_res['status'] == 'FAILED'
    print("[PASS] Duplicate attendance properly rejected by smart contract on-chain.")

    print("\nALL WEB3.PY AND SMART CONTRACT INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_integration()
