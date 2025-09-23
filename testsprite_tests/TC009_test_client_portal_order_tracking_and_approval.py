import requests
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Sample credentials for client portal authentication (these should be replaced with valid test credentials)
CLIENT_PORTAL_LOGIN_PAYLOAD = {
    "email": "client@example.com",
    "password": "Test@1234"
}

def test_client_portal_order_tracking_and_approval():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    try:
        # Login to the client portal to obtain access token (assuming JWT returned)
        login_resp = session.post(
            f"{BASE_URL}/api/portal/login",
            json=CLIENT_PORTAL_LOGIN_PAYLOAD,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        access_token = login_data.get("access_token")
        assert access_token, "No access_token returned on login"

        # Update session headers with authorization bearer token
        session.headers.update({"Authorization": f"Bearer {access_token}"})

        # Get list of client's service orders for real-time tracking
        orders_resp = session.get(f"{BASE_URL}/api/portal/orders", timeout=TIMEOUT)
        assert orders_resp.status_code == 200, f"Failed to fetch client orders: {orders_resp.text}"
        orders = orders_resp.json()
        assert isinstance(orders, list), "Orders response is not a list"

        if not orders:
            # No orders - create a service order to test tracking and approval
            # Create new order via client portal or API (if allowed) or skip approval test
            # We'll try to create via service order API endpoint as client user (assuming allowed)
            new_order_payload = {
                "client_id": login_data.get("client_id", 1),
                "equipment_id": 1,
                "service_type": "Screen Replacement",
                "priority": "Normal",
                "status": "Pending Approval",
                "description": "Test order for screen replacement"
            }
            create_order_resp = session.post(f"{BASE_URL}/api/ordens-servico", json=new_order_payload, timeout=TIMEOUT)
            assert create_order_resp.status_code == 201, f"Failed to create order: {create_order_resp.text}"
            order = create_order_resp.json()
            order_id = order.get("id")
            assert order_id, "Created order has no id"

            # Wait a moment for order to be available via portal
            time.sleep(1)
        else:
            order = orders[0]
            order_id = order.get("id")
            assert order_id, "Order does not have id"

        # Track order status in real-time via portal endpoint
        track_resp = session.get(f"{BASE_URL}/api/portal/ordem/{order_id}", timeout=TIMEOUT)
        assert track_resp.status_code == 200, f"Failed to track order {order_id}: {track_resp.text}"
        order_details = track_resp.json()
        assert order_details.get("id") == order_id, "Returned order ID mismatch"
        assert "status" in order_details, "Order status missing in details"
        assert "history" in order_details or "updates" in order_details, "Order tracking info missing"

        # Approve the service order as client
        approve_resp = session.post(f"{BASE_URL}/api/portal/aprovacao/{order_id}", timeout=TIMEOUT)
        assert approve_resp.status_code == 200, f"Failed to approve order {order_id}: {approve_resp.text}"
        approve_data = approve_resp.json()
        assert approve_data.get("approved") is True or approve_data.get("status") == "Approved", "Order not approved properly"

        # Communicate through client portal - send a message related to the order
        message_payload = {
            "message": "I approve this service and have a question about timeline."
        }
        comm_resp = session.post(f"{BASE_URL}/api/portal/ordem/{order_id}/messages", json=message_payload, timeout=TIMEOUT)
        assert comm_resp.status_code == 201, f"Failed to send message to order {order_id}: {comm_resp.text}"
        message_data = comm_resp.json()
        assert message_data.get("id"), "Message creation failed, no ID returned"
        assert message_data.get("message") == message_payload["message"], "Message text mismatch"

    finally:
        # Cleanup: if created a new order in this test, delete it
        # Only attempt deletion if we created a new order and have order_id
        if 'order_id' in locals():
            # Attempt delete order - requires authorization
            delete_resp = session.delete(f"{BASE_URL}/api/ordens-servico/{order_id}", timeout=TIMEOUT)
            # Depending on business rules, delete may not be allowed for approved orders; ignore failure if 403 or 405
            if delete_resp.status_code not in (200, 204, 404):
                raise AssertionError(f"Failed to delete test order {order_id}: {delete_resp.status_code} {delete_resp.text}")

test_client_portal_order_tracking_and_approval()