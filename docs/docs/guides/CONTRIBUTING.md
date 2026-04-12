# 🤝 Guide de Contribution

**Date:** février 2026

Merci d'intéresser à Aerium! Ce guide vous aidera à contribuer au projet.

---

## 🚀 Démarrage Rapide

### 1. Fork & Clone

```bash
# Fork le repository sur GitHub
# Cloner votre fork
git clone https://github.com/YOUR-USERNAME/air-sense-dashboard.git
cd air-sense-dashboard

# Ajouter upstream
git remote add upstream https://github.com/ORIGINAL-OWNER/air-sense-dashboard.git
```

### 2. Configuration Locale

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python seed_database.py
python app.py
```

**Frontend:**
```bash
npm install
npm run dev
```

### 3. Créer une Branche

```bash
# Mettre à jour main
git fetch upstream
git checkout main
git merge upstream/main

# Créer branche feature
git checkout -b feature/nom-descriptif
# Ou pour bug fix
git checkout -b fix/nom-descriptif
```

---

## 📋 Types de Contributions

### 🐛 Signaler un Bug

Créer une issue avec:
- **Titre clair** - Ex: "WebSocket disconnect lag after 5 min"
- **Description** - Quoi, comment reproduire, résultat attendu
- **Environnement** - OS, navigateur, versions
- **Screenshots** - Si applicable

**Template:**
```markdown
## Description du Bug
[Description courte]

## Étapes pour Reproduire
1. ...
2. ...
3. ...

## Résultat Attendu
[Quoi devrait se passer]

## Résultat Réel
[Quoi se passe réellement]

## Environnement
- OS: [ex: Ubuntu 20.04]
- Navigateur: [ex: Chrome 120]
- Node: [ex: 18.12.0]
- Python: [ex: 3.9.13]
```

### 🌟 Proposer une Fonctionnalité

Créer une issue "Feature" avec:
- **Titre** - Description courte
- **Use case** - Pourquoi c'est nécessaire
- **Proposé** - Votre idée de solution
- **Alternatives** - Autres approches

**Template:**
```markdown
## Description
[Description de la fonctionnalité]

## Cas d'Usage
[Pourquoi c'est utile]

## Proposé
[Comment l'implémenter]

## Alternatives
[Autres approches envisagées]
```

### ✅ Implémenter une Fonctionnalité

Avant de commencer:
1. Discuter dans une issue (ou créer une)
2. Attendre approbation mainteneurs
3. Assigner l'issue à vous-même

---

## 💻 Processus de Développement

### Structure du Code

**Backend (Python/Flask):**
```
backend/
├── app.py              # Application main
├── config.py          # Configuration
├── database.py        # Modèles ORM
├── routes/
│   ├── auth.py
│   ├── sensors.py
│   └── ...
└── requirements.txt
```

**Frontend (React/TypeScript):**
```
src/
├── components/        # Composants React
├── pages/            # Pages/Routes
├── hooks/            # Hooks custom
├── lib/              # Utilitaires
└── types/            # Types TypeScript
```

### Conventions de Code

**Python:**
```python
# Style: PEP 8
# Imports: alphabétique
import os
import sys
from datetime import datetime

# Fonctions/Variables: snake_case
def create_sensor(name: str, location: str) -> dict:
    """Fonction bien documentée"""
    pass

# Classes: PascalCase
class SensorManager:
    pass
```

**TypeScript/React:**
```typescript
// Imports: organisés par type
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

// Composants: PascalCase
const SensorCard: React.FC<Props> = ({ sensor }) => {
  return <div>{sensor.name}</div>;
};

// Fonctions: camelCase
const handleSensorCreate = (data: CreateSensorInput) => {
  // ...
};

// Variables: camelCase
const [isLoading, setIsLoading] = useState(false);
```

### Commits

**Format:**
```
type(scope): description courte

Description détaillée (optionnel)

Fixes #issue_number
```

**Types:**
- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `docs` - Documentation
- `style` - Formatage (pas de logique)
- `refactor` - Restructuration
- `test` - Tests
- `chore` - Maintenance

**Exemples:**
```
feat(sensors): add sensor search by location
fix(auth): resolve JWT token expiration bug
docs(api): update API reference guide
refactor(dashboard): improve component structure
test(readings): add unit tests for calculations
```

### Pull Requests

**Avant de soumettre:**

1. **Code Review Personnel**
   ```bash
   # Vérifier les changements
   git diff main
   
   # Tests
   npm run test
   npm run lint
   
   # Build
   npm run build
   ```

2. **Fetch & Rebase**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

3. **Push vers votre fork**
   ```bash
   git push origin feature/nom-descriptif
   ```

4. **Créer PR**
   - Base: `main` du repo original
   - Compare: votre branche
   - Titre: même que commit principal
   - Description: détaillez les changements

**Template PR:**
```markdown
## Description
[Quoi change et pourquoi]

## Type de Changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Tests manuels OK

## Checklist
- [ ] Code suivi les conventions
- [ ] Documentation à jour
- [ ] Pas de code mort
- [ ] Pas de console.log()
- [ ] Pas de hardcoded values
```

---

## 🧪 Tests

### Backend (Python)

```bash
# Installer pytest
pip install pytest pytest-cov

# Lancer tests
pytest backend/tests/

# Avec couverture
pytest --cov=backend backend/tests/

# Test spécifique
pytest backend/tests/test_auth.py::test_login
```

**Exemple test:**
```python
# backend/tests/test_sensors.py
import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as client:
        yield client

def test_create_sensor(client):
    response = client.post('/api/sensors', json={
        'name': 'Test Sensor',
        'location': 'Test Location',
        'sensor_type': 'MULTI'
    })
    assert response.status_code == 201
    assert response.json['name'] == 'Test Sensor'
```

### Frontend (React)

```bash
# Installer vitest
npm install -D vitest

# Lancer tests
npm run test

# Watch mode
npm run test:watch

# Avec couverture
npm run test -- --coverage
```

**Exemple test:**
```typescript
// src/components/__tests__/SensorCard.test.tsx
import { render, screen } from '@testing-library/react';
import { SensorCard } from '../SensorCard';

describe('SensorCard', () => {
  it('renders sensor name', () => {
    const sensor = {
      id: 1,
      name: 'Cuisine',
      location: 'RDC'
    };
    
    render(<SensorCard sensor={sensor} />);
    expect(screen.getByText('Cuisine')).toBeInTheDocument();
  });
});
```

---

## 📚 Documentation

### Améliorer la Documentation

1. **README** - Vue d'ensemble, démarrage rapide
2. **Guides** - Déploiement, architecture, API
3. **Code comments** - Expliquer la logique complexe
4. **Docstrings** - Documenter fonctions/classes

**Style Docstring Python:**
```python
def create_sensor(name: str, location: str) -> Sensor:
    """
    Créer un nouveau capteur.
    
    Args:
        name: Nom du capteur
        location: Localisation
    
    Returns:
        Sensor: Le capteur créé
    
    Raises:
        ValueError: Si le nom est vide
    """
    pass
```

**Style JSDoc TypeScript:**
```typescript
/**
 * Crée un nouveau capteur
 * @param name - Nom du capteur
 * @param location - Localisation
 * @returns Le capteur créé
 * @throws Si le nom est vide
 */
function createSensor(
  name: string,
  location: string
): Sensor {
  // ...
}
```

---

## 🔧 Outils & Ressources

### Outils Recommandés

- **IDE**: VS Code
- **Extensions VS Code**: 
  - Python
  - Pylance
  - ES7+ React/Redux/React-Native snippets
  - Prettier
  - ESLint

- **CLI Tools**:
  - Git
  - Node.js / npm
  - Python / pip

### Linting & Formatting

**Backend (Python):**
```bash
# Linting
pip install flake8
flake8 backend/

# Formatting
pip install black
black backend/

# Type checking
pip install mypy
mypy backend/
```

**Frontend:**
```bash
# ESLint
npm run lint

# Prettier
npm run format

# Type checking
npm run type-check
```

---

## 📈 Bonnes Pratiques

### Performance

- **Backend**: Utiliser l'indexation DB, caching
- **Frontend**: Lazy loading, code splitting, memoization
- **API**: Limiter les données retournées, pagination

### Sécurité

- **Input validation**: Valider côté serveur ET client
- **Authentication**: JWT + refresh tokens
- **Secrets**: Jamais hardcoder, utiliser .env
- **CORS**: Configuration stricte en production

### Maintenabilité

- **DRY**: Don't Repeat Yourself
- **SOLID**: Principes de design
- **Comments**: Expliquer le "pourquoi" pas le "quoi"
- **Types**: Utiliser TypeScript, type hints Python

### Accessibilité

- **Sémantique HTML**: Utiliser bons tags
- **ARIA labels**: Aider screen readers
- **Contraste**: WCAG AA minimum
- **Keyboard**: Tous les éléments accessibles au clavier

---

## 🚀 Release Process

Géré par les mainteneurs.

**Versioning:** Semantic Versioning (MAJOR.MINOR.PATCH)

```bash
# Bug fix: PATCH
1.0.0 → 1.0.1

# Nouvelle feature: MINOR
1.0.0 → 1.1.0

# Breaking change: MAJOR
1.0.0 → 2.0.0
```

---

## 📞 Besoin d'Aide?

- 💬 Discussions GitHub
- 📧 Email: support@aerium-app.com
- 🐛 Issues
- 📚 Documentation

---

## ✅ Checklist Final

Avant de soumettre votre PR:

- [ ] Branche à jour avec `main`
- [ ] Commits bien formatés
- [ ] Tests passent (backend + frontend)
- [ ] Linting OK
- [ ] Pas de console.log()
- [ ] Documentation à jour
- [ ] Screenshots si UI change
- [ ] Description PR complète
- [ ] Référence issue associée
- [ ] Pas de breaking changes (sauf si prévu)

---

**Merci de contribuer à Aerium! 🙏**

Dernière mise à jour: février 2026
