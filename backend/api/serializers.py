from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Device, SensorData, Alert

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class UserRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class DeviceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    latest_metrics = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = ('id', 'name', 'type', 'serial_number', 'location', 'status', 'owner', 'created_at', 'updated_at', 'latest_metrics')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_latest_metrics(self, obj):
        latest = obj.sensor_data.order_by('-timestamp').first()
        if latest:
            # Map fields based on device type to fit what frontend SPA expects
            metrics = {
                'battery_level': latest.battery_level,
                'air_quality': latest.air_quality,
            }
            if obj.type == 'temperature':
                metrics['temp'] = latest.temperature
                metrics['humidity'] = latest.humidity
            elif obj.type == 'gateway':
                metrics['voltage'] = latest.pressure
                metrics['load'] = latest.humidity
            elif obj.type == 'vibration':
                metrics['vibration'] = latest.temperature
                metrics['speed'] = latest.humidity
            elif obj.type == 'pressure':
                metrics['pressure'] = latest.pressure
                metrics['flowRate'] = latest.humidity
            return metrics
        
        # If no metrics recorded yet, seed sensible offline/default metrics
        return None

    def validate_status(self, value):
        allowed_statuses = ['online', 'offline', 'maintenance']
        if value.lower() not in allowed_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(allowed_statuses)}")
        return value.lower()

class SensorDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorData
        fields = ('id', 'device', 'temperature', 'humidity', 'pressure', 'battery_level', 'air_quality', 'timestamp')
        read_only_fields = ('id',)

    def validate_device(self, value):
        request = self.context.get('request')
        if request and request.user:
            if value.owner != request.user:
                raise serializers.ValidationError("You do not own this device.")
        return value

class AlertSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)

    class Meta:
        model = Alert
        fields = ('id', 'device', 'device_name', 'alert_type', 'message', 'status', 'timestamp')
        read_only_fields = ('id', 'timestamp')

    def validate_device(self, value):
        request = self.context.get('request')
        if request and request.user:
            if value.owner != request.user:
                raise serializers.ValidationError("You do not own this device.")
        return value

    def validate_status(self, value):
        allowed_statuses = ['UNRESOLVED', 'ACKNOWLEDGED', 'RESOLVED']
        if value.upper() not in allowed_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(allowed_statuses)}")
        return value.upper()
