"""
Reports endpoints for generating analytics and exports
"""
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from database import db, AlertHistory, Sensor, User
import csv
import io
from functools import wraps

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


def admin_or_owner(f):
    """Decorator to check if user is admin or owns the sensor"""
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        current_user_id = get_jwt_identity()
        # Handle string user_id from JWT
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return f(*args, **kwargs)
    
    return decorated


@reports_bp.route('/export/csv', methods=['GET'])
@admin_or_owner
def export_alerts_csv():
    """Export alerts as CSV file"""
    try:
        days = request.args.get('days', 30, type=int)
        current_user_id = get_jwt_identity()
        # Handle string user_id from JWT
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        user = User.query.get(current_user_id)
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Query alerts for user's sensors
        sensors = Sensor.query.filter_by(user_id=current_user_id).all()
        sensor_ids = [s.id for s in sensors]
        
        if not sensor_ids:
            return jsonify({'error': 'No sensors found'}), 404
        
        alerts = AlertHistory.query.filter(
            AlertHistory.sensor_id.in_(sensor_ids),
            AlertHistory.created_at >= start_date,
            AlertHistory.created_at <= end_date
        ).order_by(AlertHistory.created_at.desc()).all()
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'Date/Heure', 'Capteur', 'Localisation', 'Type d\'alerte',
            'Métrique', 'Valeur', 'Seuil', 'Message', 'Statut',
            'Créée le', 'Accusée le', 'Résolue le'
        ])
        
        # Write data
        for alert in alerts:
            sensor = Sensor.query.get(alert.sensor_id)
            writer.writerow([
                alert.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                sensor.name if sensor else 'N/A',
                sensor.location if sensor else 'N/A',
                alert.alert_type,
                alert.metric,
                f"{alert.metric_value:.2f}",
                f"{alert.threshold_value:.2f}" if alert.threshold_value else 'N/A',
                alert.message,
                alert.status,
                alert.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                alert.acknowledged_at.strftime('%Y-%m-%d %H:%M:%S') if alert.acknowledged_at else '',
                alert.resolved_at.strftime('%Y-%m-%d %H:%M:%S') if alert.resolved_at else ''
            ])
        
        # Prepare response
        output.seek(0)
        mem = io.BytesIO()
        mem.write(output.getvalue().encode('utf-8-sig'))
        mem.seek(0)
        
        return send_file(
            mem,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'alertes-{datetime.utcnow().strftime("%Y-%m-%d")}.csv'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/export/pdf', methods=['GET'])
@admin_or_owner
def export_alerts_pdf():
    """Export alerts as PDF file"""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        
        days = request.args.get('days', 30, type=int)
        current_user_id = get_jwt_identity()
        # Handle string user_id from JWT
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        user = User.query.get(current_user_id)
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Query alerts for user's sensors
        sensors = Sensor.query.filter_by(user_id=current_user_id).all()
        sensor_ids = [s.id for s in sensors]
        
        if not sensor_ids:
            return jsonify({'error': 'No sensors found'}), 404
        
        alerts = AlertHistory.query.filter(
            AlertHistory.sensor_id.in_(sensor_ids),
            AlertHistory.created_at >= start_date,
            AlertHistory.created_at <= end_date
        ).order_by(AlertHistory.created_at.desc()).all()
        
        # Create PDF
        mem = io.BytesIO()
        doc = SimpleDocTemplate(mem, pagesize=A4)
        story = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=30
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        
        # Title
        story.append(Paragraph('Rapport d\'Alertes', title_style))
        story.append(Paragraph(
            f'Période: {start_date.strftime("%d/%m/%Y")} - {end_date.strftime("%d/%m/%Y")}',
            styles['Normal']
        ))
        story.append(Spacer(1, 0.3 * inch))
        
        # Summary
        story.append(Paragraph('Résumé', heading_style))
        summary_data = [
            ['Nombre total d\'alertes', str(len(alerts))],
            ['Alertes déclenchées', str(sum(1 for a in alerts if a.status == 'triggered'))],
            ['Alertes accusées', str(sum(1 for a in alerts if a.status == 'acknowledged'))],
            ['Alertes résolues', str(sum(1 for a in alerts if a.status == 'resolved'))],
        ]
        summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Detailed alerts table (limit to recent 50 for PDF readability)
        story.append(Paragraph('Alertes Détaillées', heading_style))
        
        table_data = [
            ['Date/Heure', 'Capteur', 'Type', 'Métrique', 'Valeur', 'Statut']
        ]
        
        for alert in alerts[:50]:
            sensor = Sensor.query.get(alert.sensor_id)
            table_data.append([
                alert.created_at.strftime('%d/%m %H:%M'),
                sensor.name if sensor else 'N/A',
                alert.alert_type,
                alert.metric,
                f"{alert.metric_value:.1f}",
                alert.status
            ])
        
        table = Table(table_data, colWidths=[1.2 * inch, 1.5 * inch, 0.8 * inch, 0.8 * inch, 0.7 * inch, 0.8 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        ]))
        story.append(table)
        
        # Build PDF
        doc.build(story)
        mem.seek(0)
        
        return send_file(
            mem,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'rapport-alertes-{datetime.utcnow().strftime("%Y-%m-%d")}.pdf'
        )
    
    except ImportError:
        return jsonify({'error': 'reportlab library not installed. Please run: pip install reportlab'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@reports_bp.route('/stats', methods=['GET'])
@admin_or_owner
def get_report_stats():
    """Get alert statistics for a period"""
    try:
        days = request.args.get('days', 30, type=int)
        current_user_id = get_jwt_identity()
        # Handle string user_id from JWT
        if isinstance(current_user_id, str):
            current_user_id = int(current_user_id)
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Query alerts for user's sensors
        sensors = Sensor.query.filter_by(user_id=current_user_id).all()
        sensor_ids = [s.id for s in sensors]
        
        if not sensor_ids:
            return jsonify({
                'totalAlerts': 0,
                'triggered': 0,
                'acknowledged': 0,
                'resolved': 0,
                'byType': {},
                'byMetric': {}
            }), 200
        
        alerts = AlertHistory.query.filter(
            AlertHistory.sensor_id.in_(sensor_ids),
            AlertHistory.created_at >= start_date,
            AlertHistory.created_at <= end_date
        ).all()
        
        # Calculate stats
        by_type = {}
        by_metric = {}
        status_counts = {
            'triggered': 0,
            'acknowledged': 0,
            'resolved': 0
        }
        
        for alert in alerts:
            # By type
            alert_type = alert.alert_type
            by_type[alert_type] = by_type.get(alert_type, 0) + 1
            
            # By metric
            metric = alert.metric
            by_metric[metric] = by_metric.get(metric, 0) + 1
            
            # By status
            if alert.status in status_counts:
                status_counts[alert.status] += 1
        
        return jsonify({
            'totalAlerts': len(alerts),
            'triggered': status_counts['triggered'],
            'acknowledged': status_counts['acknowledged'],
            'resolved': status_counts['resolved'],
            'byType': by_type,
            'byMetric': by_metric
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
