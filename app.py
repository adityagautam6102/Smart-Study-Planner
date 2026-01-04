from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import json
from sqlalchemy import func, desc

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Rate limiter for security
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///smart_study_planner.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# ============= DATABASE MODELS =============

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    subjects = db.relationship('Subject', backref='user', lazy=True, cascade='all, delete-orphan')
    gamification = db.relationship('Gamification', backref='user', uselist=False, cascade='all, delete-orphan')
    reflections = db.relationship('Reflection', backref='user', lazy=True, cascade='all, delete-orphan')
    study_sessions = db.relationship('StudySession', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class Subject(db.Model):
    __tablename__ = 'subjects'
    __table_args__ = (
        db.Index('idx_user_subject', 'user_id', 'is_deleted'),
        db.Index('idx_user_deadline', 'user_id', 'deadline'),
    )
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    chapters = db.Column(db.Integer, nullable=False)
    completed_chapters = db.Column(db.Integer, default=0)
    difficulty = db.Column(db.String(20), nullable=False)  # easy, medium, hard
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    deadline = db.Column(db.DateTime, nullable=False, index=True)
    sessions_completed = db.Column(db.Integer, default=0)
    total_time_minutes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Soft delete
    is_deleted = db.Column(db.Boolean, default=False, index=True)
    deleted_at = db.Column(db.DateTime)
    
    def to_dict(self):
        days_left = (self.deadline - datetime.utcnow()).days
        return {
            'id': self.id,
            'name': self.name,
            'chapters': self.chapters,
            'completed_chapters': self.completed_chapters,
            'difficulty': self.difficulty,
            'priority': self.priority,
            'deadline': self.deadline.isoformat(),
            'days_left': max(0, days_left),
            'sessions_completed': self.sessions_completed,
            'total_time_minutes': self.total_time_minutes,
            'completion_percentage': round((self.completed_chapters / self.chapters) * 100, 1) if self.chapters > 0 else 0
        }


class Gamification(db.Model):
    __tablename__ = 'gamification'
    __table_args__ = (
        db.Index('idx_user_gamification', 'user_id'),
    )
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    streak = db.Column(db.Integer, default=0)
    total_minutes_studied = db.Column(db.Integer, default=0)
    last_study_date = db.Column(db.DateTime)
    badges_earned = db.Column(db.String(500), default='[]')  # JSON array of badge IDs
    current_mode = db.Column(db.String(20), default='normal')  # normal, exam
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def get_badges(self):
        return json.loads(self.badges_earned) if self.badges_earned else []
    
    def add_badge(self, badge_id):
        badges = self.get_badges()
        if badge_id not in badges:
            badges.append(badge_id)
            self.badges_earned = json.dumps(badges)
    
    def to_dict(self):
        return {
            'xp': self.xp,
            'level': self.level,
            'streak': self.streak,
            'total_minutes_studied': self.total_minutes_studied,
            'last_study_date': self.last_study_date.isoformat() if self.last_study_date else None,
            'badges_earned': self.get_badges(),
            'current_mode': self.current_mode
        }


class StudySession(db.Model):
    __tablename__ = 'study_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    duration_minutes = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    pomodoro_count = db.Column(db.Integer, default=1)
    
    def to_dict(self):
        return {
            'id': self.id,
            'subject_id': self.subject_id,
            'duration_minutes': self.duration_minutes,
            'date': self.date.isoformat(),
            'pomodoro_count': self.pomodoro_count
        }


class Reflection(db.Model):
    __tablename__ = 'reflections'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    reason_idx = db.Column(db.Integer, nullable=False)  # 0-5 index of reason
    reason_text = db.Column(db.String(255))
    date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'subject_id': self.subject_id,
            'reason_idx': self.reason_idx,
            'reason_text': self.reason_text,
            'date': self.date.isoformat()
        }


class StudyMood(db.Model):
    __tablename__ = 'study_moods'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    mood = db.Column(db.String(20), nullable=False)  # tired, normal, energetic
    time = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    duration_minutes = db.Column(db.Integer)  # How long they studied with this mood
    effectiveness = db.Column(db.Integer)  # 1-5 rating of productivity
    session_id = db.Column(db.Integer, db.ForeignKey('study_sessions.id'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'mood': self.mood,
            'time': self.time.isoformat(),
            'duration_minutes': self.duration_minutes,
            'effectiveness': self.effectiveness
        }


# ============= AUTH ROUTES =============

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        
        # Validate input
        if not data.get('name') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create user
        user = User(name=data['name'], email=data['email'])
        user.set_password(data['password'])
        
        # Create gamification record
        gamification = Gamification(user=user)
        
        db.session.add(user)
        db.session.add(gamification)
        db.session.commit()
        
        # Create JWT token
        access_token = create_access_token(identity=user.email)
        
        return jsonify({
            'status': 'success',
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Missing email or password'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=user.email)
        
        return jsonify({
            'status': 'success',
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/user', methods=['GET'])
@jwt_required()
def get_user():
    """Get current user info"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict(),
            'gamification': user.gamification.to_dict() if user.gamification else None
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============= SUBJECT ROUTES =============

@app.route('/api/subjects', methods=['GET'])
@jwt_required()
def get_subjects():
    """Get all subjects for logged-in user"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        subjects = Subject.query.filter_by(user_id=user.id).all()
        return jsonify({
            'subjects': [s.to_dict() for s in subjects],
            'count': len(subjects)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/subjects', methods=['POST'])
@jwt_required()
def add_subject():
    """Add a new subject"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.json
        
        # Validate input
        required = ['name', 'chapters', 'difficulty', 'deadline', 'priority']
        if not all(data.get(field) for field in required):
            return jsonify({'error': 'Missing required fields'}), 400
        
        subject = Subject(
            user_id=user.id,
            name=data['name'],
            chapters=int(data['chapters']),
            difficulty=data['difficulty'],
            priority=data['priority'],
            deadline=datetime.fromisoformat(data['deadline'])
        )
        
        db.session.add(subject)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Subject added',
            'subject': subject.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/subjects/<int:subject_id>', methods=['PUT'])
@jwt_required()
def update_subject(subject_id):
    """Update subject progress"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        subject = Subject.query.filter_by(id=subject_id, user_id=user.id).first()
        
        if not subject:
            return jsonify({'error': 'Subject not found'}), 404
        
        data = request.json
        
        if 'completed_chapters' in data:
            subject.completed_chapters = int(data['completed_chapters'])
        if 'difficulty' in data:
            subject.difficulty = data['difficulty']
        if 'priority' in data:
            subject.priority = data['priority']
        if 'sessions_completed' in data:
            subject.sessions_completed = int(data['sessions_completed'])
        if 'total_time_minutes' in data:
            subject.total_time_minutes = int(data['total_time_minutes'])
        
        subject.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Subject updated',
            'subject': subject.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/subjects/<int:subject_id>', methods=['DELETE'])
@jwt_required()
def delete_subject(subject_id):
    """Delete a subject"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        subject = Subject.query.filter_by(id=subject_id, user_id=user.id).first()
        
        if not subject:
            return jsonify({'error': 'Subject not found'}), 404
        
        db.session.delete(subject)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Subject deleted'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============= GAMIFICATION ROUTES =============

@app.route('/api/gamification', methods=['GET'])
@jwt_required()
def get_gamification():
    """Get user gamification stats"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.gamification:
            return jsonify({'error': 'Gamification data not found'}), 404
        
        return jsonify(user.gamification.to_dict()), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/gamification/xp', methods=['POST'])
@jwt_required()
def add_xp():
    """Add XP and check level up"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.gamification:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.json
        xp_earned = int(data.get('xp', 0))
        
        gamif = user.gamification
        gamif.xp += xp_earned
        
        # Check level up (every 100 XP = 1 level)
        new_level = gamif.xp // 100 + 1
        leveled_up = new_level > gamif.level
        gamif.level = new_level
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'xp_earned': xp_earned,
            'total_xp': gamif.xp,
            'level': gamif.level,
            'leveled_up': leveled_up
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/gamification/streak', methods=['POST'])
@jwt_required()
def update_streak():
    """Update study streak"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.gamification:
            return jsonify({'error': 'User not found'}), 404
        
        gamif = user.gamification
        today = datetime.utcnow().date()
        
        if gamif.last_study_date:
            last_date = gamif.last_study_date.date()
            if last_date == today:
                # Already studied today
                return jsonify({
                    'status': 'success',
                    'message': 'Already studied today',
                    'streak': gamif.streak
                }), 200
            elif (today - last_date).days == 1:
                # Streak continues
                gamif.streak += 1
            else:
                # Streak broken
                gamif.streak = 1
        else:
            gamif.streak = 1
        
        gamif.last_study_date = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'streak': gamif.streak,
            'message': f'Streak: {gamif.streak} days!'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/gamification/badges', methods=['POST'])
@jwt_required()
def award_badge():
    """Award a badge to user"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.gamification:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.json
        badge_id = data.get('badge_id')
        
        if not badge_id:
            return jsonify({'error': 'Badge ID required'}), 400
        
        user.gamification.add_badge(badge_id)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'Badge {badge_id} awarded',
            'badges': user.gamification.get_badges()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/gamification/mode', methods=['POST'])
@jwt_required()
def set_mode():
    """Set study mode (normal/exam)"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.gamification:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.json
        mode = data.get('mode', 'normal')
        
        if mode not in ['normal', 'exam']:
            return jsonify({'error': 'Invalid mode'}), 400
        
        user.gamification.current_mode = mode
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'mode': mode
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============= STUDY SESSION ROUTES =============

@app.route('/api/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    """Get all study sessions for user"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        sessions = StudySession.query.filter_by(user_id=user.id).order_by(StudySession.date.desc()).all()
        return jsonify({
            'sessions': [s.to_dict() for s in sessions],
            'count': len(sessions)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions', methods=['POST'])
@jwt_required()
def record_session():
    """Record a new study session"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.json
        
        session = StudySession(
            user_id=user.id,
            subject_id=data.get('subject_id'),
            duration_minutes=int(data.get('duration_minutes', 25)),
            pomodoro_count=int(data.get('pomodoro_count', 1))
        )
        
        # Update gamification
        user.gamification.total_minutes_studied += session.duration_minutes
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Session recorded',
            'session': session.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============= REFLECTION ROUTES =============

@app.route('/api/reflections', methods=['GET'])
@jwt_required()
def get_reflections():
    """Get all reflections for user"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        reflections = Reflection.query.filter_by(user_id=user.id).order_by(Reflection.date.desc()).all()
        return jsonify({
            'reflections': [r.to_dict() for r in reflections],
            'count': len(reflections)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reflections', methods=['POST'])
@jwt_required()
def record_reflection():
    """Record a missed-task reflection"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.json
        
        reflection = Reflection(
            user_id=user.id,
            subject_id=data.get('subject_id'),
            reason_idx=int(data.get('reason_idx', 0)),
            reason_text=data.get('reason_text', '')
        )
        
        db.session.add(reflection)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Reflection recorded',
            'reflection': reflection.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============= ANALYTICS ROUTES =============

@app.route('/api/analytics/summary', methods=['GET'])
@jwt_required()
def get_analytics_summary():
    """Get study analytics summary"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        subjects = Subject.query.filter_by(user_id=user.id).all()
        sessions = StudySession.query.filter_by(user_id=user.id).all()
        reflections = Reflection.query.filter_by(user_id=user.id).all()
        
        # Calculate stats
        total_chapters = sum(s.chapters for s in subjects)
        completed_chapters = sum(s.completed_chapters for s in subjects)
        avg_completion = (completed_chapters / total_chapters * 100) if total_chapters > 0 else 0
        
        total_study_minutes = sum(s.duration_minutes for s in sessions)
        total_sessions = len(sessions)
        
        # By priority
        priority_stats = {}
        for priority in ['low', 'medium', 'high']:
            priority_subjects = [s for s in subjects if s.priority == priority]
            priority_stats[priority] = {
                'count': len(priority_subjects),
                'avg_completion': sum(s.completed_chapters for s in priority_subjects) / sum(s.chapters for s in priority_subjects) * 100 if priority_subjects else 0
            }
        
        return jsonify({
            'total_subjects': len(subjects),
            'total_chapters': total_chapters,
            'completed_chapters': completed_chapters,
            'overall_completion_percentage': round(avg_completion, 1),
            'total_study_minutes': total_study_minutes,
            'total_sessions': total_sessions,
            'avg_session_minutes': round(total_study_minutes / total_sessions, 1) if total_sessions > 0 else 0,
            'total_reflections': len(reflections),
            'priority_breakdown': priority_stats
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analytics/heatmap', methods=['GET'])
@jwt_required()
def get_study_heatmap():
    """Get study heatmap data (by day/hour)"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        sessions = StudySession.query.filter_by(user_id=user.id).all()
        
        # Build heatmap data
        heatmap = {}
        for session in sessions:
            date_key = session.date.strftime('%Y-%m-%d')
            hour_key = session.date.strftime('%H')
            
            if date_key not in heatmap:
                heatmap[date_key] = {}
            
            if hour_key not in heatmap[date_key]:
                heatmap[date_key][hour_key] = 0
            
            heatmap[date_key][hour_key] += session.duration_minutes
        
        return jsonify({
            'heatmap': heatmap,
            'total_entries': len(sessions)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============= MOOD TRACKING ROUTES (API v1) =============

@app.route('/api/v1/moods', methods=['POST'])
@jwt_required()
@limiter.limit("10 per hour")
def record_mood():
    """Record study mood and effectiveness"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        data = request.json
        if not data.get('mood') or data.get('mood') not in ['tired', 'normal', 'energetic']:
            return jsonify({'error': 'Invalid mood value'}), 400
        
        mood = StudyMood(
            user_id=user.id,
            mood=data['mood'],
            duration_minutes=data.get('duration_minutes', 0),
            effectiveness=data.get('effectiveness', 3),  # 1-5 rating
            session_id=data.get('session_id')
        )
        
        db.session.add(mood)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Mood recorded',
            'mood_id': mood.id
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/v1/moods', methods=['GET'])
@jwt_required()
def get_moods():
    """Get mood history for analytics"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        days = request.args.get('days', 7, type=int)
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        moods = StudyMood.query.filter(
            StudyMood.user_id == user.id,
            StudyMood.time >= cutoff_date
        ).order_by(StudyMood.time.desc()).all()
        
        return jsonify({
            'moods': [{'id': m.id, 'mood': m.mood, 'effectiveness': m.effectiveness, 'time': m.time.isoformat(), 'duration_minutes': m.duration_minutes} for m in moods],
            'total_count': len(moods)
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============= FAILURE ANALYTICS ROUTES =============

@app.route('/api/v1/analytics/failure', methods=['GET'])
@jwt_required()
@limiter.limit("20 per hour")
def get_failure_analytics():
    """Get failure analytics: skipped subjects, reasons, best study times"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        days = request.args.get('days', 30, type=int)
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get skipped subjects from reflections
        skipped_subjects = db.session.query(
            Reflection.subject_idx,
            func.count(Reflection.id).label('skip_count')
        ).filter(
            Reflection.user_id == user.id,
            Reflection.time >= cutoff_date,
            Reflection.reason_idx == 4  # Assuming 4 is "skipped" reason
        ).group_by(Reflection.subject_idx).order_by(func.count(Reflection.id).desc()).all()
        
        # Get most common failure reasons
        failure_reasons = db.session.query(
            Reflection.reason_idx,
            func.count(Reflection.id).label('reason_count')
        ).filter(
            Reflection.user_id == user.id,
            Reflection.time >= cutoff_date,
            Reflection.reason_idx.isnot(None)
        ).group_by(Reflection.reason_idx).order_by(func.count(Reflection.id).desc()).all()
        
        # Get best study times (hours with highest effectiveness)
        best_study_times = db.session.query(
            func.hour(StudyMood.time).label('hour'),
            func.avg(StudyMood.effectiveness).label('avg_effectiveness'),
            func.count(StudyMood.id).label('session_count')
        ).filter(
            StudyMood.user_id == user.id,
            StudyMood.time >= cutoff_date
        ).group_by(func.hour(StudyMood.time)).order_by(func.avg(StudyMood.effectiveness).desc()).all()
        
        # Reason mappings
        reason_map = {
            0: 'Too Tired',
            1: 'Lost Motivation',
            2: 'Distracted',
            3: 'Difficult Topic',
            4: 'Skipped',
            5: 'Not Covered'
        }
        
        return jsonify({
            'skipped_subjects': [{'subject_idx': s[0], 'skip_count': s[1]} for s in skipped_subjects[:10]],
            'failure_reasons': [{'reason': reason_map.get(r[0], 'Unknown'), 'count': r[1]} for r in failure_reasons],
            'best_study_hours': [{'hour': int(b[0] or 0), 'effectiveness': round(float(b[1] or 0), 2), 'sessions': int(b[2] or 0)} for b in best_study_times]
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============= WEEKLY AUTO-PLANNER ROUTES =============

@app.route('/api/v1/planner/generate', methods=['POST'])
@jwt_required()
@limiter.limit("5 per hour")
def generate_weekly_plan():
    """Generate optimized weekly study plan using workload distribution algorithm"""
    try:
        email = get_jwt_identity()
        user = User.query.filter_by(email=email).first()
        
        # Get all active subjects (not soft-deleted)
        subjects = Subject.query.filter(
            Subject.user_id == user.id,
            Subject.is_deleted == False
        ).all()
        
        if not subjects:
            return jsonify({'plan': []}), 200
        
        # Algorithm: Sort by deadline + difficulty + priority
        def subject_score(subj):
            days_left = max(1, (subj.deadline - datetime.utcnow()).days)
            chapters_left = subj.chapters - subj.completed_chapters
            difficulty_weight = {'easy': 1, 'medium': 2, 'hard': 3}.get(subj.difficulty, 2)
            priority_weight = {'low': 1, 'medium': 2, 'high': 3}.get(subj.priority, 2)
            
            # Score: chapters_left / days_left * difficulty * priority
            urgency = chapters_left / days_left
            score = urgency * difficulty_weight * priority_weight
            return score
        
        sorted_subjects = sorted(subjects, key=subject_score, reverse=True)
        
        # Distribute across 7 days with buffer
        plan = {day: [] for day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']}
        days_list = list(plan.keys())
        
        for idx, subject in enumerate(sorted_subjects):
            chapters_left = subject.chapters - subject.completed_chapters
            if chapters_left <= 0:
                continue
            
            # Distribute chapters across days
            day_idx = idx % 6  # Use first 6 days, leave Sunday free
            daily_chapters = max(1, chapters_left // 2)
            
            plan[days_list[day_idx]].append({
                'subject_name': subject.name,
                'subject_id': subject.id,
                'chapters': daily_chapters,
                'difficulty': subject.difficulty,
                'priority': subject.priority,
                'recommended_duration_mins': daily_chapters * 30
            })
        
        return jsonify({
            'plan': plan,
            'generated_at': datetime.utcnow().isoformat(),
            'subject_count': len(sorted_subjects),
            'optimization_notes': 'Plan prioritizes urgent deadlines and high-difficulty subjects. Recommend studying Sunday for overflow.'
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============= SYNC STATUS ROUTES =============

@app.route('/api/v1/sync/status', methods=['GET'])
@jwt_required()
def get_sync_status():
    """Get sync status for offline-first PWA indicator"""
    try:
        email = get_jwt_identity()
        
        # If we reached here, user is authenticated and synced
        return jsonify({
            'status': 'synced',
            'timestamp': datetime.utcnow().isoformat(),
            'message': 'All data synced'
        }), 200
    
    except Exception as e:
        return jsonify({
            'status': 'offline',
            'error': str(e)
        }), 200


# ============= API VERSION INFO =============

@app.route('/api/v1/info', methods=['GET'])
def api_info():
    """Get API version and capabilities"""
    return jsonify({
        'version': '1.0.0',
        'features': [
            'Subject management',
            'Study sessions with mood tracking',
            'Gamification with achievements',
            'Reflections and analytics',
            'Failure analysis',
            'Weekly auto-planner',
            'Offline-first sync'
        ],
        'rate_limits': {
            'global': '200 per day, 50 per hour',
            'moods': '10 per hour',
            'analytics': '20 per hour',
            'planner': '5 per hour'
        }
    }), 200


# ============= ERROR HANDLERS =============

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


# ============= DATABASE INITIALIZATION =============

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Subject': Subject, 'Gamification': Gamification}


# ============= MAIN =============

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
