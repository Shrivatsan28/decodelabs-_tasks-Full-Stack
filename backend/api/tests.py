from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Device, SensorData, Alert

class IoTBackendAPITests(APITestCase):

    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(username='user1', email='user1@test.com', password='password123')
        self.user2 = User.objects.create_user(username='user2', email='user2@test.com', password='password123')

        # Obtain JWT tokens for user1
        login_url = reverse('token_obtain_pair')
        response = self.client.post(login_url, {'username': 'user1', 'password': 'password123'}, format='json')
        self.user1_access_token = response.data['access']
        self.user1_refresh_token = response.data['refresh']

        # Set user1 authorization header as default
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user1_access_token}')

        # Create test devices
        self.device1 = Device.objects.create(
            name='Device 1', type='temperature', serial_number='SN-001', location='Lab A', status='online', owner=self.user1
        )
        self.device2 = Device.objects.create(
            name='Device 2', type='gateway', serial_number='SN-002', location='Lab B', status='offline', owner=self.user2
        )

    # -------------------------------------------------------------------------
    # Authentication Tests
    # -------------------------------------------------------------------------
    def test_user_registration(self):
        url = reverse('auth_register')
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'newpassword123'
        }
        # Clear default authorization to simulate anonymous registration
        self.client.credentials()
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'newuser')

    def test_user_registration_duplicate_email(self):
        url = reverse('auth_register')
        data = {
            'username': 'unique_name',
            'email': 'user1@test.com', # Duplicate email
            'password': 'newpassword123'
        }
        self.client.credentials()
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_login(self):
        url = reverse('token_obtain_pair')
        data = {
            'username': 'user1',
            'password': 'password123'
        }
        self.client.credentials()
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_logout(self):
        url = reverse('auth_logout')
        data = {
            'refresh': self.user1_refresh_token
        }
        # Ensure authenticated request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user1_access_token}')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Successfully logged out.')

        # Verify refresh token is now blacklisted
        refresh_url = reverse('token_refresh')
        response_refresh = self.client.post(refresh_url, {'refresh': self.user1_refresh_token}, format='json')
        self.assertEqual(response_refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------------------
    # Device Tests
    # -------------------------------------------------------------------------
    def test_create_device(self):
        url = reverse('device-list')
        data = {
            'name': 'New Thermostat',
            'type': 'temperature',
            'serial_number': 'SN-TEMP-999',
            'location': 'Server Room',
            'status': 'online'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Thermostat')
        self.assertEqual(response.data['owner']['username'], 'user1')

    def test_list_devices_only_returns_owned(self):
        url = reverse('device-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return device1 (owned by user1), but NOT device2 (owned by user2)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['serial_number'], 'SN-001')

    def test_update_device_success(self):
        url = reverse('device-detail', args=[self.device1.id])
        data = {
            'name': 'Updated Device 1 Name',
            'type': 'temperature',
            'serial_number': 'SN-001',
            'location': 'Lab C',
            'status': 'maintenance'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Device 1 Name')
        self.assertEqual(response.data['status'], 'maintenance')

    def test_update_other_user_device_fails(self):
        url = reverse('device-detail', args=[self.device2.id])
        data = {
            'name': 'Hack Device 2',
            'type': 'gateway',
            'serial_number': 'SN-002',
            'location': 'Lab B',
            'status': 'online'
        }
        response = self.client.put(url, data, format='json')
        # Scoped queryset returns 404 since device2 doesn't exist in user1's queryset
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------------------------------------------------------
    # SensorData Tests
    # -------------------------------------------------------------------------
    def test_add_sensor_data(self):
        url = reverse('sensordata-list')
        data = {
            'device': self.device1.id,
            'temperature': 24.5,
            'humidity': 55.0,
            'pressure': 1013.2,
            'battery_level': 88.0,
            'air_quality': 12.0
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['temperature'], 24.5)

    def test_add_sensor_data_for_unowned_device_fails(self):
        url = reverse('sensordata-list')
        data = {
            'device': self.device2.id, # device2 owned by user2
            'temperature': 24.5,
            'humidity': 55.0
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('device', response.data)

    def test_filter_sensor_data_by_device(self):
        # Create some sensor data
        data1 = SensorData.objects.create(device=self.device1, temperature=20.0, humidity=50.0)
        
        # Verify filtering
        url = reverse('sensordata-list')
        response = self.client.get(url, {'device': self.device1.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['temperature'], 20.0)

    # -------------------------------------------------------------------------
    # Alert Tests
    # -------------------------------------------------------------------------
    def test_create_alert_success(self):
        url = reverse('alert-list')
        data = {
            'device': self.device1.id,
            'alert_type': 'CRITICAL',
            'message': 'Overheat detected on unit.',
            'status': 'UNRESOLVED'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['alert_type'], 'CRITICAL')

    def test_update_alert_status(self):
        alert = Alert.objects.create(
            device=self.device1, alert_type='WARNING', message='Low battery', status='UNRESOLVED'
        )
        url = reverse('alert-detail', args=[alert.id])
        data = {
            'status': 'ACKNOWLEDGED'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ACKNOWLEDGED')

