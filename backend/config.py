import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'bct-qr-attendance-super-secret-key-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-attendance-secure-token-secret-9874')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    # Database: Primary MySQL, fallback to SQLite
    DATABASE_URL = os.getenv('DATABASE_URL')
    if DATABASE_URL:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        db_path = os.path.join(BASE_DIR, 'attendance.db')
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{db_path}'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 280,
        'pool_pre_ping': True,
    } if 'mysql' in SQLALCHEMY_DATABASE_URI else {}

    # Blockchain Configuration
    BLOCKCHAIN_RPC_URL = os.getenv('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545')
    # Default deployed contract address or read from hardhat deployment
    CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS', '0x5FbDB2315678afecb367f032d93F642f64180aa3')
    HARDHAT_PRIVATE_KEY = os.getenv(
        'HARDHAT_PRIVATE_KEY',
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' # Account #0 default local hardhat dev key
    )
    CHAIN_ID = int(os.getenv('CHAIN_ID', '31337'))
