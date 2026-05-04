# Guide des fonctionnalites

Description fonctionnelle des capacites actuelles d'Aerium.

## 1. Authentification et gestion des roles

- Inscription/connexion JWT.
- Refresh token.
- Profil utilisateur.
- Role admin avec privileges etendus.

## 2. Gestion des capteurs

- Creation, lecture, mise a jour, suppression.
- Types supportes : `simulation`, `real`.
- Seuils personnalises par capteur : CO2, temperature min/max, humidite.
- Filtrage/recherche/tri dans la liste.

## 3. Acquisition des mesures

- Ajout de lectures via API interne (`/api/readings`).
- Ingestion IoT externe via cle API (`/api/readings/external/<key>`).
- Lecture courante et historique par capteur.
- Agregats multi-capteurs.

## 4. Temps reel

- Socket.IO cote serveur et client.
- Emission ciblee par utilisateur/admin.
- Donnees simulation mises a jour periodiquement.

## 5. Alertes

- Generation automatique sur depassement de seuil.
- Gestion cycle de vie : nouvelle -> reconnue -> resolue.
- Historique, statistiques et projection.

## 6. Rapports et export

- Export CSV.
- Export PDF.
- Statistiques de reporting.

## 7. Maintenance

- Planification de taches.
- Suivi de statut et priorite.
- Marquage automatique des taches en retard.

## 8. IA et recommandations

- Chat SSE.
- Recommandations operationnelles.
- Predictions dediees.
- Fallback automatique si fournisseur IA indisponible.

## 9. Administration

- Vue systeme avancee.
- Liste utilisateurs globale.
- Controle vitesse de simulation.

## 10. Qualite logicielle

- Scripts de tests Python dans `tests`.
- Tests frontend via Vitest.
- Logging backend et endpoints de sante.
