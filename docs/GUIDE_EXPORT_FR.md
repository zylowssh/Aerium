# Guide de l'Exportation de Données - Morpheus CO₂

## Vue d'ensemble

Le gestionnaire d'exportation de Morpheus permet d'exporter facilement les données de lecture CO₂ dans plusieurs formats (CSV, Excel, PDF) pour analyse, reporting et archivage.

## Caractéristiques principales

### 1. **Exportation immédiate**
Téléchargez instantanément vos données dans le format souhaité

- **Formats supportés:**
  - CSV (Comma-Separated Values) - Format universel pour Excel/Sheets
  - Excel (.xlsx) - Feuilles de calcul formatées avec graphiques
  - PDF - Rapports professionnels prêts à partager

- **Options de période:**
  - Dernière heure
  - Derniers 24 heures
  - Derniers 7 jours
  - Dernier mois
  - Période personnalisée

### 2. **Exportations programmées**
Configurez des exportations automatiques

- Reçevez vos données régulièrement par email
- Fréquences disponibles:
  - Quotidienne (chaque matin à 8h)
  - Hebdomadaire (chaque lundi)
  - Mensuelle (premier du mois)

- Utile pour:
  - Archivage régulier
  - Rapports de conformité
  - Suivi des tendances
  - Audit et documentation

## Guide d'utilisation

### Exporter des données immédiatement

1. **Accédez à la page d'exportation**
   - Cliquez sur "Gestion des exportations" dans le menu principal
   - Ou accédez directement via `/export`

2. **Sélectionnez vos paramètres**
   ```
   ┌─────────────────────────────────┐
   │ Sélectionner un capteur: [▼]    │
   │ Période: [▼]                     │
   │ Format: [ CSV ] [ Excel ] [ PDF ]│
   │                    [Exporter]     │
   └─────────────────────────────────┘
   ```

3. **Téléchargez le fichier**
   - Le téléchargement commence automatiquement
   - Un historique sauvegarde l'opération

4. **Utilisez les données**
   - Ouvrez dans Excel/Sheets pour analyse
   - Importez dans d'autres systèmes
   - Partagez les rapports PDF

### Programmer une exportation

1. **Remplissez le formulaire**
   ```
   Capteur: [Sélectionner]
   Format: [Excel]
   Fréquence: [Hebdomadaire]
   Email: [votremail@exemple.com]
   ```

2. **Validez**
   - Cliquez sur "Programmer l'exportation"
   - Confirmez votre adresse email

3. **Confirmez votre email**
   - Un email de confirmation est envoyé
   - Cliquez le lien de vérification
   - Les exports commenceront la prochaine période

4. **Gestion**
   - Affichage des exports programmés
   - Modifier ou supprimer un schedule
   - Télécharger les fichiers archivés

## Historique des exportations

Consultez tous vos exports précédents:

| Capteur | Format | Date | Statut | Action |
|---------|--------|------|--------|--------|
| Bureau | CSV | 15/01 10:30 | ✓ Complété | Télécharger |
| Salle | Excel | 14/01 09:15 | ✓ Complété | Télécharger |
| Cuisine | PDF | 13/01 14:45 | ✓ Complété | Télécharger |

Statuts disponibles:
- **Complété** - Export disponible au téléchargement
- **En attente** - Export en cours de traitement
- **Erreur** - Un problème a empêché l'export

## Cas d'usage

### Cas 1: Audit mensuel
```
1. Programmez une export mensuelle en Excel
2. Recevez chaque 1er du mois
3. Importer dans votre système d'audit
4. Conserver les archives pour conformité
```

### Cas 2: Analyse de tendance
```
1. Exportez 3 mois de données en CSV
2. Ouvrez dans Excel ou Python
3. Créez des graphiques de tendance
4. Identifiez les patterns
```

### Cas 3: Rapport client
```
1. Exportez la période demandée en PDF
2. Le rapport est formaté professionnellement
3. Ajoutez votre logo (optional)
4. Envoyez directement au client
```

### Cas 4: Sauvegarde régulière
```
1. Programmez export quotidienne
2. Stockez les fichiers automatiquement
3. Conservez l'historique complet
4. Récupérez si problème
```

## Formats détaillés

### CSV (Comma-Separated Values)
**Avantages:**
- ✓ Compatible partout (Excel, Sheets, Python, R...)
- ✓ Format texte simple
- ✓ Facile à traiter programmatiquement
- ✓ Petit fichier

**Contient:**
```
timestamp, sensor_id, co2_ppm, temperature_c, humidity_percent
2024-01-15 10:00:00, sensor_1, 450, 22.5, 45
2024-01-15 11:00:00, sensor_1, 475, 22.8, 46
```

**Bon pour:** Script, analyse, intégration système

### Excel (.xlsx)
**Avantages:**
- ✓ Formatage professionnel
- ✓ Graphiques intégrés
- ✓ Mise en forme (couleurs, filtres)
- ✓ Plusieurs feuilles

**Contient:**
- Feuille Données: tableau complet
- Feuille Graphiques: tendances visuelles
- Feuille Statistiques: moyennes, min, max
- Feuille Analyse: corrélations

**Bon pour:** Rapport, présentation, collaboration

### PDF
**Avantages:**
- ✓ Formatage préservé partout
- ✓ Signature légale
- ✓ Compression bonne
- ✓ Impossible à modifier

**Contient:**
- Résumé exécutif
- Graphiques principales
- Tableau de données
- Statistiques clés
- Annotations

**Bon pour:** Archivage légal, distribution, partage

## Considérations techniques

### Limites et quotas

| Plan | Exports/jour | Taille max | Historique |
|------|--------------|-----------|-----------|
| Gratuit | 5 | 10 MB | 30 jours |
| Pro | 50 | 100 MB | 1 an |
| Enterprise | Illimité | Illimité | Illimité |

### Performance
- Les exports < 1 an se traitent en < 10 secondes
- Les gros fichiers (> 50 MB) sont compressés en ZIP
- Les exports programmés s'exécutent entre 8h-10h UTC

### Sécurité
- Tous les fichiers sont chiffrés en transit (HTTPS)
- Les liens de téléchargement expirent après 7 jours
- Logs d'audit pour chaque export
- Compliance RGPD: données anonymisables

## Dépannage

### "L'export prend trop longtemps"
```
→ Réduisez la période (par exemple: 1 mois au lieu de 1 an)
→ Essayez CSV au lieu de PDF
→ Attendez l'heure creuse (nuit/weekend)
```

### "Erreur: Pas de données disponibles"
```
→ Vérifiez que le capteur a des lectures pour la période
→ Vérifiez que les capteurs sont actifs
→ Étendez la période de recherche
```

### "Le fichier téléchargé est corrompu"
```
→ Réessayez l'export
→ Nettoyez le cache du navigateur
→ Utilisez un autre navigateur
→ Contactez le support
```

### "Email d'export programmé pas reçu"
```
→ Vérifiez le dossier spam
→ Confirmez votre adresse email
→ Vérifiez les permissions de votre email
→ Réduisez la fréquence
```

## API et intégration

### Point de terminaison d'export

```bash
# Export immédiate
POST /api/advanced/export/immediate
{
    "sensor_id": "sens_123",
    "period": "7days",
    "format": "csv"
}

# Programmer une export
POST /api/advanced/export/schedule
{
    "sensor_id": "sens_123",
    "format": "excel",
    "frequency": "weekly",
    "email": "user@exemple.com"
}

# Historique
GET /api/advanced/export/history

# Exports programmées
GET /api/advanced/export/scheduled
```

## Bonnes pratiques

1. **Organisez vos exports**
   - Nommez clairement les fichiers
   - Archivez par mois/année
   - Utilisez des dossiers par type d'analyse

2. **Sécurisez les données sensibles**
   - Limitez le partage de PDF
   - Chiffrez les archives longue durée
   - Respectez les conditions RGPD

3. **Automatisez ce qui peut l'être**
   - Programmez les exports réguliers
   - Utilisez l'API pour intégration
   - Réduisez les manipulations manuelles

4. **Vérifiez les données exportées**
   - Comparez avec l'application
   - Vérifiez les périodes
   - Validez les statistiques

5. **Planifiez l'espace disque**
   - Un an de données CO₂ ≈ 100 MB
   - Archivez les anciens fichiers
   - Utilisez la compression

## Prochaines étapes

- [Guide d'analyse des données](GUIDE_ANALYTICS_FR.md)
- [Intégration API avancée](API-REFERENCE.md)
- [Automatisation avec Python](GUIDE_PYTHON.md)
- [Questions fréquentes](FAQ_FR.md)

---

*Pour plus d'aide, visitez [support.morpheus.io](https://support.morpheus.io) ou contactez notre équipe.*
