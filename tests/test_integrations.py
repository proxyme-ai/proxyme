import unittest
from packages.integrations import (
    KeycloakIdentityService,
    OktaIdentityService,
    MCPServer,
    OdooCRM,
    RedmineProjectManagement,
)

class TestIntegrationModules(unittest.TestCase):
    def test_identity_services(self):
        keycloak = KeycloakIdentityService()
        okta = OktaIdentityService()
        token1 = keycloak.authenticate("user", "pass")
        token2 = okta.authenticate("user", "pass")
        self.assertEqual(token1.access_token, "keycloak-token")
        self.assertEqual(token2.access_token, "okta-token")

    def test_mcp_server(self):
        server = MCPServer(name="test", base_url="http://localhost")
        self.assertTrue(server.deploy_agent("agent1"))

    def test_crm_tool(self):
        crm = OdooCRM(url="http://crm")
        self.assertTrue(crm.create_contact("name", "email@example.com"))

    def test_project_management(self):
        pm = RedmineProjectManagement(url="http://pm")
        self.assertTrue(pm.create_issue("title", "desc"))

if __name__ == "__main__":
    unittest.main()
