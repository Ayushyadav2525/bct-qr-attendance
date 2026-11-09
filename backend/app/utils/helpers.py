import hashlib
import secrets
import time
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from eth_utils import keccak

SALT = "bct-qr-attendance-academic-2026-secure-salt"

def compute_student_hash(student_id, roll_no):
    """
    Computes a deterministic pseudonymous keccak256 hash for on-chain identity.
    Keeps personal identifiers (names, emails, phones) completely off-chain.
    """
    raw = f"{student_id}:{roll_no}:{SALT}".encode('utf-8')
    digest = keccak(raw)
    return "0x" + digest.hex()

def generate_session_token(subject_code):
    """
    Generates a secure, non-guessable, time-stamped QR session token.
    """
    rand_hex = secrets.token_hex(6).upper()
    timestamp = int(time.time())
    return f"QR-{subject_code}-{timestamp}-{rand_hex}"

from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt

def role_required(*allowed_roles):
    """
    Decorator for checking JWT authentication and required roles.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt() or {}
            role = claims.get('role')
            if not role or role not in allowed_roles:
                return jsonify({
                    'success': False,
                    'error': f'Unauthorized access. Role required: {", ".join(allowed_roles)}'
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


import re
from datetime import datetime

def parse_time_flexible(t_str):
    if not t_str:
        return None
    s = str(t_str).strip()
    s = re.sub(r'\s*([apAP][mM])', r' \1', s).strip()
    for fmt in ('%I:%M %p', '%I:%M%p', '%H:%M:%S', '%H:%M', '%I %p'):
        try:
            return datetime.strptime(s, fmt).time()
        except ValueError:
            pass
    return None

def parse_date_flexible(d_str):
    if not d_str:
        return datetime.utcnow().strftime('%d %B %Y')
    d_str = str(d_str).strip()
    for fmt in ('%Y-%m-%d', '%d %B %Y', '%d-%m-%Y', '%d/%m/%Y', '%B %d, %Y', '%Y/%m/%d'):
        try:
            dt = datetime.strptime(d_str, fmt)
            return dt.strftime('%d %B %Y')
        except ValueError:
            pass
    return d_str

def validate_and_format_lecture_schedule(date_str, start_time_str, end_time_str):
    """
    Validates that:
    1. Lecture date is formatted properly.
    2. Start time and end time are valid time strings.
    3. End time is strictly later than start time.
    Returns (is_valid, error_msg, formatted_date, formatted_start_time, formatted_end_time)
    """
    if not start_time_str or not end_time_str:
        formatted_date = parse_date_flexible(date_str)
        return True, None, formatted_date, "10:00 AM", "11:00 AM"

    start_val = parse_time_flexible(start_time_str)
    if not start_val:
        return False, "Invalid Lecture Start Time format. Use formats such as '10:00 AM' or '10:00'.", None, None, None

    end_val = parse_time_flexible(end_time_str)
    if not end_val:
        return False, "Invalid Lecture End Time format. Use formats such as '11:00 AM' or '11:00'.", None, None, None

    if end_val <= start_val:
        return False, f"Lecture End Time ({end_val.strftime('%I:%M %p')}) must be later than Lecture Start Time ({start_val.strftime('%I:%M %p')}).", None, None, None

    formatted_date = parse_date_flexible(date_str)
    formatted_start = start_val.strftime('%I:%M %p')
    formatted_end = end_val.strftime('%I:%M %p')
    return True, None, formatted_date, formatted_start, formatted_end

