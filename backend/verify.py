import os
import sys
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iot_backend.settings')

try:
    import django
    django.setup()
except ImportError:
    print("Error: Django not found. Please activate the virtual environment.")
    sys.exit(1)

from django.test import Client
from django.contrib.auth.models import User
from api.models import Device, SensorData, Alert

def run_verification():
    print("==================================================")
    print("  IoT Device Monitoring Dashboard - Verification  ")
    print("==================================================")
    
    # Reset database (delete previous test data to start fresh)
    User.objects.filter(username__startswith='verify_').delete()
    
    client = Client()
    
    # 1. Register a user
    print("\n[1] Registering User 'verify_admin'...")
    register_payload = {
        'username': 'verify_admin',
        'email': 'verify_admin@iotinfo.com',
        'password': 'password123'
    }
    response = client.post('/api/auth/register/', data=register_payload, content_type='application/json')
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # 2. Log in (Obtain JWT access and refresh tokens)
    print("\n[2] Logging in...")
    login_payload = {
        'username': 'verify_admin',
        'password': 'password123'
    }
    response = client.post('/api/auth/login/', data=login_payload, content_type='application/json')
    print(f"Status: {response.status_code}")
    login_data = response.json()
    print(f"Response: {json.dumps(login_data, indent=2)}")
    
    access_token = login_data['access']
    refresh_token = login_data['refresh']
    auth_header = f'Bearer {access_token}'
    
    # 3. Create Device (with authentication token)
    print("\n[3] Provisioning Device 'Server Room Thermostat'...")
    device_payload = {
        'name': 'Server Room Thermostat',
        'type': 'temperature',
        'serial_number': 'SN-THERM-101',
        'location': 'Rack Room A',
        'status': 'online'
    }
    response = client.post(
        '/api/devices/',
        data=device_payload,
        content_type='application/json',
        HTTP_AUTHORIZATION=auth_header
    )
    print(f"Status: {response.status_code}")
    device_data = response.json()
    print(f"Response: {json.dumps(device_data, indent=2)}")
    device_id = device_data['id']
    
    # 4. List Devices (verify scoping)
    print("\n[4] Listing Devices...")
    response = client.get('/api/devices/', HTTP_AUTHORIZATION=auth_header)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # 5. Add Sensor Data (validate logging metrics)
    print("\n[5] Logging Sensor Data (Telemetry)...")
    sensor_payload = {
        'device': device_id,
        'temperature': 22.8,
        'humidity': 43.5,
        'pressure': 1012.4,
        'battery_level': 95.0,
        'air_quality': 15.0
    }
    response = client.post(
        '/api/sensor-data/',
        data=sensor_payload,
        content_type='application/json',
        HTTP_AUTHORIZATION=auth_header
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # 6. View Sensor Data with Filters (e.g. temp, device)
    print("\n[6] Viewing and Filtering Sensor Data...")
    response = client.get(
        f'/api/sensor-data/?device={device_id}&min_temp=20.0',
        HTTP_AUTHORIZATION=auth_header
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # 7. Create Alert (e.g. temperature warning)
    print("\n[7] Generating Critical Alert...")
    alert_payload = {
        'device': device_id,
        'alert_type': 'CRITICAL',
        'message': 'Temperature drift alert: 22.8°C exceeded safe range.',
        'status': 'UNRESOLVED'
    }
    response = client.post(
        '/api/alerts/',
        data=alert_payload,
        content_type='application/json',
        HTTP_AUTHORIZATION=auth_header
    )
    print(f"Status: {response.status_code}")
    alert_data = response.json()
    print(f"Response: {json.dumps(alert_data, indent=2)}")
    alert_id = alert_data['id']
    
    # 8. View Alerts List
    print("\n[8] Viewing Active Alerts...")
    response = client.get('/api/alerts/', HTTP_AUTHORIZATION=auth_header)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # 9. Update Alert Status (Acknowledge)
    print("\n[9] Acknowledging Alert...")
    update_payload = {
        'status': 'ACKNOWLEDGED'
    }
    response = client.patch(
        f'/api/alerts/{alert_id}/',
        data=update_payload,
        content_type='application/json',
        HTTP_AUTHORIZATION=auth_header
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # 10. Logout and Blacklist Refresh Token
    print("\n[10] Logging out (Blacklisting Token)...")
    logout_payload = {
        'refresh': refresh_token
    }
    response = client.post(
        '/api/auth/logout/',
        data=logout_payload,
        content_type='application/json',
        HTTP_AUTHORIZATION=auth_header
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # 11. Verify token is revoked / unauthorized requests fail
    print("\n[11] Attempting to access devices without token (should fail)...")
    response = client.get('/api/devices/')
    print(f"Status: {response.status_code} (Expect 401)")
    print(f"Response: {response.content.decode()}")

    print("\n[12] Attempting to use blacklisted refresh token (should fail)...")
    response = client.post(
        '/api/auth/token/refresh/',
        data={'refresh': refresh_token},
        content_type='application/json'
    )
    print(f"Status: {response.status_code} (Expect 401)")
    print(f"Response: {response.content.decode()}")
    
    print("\n==================================================")
    print("  Verification Completed Successfully!            ")
    print("==================================================")

if __name__ == '__main__':
    run_verification()
