import requests
import json

BASE_URL = "http://127.0.0.1:5001"

def register_agent():
    response = requests.post(
        f"{BASE_URL}/register_agent",
        json={"scopes": ["read", "write"]}
    )
    return response.json()

def delegate_token(user_id, agent_id, scopes):
    response = requests.post(
        f"{BASE_URL}/delegate",
        json={
            "user_id": user_id,
            "agent_id": agent_id,
            "scopes": scopes
        }
    )
    return response.json()

if __name__ == "__main__":
    # First register an agent
    print("Registering agent...")
    agent_data = register_agent()
    print("Agent registered:", json.dumps(agent_data, indent=2))
    
    # Then try to delegate a token
    print("\nDelegating token...")
    delegation_data = delegate_token(
        user_id="test_user",
        agent_id=agent_data["client_id"],
        scopes=["read"]
    )
    print("Delegation result:", json.dumps(delegation_data, indent=2)) 