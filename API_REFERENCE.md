# API Reference - Advanced Features

## Quick Endpoint Guide

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All endpoints (except `/info`) require:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## Endpoints

### 1. Mood Tracking

#### POST /v1/moods
**Record a study mood and effectiveness rating**

**Request**:
```bash
curl -X POST http://localhost:5000/api/v1/moods \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mood": "energetic",
    "duration_minutes": 25,
    "effectiveness": 5,
    "session_id": 1
  }'
```

**Parameters**:
- `mood` (required): "tired" | "normal" | "energetic"
- `duration_minutes` (optional): integer minutes
- `effectiveness` (optional): 1-5 rating
- `session_id` (optional): link to study session

**Response** (201):
```json
{
  "status": "success",
  "message": "Mood recorded",
  "mood_id": 42
}
```

**Rate Limit**: 10 per hour

---

#### GET /v1/moods?days=7
**Retrieve mood history**

**Request**:
```bash
curl -X GET "http://localhost:5000/api/v1/moods?days=7" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters**:
- `days` (optional): number of days to look back (default: 7)

**Response** (200):
```json
{
  "moods": [
    {
      "id": 42,
      "mood": "energetic",
      "effectiveness": 5,
      "time": "2024-01-15T14:30:00",
      "duration_minutes": 25
    }
  ],
  "total_count": 5
}
```

**Rate Limit**: Unlimited

---

### 2. Failure Analytics

#### GET /v1/analytics/failure?days=30
**Retrieve failure analytics and patterns**

**Request**:
```bash
curl -X GET "http://localhost:5000/api/v1/analytics/failure?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters**:
- `days` (optional): analysis window (default: 30)

**Response** (200):
```json
{
  "skipped_subjects": [
    {
      "subject_idx": 1,
      "skip_count": 7
    },
    {
      "subject_idx": 3,
      "skip_count": 3
    }
  ],
  "failure_reasons": [
    {
      "reason": "Too Tired",
      "count": 12
    },
    {
      "reason": "Distracted",
      "count": 8
    }
  ],
  "best_study_hours": [
    {
      "hour": 14,
      "effectiveness": 4.8,
      "sessions": 5
    },
    {
      "hour": 10,
      "effectiveness": 4.6,
      "sessions": 4
    }
  ]
}
```

**Insights**:
- `skipped_subjects`: Most avoided subjects (top 10)
- `failure_reasons`: Why sessions were skipped
- `best_study_hours`: Peak productivity hours (0-23)

**Rate Limit**: 20 per hour

---

### 3. Weekly Planner

#### POST /v1/planner/generate
**Generate optimized weekly study plan**

**Request**:
```bash
curl -X POST http://localhost:5000/api/v1/planner/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Request Body**: Empty object `{}`

**Response** (201):
```json
{
  "plan": {
    "Monday": [
      {
        "subject_name": "Mathematics",
        "subject_id": 1,
        "chapters": 5,
        "difficulty": "hard",
        "priority": "high",
        "recommended_duration_mins": 150
      }
    ],
    "Tuesday": [
      {
        "subject_name": "Physics",
        "subject_id": 2,
        "chapters": 4,
        "difficulty": "hard",
        "priority": "high",
        "recommended_duration_mins": 120
      }
    ],
    "Wednesday": [...],
    "Thursday": [...],
    "Friday": [...],
    "Saturday": [...],
    "Sunday": []
  },
  "generated_at": "2024-01-15T10:30:00",
  "subject_count": 5,
  "optimization_notes": "Plan prioritizes urgent deadlines and high-difficulty subjects. Recommend studying Sunday for overflow."
}
```

**Algorithm**:
1. Calculates urgency score: `(chapters_left / days_left) * difficulty_weight * priority_weight`
2. Sorts subjects by urgency
3. Distributes across 6 days in round-robin
4. Reserves Sunday as buffer
5. Estimates duration: `chapters * 30 minutes`

**Rate Limit**: 5 per hour

---

### 4. Sync Status

#### GET /v1/sync/status
**Check data synchronization status**

**Request**:
```bash
curl -X GET http://localhost:5000/api/v1/sync/status \
  -H "Authorization: Bearer $TOKEN"
```

**Response** (200):
```json
{
  "status": "synced",
  "timestamp": "2024-01-15T14:35:22",
  "message": "All data synced"
}
```

**Status Values**:
- `"synced"`: User authenticated, all data synchronized
- `"offline"`: No internet connection
- `"failed"`: Connection or authentication error

**Rate Limit**: Unlimited

---

### 5. API Info

#### GET /v1/info
**Get API version and capabilities** (No auth required)

**Request**:
```bash
curl -X GET http://localhost:5000/api/v1/info
```

**Response** (200):
```json
{
  "version": "1.0.0",
  "features": [
    "Subject management",
    "Study sessions with mood tracking",
    "Gamification with achievements",
    "Reflections and analytics",
    "Failure analysis",
    "Weekly auto-planner",
    "Offline-first sync"
  ],
  "rate_limits": {
    "global": "200 per day, 50 per hour",
    "moods": "10 per hour",
    "analytics": "20 per hour",
    "planner": "5 per hour"
  }
}
```

**Rate Limit**: Unlimited

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Missing Authorization Header"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid mood value"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded: 5 per hour"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global | 200 | day |
| Global | 50 | hour |
| POST /v1/moods | 10 | hour |
| GET /v1/analytics/failure | 20 | hour |
| POST /v1/planner/generate | 5 | hour |

**Headers in Response**:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1705305600
```

---

## Frontend Integration

### Using api-client.js

```javascript
// Record mood
const result = await api.recordMood('energetic', 25, 5);

// Get mood history
const moods = await api.getMoods(days=7);

// Get failure analytics
const analytics = await api.getFailureAnalytics(days=30);

// Generate weekly plan
const plan = await api.generateWeeklyPlan();

// Check sync status
const status = await api.getSyncStatus();

// Get API info
const info = await api.getAPIInfo();
```

---

## Database Models

### StudyMood
```python
{
  "id": Integer,
  "user_id": Integer (FK),
  "mood": String (tired|normal|energetic),
  "time": DateTime,
  "duration_minutes": Integer,
  "effectiveness": Integer (1-5),
  "session_id": Integer (FK)
}
```

### Subject (Updated)
```python
{
  "id": Integer,
  "user_id": Integer (FK),
  "name": String,
  "chapters": Integer,
  "completed_chapters": Integer,
  "difficulty": String (easy|medium|hard),
  "priority": String (low|medium|high),
  "deadline": DateTime,
  "sessions_completed": Integer,
  "total_time_minutes": Integer,
  "created_at": DateTime,
  "updated_at": DateTime,
  # NEW FIELDS:
  "is_deleted": Boolean (default: False),
  "deleted_at": DateTime (nullable)
}
```

---

## Workflow Example

### Complete User Journey

```
1. User Logs In
   POST /api/login → get access_token

2. User Records Study Mood
   POST /api/v1/moods
   - Record: "energetic", 25 mins, effectiveness: 5

3. User Finishes Week of Study
   - Multiple mood records accumulated
   - Multiple sessions completed
   - Multiple reflections recorded

4. User Checks Failure Analytics
   GET /api/v1/analytics/failure?days=30
   - Sees History is most skipped (7 times)
   - Sees best study time is 2-3 PM
   - Takes action: reschedule History to afternoon

5. User Generates Weekly Plan
   POST /api/v1/planner/generate
   - Algorithm balances all subjects
   - History scheduled for optimal times
   - Plan adapts to deadlines

6. System Tracks Sync
   GET /api/v1/sync/status
   - Shows 🟢 Synced indicator
   - App works offline when needed
```

---

## Testing Commands

### Setup (1-time)
```bash
# Get access token
TOKEN=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.access_token')

export TOKEN
```

### Test All Endpoints
```bash
# 1. Record mood
curl -X POST http://localhost:5000/api/v1/moods \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mood":"energetic","duration_minutes":25,"effectiveness":5}'

# 2. Get moods
curl -X GET "http://localhost:5000/api/v1/moods?days=7" \
  -H "Authorization: Bearer $TOKEN"

# 3. Get analytics
curl -X GET "http://localhost:5000/api/v1/analytics/failure?days=30" \
  -H "Authorization: Bearer $TOKEN"

# 4. Generate plan
curl -X POST http://localhost:5000/api/v1/planner/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# 5. Check sync
curl -X GET http://localhost:5000/api/v1/sync/status \
  -H "Authorization: Bearer $TOKEN"

# 6. API info
curl -X GET http://localhost:5000/api/v1/info
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Get new token via login endpoint |
| 429 Rate Limited | Wait before next request |
| Empty analytics | Need mood data first (records in StudyMood) |
| Empty plan | Need subjects with deadlines |
| 500 Server Error | Check backend logs, verify database |

---

## Documentation Links

- Full Features Guide: [ADVANCED_FEATURES.md](ADVANCED_FEATURES.md)
- Testing Guide: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- Backend API: [BACKEND_API.md](BACKEND_API.md)
- Setup Instructions: [SETUP.md](SETUP.md)
