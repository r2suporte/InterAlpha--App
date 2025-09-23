import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
}

def test_dashboard_administrative_functionality():
    try:
        # 1. Verify Service Orders Endpoint
        service_orders_response = requests.get(f"{BASE_URL}/api/ordens-servico", headers=HEADERS, timeout=TIMEOUT)
        assert service_orders_response.status_code == 200, f"Expected 200 OK for service orders, got {service_orders_response.status_code}"
        service_orders_data = service_orders_response.json()
        # Expecting object/dict instead of list for service orders
        assert isinstance(service_orders_data, dict), "Service orders response is not an object"
        # The orders list might be inside a key like 'data' or similar
        orders_list = None
        if 'data' in service_orders_data and isinstance(service_orders_data['data'], list):
            orders_list = service_orders_data['data']
        else:
            # fallback if raw list
            if isinstance(service_orders_data, list):
                orders_list = service_orders_data
            else:
                orders_list = []
        # Check essential fields presence for first item if list not empty
        if orders_list:
            first_order = orders_list[0]
            assert "id" in first_order, "Service order missing 'id'"
            assert "status" in first_order, "Service order missing 'status'"
            assert "prioridade" in first_order, "Service order missing 'prioridade'"

        # 2. Verify Clients Endpoint
        clients_response = requests.get(f"{BASE_URL}/api/clientes", headers=HEADERS, timeout=TIMEOUT)
        assert clients_response.status_code == 200, f"Expected 200 OK for clients, got {clients_response.status_code}"
        clients_data_raw = clients_response.json()
        clients_data = None
        # Accept object with 'data' key holding list or raw list
        if isinstance(clients_data_raw, dict) and 'data' in clients_data_raw and isinstance(clients_data_raw['data'], list):
            clients_data = clients_data_raw['data']
        elif isinstance(clients_data_raw, list):
            clients_data = clients_data_raw
        else:
            clients_data = []
        assert isinstance(clients_data, list), "Clients response data is not a list"
        if clients_data:
            first_client = clients_data[0]
            assert "id" in first_client, "Client missing 'id'"
            assert "name" in first_client or "nome" in first_client, "Client missing 'name' or 'nome'"

        # 3. Verify Reports Endpoint
        reports_response = requests.get(f"{BASE_URL}/api/relatorios", headers=HEADERS, timeout=TIMEOUT)
        assert reports_response.status_code == 200, f"Expected 200 OK for reports, got {reports_response.status_code}"
        reports_data = reports_response.json()
        assert isinstance(reports_data, dict) or isinstance(reports_data, list), "Reports response is neither dict nor list"

        # Validate interactivity simulation: create, update, and delete a service order as part of dashboard interactivity test
        # First, create a new service order
        new_order_payload = {
            "clientId": None,
            "status": "pending",
            "priority": "normal",
            "description": "Test order created during dashboard test"
        }
        # Try to find a valid client id if clients_data exists
        if clients_data:
            new_order_payload["clientId"] = clients_data[0].get("id") or clients_data[0].get("clienteId") or clients_data[0].get("clientId")
        else:
            # No client found - fail test early - dashboard depends on clients
            assert False, "No clients available to create a service order"

        create_order_resp = requests.post(f"{BASE_URL}/api/ordens-servico", headers=HEADERS, json=new_order_payload, timeout=TIMEOUT)
        assert create_order_resp.status_code in (200, 201), f"Failed to create service order, status: {create_order_resp.status_code}"
        created_order = create_order_resp.json()
        created_order_id = created_order.get("id")
        assert created_order_id is not None, "Created order response missing 'id'"

        # Update the service order status
        update_payload = {"status": "in_progress"}
        update_resp = requests.put(f"{BASE_URL}/api/ordens-servico/{created_order_id}", headers=HEADERS, json=update_payload, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Failed to update service order, status: {update_resp.status_code}"
        updated_order = update_resp.json()
        assert updated_order.get("status") == "in_progress", "Service order status did not update correctly"

    except RequestException as e:
        assert False, f"HTTP request failed: {e}"
    finally:
        # Cleanup: delete the created order if it exists
        try:
            if 'created_order_id' in locals() and created_order_id:
                del_resp = requests.delete(f"{BASE_URL}/api/ordens-servico/{created_order_id}", headers=HEADERS, timeout=TIMEOUT)
                assert del_resp.status_code in (200, 204), f"Failed to delete created service order, status: {del_resp.status_code}"
        except RequestException:
            pass

test_dashboard_administrative_functionality()
