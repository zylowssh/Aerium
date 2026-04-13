"""
Points de terminaison de rapports pour générer des analyses et des exportations
"""
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from database import db, Alert, AlertHistory, Sensor, User
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
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
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
        capteur_par_id = {s.id: s for s in capteurs}
        
        if not ids_capteurs:
            return jsonify({'error': 'Aucun capteur trouvé'}), 404

        def inferer_metrique(message):
            message_normalise = (message or '').lower()
            if 'temp' in message_normalise:
                return 'temperature'
            if 'humid' in message_normalise:
                return 'humidity'
            return 'co2'

        def cle_statut(status):
            mapping = {
                'triggered': 'triggered',
                'nouvelle': 'triggered',
                'acknowledged': 'acknowledged',
                'reconnue': 'acknowledged',
                'resolved': 'resolved',
                'résolue': 'resolved',
                'resolue': 'resolved',
            }
            return mapping.get((status or '').lower(), 'triggered')

        def libelle_statut(status):
            mapping = {
                'triggered': 'Déclenchée',
                'nouvelle': 'Déclenchée',
                'acknowledged': 'Accusée',
                'reconnue': 'Accusée',
                'resolved': 'Résolue',
                'résolue': 'Résolue',
                'resolue': 'Résolue',
            }
            return mapping.get((status or '').lower(), 'Déclenchée')

        alertes_historique = AlertHistory.query.filter(
            AlertHistory.sensor_id.in_(ids_capteurs),
            AlertHistory.created_at >= date_debut,
            AlertHistory.created_at <= date_fin
        ).order_by(AlertHistory.created_at.desc()).all()

        lignes_alertes = []
        source_donnees = 'historique'

        for alerte in alertes_historique:
            capteur = capteur_par_id.get(alerte.sensor_id)
            lignes_alertes.append({
                'created_at': alerte.created_at,
                'sensor_name': capteur.name if capteur else 'N/A',
                'sensor_location': capteur.location if capteur else 'N/A',
                'alert_type': alerte.alert_type,
                'metric': alerte.metric,
                'metric_value': float(alerte.metric_value or 0),
                'status': alerte.status,
                'message': alerte.message,
            })

        if not lignes_alertes:
            source_donnees = 'alertes_actives'
            alertes_actives = Alert.query.filter(
                Alert.sensor_id.in_(ids_capteurs),
                Alert.created_at >= date_debut,
                Alert.created_at <= date_fin
            ).order_by(Alert.created_at.desc()).all()

            for alerte in alertes_actives:
                capteur = capteur_par_id.get(alerte.sensor_id)
                lignes_alertes.append({
                    'created_at': alerte.created_at,
                    'sensor_name': capteur.name if capteur else 'N/A',
                    'sensor_location': capteur.location if capteur else 'N/A',
                    'alert_type': alerte.alert_type,
                    'metric': inferer_metrique(alerte.message),
                    'metric_value': float(alerte.value or 0),
                    'status': alerte.status,
                    'message': alerte.message,
                })

        lignes_alertes.sort(key=lambda a: a['created_at'], reverse=True)

        total_alertes = len(lignes_alertes)
        statuts = {
            'triggered': 0,
            'acknowledged': 0,
            'resolved': 0,
        }
        repartition_types = {}
        repartition_metriques = {}

        for alerte in lignes_alertes:
            statut = cle_statut(alerte['status'])
            statuts[statut] += 1

            type_alerte = str(alerte['alert_type'] or 'inconnu')
            repartition_types[type_alerte] = repartition_types.get(type_alerte, 0) + 1

            metrique = str(alerte['metric'] or 'co2')
            repartition_metriques[metrique] = repartition_metriques.get(metrique, 0) + 1
        
        # Créer PDF
        generated_at = datetime.utcnow()
        mem = io.BytesIO()
        doc = SimpleDocTemplate(
            mem,
            pagesize=A4,
            leftMargin=28,
            rightMargin=28,
            topMargin=30,
            bottomMargin=28,
        )
        story = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=10,
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#475569'),
            spaceAfter=10,
        )
        small_style = ParagraphStyle(
            'SmallMuted',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#64748b'),
            leading=12,
        )
        
        # Titre
        story.append(Paragraph('Rapport d\'Alertes', title_style))
        story.append(Paragraph(
            f'Période: {date_debut.strftime("%d/%m/%Y")} - {date_fin.strftime("%d/%m/%Y")}',
            styles['Normal']
        ))
        story.append(Paragraph(
            f'Généré le {generated_at.strftime("%d/%m/%Y à %H:%M UTC")}',
            small_style,
        ))
        if source_donnees == 'alertes_actives':
            story.append(Paragraph(
                'Note: aucune entrée trouvée dans l\'historique, utilisation des alertes actives pour compléter le rapport.',
                small_style,
            ))
        story.append(Spacer(1, 0.2 * inch))
        
        # Résumé
        story.append(Paragraph('Résumé', heading_style))
        donnees_resume = [
            ['Nombre total d\'alertes', str(total_alertes)],
            ['Alertes déclenchées', str(statuts['triggered'])],
            ['Alertes accusées', str(statuts['acknowledged'])],
            ['Alertes résolues', str(statuts['resolved'])],
            ['Capteurs concernés', str(len({a['sensor_name'] for a in lignes_alertes if a['sensor_name'] != 'N/A'}))],
        ]
        tableau_resume = Table(donnees_resume, colWidths=[3 * inch, 2 * inch])
        tableau_resume.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(tableau_resume)

        if repartition_types:
            story.append(Spacer(1, 0.15 * inch))
            story.append(Paragraph('Répartition des alertes', heading_style))
            donnees_repartition = [['Type', 'Nombre'], *[
                [cle, str(valeur)] for cle, valeur in sorted(repartition_types.items(), key=lambda item: item[1], reverse=True)
            ]]
            tableau_repartition = Table(donnees_repartition, colWidths=[3 * inch, 2 * inch])
            tableau_repartition.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ]))
            story.append(tableau_repartition)

        story.append(Spacer(1, 0.2 * inch))
        
        # Tableau détaillé des alertes (limiter à 80 récentes pour lisibilité)
        story.append(Paragraph('Alertes Détaillées', heading_style))

        if not lignes_alertes:
            story.append(Paragraph('Aucune alerte à afficher pour la période sélectionnée.', styles['Normal']))
        else:
            donnees_tableau = [['Date/Heure', 'Capteur', 'Type', 'Métrique', 'Valeur', 'Statut']]

            for alerte in lignes_alertes[:80]:
                donnees_tableau.append([
                    alerte['created_at'].strftime('%d/%m %H:%M'),
                    alerte['sensor_name'],
                    str(alerte['alert_type']).capitalize(),
                    str(alerte['metric']).upper(),
                    f"{alerte['metric_value']:.1f}",
                    libelle_statut(alerte['status'])
                ])

            tableau = Table(
                donnees_tableau,
                colWidths=[1.15 * inch, 1.6 * inch, 0.95 * inch, 0.95 * inch, 0.8 * inch, 0.9 * inch]
            )
            tableau.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('TOPPADDING', (0, 0), (-1, 0), 8),
                ('ALIGN', (3, 1), (5, -1), 'CENTER'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
            ]))
            story.append(tableau)

            if total_alertes > 80:
                story.append(Spacer(1, 0.1 * inch))
                story.append(Paragraph(
                    f'Note: {total_alertes - 80} alerte(s) supplémentaire(s) non affichée(s) pour préserver la lisibilité du rapport.',
                    small_style,
                ))

        def ajouter_pied_de_page(canvas, doc_instance):
            canvas.saveState()
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(colors.HexColor('#64748b'))
            canvas.drawString(doc.leftMargin, 18, f"Généré le {generated_at.strftime('%d/%m/%Y %H:%M UTC')}")
            canvas.drawRightString(A4[0] - doc.rightMargin, 18, f"Page {doc_instance.page}")
            canvas.restoreState()
        
        # Construire le PDF
        doc.build(story, onFirstPage=ajouter_pied_de_page, onLaterPages=ajouter_pied_de_page)
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
