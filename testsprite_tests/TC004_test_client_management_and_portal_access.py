import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_client_management_and_portal_access():
    # Client data to register a new client
    client_payload = {
        "nome": "Test Client",
        "email": "testclient@example.com",
        "telefone": "+5511999998888",
        "endereco": "123 Rua Teste, São Paulo, SP, Brazil",
        "cpf_cnpj": "12345678901"
    }

    # Step 1: Register new client
    response = requests.post(f"{BASE_URL}/api/clientes", json=client_payload, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 201, f"Expected 201 Created but got {response.status_code}"
    client = response.json()
    client_id = client.get("id") or client.get("clienteId")
    assert client_id is not None, "Client ID not returned after registration."

    try:
        # Step 2: Retrieve detailed client data
        response = requests.get(f"{BASE_URL}/api/clientes/{client_id}", headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
        client_details = response.json()
        assert client_details.get("id") == client_id, "Client ID mismatch in detailed data."
        assert client_details.get("email") == client_payload["email"], "Client email mismatch in detailed data."

        # Step 3: Update some client data (e.g. telefone)
        updated_telefone = "+5511988887777"
        update_payload = {"telefone": updated_telefone}
        response = requests.put(f"{BASE_URL}/api/clientes/{client_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 OK on update but got {response.status_code}"
        updated_client = response.json()
        assert updated_client.get("telefone") == updated_telefone, "Client telefone not updated."

        # Step 4: Access client portal login (simulate client login)
        portal_login_payload = {"email": client_payload["email"], "password": "dummyPassword123!"}
        # Assumption: Client portal login endpoint exists at /api/portal/login accepting POST
        response = requests.post(f"{BASE_URL}/api/portal/login", json=portal_login_payload, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code in (200, 401, 403), "Unexpected status code on portal login attempt"
        if response.status_code == 200:
            portal_data = response.json()
            token = portal_data.get("token")
            assert token, "Token not returned on portal login."

            auth_headers = HEADERS.copy()
            auth_headers["Authorization"] = f"Bearer {token}"

            # Step 5: Access the client portal dashboard for order tracking & communication
            response = requests.get(f"{BASE_URL}/api/portal/cliente/dashboard", headers=auth_headers, timeout=TIMEOUT)
            assert response.status_code == 200, f"Expected 200 OK accessing client portal dashboard, got {response.status_code}"
            dashboard_data = response.json()
            assert isinstance(dashboard_data, dict), "Dashboard data should be a JSON object."

        # If login unauthorized, test ends here as client portal access denied as expected
    finally:
        # Cleanup - delete the created client
        requests.delete(f"{BASE_URL}/api/clientes/{client_id}", headers=HEADERS, timeout=TIMEOUT)

test_client_management_and_portal_access()
