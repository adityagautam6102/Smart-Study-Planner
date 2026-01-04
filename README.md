# 🎓 Smart Study Planner - Full Stack Application

A production-ready, AI-enhanced study planning application with gamification, analytics, PWA support, and a robust Python/Flask backend.

**Perfect for portfolios and recruiting!** Built with modern web standards and psychology-driven features.

---

## ✨ Key Features

### 📚 Study Management
- Add subjects with chapters, difficulty levels, priorities, and deadlines
- Track progress with real-time completion percentages
- Automatic recommendations based on smart scoring algorithm
- Visual progress charts and priority breakdown

### ⏱️ Pomodoro Timer
- Adaptive session durations (25/40/50+ minutes based on difficulty)
- Mode-aware settings (Normal vs Exam mode)
- Automatic session tracking and XP rewards
- Visual countdown with pause/resume controls

### 😊 Study Mood & Energy Tracker (NEW!)
- Track mood before/after study (Tired 😴 | Normal 😐 | Energetic ⚡)
- Effectiveness rating (1-5) for each session
- Auto-adjusts Pomodoro duration based on mood
- Burnout detection system
- Mood history analytics

### 📊 Failure Analytics (NEW!)
- Identify most skipped subjects
- Analyze failure reasons (tired, distracted, difficult, etc.)
- Discover best study hours by effectiveness
- 30-day pattern recognition
- Actionable insights for improvement

### 📅 Smart Weekly Auto-Planner (NEW!)
- **Intelligent Algorithm**: Weighs urgency, difficulty, and priority
- Auto-distributes workload across the week
- Considers deadlines (closer = higher priority)
- Balances difficult vs easy subjects
- Leaves Sunday as buffer day
- Real-time generation based on your schedule

### 🎮 Gamification System
- XP system (level up every 100 XP)
- Streaks (consecutive study days)
- 10 achievement badges with progress tracking:
  - Pioneer, Scholar, Ambitious, Master
  - Consistent, Unstoppable, Focused, Dedicated, Finisher, Halfway
- Visual achievement showcase modal

### 📊 Analytics & Insights
- Study time heatmap by date/hour
- Overall progress tracking
- Priority and difficulty breakdown
- Session history with timestamps
- Weekly/monthly statistics

### 🤔 Reflection System
- Track why you missed study sessions
- 6 built-in reflection reasons (tired, no time, difficult, etc.)
- Identify patterns to improve planning
- Helps reduce burnout through self-awareness

### 🌙 Smart Theming
- Automatic day/night theme switching (8 PM - 6 AM)
- Manual dark/light toggle
- Smooth CSS transitions
- Persistent theme preference

### 🎵 Music & Focus
- 4 study playlist presets:
  - Lo-Fi Hip Hop, Classical, Ambient, Piano
- YouTube embedded playlists
- Volume control and play/pause
- Focus mode with immersive layout

### 💬 AI Study Assistant
- Rule-based chatbot with smart responses
- Understands commands: "recommend", "pomodoro", "timer", etc.
- Direct ChatGPT shortcut button
- Conversation history (persistent)

### 📱 Progressive Web App (PWA)
- Install as standalone app on desktop/mobile
- Works offline with service worker caching
- App shortcuts for Focus Mode and Analytics
- Home screen icon and splash screen

### 🔄 Offline-First Sync Indicator (NEW!)
- Real-time sync status display (🟢 Synced | 🟡 Offline | 🔴 Failed)
- Auto-detects internet connectivity
- Fixed indicator in top-right corner
- Non-blocking, seamless integration

### 🔄 Role-Based Modes
- **Normal Mode**: Balanced study pace, regular breaks
- **Exam Mode**: Intensive sessions, shorter breaks, tighter deadlines
- Quick toggle in settings

### 📲 Data Management
- Export all data as JSON backup
- Import previous exports
- Cloud sync ready (backend integration)
- Per-user data isolation

### 🔐 Backend Features (Production-Ready)
- **JWT Authentication**: Secure user sessions
- **Rate Limiting**: API protection (200 req/day, 50 req/hour)
- **API Versioning**: /api/v1/ endpoints for scalability
- **Soft Deletes**: Data preservation and compliance
- **Database Indexing**: Optimized query performance
- **CORS Support**: Secure cross-origin requests

---

## 🏗️ Architecture

### Frontend Stack
- **HTML5**: Semantic markup with accessibility
- **CSS3**: Grid/Flexbox, animations, dark theme support
- **JavaScript (ES6+)**: Class-based components, localStorage API
- **Chart.js**: Analytics visualization
- **Service Worker**: Offline support and PWA capabilities

### Backend Stack
- **Flask**: Lightweight Python web framework
- **SQLAlchemy**: ORM for database management
- **Flask-JWT**: Secure token-based authentication
- **SQLite**: Default (PostgreSQL ready for production)
- **Flask-CORS**: Cross-origin request support

### Database Schema
```
Users → Subjects, Gamification, StudySessions, Reflections, Analytics
```

---

## 🚀 Quick Start

### Option 1: Frontend Only (Browser)

```bash
# Clone/download the project
cd Smart-Study-Planner

# Open in browser
open index.html

# OR use Python HTTP server
python -m http.server 8000
# Visit: http://localhost:8000
```

**All data stored in browser's localStorage. Perfect for local testing!**

### Option 2: Full Stack (Frontend + Backend)

```bash
# Terminal 1: Start Flask backend
cd Smart-Study-Planner
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# Backend runs on http://localhost:5000

# Terminal 2: Start frontend server
python -m http.server 8000
# Frontend on http://localhost:8000
```

**Data persisted in SQLite database. Production-ready!**

---

## 📁 Project Structure

```
Smart-Study-Planner/
├── 🎨 FRONTEND
│   ├── index.html              # Main dashboard UI
│   ├── landing.html            # Marketing landing page
│   ├── login.html              # Authentication
│   ├── script.js               # Core planner logic (1300+ lines)
│   ├── landing.js              # Landing page interactivity
│   ├── login.js                # Auth state management
│   ├── api-client.js           # Backend API integration layer
│   ├── styles.css              # Responsive styling + dark theme
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # Offline caching strategy
│   └── assets/
│       └── logo.svg            # Gradient logo
│
├── 🔧 BACKEND
│   ├── app.py                  # Flask API (500+ lines)
│   │   ├── 5 Database Models (User, Subject, Gamification, Session, Reflection)
│   │   ├── 6 Auth Endpoints (register, login, user info)
│   │   ├── 8 Subject Endpoints (CRUD + updates)
│   │   ├── 6 Gamification Endpoints (XP, streak, badges, mode)
│   │   ├── 4 Session Endpoints (record study time)
│   │   ├── 2 Reflection Endpoints (track missed sessions)
│   │   └── 3 Analytics Endpoints (summary, heatmap, stats)
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Configuration template
│   └── smart_study_planner.db  # SQLite database (auto-created)
│
└── 📖 DOCUMENTATION
    ├── README.md               # This file
    ├── SETUP.md                # Installation & integration guide
    ├── BACKEND_API.md          # Complete API reference
    ├── DATABASE_EXAMPLES.md    # SQL query examples
    └── .env.example            # Environment variables
```

---

## 🎯 Feature Showcase

### Smart Recommendations
```
"Math is suggested because:
• 🔴 Exam in 3 days (URGENT)
• Difficulty: Hard
• Only 30% completed"
```
Transparent reasoning shows users WHY they're being recommended a subject.

### Achievement System
```
🏆 Badges: Pioneer → Scholar → Ambitious → Master
🔥 Streaks: 7-day → 30-day streaks with notifications
📈 Levels: Progress tracked with XP system
```
Visual progress bars show how close users are to unlocking badges.

### Reflection Tracking
```
"Why didn't you study Math?"
⏰ No time available
😴 Felt too tired  
📚 Topic too difficult
😐 Lost motivation
🎮 Got distracted
🤔 Need better planning
```
Helps identify barriers and improve planning for next time.

### Study Analytics
```
📊 Overall Progress: 67% complete
⏱️ Total Study Time: 45 hours 30 minutes
📈 Consistency: 12-day streak
🎯 Session Average: 38 minutes
```

---

## 🔐 Authentication

### Frontend (localStorage-based)
```javascript
// Simple auth with email/password
localStorage.setItem('smartStudyUser', 'user@example.com');
```

### Backend (JWT Token-based)
```javascript
// Secure token authentication
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Token expires in 30 days
// Password hashed with werkzeug.security
```

---

## 📊 Database Models

### User
```python
User {
    id: int (primary key)
    name: string
    email: string (unique)
    password: string (hashed)
    created_at: datetime
    → subjects, sessions, reflections, gamification
}
```

### Subject
```python
Subject {
    id: int
    user_id: int (foreign key)
    name: string
    chapters: int
    completed_chapters: int
    difficulty: ['easy', 'medium', 'hard']
    priority: ['low', 'medium', 'high']
    deadline: datetime
    sessions_completed: int
    total_time_minutes: int
}
```

### Gamification
```python
Gamification {
    user_id: int (unique)
    xp: int
    level: int (= xp // 100 + 1)
    streak: int (days)
    total_minutes_studied: int
    badges_earned: json array
    current_mode: ['normal', 'exam']
}
```

---

## 🔌 API Examples

### Register User
```http
POST /api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_pass"
}

Response:
{
  "status": "success",
  "access_token": "eyJhbGc...",
  "user": { "id": 1, "name": "John Doe", ... }
}
```

### Add Subject
```http
POST /api/subjects
Authorization: Bearer <token>

{
  "name": "Mathematics",
  "chapters": 20,
  "difficulty": "hard",
  "priority": "high",
  "deadline": "2026-02-15T00:00:00"
}
```

### Record Study Session
```http
POST /api/sessions
Authorization: Bearer <token>

{
  "subject_id": 1,
  "duration_minutes": 50,
  "pomodoro_count": 2
}
```

### Get Analytics
```http
GET /api/analytics/summary
Authorization: Bearer <token>

Response:
{
  "overall_completion_percentage": 67.3,
  "total_study_minutes": 2730,
  "total_sessions": 52,
  "priority_breakdown": {...}
}
```

---

## 🎨 UI/UX Highlights

### Responsive Design
- Mobile-first approach
- Adapts to tablets, desktops, and ultra-wide screens
- Touch-friendly buttons and inputs
- Optimized for landscape and portrait

### Accessibility
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- High contrast dark theme option

### Performance
- Minimized JS (~2400 lines split across files)
- CSS optimized with custom properties
- Service worker caches critical assets
- Lazy loading for charts and images

### User Experience
- Smooth animations and transitions
- Real-time UI updates
- Loading states and error messages
- Undo/recovery for destructive actions

---

## 🧪 Testing & Validation

### Manual Testing Checklist
- [ ] Register & login flow
- [ ] Add/edit/delete subjects
- [ ] Pomodoro timer (all difficulties)
- [ ] Gamification (XP, streak, badges)
- [ ] Theme toggle (auto + manual)
- [ ] Focus mode (full screen, escape)
- [ ] Export/import data
- [ ] Music player (all playlists)
- [ ] Chat with AI assistant
- [ ] Analytics view (charts load)
- [ ] Reflection modal
- [ ] Achievement badges show correctly
- [ ] Mode toggle (normal/exam)
- [ ] PWA install prompt (on mobile)
- [ ] Offline functionality (service worker)

### API Testing
```bash
# Test with cURL
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pass"}'

# Or use Postman with BACKEND_API.md endpoints
```

---

## 🚀 Production Deployment

### Heroku
```bash
heroku create your-app-name
heroku config:set JWT_SECRET_KEY=<strong-random-key>
git push heroku main
```

### Docker
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "app:app"]
```

### AWS / Google Cloud
- Use Cloud Run or App Engine
- PostgreSQL for production database
- Cloud Storage for backups
- CloudFront CDN for static files

---

## 📈 Metrics & Analytics

### What Gets Tracked
- ✅ Study sessions (duration, date, subject)
- ✅ Progress per subject (completed chapters)
- ✅ Gamification (XP, levels, streaks, badges)
- ✅ Reflection patterns (why missed sessions)
- ✅ Study heatmap (by hour and day)
- ✅ User engagement (session frequency)

### Privacy
- All data belongs to the user
- No tracking or telemetry
- No third-party analytics
- Export data anytime
- Delete account removes all data

---

## 🤝 Contributing

Improvements welcome! Consider adding:
- [ ] AI-powered recommendations (ChatGPT API integration)
- [ ] Collaborative study groups
- [ ] Mobile native app (React Native)
- [ ] Real-time sync with cloud
- [ ] Social features (leaderboards)
- [ ] Video tutoring integration
- [ ] Spaced repetition algorithm
- [ ] Study buddy matching

---

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Installation & integration guide
- **[BACKEND_API.md](BACKEND_API.md)** - Complete API reference
- **[DATABASE_EXAMPLES.md](DATABASE_EXAMPLES.md)** - SQL query examples
- **[.env.example](.env.example)** - Configuration template

---

## 🔧 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | HTML5, CSS3, JavaScript ES6+ | UI & Interactivity |
| Styling | CSS Grid/Flexbox, Custom Props | Responsive Design |
| Charts | Chart.js | Analytics Visualization |
| PWA | Service Worker | Offline Support |
| Backend | Flask | REST API Server |
| Database | SQLAlchemy + SQLite | Data Persistence |
| Auth | Flask-JWT | Secure Authentication |
| CORS | Flask-CORS | Cross-Origin Support |

---

## 📊 Code Statistics

- **Frontend**: ~2400 lines (HTML/CSS/JS)
- **Backend**: ~500 lines (Flask API)
- **Database**: 5 models with relationships
- **API**: 30+ endpoints fully documented
- **Features**: 15+ core features + advanced capabilities

---

## 🎓 Learning Outcomes

Building this project teaches:
- **Full-stack development** (frontend + backend)
- **Database design** (SQLAlchemy ORM)
- **REST API design** (proper status codes, CORS)
- **Authentication** (JWT tokens, password hashing)
- **Progressive Web Apps** (service workers, manifest)
- **CSS architecture** (custom properties, dark theme)
- **JavaScript patterns** (classes, async/await, localStorage)
- **UX/UI principles** (responsive, accessible, performant)
- **DevOps basics** (environment variables, deployment)

---

## 🏆 Portfolio Value

This project demonstrates:
✅ Full-stack capability (frontend + backend)
✅ Database design and ORM usage
✅ RESTful API architecture
✅ Modern web standards (PWA, ES6+, CSS Grid)
✅ Authentication & security
✅ Problem-solving (gamification, analytics)
✅ Code organization & documentation
✅ Deployment-ready code

**Perfect talking points for interviews!**

---

## 📞 Support & Troubleshooting

### Common Issues

**Backend won't start?**
```bash
pip install -r requirements.txt --force-reinstall
python --version  # Check 3.8+
```

**Database errors?**
```bash
rm smart_study_planner.db
python app.py  # Creates fresh DB
```

**Frontend can't connect to API?**
```javascript
// Check API_URL in api-client.js
const API_URL = 'http://localhost:5000/api';

// Enable CORS in app.py
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "http://localhost:8000"}})
```

**Token expired?**
- Register/login again to get new token
- Check JWT_SECRET_KEY matches in .env

---

## 📝 License

This project is free to use, modify, and distribute. Perfect for portfolios!

---

## 🎉 You're All Set!

You now have a **production-ready, recruiter-impressing Smart Study Planner** with:

✅ Beautiful, responsive UI
✅ Powerful backend API
✅ Gamification & motivation
✅ Analytics & insights
✅ PWA support (installable)
✅ Full offline functionality
✅ Comprehensive documentation

**Next steps:**
1. Try the frontend: Open `index.html` in browser
2. Set up backend: `pip install -r requirements.txt && python app.py`
3. Read [SETUP.md](SETUP.md) for integration guide
4. Deploy to production

**Happy studying! 🚀📚**
