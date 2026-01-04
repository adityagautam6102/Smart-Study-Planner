# Smart Study Planner - Flask Backend API

A comprehensive Flask backend for the Smart Study Planner web application with JWT authentication, study tracking, gamification, and analytics.

## 🚀 Features

- **User Authentication**: JWT-based auth with password hashing
- **Subject Management**: Create, read, update, delete study subjects
- **Gamification System**: XP, levels, streaks, and badges
- **Study Sessions**: Track Pomodoro sessions with timestamps
- **Reflection Tracking**: Record why missed study sessions
- **Analytics**: Study heatmaps, completion stats, priority breakdown
- **Mode Support**: Normal and Exam mode with different settings
- **SQLAlchemy ORM**: Robust database management

## 📋 Installation

### Prerequisites
- Python 3.8+
- pip

### Setup

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Create `.env` file** (copy from `.env.example`):
```bash
cp .env.example .env
```

3. **Update `.env` with your settings:**
```env
JWT_SECRET_KEY=your-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=True
```

4. **Run the app:**
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## 📚 Database Models

### User
- `id`: Primary key
- `name`: User full name
- `email`: Unique email (login identifier)
- `password`: Hashed password
- `created_at`: Registration timestamp

### Subject
- `id`: Primary key
- `user_id`: Foreign key to User
- `name`: Subject name
- `chapters`: Total chapters
- `completed_chapters`: Progress tracking
- `difficulty`: easy | medium | hard
- `priority`: low | medium | high
- `deadline`: Exam/submission date
- `sessions_completed`: Pomodoro session count
- `total_time_minutes`: Total study time

### Gamification
- `user_id`: Foreign key to User
- `xp`: Experience points
- `level`: Current level (1 level per 100 XP)
- `streak`: Consecutive study days
- `total_minutes_studied`: Lifetime study minutes
- `badges_earned`: JSON array of badge IDs
- `current_mode`: normal | exam

### StudySession
- `id`: Primary key
- `user_id`: Foreign key to User
- `subject_id`: Foreign key to Subject
- `duration_minutes`: Session length
- `pomodoro_count`: Number of Pomodoros
- `date`: Session timestamp

### Reflection
- `id`: Primary key
- `user_id`: Foreign key to User
- `subject_id`: Foreign key to Subject
- `reason_idx`: Reason code (0-5)
- `reason_text`: Reason description
- `date`: Reflection timestamp

## 🔌 API Endpoints

### Authentication

#### Register
```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password"
}
```
**Response:** User object + JWT token

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure_password"
}
```
**Response:** User object + JWT token

#### Get Current User
```http
GET /api/user
Authorization: Bearer <JWT_TOKEN>
```

---

### Subjects

#### Get All Subjects
```http
GET /api/subjects
Authorization: Bearer <JWT_TOKEN>
```
**Response:** Array of subject objects with completion %

#### Add Subject
```http
POST /api/subjects
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Mathematics",
  "chapters": 20,
  "difficulty": "hard",
  "priority": "high",
  "deadline": "2026-02-15T00:00:00"
}
```

#### Update Subject
```http
PUT /api/subjects/<subject_id>
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "completed_chapters": 5,
  "sessions_completed": 3,
  "total_time_minutes": 120
}
```

#### Delete Subject
```http
DELETE /api/subjects/<subject_id>
Authorization: Bearer <JWT_TOKEN>
```

---

### Gamification

#### Get Gamification Stats
```http
GET /api/gamification
Authorization: Bearer <JWT_TOKEN>
```
**Response:** XP, level, streak, badges, total minutes, mode

#### Add XP
```http
POST /api/gamification/xp
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "xp": 25
}
```
**Response:** New total XP, level, level-up status

#### Update Streak
```http
POST /api/gamification/streak
Authorization: Bearer <JWT_TOKEN>
```
**Response:** Current streak, message

#### Award Badge
```http
POST /api/gamification/badges
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "badge_id": "seven_day_streak"
}
```

#### Set Study Mode
```http
POST /api/gamification/mode
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "mode": "exam"
}
```

---

### Study Sessions

#### Get All Sessions
```http
GET /api/sessions
Authorization: Bearer <JWT_TOKEN>
```

#### Record Session
```http
POST /api/sessions
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "subject_id": 1,
  "duration_minutes": 50,
  "pomodoro_count": 2
}
```

---

### Reflections

#### Get All Reflections
```http
GET /api/reflections
Authorization: Bearer <JWT_TOKEN>
```

#### Record Reflection
```http
POST /api/reflections
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "subject_id": 1,
  "reason_idx": 3,
  "reason_text": "Lost motivation"
}
```

Reason indices:
- 0: No time available
- 1: Felt too tired
- 2: Topic too difficult
- 3: Lost motivation
- 4: Got distracted
- 5: Need better planning

---

### Analytics

#### Get Summary Analytics
```http
GET /api/analytics/summary
Authorization: Bearer <JWT_TOKEN>
```
**Response:**
- Total subjects, chapters, completion %
- Study minutes, session count, average session
- Reflections count
- Priority breakdown

#### Get Study Heatmap
```http
GET /api/analytics/heatmap
Authorization: Bearer <JWT_TOKEN>
```
**Response:** Study activity by date and hour

---

## 🔐 Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

Tokens expire in 30 days by default.

---

## 💾 Database

SQLite database automatically created at `smart_study_planner.db`

To reset database:
```python
from app import app, db
with app.app_context():
    db.drop_all()
    db.create_all()
```

---

## 🛠️ Integration with Frontend

Frontend should:

1. **Register/Login**: Get JWT token and store in `localStorage`
2. **Send requests**: Include token in `Authorization` header
3. **Sync data**: Call API endpoints instead of localStorage for persistent storage
4. **Handle errors**: Check response status codes and error messages

Example frontend code:
```javascript
const API_URL = 'http://localhost:5000/api';

async function fetchSubjects() {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`${API_URL}/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
}
```

---

## 📝 Environment Variables

- `JWT_SECRET_KEY`: Secret key for JWT signing (change in production!)
- `FLASK_ENV`: development | production
- `FLASK_DEBUG`: True | False

---

## 🐛 Error Handling

All errors return JSON with `error` field:
```json
{
  "error": "Email already registered"
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad request
- `401`: Unauthorized
- `404`: Not found
- `409`: Conflict (e.g., duplicate email)
- `500`: Server error

---

## 🚀 Production Deployment

1. Change `JWT_SECRET_KEY` to a strong random string
2. Set `FLASK_ENV=production` and `FLASK_DEBUG=False`
3. Use production WSGI server (Gunicorn, uWSGI)
4. Configure proper CORS origin
5. Use PostgreSQL instead of SQLite
6. Enable HTTPS

Example Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## 📄 License

This is part of the Smart Study Planner project.
