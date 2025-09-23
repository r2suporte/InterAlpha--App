import requests

BASE_URL = "http://localhost:3000"
HEADERS = {
    "Content-Type": "application/json",
}

TIMEOUT = 30

def test_financial_system_operations_and_reporting():
    payment_id = None
    try:
        # 1. Create a payment with multiple payment methods
        payment_payload = {
            "valor": 1500.00,
            "moeda": "BRL",
            "metodos": [
                {"tipo": "credit_card", "detalhes": {"numero_cartao": "4111111111111111", "validade": "12/25", "cvv": "123"}},
                {"tipo": "boleto", "detalhes": {"data_vencimento": "2025-10-10"}}
            ],
            "status": "pendente",
            "descricao": "Test payment for service order #12345"
        }
        response = requests.post(f"{BASE_URL}/api/dashboard/pagamentos", json=payment_payload, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 201, f"Failed to create payment: {response.text}"
        payment = response.json()
        payment_id = payment.get("id")
        assert payment_id is not None, "Payment ID not returned"

        # 2. Update the payment status to 'completed'
        update_payload = {"status": "concluido"}
        response = requests.put(f"{BASE_URL}/api/dashboard/pagamentos/{payment_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200, f"Failed to update payment status: {response.text}"
        updated_payment = response.json()
        assert updated_payment.get("status") == "concluido", "Payment status did not update to completed"

        # 3. Retrieve financial status summary
        response = requests.get(f"{BASE_URL}/api/financeiro/status", headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 200, f"Failed to retrieve financial status: {response.text}"
        status_data = response.json()
        assert "total_pagamentos" in status_data, "Missing total_pagamentos in status"
        assert "pagamentos_pendentes" in status_data, "Missing pagamentos_pendentes in status"
        assert isinstance(status_data["total_pagamentos"], (int, float)), "total_pagamentos should be numeric"

        # 4. Generate financial reports
        report_params = {"tipoRelatorio": "mensal", "mes": "2025-09"}
        response = requests.get(f"{BASE_URL}/api/financeiro/relatorios", headers=HEADERS, params=report_params, timeout=TIMEOUT)
        assert response.status_code == 200, f"Failed to generate financial report: {response.text}"
        report = response.json()
        assert "idRelatorio" in report, "Report ID missing"
        assert "dados" in report, "Report data missing"
        assert isinstance(report["dados"], list), "Report data should be a list"

    finally:
        # Cleanup: delete the created payment if exists
        if payment_id:
            try:
                response = requests.delete(f"{BASE_URL}/api/dashboard/pagamentos/{payment_id}", headers=HEADERS, timeout=TIMEOUT)
                # It's acceptable if the resource is already deleted or not found
                assert response.status_code in (200, 204, 404), f"Cleanup failed to delete payment: {response.text}"
            except Exception:
                pass

test_financial_system_operations_and_reporting()
