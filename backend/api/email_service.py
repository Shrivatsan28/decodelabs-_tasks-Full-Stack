"""
IoT InFo — Automated Email Notification Service
Sends HTML-formatted emails for login, registration, alerts, and device events.
"""

import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def _send_notification(subject, html_body, recipient_email):
    """
    Internal helper — sends an HTML email with a plain-text fallback.
    Uses Django's configured EMAIL_BACKEND (console for dev, SMTP for prod).
    """
    plain_text = strip_tags(html_body)
    try:
        send_mail(
            subject=subject,
            message=plain_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_body,
            fail_silently=False,
        )
        logger.info(f"[EMAIL] Sent '{subject}' to {recipient_email}")
    except Exception as e:
        logger.error(f"[EMAIL] Failed to send '{subject}' to {recipient_email}: {e}")


# ==============================================================================
# 1. Registration Welcome Email
# ==============================================================================
def send_registration_email(user):
    """Send a welcome email when a new user registers."""
    subject = "🎉 Welcome to IoT InFo — Registration Successful"
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f19; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00e5ff 0%, #2979ff 100%); padding: 30px 40px;">
            <h1 style="margin: 0; color: #000; font-size: 24px;">⚡ IoT InFo</h1>
            <p style="margin: 5px 0 0; color: rgba(0,0,0,0.7); font-size: 14px;">IoT Device Monitoring Dashboard</p>
        </div>
        <div style="padding: 30px 40px;">
            <h2 style="color: #00e5ff; margin-top: 0;">Welcome aboard, {user.username}!</h2>
            <p>Your operator account has been successfully created on the IoT InFo platform.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 6px 6px 0 0; color: #8a99ad; font-size: 13px;">Username</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 6px 6px 0 0; color: #fff; font-weight: 600;">{user.username}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); color: #8a99ad; font-size: 13px;">Email</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); color: #fff; font-weight: 600;">{user.email}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 0 0 6px 6px; color: #8a99ad; font-size: 13px;">Registered At</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 0 0 6px 6px; color: #fff; font-weight: 600;">{timezone.now().strftime('%B %d, %Y at %I:%M %p UTC')}</td>
                </tr>
            </table>
            <p style="color: #8a99ad; font-size: 13px;">You can now log in and start adding IoT devices, monitoring telemetry data, and configuring alerts.</p>
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); color: #8a99ad; font-size: 12px;">
                This is an automated notification from IoT InFo. Do not reply to this email.
            </div>
        </div>
    </div>
    """
    _send_notification(subject, html_body, user.email)


# ==============================================================================
# 2. Login Notification Email
# ==============================================================================
def send_login_email(user, ip_address=None):
    """Send a login notification email when a user signs in."""
    subject = "🔐 IoT InFo — New Login Detected"
    login_time = timezone.now().strftime('%B %d, %Y at %I:%M %p UTC')
    ip_display = ip_address or "Unknown"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f19; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00e5ff 0%, #2979ff 100%); padding: 30px 40px;">
            <h1 style="margin: 0; color: #000; font-size: 24px;">⚡ IoT InFo</h1>
            <p style="margin: 5px 0 0; color: rgba(0,0,0,0.7); font-size: 14px;">Security Notification</p>
        </div>
        <div style="padding: 30px 40px;">
            <h2 style="color: #00e5ff; margin-top: 0;">Login Detected</h2>
            <p>A new login session was initiated on your IoT InFo account.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 6px 6px 0 0; color: #8a99ad; font-size: 13px;">Account</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 6px 6px 0 0; color: #fff; font-weight: 600;">{user.username} ({user.email})</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); color: #8a99ad; font-size: 13px;">Login Time</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); color: #fff; font-weight: 600;">{login_time}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 0 0 6px 6px; color: #8a99ad; font-size: 13px;">IP Address</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 0 0 6px 6px; color: #fff; font-weight: 600;">{ip_display}</td>
                </tr>
            </table>
            <div style="background: rgba(255, 23, 68, 0.1); border: 1px solid rgba(255, 23, 68, 0.2); border-radius: 8px; padding: 15px; margin-top: 15px;">
                <p style="margin: 0; color: #ff6b6b; font-size: 13px;">⚠️ If you did not initiate this login, please change your password immediately and contact the system administrator.</p>
            </div>
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); color: #8a99ad; font-size: 12px;">
                This is an automated security notification from IoT InFo. Do not reply to this email.
            </div>
        </div>
    </div>
    """
    _send_notification(subject, html_body, user.email)


# ==============================================================================
# 3. Device Alert Email
# ==============================================================================
def send_alert_email(alert):
    """Send an email when a critical or warning alert is triggered on a device."""
    device = alert.device
    owner = device.owner

    # Only send email for CRITICAL and WARNING alerts
    if alert.alert_type not in ('CRITICAL', 'WARNING'):
        return

    severity_color = '#ff1744' if alert.alert_type == 'CRITICAL' else '#ffea00'
    severity_label = alert.alert_type

    subject = f"🚨 IoT InFo — {severity_label} Alert on {device.name}"
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f19; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: {severity_color}; padding: 30px 40px;">
            <h1 style="margin: 0; color: #fff; font-size: 24px;">⚡ IoT InFo — {severity_label} ALERT</h1>
            <p style="margin: 5px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Automated Monitoring System</p>
        </div>
        <div style="padding: 30px 40px;">
            <h2 style="color: {severity_color}; margin-top: 0;">{severity_label} Alert Triggered</h2>
            <p style="font-size: 15px; line-height: 1.6;">{alert.message}</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 6px 6px 0 0; color: #8a99ad; font-size: 13px;">Device</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 6px 6px 0 0; color: #fff; font-weight: 600;">{device.name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); color: #8a99ad; font-size: 13px;">Serial Number</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); color: #fff; font-weight: 600;">{device.serial_number}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); color: #8a99ad; font-size: 13px;">Location</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); color: #fff; font-weight: 600;">{device.location}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); color: #8a99ad; font-size: 13px;">Severity</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); color: {severity_color}; font-weight: 700;">{severity_label}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 0 0 6px 6px; color: #8a99ad; font-size: 13px;">Timestamp</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 0 0 6px 6px; color: #fff; font-weight: 600;">{alert.timestamp.strftime('%B %d, %Y at %I:%M %p UTC')}</td>
                </tr>
            </table>
            <p style="color: #8a99ad; font-size: 13px;">Log in to your IoT InFo dashboard to acknowledge this alert and take appropriate action.</p>
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); color: #8a99ad; font-size: 12px;">
                This is an automated alert notification from IoT InFo. Do not reply to this email.
            </div>
        </div>
    </div>
    """
    _send_notification(subject, html_body, owner.email)


# ==============================================================================
# 4. Device Status Change Email
# ==============================================================================
def send_device_status_email(device, old_status, new_status):
    """Send an email when a device goes online or offline."""
    owner = device.owner
    status_color = '#00e676' if new_status == 'online' else '#ff1744'
    status_icon = '🟢' if new_status == 'online' else '🔴'

    subject = f"{status_icon} IoT InFo — Device {device.name} is now {new_status.upper()}"
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f19; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00e5ff 0%, #2979ff 100%); padding: 30px 40px;">
            <h1 style="margin: 0; color: #000; font-size: 24px;">⚡ IoT InFo</h1>
            <p style="margin: 5px 0 0; color: rgba(0,0,0,0.7); font-size: 14px;">Device Status Update</p>
        </div>
        <div style="padding: 30px 40px;">
            <h2 style="color: {status_color}; margin-top: 0;">{status_icon} Device Status Changed</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 6px 6px 0 0; color: #8a99ad; font-size: 13px;">Device</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); border-radius: 6px 6px 0 0; color: #fff; font-weight: 600;">{device.name} ({device.serial_number})</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); color: #8a99ad; font-size: 13px;">Previous Status</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); color: #fff; font-weight: 600;">{old_status.upper()}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); color: #8a99ad; font-size: 13px;">New Status</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.05); color: {status_color}; font-weight: 700;">{new_status.upper()}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); border-radius: 0 0 6px 6px; color: #8a99ad; font-size: 13px;">Time</td>
                    <td style="padding: 10px 15px; background: rgba(255,255,255,0.03); border-radius: 0 0 6px 6px; color: #fff; font-weight: 600;">{timezone.now().strftime('%B %d, %Y at %I:%M %p UTC')}</td>
                </tr>
            </table>
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); color: #8a99ad; font-size: 12px;">
                This is an automated notification from IoT InFo. Do not reply to this email.
            </div>
        </div>
    </div>
    """
    _send_notification(subject, html_body, owner.email)
