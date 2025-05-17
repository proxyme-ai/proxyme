import base64
import json
import time
import hmac
import hashlib

class ExpiredSignatureError(Exception):
    pass

class InvalidTokenError(Exception):
    pass

def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def _b64decode(data: str) -> bytes:
    padding = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)

def encode(payload: dict, key: str, algorithm: str = "HS256") -> str:
    header = {"alg": algorithm, "typ": "JWT"}
    segments = [
        _b64encode(json.dumps(header, separators=(",", ":")).encode()),
        _b64encode(json.dumps(payload, separators=(",", ":")).encode())
    ]
    signing_input = '.'.join(segments).encode()
    if algorithm == "HS256":
        sig = hmac.new(key.encode(), signing_input, hashlib.sha256).digest()
    else:
        raise NotImplementedError("Only HS256 supported")
    segments.append(_b64encode(sig))
    return '.'.join(segments)

def decode(token: str, key: str = None, algorithms=None, audience=None, options=None, **kwargs):
    options = options or {}
    algorithms = algorithms or ["HS256"]
    try:
        header_b64, payload_b64, signature_b64 = token.split('.')
    except ValueError:
        raise InvalidTokenError('Invalid token')
    header = json.loads(_b64decode(header_b64))
    payload = json.loads(_b64decode(payload_b64))
    signature = _b64decode(signature_b64)

    if header.get('alg') not in algorithms:
        raise InvalidTokenError('Algorithm not allowed')

    if key and options.get('verify_signature', True):
        if header['alg'] == 'HS256':
            expected = hmac.new(key.encode(), f'{header_b64}.{payload_b64}'.encode(), hashlib.sha256).digest()
        else:
            raise NotImplementedError('Only HS256 supported')
        if not hmac.compare_digest(expected, signature):
            raise InvalidTokenError('Signature verification failed')

    if options.get('verify_exp', True) and 'exp' in payload:
        if int(payload['exp']) < int(time.time()):
            raise ExpiredSignatureError('Token expired')

    if options.get('verify_aud', False) and audience is not None:
        if payload.get('aud') != audience:
            raise InvalidTokenError('Invalid audience')

    return payload
