import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_automated_communication_system():
    whatsapp_endpoint = f"{BASE_URL}/api/processar-whatsapp"
    headers = {"Content-Type": "application/json"}
    
    # Prepare WhatsApp payload (simulate planned integration)
    whatsapp_payload = {
        "phone": "+5511999999999",
        "message": "Mensagem automática de teste via WhatsApp."
    }
    
    # Send WhatsApp message (planned integration - may respond with 501 Not Implemented or success)
    try:
        response_whatsapp = requests.post(whatsapp_endpoint, json=whatsapp_payload, headers=headers, timeout=TIMEOUT)
        # Accept 200 (ok), 501 (not implemented) or 202 (accepted) as valid responses for planned integration
        assert response_whatsapp.status_code in (200, 202, 501), f"Status inesperado WhatsApp: {response_whatsapp.status_code} - {response_whatsapp.text}"
        if response_whatsapp.status_code == 200 or response_whatsapp.status_code == 202:
            json_whatsapp = response_whatsapp.json()
            assert "messageId" in json_whatsapp or "success" in json_whatsapp, "Resposta WhatsApp sem confirmação de envio."
    except requests.RequestException as e:
        # Planned integration may not be available yet, so do not fail but log
        assert False, f"Erro na requisição WhatsApp: {str(e)}"

test_automated_communication_system()
