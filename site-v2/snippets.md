## Section 2 — Flask & Auth (Personne 2)

### Snippet 1 — La "factory" Flask (`app.py`)

**Ce que montre le snippet de la présentation :**
```python
def creer_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, origins=['*'])
    socketio = SocketIO(app, async_mode='threading')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    ...
    return app, socketio
```

**Explication :**

Imaginez que vous construisez une maison. Flask, c'est le terrain vide. La fonction `créer_app()` est le plan de construction : elle branche l'électricité (la base de données), installe la serrure (JWT), ouvre les fenêtres pour que l'extérieur puisse entrer (CORS), installe l'interphone en temps réel (Socket.IO), et numérote les pièces (les blueprints = les dossiers de routes).

- **`Flask(__name__)`** : crée le serveur web
- **`db.init_app(app)`** : branche la base de données SQLite
- **`JWTManager(app)`** : installe le système de tokens de connexion (comme un badge d'accès numérique)
- **`CORS(app, origins=['*'])`** : autorise le navigateur à parler à ce serveur depuis n'importe quelle adresse (sinon le navigateur bloque pour des raisons de sécurité)
- **`SocketIO(...)`** : ouvre un canal de communication en temps réel (pour que les données arrivent en direct sur le dashboard)
- **`app.register_blueprint(...)`** : enregistre chaque "module" de l'API à une adresse précise, comme des départements dans une entreprise — `/api/auth` pour tout ce qui est connexion, `/api/sensors` pour les capteurs, etc.

---

### Snippet 2 — Le login JWT (`routes/auth.py`)

**Ce que montre le snippet de la présentation :**
```python
@auth_bp.route('/login', methods=['POST'])
def connexion():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if not user or not bcrypt.checkpw(...):
        return jsonify({'error': 'Identifiants invalides'}), 401
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return jsonify({'access_token': ..., 'refresh_token': ..., 'user': ...}), 200
```

**Explication :**

Quand vous vous connectez à un site web, voici ce qui se passe dans les coulisses :

1. Vous envoyez votre email et mot de passe → `request.get_json()` les récupère
2. On cherche si cet email existe dans la base de données → `User.query.filter_by(email=...).first()`
3. Si l'utilisateur n'existe pas, ou si le mot de passe ne correspond pas, on renvoie une erreur 401 (code universel = "non autorisé")
4. Le mot de passe n'est **jamais stocké en clair** — il est stocké haché (transformé de façon irréversible). `bcrypt.checkpw()` compare le mot de passe tapé avec ce hash. Si quelqu'un vole la base de données, il ne voit que du charabia.
5. Si tout va bien, on génère deux "tokens" (jetons) :
   - L'**access token** : une sorte de badge qui dure 24h, que le navigateur présente à chaque requête pour prouver qui il est
   - Le **refresh token** : un badge longue durée (30 jours) qui permet de renouveler l'access token sans se reconnecter

---

## Section 3 — IA, Mistral et Simulation (Personne 3)

### Snippet 1 — Streaming Mistral en SSE (`routes/ai.py`)

**Ce que montre le snippet de la présentation :**
```python
def generate():
    resp = req.post(MISTRAL_URL, json={...,'stream': True}, stream=True)
    for raw_line in resp.iter_lines():
        ...
        chunk = json.loads(payload)
        content = chunk.get('choices'...
        if content:
            yield f"data: {json.dumps({'token': content})}\n\n"
```

**Explication :**

Normalement, quand vous posez une question à une IA, vous attendez qu'elle finisse de réfléchir, puis elle vous envoie toute la réponse d'un coup. Le **streaming** change ça : l'IA vous envoie sa réponse mot par mot (ou "token" par token) au fur et à mesure qu'elle l'écrit, exactement comme vous le voyez sur ChatGPT.

Techniquement, cela passe par un protocole appelé **SSE (Server-Sent Events)** : le serveur garde la connexion ouverte et "pousse" des petits morceaux de données dès qu'ils sont disponibles.

- `stream=True` dans la requête à Mistral : on dit à Mistral "envoie-moi les morceaux au fil de l'eau"
- `resp.iter_lines()` : on lit les lignes une par une au fur et à mesure qu'elles arrivent
- `yield f"data: ..."` : on retransmet chaque morceau immédiatement au navigateur. Le mot `yield` est ce qui fait que la fonction reste "ouverte" et envoie progressivement, au lieu de tout calculer d'abord.

---

### Snippet 2 — Forecast tendance + saisonnalité (`routes/ai.py`)

**Ce que montre le snippet de la présentation :**
```python
def _forecast_metric(values, hours):
    slope, intercept = np.polyfit(t, values, 1)
    trend = np.polyval([slope, intercept], t)
    residuals = values - trend
    ...
    for i, h in enumerate(hours):
        trend_val = slope * t_future + intercept
        seasonal = pattern.get(h % 24, 0.0) * 0.6
        result.append(float(np.clip(trend_val + seasonal, 350, 2500)))
```

**Explication :**

Pour prédire le CO₂ dans les prochaines 24h, on utilise deux mécanismes combinés :

**1. La tendance globale (régression linéaire) :**
Imaginez que vous tracez une droite à travers tous les points de mesure passés. `np.polyfit(t, values, 1)` calcule exactement cette droite (le `1` = degré 1 = droite). Si le CO₂ monte en général, la droite monte. Elle vous donne une `slope` (pente) et un `intercept` (point de départ).

**2. La saisonnalité horaire :**
Après avoir tracé la droite, on regarde les "écarts" entre la droite et les vraies mesures (`residuals = values - trend`). Ces écarts ont un motif : à 9h le matin, le CO₂ monte toujours parce que les gens arrivent au bureau. À 2h du matin, il descend toujours. Le code calcule la déviation moyenne pour chaque heure de la journée (`pattern`), puis applique ce motif aux prévisions futures avec un facteur d'atténuation de `0.6` (on "doute" un peu du motif, alors on l'atténue).

**3. `np.clip(... 350, 2500)`** : on s'assure que les prédictions restent dans des valeurs physiquement réalistes (le CO₂ ne peut pas descendre sous 350 ppm dans l'atmosphère terrestre, ni dépasser 2500 dans ce contexte).

---

### Snippet 3 — Simulation par type de pièce (`sensor_simulator.py`)

**Ce que montre le snippet de la présentation :**
```python
PROFILS_CAPTEURS = {
    'Bureau Principal': {'base_co2': 650, 'occupancy_factor': 0.8},
    'Salle de Reunion Alpha': {'base_co2': 800, 'occupancy_factor': 1.5},
    'Salle Serveur': {'base_co2': 450, 'occupancy_factor': 0.1},
}
def generer_motif_co2(heure, base, facteur_occupance=1.0, nom_capteur=''):
    if 'Salle de Reunion' in nom_capteur:
        decalage = {9: 300, 10: 400, 14: 400}.get(heure, 0)
    ...
    variation = random.randint(-50, 50)
    return max(400, min(1500, base + int(decalage * facteur_occupance) + variation))
```

**Explication :**

Puisqu'on n'a pas de vrais capteurs physiques branchés, il faut **simuler** des données réalistes. Le principe :

- Chaque type de pièce a un profil de base : la salle de réunion a un CO₂ de base plus élevé (800 ppm) et un facteur d'occupation élevé (1.5 = très occupée). La salle serveur n'a presque personne (0.1).
- À certaines heures, on ajoute un "décalage" : à 9h et 14h dans une salle de réunion (heure de début de réunion typique), le CO₂ monte de 400 ppm supplémentaires.
- On multiplie ce décalage par l'`occupancy_factor` : une pièce très occupée verra son CO₂ monter davantage.
- On ajoute `random.randint(-50, 50)` : du bruit aléatoire pour que les courbes ne soient pas trop "parfaites" et ressemblent à de vraies mesures.
- `max(400, min(1500, ...))` : encore une fois, on borne les valeurs dans du réaliste.

---

## Section 4 — Base de données (Personne 4)

### Snippet 1 — Modèle `Sensor` (`database.py`)

**Ce que montre le snippet de la présentation :**
```python
class Sensor(db.Model):
    __tablename__ = 'sensors'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    ...
    threshold_co2 = db.Column(db.Float, nullable=True)
    readings = db.relationship('SensorReading', backref='sensor', lazy=True, cascade='all, delete-orphan')
```

**Explication :**

SQLAlchemy (la bibliothèque utilisée) permet d'écrire des classes Python qui correspondent directement à des tables dans une base de données. Chaque classe = une table. Chaque `db.Column` = une colonne.

- **`primary_key=True`** sur `id` : chaque capteur a un numéro unique. Comme un numéro de sécurité sociale pour les capteurs.
- **`db.ForeignKey('users.id')`** sur `user_id` : ce capteur "appartient" à un utilisateur. C'est comme écrire le nom du propriétaire sur un objet. Si on efface l'utilisateur, la base de données sait que ce capteur lui appartenait.
- **`threshold_co2 = db.Column(db.Float, nullable=True)`** : chaque capteur peut avoir un seuil CO₂ personnalisé. `nullable=True` signifie que c'est optionnel — si on ne met rien, le système utilise les valeurs par défaut.
- **`db.relationship('SensorReading', ..., cascade='all, delete-orphan')`** : quand on supprime un capteur, toutes ses lectures sont automatiquement supprimées aussi. Sinon on aurait des lectures "orphelines" qui pointent vers un capteur qui n'existe plus — une incohérence de données.

---

### Snippet 2 — `vers_dict()` (`database.py`)

**Ce que montre le snippet de la présentation :**
```python
def vers_dict(self, inclure_derniere_lecture=False):
    result = {
        'id': str(self.id),
        'name': self.name,
        'thresholds': {'co2': self.threshold_co2, ...},
    }
    if inclure_derniere_lecture and self.readings:
        derniere = max(self.readings, key=lambda r: r.recorded_at)
        result['co2'] = derniere.co2
        ...
    return result
```

**Explication :**

Le frontend (la page web en React/TypeScript) ne parle pas Python — il parle JSON (un format texte universel, comme un dictionnaire structuré). La méthode `vers_dict()` est le **traducteur** : elle transforme un objet Python (`Sensor`) en dictionnaire JSON que le navigateur peut comprendre.

Le paramètre `inclure_derniere_lecture` est une optimisation intelligente : normalement, afficher la liste des capteurs n'a pas besoin de toutes leurs données. Mais si on veut afficher l'état actuel de chaque capteur (le dashboard en temps réel), on passe `inclure_derniere_lecture=True` et la fonction va chercher la lecture la plus récente et l'ajoute au résultat — sans faire une deuxième requête à la base de données séparément.