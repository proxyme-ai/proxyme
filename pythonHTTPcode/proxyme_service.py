import os
import sqlite3
import logging
import datetime
import jwt
import json
from flask import Flask, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from audit_logger import audit_logger
import threading

# Secure configuration
SECRET_KEY = "development-secret-key"  # Only for testing
DB_FILE = "auth.db"
OIDC_ISSUER = "http://127.0.0.1:5001"  # Your OIDC issuer URL

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# Logging setup
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Thread-local storage for database connections
thread_local = threading.local()

def get_auth_db():
    if not hasattr(thread_local, 'auth_conn'):
        if app.testing:
            from test_proxyme import TestProxyme
            thread_local.auth_conn = TestProxyme.auth_conn
        else:
            thread_local.auth_conn = sqlite3.connect(DB_FILE)
    return thread_local.auth_conn

def get_audit_db():
    if not hasattr(thread_local, 'audit_conn'):
        if app.testing:
            from test_proxyme import TestProxyme
            thread_local.audit_conn = TestProxyme.audit_conn
        else:
            thread_local.audit_conn = sqlite3.connect("audit.db")
    return thread_local.audit_conn

# Initialize SQLite Database
def init_db():
    try:
        conn = get_auth_db()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS clients (
                client_id TEXT PRIMARY KEY,
                client_secret TEXT,
                scopes TEXT,
                redirect_uris TEXT,
                grant_types TEXT,
                response_types TEXT,
                token_endpoint_auth_method TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS revoked_tokens (
                token TEXT PRIMARY KEY,
                revoked_at TEXT NOT NULL
            )
        """)
        conn.commit()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

# Ensure database is initialized before starting the app
init_db()
logger.info("Database initialization completed")

# Store delegation tokens securely
delegations = {}

# Delegation Token Model
class DelegationToken:
    def __init__(self, user_id, agent_id, scopes, expires_in=3600):
        self.user_id = user_id
        self.agent_id = agent_id
        self.scopes = scopes
        self.expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=expires_in)

    def is_valid(self):
        return datetime.datetime.utcnow() < self.expires_at

# Register Agent
@app.route("/register_agent", methods=["POST"])
def register_agent():
    try:
        data = request.json
        logger.debug("Received registration request")
        logger.debug(f"Request data: {data}")

        if not data or 'scopes' not in data:
            return jsonify({"error": "Invalid request data"}), 500

        scopes = data.get("scopes", [])
        client_id = os.urandom(16).hex()
        client_secret = generate_password_hash(os.urandom(32).hex())

        with get_auth_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO clients (client_id, client_secret, scopes)
                VALUES (?, ?, ?)
            """, (client_id, client_secret, ",".join(scopes)))
            conn.commit()

        logger.info(f"AI Agent {client_id} registered with scopes {','.join(scopes)}")
        response = {"client_id": client_id, "client_secret": client_secret}
        logger.debug(f"Sending response: {response}")
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in register_agent: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Issue Delegation Token
@app.route("/delegate", methods=["POST"])
def delegate():
    try:
        data = request.json
        user_id = data.get("user_id")
        agent_id = data.get("agent_id")
        scopes = data.get("scopes", [])

        with get_auth_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT scopes FROM clients WHERE client_id=?", (agent_id,))
            row = cursor.fetchone()

        if not row:
            audit_logger.log_event(
                event_type="token_delegation",
                action="delegate",
                status="error",
                user_id=user_id,
                agent_id=agent_id,
                details={"error": "Invalid agent ID"},
                ip_address=request.remote_addr
            )
            return jsonify({"error": "Invalid agent ID"}), 403

        granted_scopes = row[0].split(",")
        if not set(scopes).issubset(set(granted_scopes)):
            audit_logger.log_event(
                event_type="token_delegation",
                action="delegate",
                status="error",
                user_id=user_id,
                agent_id=agent_id,
                details={"error": "Invalid scope request", "requested_scopes": scopes, "granted_scopes": granted_scopes},
                ip_address=request.remote_addr
            )
            return jsonify({"error": "Invalid scope request"}), 403

        delegation_token = DelegationToken(user_id, agent_id, scopes)
        token_payload = {
            "iss": OIDC_ISSUER,
            "sub": user_id,
            "aud": agent_id,
            "iat": int(datetime.datetime.utcnow().timestamp()),
            "exp": int(delegation_token.expires_at.timestamp()),
            "agent_id": agent_id,
            "scope": " ".join(scopes)
        }
        
        token = jwt.encode(token_payload, SECRET_KEY, algorithm="HS256")
        delegations[token] = delegation_token

        audit_logger.log_event(
            event_type="token_delegation",
            action="delegate",
            status="success",
            user_id=user_id,
            agent_id=agent_id,
            details={"scopes": scopes},
            ip_address=request.remote_addr,
            token_id=token
        )

        logger.info(f"Delegation token issued for agent {agent_id}")
        return jsonify({"delegation_token": token})
    except Exception as e:
        logger.error(f"Error in delegate: {str(e)}", exc_info=True)
        audit_logger.log_event(
            event_type="token_delegation",
            action="delegate",
            status="error",
            user_id=user_id,
            agent_id=agent_id,
            details={"error": str(e)},
            ip_address=request.remote_addr
        )
        return jsonify({"error": str(e)}), 500

# Validate Delegation Token
@app.route("/validate_delegation", methods=["POST"])
def validate_delegation():
    try:
        token = request.json.get("delegation_token")
        logger.debug(f"Validating token: {token}")
        
        if not token:
            logger.debug("No token provided")
            return jsonify({"valid": False, "error": "No token provided"}), 401
        
        try:
            # Add more debug logging
            logger.debug(f"Using SECRET_KEY: {SECRET_KEY}")
            
            # First decode without verification to get the audience
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            audience = unverified_payload.get("aud")
            logger.debug(f"Token audience: {audience}")
            
            # Decode token with less strict options
            payload = jwt.decode(
                token, 
                SECRET_KEY, 
                algorithms=["HS256"],
                audience=audience,  # Set the expected audience
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iss": True,
                    "verify_aud": True,
                    "verify_iat": False,  # Don't verify iat
                    "require": ["exp", "iss", "aud", "sub"]
                }
            )
            logger.debug(f"Token payload: {payload}")
            
            delegation = delegations.get(token)
            logger.debug(f"Found delegation: {delegation}")
            
            if not delegation:
                logger.debug("No delegation found for token")
                audit_logger.log_event(
                    event_type="token_validation",
                    action="validate_delegation",
                    status="error",
                    details={"error": "Invalid or expired token"},
                    ip_address=request.remote_addr,
                    token_id=token
                )
                return jsonify({"valid": False, "error": "Invalid or expired token"}), 401

            if not delegation.is_valid():
                logger.debug("Token has expired")
                audit_logger.log_event(
                    event_type="token_validation",
                    action="validate_delegation",
                    status="error",
                    details={"error": "Invalid or expired token"},
                    ip_address=request.remote_addr,
                    token_id=token
                )
                return jsonify({"valid": False, "error": "Invalid or expired token"}), 401

            # Check if the token is revoked
            with get_auth_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1 FROM revoked_tokens WHERE token=?", (token,))
                if cursor.fetchone():
                    logger.debug("Token is revoked")
                    audit_logger.log_event(
                        event_type="token_validation",
                        action="validate_delegation",
                        status="error",
                        details={"error": "Token revoked"},
                        ip_address=request.remote_addr,
                        token_id=token
                    )
                    return jsonify({"valid": False, "error": "Token revoked"}), 401

            logger.debug("Token is valid")
            audit_logger.log_event(
                event_type="token_validation",
                action="validate_delegation",
                status="success",
                user_id=delegation.user_id,
                agent_id=delegation.agent_id,
                details={"scopes": delegation.scopes},
                ip_address=request.remote_addr,
                token_id=token
            )

            return jsonify({
                "valid": True,
                "user_id": delegation.user_id,
                "agent_id": delegation.agent_id,
                "scopes": delegation.scopes
            })
        except jwt.ExpiredSignatureError:
            logger.debug("Token has expired (JWT)")
            audit_logger.log_event(
                event_type="token_validation",
                action="validate_delegation",
                status="error",
                details={"error": "Token has expired"},
                ip_address=request.remote_addr,
                token_id=token
            )
            return jsonify({"valid": False, "error": "Token has expired"}), 401
        except jwt.InvalidTokenError as e:
            logger.debug(f"Invalid token (JWT): {str(e)}")
            audit_logger.log_event(
                event_type="token_validation",
                action="validate_delegation",
                status="error",
                details={"error": "Invalid token"},
                ip_address=request.remote_addr,
                token_id=token
            )
            return jsonify({"valid": False, "error": "Invalid token"}), 401
            
    except Exception as e:
        logger.error(f"Error in validate_delegation: {str(e)}", exc_info=True)
        audit_logger.log_event(
            event_type="token_validation",
            action="validate_delegation",
            status="error",
            details={"error": str(e)},
            ip_address=request.remote_addr
        )
        return jsonify({"error": str(e)}), 500

# Revoke Delegation Token
@app.route("/revoke_delegation", methods=["POST"])
def revoke_token():
    try:
        token = request.json.get("delegation_token")
        if not token:
            return jsonify({"error": "No token provided"}), 400
            
        revoked_at = datetime.datetime.utcnow().isoformat()

        # Store in database
        with get_auth_db() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("INSERT INTO revoked_tokens (token, revoked_at) VALUES (?, ?)", (token, revoked_at))
                conn.commit()
            except sqlite3.IntegrityError:
                # Token already revoked
                return jsonify({"status": "already_revoked"})

        audit_logger.log_event(
            event_type="token_revocation",
            action="revoke_delegation",
            status="success",
            details={"revoked_at": revoked_at},
            ip_address=request.remote_addr,
            token_id=token
        )

        logger.info("Delegation token revoked for security reasons")
        return jsonify({"status": "revoked"})
    except Exception as e:
        logger.error(f"Error in revoke_token: {str(e)}", exc_info=True)
        audit_logger.log_event(
            event_type="token_revocation",
            action="revoke_delegation",
            status="error",
            details={"error": str(e)},
            ip_address=request.remote_addr
        )
        return jsonify({"error": str(e)}), 500

# OIDC Discovery Endpoint
@app.route("/.well-known/openid-configuration", methods=["GET"])
def oidc_configuration():
    return jsonify({
        "issuer": OIDC_ISSUER,
        "authorization_endpoint": f"{OIDC_ISSUER}/authorize",
        "token_endpoint": f"{OIDC_ISSUER}/token",
        "userinfo_endpoint": f"{OIDC_ISSUER}/userinfo",
        "registration_endpoint": f"{OIDC_ISSUER}/register_agent",
        "jwks_uri": f"{OIDC_ISSUER}/.well-known/jwks.json",
        "response_types_supported": ["code", "token", "id_token"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["HS256"],
        "scopes_supported": ["openid", "profile", "email", "read", "write"],
        "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
        "claims_supported": ["sub", "iss", "aud", "exp", "iat", "agent_id", "scope"]
    })

# Get Audit Logs
@app.route("/audit_logs", methods=["POST"])
def get_audit_logs():
    try:
        data = request.json
        event_type = data.get("event_type")
        user_id = data.get("user_id")
        agent_id = data.get("agent_id")
        status = data.get("status")

        logs = audit_logger.get_events(
            event_type=event_type,
            user_id=user_id,
            agent_id=agent_id,
            status=status,
            limit=100
        )

        return jsonify(logs)
    except Exception as e:
        logger.error(f"Error in get_audit_logs: {str(e)}", exc_info=True)
        audit_logger.log_event(
            event_type="audit_logs",
            action="get_audit_logs",
            status="error",
            details={"error": str(e)},
            ip_address=request.remote_addr
        )
        return jsonify({"error": str(e)}), 500

# Add error handler
@app.errorhandler(Exception)
def handle_error(error):
    logger.error(f"An error occurred: {str(error)}", exc_info=True)
    audit_logger.log_event(
        event_type="system_error",
        action="error_handler",
        status="error",
        details={"error": str(error)},
        ip_address=request.remote_addr
    )
    return jsonify({"error": str(error)}), 500

# Run Flask App
if __name__ == "__main__":
    print("Starting Proxyme service on http://127.0.0.1:5001")
    app.run(debug=True, port=5001)
