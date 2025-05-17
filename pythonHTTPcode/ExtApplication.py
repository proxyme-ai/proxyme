import requests

BASE_URL = "http://127.0.0.1:5001"  # Proxyme service URL

def register_ai_agent():
    response = requests.post(f"{BASE_URL}/register_agent", json={"scopes": ["read", "write"]})
    data = response.json()
    return data["client_id"], data["client_secret"]

def request_delegation(user_id, agent_id):
    response = requests.post(f"{BASE_URL}/delegate", json={"user_id": user_id, "agent_id": agent_id, "scopes": ["read"]})
    return response.json()["delegation_token"]

def validate_delegation(token):
    response = requests.post(f"{BASE_URL}/validate_delegation", json={"delegation_token": token})
    return response.json()

def revoke_delegation(token):
    response = requests.post(f"{BASE_URL}/revoke_delegation", json={"delegation_token": token})
    return response.json()

# Usage Example
if __name__ == "__main__":
    try:
        print("Registering AI Agent...")
        client_id, client_secret = register_ai_agent()
        print(f"AI Agent Registered:")
        print(f"  Client ID: {client_id}")
        print(f"  Client Secret: {client_secret}")

        user_id = "12345"
        print(f"\nRequesting delegation token for user {user_id}...")
        delegation_token = request_delegation(user_id, client_id)
        print(f"Delegation Token: {delegation_token}")

        print("\nValidating token...")
        validation_response = validate_delegation(delegation_token)
        print("Validation Response:", validation_response)

        print("\nRevoking token...")
        revoke_response = revoke_delegation(delegation_token)
        print("Revocation Response:", revoke_response)

    except requests.exceptions.RequestException as e:
        print(f"Error: {str(e)}")
        print("Make sure the Proxyme service is running at", BASE_URL)
