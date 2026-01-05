# Guide Optimisation et Performance - Morpheus CO₂

## Vue d'ensemble

Le module d'optimisation de Morpheus améliore la vitesse, la fiabilité et l'efficacité de votre système. Caching intelligent, requêtes optimisées et limiteurs de débit garantissent une expérience fluide même sous forte charge.

## Capacités principales

### 1. **Caching intelligent**
Réduction drastique de latence

- Cache distribué multi-niveaux
- TTL adaptés (temps de fraîcheur)
- Invalidation intelligente
- Hit rate > 85% en usage normal

### 2. **Optimisation requêtes**
Réduction charge base données

- Index sur colonnes fréquentes
- Requêtes paramétrées
- Pagination automatique
- Compression données

### 3. **Limitation de débit (Rate Limiting)**
Protection contre surcharge

- Quotas par utilisateur
- Quotas globaux système
- Throttling progressif
- Récupération rapide

### 4. **Monitoring en temps réel**
Visibilité complète performance

- Dashboard temps réel
- Alertes automatiques
- Historique détaillé
- Recommandations optimisation

## Guide d'utilisation

### Accéder au module Performance

1. **À partir de l'admin**
   ```
   Menu → Administration → Performance
   ou: /admin/performance
   ```

2. **Dashboard principal**
   ```
   ┌──────────────────────────────────────┐
   │  Performance Système Morpheus        │
   ├──────────────────────────────────────┤
   │                                      │
   │ Temps réel │ Historique │ Config    │
   │                                      │
   └──────────────────────────────────────┘
   ```

### Monitoring en temps réel

1. **Métriques clés**
   ```
   Cache
   ├─ Hit rate: 87.5% ✓ Excellent
   ├─ Taille: 245 MB / 500 MB (49%)
   ├─ Items cachés: 15,430
   └─ TTL moyen: 8.3 heures
   
   Requêtes API
   ├─ Requêtes/sec: 124
   ├─ Latence médiane: 45ms
   ├─ Latence P95: 180ms
   ├─ Erreurs/min: 0
   └─ Uptime: 99.98%
   
   Base données
   ├─ Connexions actives: 23 / 100
   ├─ Requêtes/sec: 456
   ├─ Requêtes lentes (> 1s): 2 (0.3%)
   └─ Dernière maintenance: 5 jours
   
   Système
   ├─ Charge CPU: 32% (faible)
   ├─ Mémoire RAM: 4.2 GB / 8 GB (52%)
   ├─ Disque: 128 GB / 256 GB (50%)
   └─ Température: 48°C (normal)
   ```

2. **Interprétation des métriques**
   ```
   ✓ BON:
   - Cache hit rate > 80%
   - Latence P95 < 200ms
   - Erreurs < 0.1%
   - CPU/Mémoire < 70%
   
   ⚠️ À SURVEILLER:
   - Cache hit rate 60-80%
   - Latence P95 200-500ms
   - Erreurs 0.1-1%
   - CPU/Mémoire 70-85%
   
   🔴 PROBLÈME:
   - Cache hit rate < 60%
   - Latence P95 > 500ms
   - Erreurs > 1%
   - CPU/Mémoire > 85%
   ```

### Configuration du caching

1. **Onglet "Configuration cache"**
   ```
   Paramètres globaux:
   
   [ ] Cache activé (✓ Activé)
   [ ] Cache distribué (✓ Redis)
   
   Taille maximale: [500 MB]
   Politique éviction: [LRU ▼]
   
   Durée de vie par défaut:
   ├─ Sensor data: [3600 s] (1 heure)
   ├─ Dashboard: [1800 s] (30 min)
   ├─ Analytics: [7200 s] (2 heures)
   └─ User settings: [86400 s] (24h)
   
   [Sauvegarder]
   ```

2. **Invalidation cache**
   ```
   Invalidation manuelle:
   
   Tout le cache:
   [Vider complètement le cache]
   
   Cache sélectif:
   ☑ Sensor: Bureau-101
   ☑ Dashboard: Production
   ☐ Analytics cache
   
   [Invalider sélection]
   
   Cache stats détaillées:
   Clés en cache: 15,430
   Mémoire utilisée: 245 MB
   Requête les plus cachées: (liste)
   ```

3. **Configurations spécialisées**
   ```
   Cache par type de données:
   
   Lectures capteur:
   ├─ TTL court (5 min): Données temps réel
   ├─ TTL moyen (1h): Moyennes horaires
   └─ TTL long (24h): Graphiques journée
   
   Analytics/Prédictions:
   ├─ TTL très long (48h): Modèles ML
   ├─ TTL court (5 min): Prédictions actuelles
   └─ Invalider avant chaque prédiction nouvelle
   
   Données utilisateur:
   ├─ TTL court (15 min): Permissions
   ├─ TTL moyen (1h): Préférences
   └─ Invalider à chaque changement
   ```

### Optimisation des requêtes

1. **Onglet "Requêtes"**
   ```
   Top 10 requêtes les plus coûteuses:
   
   Rang │ Requête        │ Hits │ Temps moy │ Optimisation
   ─────┼────────────────┼──────┼──────────┼──────────────
   1.   │ GET /readings  │ 2.5k │ 245ms    │ ⚠️ Index manquant
   2.   │ GET /sensors   │ 4.1k │ 85ms     │ ✓ Optimal
   3.   │ POST /export   │ 156  │ 1.2s     │ ⚠️ À paralléliser
   4.   │ GET /analytics │ 856  │ 520ms    │ ⚠️ Cache désactivé
   5.   │ DELETE /token  │ 234  │ 45ms     │ ✓ Optimal
   
   Requêtes à problème:
   
   1️⃣ GET /readings - Accès base données lent
   
   Diagnostic:
   ├─ SELECT * readings WHERE... (2.3s query)
   ├─ Index: readings_sensor_id existe
   ├─ Problème: WHERE clause sur plusieurs colonnes
   
   Recommandations:
   ✓ Créer index composé (sensor_id, timestamp)
   ✓ Limiter SELECT (nombre lignes)
   ✓ Ajouter LIMIT si top-N query
   ✓ Utiliser cache (readings changent lentement)
   
   Impact estimé:
   Before: 245ms → After: 45ms
   Amélioration: -82% ✓ Gain significatif
   
   [Implémenter optimisation]
   ```

2. **Slow Query Log**
   ```
   Requêtes lentes (> 1 sec) dernières 24h:
   
   2024-01-15 14:32 - Duration: 3.2s
   Query: SELECT DISTINCT readings.sensor_id, ...
   FROM readings
   JOIN sensors ON...
   WHERE timestamp BETWEEN '2024-01-01' AND '2024-01-15'
   GROUP BY sensor_id
   ORDER BY AVG(co2_ppm)
   
   Problème: Sans index GROUP BY
   Cause: Scan table complète 1.5M rows
   
   Fix recommandée:
   CREATE INDEX idx_readings_sensor_timestamp
   ON readings(sensor_id, timestamp)
   
   Résultat estimé: 3.2s → 0.4s
   ```

### Limitation de débit (Rate Limiting)

1. **Onglet "Rate Limiting"**
   ```
   Politiques actuelles:
   
   Utilisateur standard:
   ├─ Requêtes: 1,000 / heure
   ├─ Simultanées: 10
   ├─ Export: 5 / jour
   └─ Status: ✓ Normal
   
   Plan Enterprise:
   ├─ Requêtes: Illimité
   ├─ Simultanées: 50
   └─ Export: Illimité
   
   Global:
   ├─ Requêtes système: 100,000 / heure
   ├─ Connexions DB: 100 max
   └─ Load CPU: Throttle si > 90%
   
   [Modifier politiques]
   ```

2. **Gestion des utilisateurs en limite**
   ```
   Utilisateurs actuellement throttlés:
   
   user@exemple.com
   ├─ Limite: 1,000 req/h
   ├─ Usage: 987 requêtes
   ├─ % limite: 98.7% ⚠️
   ├─ Requête échouera dans: 12 min
   └─ Actions:
      [Augmenter limite] [Contacter support]
   
   Historique throttling (7 jours):
   ├─ Jours avec throttle: 2
   ├─ Requêtes rejetées: 127
   └─ Raison: Exécution massive requêtes
   ```

3. **Whitelisting/Exceptions**
   ```
   Requêtes d'exception:
   
   API d'import massive:
   ├─ Utilisateur: integration@client.com
   ├─ Limite: 10,000 requêtes/jour
   ├─ Raison: Synchronisation système externe
   ├─ Début: 2024-01-15
   └─ Fin: Permanent jusqu'à révocation
   
   Batch processing scientifique:
   ├─ Utilisateur: research@université.edu
   ├─ Limite: 50,000 requêtes/jour
   ├─ Raison: Étude données 2023
   ├─ Début: 2024-01-01
   └─ Fin: 2024-03-31
   
   [Ajouter nouvelle exception]
   ```

## Optimisations par scénario

### Scénario 1: Forte charge - Nombreux utilisateurs

```
Problème: Système ralentit aux heures de pointe (12-14h)

Diagnostic:
├─ Utilisateurs concurrents: 500+ → Pics
├─ Requêtes API: 2000/sec
├─ Cache hit rate chute à 45%
└─ Latence P95: 800ms

Optimisations appliquées:

1. CACHE
   ├─ TTL augmenté: 3min → 5min
   ├─ Précalc dashboards hors-pics
   └─ Compression données cache
   Impact: Hit rate 45% → 75%

2. REQUÊTES
   ├─ Pagination forcée (max 1000 rows)
   ├─ Ajout indexes sur colonnes filtrées
   ├─ Asynchrone pour requêtes lentes
   └─ Webhook vs polling réductions
   Impact: Latence P95 800ms → 200ms

3. DATABASE
   ├─ Archivage données > 2 ans
   ├─ Table partitioning par date
   └─ Read replicas pour analytics
   Impact: Requêtes 2.3s → 0.4s

4. RATE LIMITING
   ├─ Throttle progressif > 80% quota
   ├─ Priorité API production vs debug
   └─ Queue requêtes non-critiques
   Impact: Moins rejets d'erreur

Résultat:
Before: Latence 800ms, Erreurs 2.5%
After: Latence 150ms, Erreurs 0.1%
Satisfaction utilisateurs: ↑ 35%
```

### Scénario 2: Beaucoup de petites requêtes

```
Problème: 50,000 requêtes/jour de petits exports

Diagnostic:
├─ Chaque export = 5-10 requêtes DB
├─ Beaucoup de connexion overhead
├─ Cache inefficace (requêtes si différentes)

Optimisations:

1. BATCH APIS
   ├─ Endpoint /api/batch pour requêtes multiples
   ├─ Unique connexion DB pour tout batch
   └─ Une réponse JSON pour 50 requêtes
   Impact: 50 requêtes → 1 requête

2. GRAPHQL (Alternative)
   ├─ Client spécifie données nécessaires
   ├─ Zéro overfetching
   └─ 40% réduction data transfer
   Impact: Bande passante -40%

3. COMPRESSION
   ├─ GZIP HTTP automatique
   ├─ JSON compressé au repos
   └─ Delta sync (juste changements)
   Impact: Taille réponse -60%

Résultat:
Before: 50,000 requêtes/jour, 2GB data
After: 5,000 requêtes, 500MB data
Réduction 90% charge API
```

### Scénario 3: Requêtes analytiques lourdes

```
Problème: Analytics/ML requêtes 30+ secondes

Diagnostic:
├─ Requêtes sur 1-2 ans historique
├─ Agrégations multiples
├─ Pas de cache (résultats trop variés)

Optimisations:

1. MATERIALIZED VIEWS
   ├─ Pré-calculer agrégations standards
   ├─ Mise à jour nuit (hors-pics)
   └─ Queries 30s → 0.5s
   Impact: -98% latence

2. DATA WAREHOUSE
   ├─ OLAP vs OLTP (séparation)
   ├─ Agrégation par jour/mois
   └─ Indexation columnaire
   Impact: Requêtes 20x plus rapides

3. CACHING SÉMANTIQUE
   ├─ Cache par requête type
   │  (pas requête exacte)
   ├─ Servir approximation rapidement
   └─ Détail dans background
   Impact: Instant feedback utilisateur

Résultat:
Before: Analytiques 30s, UX bloquée
After: Instantané (cache) + détail 5s
Users heureux, système responsive
```

## Dépannage

### "Système lent aux heures de pointe"
```
Vérifiez:
1. Cache hit rate (doit être > 80%)
   → Si < 80%: Augmenter TTL ou pré-remplir

2. Requêtes lentes (slow query log)
   → Ajouter index sur WHERE/JOIN colonnes
   
3. Charge système
   → CPU > 80%: Réduire threads/connexions
   → RAM > 85%: Réduire cache size
   → Disque IO: Archiver vieilles données

4. Utilisateurs problématiques
   → Identifier top consumers
   → Vérifier requêtes inefficaces
   → Leur proposer optimisation
```

### "Cache pas efficace malgré TTL long"
```
Raisons possibles:
→ Clés cache trop variées (pas réutilisées)
→ TTL pas assez long
→ Invalidations trop fréquentes
→ Pattern accès pas cacheable

Diagnos:
GET /admin/cache/stats → Voir hitrate par clé
Si hitrate < 30% sur clé:
  → Augmenter TTL
  → Ou accepter pas cacheable

Exemple:
- /readings?sensor=123&start=1/1&end=1/31
  → TTL 24h car données figées

- /readings?sensor=123&limit=latest
  → TTL 1min (données changent constamment)
```

### "Rate limiting rejette requêtes légitimes"
```
Vérifiez:
1. Quota utilisateur approprié?
   GET /api/quota/user
   Si insuffisant: Upgrade plan ou exception

2. Distribué les requêtes dans le temps
   Au lieu de: 1,000 req en 1 seconde
   Essayez: Spread sur 60 secondes
   
3. Batch APIs pour réduire nombre requêtes
   Voir endpoint /api/batch
   
4. Cache côté client
   Évitez re-requêtes données identiques
```

## Bonnes pratiques

1. **Monitoring régulier**
   - Vérifiez dashboard chaque semaine
   - Alertes si hit rate < 80%
   - Alertes si P95 latence > 200ms

2. **Tuning continu**
   - Une optimisation à la fois
   - Mesurer avant/après
   - Documenter changements

3. **Caching stratégique**
   - Cache données stables longtemps
   - TTL court pour données changeantes
   - Invalider au besoin, pas trop souvent

4. **Archivage régulier**
   - Données > 3 ans: Archive
   - Libère ressources production
   - Analyse historique toujours possible

5. **Planning capacité**
   - Croissance 30%/an moyenne
   - Upgrade matériel avant saturation
   - Monitor trends long-terme

## API Performance

```bash
# Statistiques caching
GET /api/admin/performance/cache/stats
Response: {
    "hit_rate": 0.875,
    "size_bytes": 245000000,
    "items_cached": 15430,
    "avg_ttl_seconds": 29880
}

# Requêtes lentes
GET /api/admin/performance/slow-queries?limit=10

# Configuration cache
PATCH /api/admin/performance/cache/config
{
    "ttl_seconds": 3600,
    "max_size_bytes": 500000000
}

# Rate limit status
GET /api/admin/performance/rate-limit/status/{user_id}
```

## Prochaines étapes

- [Dépannage avancé](TROUBLESHOOTING_FR.md)
- [Architecture système](ARCHITECTURE_FR.md)
- [Upgrade/Migration guide](UPGRADE_FR.md)
- [Support technique](https://support.morpheus.io)

---

*Pour assistance performance, contactez [support.morpheus.io/perf](https://support.morpheus.io)*
