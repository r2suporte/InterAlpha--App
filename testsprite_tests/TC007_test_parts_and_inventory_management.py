import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
}

def test_parts_and_inventory_management():
    part_id = None
    try:
        # Step 1: Create a new part with cost, warranty
        part_payload = {
            "name": "Battery iPhone 13 Pro Max",
            "description": "Original Apple battery for iPhone 13 Pro Max",
            "cost": 120.50,
            "warranty_months": 12,
            "stock_quantity": 50
        }
        part_resp = requests.post(
            f"{BASE_URL}/api/pecas",
            json=part_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert part_resp.status_code == 201, f"Part creation failed: {part_resp.text}"
        part_data = part_resp.json()
        assert "id" in part_data, "Part creation response missing 'id'"
        part_id = part_data["id"]

        # Step 2: Retrieve the created part to verify data
        get_part_resp = requests.get(
            f"{BASE_URL}/api/pecas/{part_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_part_resp.status_code == 200, f"Failed to get part: {get_part_resp.text}"
        retrieved_part = get_part_resp.json()
        assert retrieved_part["name"] == part_payload["name"], "Part name mismatch"
        assert float(retrieved_part["cost"]) == part_payload["cost"], "Part cost mismatch"
        assert int(retrieved_part["warranty_months"]) == part_payload["warranty_months"], "Warranty months mismatch"
        assert int(retrieved_part["stock_quantity"]) == part_payload["stock_quantity"], "Stock quantity mismatch"

        # Step 3: Update stock quantity to simulate inventory usage
        update_payload = {"stock_quantity": 45}
        update_resp = requests.put(
            f"{BASE_URL}/api/pecas/{part_id}",
            json=update_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert update_resp.status_code == 200, f"Failed to update part stock: {update_resp.text}"
        updated_part = update_resp.json()
        assert int(updated_part["stock_quantity"]) == 45, "Stock quantity update failed"

        # Step 4: List parts and check the created part is present
        list_resp = requests.get(
            f"{BASE_URL}/api/pecas",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert list_resp.status_code == 200, f"Failed to list parts: {list_resp.text}"
        parts_list = list_resp.json()
        assert any(p["id"] == part_id for p in parts_list), "Created part not found in parts list"

        # Step 5: Validate warranty tracking by checking warranty expiry field, assuming api returns warranty_months
        assert "warranty_months" in retrieved_part, "Warranty information missing in part data"

    finally:
        # Cleanup: Delete created part if exists
        if part_id:
            requests.delete(
                f"{BASE_URL}/api/pecas/{part_id}",
                headers=HEADERS,
                timeout=TIMEOUT
            )

test_parts_and_inventory_management()
