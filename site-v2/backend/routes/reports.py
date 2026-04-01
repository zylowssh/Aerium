"""
Points de terminaison de rapports pour générer des analyses et des exportations
"""
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from database import db, AlertHistory, Sensor, User
import csv
import io
from functools import wraps

rapports_bp = Blueprint('reports', __name__)


def admin_ou_proprietaire(f):
    """Décorateur pour vérifier si l'utilisateur est admin ou propriétaire du capteur"""
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        id_utilisateur_courant = get_jwt_identity()
        # Gérer le user_id chaîne du JWT
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        user = User.query.get(id_utilisateur_courant)
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        return f(*args, **kwargs)
    
    return decorated


@rapports_bp.route('/export/csv', methods=['GET'])
@admin_ou_proprietaire
def exporter_alertes_csv():
    """Exporter les alertes en fichier CSV"""
    try:
        jours = request.args.get('days', 30, type=int)
        id_utilisateur_courant = get_jwt_identity()
        # Gérer le user_id chaîne du JWT
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        user = User.query.get(id_utilisateur_courant)
        
        # Calculer l'intervalle de dates
        date_fin = datetime.utcnow()
        date_debut = date_fin - timedelta(days=jours)
        
        # Requête d'alertes pour les capteurs de l'utilisateur (ou tous les capteurs pour admin)
        if user and user.role == 'admin':
            capteurs = Sensor.query.all()
        else:
            capteurs = Sensor.query.filter_by(user_id=id_utilisateur_courant).all()
        ids_capteurs = [s.id for s in capteurs]
        
        if not ids_capteurs:
            return jsonify({'error': 'Aucun capteur trouvé'}), 404
        
        alertes = AlertHistory.query.filter(
            AlertHistory.sensor_id.in_(ids_capteurs),
            AlertHistory.created_at >= date_debut,
            AlertHistory.created_at <= date_fin
        ).order_by(AlertHistory.created_at.desc()).all()
        
        # Créer CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Écrire l'en-tête
        writer.writerow([
            'Date/Heure', 'Capteur', 'Localisation', 'Type d\'alerte',
            'Métrique', 'Valeur', 'Seuil', 'Message', 'Statut',
            'Créée le', 'Accusée le', 'Résolue le'
        ])
        
        # Écrire les données
        for alerte in alertes:
            capteur = Sensor.query.get(alerte.sensor_id)
            writer.writerow([
                alerte.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                capteur.name if capteur else 'N/A',
                capteur.location if capteur else 'N/A',
                alerte.alert_type,
                alerte.metric,
                f"{alerte.metric_value:.2f}",
                f"{alerte.threshold_value:.2f}" if alerte.threshold_value else 'N/A',
                alerte.message,
                alerte.status,
                alerte.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                alerte.acknowledged_at.strftime('%Y-%m-%d %H:%M:%S') if alerte.acknowledged_at else '',
                alerte.resolved_at.strftime('%Y-%m-%d %H:%M:%S') if alerte.resolved_at else ''
            ])
        
        # Préparer la réponse
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


@rapports_bp.route('/export/pdf', methods=['GET'])
@admin_ou_proprietaire
def exporter_alertes_pdf():
    """Exporter les alertes en fichier PDF"""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        
        jours = request.args.get('days', 30, type=int)
        id_utilisateur_courant = get_jwt_identity()
        # Gérer le user_id chaîne du JWT
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)
        user = User.query.get(id_utilisateur_courant)
        
        # Calculer l'intervalle de dates
        date_fin = datetime.utcnow()
        date_debut = date_fin - timedelta(days=jours)
        
        # Requête d'alertes pour les capteurs de l'utilisateur (ou tous les capteurs pour admin)
        if user and user.role == 'admin':
            capteurs = Sensor.query.all()
        else:
            capteurs = Sensor.query.filter_by(user_id=id_utilisateur_courant).all()
        ids_capteurs = [s.id for s in capteurs]
        
        if not ids_capteurs:
            return jsonify({'error': 'Aucun capteur trouvé'}), 404
        
        alertes = AlertHistory.query.filter(
            AlertHistory.sensor_id.in_(ids_capteurs),
            AlertHistory.created_at >= date_debut,
            AlertHistory.created_at <= date_fin
        ).order_by(AlertHistory.created_at.desc()).all()
        
        # Créer PDF
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
        
        # Titre
        story.append(Paragraph('Rapport d\'Alertes', title_style))
        story.append(Paragraph(
            f'Période: {date_debut.strftime("%d/%m/%Y")} - {date_fin.strftime("%d/%m/%Y")}',
            styles['Normal']
        ))
        story.append(Spacer(1, 0.3 * inch))
        
        # Résumé
        story.append(Paragraph('Résumé', heading_style))
        donnees_resume = [
            ['Nombre total d\'alertes', str(len(alertes))],
            ['Alertes déclenchées', str(sum(1 for a in alertes if a.status == 'triggered'))],
            ['Alertes accusées', str(sum(1 for a in alertes if a.status == 'acknowledged'))],
            ['Alertes résolues', str(sum(1 for a in alertes if a.status == 'resolved'))],
        ]
        tableau_resume = Table(donnees_resume, colWidths=[3 * inch, 2 * inch])
        tableau_resume.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(tableau_resume)
        story.append(Spacer(1, 0.3 * inch))
        
        # Tableau détaillé des alertes (limiter à 50 récentes pour lisibilité du PDF)
        story.append(Paragraph('Alertes Détaillées', heading_style))
        
        donnees_tableau = [
            ['Date/Heure', 'Capteur', 'Type', 'Métrique', 'Valeur', 'Statut']
        ]
        
        for alerte in alertes[:50]:
            capteur = Sensor.query.get(alerte.sensor_id)
            donnees_tableau.append([
                alerte.created_at.strftime('%d/%m %H:%M'),
                capteur.name if capteur else 'N/A',
                alerte.alert_type,
                alerte.metric,
                f"{alerte.metric_value:.1f}",
                alerte.status
            ])
        
        tableau = Table(donnees_tableau, colWidths=[1.2 * inch, 1.5 * inch, 0.8 * inch, 0.8 * inch, 0.7 * inch, 0.8 * inch])
        tableau.setStyle(TableStyle([
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
        story.append(tableau)
        
        # Construire le PDF
        doc.build(story)
        mem.seek(0)
        
        return send_file(
            mem,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'rapport-alertes-{datetime.utcnow().strftime("%Y-%m-%d")}.pdf'
        )
    
    except ImportError:
        return jsonify({'error': 'Bibliothèque reportlab non installée. Veuillez exécuter: pip install reportlab'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@rapports_bp.route('/stats', methods=['GET'])
@admin_ou_proprietaire
def obtenir_stats_rapport():
    """Obtenir les statistiques d'alertes pour une période"""
    try:
        jours = request.args.get('days', 30, type=int)
        id_utilisateur_courant = get_jwt_identity()
        # Gérer le user_id chaîne du JWT
        if isinstance(id_utilisateur_courant, str):
            id_utilisateur_courant = int(id_utilisateur_courant)

        user = User.query.get(id_utilisateur_courant)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Calculer l'intervalle de dates
        date_fin = datetime.utcnow()
        date_debut = date_fin - timedelta(days=jours)
        
        # Requête d'alertes pour les capteurs de l'utilisateur (ou tous les capteurs pour admin)
        if user.role == 'admin':
            capteurs = Sensor.query.all()
        else:
            capteurs = Sensor.query.filter_by(user_id=id_utilisateur_courant).all()
        ids_capteurs = [s.id for s in capteurs]
        
        if not ids_capteurs:
            return jsonify({
                'totalAlerts': 0,
                'triggered': 0,
                'acknowledged': 0,
                'resolved': 0,
                'byType': {},
                'byMetric': {}
            }), 200
        
        alertes = AlertHistory.query.filter(
            AlertHistory.sensor_id.in_(ids_capteurs),
            AlertHistory.created_at >= date_debut,
            AlertHistory.created_at <= date_fin
        ).all()
        
        # Calculer les stats
        par_type = {}
        par_metrique = {}
        comptages_statut = {
            'triggered': 0,
            'acknowledged': 0,
            'resolved': 0
        }
        
        for alerte in alertes:
            # Par type
            type_alerte = alerte.alert_type
            par_type[type_alerte] = par_type.get(type_alerte, 0) + 1
            
            # Par métrique
            metrique = alerte.metric
            par_metrique[metrique] = par_metrique.get(metrique, 0) + 1
            
            # Par statut
            if alerte.status in comptages_statut:
                comptages_statut[alerte.status] += 1
        
        return jsonify({
            'totalAlerts': len(alertes),
            'triggered': comptages_statut['triggered'],
            'acknowledged': comptages_statut['acknowledged'],
            'resolved': comptages_statut['resolved'],
            'byType': par_type,
            'byMetric': par_metrique
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
