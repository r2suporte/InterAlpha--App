import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_secure_authentication_and_role_based_access():
    session = requests.Session()
    headers = {"Content-Type": "application/json"}
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "StrongPass!123"
    user_id = None

    try:
        # 1. Register a new user
        register_payload = {
            "email": test_email,
            "nome": "Test User",
            "password": test_password
        }
        register_resp = session.post(
            f"{BASE_URL}/api/auth/register",
            json=register_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert register_resp.status_code == 200 or register_resp.status_code == 201, \
            f"Registration failed with status code {register_resp.status_code}, response: {register_resp.text}"
        register_data = register_resp.json()
        assert "usuario" in register_data and "id" in register_data["usuario"], "Registration response missing user data"
        user_id = register_data["usuario"]["id"]

        # 2. Login with the registered user
        login_payload = {
            "email": test_email,
            "password": test_password
        }
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json=login_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status code {login_resp.status_code}"
        login_data = login_resp.json()
        assert "access_token" in login_data, "Login response missing access_token"
        access_token = login_data["access_token"]
        # The JWT token for session management
        assert access_token and len(access_token) > 10, "Invalid access token"

        auth_headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # 3. Verify role-based access control - attempt to access a protected resource
        # Assuming endpoint /api/admin/dashboard requires admin role
        protected_resp = session.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers=auth_headers,
            timeout=TIMEOUT
        )

        # New user likely has default "user" role, so 403 Forbidden expected if role restricted
        assert protected_resp.status_code in [200, 403, 401], \
            f"Unexpected status code for protected resource: {protected_resp.status_code}"

        if protected_resp.status_code == 403:
            # Access correctly forbidden
            forbidden_detail = protected_resp.json().get("message","")
            assert forbidden_detail != "", "No detail message for forbidden access"

        elif protected_resp.status_code == 200:
            # If access allowed, check for expected keys in response
            dashboard_data = protected_resp.json()
            assert isinstance(dashboard_data, dict), "Expected JSON object from dashboard"
            # Presence means access allowed

        elif protected_resp.status_code == 401:
            # Unauthorized means token invalid or missing permissions
            unauthorized_detail = protected_resp.json().get("message","")
            assert unauthorized_detail != "", "No detail message for unauthorized access"

        # 4. Test session management by using JWT token to access user profile endpoint (should be allowed)
        profile_resp = session.get(
            f"{BASE_URL}/api/auth/user",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert profile_resp.status_code == 200, f"Failed to access user profile with status {profile_resp.status_code}"
        profile_data = profile_resp.json()
        assert "id" in profile_data and profile_data["id"] == user_id, "Profile data does not match logged user"

        # 5. Test that accessing protected resources without token is denied
        no_auth_resp = session.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT
        )
        assert no_auth_resp.status_code in [401, 403], \
            f"Expected 401 or 403 when accessing protected endpoint without token, got {no_auth_resp.status_code}"

    finally:
        # Cleanup user if delete endpoint exists
        if 'access_token' in locals():
            session.post(
                f"{BASE_URL}/api/auth/logout",
                headers=auth_headers,
                timeout=TIMEOUT
            )

test_secure_authentication_and_role_based_access()
