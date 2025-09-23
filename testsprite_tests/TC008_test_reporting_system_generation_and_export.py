import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_reporting_system_generation_and_export():
    session = requests.Session()
    try:
        reports_endpoints = {
            "financial": "/api/reports/financial",
            "sales": "/api/reports/sales",
            "stock": "/api/reports/stock",
            "performance": "/api/reports/performance"
        }

        export_endpoints = {
            "financial": "/api/reports/financial/export",
            "sales": "/api/reports/sales/export",
            "stock": "/api/reports/stock/export",
            "performance": "/api/reports/performance/export"
        }

        headers = {
            "Accept": "application/json"
        }

        for report_type in reports_endpoints:
            # Generate report data - GET request to fetch report data
            r = session.get(f"{BASE_URL}{reports_endpoints[report_type]}", headers=headers, timeout=TIMEOUT)
            assert r.status_code == 200, f"{report_type} report generation failed with status {r.status_code}"
            data = r.json()
            assert isinstance(data, dict) or isinstance(data, list), f"{report_type} report data should be a dict or list"

            # Export report data - GET request to get exported file/data (format: assume CSV or similar)
            re = session.get(f"{BASE_URL}{export_endpoints[report_type]}", headers={"Accept": "application/octet-stream"}, timeout=TIMEOUT)
            assert re.status_code == 200, f"{report_type} report export failed with status {re.status_code}"
            content_type = re.headers.get("Content-Type", "")
            # Accept common export content types such as csv, excel, or pdf
            assert any(ct in content_type for ct in ["text/csv", "application/vnd.ms-excel", "application/pdf", "application/octet-stream"]),\
                f"{report_type} export content type unexpected: {content_type}"
            assert len(re.content) > 0, f"{report_type} export file is empty"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    finally:
        session.close()

test_reporting_system_generation_and_export()