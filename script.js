// Smart Study Planner - Enhanced with AI Recommendations, Pomodoro, Analytics & Gamification
const USE_BACKEND_API = false;
// When true, enable frontend-only demo behaviours (prevents redirects, eases GH Pages demo)
const DEMO_MODE = true;

class SmartStudyPlanner {
    constructor() {
        this.subjects = this.loadFromStorage() || [];
        this.gamification = this.loadGamification() || {
            xp: 0,
            level: 1,
            streak: 0,
            lastStudyDate: null,
            badges: [],
            totalMinutesStudied: 0,
            studySessions: []
        };
        this.analytics = this.loadAnalytics() || {};
        this.charts = {};
        this.theme = this.loadTheme() || 'auto';
        this.pomodoroState = {
            isRunning: false,
            timeLeft: 1500,
            currentSubjectId: null,
            sessionType: 'work'
        };
        this.musicState = {
            isPlaying: false,
            currentPlaylist: null,
            currentTitle: null,
            volume: 50
        };
        // Require login: if no current user, redirect to login page
        // When running from GitHub Pages, file://, or localhost for demo, allow a guest user
        if (!localStorage.getItem('smartStudyUser')) {
            try {
                const host = (location && location.hostname) ? location.hostname : '';
                const protocol = (location && location.protocol) ? location.protocol : '';
                const isDemoHost = host.includes('github.io') || host === 'localhost' || protocol === 'file:';
                if (isDemoHost) {
                    localStorage.setItem('smartStudyUser', JSON.stringify({ email: 'guest', name: 'Guest' }));
                } else {
                    window.location.href = 'login.html';
                    return;
                }
            } catch (e) {
                window.location.href = 'login.html';
                return;
            }
        }

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeTheme();
        this.render();
        this.checkBurnout();
        this.updateGamificationDisplay();
    }

    setupEventListeners() {
        document.getElementById('subjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSubject();
        });

        // Focus mode controls
        document.getElementById('focusStart').addEventListener('click', () => this.startFocusSession());
        document.getElementById('focusPause').addEventListener('click', () => this.pauseFocusSession());
        document.getElementById('focusExit').addEventListener('click', () => this.exitFocusMode());

        // Pomodoro controls
        document.getElementById('pomodoroPlayBtn').addEventListener('click', () => {
            this.pomodoroControl('play');
        });

        // Chat controls (if present)
        const chatSend = document.getElementById('chatSendBtn');
        const chatInput = document.getElementById('chatInput');
        if (chatSend && chatInput) {
            chatSend.addEventListener('click', () => this.sendChatMessage());
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
            });
        }
    }

    // ============= LOGOUT SYSTEM =============
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('smartStudyUser');
            localStorage.removeItem('smartStudyPlannerData');
            localStorage.removeItem('smartStudyGamification');
            localStorage.removeItem('smartStudyTheme');
            window.location.href = 'landing.html';
        }
    }

    // ============= THEME SYSTEM =============
    initializeTheme() {
        if (this.theme === 'auto') {
            this.applyAutoTheme();
        } else {
            this.applyTheme(this.theme);
        }
        this.updateThemeButton();
    }

    getTimeBasedTheme() {
        const hour = new Date().getHours();
        // Night: 8 PM (20:00) to 6 AM (06:00)
        return (hour >= 20 || hour < 6) ? 'dark' : 'light';
    }

    applyAutoTheme() {
        const theme = this.getTimeBasedTheme();
        this.applyTheme(theme);
    }

    applyTheme(theme) {
        const body = document.body;
        
        if (theme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    }

    toggleTheme() {
        if (this.theme === 'auto') {
            // Auto -> Dark
            this.theme = 'dark';
            this.applyTheme('dark');
        } else if (this.theme === 'dark') {
            // Dark -> Light
            this.theme = 'light';
            this.applyTheme('light');
        } else {
            // Light -> Auto
            this.theme = 'auto';
            this.applyAutoTheme();
        }
        
        this.saveTheme();
        this.updateThemeButton();
    }

    updateThemeButton() {
        const btn = document.getElementById('themeToggle');
        const icons = {
            'light': '☀️ Light',
            'dark': '🌙 Dark',
            'auto': '⚡ Auto'
        };
        btn.textContent = icons[this.theme];
    }

    saveTheme() {
        localStorage.setItem('smartStudyTheme', this.theme);
    }

    loadTheme() {
        return localStorage.getItem('smartStudyTheme') || 'auto';
    }

    // ============= SIMPLE CHATBOT & GPT SHORTCUT =============
    toggleChat() {
        const modal = document.getElementById('chatModal');
        if (!modal) return;
        modal.classList.toggle('hidden');
        // load history for current user
        if (!this.chatHistory) this.chatHistory = this.loadChatHistory();
        this.renderChatMessages();
    }

    openChatGPT() {
        // Shortcut to ChatGPT web UI
        window.open('https://chat.openai.com/', '_blank');
    }

    getChatStorageKey() {
        const user = JSON.parse(localStorage.getItem('smartStudyUser') || '{}');
        return `smartStudyChat_${user.email || 'guest'}`;
    }

    loadChatHistory() {
        const key = this.getChatStorageKey();
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    }

    saveChatHistory() {
        const key = this.getChatStorageKey();
        localStorage.setItem(key, JSON.stringify(this.chatHistory || []));
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        if (!this.chatHistory) this.chatHistory = this.loadChatHistory();
        this.chatHistory.push({role: 'user', text, at: new Date().toISOString()});
        this.saveChatHistory();
        this.renderChatMessages();
        input.value = '';

        // Quick command: "open gpt" opens official ChatGPT
        if (/open gpt|open chatgpt|goto gpt/i.test(text)) {
            this.botRespond("Opening ChatGPT in a new tab...", true);
            window.open('https://chat.openai.com/', '_blank');
            return;
        }

        // Produce bot reply after short delay
        setTimeout(() => this.botRespond(null, false), 700 + Math.random() * 800);
    }

    botRespond(overrideText = null, brief = false) {
        // Basic rule-based responses to help manage tasks
        const lastUser = this.chatHistory && [...this.chatHistory].reverse().find(m => m.role === 'user');
        const text = overrideText || (lastUser ? lastUser.text : 'Hello');

        let reply = "I can help with your study plan, Pomodoro sessions, and reminders. Try: 'recommend', 'start pomodoro', 'add subject', or 'open gpt'.";

        const t = text.toLowerCase();
        if (/recommend|plan|today|suggest/i.test(t)) {
            // provide a short summary of recommendations
            const recHtml = this.generateSmartRecommendation();
            // strip HTML tags for plain reply summary
            const tmp = recHtml.replace(/<[^>]+>/g, ' ');
            reply = `Here's a quick suggestion:\n${tmp.slice(0, 480)}`;
        } else if (/pomodoro|timer|start pomodoro/i.test(t)) {
            reply = "Starting a Pomodoro session for your top priority subject. Click 'Start Pomodoro' to begin.";
        } else if (/add subject|new subject/i.test(t)) {
            reply = "To add a subject, use the 'Add Subject' form on the left — enter name, chapters, difficulty, deadline and priority.";
        } else if (/progress|status|how am i/i.test(t)) {
            const total = this.subjects.length;
            const completed = this.subjects.reduce((s, sub) => s + (sub.completedChapters || 0), 0);
            reply = `You have ${total} subjects and have completed ${completed} chapters across them.`;
        } else if (/hi|hello|hey/i.test(t)) {
            reply = "Hi! I'm your study assistant. Ask me for study suggestions or type 'open gpt' to go to ChatGPT.";
        }

        // push bot reply
        this.chatHistory.push({role: 'bot', text: reply, at: new Date().toISOString()});
        this.saveChatHistory();
        this.renderChatMessages();
        if (!brief) this.awardXP(1, 'Chatted with assistant');
    }

    renderChatMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        const history = this.chatHistory || this.loadChatHistory();
        container.innerHTML = '';
        history.forEach(m => {
            const div = document.createElement('div');
            div.className = `chat-bubble ${m.role === 'user' ? 'user' : 'bot'}`;
            div.textContent = m.text;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    }

    // ============= MUSIC PLAYER SYSTEM =============
    playPlaylist(playlistId, title, embedUrl) {
        const buttons = document.querySelectorAll('.music-preset');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        // Find and highlight the active button
        event.target.closest('.music-preset').classList.add('active');
        
        this.musicState.currentPlaylist = playlistId;
        this.musicState.currentTitle = title;
        
        // Show music controls
        document.getElementById('musicControls').classList.remove('hidden');
        document.getElementById('nowPlaying').textContent = `Now Playing: ${title}`;
        
        // For YouTube embeds, we'll use a workaround - create an audio source from free music APIs
        // Using free study music URLs
        const musicUrls = {
            'lofi': 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
            'classical': 'https://www.youtube.com/watch?v=siQul0uWx10',
            'ambient': 'https://www.youtube.com/watch?v=U9mwLBFd6_s',
            'piano': 'https://www.youtube.com/watch?v=Xgx9wJ9Xe64'
        };
        
        // Open YouTube in new tab for now (best cross-browser solution)
        window.open(musicUrls[playlistId], '_blank');
        
        this.musicState.isPlaying = true;
        this.updateMusicPlayBtn();
        
        this.awardXP(2, 'Started focus music');
    }

    toggleMusicPlayback() {
        if (!this.musicState.currentPlaylist) {
            alert('Select a playlist first!');
            return;
        }
        
        this.musicState.isPlaying = !this.musicState.isPlaying;
        this.updateMusicPlayBtn();
    }

    updateMusicPlayBtn() {
        const btn = document.getElementById('musicPlayBtn');
        btn.textContent = this.musicState.isPlaying ? '⏸' : '▶';
    }

    stopMusic() {
        this.musicState.isPlaying = false;
        this.musicState.currentPlaylist = null;
        this.musicState.currentTitle = null;
        
        document.getElementById('musicControls').classList.add('hidden');
        document.getElementById('nowPlaying').textContent = 'Now Playing: --';
        
        const buttons = document.querySelectorAll('.music-preset');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        this.updateMusicPlayBtn();
    }

    setMusicVolume(value) {
        this.musicState.volume = value;
        // Volume is shown visually via the slider
    }

    toggleMusicPlayer() {
        const player = document.getElementById('musicPlayer');
        const content = document.querySelector('.music-player-content');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    }

    // ============= SUBJECT MANAGEMENT =============
    addSubject() {
        const name = document.getElementById('subjectName').value.trim();
        const chapters = parseInt(document.getElementById('chapters').value);
        const deadline = document.getElementById('examDate').value;
        const priority = document.getElementById('priority').value;
        const difficulty = document.getElementById('difficulty').value;

        if (!name || !chapters || !deadline || !priority || !difficulty) {
            alert('Please fill all fields');
            return;
        }

        const subject = {
            id: Date.now(),
            name,
            chapters,
            completedChapters: 0,
            deadline: new Date(deadline),
            priority,
            difficulty,
            daysLeft: this.calculateDaysLeft(deadline),
            createdAt: new Date(),
            sessionsCompleted: 0
        };

        this.subjects.push(subject);
        this.saveToStorage();
        this.clearForm();
        this.render();
        this.awardXP(10, 'Added new subject');
    }

    calculateDaysLeft(deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        const diffTime = deadlineDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    deleteSubject(id) {
        if (confirm('Are you sure you want to delete this subject?')) {
            this.subjects = this.subjects.filter(s => s.id !== id);
            this.saveToStorage();
            this.render();
        }
    }

    updateProgress(id, increment) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            subject.completedChapters = Math.max(0, Math.min(subject.chapters, subject.completedChapters + increment));
            this.saveToStorage();
            this.render();
            this.awardXP(5, 'Chapter completed');
            this.checkAchievements();
        }
    }

    clearForm() {
        document.getElementById('subjectForm').reset();
    }

    // ============= AI-LIKE RECOMMENDATIONS WITH EXPLANATIONS =============
    generateSmartRecommendation() {
        if (this.subjects.length === 0) {
            return '<p class="empty-state">Add subjects to get personalized recommendations</p>';
        }

        // Score: priority (40) + difficulty (30) + urgency (20) + completion deficit (10)
        const scored = this.subjects.map(subject => {
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            const difficultyWeight = { hard: 3, medium: 2, easy: 1 };
            const daysWeight = Math.max(1, 10 - subject.daysLeft);
            const completionDeficit = (subject.chapters - subject.completedChapters) / subject.chapters;

            const score = 
                (priorityWeight[subject.priority] * 40) +
                (difficultyWeight[subject.difficulty] * 30) +
                (daysWeight * 20) +
                (completionDeficit * 10);

            return { ...subject, score };
        }).sort((a, b) => b.score - a.score);

        const totalHours = 6;
        let html = '<div class="recommendation-content">';
        html += `<p style="color: var(--success-color); font-weight: bold;">✅ Today's Optimal Study Plan:</p>`;

        let timeSlot = 9;
        for (let i = 0; i < Math.min(3, scored.length); i++) {
            const s = scored[i];
            const allocation = (s.score / scored.slice(0, 3).reduce((sum, x) => sum + x.score, 0)) * totalHours;
            const endTime = timeSlot + allocation;
            const completion = Math.round((s.completedChapters / s.chapters) * 100);

            // Build reasoning for recommendation
            const reasons = [];
            if (s.daysLeft <= 3) reasons.push(`🔴 Exam in ${s.daysLeft} days (URGENT)`);
            else if (s.daysLeft <= 7) reasons.push(`🟡 Exam in ${s.daysLeft} days (Soon)`);
            else reasons.push(`📅 Exam in ${s.daysLeft} days`);
            
            reasons.push(`Difficulty: ${s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1)}`);
            reasons.push(`Only ${completion}% completed`);

            html += `
                <div class="recommendation-item">
                    <div class="rec-title"><strong>${s.name}</strong></div>
                    <div class="rec-time">⏰ ${String(Math.floor(timeSlot)).padStart(2, '0')}:00 - ${String(Math.floor(endTime)).padStart(2, '0')}:00 (${allocation.toFixed(1)} hrs)</div>
                    <div class="rec-reason">
                        <strong>Why suggested:</strong>
                        <ul style="margin: 6px 0; padding-left: 20px; font-size: 0.9rem;">
                            ${reasons.map(r => `<li>${r}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="rec-action">
                        <div style="margin-bottom: 8px;">📖 Target: ${Math.ceil((s.chapters - s.completedChapters) / (allocation || 1))} chapters</div>
                        <button class="btn btn-small btn-secondary" style="font-size: 0.85rem;" onclick="planner.showReflection('${s.id}')">Skip & Reflect</button>
                    </div>
                </div>
            `;
            timeSlot = endTime;
        }

        html += '</div>';
        return html;
    }

    // ============= ADAPTIVE POMODORO TIMER =============
    startPomodoro() {
        if (this.subjects.length === 0) {
            alert('Add subjects first!');
            return;
        }

        document.getElementById('pomodoroModal').classList.remove('hidden');
        
        // Get recommended subject
        const scored = this.subjects.map(s => {
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            const difficultyWeight = { hard: 3, medium: 2, easy: 1 };
            return {
                ...s,
                score: priorityWeight[s.priority] * difficultyWeight[s.difficulty] * (10 - s.daysLeft)
            };
        }).sort((a, b) => b.score - a.score)[0];

        this.pomodoroState.currentSubjectId = scored.id;

        // Get mode-aware duration settings
        const settings = this.getPomodoroSettings();
        const duration = settings[scored.difficulty].work;
        this.pomodoroState.timeLeft = duration * 60;

        document.getElementById('pomodoroSubject').textContent = scored.name;
        document.getElementById('pomodoroDuration').textContent = `${duration} min`;
        this.updatePomodoroDisplay();
    }

    pomodoroControl(action) {
        const playBtn = document.getElementById('pomodoroPlayBtn');
        const pauseBtn = document.getElementById('pomodoroPauseBtn');

        if (action === 'play') {
            this.pomodoroState.isRunning = true;
            playBtn.disabled = true;
            pauseBtn.disabled = false;
            this.pomodoroTimer();
        } else if (action === 'pause') {
            this.pomodoroState.isRunning = false;
            playBtn.disabled = false;
            pauseBtn.disabled = true;
        } else if (action === 'reset') {
            this.pomodoroState.isRunning = false;
            const subject = this.subjects.find(s => s.id === this.pomodoroState.currentSubjectId);
            const settings = this.getPomodoroSettings();
            const duration = settings[subject?.difficulty || 'medium'].work;
            this.pomodoroState.timeLeft = duration * 60;
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            this.updatePomodoroDisplay();
        }
    }

    pomodoroTimer() {
        if (!this.pomodoroState.isRunning) return;

        if (this.pomodoroState.timeLeft > 0) {
            this.pomodoroState.timeLeft--;
            this.updatePomodoroDisplay();
            setTimeout(() => this.pomodoroTimer(), 1000);
        } else {
            this.pomodoroSessionComplete();
        }
    }

    pomodoroSessionComplete() {
        const subject = this.subjects.find(s => s.id === this.pomodoroState.currentSubjectId);
        if (subject) {
            subject.sessionsCompleted++;
            this.awardXP(25, 'Pomodoro session completed');
            this.recordStudySession();
        }

        alert(`🎉 Great work! You completed a study session on ${subject?.name}!`);
        this.closePomodoro();
        this.render();
    }

    updatePomodoroDisplay() {
        const minutes = Math.floor(this.pomodoroState.timeLeft / 60);
        const seconds = this.pomodoroState.timeLeft % 60;
        document.getElementById('pomodoroDisplay').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    closePomodoro() {
        this.pomodoroState.isRunning = false;
        document.getElementById('pomodoroModal').classList.add('hidden');
    }

    // ============= FOCUS MODE =============
    toggleMode(mode) {
        if (mode === 'focus') {
            document.getElementById('mainDashboard').style.display = 'none';
            document.getElementById('focusMode').classList.remove('hidden');
            this.startFocusSession();
        } else {
            document.getElementById('focusMode').classList.add('hidden');
            document.getElementById('mainDashboard').style.display = 'block';
        }
    }

    startFocusSession() {
        const scored = this.subjects.sort((a, b) => {
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            return priorityWeight[b.priority] - priorityWeight[a.priority];
        })[0];

        if (!scored) {
            alert('Add subjects first!');
            return;
        }

        document.getElementById('focusTask').textContent = `Study: ${scored.name}`;
        document.getElementById('focusStart').style.display = 'none';
        document.getElementById('focusPause').style.display = 'inline-block';
        
        const quotes = [
            "You're doing amazing! Keep going 💪",
            "Focus is a superpower 🧠",
            "Every minute counts! ⏰",
            "You got this! 🚀",
            "Progress over perfection 🌟"
        ];
        
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        document.getElementById('focusMotivation').textContent = randomQuote;
    }

    pauseFocusSession() {
        document.getElementById('focusStart').style.display = 'inline-block';
        document.getElementById('focusPause').style.display = 'none';
    }

    exitFocusMode() {
        this.toggleMode('dashboard');
    }

    // ============= GAMIFICATION SYSTEM =============
    awardXP(amount, reason) {
        this.gamification.xp += amount;
        
        // Level up every 100 XP
        const previousLevel = this.gamification.level;
        this.gamification.level = Math.floor(this.gamification.xp / 100) + 1;

        if (this.gamification.level > previousLevel) {
            this.showNotification(`🎉 Level Up! You're now Level ${this.gamification.level}!`);
            this.awardBadge('level_up', `Reached Level ${this.gamification.level}`);
        }

        this.saveGamification();
        this.updateGamificationDisplay();
    }

    recordStudySession() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!this.gamification.lastStudyDate) {
            this.gamification.lastStudyDate = today.toISOString();
            this.gamification.streak = 1;
        } else {
            const lastDate = new Date(this.gamification.lastStudyDate);
            const diffTime = today - lastDate;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                this.gamification.streak++;
            } else if (diffDays > 1) {
                this.gamification.streak = 1;
            }

            this.gamification.lastStudyDate = today.toISOString();
        }

        this.gamification.totalMinutesStudied += 25; // Assuming 25 min default
        this.gamification.studySessions.push({
            date: today.toISOString(),
            duration: 25
        });

        // Check streak badges
        if (this.gamification.streak === 7) {
            this.awardBadge('streak_7', '7-Day Streak 🔥');
        }

        this.saveGamification();
        this.updateGamificationDisplay();
    }

    awardBadge(badgeId, badgeName) {
        if (!this.gamification.badges.includes(badgeId)) {
            this.gamification.badges.push(badgeId);
            this.showNotification(`🏆 Badge Unlocked: ${badgeName}`);
            this.saveGamification();
        }
    }

    updateGamificationDisplay() {
        document.getElementById('streakDisplay').textContent = this.gamification.streak || 0;
        document.getElementById('levelDisplay').textContent = this.gamification.level || 1;
        document.getElementById('xpDisplay').textContent = this.gamification.xp || 0;
    }

    showNotification(message) {
        // Simple notification - could be enhanced
        console.log(message);
    }

    // ============= BURNOUT DETECTION =============
    checkBurnout() {
        if (this.gamification.studySessions.length < 3) return;

        const recentSessions = this.gamification.studySessions.slice(-10);
        const avgSessionLength = recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length;

        const alert = document.getElementById('burnoutAlert');

        // Detect long study streaks
        if (this.gamification.totalMinutesStudied > 180 && avgSessionLength > 50) {
            alert.classList.remove('hidden');
            document.getElementById('burnoutMessage').textContent = 
                `You've studied for ${this.gamification.totalMinutesStudied} minutes today. Take a 30-minute break to avoid burnout!`;
            setTimeout(() => alert.classList.add('hidden'), 8000);
        }

        // Detect low completion rate
        const completionRate = this.subjects.reduce((sum, s) => sum + (s.completedChapters / s.chapters), 0) / this.subjects.length;
        if (completionRate < 0.2 && this.subjects.length > 0) {
            alert.classList.remove('hidden');
            document.getElementById('burnoutMessage').textContent = 
                `Your completion rate is low. Try breaking larger tasks into smaller ones to stay motivated!`;
            setTimeout(() => alert.classList.add('hidden'), 8000);
        }
    }

    checkAchievements() {
        // Check subject completion
        for (let subject of this.subjects) {
            if (subject.completedChapters === subject.chapters && subject.sessionsCompleted > 0) {
                this.awardBadge('subject_complete', `Completed ${subject.name} 🎓`);
            }
        }
    }

    // ============= ANALYTICS =============
    showStats() {
        document.getElementById('statsModal').classList.remove('hidden');
        this.renderHeatmap();
        this.updateWeeklyChart();
    }

    renderHeatmap() {
        const container = document.getElementById('heatmap');
        container.innerHTML = '';

        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const sessionsOnDate = this.gamification.studySessions.filter(s => {
                const sDate = new Date(s.date);
                sDate.setHours(0, 0, 0, 0);
                return sDate.getTime() === date.getTime();
            });

            const totalMinutes = sessionsOnDate.reduce((sum, s) => sum + s.duration, 0);
            let intensity = 'no-study';
            if (totalMinutes > 120) intensity = 'high-study';
            else if (totalMinutes > 60) intensity = 'medium-study';
            else if (totalMinutes > 0) intensity = 'low-study';

            const dayElem = document.createElement('div');
            dayElem.className = `heatmap-day ${intensity}`;
            dayElem.title = `${date.toDateString()}: ${totalMinutes}m`;
            dayElem.textContent = date.getDate();
            container.appendChild(dayElem);
        }
    }

    updateWeeklyChart() {
        const ctx = document.getElementById('weeklyChart');
        
        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        // Get last 7 days data
        const weekData = [];
        const labels = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const sessionsOnDate = this.gamification.studySessions.filter(s => {
                const sDate = new Date(s.date);
                sDate.setHours(0, 0, 0, 0);
                return sDate.getTime() === date.getTime();
            });

            const totalMinutes = sessionsOnDate.reduce((sum, s) => sum + s.duration, 0);
            weekData.push(totalMinutes);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        }

        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Minutes Studied',
                    data: weekData,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: 'rgb(99, 102, 241)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // ============= EXPORT/IMPORT =============
    showExportImport() {
        document.getElementById('exportModal').classList.remove('hidden');
        this.renderBadges();
    }

    renderBadges() {
        const container = document.getElementById('badgesContainer');
        container.innerHTML = '';

        const allBadges = {
            'level_up': '⭐ Level Up',
            'streak_7': '🔥 7-Day Streak',
            'subject_complete': '🎓 Subject Master',
            'night_owl': '🌙 Night Owl',
            'early_bird': '🌅 Early Bird'
        };

        for (let [badgeId, badgeName] of Object.entries(allBadges)) {
            const hasit = this.gamification.badges.includes(badgeId);
            const badge = document.createElement('div');
            badge.className = `badge-item ${hasit ? '' : 'locked'}`;
            badge.textContent = badgeName;
            badge.title = hasit ? 'Earned!' : 'Locked';
            container.appendChild(badge);
        }
    }

    exportData() {
        const data = {
            subjects: this.subjects,
            gamification: this.gamification,
            analytics: this.analytics,
            exportDate: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study-planner-backup-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.subjects = data.subjects.map(s => ({
                    ...s,
                    deadline: new Date(s.deadline),
                    createdAt: new Date(s.createdAt)
                }));
                this.gamification = data.gamification;
                this.analytics = data.analytics || {};
                this.saveToStorage();
                this.saveGamification();
                alert('✅ Data imported successfully!');
                this.render();
            } catch (error) {
                alert('❌ Error importing data');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('⚠️ This will delete ALL your data. Are you sure?')) {
            this.subjects = [];
            this.gamification = { xp: 0, level: 1, streak: 0, badges: [], totalMinutesStudied: 0, studySessions: [] };
            this.saveToStorage();
            this.saveGamification();
            alert('✅ All data cleared');
            this.render();
        }
    }

    // ============= RENDERING & STORAGE =============
    generateStudyPlan() {
        if (this.subjects.length === 0) {
            return '<p class="empty-state">Add subjects to generate your study plan</p>';
        }

        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const sorted = [...this.subjects].sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return a.daysLeft - b.daysLeft;
        });

        const totalHours = 6;
        let remainingHours = totalHours;
        const hoursPerSubject = {};

        sorted.forEach(subject => {
            if (remainingHours <= 0) return;
            
            const priorityWeight = { high: 0.5, medium: 0.3, low: 0.2 };
            const weight = priorityWeight[subject.priority];
            const pendingChapters = subject.chapters - subject.completedChapters;
            const daysLeft = Math.max(1, subject.daysLeft);
            
            const allocated = Math.min(remainingHours, (totalHours * weight));
            hoursPerSubject[subject.id] = allocated;
            remainingHours -= allocated;
        });

        let planHTML = '';
        let timeSlot = 9;

        sorted.forEach(subject => {
            if (!hoursPerSubject[subject.id]) return;

            const hours = hoursPerSubject[subject.id];
            const pendingChapters = subject.chapters - subject.completedChapters;
            const chaptersPerHour = Math.max(0.5, pendingChapters / hours);

            const endTime = timeSlot + hours;
            const timeString = `${String(Math.floor(timeSlot)).padStart(2, '0')}:00 - ${String(Math.floor(endTime)).padStart(2, '0')}:00`;

            planHTML += `
                <div class="plan-item">
                    <div class="plan-time">⏰ ${timeString}</div>
                    <div class="plan-content">
                        <strong>${subject.name}</strong><br>
                        📖 Study ~${chaptersPerHour.toFixed(1)} chapters/topics<br>
                        ⚡ Priority: <span style="color: ${this.getPriorityColor(subject.priority)}">${subject.priority.toUpperCase()}</span>
                        (${subject.daysLeft} days left)
                    </div>
                </div>
            `;

            timeSlot = endTime;
        });

        return planHTML;
    }

    getPriorityColor(priority) {
        const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
        return colors[priority] || '#6366f1';
    }

    renderSubjects() {
        const container = document.getElementById('subjectsList');

        if (this.subjects.length === 0) {
            container.innerHTML = '<p class="empty-state">No subjects yet. Add one to get started!</p>';
            return;
        }

        container.innerHTML = this.subjects.map(subject => {
            const progress = (subject.completedChapters / subject.chapters) * 100;
            const daysWarning = subject.daysLeft <= 3 ? '⚠️' : subject.daysLeft <= 7 ? '📌' : '';

            return `
                <div class="subject-card ${subject.priority}">
                    <div class="subject-header">
                        <span class="subject-name">${subject.name}</span>
                        <span class="priority-badge ${subject.priority}">${subject.priority}</span>
                    </div>
                    <div class="subject-details">
                        <div class="detail-item">📚 ${subject.completedChapters}/${subject.chapters}</div>
                        <div class="detail-item">📊 ${subject.difficulty}</div>
                        <div class="detail-item">⏳ ${subject.daysLeft} days ${daysWarning}</div>
                        <div class="detail-item">🏆 ${subject.sessionsCompleted} sessions</div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${Math.round(progress)}% Complete</div>
                    </div>
                    <div class="subject-actions">
                        <button class="btn btn-success" onclick="planner.updateProgress(${subject.id}, 1)">+1</button>
                        <button class="btn btn-secondary" onclick="planner.updateProgress(${subject.id}, -1)">-1</button>
                        <button class="btn btn-danger" onclick="planner.deleteSubject(${subject.id})">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderStudyPlan() {
        document.getElementById('studyPlan').innerHTML = this.generateStudyPlan();
    }

    renderRecommendations() {
        document.getElementById('smartRecommendation').innerHTML = this.generateSmartRecommendation();
    }

    updateCharts() {
        this.updateProgressChart();
        this.updatePriorityChart();
        this.updateTimeChart();
    }

    updateProgressChart() {
        const ctx = document.getElementById('progressChart');
        
        if (this.charts.progress) {
            this.charts.progress.destroy();
        }

        if (this.subjects.length === 0) {
            ctx.parentElement.innerHTML = '<p class="empty-state">Add subjects to see progress</p>';
            return;
        }

        const chartData = this.subjects.map(s => ({
            name: s.name,
            completed: s.completedChapters,
            total: s.chapters
        }));

        this.charts.progress = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.name),
                datasets: [
                    {
                        label: 'Completed',
                        data: chartData.map(d => d.completed),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    },
                    {
                        label: 'Remaining',
                        data: chartData.map(d => d.total - d.completed),
                        backgroundColor: 'rgba(203, 213, 225, 0.8)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    updatePriorityChart() {
        const ctx = document.getElementById('priorityChart');
        
        if (this.charts.priority) {
            this.charts.priority.destroy();
        }

        const priorityCounts = {
            high: this.subjects.filter(s => s.priority === 'high').length,
            medium: this.subjects.filter(s => s.priority === 'medium').length,
            low: this.subjects.filter(s => s.priority === 'low').length
        };

        this.charts.priority = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    data: [priorityCounts.high, priorityCounts.medium, priorityCounts.low],
                    backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(16, 185, 129, 0.8)'],
                    borderColor: ['rgb(239, 68, 68)', 'rgb(245, 158, 11)', 'rgb(16, 185, 129)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    updateTimeChart() {
        const ctx = document.getElementById('timeChart');
        
        if (this.charts.time) {
            this.charts.time.destroy();
        }

        if (this.subjects.length === 0) {
            ctx.parentElement.innerHTML = '<p class="empty-state">Add subjects to see time allocation</p>';
            return;
        }

        const priorityWeight = { high: 0.5, medium: 0.3, low: 0.2 };
        const totalHours = 6;
        
        const timeData = this.subjects.map(subject => totalHours * priorityWeight[subject.priority]);

        this.charts.time = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: this.subjects.map(s => s.name),
                datasets: [{
                    data: timeData,
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                    ],
                    borderColor: [
                        'rgb(99, 102, 241)',
                        'rgb(236, 72, 153)',
                        'rgb(59, 130, 246)',
                        'rgb(34, 197, 94)',
                        'rgb(251, 146, 60)',
                        'rgb(168, 85, 247)',
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // ============= ACHIEVEMENTS SYSTEM =============
    showAchievements() {
        const modal = document.getElementById('achievementsModal');
        const container = document.getElementById('achievementsContainer');
        
        const allBadges = [
            { id: 'first_subject', name: 'Pioneer', icon: '🚀', description: 'Add your first subject', check: () => this.subjects.length >= 1 },
            { id: 'five_subjects', name: 'Scholar', icon: '📚', description: 'Manage 5 subjects', check: () => this.subjects.length >= 5 },
            { id: 'level_5', name: 'Ambitious', icon: '📈', description: 'Reach Level 5', check: () => this.gamification.level >= 5 },
            { id: 'level_10', name: 'Master', icon: '👑', description: 'Reach Level 10', check: () => this.gamification.level >= 10 },
            { id: 'seven_day_streak', name: 'Consistent', icon: '🔥', description: '7-day streak', check: () => this.gamification.streak >= 7 },
            { id: 'thirty_day_streak', name: 'Unstoppable', icon: '⚡', description: '30-day streak', check: () => this.gamification.streak >= 30 },
            { id: 'one_hour', name: 'Focused', icon: '⏱️', description: 'Study 1 hour straight', check: () => this.gamification.totalMinutesStudied >= 60 },
            { id: 'ten_hours', name: 'Dedicated', icon: '💪', description: 'Study 10 hours total', check: () => this.gamification.totalMinutesStudied >= 600 },
            { id: 'complete_subject', name: 'Finisher', icon: '✅', description: 'Complete a subject', check: () => this.subjects.some(s => s.completedChapters === s.chapters) },
            { id: 'all_subjects_50', name: 'Halfway', icon: '⛳', description: 'All subjects 50%+ done', check: () => this.subjects.length > 0 && this.subjects.every(s => (s.completedChapters / s.chapters) >= 0.5) }
        ];

        let html = '';
        allBadges.forEach(badge => {
            const isUnlocked = badge.check();
            const progress = this.calculateBadgeProgress(badge.id);
            
            html += `
                <div class="achievement-badge ${isUnlocked ? '' : 'locked'}">
                    <div class="badge-icon">${isUnlocked ? badge.icon : '🔒'}</div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-description">${badge.description}</div>
                    ${progress.total > 0 ? `
                        <div class="badge-progress">
                            <div class="badge-progress-bar" style="width: ${Math.min(100, (progress.current / progress.total) * 100)}%"></div>
                        </div>
                        <div style="font-size: 0.7rem; margin-top: 4px;">${progress.current}/${progress.total}</div>
                    ` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
        modal.classList.remove('hidden');
    }

    calculateBadgeProgress(badgeId) {
        const progressMap = {
            'five_subjects': { current: this.subjects.length, total: 5 },
            'level_5': { current: this.gamification.level, total: 5 },
            'level_10': { current: this.gamification.level, total: 10 },
            'seven_day_streak': { current: this.gamification.streak, total: 7 },
            'thirty_day_streak': { current: this.gamification.streak, total: 30 },
            'one_hour': { current: Math.floor(this.gamification.totalMinutesStudied), total: 60 },
            'ten_hours': { current: Math.floor(this.gamification.totalMinutesStudied), total: 600 },
        };
        return progressMap[badgeId] || { current: 0, total: 0 };
    }

    // ============= REFLECTION SYSTEM =============
    showReflection(subjectId) {
        const subject = this.subjects.find(s => s.id === subjectId);
        if (!subject) return;

        const modal = document.getElementById('reflectionModal');
        const subjectDisplay = document.getElementById('reflectionSubject');
        const optionsContainer = document.getElementById('reflectionOptions');

        subjectDisplay.textContent = subject.name;

        const reflectionReasons = [
            { emoji: '⏰', text: 'No time available' },
            { emoji: '😴', text: 'Felt too tired' },
            { emoji: '📚', text: 'Topic too difficult' },
            { emoji: '😐', text: 'Lost motivation' },
            { emoji: '🎮', text: 'Got distracted' },
            { emoji: '🤔', text: 'Need better planning' }
        ];

        let html = '';
        reflectionReasons.forEach((reason, idx) => {
            html += `
                <button class="reflection-btn" onclick="planner.recordReflection('${subjectId}', ${idx}, this)">
                    ${reason.emoji} ${reason.text}
                </button>
            `;
        });

        optionsContainer.innerHTML = html;
        modal.classList.remove('hidden');
    }

    recordReflection(subjectId, reasonIdx, button) {
        if (!this.gamification.reflections) {
            this.gamification.reflections = {};
        }

        const today = new Date().toISOString().split('T')[0];
        if (!this.gamification.reflections[subjectId]) {
            this.gamification.reflections[subjectId] = [];
        }

        this.gamification.reflections[subjectId].push({
            date: today,
            reasonIdx: reasonIdx,
            timestamp: new Date().toISOString()
        });

        this.saveGamification();
        button.classList.add('selected');
        setTimeout(() => {
            document.getElementById('reflectionModal').classList.add('hidden');
        }, 500);
    }

    // ============= MODE SYSTEM =============
    setMode(mode) {
        localStorage.setItem('smartStudyMode', mode);
        this.gamification.currentMode = mode;
        this.saveGamification();
        this.updateModeDisplay();
    }

    getMode() {
        return localStorage.getItem('smartStudyMode') || 'normal';
    }

    updateModeDisplay() {
        const modeSelect = document.getElementById('modeSelect');
        if (modeSelect) {
            modeSelect.value = this.getMode();
        }
    }

    // ============= MODIFIED POMODORO FOR EXAM MODE =============
    getPomodoroSettings() {
        const mode = this.getMode();
        const baseSettings = {
            high: { work: 50, break: 10 },
            medium: { work: 40, break: 8 },
            low: { work: 25, break: 5 }
        };

        if (mode === 'exam') {
            return {
                high: { work: 60, break: 5 },
                medium: { work: 50, break: 5 },
                low: { work: 30, break: 4 }
            };
        }
        return baseSettings;
    }

    // ============= MODIFIED RECOMMENDATIONS FOR MODE =============
    getRecommendationUrgency() {
        const mode = this.getMode();
        return mode === 'exam' ? 0.5 : 3; // In exam mode, urgency threshold is tighter (5 days instead of 3)
    }

    render() {
        this.renderSubjects();
        this.renderStudyPlan();
        this.renderRecommendations();
        this.updateCharts();
        this.updateModeDisplay();
    }

    saveToStorage() {
        const data = this.subjects.map(s => ({
            ...s,
            deadline: s.deadline.toISOString(),
            createdAt: s.createdAt.toISOString()
        }));
        localStorage.setItem('smartStudyPlannerData', JSON.stringify(data));
    }

    loadFromStorage() {
        const data = localStorage.getItem('smartStudyPlannerData');
        if (!data) return null;

        return JSON.parse(data).map(s => ({
            ...s,
            deadline: new Date(s.deadline),
            createdAt: new Date(s.createdAt),
            daysLeft: this.calculateDaysLeft(s.deadline)
        }));
    }

    saveGamification() {
        localStorage.setItem('smartStudyGamification', JSON.stringify(this.gamification));
    }

    loadGamification() {
        const data = localStorage.getItem('smartStudyGamification');
        return data ? JSON.parse(data) : null;
    }

    loadAnalytics() {
        const data = localStorage.getItem('smartStudyAnalytics');
        return data ? JSON.parse(data) : {};
    }

    // ============= MOOD TRACKING =============
    async recordMood(mood, durationMinutes, effectiveness) {
        try {
            const result = await api.recordMood(mood, durationMinutes, effectiveness);
            console.log('Mood recorded:', result);
            
            // Adjust Pomodoro duration based on mood
            if (mood === 'tired') {
                this.pomodoroState.timeLeft = 1200; // 20 min instead of 25 min
                alert('💙 Detected fatigue. Shortened to 20-min focus session. Take breaks!');
            } else if (mood === 'energetic') {
                this.pomodoroState.timeLeft = 1800; // 30 min
                alert('⚡ Great energy! Extended to 30-min focus session.');
            }
            
            return result;
        } catch (error) {
            console.error('Failed to record mood:', error);
        }
    }

    // ============= FAILURE ANALYTICS =============
    async loadFailureAnalytics() {
        try {
            const analytics = await api.getFailureAnalytics(30);
            console.log('Failure Analytics:', analytics);
            
            // Store for visualization
            this.failureAnalytics = analytics;
            this.renderFailureAnalytics();
            
            return analytics;
        } catch (error) {
            console.error('Failed to load failure analytics:', error);
        }
    }

    renderFailureAnalytics() {
        if (!this.failureAnalytics) return;
        
        // This will be rendered in modal with charts
        const modal = document.getElementById('failureAnalyticsModal');
        if (!modal) return;
        
        const content = modal.querySelector('.modal-content');
        const { skipped_subjects, failure_reasons, best_study_hours } = this.failureAnalytics;
        
        let html = '<h3>📊 Failure Analytics (Last 30 Days)</h3>';
        
        // Most skipped subjects
        if (skipped_subjects && skipped_subjects.length > 0) {
            html += '<h4>⚠️ Most Skipped Subjects:</h4><ul>';
            skipped_subjects.forEach(s => {
                const subject = this.subjects.find(sub => sub.id === s.subject_idx);
                html += `<li>${subject ? subject.name : 'Subject ' + s.subject_idx}: ${s.skip_count} times</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No skipped subjects. Great job! 🎉</p>';
        }
        
        // Common failure reasons
        if (failure_reasons && failure_reasons.length > 0) {
            html += '<h4>🔍 Top Failure Reasons:</h4><ul>';
            failure_reasons.forEach(r => {
                html += `<li>${r.reason}: ${r.count} times</li>`;
            });
            html += '</ul>';
        }
        
        // Best study hours
        if (best_study_hours && best_study_hours.length > 0) {
            html += '<h4>✨ Best Study Hours:</h4><ul>';
            best_study_hours.forEach(h => {
                html += `<li>${h.hour}:00 - ${h.hour + 1}:00 (Effectiveness: ${h.effectiveness.toFixed(2)}/5)</li>`;
            });
            html += '</ul>';
        } else {
            html += '<p>No mood data yet. Start recording your mood to see analytics!</p>';
        }
        
        content.innerHTML = html;
        modal.style.display = 'block';
    }

    // ============= WEEKLY AUTO-PLANNER =============
    async generateWeeklyPlan() {
        // Prevent running on empty data (common on fresh GitHub Pages demos)
        if (!this.subjects || this.subjects.length === 0) {
            alert('Please add subjects first to generate a weekly plan.');
            const modal = document.getElementById('weeklyPlanModal');
            if (modal) modal.style.display = 'none';
            return null;
        }

        try {
            const result = await api.generateWeeklyPlan();
            console.log('Weekly Plan Generated:', result);

            this.weeklyPlan = result.plan;
            this.renderWeeklyPlan();
            const modal = document.getElementById('weeklyPlanModal');
            if (modal) modal.style.display = 'block';

            return result;
        } catch (error) {
            console.error('Failed to generate weekly plan:', error);
            alert('Failed to generate weekly plan. Please try again.');
            const modal = document.getElementById('weeklyPlanModal');
            if (modal) modal.style.display = 'none';
        }
    }

    renderWeeklyPlan() {
        const modal = document.getElementById('weeklyPlanModal');
        if (!modal || !this.weeklyPlan) return;
        
        const content = modal.querySelector('.modal-content');
        let html = '<h3>📅 Your Optimized Weekly Study Plan</h3>';
        html += '<p style="color: #888; font-size: 0.9em;">Plan automatically distributes workload by deadline, difficulty, and priority.</p>';
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        days.forEach(day => {
            const dayPlan = this.weeklyPlan[day] || [];
            html += `<div class="day-plan"><h4>${day}</h4>`;
            
            if (dayPlan.length === 0) {
                html += '<p style="color: #aaa;">Rest day 🎉</p>';
            } else {
                html += '<ul>';
                dayPlan.forEach(item => {
                    html += `<li>
                        <strong>${item.subject_name}</strong>
                        <span class="badge">${item.chapters} chapters</span>
                        <span class="difficulty-${item.difficulty}">${item.difficulty}</span>
                        <small>${item.recommended_duration_mins} mins</small>
                    </li>`;
                });
                html += '</ul>';
            }
            html += '</div>';
        });
        
        content.innerHTML = html;
    }

    // ============= SYNC STATUS =============
    async getSyncStatus() {
        try {
            const status = await api.getSyncStatus();
            this.updateSyncIndicator(status.status);
            return status;
        } catch (error) {
            this.updateSyncIndicator('offline');
        }
    }

    updateSyncIndicator(status) {
        let indicator = document.getElementById('syncIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'syncIndicator';
            indicator.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 8px; z-index: 9999;';
            document.body.appendChild(indicator);
        }
        
        if (status === 'synced') {
            indicator.innerHTML = '🟢 Synced';
            indicator.style.backgroundColor = '#4CAF50';
            indicator.style.color = 'white';
        } else if (status === 'offline') {
            indicator.innerHTML = '🟡 Offline';
            indicator.style.backgroundColor = '#FFC107';
            indicator.style.color = '#333';
        } else {
            indicator.innerHTML = '🔴 Failed';
            indicator.style.backgroundColor = '#f44336';
            indicator.style.color = 'white';
        }
    }
}

// Initialize
const planner = new SmartStudyPlanner();
// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Failsafe: ensure any blocking modals/overlays are hidden on load (prevents GH Pages demo freeze)
window.addEventListener('load', () => {
    try {
        document.querySelectorAll('.loading, .modal, .overlay').forEach(el => {
            // Only hide modals that are empty or look like loaders
            if (el.classList.contains('modal') || el.classList.contains('overlay') || el.classList.contains('loading')) {
                el.style.display = el.querySelector && el.querySelector('.modal-content') ? el.style.display : 'none';
            } else {
                el.style.display = 'none';
            }
        });

        // Specifically ensure weeklyPlanModal isn't left open on empty data
        const weekly = document.getElementById('weeklyPlanModal');
        if (weekly) weekly.style.display = 'none';
    } catch (e) {
        // ignore
    }
});