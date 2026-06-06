from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Device(models.Model):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=100)  # e.g. temperature, gateway, vibration, pressure
    serial_number = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='offline')  # e.g. online, offline, maintenance
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.serial_number})"

class SensorData(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='sensor_data')
    temperature = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)
    pressure = models.FloatField(null=True, blank=True)
    battery_level = models.FloatField(null=True, blank=True)
    air_quality = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"SensorData for {self.device.name} at {self.timestamp}"

class Alert(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=100)  # e.g. CRITICAL, WARNING, INFO
    message = models.TextField()
    status = models.CharField(max_length=50, default='UNRESOLVED')  # e.g. UNRESOLVED, ACKNOWLEDGED, RESOLVED
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Alert {self.alert_type} on {self.device.name}: {self.message[:30]}"


# ==============================================================================
# Signals for Automated System Alerts
# ==============================================================================
from datetime import timedelta
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

# Import email notification service
from .email_service import send_alert_email, send_device_status_email

@receiver(post_save, sender=SensorData)
def monitor_sensor_thresholds(sender, instance, created, **kwargs):
    if not created:
        return
    
    # 1. Temperature Alert (> 28.0 C)
    if instance.temperature is not None and instance.temperature > 28.0:
        time_threshold = timezone.now() - timedelta(minutes=5)
        exists = Alert.objects.filter(
            device=instance.device,
            alert_type='CRITICAL',
            message__startswith="Temperature threshold exceeded",
            status='UNRESOLVED',
            timestamp__gte=time_threshold
        ).exists()
        if not exists:
            alert = Alert.objects.create(
                device=instance.device,
                alert_type='CRITICAL',
                message=f"Temperature threshold exceeded: {instance.temperature}°C (Limit: 28.0°C)",
                status='UNRESOLVED'
            )
            send_alert_email(alert)

    # 2. Humidity Alert (< 30.0 %)
    if instance.humidity is not None and instance.humidity < 30.0:
        time_threshold = timezone.now() - timedelta(minutes=5)
        exists = Alert.objects.filter(
            device=instance.device,
            alert_type='WARNING',
            message__startswith="Humidity boundary warning",
            status='UNRESOLVED',
            timestamp__gte=time_threshold
        ).exists()
        if not exists:
            alert = Alert.objects.create(
                device=instance.device,
                alert_type='WARNING',
                message=f"Humidity boundary warning: {instance.humidity}% (Limit: 30.0%)",
                status='UNRESOLVED'
            )
            send_alert_email(alert)

    # 3. Battery Alert (< 20.0 %)
    if instance.battery_level is not None and instance.battery_level < 20.0:
        time_threshold = timezone.now() - timedelta(minutes=15)
        exists = Alert.objects.filter(
            device=instance.device,
            alert_type='WARNING',
            message__startswith="Critical low battery warning",
            status='UNRESOLVED',
            timestamp__gte=time_threshold
        ).exists()
        if not exists:
            alert = Alert.objects.create(
                device=instance.device,
                alert_type='WARNING',
                message=f"Critical low battery warning: {instance.battery_level}% (Limit: 20.0%)",
                status='UNRESOLVED'
            )
            send_alert_email(alert)

@receiver(pre_save, sender=Device)
def monitor_device_status_changes(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_instance = Device.objects.get(pk=instance.pk)
        if old_instance.status != instance.status:
            # Send device status change email notification
            send_device_status_email(instance, old_instance.status, instance.status)
            if instance.status == 'offline':
                Alert.objects.create(
                    device=instance,
                    alert_type='CRITICAL',
                    message=f"Device went offline: Heartbeat lost for {instance.name}",
                    status='UNRESOLVED'
                )
            elif instance.status == 'online':
                Alert.objects.create(
                    device=instance,
                    alert_type='INFO',
                    message=f"Device online: Connection re-established for {instance.name}",
                    status='UNRESOLVED'
                )
    except Device.DoesNotExist:
        pass


