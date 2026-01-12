# Quick Start Guide - Advanced Features

## 🚀 Getting Started

### 1. Start the Backend Server
```bash
cd Smart-Study-Planner
python app.py
```

Server will start at `http://localhost:5000`

### 2. Open the Frontend
```
Open index.html in your browser
or serve with: python -m http.server 8000
```

Access at: `http://localhost:8000`

---

## ✅ Quick Testing Checklist

### Feature 1: Mood Tracker 😊
- [ ] Login to the app
- [ ] Click "😊 Mood Tracker" button
- [ ] Select a mood (Tired/Normal/Energetic)
- [ ] Rate effectiveness (1-5)
- [ ] Check console for mood recorded
- **Expected**: Pomodoro duration adjusts based on mood

### Feature 2: Failure Analytics 📊
- [ ] Complete several study sessions
- [ ] Add reflections with different reasons
- [ ] Click "📊 Failure Analytics" button
- [ ] View:
  - Most skipped subjects
  - Top failure reasons
  - Best study hours
- **Expected**: Charts show patterns from your study data

### Feature 3: Weekly Auto-Planner 📅
- [ ] Add 3-5 subjects with different deadlines
- [ ] Click "📅 Generate Weekly Plan" button
- [ ] See optimized weekly schedule
- [ ] Check subject distribution by urgency
- **Expected**: Urgent subjects appear early in the week

### Feature 4: Sync Indicator 🟢
- [ ] Look top-right corner of dashboard
- [ ] Should show "🟢 Synced" in green
- [ ] Disconnect internet → "🟡 Offline" in yellow
- [ ] Reconnect → Back to "🟢 Synced"
- **Expected**: Status updates automatically

### Feature 5: Backend Improvements 🔧
- [ ] Check API versioning: `GET /api/v1/info`
- [ ] Verify rate limiting works
- [ ] Test soft deletes (data preserved after deletion)
- [ ] Check database performance with indexes
- **Expected**: All endpoints return data correctly

---

## 🧪 API Testing (Using cURL or Postman)

### Register & Login
```bash
# Register
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Response includes access_token - save it!
# export TOKEN="your_token_here"
```

### Test Mood Recording
```bash
curl -X POST http://localhost:5000/api/v1/moods \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mood": "energetic",
    "duration_minutes": 25,
    "effectiveness": 5
  }'
```

### Test Failure Analytics
```bash
curl -X GET "http://localhost:5000/api/v1/analytics/failure?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

### Test Weekly Planner
```bash
curl -X POST http://localhost:5000/api/v1/planner/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test Sync Status
```bash
curl -X GET http://localhost:5000/api/v1/sync/status \
  -H "Authorization: Bearer $TOKEN"
```

### Test API Info
```bash
curl -X GET http://localhost:5000/api/v1/info
```

---

## 🐛 Troubleshooting

### "API Error: 401 Unauthorized"
- ✅ Make sure you're logged in
- ✅ Check token is valid in localStorage
- ✅ Verify Authorization header format: `Bearer TOKEN`

### "Rate limit exceeded"
- ✅ Wait a minute and try again
- ✅ Different endpoints have different limits:
  - Moods: 10/hour
  - Analytics: 20/hour
  - Planner: 5/hour

### "Modal not opening"
- ✅ Check browser console for errors
- ✅ Verify elements exist in HTML
- ✅ Clear cache and reload

### "No data in analytics"
- ✅ Need to first:
  1. Create a subject
  2. Record a study session
  3. Add a reflection
  4. Record a mood
- ✅ Then analytics will have data to analyze

---

## 🎨 UI Tour

### New Dashboard Buttons
Located below the main content area:

```
[📊 Failure Analytics] [📅 Generate Weekly Plan] [😊 Mood Tracker]
```

### Modals

**Mood Tracker Modal**:
```
┌─────────────────────────────────┐
│ 😊 How are you feeling?         │
│─────────────────────────────────│
│ [😴 Tired] [😐 Normal] [⚡ Energetic] │
│                                 │
│ Effectiveness Rating:           │
│ [😞 1] [😕 2] [😐 3] [😊 4] [🤩 5] │
└─────────────────────────────────┘
```

**Failure Analytics Modal**:
```
┌─────────────────────────────────┐
│ 📊 Failure Analytics            │
│─────────────────────────────────│
│ ⚠️ Most Skipped Subjects:        │
│   - History: 7 times            │
│   - Chemistry: 3 times          │
│                                 │
│ 🔍 Top Failure Reasons:         │
│   - Too Tired: 12 times         │
│   - Distracted: 8 times         │
│                                 │
│ ✨ Best Study Hours:            │
│   - 14:00-15:00 (4.8/5)         │
│   - 10:00-11:00 (4.6/5)         │
└─────────────────────────────────┘
```

**Weekly Plan Modal**:
```
┌──────────────────────────────────────┐
│ 📅 Your Optimized Weekly Study Plan  │
├──────────────────────────────────────┤
│ Monday:                              │
│  • Mathematics [3 chapters]          │
│    [hard] 90 mins                    │
│                                      │
│ Tuesday:                             │
│  • Physics [4 chapters]              │
│    [hard] 120 mins                   │
│                                      │
│ ...                                  │
│                                      │
│ Sunday:                              │
│  Rest day 🎉                         │
└──────────────────────────────────────┘
```

**Sync Indicator** (Top-right):
```
🟢 Synced  (when connected)
🟡 Offline (when no internet)
🔴 Failed  (when error)
```

---

## 📊 Data Flow

```
User Action
    ↓
Frontend (script.js) 
    ↓
API Client (api-client.js)
    ↓
Flask Backend (app.py)
    ↓
Database (SQLite/PostgreSQL)
    ↓
SQLAlchemy ORM
    ↓
JSON Response
    ↓
Frontend Updates UI
```

---

## 🔒 Security Features

✅ **JWT Authentication**: All endpoints except login require valid token
✅ **Rate Limiting**: Prevents abuse with per-endpoint limits
✅ **CORS**: Configured for safe cross-origin requests
✅ **Soft Deletes**: Data preservation for compliance
✅ **Password Hashing**: Werkzeug security for user passwords
✅ **SQL Injection Prevention**: SQLAlchemy parameterized queries

---

## 📈 Performance Optimizations

✅ **Database Indexes**:
- `idx_user_subject`: Fast user subject lookup
- `idx_user_deadline`: Fast deadline filtering
- Reduces query time from O(n) to O(log n)

✅ **Query Optimization**:
- `func.count()`, `func.avg()` for aggregations
- Group by clauses to reduce result size
- Limit queries to 30 days by default

✅ **Caching**:
- LocalStorage for user preferences
- Service Worker for offline assets

---

## 🎓 Learning Resources

These features demonstrate:

1. **Algorithmic Thinking** 🧠
   - Workload distribution algorithm
   - Scoring functions with weighted factors
   - Graph optimization for scheduling

2. **Database Skills** 🗄️
   - Complex SQLAlchemy queries
   - Aggregation and grouping
   - Index optimization

3. **API Design** 🔌
   - RESTful principles
   - Rate limiting
   - Versioning strategies

4. **User Psychology** 💭
   - Mood tracking and burnout detection
   - Pattern recognition for behavior
   - Personalization based on data

5. **Full-Stack Integration** 🔗
   - Frontend-backend communication
   - State management
   - Error handling

---

## 🚀 Next Steps

### For Portfolio
1. Deploy to Heroku or AWS
2. Use PostgreSQL for production
3. Add unit tests
4. Document API with Swagger/OpenAPI
5. Add CI/CD pipeline

### For Enhancement
1. Add ML-based mood prediction
2. Implement adaptive study schedules
3. Add team collaboration features
4. Create mobile app version
5. Add voice-based mood input

### For Monetization
1. Premium subscription for advanced analytics
2. AI tutor integration
3. Group study analytics
4. Learning path recommendations

---

## ✨ Congratulations!

You've successfully implemented 5 advanced features that transform Smart Study Planner into a recruiter-impressing portfolio project! 

Key selling points:
- 🎯 **Rare algorithmic thinking** (workload distribution)
- 📊 **Advanced analytics** (failure pattern detection)
- 💭 **Psychology-based features** (burnout prevention)
- 🔐 **Production-ready practices** (security, indexing, versioning)
- ⚡ **Performance optimized** (fast queries, caching)

Share this with recruiters to land that interview! 🎉
