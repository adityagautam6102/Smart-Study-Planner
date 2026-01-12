# Smart Study Planner Database Examples

Quick reference for common database operations.

## 🔧 Initialize Database

```python
from app import app, db

with app.app_context():
    db.create_all()
    print("Database created!")
```

## 👤 User Operations

### Create User Programmatically

```python
from app import db, User, Gamification

with app.app_context():
    user = User(
        name="John Doe",
        email="john@example.com"
    )
    user.set_password("secure_password")
    
    gamification = Gamification(user=user)
    
    db.session.add(user)
    db.session.add(gamification)
    db.session.commit()
    
    print(f"User created: {user.email}")
```

### Get User by Email

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    print(f"User: {user.name}, XP: {user.gamification.xp}")
```

### List All Users

```python
with app.app_context():
    users = User.query.all()
    for user in users:
        print(f"{user.name} ({user.email}) - Level {user.gamification.level}")
```

## 📚 Subject Operations

### Create Subject

```python
from datetime import datetime, timedelta

with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    
    subject = Subject(
        user_id=user.id,
        name="Advanced Mathematics",
        chapters=30,
        completed_chapters=5,
        difficulty="hard",
        priority="high",
        deadline=datetime.utcnow() + timedelta(days=45)
    )
    
    db.session.add(subject)
    db.session.commit()
    
    print(f"Subject created: {subject.name}")
```

### Get User's Subjects

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    subjects = user.subjects
    
    for subject in subjects:
        completion = (subject.completed_chapters / subject.chapters) * 100
        days_left = (subject.deadline - datetime.utcnow()).days
        print(f"{subject.name}: {completion:.0f}% done, {days_left} days left")
```

### Update Subject Progress

```python
with app.app_context():
    subject = Subject.query.filter_by(id=1).first()
    subject.completed_chapters = 15
    subject.sessions_completed += 1
    subject.total_time_minutes += 120
    db.session.commit()
    print(f"Updated: {subject.completed_chapters}/{subject.chapters} chapters")
```

### Get Subjects by Priority

```python
with app.app_context():
    high_priority = Subject.query.filter_by(priority="high").all()
    print(f"High priority subjects: {len(high_priority)}")
    for s in high_priority:
        print(f"  - {s.name} (Exam in {(s.deadline - datetime.utcnow()).days} days)")
```

### Get Urgent Subjects (Deadline Soon)

```python
from datetime import datetime, timedelta

with app.app_context():
    three_days = datetime.utcnow() + timedelta(days=3)
    urgent = Subject.query.filter(Subject.deadline <= three_days).all()
    
    print(f"Urgent subjects ({len(urgent)}):")
    for s in urgent:
        days = (s.deadline - datetime.utcnow()).days
        print(f"  - {s.name}: {days} days left ({(s.completed_chapters/s.chapters)*100:.0f}% done)")
```

## 🎮 Gamification Operations

### Award XP

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    user.gamification.xp += 50
    
    # Check level up (100 XP per level)
    new_level = user.gamification.xp // 100 + 1
    if new_level > user.gamification.level:
        user.gamification.level = new_level
        print(f"🎉 Level up! Now level {new_level}")
    
    db.session.commit()
```

### Award Badge

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    user.gamification.add_badge("seven_day_streak")
    db.session.commit()
    print(f"Badge awarded! Badges: {user.gamification.get_badges()}")
```

### Update Streak

```python
from datetime import datetime, timedelta

with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    gamif = user.gamification
    
    today = datetime.utcnow().date()
    if gamif.last_study_date:
        last_date = gamif.last_study_date.date()
        if last_date != today:
            if (today - last_date).days == 1:
                gamif.streak += 1
            else:
                gamif.streak = 1
    else:
        gamif.streak = 1
    
    gamif.last_study_date = datetime.utcnow()
    db.session.commit()
    print(f"Current streak: {gamif.streak} days 🔥")
```

### Get User Gamification Stats

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    g = user.gamification
    
    print(f"""
    === Gamification Stats for {user.name} ===
    Level: {g.level}
    Total XP: {g.xp}
    Streak: {g.streak} days
    Total Study Time: {g.total_minutes_studied} minutes
    Badges: {g.get_badges()}
    Current Mode: {g.current_mode}
    """)
```

## 📝 Study Session Operations

### Record Study Session

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    subject = Subject.query.filter_by(id=1).first()
    
    session = StudySession(
        user_id=user.id,
        subject_id=subject.id,
        duration_minutes=50,
        pomodoro_count=2
    )
    
    user.gamification.total_minutes_studied += 50
    
    db.session.add(session)
    db.session.commit()
    print("Study session recorded!")
```

### Get Study History

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    sessions = StudySession.query.filter_by(user_id=user.id).order_by(StudySession.date.desc()).limit(10).all()
    
    print("Last 10 study sessions:")
    for session in sessions:
        subject = Subject.query.get(session.subject_id)
        print(f"  {session.date.strftime('%Y-%m-%d %H:%M')} - {subject.name}: {session.duration_minutes} min")
```

### Get Today's Study Time

```python
from datetime import datetime, date

with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    today = date.today()
    
    sessions = StudySession.query.filter(
        StudySession.user_id == user.id,
        StudySession.date >= datetime.combine(today, datetime.min.time()),
        StudySession.date <= datetime.combine(today, datetime.max.time())
    ).all()
    
    total_minutes = sum(s.duration_minutes for s in sessions)
    print(f"Today's study time: {total_minutes} minutes ⏱️")
```

## 🤔 Reflection Operations

### Record Reflection

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    
    reflection = Reflection(
        user_id=user.id,
        subject_id=1,
        reason_idx=2,  # "Topic too difficult"
        reason_text="Topic too difficult"
    )
    
    db.session.add(reflection)
    db.session.commit()
    print("Reflection recorded!")
```

### Get Reflection Summary

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    reflections = Reflection.query.filter_by(user_id=user.id).all()
    
    reasons = [
        "No time available",
        "Felt too tired",
        "Topic too difficult",
        "Lost motivation",
        "Got distracted",
        "Need better planning"
    ]
    
    reason_counts = [0] * 6
    for r in reflections:
        reason_counts[r.reason_idx] += 1
    
    print("Reflection patterns:")
    for i, count in enumerate(reason_counts):
        if count > 0:
            print(f"  {reasons[i]}: {count} times")
```

### Get Subject-Specific Reflections

```python
with app.app_context():
    subject = Subject.query.filter_by(id=1).first()
    reflections = Reflection.query.filter_by(subject_id=1).all()
    
    print(f"Reflection history for {subject.name}:")
    for r in reflections:
        print(f"  {r.date.strftime('%Y-%m-%d')}: {r.reason_text}")
```

## 📊 Analytics Operations

### Get User Analytics Summary

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    
    subjects = user.subjects
    sessions = user.study_sessions
    
    total_chapters = sum(s.chapters for s in subjects)
    completed_chapters = sum(s.completed_chapters for s in subjects)
    completion_percent = (completed_chapters / total_chapters * 100) if total_chapters > 0 else 0
    
    total_study_minutes = sum(s.duration_minutes for s in sessions)
    
    print(f"""
    === Analytics for {user.name} ===
    Total Subjects: {len(subjects)}
    Overall Progress: {completed_chapters}/{total_chapters} ({completion_percent:.1f}%)
    Total Study Time: {total_study_minutes} minutes ({total_study_minutes // 60}h {total_study_minutes % 60}m)
    Study Sessions: {len(sessions)}
    Average Session: {total_study_minutes / len(sessions) if sessions else 0:.1f} minutes
    """)
```

### Get Progress by Priority

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    
    for priority in ['high', 'medium', 'low']:
        subjects = [s for s in user.subjects if s.priority == priority]
        if subjects:
            total = sum(s.chapters for s in subjects)
            completed = sum(s.completed_chapters for s in subjects)
            percent = (completed / total * 100) if total > 0 else 0
            print(f"{priority.upper()}: {completed}/{total} ({percent:.0f}%)")
```

### Get Progress by Difficulty

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    
    for difficulty in ['easy', 'medium', 'hard']:
        subjects = [s for s in user.subjects if s.difficulty == difficulty]
        if subjects:
            total = sum(s.chapters for s in subjects)
            completed = sum(s.completed_chapters for s in subjects)
            percent = (completed / total * 100) if total > 0 else 0
            print(f"{difficulty.upper()}: {completed}/{total} ({percent:.0f}%)")
```

### Study Time Distribution (Heatmap Data)

```python
from datetime import datetime

with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    sessions = user.study_sessions
    
    heatmap = {}
    for session in sessions:
        date_key = session.date.strftime('%Y-%m-%d')
        hour_key = session.date.strftime('%H')
        
        if date_key not in heatmap:
            heatmap[date_key] = {}
        if hour_key not in heatmap[date_key]:
            heatmap[date_key][hour_key] = 0
        
        heatmap[date_key][hour_key] += session.duration_minutes
    
    print("Study heatmap (sample):")
    for date_str in sorted(heatmap.keys())[-7:]:  # Last 7 days
        hours = heatmap[date_str]
        total = sum(hours.values())
        print(f"{date_str}: {total} min total")
```

## 🗑️ Delete Operations

### Delete All Data for User

```python
with app.app_context():
    user = User.query.filter_by(email="john@example.com").first()
    
    db.session.delete(user)
    db.session.commit()
    print(f"User {user.email} and all their data deleted")
```

### Delete Specific Subject

```python
with app.app_context():
    subject = Subject.query.filter_by(id=1).first()
    db.session.delete(subject)
    db.session.commit()
    print(f"Subject deleted")
```

## 🔍 Query Examples

### Find All Incomplete Subjects

```python
with app.app_context():
    incomplete = Subject.query.filter(
        Subject.completed_chapters < Subject.chapters
    ).all()
    print(f"Incomplete subjects: {len(incomplete)}")
```

### Find Users with Active Streaks

```python
from datetime import datetime, timedelta

with app.app_context():
    yesterday = datetime.utcnow() - timedelta(days=1)
    active_users = db.session.query(User).join(Gamification).filter(
        Gamification.last_study_date > yesterday
    ).all()
    
    print(f"Users who studied today or yesterday: {len(active_users)}")
```

### Find Top Performers

```python
with app.app_context():
    top_users = User.query.all()
    top_users.sort(key=lambda u: u.gamification.level, reverse=True)
    
    print("Top performers:")
    for user in top_users[:5]:
        print(f"  {user.name}: Level {user.gamification.level} ({user.gamification.xp} XP)")
```

---

**These examples cover all major database operations. Adapt them for your use case!**
