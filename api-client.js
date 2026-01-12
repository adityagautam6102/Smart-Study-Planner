// ============= API CLIENT FOR FRONTEND =============
// Add this to your frontend JavaScript to integrate with the Flask backend

const API_URL = 'http://localhost:5000/api'; // Change to production URL

class APIClient {
    constructor() {
        this.token = localStorage.getItem('access_token');
    }

    // ============= HEADERS HELPER =============
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(method, endpoint, data = null) {
        const options = {
            method,
            headers: this.getHeaders()
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API Error');
            }

            return result;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    // ============= AUTH ENDPOINTS =============
    async register(name, email, password) {
        const result = await this.request('POST', '/register', {
            name,
            email,
            password
        });
        if (result.access_token) {
            this.token = result.access_token;
            localStorage.setItem('access_token', this.token);
        }
        return result;
    }

    async login(email, password) {
        const result = await this.request('POST', '/login', {
            email,
            password
        });
        if (result.access_token) {
            this.token = result.access_token;
            localStorage.setItem('access_token', this.token);
        }
        return result;
    }

    async getCurrentUser() {
        return this.request('GET', '/user');
    }

    logout() {
        this.token = null;
        localStorage.removeItem('access_token');
    }

    // ============= SUBJECT ENDPOINTS =============
    async getSubjects() {
        return this.request('GET', '/subjects');
    }

    async addSubject(name, chapters, difficulty, priority, deadline) {
        return this.request('POST', '/subjects', {
            name,
            chapters,
            difficulty,
            priority,
            deadline: new Date(deadline).toISOString()
        });
    }

    async updateSubject(subjectId, data) {
        return this.request('PUT', `/subjects/${subjectId}`, data);
    }

    async deleteSubject(subjectId) {
        return this.request('DELETE', `/subjects/${subjectId}`);
    }

    // ============= GAMIFICATION ENDPOINTS =============
    async getGamification() {
        return this.request('GET', '/gamification');
    }

    async addXP(xp) {
        return this.request('POST', '/gamification/xp', { xp });
    }

    async updateStreak() {
        return this.request('POST', '/gamification/streak');
    }

    async awardBadge(badgeId) {
        return this.request('POST', '/gamification/badges', { badge_id: badgeId });
    }

    async setMode(mode) {
        return this.request('POST', '/gamification/mode', { mode });
    }

    // ============= STUDY SESSION ENDPOINTS =============
    async getSessions() {
        return this.request('GET', '/sessions');
    }

    async recordSession(subjectId, durationMinutes, pomodoroCount = 1) {
        return this.request('POST', '/sessions', {
            subject_id: subjectId,
            duration_minutes: durationMinutes,
            pomodoro_count: pomodoroCount
        });
    }

    // ============= REFLECTION ENDPOINTS =============
    async getReflections() {
        return this.request('GET', '/reflections');
    }

    async recordReflection(subjectId, reasonIdx, reasonText) {
        return this.request('POST', '/reflections', {
            subject_id: subjectId,
            reason_idx: reasonIdx,
            reason_text: reasonText
        });
    }

    // ============= ANALYTICS ENDPOINTS =============
    async getAnalyticsSummary() {
        return this.request('GET', '/analytics/summary');
    }

    async getStudyHeatmap() {
        return this.request('GET', '/analytics/heatmap');
    }

    // ============= MOOD TRACKING ENDPOINTS (API v1) =============
    async recordMood(mood, durationMinutes, effectiveness, sessionId = null) {
        return this.request('POST', '/v1/moods', {
            mood,
            duration_minutes: durationMinutes,
            effectiveness,
            session_id: sessionId
        });
    }

    async getMoods(days = 7) {
        return this.request('GET', `/v1/moods?days=${days}`);
    }

    // ============= FAILURE ANALYTICS ENDPOINTS =============
    async getFailureAnalytics(days = 30) {
        return this.request('GET', `/v1/analytics/failure?days=${days}`);
    }

    // ============= WEEKLY PLANNER ENDPOINTS =============
    async generateWeeklyPlan() {
        return this.request('POST', '/v1/planner/generate', {});
    }

    // ============= SYNC STATUS ENDPOINTS =============
    async getSyncStatus() {
        return this.request('GET', '/v1/sync/status');
    }

    async getAPIInfo() {
        return this.request('GET', '/v1/info', null);
    }
}

// Create global instance
const api = new APIClient();

// ============= INTEGRATION EXAMPLES =============

// Example: Register new user
/*
async function handleRegister(name, email, password) {
    try {
        const result = await api.register(name, email, password);
        console.log('Registration successful:', result);
        // Redirect to dashboard
        window.location.href = 'index.html';
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}
*/

// Example: Load subjects on page load
/*
async function loadSubjects() {
    try {
        const data = await api.getSubjects();
        console.log('Subjects loaded:', data.subjects);
        // Update UI with subjects
        renderSubjects(data.subjects);
    } catch (error) {
        console.error('Failed to load subjects:', error);
    }
}
*/

// Example: Record a study session
/*
async function completePomodoro(subjectId, minutes) {
    try {
        // Record session
        await api.recordSession(subjectId, minutes);
        
        // Add XP
        await api.addXP(25);
        
        // Update streak
        await api.updateStreak();
        
        // Record mood
        await api.recordMood('energetic', minutes, 5);
        
        console.log('Pomodoro recorded!');
    } catch (error) {
        console.error('Failed to record session:', error);
    }
}
*/

// Example: Update subject progress
/*
async function updateProgress(subjectId, completedChapters) {
    try {
        const result = await api.updateSubject(subjectId, {
            completed_chapters: completedChapters
        });
        console.log('Progress updated:', result.subject);
    } catch (error) {
        console.error('Failed to update progress:', error);
    }
}
*/

// Example: Get analytics
/*
async function loadAnalytics() {
    try {
        const summary = await api.getAnalyticsSummary();
        const heatmap = await api.getStudyHeatmap();
        const failureAnalytics = await api.getFailureAnalytics();
        console.log('Analytics:', { summary, heatmap, failureAnalytics });
        // Update dashboard charts with this data
    } catch (error) {
        console.error('Failed to load analytics:', error);
    }
}
*/

// Example: Generate weekly plan
/*
async function generateWeeklyPlan() {
    try {
        const plan = await api.generateWeeklyPlan();
        console.log('Weekly plan generated:', plan);
        // Display plan to user
    } catch (error) {
        console.error('Failed to generate plan:', error);
    }
}
*/

// Example: Check sync status
/*
async function checkSyncStatus() {
    try {
        const status = await api.getSyncStatus();
        console.log('Sync status:', status);
        // Update UI indicator
    } catch (error) {
        console.error('Offline or sync failed:', error);
