# Guide Recommandations IA - Morpheus CO₂

## Vue d'ensemble

Le système de recommandations IA de Morpheus analyse vos données en contexte et fournit des actions spécifiques, priorisées et justifiées pour optimiser la qualité de l'air et réduire les coûts.

## Capacités principales

### 1. **Recommandations contextualisées**
Actions adaptées à votre secteur et situation

- École, bureau, santé, industrie...
- Basées sur data réelles
- Justification scientifique
- Estimation ROI

### 2. **Priorisation intelligente**
Agissez sur les vrais problèmes d'abord

- Score d'urgence
- Impact estimé
- Coût implémentation
- Délai de ROI

### 3. **Insights sectoriels**
Benchmarks et normes applicables

- Comparaison autres organisations
- Normes sanitaires/légales
- Bonnes pratiques reconnues
- Standards industrie

### 4. **Suivi des actions**
Mesurez l'impact de vos changements

- Avant/après CO₂
- Consommation énergétique
- Satisfaction utilisateurs
- Retour sur investissement

## Guide d'utilisation

### Accéder aux recommandations

1. **À partir du dashboard Analytics**
   ```
   Onglet → Recommandations
   ou: /analytics/recommendations
   ```

2. **Vue générale**
   ```
   ┌──────────────────────────────────────┐
   │ Recommandations IA contextualisées   │
   ├──────────────────────────────────────┤
   │                                      │
   │ ⚡ 3 Actions urgentes                │
   │ ⚠️  5 Améliorations opportunes      │
   │ ℹ️  2 Observations informatives     │
   │                                      │
   └──────────────────────────────────────┘
   ```

### Examiner les recommandations

1. **Recommendations urgentes**
   ```
   🔴 URGENT - Score: 9.2/10
   
   Titre: Ventilation insuffisante bureau 3
   
   Situation actuelle:
   • CO₂ moyen: 890 ppm
   • Pics quotidiens: 1100+ ppm
   • Décalage occupation: Pas de correlation
   
   Recommandation:
   "Augmenter débit ventilation +25%
    pendant heures de bureau (8-18h)"
   
   Justification:
   • CO₂ > 800 ppm réduit concentration 
   • Norme ASHRAE recommande < 800 ppm
   • Votre établissement: 10% du temps > 800
   
   Impact estimé:
   • Réduction CO₂: -150 ppm
   • Amélioration concentration: +12%
   • Économie énergétique: -5% (ventilation adaptée)
   • Coût implémentation: 200€ (calibrage)
   
   ROI:
   Bénéfice annuel: +500€ (productivité)
   vs Coût une fois: 200€
   Payback: < 1 mois ✓ Excellent ROI
   
   Prochaines étapes:
   1. [ ] Contacter technicien HVAC
   2. [ ] Faire diagnostic débit
   3. [ ] Implémenter ajustement
   4. [ ] Monitorer 1 semaine
   5. [ ] Valider amélioration
   
   [Marquer complète] [Remettre à plus tard]
   ```

2. **Améliorations opportunes**
   ```
   🟡 OPPORTUNITÉ - Score: 6.5/10
   
   Titre: Éducation utilisateurs sur aération
   
   Observation:
   • À 14:00: Pic récurrent CO₂ 850 ppm
   • Contexte: Réunions 20-30 personnes
   • Fenêtres restent fermées
   
   Recommandation:
   "Signaler à occupants de l'aérer
    pendant/après réunions longues"
   
   Impact estimé:
   • Réduction CO₂: -100 ppm sur pics
   • Zéro coût implémentation
   • Temps setup: 1 heure (affiche + email)
   
   Matériel proposé:
   [Télécharger affiche printable]
   [Générer email d'information]
   [Créer video courte]
   
   [Implémenter] [Ignorer]
   ```

3. **Observations informatives**
   ```
   ℹ️ INFORMATION
   
   Titre: Patterns saisonniers identifiés
   
   Constat:
   • Hiver (jan-mar): CO₂ moyen +15%
   • Printemps (avr-mai): Décroissance
   • Été (jun-sep): Minimum annuel
   • Automne (oct-dec): Remontée progressive
   
   Explication:
   Corrélation avec météo extérieure:
   • Froids: Moins de ventilation (coûts chauffage)
   • Chauds: Plus d'aération (portes ouvertes)
   • Intermédiaires: Équilibre naturel
   
   Insight:
   "Vous pouvez prévoir les pics d'hiver
    et adapter stratégie énergétique"
   
   [Comprendre plus]
   ```

### Suivre les implémentations

1. **Onglet "Suivi d'actions"**
   ```
   Recommandations que j'ai acceptées
   
   Statut: En cours (3)
   ├─ Augmenter ventilation bureau 3
   │  Statut: En cours
   │  Deadline: 31/01/2024
   │  Avant: 890 ppm → Après: 740 ppm
   │  Amélioration: +16.8% ✓
   │  
   ├─ Remplacer filtre ventilation
   │  Statut: Complétée
   │  Impact mesuré: +25 ppm réduction
   │
   └─ Former équipe aération
      Statut: Planifiée
      Début prévue: 20/01/2024
   
   Statut: Complétées (5)
   ├─ Calibrer capteur bureau
   │  Complétée: 05/01
   │  Problème résolu: -200 ppm variance
   │
   ... (autres complétées)
   ```

2. **Mesurer l'impact**
   ```
   Avant la recommandation:
   CO₂ moyen: 850 ppm
   Pics: 1150 ppm
   
   Après implémentation (1 semaine):
   CO₂ moyen: 740 ppm
   Pics: 950 ppm
   
   Amélioration confirmée: +13% ✓
   [Marquer comme complète + réussie]
   [Générer certificat/rapport]
   ```

## Système de scoring

### Calcul de priorité

```
Score = (Urgence × 0.4) + (Impact × 0.4) + (Faisabilité × 0.2)

Urgence (0-10):
10 = Dépasse seuil sanitaire critique
7-9 = Seuil moyen dépassé régulièrement
4-6 = Amélioration souhaitable
1-3 = Optimisation mineure

Impact (0-10):
10 = Résout problème complet
7-9 = Amélioration significative
4-6 = Amélioration modérée
1-3 = Amélioration mineure

Faisabilité (0-10):
10 = Zéro coût, action immédiate
7-9 = Coût faible, simple mise en place
4-6 = Coût modéré, efforts raisonnables
1-3 = Coûteux/complexe, délai long
```

### Exemples d'attribution de scores

```
Cas 1: Ventilation insuffisante
Urgence: 8 (900 ppm régulièrement)
Impact: 9 (résout pic chronique)
Faisabilité: 7 (300€, 1 jour)
SCORE: (8×0.4) + (9×0.4) + (7×0.2) = 8.2 ★★★★★

Cas 2: Éducation utilisateurs
Urgence: 5 (opportunité, pas urgent)
Impact: 6 (quelques % réduction)
Faisabilité: 10 (gratuit, 1h)
SCORE: (5×0.4) + (6×0.4) + (10×0.2) = 6.4 ★★★★☆

Cas 3: Upgrade capteur obsolète
Urgence: 3 (fonctionne toujours)
Impact: 4 (plus de précision)
Faisabilité: 2 (1500€, installation)
SCORE: (3×0.4) + (4×0.4) + (2×0.2) = 3.2 ★★★☆☆
```

## Recommandations par secteur

### École maternelle/primaire

**Recommandations typiques:**
```
🔴 URGENT (Score 9/10):
- Ventilation minimum 6 renouvellements/h
- CO₂ rester < 800 ppm

🟡 IMPORTANT (Score 7/10):
- Former enseignants: aération 5min chaque heure
- Affiche "aérez" visible dans classes
- Alertes visuelles quand CO₂ > 700 ppm

ℹ️ OPTIONNEL (Score 5/10):
- Mesures "défi CO₂" avec élèves (ludique)
- Intégrer dans cours SVT
```

### Bureau collectif

**Recommandations typiques:**
```
🔴 URGENT:
- Optimiser ventilation heures de pointe
- Détection occupation automatique

🟡 IMPORTANT:
- Politique open space: fenêtres ouvertes au besoin
- Salles réunion avec capteur + alerte
- Flexibilité télétravail jours pics

ℹ️ OPTIONNEL:
- Dashboard visible "CO₂ en direct"
- Gamification: équipes/étages/scores
```

### Établissement sanitaire

**Recommandations typiques:**
```
🔴 URGENT:
- Conformité stricte normes (< 600 ppm zones critiques)
- Alertes immédiates dépassement
- Logs complets audit

🟡 IMPORTANT:
- Plan maintenance ventilation calendrier
- Formation staff procédures COVID-like
- Certificats conformité réguliers

ℹ️ OPTIONNEL:
- Intégration dossier patient (occupation)
```

### Industrie/Entrepôt

**Recommandations typiques:**
```
🔴 URGENT:
- Zones stockage chimiques: ultra-vigilance
- Ventilation redondante zones critiques
- Alarmes couplées HVAC

🟡 IMPORTANT:
- Predictive maintenance des filtres
- Optimisation conso énergétique
- Historique pour audit fournisseurs

ℹ️ OPTIONNEL:
- Corrélation productivité/CO₂
```

## Intégrations avancées

### Webhooks de recommandations

```bash
# Créer ticket support automatique si URGENT
POST https://votre-ticketing.com/api/tickets
Payload: {
    "title": "Ventilation insuffisante Bureau 3",
    "priority": "high",
    "description": "Score 9.2 - Action dans 48h",
    "morpheus_link": "https://morpheus.io/recommendations/..."
}

# Envoyer email équipe management
POST https://api.sendgrid.com/v3/mail/send
Body: {
    "personalizations": [{
        "to": [{"email": "management@entreprise.com"}],
        "subject": "3 Recommandations IA - Actions requises"
    }],
    "content": "Récapitulatif recommandations..."
}

# Intégrer Google Sheets pour tracking
POST https://sheets.googleapis.com/v4/spreadsheets/.../values
Data: {
    "values": [
        ["Ventilation bureau 3", "URGENT", "9.2", "2024-01-15"]
    ]
}
```

### Intégration calendrier d'équipe

```
Recommandations = événements calendrier
- Urgentes: Blocs rouges immédiats
- Planifiées: Rappels chaque matin
- Complétées: Archivées automatiquement

Équipes assignées directement:
→ Les responsables reçoivent tâche calendrier
→ Notifications récurrentes si non complétée
```

## Dépannage

### "Je reçois trop de recommandations"
```
Options de filtrage:
→ Afficher que URGENT + IMPORTANT
→ Cacher secteur après implémentation
→ Fréquence notifications: quotidienne vs hebdo

Configuration:
Préférences → Recommandations
[ ] Afficher tous les scores
[ ] Notifications temps réel (risque)
[ ] Digest quotidien (recommandé)
[ ] Digest hebdomadaire (faible urgence)
```

### "Les recommandations ne semblent pas pertinentes"
```
Possible causes:
→ Peu de données historiques (< 1 mois)
→ Contexte not spécifié (occupation réelle)
→ Capteur dérégulé (calibrage nécessaire)

Solutions:
1. Fournissez contexte d'occupation
2. Calibrez capteurs
3. Attendez 2-3 mois données
4. Envoyez feedback "pas pertinent"
```

### "Les estimés d'impact ne se réalisent pas"
```
Pourquoi?
- Implémentation partielle
- Changements ailleurs aussi
- Conditions différentes (été vs hiver)
- Effet adaptation (comportement change)

Meilleures pratiques:
✓ Une seule recommandation à la fois
✓ Mesurer strictement avant/après
✓ Délai 2 semaines avant évaluation
✓ Mentionner changements contexte
```

## Bonnes pratiques

1. **Priorisez par score**
   - Commencez recommandations 9/10
   - Puis 7-8/10
   - Optionnelles quand stabilisé

2. **Documentez les actions**
   - Date mise en place
   - Exactement ce qui a changé
   - Qui était responsable

3. **Mesurez scrupuleusement**
   - Baseline 1 semaine avant
   - Mesure 2 semaines après
   - Même conditions si possible

4. **Fermez la boucle**
   - Marquez complétées
   - Documentez résultats
   - Partagez succès

5. **Itérez constamment**
   - Nouvelles data = nouvelles recommandations
   - Feedback améliore modèles
   - Adaptez à votre contexte

## Prochaines étapes

- [Guide performance/optimisation](GUIDE_PERFORMANCE_FR.md)
- [API recommandations détaillée](API-REFERENCE.md)
- [Cas d'usage réels](CASE_STUDIES_FR.md)
- [FAQ Recommandations](FAQ_RECOMMENDATIONS_FR.md)

---

*Pour optimiser IA recommandations, contactez [support.morpheus.io](https://support.morpheus.io)*
