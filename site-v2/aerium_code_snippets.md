# Aerium - Presentation complete du projet (site-v2 + app)

Objectif: surveiller la qualite de l'air interieur (CO2, temperature, humidite) avec deux experiences complementaires: une application Kivy pour l'usage local, et une plateforme web site-v2 (frontend + backend Flask) avec auth, temps reel, IA Mistral, simulation et base de donnees.

## Stack du projet

- KivyMD (desktop)
- Flask + JWT + Socket.IO
- Mistral API + Numpy/Pandas
- SQLite + SQLAlchemy

## Repartition equipe (4 personnes)

- Personne 1: Kivy app (UX locale, navigation, visualisation, alarmes)
- Personne 2: Flask + Auth (API, securite JWT, WebSocket, routes metier)
- Personne 3: IA + Mistral + Simulation (chat IA, recommandations, previsions et donnees simulees)
- Personne 4: Base de donnees (modeles, relations, serialisation API, coherence schema)

---

## 1) Kivy app

Intervenant: Personne 1

### Ce qui a ete realise

- Structure multi-ecrans avec login puis interface principale.
- Ecran CO2: statistiques, graphe, bascule flux actuel / 30 jours.
- Capture de mesures periodiques avec feedback direct via snackbar.
- Ecran alarmes: creation, affichage, persistance des alarmes utilisateur.

### Script oral (1 min 30)

- "J'ai developpe la partie application locale avec KivyMD."
- "L'utilisateur se connecte puis accede a 2 onglets: CO2 et Alarmes."
- "Le mode flux montre les dernieres mesures, et le mode 30 jours montre la tendance."
- "On peut enregistrer des lectures en continu et recevoir un feedback qualite de l'air."

Contrainte respectee: pas de snippet de code dans cette section Kivy, comme demande.

---

## 2) Flask app et Auth

Intervenant: Personne 2

### Ce qui a ete realise

- Factory Flask complete avec initialisation DB, JWT, CORS, Socket.IO, scheduler.
- Architecture modulaire par blueprints (auth, sensors, readings, alerts, reports, ai).
- Auth securisee: register/login/refresh/me avec tokens access + refresh.
- WebSocket protege: validation du JWT puis attribution a une room utilisateur.

### Script oral (1 min 30)

- "J'ai construit l'API Flask modulaire qui sert tout le projet web."
- "Le JWT protege les routes et la connexion WebSocket en temps reel."
- "Chaque utilisateur recoit ses propres evenements via sa room Socket.IO."
- "On obtient un backend evolutif, propre et reutilisable."

### Snippet 1 - Factory Flask + enregistrement des blueprints (backend/app.py)

```python
def creer_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt = JWTManager(app)
    CORS(app, origins=['*'])
    socketio = SocketIO(app, async_mode='threading')

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(capteurs_bp, url_prefix='/api/sensors')
    app.register_blueprint(alertes_bp, url_prefix='/api/alerts')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')

    with app.app_context():
        init_db()

    initialiser_planificateur(app, socketio)
    return app, socketio
```

Explication: ce bloc cree le serveur et branche toutes les briques techniques. Le pattern factory facilite les tests, et la separation en blueprints rend l'API lisible et maintenable.

### Snippet 2 - Login JWT avec verification bcrypt (backend/routes/auth.py)

```python
@auth_bp.route('/login', methods=['POST'])
def connexion():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if not user or not bcrypt.checkpw(
        data['password'].encode('utf-8'),
        user.password_hash.encode('utf-8')
    ):
        return jsonify({'error': 'Identifiants de connexion invalides'}), 401

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.vers_dict()
    }), 200
```

Explication: le mot de passe est compare au hash bcrypt (jamais en clair), puis l'API genere deux tokens. Access token pour l'acces immediat, refresh token pour renouveler la session sans reconnecter l'utilisateur.

---

## 3) IA, Mistral et Simulation

Intervenant: Personne 3

### Ce qui a ete realise

- Endpoint de chat IA SSE qui stream les tokens Mistral en temps reel.
- Moteur de prevision 24h avec trend + saisonnalite horaire (numpy/pandas).
- Narration IA des previsions pour guider les actions utilisateur.
- Simulation de capteurs par profils de pieces et comportements horaires.

### Script oral (1 min 30)

- "J'ai integre Mistral pour transformer les mesures en insights exploitables."
- "Le chat est en streaming, donc la reponse apparait token par token en direct."
- "La prevision calcule la tendance CO2 sur 24h avec intervalles de confiance."
- "La simulation permet de tester des scenarios realistes meme sans capteurs physiques."

### Snippet 1 - Streaming Mistral en SSE (backend/routes/ai.py)

```python
def generate():
    resp = req.post(MISTRAL_URL, json={
        'model': _mistral_model(),
        'messages': mistral_messages,
        'stream': True,
    }, stream=True, timeout=30)

    for raw_line in resp.iter_lines():
        if not raw_line:
            continue
        line = raw_line.decode('utf-8')
        if not line.startswith('data: '):
            continue

        payload = line[6:]
        if payload.strip() == '[DONE]':
            yield f"data: {json.dumps({'done': True})}\n\n"
            return

        chunk = json.loads(payload)
        content = chunk.get('choices', [{}])[0].get('delta', {}).get('content', '')
        if content:
            yield f"data: {json.dumps({'token': content})}\n\n"
```

Explication: l'API lit les morceaux de reponse envoyes par Mistral et les renvoie au frontend au fil de l'eau. Resultat: une experience de chat fluide et dynamique, sans attendre toute la reponse finale.

### Snippet 2 - Forecast tendance + saisonnalite (backend/routes/ai.py)

```python
def _forecast_metric(values, hours):
    slope, intercept = np.polyfit(t, values, 1)
    trend = np.polyval([slope, intercept], t)
    residuals = values - trend
    std = float(np.std(residuals)) or 1.0

    pattern = {}
    hour_of_day = df['recorded_at'].dt.hour.values
    for h in range(24):
        mask = hour_of_day == h
        pattern[h] = float(np.mean(residuals[mask])) if mask.any() else 0.0

    result = []
    for i, h in enumerate(hours):
        t_future = n + i
        trend_val = slope * t_future + intercept
        seasonal = pattern.get(h % 24, 0.0) * 0.6
        result.append(float(np.clip(trend_val + seasonal, 350, 2500)))

    return result, slope, std
```

Explication: on combine une tendance globale (regression lineaire) et un motif horaire (saisonnalite). Cela donne des previsions robustes et simples a expliquer devant une classe.

### Snippet 3 - Simulation realiste par type de piece (backend/sensor_simulator.py)

```python
PROFILS_CAPTEURS = {
    'Bureau Principal': {'base_co2': 650, 'occupancy_factor': 0.8},
    'Salle de Reunion Alpha': {'base_co2': 800, 'occupancy_factor': 1.5},
    'Salle Serveur': {'base_co2': 450, 'occupancy_factor': 0.1},
}

def generer_motif_co2(heure, base, facteur_occupance=1.0, nom_capteur=''):
    if 'Salle de Reunion' in nom_capteur:
        decalage = {9: 300, 10: 400, 14: 400}.get(heure, 0)
    elif 'Cafeteria' in nom_capteur:
        decalage = {8: 150, 12: 350, 13: 300}.get(heure, -100)
    else:
        decalage = {8: 100, 10: 250, 14: 300, 18: 50}.get(heure, 0)

    variation = random.randint(-50, 50)
    return max(400, min(1500, base + int(decalage * facteur_occupance) + variation))
```

Explication: chaque capteur simule un contexte (bureau, reunion, serveur) avec des pics horaires differents. On injecte aussi du bruit aleatoire pour eviter des courbes artificielles trop parfaites.

---

## 4) Base de donnees

Intervenant: Personne 4

### Ce qui a ete realise

- Modeles SQLAlchemy clairs: User, Sensor, SensorReading, Alert, AlertHistory, Maintenance.
- Relations et cascades pour garder une base coherente lors des suppressions.
- Seuils personnalises par capteur (CO2, temp min/max, humidite).
- Methode vers_dict pour exposer des objets directement exploitables par le frontend.

### Script oral (1 min 30)

- "J'ai defini le schema base de donnees et les relations metier."
- "Chaque capteur appartient a un utilisateur et stocke ses lectures dans l'historique."
- "On gere des seuils personnalises et une serialisation uniforme vers JSON."
- "Cette structure rend l'API stable et evolutive pour la suite du projet."

### Snippet 1 - Modele Sensor avec seuils et relation lectures (backend/database.py)

```python
class Sensor(db.Model):
    __tablename__ = 'sensors'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='en ligne')

    threshold_co2 = db.Column(db.Float, nullable=True)
    threshold_temp_min = db.Column(db.Float, nullable=True)
    threshold_temp_max = db.Column(db.Float, nullable=True)
    threshold_humidity = db.Column(db.Float, nullable=True)

    readings = db.relationship('SensorReading', backref='sensor', lazy=True,
                               cascade='all, delete-orphan')
```

Explication: ce modele central porte l'etat du capteur et ses seuils metier. La relation readings permet de recuperer rapidement l'historique et la cascade evite les enregistrements orphelins.

### Snippet 2 - Serialisation API via vers_dict (backend/database.py)

```python
def vers_dict(self, inclure_derniere_lecture=False):
    result = {
        'id': str(self.id),
        'user_id': self.user_id,
        'name': self.name,
        'status': self.status,
        'thresholds': {
            'co2': self.threshold_co2,
            'temp_min': self.threshold_temp_min,
            'temp_max': self.threshold_temp_max,
            'humidity': self.threshold_humidity,
        },
    }

    if inclure_derniere_lecture and self.readings:
        derniere = max(self.readings, key=lambda r: r.recorded_at)
        result['co2'] = derniere.co2
        result['temperature'] = derniere.temperature
        result['humidity'] = derniere.humidity
        result['lastReading'] = derniere.recorded_at.isoformat()

    return result
```

Explication: cette methode standardise la sortie JSON et simplifie le frontend. L'option inclure_derniere_lecture evite une requete supplementaire pour afficher l'etat instantane d'un capteur.

---

## 5) Passation presentation

Partie finale - transmission a une autre personne

### Pack de passation pour creer la presentation complete

Cette section est faite pour quelqu'un qui n'a que 2 sources: ce fichier Markdown et le document UI chart. Avec les informations ci-dessous, il peut construire une presentation complete sans contexte supplementaire.

### Resume du projet (pitch rapide)

- Aerium surveille la qualite de l'air interieur: CO2, temperature, humidite.
- Le projet combine une app locale Kivy et une plateforme web moderne (site-v2).
- Le backend Flask gere API, auth JWT, temps reel Socket.IO, IA Mistral et simulation.
- La base SQLAlchemy centralise utilisateurs, capteurs, lectures, alertes et maintenance.

### Plan de slides conseille (10-12 slides)

- Slide 1: contexte + probleme de qualite de l'air.
- Slide 2: vision Aerium et objectifs du projet.
- Slide 3: architecture globale (app + site-v2).
- Slide 4: Kivy app.
- Slide 5: Flask API + Auth JWT + WebSocket.
- Slide 6: IA Mistral (chat, recommandations, predictions).
- Slide 7: simulation capteurs et scenarios.
- Slide 8: base de donnees et modeles.
- Slide 9: demo parcours utilisateur.
- Slide 10: reussites techniques + limites.
- Slides 11-12: roadmap + conclusion + Q/R.

### Texte pret a envoyer a la personne qui fera les slides

```text
Bonjour,

Tu dois creer la presentation finale Aerium en utilisant UNIQUEMENT:
1) ce fichier HTML (aerium_code_snippets.html)
2) le document UI chart

Objectif:
- produire un support de 10 a 12 slides, en francais
- audience: camarades de classe
- duree cible: 7 a 9 minutes

Structure obligatoire:
1. Kivy app
2. Flask app et auth
3. IA, Mistral et simulation
4. Base de donnees

Pour chaque partie:
- garder "ce qui a ete realise"
- garder le "script oral"
- garder les snippets + explications (sauf Kivy: pas de snippet)

Style attendu:
- slides claires, peu de texte par slide
- schema architecture venant du UI chart
- mettre en avant la repartition par 4 personnes
- inclure une conclusion + roadmap + Q/R

Livrables:
- version courte (7 min)
- version complete (9 min)
- notes orales par slide (3-5 lignes max)

Merci.
```

### Checklist avant envoi

- Verifier que le UI chart est bien joint.
- Envoyer ce document avec les 5 sections intactes.
- Donner les noms reels a la place de Personne 1/2/3/4 si necessaire.
- Confirmer la duree (7 min ou 9 min) avant generation finale des slides.

---

Ordre conseille pour la soutenance (7 a 9 minutes): Personne 1 -> Personne 2 -> Personne 3 -> Personne 4, puis 1 minute de conclusion commune. La section 5 sert de pack de passation pour deleguer la creation des slides.
