import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_apple_equipment_registration_and_tracking():
    headers = {
        "Content-Type": "application/json"
    }

    # Adjusted Apple equipment payload to match expected API schema
    equipment_data = {
        "type": "iPhone",
        "model": "iPhone 14 Pro",
        "serial": "SN1234567890"
    }

    equipment_id = None

    try:
        # Register new Apple equipment
        response = requests.post(
            f"{BASE_URL}/api/equipamentos",
            json=equipment_data,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        created_equipment = response.json()
        equipment_id = created_equipment.get("id")
        assert equipment_id is not None, "Equipment ID should be returned after creation"
        assert created_equipment["type"] == equipment_data["type"]
        assert created_equipment["model"] == equipment_data["model"]
        assert created_equipment["serial"] == equipment_data["serial"]

        # Retrieve the registered equipment details
        get_response = requests.get(
            f"{BASE_URL}/api/equipamentos/{equipment_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert get_response.status_code == 200, f"Expected 200 OK on get, got {get_response.status_code}"
        fetched_equipment = get_response.json()
        assert fetched_equipment["id"] == equipment_id
        assert fetched_equipment["type"] == equipment_data["type"]
        assert fetched_equipment["model"] == equipment_data["model"]
        assert fetched_equipment["serial"] == equipment_data["serial"]

        # Update the warranty status
        update_payload = {
            "warranty_status": "expired"
        }
        update_response = requests.put(
            f"{BASE_URL}/api/equipamentos/{equipment_id}",
            json=update_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert update_response.status_code == 200, f"Expected 200 OK on update, got {update_response.status_code}"
        updated_equipment = update_response.json()
        assert updated_equipment.get("warranty_status") == "expired"

        # Add a new repair record to the repair history
        new_repair = {
            "date": "2024-09-12",
            "description": "Camera repair",
            "cost": 149.99
        }

        # Retrieve current repair history or empty list
        current_repair_history = updated_equipment.get("repair_history", [])

        repair_update_payload = {
            "repair_history": current_repair_history + [new_repair]
        }
        repair_update_response = requests.put(
            f"{BASE_URL}/api/equipamentos/{equipment_id}",
            json=repair_update_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert repair_update_response.status_code == 200, f"Expected 200 OK on repair update, got {repair_update_response.status_code}"
        repaired_equipment = repair_update_response.json()
        assert isinstance(repaired_equipment.get("repair_history"), list)
        assert len(repaired_equipment["repair_history"]) == len(current_repair_history) + 1
        assert repaired_equipment["repair_history"][-1]["description"] == "Camera repair"

    finally:
        # Clean up the created equipment
        if equipment_id:
            delete_response = requests.delete(
                f"{BASE_URL}/api/equipamentos/{equipment_id}",
                headers=headers,
                timeout=TIMEOUT
            )
            assert delete_response.status_code in (200, 204), f"Expected 200 or 204 No Content on delete, got {delete_response.status_code}"

test_apple_equipment_registration_and_tracking()
