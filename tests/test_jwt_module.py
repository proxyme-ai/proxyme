import unittest
import jwt

class TestJWTModule(unittest.TestCase):
    def test_encode_decode(self):
        payload = {"sub": "user", "exp": 9999999999, "aud": "client"}
        secret = "test-secret"
        token = jwt.encode(payload, secret, algorithm="HS256")
        decoded = jwt.decode(token, secret, algorithms=["HS256"], audience="client", options={"verify_exp": True})
        self.assertEqual(decoded["sub"], payload["sub"])
        self.assertEqual(decoded["aud"], payload["aud"])

if __name__ == "__main__":
    unittest.main()
