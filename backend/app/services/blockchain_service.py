import os
import json
import logging
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

logger = logging.getLogger(__name__)

# Minimal ABI for AttendanceVerification contract
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "_sessionId", "type": "string"},
            {"internalType": "string", "name": "_classId", "type": "string"},
            {"internalType": "string", "name": "_subjectId", "type": "string"},
            {"internalType": "address", "name": "_teacher", "type": "address"},
            {"internalType": "uint256", "name": "_expirationTime", "type": "uint256"}
        ],
        "name": "createSession",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "", "type": "string"}],
        "name": "sessions",
        "outputs": [
            {"internalType": "string", "name": "sessionId", "type": "string"},
            {"internalType": "string", "name": "classId", "type": "string"},
            {"internalType": "string", "name": "subjectId", "type": "string"},
            {"internalType": "address", "name": "teacher", "type": "address"},
            {"internalType": "uint256", "name": "expirationTime", "type": "uint256"},
            {"internalType": "bool", "name": "exists", "type": "bool"},
            {"internalType": "bool", "name": "isActive", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_sessionId", "type": "string"},
            {"internalType": "bytes32", "name": "_studentHash", "type": "bytes32"},
            {"internalType": "string", "name": "_verificationCode", "type": "string"}
        ],
        "name": "markAttendance",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_sessionId", "type": "string"},
            {"internalType": "bytes32", "name": "_studentHash", "type": "bytes32"}
        ],
        "name": "verifyAttendance",
        "outputs": [
            {"internalType": "bool", "name": "attended", "type": "bool"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "markedBy", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_sessionId", "type": "string"},
            {"internalType": "bytes32", "name": "_studentHash", "type": "bytes32"}
        ],
        "name": "hasAttended",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_sessionId", "type": "string"},
            {"internalType": "bytes32", "name": "_studentHash", "type": "bytes32"}
        ],
        "name": "getAttendanceRecord",
        "outputs": [
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "markedBy", "type": "address"},
            {"internalType": "string", "name": "verificationCode", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": False, "internalType": "string", "name": "sessionId", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "classId", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "subjectId", "type": "string"},
            {"indexed": True, "internalType": "address", "name": "teacher", "type": "address"},
            {"indexed": False, "internalType": "uint256", "name": "expirationTime", "type": "uint256"}
        ],
        "name": "SessionCreated",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": False, "internalType": "string", "name": "sessionId", "type": "string"},
            {"indexed": True, "internalType": "bytes32", "name": "studentHash", "type": "bytes32"},
            {"indexed": True, "internalType": "address", "name": "markedBy", "type": "address"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "AttendanceMarked",
        "type": "event"
    }
]

class BlockchainService:
    def __init__(self, rpc_url='http://127.0.0.1:8545', contract_address=None, private_key=None):
        self.rpc_url = rpc_url
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.contract_address = contract_address or '0x5FbDB2315678afecb367f032d93F642f64180aa3'
        self.private_key = private_key or '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
        self.account = None

        if self.private_key:
            try:
                self.account = self.w3.eth.account.from_key(self.private_key)
            except Exception as e:
                logger.warning(f"Failed to load blockchain private key: {e}")

        # Check for deployment info if file exists
        self._load_deployment_info()

    def _load_deployment_info(self):
        """Attempts to load contract address and ABI from hardhat deployment file if present."""
        deployment_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'blockchain', 'deployment.json')
        if os.path.exists(deployment_path):
            try:
                with open(deployment_path, 'r') as f:
                    data = json.load(f)
                    if 'address' in data:
                        self.contract_address = data['address']
            except Exception as e:
                logger.warning(f"Could not read deployment.json: {e}")

    def is_connected(self):
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def get_status(self):
        connected = self.is_connected()
        block_number = None
        chain_id = None
        accounts_count = 0

        if connected:
            try:
                block_number = self.w3.eth.block_number
                chain_id = self.w3.eth.chain_id
                accounts_count = len(self.w3.eth.accounts)
            except Exception as e:
                logger.error(f"Error fetching blockchain status: {e}")

        return {
            'connected': connected,
            'rpc_url': self.rpc_url,
            'network': f"Hardhat Local (Chain ID: {chain_id})" if chain_id else "Unavailable",
            'chain_id': chain_id,
            'block_number': block_number,
            'contract_address': self.contract_address,
            'accounts_available': accounts_count,
            'operator_account': self.account.address if self.account else None
        }

    def get_contract(self):
        if not self.is_connected():
            return None
        return self.w3.eth.contract(
            address=Web3.to_checksum_address(self.contract_address),
            abi=CONTRACT_ABI
        )

    def create_session_on_chain(self, session_id, class_id="CLASS", subject_id="SUBJECT", teacher_address=None, expiration_time=None):
        """
        Creates/registers an attendance session on the smart contract.
        """
        if not self.is_connected():
            return {'success': False, 'error': 'Blockchain not connected'}

        try:
            contract = self.get_contract()
            if not contract:
                return {'success': False, 'error': 'Contract not loaded'}

            # Check if already exists
            try:
                session_info = contract.functions.sessions(str(session_id)).call()
                if session_info[5]: # exists field
                    return {'success': True, 'message': 'Session already exists on-chain'}
            except Exception:
                pass

            import time
            exp_time = int(expiration_time) if expiration_time else int(time.time() + 86400)
            teacher_addr = teacher_address or (self.account.address if self.account else self.w3.eth.accounts[0])

            if self.account:
                sender_address = self.account.address
                nonce = self.w3.eth.get_transaction_count(sender_address)
                tx = contract.functions.createSession(
                    str(session_id),
                    str(class_id),
                    str(subject_id),
                    Web3.to_checksum_address(teacher_addr),
                    exp_time
                ).build_transaction({
                    'from': sender_address,
                    'nonce': nonce,
                    'gas': 300000,
                    'gasPrice': self.w3.eth.gas_price,
                    'chainId': self.w3.eth.chain_id
                })
                signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            else:
                default_account = self.w3.eth.accounts[0]
                tx_hash = contract.functions.createSession(
                    str(session_id),
                    str(class_id),
                    str(subject_id),
                    Web3.to_checksum_address(teacher_addr),
                    exp_time
                ).transact({'from': default_account})

            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=15)
            return {'success': receipt.status == 1, 'tx_hash': receipt.transactionHash.hex()}
        except Exception as e:
            logger.error(f"Error creating session on chain: {e}")
            return {'success': False, 'error': str(e)}

    def submit_attendance_proof(self, session_id, student_hash_hex, verification_code):
        """
        Submits real attendance transaction to the deployed smart contract.
        Returns: dict(success=bool, tx_hash=str, block_number=int, gas_used=int, error=str)
        """
        if not self.is_connected():
            return {
                'success': False,
                'status': 'FAILED',
                'error': f'Blockchain node unreachable at {self.rpc_url}. Check if Hardhat local node is running.'
            }

        try:
            contract = self.get_contract()
            if not contract:
                return {'success': False, 'status': 'FAILED', 'error': 'Contract could not be initialized'}

            # Ensure session is registered on-chain first
            try:
                session_info = contract.functions.sessions(str(session_id)).call()
                if not session_info[5]: # not exists
                    self.create_session_on_chain(session_id)
            except Exception as e:
                logger.warning(f"Session check warning: {e}")
                self.create_session_on_chain(session_id)

            # Format bytes32
            if isinstance(student_hash_hex, str):
                if student_hash_hex.startswith('0x'):
                    student_bytes32 = bytes.fromhex(student_hash_hex[2:])
                else:
                    student_bytes32 = bytes.fromhex(student_hash_hex)
            else:
                student_bytes32 = student_hash_hex

            # Determine sender account
            if self.account:
                sender_address = self.account.address
                nonce = self.w3.eth.get_transaction_count(sender_address)

                # Build transaction
                tx = contract.functions.markAttendance(
                    str(session_id),
                    student_bytes32,
                    str(verification_code)
                ).build_transaction({
                    'from': sender_address,
                    'nonce': nonce,
                    'gas': 300000,
                    'gasPrice': self.w3.eth.gas_price,
                    'chainId': self.w3.eth.chain_id
                })

                # Sign and send
                signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            else:
                # Use default unlocked hardhat account
                default_account = self.w3.eth.accounts[0]
                tx_hash = contract.functions.markAttendance(
                    str(session_id),
                    student_bytes32,
                    str(verification_code)
                ).transact({'from': default_account})

            # Wait for real confirmation receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=15)
            tx_hash_hex = receipt.transactionHash.hex()
            if not tx_hash_hex.startswith('0x'):
                tx_hash_hex = '0x' + tx_hash_hex

            if receipt.status == 1:
                return {
                    'success': True,
                    'status': 'CONFIRMED',
                    'tx_hash': tx_hash_hex,
                    'block_number': receipt.blockNumber,
                    'gas_used': receipt.gasUsed,
                    'error': None
                }
            else:
                return {
                    'success': False,
                    'status': 'FAILED',
                    'tx_hash': tx_hash_hex,
                    'block_number': receipt.blockNumber,
                    'error': 'Smart contract execution reverted on-chain (possible duplicate scan or invalid session)'
                }

        except Exception as e:
            logger.error(f"Blockchain submission error: {str(e)}")
            return {
                'success': False,
                'status': 'FAILED',
                'tx_hash': None,
                'block_number': None,
                'error': str(e)
            }

    def verify_attendance_on_chain(self, session_id, student_hash_hex):
        """
        Calls on-chain smart contract view function to verify attendance.
        """
        if not self.is_connected():
            return {
                'verified': False,
                'error': f'Blockchain RPC unreachable at {self.rpc_url}'
            }

        try:
            contract = self.get_contract()
            if not contract:
                return {'verified': False, 'error': 'Contract not loaded'}

            if isinstance(student_hash_hex, str):
                if student_hash_hex.startswith('0x'):
                    student_bytes32 = bytes.fromhex(student_hash_hex[2:])
                else:
                    student_bytes32 = bytes.fromhex(student_hash_hex)
            else:
                student_bytes32 = student_hash_hex

            attended, timestamp, marked_by = contract.functions.verifyAttendance(
                str(session_id),
                student_bytes32
            ).call()

            return {
                'verified': attended,
                'timestamp': timestamp,
                'marked_by': marked_by,
                'error': None
            }
        except Exception as e:
            return {
                'verified': False,
                'error': str(e)
            }

    def get_transaction_details(self, tx_hash_hex):
        """
        Retrieves confirmed transaction details and receipt from blockchain node.
        """
        if not self.is_connected():
            return None

        try:
            tx = self.w3.eth.get_transaction(tx_hash_hex)
            receipt = self.w3.eth.get_transaction_receipt(tx_hash_hex)
            return {
                'hash': tx.hash.hex(),
                'block_number': tx.blockNumber,
                'from': tx['from'],
                'to': tx.to,
                'gas': tx.gas,
                'gas_used': receipt.gasUsed if receipt else None,
                'status': 'CONFIRMED' if (receipt and receipt.status == 1) else 'FAILED'
            }
        except Exception as e:
            logger.error(f"Failed to fetch transaction: {e}")
            return None

# Singleton instance
blockchain_service = BlockchainService()
