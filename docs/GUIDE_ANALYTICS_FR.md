# Guide Analytics et Machine Learning - Morpheus CO₂

## Vue d'ensemble

Le module Analytics de Morpheus utilise le machine learning pour transformer vos données CO₂ brutes en insights actionnables. Prédictions précises, détection d'anomalies et analyses de tendances vous aident à optimiser la qualité de l'air en permanence.

## Capacités principales

### 1. **Prédictions ML**
Anticiper les niveaux de CO₂ futurs

- Prédictions jusqu'à 24 heures
- Modèles adaptatifs (ML)
- Précision > 95% en conditions normales
- Mises à jour continues

### 2. **Détection d'anomalies**
Repérer les situations inhabituelles

- Analyse statistique avancée
- Détection isolement forêt (Isolation Forest)
- Alertes anomalies automatiques
- Classification: mineures vs sévères

### 3. **Analyse de tendances**
Comprendre les patterns

- Tendances horaires/quotidiennes
- Tendances hebdomadaires
- Tendances saisonnières
- Identification de cycles

### 4. **Corrélations**
Découvrir les relations causales

- CO₂ vs Température
- CO₂ vs Humidité
- CO₂ vs Occupation
- Patterns croisés

### 5. **Insights intelligents**
Recommandations IA contextualisées

- Seuils optimaux par secteur
- Actions recommandées
- Priorités d'action
- ROI des interventions

## Guide d'utilisation

### Accéder au module Analytics

1. **À partir du menu principal**
   ```
   Menu → Analytics
   ou: /analytics
   ```

2. **Tableau de bord principal**
   ```
   ┌──────────────────────────────────────┐
   │ Prédictions  │ Anomalies │ Insights │
   ├──────────────────────────────────────┤
   │                                      │
   │  Graphique + Tableau de contrôle     │
   │                                      │
   └──────────────────────────────────────┘
   ```

### Utiliser les prédictions

1. **Sélectionner la plage horaire**
   ```
   Prédictions CO₂ pour [Salle 101      ▼]
   
   Horizon:
   ◉ 2 heures    ◯ 6 heures
   ◯ 12 heures   ◯ 24 heures
   
   [Générer prédictions]
   ```

2. **Lire les résultats**
   ```
   Prédictions pour 24 heures
   
   Heure  │ Réel │ Prédit │ Confiance │ Graphique
   ────────┼──────┼────────┼───────────┼──────────
   10:00   │ 520  │ 550    │ 98%       │ ████████
   11:00   │ 580  │ 620    │ 95%       │ ████████
   12:00   │ -    │ 710    │ 89%       │ ████████
   13:00   │ -    │ 650    │ 85%       │ ████████
   14:00   │ -    │ 580    │ 82%       │ ████████
   ```

3. **Agir sur les prédictions**
   ```
   Action recommandée:
   "À 12:00, CO₂ devrait atteindre 710 ppm
    → Augmentez la ventilation à 11:30"
   
   Bénéfice estimé:
   "Réduction de 100 ppm, économie 15€ électricité"
   ```

### Détecter les anomalies

1. **Onglet "Anomalies"**
   ```
   Détection d'anomalies activée
   
   [Lancer détection]
   [Historique anomalies]
   
   Anomalies détectées aujourd'hui: 2
   ```

2. **Configurer la sensibilité**
   ```
   Paramètres de détection:
   
   Sensibilité: [████░░░░░░] (Modérée)
   - Faible:    Peu d'alertes, risques manqués
   - Modérée:   Équilibre optimal
   - Haute:     Alertes fréquentes
   
   Seuil anomalie score: [0.7 ▼]
   
   [Appliquer]
   ```

3. **Interpréter les anomalies**
   ```
   Anomalie détectée: 15/01 14:30
   
   Salle: Bureau 101
   Valeur: 1200 ppm CO₂
   Score anomalie: 0.92 (HAUTE)
   
   Contexte:
   - Réunion 20 personnes détectée
   - Pas d'anomalie technique
   - Comportement normal pour contexte
   
   Recommandation:
   "Normalité compte tenu occupation"
   Action: Aucune requise
   ```

### Analyser les tendances

1. **Sélectionner l'horizon**
   ```
   Analyse de tendance
   
   Capteur: [Salle 101 ▼]
   Période: [7 jours ▼]
   
   Type de tendance:
   ◉ Horaire    ◯ Quotidienne
   ◯ Hebdo      ◯ Saisonnière
   
   [Analyser]
   ```

2. **Lire les patterns**
   ```
   Tendance horaire (7 jours moyenne)
   
   Heure  │ Moyenne │ Min │ Max │ Pattern
   ────────┼─────────┼─────┼─────┼────────
   09:00   │ 480     │ 450 │ 520 │ ░░░░░░
   10:00   │ 580     │ 520 │ 650 │ ░░░░░░
   11:00   │ 720     │ 650 │ 800 │ ████░░
   12:00   │ 850     │ 750 │ 950 │ ██████
   13:00   │ 920     │ 850 │ 1050│ ██████
   14:00   │ 680     │ 600 │ 750 │ ████░░
   15:00   │ 520     │ 480 │ 580 │ ░░░░░░
   ```

3. **Exploiter les insights**
   ```
   Constatations:
   ✓ Pic quotidien entre 12:00-14:00
   ✓ Montée progressive depuis 09:00
   ✓ Décroissance rapide après 14:00
   
   Causes probables:
   - Repas/réunions midi
   - Concentration de personnes
   - Ventilation insuffisante
   
   Actions recommandées:
   1. Augmenter ventilation 11:30-14:30
   2. Répartir réunions (moins groupées)
   3. Éducation: aérer après midi
   ```

### Examiner les corrélations

1. **Sélectionner variables**
   ```
   Analyse de corrélation
   
   Variable 1: [CO₂         ▼]
   Variable 2: [Température ▼]
   Période: [30 jours ▼]
   
   [Calculer corrélation]
   ```

2. **Interpréter résultats**
   ```
   Résultat: Corrélation modérée (0.65)
   
   Signification:
   - Lorsque température ↑
   → CO₂ tend à augmenter
   - Relation causale probable: 
     Fenêtres fermées par temps chaud
   
   Graphique XY:
   (points dispersés montrant tendance)
   
   R²: 0.42 (42% de variance expliquée)
   ```

## Machine Learning expliqué

### Modèles utilisés

#### **Régression Linéaire (Prédictions)**
```
Formule simple: CO₂(t+1) = a×CO₂(t) + b×Heure + c

Utilisé pour:
✓ Prédictions court terme (< 6h)
✓ Rapide et interprétable
✓ Entraînement continu sur données récentes

Précision typique: 90-95%
Temps calcul: < 100ms
```

#### **Isolation Forest (Anomalies)**
```
Algorithme: Partitionnement aléatoire
Principe: Les anomalies sont isolées plus vite

Utilisé pour:
✓ Non supervisé (sans labels)
✓ Détection sans seuil fixe
✓ Adaptable à tout secteur

Avantage: Pas besoin historique "normal"
```

#### **Analyse Statistique**
```
Tests: Z-score, IQR (Interquartile Range)
Principe: Écarts vs distribution normale

Utilisé pour:
✓ Validation simples/rapides
✓ Combiner avec Isolation Forest
✓ Explications faciles
```

### Entraînement des modèles

```
Données utilisées:
├─ 90 jours historique minimum
├─ Mise à jour quotidienne
├─ Nettoyage anomalies connues
└─ Poids spécial récentes (importance décroissante)

Processus:
1. Récupération données historiques
2. Normalisation (0-1 scale)
3. Division train/test (80/20)
4. Entraînement modèle
5. Validation performance
6. Déploiement si R² > 0.8
```

## Cas d'usage pratiques

### Cas 1: Optimisation énergétique

```
Objectif: Réduire conso électricité ventilation

Processus:
1. Analysez tendances (pics CO₂ réguliers?)
2. Prédictions avant pics
3. Ventilation "juste-à-temps" pas surdimensionnée
4. Mesurer avant/après

Résultat:
Avant: Ventilation 24/24 = 500€/mois
Après: Smart-ventilation = 320€/mois
ROI: 180€ / mois = 2,160€ / an
```

### Cas 2: Préparation évènements

```
Objectif: Accueil réunion exceptionnelle

Processus:
1. Prédictions pour jour du meeting
2. Identifier risques CO₂
3. Plan de mitigation:
   - Renforcement ventilation
   - Nombre participants limité
   - Durée adaptée
4. Monitoring continu durant événement

Résultat:
"Réunion 100 personnes sans dépassement CO₂"
Satisfaction participants élevée
```

### Cas 3: Diagnostic technique

```
Objectif: Identifier pourquoi CO₂ élevé chronique

Processus:
1. Analyser anomalies: Fréquence/magnitude
2. Tendances: Dégradation progressive?
3. Corrélations: Liée à temp/humidité?
4. Contexte: Changement récent?

Cas a) Anomalies croissantes
→ Suspect: Filtre ventilation saturé
Action: Vérifier/remplacer filtre

Cas b) Corrélation forte avec température
→ Suspect: Condensation fenêtres
Action: Étanchéité fenêtres

Cas c) Pics toujours même heure
→ Suspect: Activité spécifique
Action: Ajuster processus/horaires
```

### Cas 4: Benchmarking secteur

```
Objectif: Comparer vs autres écoles

Données collectées (anonymes):
- 50 écoles types similaires
- Même climatologie
- Même type occupation

Analyse comparative:
Votre école: 650 ppm moyenne
Écoles similaires: 720 ppm moyenne

Conclussion: "10% mieux performant"
Action: Documenter bonnes pratiques
```

## Dépannage

### "Les prédictions sont imprécises"
```
Causes possibles:
→ Données insuffisantes (< 90 jours)
→ Changement significatif récent
→ Données de mauvaise qualité

Solutions:
✓ Attendez 3 mois de données
✓ Nettoyez données aberrantes
✓ Vérifiez capteur calibrage
✓ Contactez support
```

### "Détection anomalies trop sensible"
```
Actions:
→ Réduisez sensibilité (5 → 7 sur 10)
→ Augmentez seuil score (0.9 vs 0.7)
→ Formez système sur vos patterns

Cas: "Pics midi = normal, pas anomalie"
→ Ajouter contexte "heure occupation"
```

### "Pas de corrélation trouvée"
```
Pourquoi:
- Variables vraiment indépendantes
- Relation non-linéaire
- Décalage temporel (cause → effet)

Solutions:
→ Essayer autres variables
→ Vérifier délai (CO₂ décale température?)
→ Analyser par sous-groupe temps
```

## Bonnes pratiques

1. **Calibrage capteurs**
   - Obligatoire pour ML fiable
   - Tous les 3-6 mois
   - Valide avant analytics

2. **Données nettoyées**
   - Marquez maintenance/tests
   - Excluez ces périodes ML
   - Conservez historique complet

3. **Contexte documenté**
   - Occupation probable (horaires)
   - Événements spéciaux (réunions, travaux)
   - Changements configuration (fenêtres, ventilation)

4. **Validation résultats**
   - ML donne tendances, pas vérité absolue
   - Toujours vérifier physiquement
   - Rétroaction améliore modèles

5. **Actualisation régulière**
   - Données recalculées quotidiennement
   - Modèles réentraînés hebdo
   - Alertes réévaluées mensuellement

## API Analytics

```bash
# Obtenir prédictions
GET /api/advanced/analytics/predictions/{sensor_id}?horizon=6h
Response: {
    "sensor_id": "...",
    "predictions": [
        {"timestamp": "...", "predicted": 580, "confidence": 0.95}
    ]
}

# Détecter anomalies
POST /api/advanced/analytics/anomalies/detect
{
    "sensor_id": "...",
    "sensitivity": 0.7
}

# Tendances
GET /api/advanced/analytics/trends/{sensor_id}?period=7days

# Corrélations
POST /api/advanced/analytics/correlations
{
    "variable1": "co2",
    "variable2": "temperature",
    "days": 30
}

# Insights
GET /api/advanced/analytics/insights/{sensor_id}
```

## Prochaines étapes

- [Guide recommandations IA](GUIDE_RECOMMENDATIONS_FR.md)
- [Guide performance/optimisation](GUIDE_PERFORMANCE_FR.md)
- [API référence complète](API-REFERENCE.md)
- [FAQ Analytics](FAQ_ANALYTICS_FR.md)

---

*Pour questions techniques sur ML, visitez [support.morpheus.io/ml](https://support.morpheus.io/ml)*
