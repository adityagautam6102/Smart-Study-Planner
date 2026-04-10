class ApiClient {
    constructor() {
        this.baseUrl = 'https://smart-study-planner-backend-znh9.onrender.com/api';
    }

    getToken() {
        return localStorage.getItem('smartStudyToken');
    }

    setToken(token) {
        localStorage.setItem('smartStudyToken', token);
    }

    clearToken() {
        localStorage.removeItem('smartStudyToken');
        localStorage.removeItem('smartStudyUser');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401) {
                    this.clearToken();
                    window.location.href = 'login.html';
                }
                throw new Error(data.error || 'API Request Failed');
            }
            return data;
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        }
    }

    async login(email, password) {
        return this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(name, email, password) {
        return this.request('/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
    }

    async getGamification() {
        return this.request('/gamification');
    }

    async getSubjects() {
        return this.request('/subjects');
    }

    async addSubject(subjectData) {
        return this.request('/subjects', {
            method: 'POST',
            body: JSON.stringify(subjectData)
        });
    }

    async getAnalytics() {
        return this.request('/analytics/summary');
    }

    async recordSession(sessionData) {
        return this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    }
}

window.api = new ApiClient();
