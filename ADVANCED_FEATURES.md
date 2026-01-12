# Advanced Features - Smart Study Planner

## 🎯 Overview

This document details the 5 advanced features added to Smart Study Planner to make it a recruiter-impressing portfolio project with rare, algorithmic thinking capabilities.

---

## 1️⃣ Study Mood + Energy Tracker 😊

### What It Does
Captures user mood and effectiveness before/after study sessions to enable burnout detection and personalized study optimization.

### Key Features
- **Three Mood States**: Tired 😴 | Normal 😐 | Energetic ⚡
- **Effectiveness Rating**: 1-5 scale with emoji indicators
- **Auto-Adjustment**: Pomodoro duration adapts based on mood:
  - **Tired**: 20-minute sessions (reduced from 25)
  - **Normal**: 25-minute sessions (default)
  - **Energetic**: 30-minute sessions (extended)
- **Burnout Detection**: Tracks mood patterns over time to warn about fatigue

### API Endpoints
```
POST /api/v1/moods
  - Record mood with effectiveness rating
  - Rate limit: 10 per hour
  
GET /api/v1/moods?days=7
  - Retrieve mood history
  - Returns: mood data, timestamps, effectiveness ratings
```

### Database Model
```python
class StudyMood(db.Model):
    id: Integer (Primary Key)
    user_id: Integer (Foreign Key to User)
    mood: String (tired, normal, energetic)
    time: DateTime (Indexed)
    duration_minutes: Integer
    effectiveness: Integer (1-5)
    session_id: Integer (Foreign Key to StudySession)
```

### Frontend Integration
```javascript
// Record mood before study session
await api.recordMood('energetic', 25, 5);

// Retrieve mood history
const moods = await api.getMoods(days=7);
```

---

## 2️⃣ Failure Analytics 📊 (VERY RARE)

### What It Does
Advanced analytics engine that identifies study failure patterns - which subjects are skipped, why they're skipped, and when the user studies most effectively.

### Key Features
- **Skipped Subjects Ranking**: Shows which subjects are avoided most frequently
- **Failure Reason Breakdown**: Categorizes why sessions are missed:
  - Too Tired
  - Lost Motivation
  - Distracted
  - Difficult Topic
  - Skipped
  - Not Covered
- **Best Study Hours**: Identifies peak productivity times by analyzing mood effectiveness ratings
- **30-Day Analysis Window**: Tracks patterns over the past month

### Algorithmic Insights
```javascript
// Aggregation logic:
1. Count reflections per subject where reason_idx = 4 (skipped)
2. Group failure reasons and rank by frequency
3. Calculate average mood effectiveness by hour (0-23)
4. Return top performers for each category
```

### API Endpoint
```
GET /api/v1/analytics/failure?days=30
  - Rate limit: 20 per hour
  - Returns:
    {
      "skipped_subjects": [
        {"subject_idx": 1, "skip_count": 5},
        {"subject_idx": 3, "skip_count": 3}
      ],
      "failure_reasons": [
        {"reason": "Too Tired", "count": 12},
        {"reason": "Distracted", "count": 8}
      ],
      "best_study_hours": [
        {"hour": 14, "effectiveness": 4.8, "sessions": 5},
        {"hour": 10, "effectiveness": 4.6, "sessions": 4}
      ]
    }
```

### Database Queries (Using SQLAlchemy)
```python
# Most skipped subjects
db.session.query(
    Reflection.subject_idx,
    func.count(Reflection.id).label('skip_count')
).filter(
    Reflection.user_id == user_id,
    Reflection.reason_idx == 4
).group_by(Reflection.subject_idx).all()

# Best study hours
db.session.query(
    func.hour(StudyMood.time).label('hour'),
    func.avg(StudyMood.effectiveness).label('avg_effectiveness'),
    func.count(StudyMood.id).label('session_count')
).group_by(func.hour(StudyMood.time)).all()
```

---

## 3️⃣ Smart Weekly Auto-Planner 📅 (Algorithmic)

### What It Does
Generates an optimized weekly study schedule using a sophisticated workload distribution algorithm that considers deadlines, difficulty, priority, and workload balance.

### Algorithm Details

#### Scoring Function
Each subject receives an urgency score:
```
urgency = (chapters_left / days_until_deadline) * difficulty_weight * priority_weight

where:
- chapters_left = total_chapters - completed_chapters
- days_until_deadline = max(1, deadline - today)
- difficulty_weight = {easy: 1, medium: 2, hard: 3}
- priority_weight = {low: 1, medium: 2, high: 3}
```

#### Distribution Strategy
1. **Sort** all subjects by urgency score (descending)
2. **Distribute** across 6 days (Monday-Saturday) in round-robin fashion
3. **Calculate** daily chapter allocation: `daily_chapters = chapters_left / 2`
4. **Sunday** reserved as buffer/rest day
5. **Estimated duration**: `daily_chapters * 30 minutes`

### Key Features
- **Deadline-Aware**: Prioritizes subjects with closer deadlines
- **Load Balancing**: Spreads workload across available study days
- **Difficulty Consideration**: Allocates more time to harder subjects
- **Priority Respect**: High-priority subjects get more slots
- **Buffer Days**: Leaves Sunday free for catch-up or rest

### API Endpoint
```
POST /api/v1/planner/generate
  - Rate limit: 5 per hour
  - Returns:
    {
      "plan": {
        "Monday": [
          {
            "subject_name": "Mathematics",
            "subject_id": 1,
            "chapters": 3,
            "difficulty": "hard",
            "priority": "high",
            "recommended_duration_mins": 90
          }
        ],
        "Tuesday": [...],
        ...
      },
      "generated_at": "2024-01-15T10:30:00",
      "subject_count": 5,
      "optimization_notes": "Plan prioritizes urgent deadlines and high-difficulty subjects."
    }
```

### Example
**Input Subjects**:
- Math: 10 chapters left, 3 days until deadline, Hard, High Priority
- History: 5 chapters left, 7 days until deadline, Easy, Medium Priority
- Physics: 8 chapters left, 5 days until deadline, Hard, High Priority

**Scores**:
- Math: (10/3) * 3 * 3 = 30.0
- Physics: (8/5) * 3 * 3 = 14.4
- History: (5/7) * 1 * 2 = 1.43

**Plan**:
- Monday: Math (5 chapters)
- Tuesday: Physics (4 chapters)
- Wednesday: Math (5 chapters) + History (3 chapters)
- Thursday: Physics (4 chapters)
- Friday-Saturday: Buffer/overflow
- Sunday: Rest

---

## 4️⃣ Offline-First Sync Indicator 🟢 (Advanced PWA)

### What It Does
Displays real-time sync status indicator in the top-right corner, showing whether the app is synced with the server, offline, or experiencing connection issues.

### Visual Indicators
- **🟢 Synced** (Green): All data synchronized successfully
- **🟡 Offline** (Yellow): No internet connection detected
- **🔴 Failed** (Red): Connection failed or sync error

### Implementation
```javascript
// Sync status endpoint
GET /api/v1/sync/status
  - Returns: {
      "status": "synced|offline|failed",
      "timestamp": "2024-01-15T10:30:00",
      "message": "All data synced"
    }

// Auto-update on:
- App initialization
- After every API call
- Network connectivity change detection (navigator.onLine)
- Every 30 seconds (background check)
```

### Features
- **Fixed Position**: Top-right corner (z-index 9999)
- **Auto-Detection**: Uses navigator.onLine API
- **Try-Catch Handling**: Gracefully handles connection failures
- **Non-Blocking**: Doesn't interrupt user workflow
- **Service Worker Integration**: Detects offline via cached requests

### CSS Styling
```css
#syncIndicator {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 9999;
}

/* Status-specific colors */
.synced { background: #4CAF50; color: white; }
.offline { background: #FFC107; color: #333; }
.failed { background: #f44336; color: white; }
```

---

## 5️⃣ Backend Improvements 🔧

### A. API Versioning
```
Endpoint Format: /api/v1/{resource}

Benefits:
- Backwards compatibility
- Future-proof API design
- Clear contract with frontend

API Info Endpoint:
GET /api/v1/info
  - Returns API version, features, rate limits
```

### B. Soft Deletes
```python
# Added to Subject model:
is_deleted = db.Column(db.Boolean, default=False, index=True)
deleted_at = db.Column(db.DateTime)

# Query filter:
subjects = Subject.query.filter(
    Subject.user_id == user_id,
    Subject.is_deleted == False
).all()

# Benefits:
- Data preservation for compliance
- Audit trails
- Soft restoration capability
- No permanent data loss
```

### C. Rate Limiting
```python
from flask_limiter import Limiter

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Per-endpoint limits:
@limiter.limit("10 per hour")
def record_mood():
    ...

@limiter.limit("20 per hour")
def get_failure_analytics():
    ...

@limiter.limit("5 per hour")
def generate_weekly_plan():
    ...
```

### D. Database Indexing
```python
# Composite indexes for fast queries:
class Subject(db.Model):
    __table_args__ = (
        db.Index('idx_user_subject', 'user_id', 'is_deleted'),
        db.Index('idx_user_deadline', 'user_id', 'deadline'),
    )

class StudyMood(db.Model):
    user_id = db.Column(..., index=True)
    time = db.Column(..., index=True)

# Improves query performance for:
- Getting user's subjects
- Filtering by deadline
- Mood history retrieval
```

---

## 📊 Complete API Summary

### Mood Tracking Routes
| Method | Endpoint | Rate Limit | Description |
|--------|----------|-----------|-------------|
| POST | `/api/v1/moods` | 10/hour | Record mood and effectiveness |
| GET | `/api/v1/moods?days=7` | Unlimited | Get mood history |

### Analytics Routes
| Method | Endpoint | Rate Limit | Description |
|--------|----------|-----------|-------------|
| GET | `/api/v1/analytics/failure?days=30` | 20/hour | Failure analytics with insights |

### Planner Routes
| Method | Endpoint | Rate Limit | Description |
|--------|----------|-----------|-------------|
| POST | `/api/v1/planner/generate` | 5/hour | Generate optimized weekly plan |

### System Routes
| Method | Endpoint | Rate Limit | Description |
|--------|----------|-----------|-------------|
| GET | `/api/v1/sync/status` | Unlimited | Check sync status |
| GET | `/api/v1/info` | Unlimited | API information and capabilities |

---

## 🎨 Frontend Components

### New UI Elements
1. **Feature Buttons** (Dashboard Top):
   - 📊 Failure Analytics
   - 📅 Generate Weekly Plan
   - 😊 Mood Tracker

2. **Mood Tracker Modal**:
   - Mood selector (3 options)
   - Effectiveness rating (1-5)
   - Session duration input

3. **Failure Analytics Modal**:
   - Most skipped subjects list
   - Top failure reasons
   - Best study hours chart

4. **Weekly Plan Modal**:
   - Day-by-day breakdown
   - Subject allocation
   - Difficulty badges
   - Time recommendations

5. **Sync Indicator**:
   - Fixed top-right corner
   - Color-coded status
   - Auto-updating

---

## 💡 Use Cases & Examples

### Example 1: Burnout Prevention
User studies at 9 PM feeling "tired" (effectiveness: 2/5). The system:
1. Records low effectiveness
2. Suggests shorter 20-min sessions
3. After 3 days of low mood, alerts: "You're showing signs of burnout. Take a break!"

### Example 2: Pattern Recognition
Failure Analytics reveals:
- History is skipped 7 times in 30 days
- Most skipped at 11 PM (peak fatigue time)
- Best study hours are 2-3 PM (effectiveness 4.8/5)
- User can reschedule History to afternoon

### Example 3: Smart Planning
User has:
- Math: 10 chapters, 3 days, Hard, High priority (score: 30)
- Physics: 8 chapters, 5 days, Hard, High priority (score: 14.4)
- English: 5 chapters, 10 days, Easy, Low priority (score: 0.5)

Weekly plan distributes:
- Days 1-2: Focus on Math (most urgent)
- Days 2-4: Alternate Physics and Math
- Days 5-6: Fill in with English
- Sunday: Rest or catch-up

---

## 🚀 Technical Stack

### Backend
- **Framework**: Flask (Python)
- **Database ORM**: SQLAlchemy
- **Authentication**: JWT (json-web-tokens)
- **Rate Limiting**: Flask-Limiter
- **Database**: SQLite (PostgreSQL compatible)

### Frontend
- **API Client**: Vanilla JavaScript (api-client.js)
- **UI Framework**: HTML5 + CSS3
- **State Management**: LocalStorage
- **Charting**: Chart.js

### Deployment Ready
- ✅ CORS enabled
- ✅ Rate limiting
- ✅ JWT authentication
- ✅ Database indexing
- ✅ Soft deletes
- ✅ Error handling
- ✅ API versioning

---

## 🎓 Learning Outcomes / Recruiter Appeal

### Rare Skills Demonstrated
1. **Algorithmic Thinking**: Workload distribution algorithm with weighted scoring
2. **Database Optimization**: Composite indexing, soft deletes, query optimization
3. **Analytics Engineering**: Aggregation queries, pattern detection, insights
4. **API Design**: Versioning, rate limiting, error handling
5. **Psychology-Based Features**: Mood tracking, burnout detection
6. **UX/Burnout Focus**: Proactive user wellness alerts

### Professional Practices
- Rate limiting (security)
- Soft deletes (data preservation)
- API versioning (scalability)
- Database indexing (performance)
- JWT authentication (security)
- CORS configuration (modern web)

---

## 📝 Testing the Features

### 1. Test Mood Tracking
```bash
# Add mood
curl -X POST http://localhost:5000/api/v1/moods \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mood": "energetic", "duration_minutes": 25, "effectiveness": 5}'

# Get mood history
curl -X GET "http://localhost:5000/api/v1/moods?days=7" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Failure Analytics
```bash
curl -X GET "http://localhost:5000/api/v1/analytics/failure?days=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Weekly Planner
```bash
curl -X POST http://localhost:5000/api/v1/planner/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Test Sync Status
```bash
curl -X GET http://localhost:5000/api/v1/sync/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Test API Info
```bash
curl -X GET http://localhost:5000/api/v1/info
```

---

## 🔄 Integration Notes

### Frontend Methods Added to SmartStudyPlanner class:
```javascript
recordMood(mood, durationMinutes, effectiveness)
loadFailureAnalytics()
renderFailureAnalytics()
generateWeeklyPlan()
renderWeeklyPlan()
getSyncStatus()
updateSyncIndicator(status)
```

### API Client Methods Added:
```javascript
recordMood(mood, durationMinutes, effectiveness, sessionId)
getMoods(days)
getFailureAnalytics(days)
generateWeeklyPlan()
getSyncStatus()
getAPIInfo()
```

---

## 🎯 Summary

These 5 advanced features transform Smart Study Planner from a basic study app to a **psychologically-aware, data-driven study optimization platform** with rare algorithmic thinking. The combination of mood tracking, failure analytics, smart planning, and offline support makes this a compelling portfolio piece that demonstrates:

- 🧠 **Advanced algorithmic thinking**
- 📊 **Database and analytics expertise**
- 🔐 **Security best practices**
- ♿ **User-centric design** (burnout prevention)
- 🚀 **Production-ready code quality**

Perfect for impressing recruiters! ✨
