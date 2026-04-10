let isLogin = true;

document.addEventListener('DOMContentLoaded', () => {
    if (window.api.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById('auth-form');
    const formTitle = document.getElementById('form-title');
    const nameGroup = document.getElementById('name-group');
    const submitBtn = document.getElementById('submit-btn');
    const errorMsg = document.getElementById('error-message');
    const forgotPass = document.getElementById('forgot-pass');
    
    const btnNavSignin = document.getElementById('btn-nav-signin');
    const btnNavSignup = document.getElementById('btn-nav-signup');

    function toggleMode(mode) {
        isLogin = mode === 'login';
        if (isLogin) {
            formTitle.textContent = 'Welcome Back';
            nameGroup.style.display = 'none';
            document.getElementById('name').removeAttribute('required');
            submitBtn.textContent = 'Sign In';
            forgotPass.style.display = 'block';
            
            btnNavSignin.className = 'btn-nav btn-nav-active';
            btnNavSignup.className = 'btn-nav btn-nav-inactive';
        } else {
            formTitle.textContent = 'Create Account';
            nameGroup.style.display = 'block';
            document.getElementById('name').setAttribute('required', 'true');
            submitBtn.textContent = 'Sign Up';
            forgotPass.style.display = 'none';

            btnNavSignup.className = 'btn-nav btn-nav-active';
            btnNavSignin.className = 'btn-nav btn-nav-inactive';
        }
        errorMsg.style.display = 'none';
    }

    btnNavSignin.addEventListener('click', () => toggleMode('login'));
    btnNavSignup.addEventListener('click', () => toggleMode('signup'));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';
        submitBtn.disabled = true;
        
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Authenticating...';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            if (isLogin) {
                const res = await window.api.login(email, password);
                window.api.setToken(res.access_token);
                localStorage.setItem('smartStudyUser', JSON.stringify(res.user));
                window.location.href = 'index.html';
            } else {
                const name = document.getElementById('name').value;
                const res = await window.api.register(name, email, password);
                window.api.setToken(res.access_token);
                localStorage.setItem('smartStudyUser', JSON.stringify(res.user));
                window.location.href = 'index.html';
            }
        } catch (err) {
            errorMsg.textContent = err.message;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // --- Motivational Quotes Logic ---
    const quotes = [
        { q: "Education is the most powerful weapon which you can use to change the world.", a: "Nelson Mandela" },
        { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
        { q: "Success is the sum of small efforts, repeated day in and day out.", a: "Robert Collier" },
        { q: "The future depends on what you do today.", a: "Mahatma Gandhi" },
        { q: "Believe you can and you're halfway there.", a: "Theodore Roosevelt" }
    ];
    let quoteIndex = 0;
    const quoteDisplay = document.getElementById('quote-display');
    const quoteAuthor = document.getElementById('quote-author');
    
    // Auto-swap quotes
    setInterval(() => {
        quoteDisplay.style.opacity = 0;
        quoteAuthor.style.opacity = 0;
        setTimeout(() => {
            quoteIndex = (quoteIndex + 1) % quotes.length;
            quoteDisplay.textContent = quotes[quoteIndex].q;
            quoteAuthor.innerHTML = `— ${quotes[quoteIndex].a}`;
            quoteDisplay.style.opacity = 1;
            quoteAuthor.style.opacity = 1;
        }, 500); 
    }, 4000);

    // --- Animated Dotted Waves Background (Canvas) ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;

        function resizeCanvas() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        let waveTime = 0;
        function drawDottedWaves() {
            ctx.clearRect(0, 0, width, height);
            
            const cols = Math.floor(width / 20); 
            const rows = 20; 
            const xSpace = width / cols;
            const ySpace = 15;
            
            for(let ix = 0; ix <= cols; ix++) {
                for(let iy = 0; iy < rows; iy++) {
                    const x = ix * xSpace;
                    const z = Math.sin(ix * 0.2 + waveTime) + Math.cos(iy * 0.3 + waveTime * 0.8);
                    const baseY = height * 0.65; 
                    const yOffset = (iy * ySpace) + (z * 40); 
                    const y = baseY + yOffset;
                    const scale = (iy / rows);
                    const radius = scale * 2 + 0.5;
                    const alpha = scale * 0.6 + 0.1;

                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    // Beautiful teal-green particle dot color
                    ctx.fillStyle = `rgba(110, 231, 183, ${alpha})`;
                    ctx.fill();
                }
            }
            waveTime += 0.025; 
            requestAnimationFrame(drawDottedWaves);
        }
        drawDottedWaves();
    }
});
