document.addEventListener('DOMContentLoaded', async () => {
    if (!window.api.getToken()) { window.location.href = 'login.html'; return; }

    const state = { subjects: [], gamification: null, timer: null, timeLeft: 25*60, isRunning: false };

    // -- 1. Universal Navigation Logic --
    // Syncs both Top Nav (Desktop) and Bottom Nav (Mobile)
    const navItems = document.querySelectorAll('.nav-pill[data-target], .nav-item[data-target]');
    const views = document.querySelectorAll('.view-section');

    function switchView(target) {
        navItems.forEach(item => {
            if (item.getAttribute('data-target') === target) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        views.forEach(v => v.classList.remove('active-view'));
        const targetView = document.getElementById(`view-${target}`);
        if (targetView) targetView.classList.add('active-view');
        
        if(target === 'analytics') renderChart();
        
        // Scroll to top when switching views on mobile
        window.scrollTo(0, 0);
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            if (target) switchView(target);
        });
    });

    document.getElementById('btn-dashboard-pomo').addEventListener('click', () => {
        switchView('focus');
    });

    // Theme logic
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const h = document.documentElement;
        if(h.getAttribute('data-theme') === 'light') { h.setAttribute('data-theme', 'dark'); }
        else { h.setAttribute('data-theme', 'light'); }
    });

    // Logout handling
    const handleLogout = () => { if(confirm('Are you sure you want to logout?')) { window.api.clearToken(); window.location.href='login.html'; } };
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    document.getElementById('btn-logout-mobile').addEventListener('click', handleLogout);

    // -- 2. Data Loading --
    async function loadData() {
        try {
            const [gami, subjs] = await Promise.all([window.api.getGamification(), window.api.getSubjects()]);
            state.gamification = gami; state.subjects = subjs;
            
            document.getElementById('hdr-level').textContent = gami.level;
            document.getElementById('hdr-xp').textContent = gami.xp;
            document.getElementById('hdr-streak').textContent = gami.streak;

            const tSubj = document.getElementById('timer-subject');
            tSubj.innerHTML = '<option value="">No Subject Associated</option>' + subjs.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            
            renderSubjects();
            updateRecommendation();
            populateBottomRowCards();
        } catch(err) { console.error("Data load error", err); }
    }

    // Add subject form
    document.getElementById('form-add-subject').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await window.api.addSubject({
                name: document.getElementById('sub-name').value, chapters: parseInt(document.getElementById('sub-chapters').value),
                difficulty: document.getElementById('sub-diff').value, priority: document.getElementById('sub-prio').value
            });
            document.getElementById('form-add-subject').reset();
            loadData(); 
        } catch(err) { alert(err.message); }
    });

    function renderSubjects() {
        const list = document.getElementById('subjects-list');
        const planList = document.getElementById('daily-plan-list');
        if(!state.subjects.length) {
            list.innerHTML = "No subjects. Add some!"; planList.innerHTML = "Nothing planned!"; return;
        }

        let htmlStr = '', planHtml = '';
        state.subjects.forEach(s => {
            const pct = s.chapters > 0 ? Math.round((s.completed_chapters / s.chapters)*100) : 0;
            htmlStr += `<div style="border-bottom:1px solid var(--border-color); padding:1rem 0;">
                <div style="display:flex; justify-content:space-between; font-weight:600; color:var(--text-main); font-size:1.1rem; margin-bottom:0.4rem;">${s.name} <span style="font-weight:700; color:var(--primary);">${pct}%</span></div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">Prio: ${s.priority} | Diff: ${s.difficulty}</div>
                <div style="width:100%; height:6px; background:var(--surface-alt); border-radius:3px; overflow:hidden;"><div style="width:${pct}%; height:100%; background:var(--primary); border-radius:3px; transition: width 0.5s ease;"></div></div>
            </div>`;
            if (s.priority === 'high' || (pct < 100 && s.priority === 'medium')) {
                 planHtml += `<div style="padding:0.75rem; background:rgba(0,0,0,0.3); border-radius:10px; margin-bottom:0.75rem; border:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                    <div><strong>${s.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">Suggested: 2 Pomodoros</span></div>
                    <span>🔥</span>
                 </div>`;
            }
        });
        list.innerHTML = htmlStr; planList.innerHTML = planHtml || "All caught up!";
    }

    function updateRecommendation() {
        const c = document.getElementById('main-rec-content');
        if(!state.subjects.length) return;
        let b = state.subjects.sort((x,y) => (x.priority==='high'?1:0) > (y.priority==='high'?1:0) ? -1 : 1)[0];
        c.innerHTML = `Study <span style="font-size:1.5rem; color:var(--primary); font-weight:800;">${b.name}</span><br><span style="font-size:0.9rem; opacity:0.8;">Your top priority algorithm pick!</span>`;
    }

    function populateBottomRowCards() {
        document.getElementById('prog-content').innerHTML = `Currently tracking ${state.subjects.length} subjects natively.`;
        document.getElementById('prio-content').innerHTML = "Mix is optimally balanced by AI.";
        document.getElementById('time-content').innerHTML = `Total Time logged: ${state.gamification?.total_minutes_studied || 0} mins.`;
    }

    // -- 3. Pomodoro Timer Logic --
    function fmtT(s) { let m=Math.floor(s/60).toString().padStart(2,'0'), r=(s%60).toString().padStart(2,'0'); return `${m}:${r}`; }
    const tDisp = document.getElementById('timer-display');
    
    document.getElementById('btn-timer-start').addEventListener('click', (e) => {
        if(!state.isRunning) {
            state.isRunning = true;
            e.target.textContent = 'Pause';
            state.timer = setInterval(() => {
                if(state.timeLeft > 0) { state.timeLeft--; tDisp.textContent = fmtT(state.timeLeft); }
                else { clearInterval(state.timer); state.isRunning = false; e.target.textContent = 'Start'; alert("Session done!"); state.timeLeft=25*60; tDisp.textContent=fmtT(state.timeLeft); loadData(); }
            }, 1000);
        } else {
            clearInterval(state.timer); state.isRunning = false; e.target.textContent = 'Resume';
        }
    });

    document.getElementById('btn-timer-reset').addEventListener('click', () => {
        clearInterval(state.timer); state.isRunning = false; state.timeLeft = 25*60;
        tDisp.textContent = fmtT(state.timeLeft); document.getElementById('btn-timer-start').textContent = 'Start';
    });

    // -- 4. Chat View Logic --
    const cHist = document.getElementById('chat-history');
    document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const inp = document.getElementById('chat-input');
        const t = inp.value.trim(); if(!t) return;
        
        cHist.innerHTML += `<div style="background:var(--primary); color:#000; padding:0.8rem; border-radius:12px; align-self:flex-end; max-width:85%; margin-left:auto;">${t}</div>`;
        inp.value = '';
        setTimeout(() => {
           let r = "I'm your AI Study Assistant. I can help you manage your focus sessions and recommend subjects based on your progress.";
           if(t.toLowerCase().includes('recommend')) r = "I've analyzed your progress. Check the dashboard for your top priority pick!";
           if(t.toLowerCase().includes('plan')) r = "Click 'Generate Weekly Plan' on the dashboard to see your full schedule.";
           if(t.toLowerCase().includes('timer')) { switchView('focus'); return;}
           cHist.innerHTML += `<div style="background:var(--surface-alt); padding:1rem; border-radius:12px; max-width:85%; line-height:1.4;">${r}</div>`;
           cHist.scrollTop = cHist.scrollHeight;
        }, 500);
    });

    // -- 5. Analytics (Chart.js) --
    let chartInstance = null;
    async function renderChart() {
        if(!state.gamification) return;
        const ctx = document.getElementById('progressChart');
        if(!ctx) return;
        if(chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: { 
                labels: ['Level', 'XP', 'Minutes'], 
                datasets: [{ 
                    label:'My Progress', 
                    data:[state.gamification.level, state.gamification.xp, state.gamification.total_minutes_studied], 
                    backgroundColor: '#10B981', 
                    borderRadius: 8,
                    borderSkipped: false
                }] 
            },
            options: { 
                responsive:true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero:true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#A7F3D0' } },
                    x: { grid: { display: false }, ticks: { color: '#A7F3D0' } }
                } 
            }
        });
    }

    // -- 6. Music Widget (Direct Link Implementation) --
    document.getElementById('min-music').addEventListener('click', (e) => {
        const l = document.getElementById('music-list');
        l.classList.toggle('hidden');
        e.target.textContent = l.classList.contains('hidden') ? '□' : '_';
    });

    const trackLabel = document.getElementById('current-track');

    function updateTrackUI(btn) {
        document.querySelectorAll('.music-btn').forEach(b => b.classList.remove('active-track'));
        if (btn) {
            btn.classList.add('active-track');
            const title = btn.textContent.replace(/[^\x00-\x7F]/g, "").trim();
            trackLabel.textContent = `Opened: ${title || btn.textContent}`;
        }
    }

    document.querySelectorAll('.music-btn[data-yt]').forEach(btn => {
        btn.addEventListener('click', () => {
            const videoId = btn.getAttribute('data-yt');
            updateTrackUI(btn);
            // Open YouTube in a new tab for guaranteed playback
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
        });
    });

    // -- 7. Animated Dotted Waves Background (Canvas) --
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;

        function resizeCanvas() {
            // Fix for high-DPI screens
            const dpr = window.devicePixelRatio || 1;
            width = canvas.width = window.innerWidth * dpr;
            height = canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        let waveTime = 0;
        function drawDottedWaves() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            ctx.clearRect(0, 0, w, h);
            
            const cols = Math.floor(w / 30); 
            const rows = 15; 
            const xSpace = w / cols;
            const ySpace = 20;
            
            for(let ix = 0; ix <= cols; ix++) {
                for(let iy = 0; iy < rows; iy++) {
                    const x = ix * xSpace;
                    const z = Math.sin(ix * 0.3 + waveTime) + Math.cos(iy * 0.4 + waveTime * 0.6);
                    const baseY = h * 0.6; 
                    const yOffset = (iy * ySpace) + (z * 30); 
                    const y = baseY + yOffset;
                    
                    const scale = (iy / rows);
                    const radius = scale * 2 + 0.5;
                    const alpha = scale * 0.5 + 0.05;

                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
                    ctx.fill();
                }
            }
            
            waveTime += 0.02; 
            requestAnimationFrame(drawDottedWaves);
        }
        drawDottedWaves();
    }

    loadData();
});
