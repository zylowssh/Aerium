# Guide utilisateur

Guide operationnel de l'application web Aerium.

## 1. Connexion

1. Ouvrez `http://localhost:5173`.
2. Creez un compte ou connectez-vous.
3. Apres authentification, vous arrivez sur le tableau de bord.

## 2. Tableau de bord

Le tableau de bord fournit :

- synthese des capteurs,
- etat CO2 global,
- tendances recentes,
- acces rapide vers alertes, analytics et maintenance.

## 3. Gestion des capteurs

Dans la vue `Capteurs` :

- creer un capteur,
- modifier nom/localisation/type,
- configurer les seuils personnalises,
- supprimer un capteur,
- consulter le detail capteur.

### Types de capteurs

- `simulation` : donnees generees automatiquement.
- `real` : ingestion via endpoint externe securise.

## 4. Lecture et analyses

- `Analytics` : vue temporelle, comparaisons et indicateurs.
- `Comparaison` : comparaison multi-capteurs.
- `Predictions` : projections et interpretation.

## 5. Alertes

- Visualiser les alertes actives.
- Marquer une alerte comme reconnue ou resolue.
- Consulter l'historique et les statistiques.

Bonnes pratiques :

- reconnaitre rapidement les alertes critiques,
- ajuster les seuils par capteur selon l'environnement reel.

## 6. Rapports

Fonctions disponibles :

- export CSV,
- export PDF,
- statistiques de synthese.

## 7. Maintenance

Le module maintenance permet de :

- planifier des operations,
- suivre le statut (planifie, en cours, termine, en retard),
- tracer notes et priorites.

## 8. Administration

Le role `admin` donne acces a :

- gestion de tous les utilisateurs,
- supervision systeme,
- controle de la vitesse de simulation.

## 9. Assistant IA

- Chat contextuel en streaming,
- recommandations d'actions,
- predictions dediees.

Si la cle IA n'est pas configuree, des reponses de secours restent disponibles.

## 10. Parametres

La page `Settings` permet notamment de regler :

- preferences d'affichage,
- options visuelles,
- comportements d'interface.

## 11. FAQ rapide

- Les donnees ne bougent pas : verifier backend + websocket.
- Connexion impossible : verifier l'URL API frontend (`VITE_API_URL`).
- Export vide : verifier qu'il existe des lectures dans la plage demandee.

Pour les incidents techniques : [DEPANNAGE.md](DEPANNAGE.md)
