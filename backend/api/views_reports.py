import csv
from datetime import timedelta
from django.utils import timezone
from django.http import HttpResponse, StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Avg

# ReportLab Imports
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch

from api.models import Device, SensorData, Alert

class BaseReportView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    report_title = "IoT Telemetry Report"
    days_back = 1
    def perform_content_negotiation(self, request, force=False):
        format_val = request.query_params.get('format')
        if format_val in ['csv', 'pdf']:
            from rest_framework.renderers import JSONRenderer
            return (JSONRenderer(), 'application/json')
        return super().perform_content_negotiation(request, force)

    def get_time_range(self):
        end_time = timezone.now()
        start_time = end_time - timedelta(days=self.days_back)
        return start_time, end_time

    def get_filtered_data(self, request, start_time, end_time):
        # Users can only query sensor data for devices they own
        devices_qs = Device.objects.filter(owner=request.user)
        
        # Filter by specific devices if query param provided
        device_ids_str = request.query_params.get('devices')
        if device_ids_str:
            device_ids = [d.strip() for d in device_ids_str.split(',') if d.strip()]
            devices_qs = devices_qs.filter(id__in=device_ids)
            
        sensor_data_qs = SensorData.objects.filter(
            device__in=devices_qs,
            timestamp__gte=start_time,
            timestamp__lte=end_time
        ).select_related('device').order_by('-timestamp')

        alerts_qs = Alert.objects.filter(
            device__in=devices_qs,
            timestamp__gte=start_time,
            timestamp__lte=end_time
        ).select_related('device').order_by('-timestamp')

        return devices_qs, sensor_data_qs, alerts_qs

    def get(self, request, *args, **kwargs):
        start_time, end_time = self.get_time_range()
        devices, sensor_data, alerts = self.get_filtered_data(request, start_time, end_time)
        format_type = request.query_params.get('format', 'json').lower()

        if format_type == 'csv':
            return self.generate_csv_response(devices, sensor_data)
        elif format_type == 'pdf':
            return self.generate_pdf_response(request.user, start_time, end_time, devices, sensor_data, alerts)
        else:
            return self.generate_json_response(devices, sensor_data, alerts)

    def generate_json_response(self, devices, sensor_data, alerts):
        aggregates = sensor_data.aggregate(
            avg_temp=Avg('temperature'),
            avg_humidity=Avg('humidity'),
            avg_pressure=Avg('pressure'),
            avg_battery=Avg('battery_level'),
            avg_air_quality=Avg('air_quality')
        )

        devices_reporting = list(sensor_data.values_list('device__name', flat=True).distinct())

        alerts_summary = {
            'CRITICAL': alerts.filter(alert_type='CRITICAL').count(),
            'WARNING': alerts.filter(alert_type='WARNING').count(),
            'INFO': alerts.filter(alert_type='INFO').count(),
        }

        data = {
            'report_type': self.report_title,
            'time_span_days': self.days_back,
            'total_sensor_records': sensor_data.count(),
            'devices_in_scope_count': devices.count(),
            'devices_reporting_count': len(devices_reporting),
            'devices_reporting': devices_reporting,
            'metrics_averages': {
                'temperature': round(aggregates['avg_temp'], 2) if aggregates['avg_temp'] is not None else 0.0,
                'humidity': round(aggregates['avg_humidity'], 2) if aggregates['avg_humidity'] is not None else 0.0,
                'pressure': round(aggregates['avg_pressure'], 2) if aggregates['avg_pressure'] is not None else 0.0,
                'battery_level': round(aggregates['avg_battery'], 2) if aggregates['avg_battery'] is not None else 0.0,
                'air_quality': round(aggregates['avg_air_quality'], 2) if aggregates['avg_air_quality'] is not None else 0.0,
            },
            'alerts_count': alerts.count(),
            'alerts_summary': alerts_summary,
        }
        return Response(data, status=status.HTTP_200_OK)

    def generate_csv_response(self, devices, sensor_data):
        response = HttpResponse(content_type='text/csv')
        filename = f"{self.report_title.lower().replace(' ', '_')}_{timezone.now().strftime('%Y%m%d%H%M%S')}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow([
            'Timestamp', 'Device Name', 'Device Serial', 'Location',
            'Temperature (C)', 'Humidity (%)', 'Pressure (bar)', 'Battery Level (%)', 'Air Quality (AQI)'
        ])

        for data in sensor_data:
            local_time = data.timestamp.astimezone(timezone.get_current_timezone())
            writer.writerow([
                local_time.strftime('%Y-%m-%d %H:%M:%S'),
                data.device.name,
                data.device.serial_number,
                data.device.location,
                data.temperature if data.temperature is not None else 'N/A',
                data.humidity if data.humidity is not None else 'N/A',
                data.pressure if data.pressure is not None else 'N/A',
                data.battery_level if data.battery_level is not None else 'N/A',
                data.air_quality if data.air_quality is not None else 'N/A',
            ])

        return response

    def generate_pdf_response(self, user, start_time, end_time, devices, sensor_data, alerts):
        response = HttpResponse(content_type='application/pdf')
        filename = f"{self.report_title.lower().replace(' ', '_')}_{timezone.now().strftime('%Y%m%d%H%M%S')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        # Document Setup
        doc = SimpleDocTemplate(
            response,
            pagesize=letter,
            rightMargin=0.5 * inch, leftMargin=0.5 * inch,
            topMargin=0.5 * inch, bottomMargin=0.5 * inch
        )

        styles = getSampleStyleSheet()

        # Custom Palette (matching the Dark Premium Theme)
        primary_color = colors.HexColor('#0b0f19')  # Deep dark background
        accent_color = colors.HexColor('#00e5ff')   # Neon Cyan
        card_color = colors.HexColor('#151c2c')     # Slate card
        text_white = colors.HexColor('#ffffff')
        text_muted = colors.HexColor('#8a99ad')

        # Custom Paragraph Styles
        styles.add(ParagraphStyle(
            name='PdfTitle',
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=accent_color,
            spaceAfter=4
        ))
        styles.add(ParagraphStyle(
            name='PdfSubtitle',
            fontName='Helvetica',
            fontSize=11,
            leading=14,
            textColor=text_muted,
            spaceAfter=15
        ))
        styles.add(ParagraphStyle(
            name='SectionHeader',
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=text_white,
            spaceBefore=10,
            spaceAfter=8
        ))
        styles.add(ParagraphStyle(
            name='BodyWhite',
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=text_white
        ))
        styles.add(ParagraphStyle(
            name='BodyMuted',
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=text_muted
        ))

        story = []

        # 1. Header Banner
        header_text = f"<b>{self.report_title.upper()}</b>"
        subtitle_text = f"IoT Device Fleet Performance Audit & Telemetry Log"
        
        banner_data = [
            [Paragraph(header_text, styles['PdfTitle'])],
            [Paragraph(subtitle_text, styles['PdfSubtitle'])]
        ]
        banner_table = Table(banner_data, colWidths=[7.5 * inch])
        banner_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), primary_color),
            ('PADDING', (0,0), (-1,-1), 16),
            ('BOTTOMPADDING', (0,1), (-1,1), 16),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(banner_table)
        story.append(Spacer(1, 15))

        # 2. Metadata Section (2-column layout)
        meta_data = [
            [
                Paragraph(f"<b>Operator:</b> {user.username} ({user.email})", styles['BodyWhite']),
                Paragraph(f"<b>Time Period:</b> {start_time.strftime('%Y-%m-%d')} to {end_time.strftime('%Y-%m-%d')}", styles['BodyWhite'])
            ],
            [
                Paragraph(f"<b>Devices in Scope:</b> {devices.count()} provisioned", styles['BodyWhite']),
                Paragraph(f"<b>Generated At:</b> {timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')}", styles['BodyWhite'])
            ]
        ]
        meta_table = Table(meta_data, colWidths=[3.75 * inch, 3.75 * inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), card_color),
            ('PADDING', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 15))

        # 3. Aggregates Table
        story.append(Paragraph("System Telemetry Summary Averages", styles['SectionHeader']))
        aggregates = sensor_data.aggregate(
            avg_temp=Avg('temperature'),
            avg_humidity=Avg('humidity'),
            avg_pressure=Avg('pressure'),
            avg_battery=Avg('battery_level'),
            avg_air_quality=Avg('air_quality')
        )
        
        avg_temp = f"{round(aggregates['avg_temp'], 1)} °C" if aggregates['avg_temp'] is not None else 'N/A'
        avg_humid = f"{round(aggregates['avg_humidity'], 1)} %" if aggregates['avg_humidity'] is not None else 'N/A'
        avg_press = f"{round(aggregates['avg_pressure'], 2)} bar" if aggregates['avg_pressure'] is not None else 'N/A'
        avg_batt = f"{round(aggregates['avg_battery'], 1)} %" if aggregates['avg_battery'] is not None else 'N/A'
        avg_aqi = f"{round(aggregates['avg_air_quality'], 1)}" if aggregates['avg_air_quality'] is not None else 'N/A'

        agg_headers = [
            Paragraph("<b>Sensor Metric</b>", styles['BodyWhite']),
            Paragraph("<b>Calculated Average Value</b>", styles['BodyWhite']),
            Paragraph("<b>Target Operational Boundary</b>", styles['BodyWhite'])
        ]
        agg_rows = [
            agg_headers,
            [Paragraph("Average Temperature", styles['BodyWhite']), Paragraph(avg_temp, styles['BodyWhite']), Paragraph("&lt; 28.0 °C (Safe Room Temp)", styles['BodyMuted'])],
            [Paragraph("Average Humidity", styles['BodyWhite']), Paragraph(avg_humid, styles['BodyWhite']), Paragraph("&gt; 30.0 % (Safe Lower Bound)", styles['BodyMuted'])],
            [Paragraph("Average Pressure", styles['BodyWhite']), Paragraph(avg_press, styles['BodyWhite']), Paragraph("Normal Atmospheric range", styles['BodyMuted'])],
            [Paragraph("Average Battery Level", styles['BodyWhite']), Paragraph(avg_batt, styles['BodyWhite']), Paragraph("&gt; 20.0 % (Critical Power)", styles['BodyMuted'])],
            [Paragraph("Average Air Quality Index", styles['BodyWhite']), Paragraph(avg_aqi, styles['BodyWhite']), Paragraph("&lt; 50.0 AQI (Optimal)", styles['BodyMuted'])],
        ]
        agg_table = Table(agg_rows, colWidths=[2.5 * inch, 2.5 * inch, 2.5 * inch])
        agg_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('PADDING', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#232a3b')),
            ('BACKGROUND', (0,1), (-1,-1), card_color),
        ]))
        story.append(agg_table)
        story.append(Spacer(1, 15))

        # 4. Alerts Logs Section
        story.append(Paragraph(f"Critical System Alerts Logs ({alerts.count()} Raised)", styles['SectionHeader']))
        if alerts.count() == 0:
            story.append(Paragraph("No critical alert warnings logged in this reporting window.", styles['BodyMuted']))
        else:
            alert_headers = [
                Paragraph("<b>Timestamp</b>", styles['BodyWhite']),
                Paragraph("<b>Device Node</b>", styles['BodyWhite']),
                Paragraph("<b>Severity</b>", styles['BodyWhite']),
                Paragraph("<b>Detailed Message</b>", styles['BodyWhite'])
            ]
            alert_rows = [alert_headers]
            for alert in alerts[:8]: # Cap at 8 in PDF for space efficiency
                local_time = alert.timestamp.astimezone(timezone.get_current_timezone())
                alert_rows.append([
                    Paragraph(local_time.strftime('%H:%M:%S'), styles['BodyWhite']),
                    Paragraph(alert.device.name, styles['BodyWhite']),
                    Paragraph(f"<font color='red'><b>{alert.alert_type}</b></font>" if alert.alert_type == 'CRITICAL' else alert.alert_type, styles['BodyWhite']),
                    Paragraph(alert.message, styles['BodyWhite']),
                ])
            alert_table = Table(alert_rows, colWidths=[1.2 * inch, 1.8 * inch, 1.0 * inch, 3.5 * inch])
            alert_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), primary_color),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('PADDING', (0,0), (-1,-1), 6),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#232a3b')),
                ('BACKGROUND', (0,1), (-1,-1), card_color),
            ]))
            story.append(alert_table)
            if alerts.count() > 8:
                story.append(Spacer(1, 4))
                story.append(Paragraph(f"<i>* Showing first 8 alerts. {alerts.count() - 8} more alerts logged in database.</i>", styles['BodyMuted']))

        story.append(Spacer(1, 15))

        # 5. Device Fleet List
        story.append(Paragraph("Fleet Device Configuration Details", styles['SectionHeader']))
        dev_headers = [
            Paragraph("<b>Serial Number</b>", styles['BodyWhite']),
            Paragraph("<b>Device Name</b>", styles['BodyWhite']),
            Paragraph("<b>Hardware Type</b>", styles['BodyWhite']),
            Paragraph("<b>Zone Location</b>", styles['BodyWhite']),
            Paragraph("<b>Status</b>", styles['BodyWhite'])
        ]
        dev_rows = [dev_headers]
        for dev in devices[:10]: # Cap at 10 for space efficiency
            status_text = f"<font color='green'>ONLINE</font>" if dev.status == 'online' else f"<font color='red'>OFFLINE</font>"
            if dev.status == 'maintenance':
                status_text = f"<font color='yellow'>MAINT</font>"
            dev_rows.append([
                Paragraph(dev.serial_number, styles['BodyWhite']),
                Paragraph(dev.name, styles['BodyWhite']),
                Paragraph(dev.type, styles['BodyWhite']),
                Paragraph(dev.location, styles['BodyWhite']),
                Paragraph(status_text, styles['BodyWhite']),
            ])
        dev_table = Table(dev_rows, colWidths=[1.5 * inch, 2.0 * inch, 1.2 * inch, 1.8 * inch, 1.0 * inch])
        dev_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('PADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#232a3b')),
            ('BACKGROUND', (0,1), (-1,-1), card_color),
        ]))
        story.append(dev_table)

        doc.build(story)
        return response

class DailyReportView(BaseReportView):
    report_title = "Daily Fleet Telemetry Audit"
    days_back = 1

class WeeklyReportView(BaseReportView):
    report_title = "Weekly Fleet Telemetry Audit"
    days_back = 7

class MonthlyReportView(BaseReportView):
    report_title = "Monthly Fleet Telemetry Audit"
    days_back = 30
