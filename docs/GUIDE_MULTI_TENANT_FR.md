# Guide Multi-Locataires et Gestion d'Organisations - Morpheus CO₂

## Vue d'ensemble

Le système multi-locataires de Morpheus permet aux entreprises, écoles et organisations de gérer plusieurs emplacements, équipes et capteurs CO₂ centralisés avec contrôle granulaire des accès et des ressources.

## Concepts clés

### Hiérarchie organisationnelle

```
┌─────────────────────────────────────┐
│     Organisation (Locataire)        │
│  Exemple: Acme Corporation          │
├─────────────────────────────────────┤
│  ├─ Emplacements                     │
│  │  ├─ Paris (Bureau principal)      │
│  │  ├─ Lyon (Bureau secondaire)      │
│  │  └─ Bordeaux (Entrepôt)           │
│  │                                   │
│  ├─ Membres de l'équipe             │
│  │  ├─ Jean (Admin)                  │
│  │  ├─ Marie (Manager)               │
│  │  └─ Paul (Utilisateur)            │
│  │                                   │
│  └─ Quotas et limites               │
│     ├─ Appels API: 50,000/mois     │
│     ├─ Stockage: 500 GB             │
│     └─ Utilisateurs: 20             │
└─────────────────────────────────────┘
```

### Rôles et permissions

| Rôle | Organisations | Emplacements | Équipe | Quotas | Facturation |
|------|---------------|-------------|--------|--------|------------|
| **Owner** | Créer/Modifier | Complet | Complet | Complet | Complet |
| **Admin** | Lire/Modifier | Complet | Modifier | Lire | Lire |
| **Manager** | Lire | Complet | Modifier | Lire | - |
| **Utilisateur** | Lire | Lire | Lire | Lire | - |

## Guide d'utilisation

### Créer une nouvelle organisation

1. **Accédez à la gestion multi-locataires**
   ```
   Menu → Administration → Gestion d'organisations
   ou accédez directement: /organizations
   ```

2. **Cliquez sur "Nouvelle organisation"**
   ```
   ┌────────────────────────────────────┐
   │ Créer une organisation              │
   ├────────────────────────────────────┤
   │ Nom: [                           ]  │
   │ Description: [                   ]  │
   │ Plan: [Pro ▼]                       │
   │ Email admin: [                   ]  │
   │                                    │
   │        [Créer]  [Annuler]          │
   └────────────────────────────────────┘
   ```

3. **Remplissez les informations**
   - **Nom:** Nom officiel de l'organisation
   - **Description:** But/secteur (ex: "École Montessori")
   - **Plan:** Gratuit/Pro/Enterprise
   - **Email admin:** Pour notifications

4. **Confirmez et attendez l'activation**
   - L'organisation est créée dans quelques secondes
   - Les administrateurs reçoivent une notification
   - Les quotas par défaut sont attribués

### Ajouter des membres à l'équipe

1. **Onglet "Membres"**
   ```
   Tableau des membres actuels
   │ Nom      │ Email          │ Rôle    │ Actions    │
   ├──────────┼────────────────┼─────────┼────────────┤
   │ Jean     │ jean@acme.com  │ Admin   │ Édit Supp  │
   │ Marie    │ marie@acme.com │ Manager │ Édit Supp  │
   ```

2. **Cliquez sur "Ajouter un membre"**
   ```
   ┌────────────────────────────────────┐
   │ Ajouter un membre                   │
   ├────────────────────────────────────┤
   │ Email: [                          ]  │
   │ Rôle: [Manager ▼]                   │
   │ Notifications: ☑ Email              │
   │                                    │
   │        [Ajouter]  [Annuler]         │
   └────────────────────────────────────┘
   ```

3. **Sélectionnez le rôle approprié**
   - **Admin:** Gestion complète
   - **Manager:** Gestion des capteurs/données
   - **Utilisateur:** Visualisation seulement

4. **Envoyez l'invitation**
   - Email envoyé automatiquement
   - Valide 30 jours
   - Le membre confirme son compte

### Gérer les emplacements

1. **Onglet "Emplacements"**
   ```
   Gestion des sites physiques
   
   [Ajouter un emplacement]
   
   Emplacements existants:
   - Bureau Paris
   - Bureau Lyon
   - Entrepôt Bordeaux
   ```

2. **Ajouter un emplacement**
   ```
   ┌────────────────────────────────────┐
   │ Nouvel emplacement                  │
   ├────────────────────────────────────┤
   │ Nom: [Bureau Paris             ]   │
   │ Adresse: [Rue de Rivoli, 75001 ]   │
   │ Ville: [Paris         ]             │
   │ Pays: [France         ]             │
   │ Capteurs assignés: [ + ]             │
   │                                    │
   │        [Créer]  [Annuler]          │
   └────────────────────────────────────┘
   ```

3. **Assignez des capteurs**
   - Sélectionnez les capteurs à cet emplacement
   - Organisez logiquement par bâtiment/étage
   - Mettez à jour les emplacements au besoin

4. **Visualisez sur la carte**
   - Tous les emplacements sur une carte interactive
   - Cliquez pour détails et capteurs
   - Exportez les coordonnées GPS

### Consulter les quotas et limites

1. **Onglet "Quotas"**
   ```
   Plan Pro - Renouvellement: 15 février 2024
   
   ┌─────────────────────────────────────┐
   │ Appels API                          │
   │ Utilisé: 23,450 / 50,000            │
   │ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░  47%
   ├─────────────────────────────────────┤
   │ Stockage (GB)                       │
   │ Utilisé: 245 / 500                  │
   │ █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  49%
   ├─────────────────────────────────────┤
   │ Utilisateurs                        │
   │ Utilisé: 8 / 20                     │
   │ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  40%
   └─────────────────────────────────────┘
   ```

2. **Comprendre les quotas**
   - **Appels API:** Requêtes REST par mois
   - **Stockage:** Espace pour les données historiques
   - **Utilisateurs:** Comptes actifs maximal

3. **Actions si dépassement**
   - ⚠️ Alerte à 80% d'utilisation
   - Upgrade recommandé si régulièrement dépassé
   - Les nouvelles requêtes échouent si dépassé

## Cas d'usage réels

### Cas 1: École avec plusieurs bâtiments

```
Organisation: Lycée Généraliste "Molière"

Emplacements:
├─ Bâtiment A (Admin)
│  └─ 5 capteurs CO₂ en salle de classe
├─ Bâtiment B (Internat)
│  └─ 3 capteurs dans dortoirs
└─ Bâtiment C (Labo)
   └─ 2 capteurs en laboratoire

Équipe:
├─ Direction (Admin)
├─ Infirmière (Manager)
├─ Enseignants (Utilisateurs)
└─ Technicien (Admin technique)

Quotas: Plan Pro
- 50,000 appels API/mois
- 500 GB stockage
- 30 utilisateurs
```

### Cas 2: Réseau de stores commerciaux

```
Organisation: Retail Central Inc.

Emplacements:
├─ Store Paris Champs
│  └─ 4 capteurs (entrée, rayons, réserve)
├─ Store Paris Marais
│  └─ 3 capteurs (entrée, rayons)
├─ Store Lyon
│  └─ 2 capteurs (entrée, rayons)
└─ Store Marseille
   └─ 2 capteurs (entrée, rayons)

Équipe (Rôles par lieu):
├─ Siège (Admin - tous les sites)
├─ Managers locaux (Manager - leur store)
└─ Équipes (Utilisateurs - visualisation)

Quotas: Plan Enterprise
- Appels API illimités
- 5 TB stockage
- 100 utilisateurs
```

### Cas 3: Cabinet médical avec succursales

```
Organisation: Clinique Santé Plus

Emplacements:
├─ Paris Accueil
│  └─ 2 capteurs (salle attente, consultation)
├─ Paris Chirurgie
│  └─ 4 capteurs (bloc, réanimation)
└─ Banlieue Consultation
   └─ 1 capteur (salle d'attente)

Équipe:
├─ Direction Générale (Owner)
├─ Responsable Qualité (Admin)
├─ Directeurs de site (Managers)
├─ Personnel médical (Utilisateurs)

Quotas: Plan Pro
- Conformité norme sanitaire
- Alertes dépassement CO₂
```

## Gestion avancée

### Contrôle d'accès granulaire

```javascript
// Exemple API - Assigner permissions
POST /api/advanced/tenants/members/1/permissions
{
    "can_manage_org": true,
    "can_manage_sensors": true,
    "can_export_data": true,
    "can_manage_team": false,
    "can_view_billing": false
}
```

### Audit et conformité

```
Tous les accès sont tracés:
├─ Qui a accédé à quoi
├─ Quand et depuis où
├─ Quelle action
└─ Résultat (succès/erreur)

Rapport d'audit mensuel généré automatiquement
→ Utile pour RGPD, ISO, conformité
```

### Migration entre plans

```
Gratuit (Limité)
   ↓ (Upgrade)
Pro (50,000 requêtes/mois)
   ↓ (Upgrade)
Enterprise (Illimité)
```

Processus:
1. Cliquez "Upgrade" dans les quotas
2. Sélectionnez le nouveau plan
3. Acceptez la nouvelle facturation
4. Activé immédiatement avec crédit prorata

### Intégration SSO (Enterprise)

Pour les organisations Enterprise, configurez SAML/OAuth:

```
Utilisateurs: Auto-créés au premier login
Permissions: Mappées depuis votre annuaire
Deprovisioning: Automatique si suppression
```

## Dépannage

### "Je ne peux pas ajouter un nouveau membre"
```
Vérifiez:
✓ Votre rôle (Admin requis)
✓ Quota utilisateurs pas atteint
✓ Email valide et pas déjà inscrit
✓ Invitations pas expirées
```

### "L'emplacement n'apparaît pas sur la carte"
```
→ Vérifiez les coordonnées GPS
→ Ré-entrez adresse complète
→ Essayez latitude/longitude exact
→ Contactez support si géolocalisation échoue
```

### "Dépassement quota - les requests échouent"
```
Urgence:
1. Upgrade du plan recommandé
2. Nettoyage des anciennes données
3. Compression des données archivées

Options:
→ Upgrade Plan Pro/Enterprise
→ Demander quota supplémentaire
→ Archiver données > 1 an
```

### "Un membre ne voit pas les données"
```
Vérifiez:
✓ Son rôle et permissions
✓ Les capteurs assignés à son emplacement
✓ Qu'il a accepté l'invitation email
✓ Son accès pas révoqué
```

## Bonnes pratiques

1. **Organisez logiquement**
   - Groupez par site physique
   - Nommez clairement
   - Documentez la structure

2. **Gestion des accès**
   - Privilège minimum
   - Auditez régulièrement
   - Révoquez les comptes inactifs

3. **Surveillance des quotas**
   - Planifiez la croissance
   - Upgradez avant saturation
   - Alertes automatiques à 80%

4. **Documentation**
   - Docs d'onboarding membre
   - Procédures par rôle
   - Contacts escalade

5. **Sécurité**
   - Authentification forte (2FA)
   - HTTPS obligatoire
   - Logs d'audit conservés 1 an

## API de gestion

```bash
# Créer organisation
POST /api/advanced/tenants
{
    "name": "Acme Corp",
    "subscription_tier": "pro"
}

# Ajouter membre
POST /api/advanced/tenants/members
{
    "tenant_id": 1,
    "email": "user@exemple.com",
    "role": "Manager"
}

# Ajouter emplacement
POST /api/advanced/tenants/locations
{
    "tenant_id": 1,
    "name": "Bureau Paris",
    "address": "Rue de Rivoli, 75001"
}

# Consulter quotas
GET /api/advanced/tenants/quotas

# Modifier permissions
PATCH /api/advanced/tenants/members/1
{
    "role": "Admin"
}
```

## Prochaines étapes

- [Guide de collaboration d'équipe](GUIDE_COLLABORATION_FR.md)
- [Configuration avancée API](API-REFERENCE.md)
- [Gestion de facturation](GUIDE_BILLING_FR.md)
- [FAQ Multi-locataires](FAQ_MULTI_TENANT_FR.md)

---

*Pour support, visitez [support.morpheus.io](https://support.morpheus.io) ou contactez votre Account Manager.*
