# Guide de Collaboration d'Équipe - Morpheus CO₂

## Vue d'ensemble

Le module de collaboration Morpheus permet aux équipes de partager les dashboards, configurer des alertes intelligentes, annoter les données et suivre les activités en temps réel pour une coordination optimale de la gestion de la qualité de l'air.

## Caractéristiques principales

### 1. **Partage de tableaux de bord**
Partagez facilement les dashboards avec des collègues

- Partage sélectif par email
- Permissions granulaires (lecture/modification)
- Accès temporaire avec expiration
- Traçabilité de qui accède à quoi

### 2. **Alertes collaboratives**
Configurez et gérez les alertes ensemble

- Alertes basées sur seuils CO₂
- Notifications multi-canaux (email, SMS, in-app)
- Escalade automatique si non résolu
- Historique des alertes

### 3. **Annotations et commentaires**
Documentez les observations directement sur les données

- Ajouter des notes sur les points d'intérêt
- Threads de discussion
- Résolution problèmes collaboratif
- Historique des changements

### 4. **Flux d'activité en temps réel**
Suivez ce qui se passe dans votre organisation

- Mise à jour des capteurs
- Alertes déclenchées
- Accès de l'équipe
- Modifications de configuration

## Guide d'utilisation

### Partager un tableau de bord

1. **Accédez au module de collaboration**
   ```
   Menu → Collaboration d'équipe
   ou: /team-collaboration
   ```

2. **Onglet "Partages"**
   ```
   Vos tableaux de bord partagés
   
   [Partager un nouveau dashboard]
   
   Partages existants:
   ├─ Dashboard Production (partagé avec Marie)
   ├─ Dashboard Qualité (partagé avec Équipe QA)
   └─ Dashboard Direction (partagé avec Conseil)
   ```

3. **Cliquez "Partager un nouveau dashboard"**
   ```
   ┌────────────────────────────────────┐
   │ Partager un tableau de bord        │
   ├────────────────────────────────────┤
   │ Dashboard: [Production       ▼]     │
   │ Partagé avec:                       │
   │  ☑ marie@exemple.com               │
   │  ☐ paul@exemple.com                │
   │  ☐ jean@exemple.com                │
   │                                    │
   │ Permissions:                       │
   │  ◉ Lecture seule                    │
   │  ◯ Lecture + Modification           │
   │                                    │
   │ Accès jusqu'au: [30/06/2024 ▼]    │
   │                                    │
   │      [Partager]  [Annuler]         │
   └────────────────────────────────────┘
   ```

4. **Confirmez les paramètres**
   - Destinataires reçoivent email
   - Lien actif jusqu'à la date d'expiration
   - Modifiable après création

### Configurer une alerte

1. **Onglet "Alertes"**
   ```
   Alertes actuellement configurées
   
   [Créer une nouvelle alerte]
   
   Alertes actives:
   ├─ CO₂ > 800 ppm (Critique)
   ├─ CO₂ > 1000 ppm (Alerte rouge)
   └─ Capteur hors ligne (Erreur)
   ```

2. **Créez une alerte**
   ```
   ┌────────────────────────────────────┐
   │ Créer une alerte                    │
   ├────────────────────────────────────┤
   │ Nom: [Alerte CO₂ Bureau       ]     │
   │ Capteur: [Bureau - Salle 101  ▼]   │
   │ Condition: [CO₂ > Seuil       ▼]   │
   │ Seuil: [800        ] ppm           │
   │                                    │
   │ Notifications:                     │
   │  ☑ Email                           │
   │  ☑ SMS                             │
   │  ☑ Notification in-app             │
   │                                    │
   │ Notifier: [marie@exemple.com]      │
   │ Escalade après: [30 ] minutes      │
   │                                    │
   │      [Créer]  [Annuler]            │
   └────────────────────────────────────┘
   ```

3. **Configuration intelligente**
   - **Conditions disponibles:**
     - CO₂ > valeur
     - Humidité > valeur
     - Température < valeur
     - Capteur en erreur
     - Pas de données reçues

   - **Actions d'escalade:**
     - Notifications supplémentaires après délai
     - Alertes SMS si email ignoré
     - Notification au manager si non résolu

4. **Testez et activez**
   - Envoyer alerte test
   - Vérifier réception
   - Activer l'alerte

### Annoter et commenter

1. **Onglet "Commentaires"**
   ```
   Discussions sur vos données
   
   Reading #12345 - 15/01 10:30
   ├─ Marie (Admin):
   │  "Pic anormal detecé"
   │  
   ├─ Paul (Utilisateur):
   │  "C'était pendant le réunion de 30 personnes"
   │  
   └─ [Ajouter un commentaire...]
      [Votre message...            ]
      [Envoyer]
   ```

2. **Ajouter un commentaire**
   - Cliquez sur un point de données
   - Rédigez votre observation
   - Mentionnez des collègues avec @nom
   - Attachez une image si utile

3. **Discussion collaborative**
   - Répondez directement dans les threads
   - Notifié si mentionné
   - Historique conservé
   - Exportable pour reporting

### Suivre l'activité

1. **Onglet "Activité"**
   ```
   Flux en temps réel
   
   [Filtre: Tous ▼]
   
   15:30 - Marie a partagé Dashboard Production avec Paul
   14:45 - Alerte CO₂ > 800 ppm déclenchée (Bureau)
   14:30 - Jean a ajouté 3 commentaires
   14:15 - Capteur Cuisine est en ligne
   13:55 - Michel a changé configuration salle 101
   ```

2. **Filtres disponibles**
   ```
   [Tous] [Partages] [Alertes] [Commentaires] [Changements]
   ```

3. **Agissez en temps réel**
   - Cliquez sur alerte → détails
   - Cliquez sur partage → paramètres
   - Cliquez sur commentaire → discussion

## Cas d'usage pratiques

### Cas 1: Gestion collaborative des crises

```
Scénario: Pic CO₂ dans la salle de réunion

Processus:
1. 10:00 - Alerte auto: "CO₂ > 800 ppm"
2. 10:01 - SMS notifie Marie (Manager)
3. 10:02 - Marie commente: "Vérifier ventilation"
4. 10:05 - Technicien Paul commente: "Filtre bouché"
5. 10:10 - Intervention sur place
6. 10:25 - CO₂ redescend → alerte résolue
7. 10:30 - Rapport auto-généré dans activité

Résultat: Temps de réaction < 30 min
```

### Cas 2: Audit et conformité

```
Scénario: Audit mensuel qualité de l'air

Processus:
1. Dashboard partagé avec auditeur externe
2. Accès lecture seule, valide 10 jours
3. Auditeur voit graphiques et moyennes
4. Notes dans commentaires ses observations
5. Signatures numériques sur rapport
6. Historique de consultation tracé

Résultat: Audit transparent et documenté
```

### Cas 3: Troubleshooting technique

```
Scénario: Capteur défaillant

Processus:
1. Utilisateur remarque anomalie
2. Ajoute commentaire: "Capteur salle 5 instable"
3. Crée alerte: "Capteur en erreur"
4. Technicien reçoit alerte
5. Commente: "Batterie faible, remplacée"
6. Désactive alerte après réparation
7. Flux d'activité documente l'incident

Résultat: Traçabilité complète du problème
```

### Cas 4: Rapports périodiques

```
Scénario: Rapport mensuel direction

Processus:
1. Dashboard "Vue Direction" créé
2. Partagé avec CFO + Directeurs
3. Indicateurs clés: Moyenne CO₂, % compliance
4. Commentaires: "Congés d'été = baisse normale"
5. Alerte de seuil pour tendances négatives
6. Export automatique chaque 1er du mois

Résultat: Décideurs informés régulièrement
```

## Configurations recommandées

### Par secteur

#### **Écoles**
```
Alertes:
- CO₂ > 800 ppm (avertissement)
- CO₂ > 1200 ppm (critique)

Partages:
- Direction: Vue complète
- Infirmerie: Salle d'infirmerie
- Enseignants: Leurs salles

Commentaires:
- Événements (réunion, conférence)
- Maintenance capteurs
```

#### **Bureaux**
```
Alertes:
- CO₂ > 1000 ppm (action requise)
- Capteur hors ligne

Partages:
- Équipe Facilités: Tous les capteurs
- Managers: Leurs étages
- Équipe CO₂: Vue complète + config

Commentaires:
- Problèmes techniques
- Résolutions apportées
```

#### **Santé**
```
Alertes:
- CO₂ > 600 ppm (sévère en zones médicales)
- Déviation normes sanitaires

Partages:
- Direction: Compliance report
- Responsable QA: Accès complet

Commentaires:
- Inspections sanitaires
- Actions correctives
```

## Intégrations avancées

### Webhooks pour automatisation

```bash
# Exemple: Déclencher action externes sur alerte
POST https://votre-api.com/webhook
{
    "event": "alert_triggered",
    "alert_name": "CO₂ > 800 ppm",
    "sensor": "Bureau-101",
    "value": 850,
    "timestamp": "2024-01-15T10:30:00Z"
}

Actions possibles:
→ Ouvrir ticket support automatique
→ Envoyer SMS du manager
→ Déclencher ventilation manuelle
→ Enregistrer en base audit
```

### Intégration calendrier

```
Synchroniser événements d'alerte avec Outlook/Google Calendar
- Alertes deviennent des événements calendrier
- Partages de dashboard = invitations
- Rappels des escalades
```

### Rapports automatisés

```
Générer rapports PDF automatiques:
- Hebdomadaire: Résumé alertes
- Mensuel: Compliance CO₂
- Annuel: Tendances et recommandations
- À la demande: Export tout moment
```

## Dépannage

### "Je ne reçois pas les alertes"
```
Vérifiez:
✓ Alerte activée (toggle ON)
✓ Vos coordonnées (email, SMS)
✓ Pas dans spam
✓ Permission notifications activée
✓ Alerte pas en cooldown (5 min)
```

### "Le partage n'est pas actif"
```
→ Vérifiez la date d'expiration
→ Vérifiez les adresses email
→ Renvoyez l'invitation
→ Vérifiez les permissions
```

### "Les commentaires pas visibles"
```
→ Rafraîchissez la page
→ Vérifiez permissions (lecture + commentaire)
→ Vérifiez période (commentaires > 1 an archivés)
```

### "Alerte créée mais pas déclenchée"
```
→ Vérifiez capteur actif et envoyant données
→ Testez alerte manuellement
→ Vérifiez seuil vs valeurs réelles
→ Vérifiez fréquence d'évaluation
```

## Bonnes pratiques

1. **Gérez les permissions**
   - Lecture seule pour observateurs
   - Modification pour responsables
   - Révoque accès après besoin

2. **Alertes stratégiques**
   - Ne créez que les essentielles
   - Testez les seuils réalistes
   - Révisez régulièrement

3. **Commentaires structurés**
   - Contexte et conclusion
   - Mentionnez les concernés
   - Archivez les résolutions

4. **Activité monitairée**
   - Vérifiez flux quotidiennement
   - Agissez rapidement sur alertes
   - Documentez les actions

5. **Communication claire**
   - Chacun sait son rôle
   - Escalade claire définie
   - Contact d'urgence documenté

## Prochaines étapes

- [Guide Analytics et ML](GUIDE_ANALYTICS_FR.md)
- [Guide des recommandations IA](GUIDE_RECOMMENDATIONS_FR.md)
- [API référence collaboration](API-REFERENCE.md)
- [FAQ Collaboration](FAQ_COLLABORATION_FR.md)

---

*Pour support ou questions, visitez [support.morpheus.io](https://support.morpheus.io)*
