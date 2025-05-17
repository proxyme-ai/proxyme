import unittest
import json
import jwt
from packages.server.proxyme_service import (
    app,
    SECRET_KEY,
    OIDC_ISSUER,
    delegations,
    DelegationToken,
)
import sqlite3
import os

class TestProxyme(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create test client
        cls.app = app.test_client()
        cls.app.testing = True
        
        # Use in-memory databases for testing
        cls.auth_conn = sqlite3.connect(':memory:')
        cls.audit_conn = sqlite3.connect(':memory:')
        
        # Initialize test databases
        cls._init_auth_db(cls.auth_conn)
        cls._init_audit_db(cls.audit_conn)

    @classmethod
    def tearDownClass(cls):
        # Close database connections
        cls.auth_conn.close()
        cls.audit_conn.close()

    @classmethod
    def _init_auth_db(cls, conn):
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

    @classmethod
    def _init_audit_db(cls, conn):
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                event_type TEXT NOT NULL,
                action TEXT NOT NULL,
                status TEXT NOT NULL,
                user_id TEXT,
                agent_id TEXT,
                details TEXT,
                ip_address TEXT,
                token_id TEXT
            )
        """)
        conn.commit()

    def setUp(self):
        # Clear test databases before each test
        self._clear_auth_db()
        self._clear_audit_db()
        # Clear delegations dictionary
        delegations.clear()
        # Ensure we're using the same SECRET_KEY
        app.config['SECRET_KEY'] = SECRET_KEY

    def _clear_auth_db(self):
        cursor = self.auth_conn.cursor()
        cursor.execute("DELETE FROM clients")
        cursor.execute("DELETE FROM revoked_tokens")
        self.auth_conn.commit()

    def _clear_audit_db(self):
        cursor = self.audit_conn.cursor()
        cursor.execute("DELETE FROM audit_logs")
        self.audit_conn.commit()

    def test_1_oidc_configuration(self):
        """Test OIDC configuration endpoint"""
        response = self.app.get('/.well-known/openid-configuration')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['issuer'], OIDC_ISSUER)
        self.assertIn('authorization_endpoint', data)
        self.assertIn('token_endpoint', data)
        self.assertIn('scopes_supported', data)

    def test_2_register_agent(self):
        """Test agent registration"""
        # Test successful registration
        response = self.app.post('/register_agent',
            json={'scopes': ['read', 'write']},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('client_id', data)
        self.assertIn('client_secret', data)
        
        # Store client_id for later tests
        self.client_id = data['client_id']
        self.client_secret = data['client_secret']

    def test_3_delegate_token(self):
        """Test token delegation"""
        # First register an agent
        self.test_2_register_agent()
        
        # Test successful delegation
        response = self.app.post('/delegate',
            json={
                'user_id': 'test_user',
                'agent_id': self.client_id,
                'scopes': ['read']
            },
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('delegation_token', data)
        
        # Store token for later tests
        self.delegation_token = data['delegation_token']

    def test_4_validate_token(self):
        """Test token validation"""
        # First get a delegation token
        self.test_3_delegate_token()
        
        # Test successful validation
        response = self.app.post('/validate_delegation',
            json={'delegation_token': self.delegation_token},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['valid'])
        self.assertEqual(data['user_id'], 'test_user')
        self.assertEqual(data['agent_id'], self.client_id)

    def test_5_revoke_token(self):
        """Test token revocation"""
        # First get a delegation token
        self.test_3_delegate_token()
        
        # Test successful revocation
        response = self.app.post('/revoke_delegation',
            json={'delegation_token': self.delegation_token},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'revoked')
        
        # Verify token is invalid after revocation
        response = self.app.post('/validate_delegation',
            json={'delegation_token': self.delegation_token},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertFalse(data['valid'])

    def test_6_audit_logs(self):
        """Test audit logging"""
        # Perform some actions to generate logs
        self.test_2_register_agent()
        self.test_3_delegate_token()
        
        # Test retrieving audit logs
        response = self.app.post('/audit_logs',
            json={},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        logs = json.loads(response.data)
        self.assertIsInstance(logs, list)
        self.assertTrue(len(logs) > 0)

    def test_7_error_cases(self):
        """Test error handling"""
        # Test invalid agent registration
        response = self.app.post('/register_agent',
            json={'invalid': 'data'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 500)

        # Test delegation with invalid agent
        response = self.app.post('/delegate',
            json={
                'user_id': 'test_user',
                'agent_id': 'invalid_agent',
                'scopes': ['read']
            },
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)

        # Test validation of invalid token
        response = self.app.post('/validate_delegation',
            json={'delegation_token': 'invalid_token'},
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

if __name__ == '__main__':
    unittest.main() 