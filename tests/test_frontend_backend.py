import os
import subprocess
import time
import threading
import sqlite3
import unittest
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler

from packages.server import proxyme_service
from werkzeug.serving import make_server
from playwright.sync_api import sync_playwright


class FlaskServerThread(threading.Thread):
    def __init__(self, app):
        super().__init__(daemon=True)
        self.server = make_server("127.0.0.1", 5001, app)

    def run(self):
        self.server.serve_forever()

    def shutdown(self):
        self.server.shutdown()


class StaticServerThread(threading.Thread):
    def __init__(self, directory):
        super().__init__(daemon=True)
        handler = partial(SimpleHTTPRequestHandler, directory=directory)
        self.server = HTTPServer(("127.0.0.1", 8000), handler)

    def run(self):
        self.server.serve_forever()

    def shutdown(self):
        self.server.shutdown()


class TestFrontendBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Build frontend
        subprocess.run(["npm", "install"], cwd="frontEndCode", check=True)
        subprocess.run(["npm", "run", "build"], cwd="frontEndCode", check=True)

        # Start static file server
        cls.static_thread = StaticServerThread("frontEndCode/dist")
        cls.static_thread.start()

        # Configure Flask app for testing
        proxyme_service.app.testing = True
        proxyme_service.thread_local.auth_conn = sqlite3.connect(":memory:")
        proxyme_service.thread_local.audit_conn = sqlite3.connect(":memory:")
        proxyme_service.init_db()

        cls.flask_thread = FlaskServerThread(proxyme_service.app)
        cls.flask_thread.start()
        time.sleep(1)

        subprocess.run(["playwright", "install", "chromium"], check=True)

    @classmethod
    def tearDownClass(cls):
        cls.flask_thread.shutdown()
        cls.static_thread.shutdown()

    def test_basic_flow(self):
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto("http://127.0.0.1:8000")
            page.wait_for_load_state("domcontentloaded")

            agent = page.evaluate(
                "async () => {\n" +
                "  const resp = await fetch('http://127.0.0.1:5001/register_agent', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({scopes: ['read']})});\n" +
                "  return await resp.json();\n" +
                "}"
            )
            self.assertIn("client_id", agent)

            delegation = page.evaluate(
                f"async () => {{\n" +
                f"  const resp = await fetch('http://127.0.0.1:5001/delegate', {{method: 'POST', headers: {{'Content-Type': 'application/json'}}, body: JSON.stringify({{'user_id': 'test', 'agent_id': '{agent['client_id']}', 'scopes': ['read']}})}});\n" +
                f"  return await resp.json();\n" +
                f"}}"
            )
            self.assertIn("delegation_token", delegation)

            validation = page.evaluate(
                f"async () => {{\n" +
                f"  const resp = await fetch('http://127.0.0.1:5001/validate_delegation', {{method: 'POST', headers: {{'Content-Type': 'application/json'}}, body: JSON.stringify({{'delegation_token': '{delegation['delegation_token']}'}})}});\n" +
                f"  return await resp.json();\n" +
                f"}}"
            )
            self.assertTrue(validation.get("valid"))
            browser.close()


if __name__ == "__main__":
    unittest.main()
