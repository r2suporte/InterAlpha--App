import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Assuming no authentication details provided, skipping auth handling.

def test_service_order_management_endpoints():
    headers = {
        "Content-Type": "application/json",
        # Include Authorization header here if needed, e.g.:
        # "Authorization": "Bearer <token>"
    }

    service_order_id = None
    try:
        # 1. Create a new service order (POST /api/ordens-servico)
        create_payload = {
            "clienteId": "test-cliente-" + str(uuid.uuid4()),
            "equipamentoId": "test-equipamento-" + str(uuid.uuid4()),
            "descricao": "Teste de criação de ordem de serviço",
            "status": "Pendente",
            "prioridade": "Média",
            "tipoServico": "Reparo",
            "dataSolicitacao": "2025-09-13T10:00:00Z"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/ordens-servico",
            headers=headers,
            json=create_payload,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        created_order = create_resp.json()
        service_order_data = created_order.get("data", {})
        service_order_id = service_order_data.get("id")
        print(f"DEBUG: Created order response: {created_order}")
        print(f"DEBUG: Service order data: {service_order_data}")
        print(f"DEBUG: Service order ID: {service_order_id}")
        assert service_order_id is not None, "Service order ID not returned on creation"

        # 1.5. Verify the order was created (GET /api/ordens-servico/{id})
        get_resp = requests.get(
            f"{BASE_URL}/api/ordens-servico/{service_order_id}",
            headers=headers,
            timeout=TIMEOUT,
        )
        print(f"DEBUG: GET response status: {get_resp.status_code}")
        print(f"DEBUG: GET response: {get_resp.text}")

        # 2. Edit the created service order (PUT /api/ordens-servico/{id})
        edit_payload = {
            "descricao": "Atualização da descrição da ordem de serviço",
            "tipoServico": "Troca de peça",
            "prioridade": "Alta"
        }
        edit_resp = requests.put(
            f"{BASE_URL}/api/ordens-servico/{service_order_id}",
            headers=headers,
            json=edit_payload,
            timeout=TIMEOUT,
        )
        assert edit_resp.status_code == 200, f"Expected 200 OK on edit, got {edit_resp.status_code}"
        edited_order = edit_resp.json()
        assert edited_order.get("descricao") == edit_payload["descricao"]
        assert edited_order.get("tipoServico") == edit_payload["tipoServico"]
        assert edited_order.get("prioridade") == edit_payload["prioridade"]

        # 3. Update status (PATCH /api/ordens-servico/{id}/status)
        status_payload = {"status": "Em andamento"}
        status_resp = requests.patch(
            f"{BASE_URL}/api/ordens-servico/{service_order_id}/status",
            headers=headers,
            json=status_payload,
            timeout=TIMEOUT,
        )
        assert status_resp.status_code == 200, f"Expected 200 OK on status update, got {status_resp.status_code}"
        status_data = status_resp.json()
        assert status_data.get("status") == status_payload["status"]

        # 4. Update priority (PATCH /api/ordens-servico/{id}/prioridade)
        priority_payload = {"prioridade": "Urgente"}
        priority_resp = requests.patch(
            f"{BASE_URL}/api/ordens-servico/{service_order_id}/prioridade",
            headers=headers,
            json=priority_payload,
            timeout=TIMEOUT,
        )
        assert priority_resp.status_code == 200, f"Expected 200 OK on priority update, got {priority_resp.status_code}"
        priority_data = priority_resp.json()
        assert priority_data.get("prioridade") == priority_payload["prioridade"]

        # 5. Approve client approval for this order (POST /api/portal/aprovacao/{id})
        approval_payload = {"aprovado": True, "comentario": "Cliente aprovou o serviço."}
        approval_resp = requests.post(
            f"{BASE_URL}/api/portal/aprovacao/{service_order_id}",
            headers=headers,
            json=approval_payload,
            timeout=TIMEOUT,
        )
        assert approval_resp.status_code == 200, f"Expected 200 OK on client approval, got {approval_resp.status_code}"
        approval_data = approval_resp.json()
        assert approval_data.get("aprovado") is True

    finally:
        # Cleanup: delete the created service order if exists
        if service_order_id:
            delete_resp = requests.delete(
                f"{BASE_URL}/api/ordens-servico/{service_order_id}",
                headers=headers,
                timeout=TIMEOUT,
            )
            assert delete_resp.status_code in (200, 204), f"Expected 200/204 on delete, got {delete_resp.status_code}"

test_service_order_management_endpoints()
