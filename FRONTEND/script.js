document.addEventListener('DOMContentLoaded', async () => {
    if (!window.api.getToken()) { window.location.href = 'login.html'; return; }

    const state = { subjects: [], gamification: null, timer: null, timeLeft: 25*60, isRunning: false };

    // -- 1. Nav Pills Logic --
    const pills = document.querySelectorAll('.nav-pill[data-target]');
    const views = document.querySelectorAll('.view-section');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            views.forEach(v => v.classList.remove('active-view'));
            
            const target = pill.getAttribute('data-target');
            document.getElementById(`view-${target}`).classList.add('active-view');
            
            if(target === 'analytics') renderChart();
        });
    });

    document.getElementById('btn-dashboard-pomo').addEventListener('click', () => {
        document.querySelector('.nav-pill[data-target="focus"]').click();
    });

    // Theme logic
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const h = document.documentElement;
        if(h.getAttribute('data-theme') === 'light') { h.setAttribute('data-theme', 'dark'); }
        else { h.setAttribute('data-theme', 'light'); }
    });
    document.getElementById('btn-logout').addEventListener('click', () => { window.api.clearToken(); window.location.href='login.html'; });

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
            htmlStr += `<div style="border-bottom:1px solid var(--border-color); padding:0.75rem 0;">
                <div style="display:flex; justify-content:space-between; font-weight:600; color:var(--text-main);">${s.name} <span style="font-weight:400; color:var(--primary);">${pct}%</span></div>
                <div style="font-size:0.75rem; color:var(--text-muted);">Prio: ${s.priority} | Diff: ${s.difficulty}</div>
                <div style="width:100%; height:4px; background:var(--surface-alt); border-radius:2px; margin-top:4px;"><div style="width:${pct}%; height:100%; background:var(--primary); border-radius:2px;"></div></div>
            </div>`;
            if (s.priority === 'high' || (pct < 100 && s.priority === 'medium')) {
                 planHtml += `<div style="padding:0.5rem; background:rgba(0,0,0,0.3); border-radius:6px; margin-bottom:0.5rem; border:1px solid var(--border-color);"><strong>${s.name}</strong><br><span style="font-size:0.75rem; color:var(--text-muted);">Suggested: 2 Pomodoros</span></div>`;
            }
        });
        list.innerHTML = htmlStr; planList.innerHTML = planHtml || "All caught up!";
    }

    function updateRecommendation() {
        const c = document.getElementById('main-rec-content');
        if(!state.subjects.length) return;
        let b = state.subjects.sort((x,y) => (x.priority==='high'?1:0) > (y.priority==='high'?1:0) ? -1 : 1)[0];
        c.innerHTML = `<span style="font-size:1.5rem; color:var(--primary); font-weight:700;">${b.name}</span><br><span style="font-size:0.875rem;">Your top priority algorithm pick!</span>`;
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
        
        cHist.innerHTML += `<div style="background:var(--primary); color:#000; padding:0.8rem; border-radius:8px; align-self:flex-end; max-width:80%; margin-left:auto;">${t}</div>`;
        inp.value = '';
        setTimeout(() => {
           let r = "I'm a simple AI placeholder. Click focus timer to study!";
           if(t.toLowerCase().includes('recommend')) r = "Check the dashboard for your top pick!";
           if(t.toLowerCase().includes('plan')) r = "Click 'Generate Weekly Plan' on dashboard.";
           if(t.toLowerCase().includes('timer')) { document.querySelector('.nav-pill[data-target="focus"]').click(); return;}
           cHist.innerHTML += `<div style="background:var(--surface-alt); padding:0.8rem; border-radius:8px; max-width:80%;">${r}</div>`;
           cHist.scrollTop = cHist.scrollHeight;
        }, 500);
    });

    // -- 5. Analytics (Chart.js) --
    let chartInstance = null;
    async function renderChart() {
        if(!state.gamification) return;
        const ctx = document.getElementById('progressChart');
        if(chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels: ['Level', 'XP', 'Studied (m)'], datasets: [{ label:'Metrics', data:[state.gamification.level, state.gamification.xp, state.gamification.total_minutes_studied], backgroundColor: '#10B981', borderRadius: 4}] },
            options: { responsive:true, maintainAspectRatio: false, scales: { y: { beginAtZero:true } } }
        });
    }

    // -- 6. Music Widget (Youtube Player) --
    document.getElementById('min-music').addEventListener('click', (e) => {
        const l = document.getElementById('music-list');
        l.classList.toggle('hidden');
        e.target.textContent = l.classList.contains('hidden') ? '□' : '_';
    });

    // We expose global callback for youtube api
    let player;
    window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player('yt-player', { height: '0', width: '0', videoId: '', playerVars: { 'autoplay': 1, 'controls': 0 } });
    }
    
    document.querySelectorAll('.music-btn[data-yt]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.music-btn').forEach(b=>b.classList.remove('active-track'));
            btn.classList.add('active-track');
            if(player && player.loadVideoById) player.loadVideoById(btn.getAttribute('data-yt'));
        });
    });
    document.getElementById('stop-music').addEventListener('click', () => {
         document.querySelectorAll('.music-btn').forEach(b=>b.classList.remove('active-track'));
         if(player && player.stopVideo) player.stopVideo();
    });

    // -- 7. Animated Dotted Waves Background (Canvas) --
    // We recreate a 3D-like undulating grid of dots directly on canvas
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;

        function resizeCanvas() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        let waveTime = 0;
        function drawDottedWaves() {
            ctx.clearRect(0, 0, width, height);
            
            // Adjust grid resolution relative to screen size
            const cols = Math.floor(width / 20); 
            const rows = 18; 
            const xSpace = width / cols;
            const ySpace = 18;
            
            for(let ix = 0; ix <= cols; ix++) {
                for(let iy = 0; iy < rows; iy++) {
                    const x = ix * xSpace;
                    
                    // Complex sine wave interaction to create 3D ripple/twisting look
                    const z = Math.sin(ix * 0.2 + waveTime) + Math.cos(iy * 0.3 + waveTime * 0.8);
                    
                    // Project grid into 2D view (lower half of screen)
                    const baseY = height * 0.55; 
                    
                    // Map depth (z) to Y offset 
                    const yOffset = (iy * ySpace) + (z * 35); 
                    const y = baseY + yOffset;
                    
                    // Dots closer (higher iy) are larger
                    const scale = (iy / rows);
                    const radius = scale * 2.5 + 0.5;
                    
                    // Closer dots are more opaque
                    const alpha = scale * 0.7 + 0.1;

                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    // Match the green primary color theme dynamically
                    ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
                    ctx.fill();
                }
            }
            
            waveTime += 0.03; // Animation speed
            requestAnimationFrame(drawDottedWaves);
        }
        drawDottedWaves();
    }

    loadData();
});
