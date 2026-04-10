import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

app = Flask(__name__)
# Config
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret_key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt_dev_secret')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///smart_study_planner.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Init extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# ----------------- MODELS -----------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    subjects = db.relationship('Subject', backref='user', lazy=True)
    sessions = db.relationship('StudySession', backref='user', lazy=True)
    gamification = db.relationship('Gamification', backref='user', uselist=False)

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    chapters = db.Column(db.Integer, default=1)
    completed_chapters = db.Column(db.Integer, default=0)
    difficulty = db.Column(db.String(20), default='medium') # easy, medium, hard
    priority = db.Column(db.String(20), default='medium') # low, medium, high
    deadline = db.Column(db.DateTime, nullable=True)
    sessions_completed = db.Column(db.Integer, default=0)
    total_time_minutes = db.Column(db.Integer, default=0)

class Gamification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    streak = db.Column(db.Integer, default=0)
    last_study_date = db.Column(db.Date, nullable=True)
    total_minutes_studied = db.Column(db.Integer, default=0)
    badges_earned = db.Column(db.String(500), default='[]') # JSON string of badges
    current_mode = db.Column(db.String(20), default='normal') # normal, exam

class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    pomodoro_count = db.Column(db.Integer, default=1)
    mood_before = db.Column(db.String(20)) # tired, normal, energetic
    mood_after = db.Column(db.String(20))
    effectiveness = db.Column(db.Integer) # 1-5
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Reflection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reason = db.Column(db.String(50), nullable=False) # tired, no time, difficult, lost motivation, distracted, need better planning
    notes = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# ----------------- ROUTES -----------------

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
    
    hashed_password = generate_password_hash(data['password'])
    new_user = User(name=data['name'], email=data['email'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    
    # Initialize gamification profile
    gamif = Gamification(user_id=new_user.id)
    db.session.add(gamif)
    db.session.commit()
    
    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({
        "status": "success",
        "access_token": access_token,
        "user": {"id": new_user.id, "name": new_user.name, "email": new_user.email}
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user or not check_password_hash(user.password, data.get('password')):
        return jsonify({"error": "Invalid email or password"}), 401
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "status": "success",
        "access_token": access_token,
        "user": {"id": user.id, "name": user.name, "email": user.email}
    }), 200

# Subjects
@app.route('/api/subjects', methods=['GET', 'POST'])
@jwt_required()
def handle_subjects():
    user_id = get_jwt_identity()
    if request.method == 'POST':
        data = request.get_json()
        deadline = None
        if data.get('deadline'):
            try:
                deadline = datetime.fromisoformat(data['deadline'].replace('Z', '+00:00'))
            except ValueError:
                pass
                
        new_subject = Subject(
            user_id=user_id,
            name=data['name'],
            chapters=data.get('chapters', 1),
            difficulty=data.get('difficulty', 'medium'),
            priority=data.get('priority', 'medium'),
            deadline=deadline
        )
        db.session.add(new_subject)
        db.session.commit()
        return jsonify({"status": "success", "subject_id": new_subject.id}), 201
        
    subjects = Subject.query.filter_by(user_id=user_id).all()
    out = []
    for s in subjects:
        out.append({
            "id": s.id, "name": s.name, "chapters": s.chapters, 
            "completed_chapters": s.completed_chapters, "difficulty": s.difficulty,
            "priority": s.priority, "sessions_completed": s.sessions_completed,
            "total_time_minutes": s.total_time_minutes,
            "deadline": s.deadline.isoformat() if s.deadline else None
        })
    return jsonify(out), 200

# Progress Update
@app.route('/api/subjects/<int:sub_id>/progress', methods=['PUT'])
@jwt_required()
def update_progress(sub_id):
    user_id = get_jwt_identity()
    subject = Subject.query.filter_by(id=sub_id, user_id=user_id).first()
    if not subject:
        return jsonify({"error": "Subject not found"}), 404
        
    data = request.get_json()
    subject.completed_chapters = data.get('completed_chapters', subject.completed_chapters)
    db.session.commit()
    return jsonify({"status": "success"})

# Study Sessions & Gamification update
@app.route('/api/sessions', methods=['POST'])
@jwt_required()
def record_session():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    session = StudySession(
        user_id=user_id,
        subject_id=data['subject_id'],
        duration_minutes=data['duration_minutes'],
        pomodoro_count=data.get('pomodoro_count', 1),
        mood_before=data.get('mood_before'),
        mood_after=data.get('mood_after'),
        effectiveness=data.get('effectiveness')
    )
    db.session.add(session)
    
    # Update subject stats
    subject = Subject.query.filter_by(id=data['subject_id'], user_id=user_id).first()
    if subject:
        subject.sessions_completed += 1
        subject.total_time_minutes += data['duration_minutes']
        
    # Gamification
    gamif = Gamification.query.filter_by(user_id=user_id).first()
    if gamif:
        gamif.total_minutes_studied += data['duration_minutes']
        gamif.xp += data['duration_minutes'] * 2 # 2 XP per minute
        
        # Check level up
        gamif.level = (gamif.xp // 100) + 1
        
        # Streak logic
        today = datetime.utcnow().date()
        if gamif.last_study_date:
            delta = (today - gamif.last_study_date).days
            if delta == 1:
                gamif.streak += 1
            elif delta > 1:
                gamif.streak = 1 # Reset if missed a day
        else:
            gamif.streak = 1
        gamif.last_study_date = today

    db.session.commit()
    return jsonify({"status": "success", "gamification": {
        "xp": gamif.xp, "level": gamif.level, "streak": gamif.streak
    }}), 201

# Analytics Summary
@app.route('/api/analytics/summary', methods=['GET'])
@jwt_required()
def get_analytics():
    user_id = get_jwt_identity()
    gamif = Gamification.query.filter_by(user_id=user_id).first()
    subjects = Subject.query.filter_by(user_id=user_id).all()
    sessions = StudySession.query.filter_by(user_id=user_id).all()
    
    total_chapters = sum(s.chapters for s in subjects)
    completed_chapters = sum(s.completed_chapters for s in subjects)
    completion_pct = (completed_chapters / total_chapters * 100) if total_chapters > 0 else 0
    
    return jsonify({
        "overall_completion_percentage": round(completion_pct, 1),
        "total_study_minutes": gamif.total_minutes_studied if gamif else 0,
        "total_sessions": len(sessions),
        "level": gamif.level if gamif else 1,
        "streak": gamif.streak if gamif else 0,
        "xp": gamif.xp if gamif else 0
    }), 200

# Gamification Profile
@app.route('/api/gamification', methods=['GET'])
@jwt_required()
def get_gamification():
    user_id = get_jwt_identity()
    gamif = Gamification.query.filter_by(user_id=user_id).first()
    if not gamif:
        return jsonify({"error": "Profile not found"}), 404
        
    return jsonify({
        "xp": gamif.xp,
        "level": gamif.level,
        "streak": gamif.streak,
        "total_minutes_studied": gamif.total_minutes_studied,
        "badges_earned": gamif.badges_earned,
        "current_mode": gamif.current_mode
    })

# Reflections
@app.route('/api/reflections', methods=['POST'])
@jwt_required()
def add_reflection():
    user_id = get_jwt_identity()
    data = request.get_json()
    ref = Reflection(user_id=user_id, reason=data['reason'], notes=data.get('notes'))
    db.session.add(ref)
    db.session.commit()
    return jsonify({"status": "success"}), 201

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
