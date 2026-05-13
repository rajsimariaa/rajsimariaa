// Wait for DOM to be fully ready
window.addEventListener('DOMContentLoaded', () => {
    // Register Plugins
    try {
        gsap.registerPlugin(ScrollTrigger);
    } catch (e) {
        console.warn('ScrollTrigger registration failed, retrying...');
    }

    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    // Synchronize Lenis with ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Warp State
    let isWarping = false;

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // --- Vibe Console Logger ---
    const consoleLogs = document.getElementById('console-logs');
    function vibeLog(message, type = 'default') {
        if (!consoleLogs) return;
        const log = document.createElement('div');
        log.className = `opacity-0 transition-opacity duration-300 ${type === 'command' ? 'text-white font-bold' : ''} ${type === 'error' ? 'text-red-500' : ''} ${type === 'success' ? 'text-secondary' : ''}`;
        log.innerText = message.startsWith('>') ? message : `> ${message}`;
        consoleLogs.appendChild(log);
        setTimeout(() => {
            log.classList.remove('opacity-0');
            consoleLogs.scrollTop = consoleLogs.scrollHeight;
        }, 10);
        
        if (consoleLogs.children.length > 20) {
            consoleLogs.firstElementChild.remove();
        }
    }

    vibeLog('VIBE_PROTOCOL_INITIALIZED...');
    
    // --- Terminal Controls ---
    const vibeConsole = document.getElementById('vibe-console');
    const closeBtn = document.getElementById('vibe-close');
    const minimizeBtn = document.getElementById('vibe-minimize');
    const maximizeBtn = document.getElementById('vibe-maximize');
    
    const terminalTrigger = document.getElementById('terminal-trigger');
    
    let isMinimized = false;

    if (closeBtn && vibeConsole && terminalTrigger) {
        closeBtn.addEventListener('click', () => {
            vibeLog('TERMINATING_TERMINAL...');
            gsap.to(vibeConsole, { 
                scale: 0.8, 
                opacity: 0, 
                duration: 0.5, 
                ease: 'power4.in',
                onComplete: () => {
                    vibeConsole.classList.add('hidden');
                    // Show small trigger button
                    gsap.to(terminalTrigger, { 
                        scale: 1, 
                        opacity: 1, 
                        duration: 0.5, 
                        ease: 'back.out(1.7)',
                        onStart: () => {
                            terminalTrigger.classList.remove('pointer-events-none');
                        }
                    });
                }
            });
        });

        terminalTrigger.addEventListener('click', () => {
            vibeConsole.classList.remove('hidden');
            vibeLog('RESTORING_FROM_VOID...');
            
            // Hide trigger button
            gsap.to(terminalTrigger, { 
                scale: 0, 
                opacity: 0, 
                duration: 0.3, 
                ease: 'back.in(1.7)',
                onComplete: () => {
                    terminalTrigger.classList.add('pointer-events-none');
                }
            });

            // Show terminal
            gsap.to(vibeConsole, { 
                scale: 1, 
                opacity: 1, 
                duration: 0.5, 
                ease: 'power4.out'
            });
        });
    }

    if (minimizeBtn && vibeConsole) {
        minimizeBtn.addEventListener('click', () => {
            if (!isMinimized) {
                vibeLog('MINIMIZING_TERMINAL...');
                gsap.to(vibeConsole, { 
                    height: '32px', 
                    width: '220px',
                    duration: 0.6, 
                    ease: 'expo.inOut' 
                });
                gsap.to('#console-logs', { opacity: 0, duration: 0.3 });
                isMinimized = true;
            } else {
                restoreTerminal();
            }
        });
    }

    function restoreTerminal() {
        if (!isMinimized) return;
        vibeLog('RESTORING_TERMINAL...');
        gsap.to(vibeConsole, { 
            height: '160px', 
            width: '288px', 
            duration: 0.6, 
            ease: 'expo.inOut' 
        });
        gsap.to('#console-logs', { opacity: 1, duration: 0.3, delay: 0.3 });
        isMinimized = false;
    }

    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            if (isMinimized) {
                restoreTerminal();
            } else {
                vibeLog('STAYING_AS_IS...');
            }
        });
    }

    // --- Interactive Terminal Logic ---
    const terminalInput = document.getElementById('terminal-input');
    let terminalFlow = {
        active: false,
        step: 0,
        data: {}
    };

    const flowSteps = [
        { key: 'name', prompt: 'ENTER_YOUR_NAME:' },
        { key: 'email', prompt: 'ENTER_EMAIL_ADDRESS:' },
        { key: 'phone', prompt: 'ENTER_PHONE_NUMBER:' },
        { key: 'details', prompt: 'DESCRIBE_REQUIREMENTS:' },
        { key: 'referralCode', prompt: 'REFERRAL_CODE_(OPTIONAL):' }
    ];

    if (terminalInput) {
        terminalInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const rawInput = terminalInput.value.trim();
                if (!rawInput) return;

                vibeLog(`$ ${rawInput}`, 'command');
                terminalInput.value = '';
                
                if (terminalFlow.active) {
                    await handleFlowStep(rawInput);
                } else {
                    const parts = rawInput.split(' ');
                    const baseCmd = parts[0].toLowerCase();
                    const args = parts.slice(1);
                    await processCommand(baseCmd, args, rawInput);
                }
            }
        });
    }

    async function handleFlowStep(input) {
        const currentStep = flowSteps[terminalFlow.step];
        terminalFlow.data[currentStep.key] = input;
        
        terminalFlow.step++;
        
        if (terminalFlow.step < flowSteps.length) {
            vibeLog(flowSteps[terminalFlow.step].prompt);
            terminalInput.placeholder = `Provide ${flowSteps[terminalFlow.step].key}...`;
        } else {
            vibeLog('COMPILING_TRANSMISSION...');
            await submitFinalInquiry(terminalFlow.data);
            resetTerminalFlow();
        }
    }

    function resetTerminalFlow() {
        terminalFlow = { active: false, step: 0, data: {} };
        terminalInput.placeholder = "Type 'help'...";
    }

    async function processCommand(baseCmd, args, rawInput) {
        switch (baseCmd) {
            case 'help':
                vibeLog('AVAILABLE_COMMANDS:');
                vibeLog(' - start: Begin inquiry flow');
                vibeLog(' - book: Schedule a 1:1 call');
                vibeLog(' - about: Core bio');
                vibeLog(' - work: View portfolio');
                vibeLog(' - clear: Flush console');
                break;
            case 'start':
            case 'inquiry':
                vibeLog('INITIATING_INQUIRY_PROTOCOL...');
                terminalFlow.active = true;
                terminalFlow.step = 0;
                vibeLog(flowSteps[0].prompt);
                terminalInput.placeholder = "Provide name...";
                break;
            case 'book':
            case 'meet':
            case 'schedule':
                vibeLog('OPENING_MEETING_PORTAL...');
                window.open('https://calendar.app.google/F7Qg6tBBHf3MCRBE7', '_blank');
                break;
            case 'about':
                vibeLog('RAJ SIMARIA: FREELANCE VIBE CODER.');
                break;
            case 'work':
                vibeLog('NAVIGATING_TO_WORK...');
                document.querySelector('#work').scrollIntoView({ behavior: 'smooth' });
                break;
            case 'clear':
                consoleLogs.innerHTML = '';
                vibeLog('CONSOLE_FLUSHED');
                break;
            default:
                vibeLog(`UNKNOWN_COMMAND: ${baseCmd}`, 'error');
                vibeLog("TYPE 'start' TO BEGIN INQUIRY");
        }
    }

    async function submitFinalInquiry(data) {
        vibeLog('SENDING_TO_VAULT...');
        const formData = {
            ...data,
            countryCode: '', // Captured in phone usually in terminal
            date: new Date().toISOString(),
            id: Date.now(),
            source: 'terminal_flow'
        };

        try {
            if (window.db) {
                await window.db.collection('enquiries').add(formData);
                vibeLog('TRANSMISSION_COMPLETE', 'success');
                vibeLog('SYSTEM_IDLE');
            } else {
                const vault = JSON.parse(localStorage.getItem('vibe_vault') || '[]');
                vault.push(formData);
                localStorage.setItem('vibe_vault', JSON.stringify(vault));
                vibeLog('LOCAL_SYNC_COMPLETE', 'success');
            }
        } catch (e) {
            vibeLog('TRANSMISSION_FAILED', 'error');
        }
    }

    // --- Smooth Section Transitions (Vibe Warp) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target && !isWarping) {
                isWarping = true;
                vibeLog(`INITIATING_WARP: ${targetId.toUpperCase()}`);
                
                gsap.to('main', { filter: 'blur(10px)', opacity: 0.3, duration: 0.5 });
                lenis.scrollTo(target, {
                    offset: 0,
                    duration: 2.5,
                    easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
                    onComplete: () => {
                        // Safety: Ensure main is restored even if scroll ends abruptly
                        gsap.to('main', { filter: 'blur(0px)', opacity: 1, duration: 0.8, ease: 'power2.out' });
                        vibeLog(`WARP_COMPLETE: ${targetId.toUpperCase()}`);
                        isWarping = false;
                        ScrollTrigger.refresh();
                    }
                });
            }
        });
    });

    // Hero Effects
    gsap.to('#hero-title', {
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
        y: 150, scale: 0.9, opacity: 0, ease: 'none'
    });

    gsap.to('.border-text', {
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
        x: 100, ease: 'none'
    });

    // Scrollspy
    const sections = ['hero', 'expertise', 'work', 'contact'];
    sections.forEach(id => {
        ScrollTrigger.create({
            trigger: `#${id}`, start: 'top 20%', end: 'bottom 20%',
            onEnter: () => updateNav(id), onEnterBack: () => updateNav(id),
        });
    });

    function updateNav(id) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('text-primary', 'active-link');
            if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('text-primary', 'active-link');
            }
        });
    }
    updateNav('hero');
    vibeLog('SCROLL_PROTOCOL: SYNCED');

    // --- Custom Cursor ---
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    if (cursor && follower) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1 });
            gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3 });
        });
        document.querySelectorAll('a, button, .expertise-card, .work-item').forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursor, { scale: 4, duration: 0.3 });
                gsap.to(follower, { scale: 1.5, duration: 0.3 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursor, { scale: 1, duration: 0.3 });
                gsap.to(follower, { scale: 1, duration: 0.3 });
            });
        });
    }

    // --- Robotic Welcome Voice Optimization ---
    let vibeSpoken = false;
    let vibeUtterance = new SpeechSynthesisUtterance("WELCOME. INITIALIZING VIBE PROTOCOL.");
    vibeUtterance.pitch = 0.1;
    vibeUtterance.rate = 0.85;
    vibeUtterance.volume = 1;

    // Pre-load voices as soon as possible
    function loadVoices() {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            vibeUtterance.voice = voices.find(v => v.name.includes('Google UK English Male')) || 
                           voices.find(v => v.lang.includes('en')) || 
                           voices[0];
        }
    }

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();

    // Immediate click feedback using Web Audio API (no lag)
    function playClickSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.warn('Web Audio click failed', e);
        }
    }

    function speakVibeInit() {
        if (vibeSpoken) return;
        
        playClickSound(); // Instant feedback

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        vibeSpoken = true;
        
        // Ensure voice is set
        if (!vibeUtterance.voice) loadVoices();
        
        window.speechSynthesis.speak(vibeUtterance);

        // Clean up document listeners
        document.removeEventListener('click', speakVibeInit);
        document.removeEventListener('keydown', speakVibeInit);
    }

    // --- Cinematic Preloader Logic ---
    const bootTrigger = document.getElementById('boot-trigger');
    const loadingSequence = document.getElementById('loading-sequence');
    const loadBar = document.getElementById('load-bar');
    const loadPercent = document.getElementById('load-percent');
    const loadDetails = document.getElementById('load-details');
    const tl = gsap.timeline({ paused: true });

    if (bootTrigger) {
        bootTrigger.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent multiple triggers
            speakVibeInit(); // Play audio on click
            
            bootTrigger.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                bootTrigger.classList.add('hidden');
                loadingSequence.classList.remove('hidden');
                startLoading();
            }, 300);
        });
    }

    function startLoading() {
        let progress = 0;
        const details = [
            'LOAD_SYSTEM_CORE...',
            'SYNC_VIBE_PROTOCOL...',
            'MOUNT_3D_ASSETS...',
            'INIT_GSAP_ENGINE...',
            'STABILIZING_INTERFACE...',
            'READY_FOR_DEPLOYMENT'
        ];

        const interval = setInterval(() => {
            progress += Math.random() * 3;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                finishLoading();
            }
            
            if (loadBar) loadBar.style.width = `${progress}%`;
            if (loadPercent) loadPercent.innerText = `${Math.floor(progress)}%`;
            
            if (Math.random() > 0.8 && loadDetails) {
                loadDetails.innerText = details[Math.floor(Math.random() * details.length)];
            }
        }, 40);
    }

    function finishLoading() {
        setTimeout(() => {
            const splash = document.getElementById('vibe-splash');
            if (splash) {
                splash.classList.add('opacity-0', 'pointer-events-none');
                setTimeout(() => splash.remove(), 1000);
            }
            tl.play(); // Play hero animation
            vibeLog('SYSTEM_BOOT_SEQUENCE: SUCCESS');
        }, 500);
    }
    tl.to('#hero-tagline span', { 
        y: 0, 
        duration: 1, 
        ease: 'power4.out', 
        delay: 0.5
    })
      .from('#hero-title', { opacity: 0, y: 100, duration: 1.5, ease: 'power4.out' }, '-=0.5')
      .from('#hero-desc', { opacity: 0, y: 30, duration: 1, ease: 'power4.out' }, '-=1')
      .from('#hero-cta', { opacity: 0, y: 30, duration: 1, ease: 'power4.out' }, '-=0.8')
      .add(() => {
          ScrollTrigger.refresh();
          vibeLog('SCROLL_ENGINE: OPTIMIZED');
      });

    // --- Expertise Cards Reveal ---
    const techCards = document.querySelectorAll('.expertise-card');
    if (techCards && techCards.length > 0) {
        gsap.set(techCards, { opacity: 0, y: 50 });
        
        ScrollTrigger.create({
            trigger: '#expertise',
            start: 'top 85%',
            onEnter: () => {
                gsap.to(techCards, {
                    opacity: 1,
                    y: 0,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: 'power2.out',
                    overwrite: true
                });
                vibeLog('STACK_VISIBLE');
            },
            onLeaveBack: () => {
                gsap.to(techCards, { opacity: 0, y: 50, duration: 0.5, overwrite: true });
            }
        });

        // Fail-safe visibility
        setTimeout(() => {
            techCards.forEach(card => {
                if (window.getComputedStyle(card).opacity === "0") {
                    gsap.to(card, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' });
                }
            });
        }, 3000);
    }

    // --- Work Items Animations ---
    const workItems = document.querySelectorAll('.work-item');
    if (workItems && workItems.length > 0) {
        workItems.forEach((item, index) => {
            const depth = parseFloat(item.getAttribute('data-parallax')) || 0.1;
            
            // Reveal animation
            gsap.from(item, {
                scrollTrigger: {
                    trigger: item,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                },
                opacity: 0,
                y: 100,
                duration: 1.5,
                ease: 'power4.out',
                onStart: () => vibeLog(`WORK_ITEM_${index + 1}_SYNCED`)
            });

            // Parallax effect
            gsap.to(item, {
                scrollTrigger: { 
                    trigger: item, 
                    start: 'top bottom', 
                    end: 'bottom top', 
                    scrub: true 
                },
                y: depth * 150, 
                ease: 'none'
            });
        });
    }

    // Titles
    document.querySelectorAll('h2').forEach(heading => {
        gsap.from(heading, {
            scrollTrigger: { trigger: heading, start: 'top 90%' },
            opacity: 0, x: -50, duration: 1.5, ease: 'power4.out'
        });
    });

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    let isMenuOpen = false;

    function toggleMenu() {
        if (!menuToggle || !mobileMenu) return;
        isMenuOpen = !isMenuOpen;
        vibeLog(isMenuOpen ? 'OPENING_MENU' : 'CLOSING_MENU');
        mobileMenu.classList.toggle('menu-active');
        mobileMenu.classList.toggle('pointer-events-none');
        mobileMenu.classList.toggle('pointer-events-auto');
        if (isMenuOpen) {
            gsap.to(menuToggle.children[0], { rotate: 45, y: 8, duration: 0.3 });
            gsap.to(menuToggle.children[1], { rotate: -45, y: -2, width: '2rem', duration: 0.3 });
            lenis.stop();
        } else {
            gsap.to(menuToggle.children[0], { rotate: 0, y: 0, duration: 0.3 });
            gsap.to(menuToggle.children[1], { rotate: 0, y: 0, width: '1.25rem', duration: 0.3 });
            lenis.start();
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
    }

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            toggleMenu();
            const target = document.querySelector(targetId);
            if (target) {
                lenis.scrollTo(target, { duration: 2.5, easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) });
            }
        });
    });

    // Secret Admin
    let logoClicks = 0;
    const logo = document.getElementById('nav-logo');
    if (logo) {
        logo.addEventListener('click', () => {
            logoClicks++;
            vibeLog(`LOGO_PROTOCOL_STEP_${logoClicks}`);
            if (logoClicks >= 5) {
                vibeLog('ADMIN_OVERRIDE_ACTIVATED');
                setTimeout(() => window.location.href = 'admin.html', 500);
            }
        });
        logo.addEventListener('mousemove', (e) => {
            const bound = logo.getBoundingClientRect();
            const x = e.clientX - bound.left - bound.width / 2;
            const y = e.clientY - bound.top - bound.height / 2;
            gsap.to(logo, { x: x * 0.3, y: y * 0.3, duration: 0.3, ease: 'power2.out' });
        });
        logo.addEventListener('mouseleave', () => {
            gsap.to(logo, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
        });
    }

    // Expose resetForm to global scope
    window.resetForm = () => {
        document.getElementById('success-msg').classList.add('opacity-0', 'pointer-events-none');
        vibeLog('PREPARING_NEW_TRANSMISSION');
    };

    // Enquiry Form
    const enquiryForm = document.getElementById('enquiry-form');
    if (enquiryForm) {
        enquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('form-name').value,
                email: document.getElementById('form-email').value,
                countryCode: document.getElementById('form-country-code').value,
                phone: document.getElementById('form-phone').value,
                details: document.getElementById('form-details').value,
                referralCode: document.getElementById('form-referral').value.trim().toUpperCase() || null,
                date: new Date().toISOString()
            };

            document.getElementById('submit-loader').classList.remove('hidden');
            vibeLog('TRANSMITTING_DATA...');

            try {
                // Try to save to Firestore if initialized
                if (window.db) {
                    await window.db.collection('enquiries').add(formData);
                    vibeLog('FIRESTORE_SYNC: SUCCESS');
                } else {
                    // Fallback to LocalStorage
                    const vault = JSON.parse(localStorage.getItem('vibe_vault') || '[]');
                    vault.push(formData);
                    localStorage.setItem('vibe_vault', JSON.stringify(vault));
                    vibeLog('LOCAL_VAULT_SYNC: SUCCESS');
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                document.getElementById('submit-loader').classList.add('hidden');
                document.getElementById('success-msg').classList.remove('opacity-0', 'pointer-events-none');
                vibeLog('TRANSMISSION_COMPLETE');
                enquiryForm.reset();
            } catch (error) {
                console.error("Transmission Error:", error);
                vibeLog('TRANSMISSION_FAILED');
                alert('CRITICAL_ERROR: DATA_LOST_IN_VOID');
                document.getElementById('submit-loader').classList.add('hidden');
            }
        });
    }

    document.addEventListener('click', speakVibeInit);
    document.addEventListener('keydown', speakVibeInit);

    // --- Isometric Dot Grid Background ---
    function initDotGrid() {
        const canvas = document.getElementById('dot-grid-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        let dots = [];
        const spacing = 45;
        const baseDotSize = 1.2;
        
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createGrid();
        }
        
        function createGrid() {
            dots = [];
            const rows = Math.ceil(canvas.height / spacing) + 1;
            const cols = Math.ceil(canvas.width / spacing) + 1;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const xOffset = r % 2 === 0 ? 0 : spacing / 2;
                    dots.push({
                        x: c * spacing + xOffset,
                        y: r * spacing,
                        opacity: 0.1,
                        size: baseDotSize
                    });
                }
            }
        }
        
        let mouse = { x: -2000, y: -2000 };
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        });

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            dots.forEach(dot => {
                const dx = mouse.x - dot.x;
                const dy = mouse.y - dot.y;
                const distSq = dx * dx + dy * dy;
                const maxDistSq = 150 * 150;
                
                if (distSq < maxDistSq) {
                    const dist = Math.sqrt(distSq);
                    const force = (150 - dist) / 150;
                    dot.opacity = 0.3 + (force * 0.7);
                    dot.size = baseDotSize + (force * 2.5);
                    ctx.fillStyle = `rgba(0, 242, 255, ${dot.opacity})`;
                } else {
                    dot.opacity += (0.2 - dot.opacity) * 0.05;
                    dot.size += (baseDotSize - dot.size) * 0.05;
                    ctx.fillStyle = `rgba(150, 150, 150, ${dot.opacity})`;
                }
                
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        }
        
        window.addEventListener('resize', resize);
        resize();
        animate();
    }

    initDotGrid();

    // Final Engine Refresh
    ScrollTrigger.refresh();
    vibeLog('VIBE_PROTOCOL: FULLY_SYNCED');
});

