# Roadmap produit et technique

Roadmap simplifiee pour orienter les evolutions d'Aerium.

## Horizon court terme (0-2 mois)

- Finaliser la coherence UX sur les ecrans analytics/reports.
- Durcir les validations de payload backend.
- Completer les tests automatises sur endpoints critiques.
- Clarifier les messages d'erreur cote frontend.

## Horizon moyen terme (2-6 mois)

- Ajouter versionnement API explicite (`/api/v1`).
- Introduire migrations DB structurees (Alembic ou equivalent).
- Renforcer observabilite (metriques + traces).
- Etendre la gestion multi-sites/multi-zones.

## Horizon long terme (6+ mois)

- Passage a une base relationnelle de production (PostgreSQL).
- Broker temps reel dedie (Redis / message bus).
- Durcissement securite (rotation secrets, audit renforce, politique RBAC fine).
- Industrialisation deployment (CI/CD complet, environnement staging).

## Chantiers transverses

- Documentation vivante alignee code.
- Reduction de la dette technique legacy.
- Performance sur agregations et export volumineux.
- Accessibilite et ergonomie des vues metier.

## Definition de pret pour une livraison

1. Endpoints couverts par tests de non-regression.
2. Documentation mise a jour.
3. Verification manuelle smoke test (auth, capteurs, alertes, rapports).
4. Journal de changement documente.
