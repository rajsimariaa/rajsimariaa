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
    lenis.stop(); // Stop scroll initially
    document.body.classList.add('no-scroll'); // Lock native scroll

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

    // --- Referral Logic ---
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const affId = urlParams.get('aff');

    if (refCode) {
        sessionStorage.setItem('active_referral', refCode.toUpperCase());
        vibeLog(`REFERRAL_CODE_DETECTED: ${refCode.toUpperCase()}`);
    }
    if (affId) {
        sessionStorage.setItem('active_affiliate_id', affId);
        vibeLog(`DIRECT_AFFILIATE_LINK_ACTIVE`);
    }

    if (refCode || affId) {
        // Clean URL to keep it pretty
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    const activeRef = sessionStorage.getItem('active_referral');
    if (activeRef) {
        const referralInput = document.getElementById('form-referral');
        if (referralInput) referralInput.value = activeRef;
    }
    
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
        type: 'inquiry', // 'inquiry' or 'faq'
        step: 0,
        data: {}
    };

    const inquirySteps = [
        { key: 'name', prompt: 'ENTER_YOUR_NAME:' },
        { key: 'email', prompt: 'ENTER_EMAIL_ADDRESS:' },
        { key: 'phone', prompt: 'ENTER_PHONE_NUMBER:' },
        { key: 'budget', prompt: 'ENTER_ESTIMATED_BUDGET (INR, e.g. 50000):' },
        { key: 'details', prompt: 'DESCRIBE_REQUIREMENTS:' },
        { key: 'referralCode', prompt: 'REFERRAL_CODE_(OPTIONAL):' }
    ];

    const faqSteps = [
        { key: 'askedByName', prompt: 'ENTER_YOUR_NAME (OPTIONAL):' },
        { key: 'question', prompt: 'ENTER_YOUR_QUESTION:' }
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
        const steps = terminalFlow.type === 'faq' ? faqSteps : inquirySteps;
        const currentStep = steps[terminalFlow.step];
        terminalFlow.data[currentStep.key] = input;
        
        terminalFlow.step++;
        
        if (terminalFlow.step < steps.length) {
            // Skip referral step if already auto-filled
            if (terminalFlow.type === 'inquiry' && steps[terminalFlow.step].key === 'referralCode' && terminalFlow.data.referralCode) {
                vibeLog(`CONFIRMING_REFERRAL: ${terminalFlow.data.referralCode}`);
                await handleFlowStep(terminalFlow.data.referralCode);
                return;
            }
            vibeLog(steps[terminalFlow.step].prompt);
            terminalInput.placeholder = `Provide ${steps[terminalFlow.step].key}...`;
        } else {
            if (terminalFlow.type === 'faq') {
                vibeLog('TRANSMITTING_QUESTION...');
                await submitFAQFromTerminal(terminalFlow.data);
            } else {
                vibeLog('COMPILING_TRANSMISSION...');
                await submitFinalInquiry(terminalFlow.data);
            }
            resetTerminalFlow();
        }
    }

    function resetTerminalFlow() {
        terminalFlow = { active: false, type: 'inquiry', step: 0, data: {} };
        terminalInput.placeholder = "Type 'help'...";
    }

    async function processCommand(baseCmd, args, rawInput) {
        switch (baseCmd) {
            case 'help':
                vibeLog('AVAILABLE_COMMANDS:');
                vibeLog(' - start: Begin inquiry flow');
                vibeLog(' - faq: View knowledge base FAQs');
                vibeLog(' - ask: Submit a new FAQ question');
                vibeLog(' - book: Schedule a 1:1 call');
                vibeLog(' - about: Core bio');
                vibeLog(' - work: View portfolio');
                vibeLog(' - instagram: My social profile');
                vibeLog(' - clear: Flush console');
                break;
            case 'start':
            case 'inquiry':
                vibeLog('INITIATING_INQUIRY_PROTOCOL...');
                terminalFlow.active = true;
                terminalFlow.type = 'inquiry';
                terminalFlow.step = 0;
                
                // Pre-fill referral if available
                const storedRef = sessionStorage.getItem('active_referral');
                const storedAffId = sessionStorage.getItem('active_affiliate_id');

                if (storedRef) {
                    terminalFlow.data.referralCode = storedRef;
                    vibeLog(`APPLYING_STORED_REFERRAL: ${storedRef}`);
                }
                if (storedAffId) {
                    terminalFlow.data.affiliateId = storedAffId;
                    vibeLog(`DIRECT_AFFILIATE_ID_ATTACHED`);
                }

                vibeLog(inquirySteps[0].prompt);
                terminalInput.placeholder = "Provide name...";
                break;
            case 'faq':
                vibeLog('SYSTEM_KNOWLEDGE_BASE (FAQs):');
                const faqsToPrint = window.loadedFAQs || DEFAULT_FAQS;
                faqsToPrint.forEach((f, idx) => {
                    vibeLog(`Q${idx + 1}: ${f.question}`);
                    vibeLog(`A: ${f.answer}`);
                    vibeLog('---------------------------');
                });
                vibeLog("TYPE 'ask' TO SUBMIT A NEW QUESTION.");
                break;
            case 'ask':
                vibeLog('INITIATING_QUESTION_PROTOCOL...');
                terminalFlow.active = true;
                terminalFlow.type = 'faq';
                terminalFlow.step = 0;
                vibeLog(faqSteps[0].prompt);
                terminalInput.placeholder = "Provide name...";
                break;
            case 'book':
            case 'meet':
            case 'schedule':
                vibeLog('OPENING_MEETING_PORTAL...');
                window.open('https://calendar.app.google/F7Qg6tBBHf3MCRBE7', '_blank');
                break;
            case 'about':
                vibeLog('RAJ SIMARIA: WEBSITE DEVELOPER.');
                vibeLog('FOCUSED ON HIGH-PERFORMANCE DIGITAL SOLUTIONS.');
                vibeLog('TECH: NEXT.JS | THREE.JS | GSAP');
                vibeLog('STATUS: OPEN_FOR_CONTRACTS');
                break;
            case 'work':
                vibeLog('NAVIGATING_TO_WORK...');
                document.querySelector('#work').scrollIntoView({ behavior: 'smooth' });
                break;
            case 'instagram':
            case 'social':
                vibeLog('OPENING_INSTAGRAM_PROFILE...');
                window.open('https://www.instagram.com/raj.simaria', '_blank');
                break;
            case 'clear':
                consoleLogs.innerHTML = '';
                vibeLog('CONSOLE_FLUSHED');
                break;
            default:
                vibeLog(`UNKNOWN_COMMAND: ${baseCmd}`, 'error');
                vibeLog("TYPE 'help' FOR AVAILABLE PROTOCOLS");
        }
    }

    async function submitFinalInquiry(data) {
        vibeLog('SENDING_TO_VAULT...');
        if (data.budget && !data.budget.toString().includes('₹')) {
            const rawVal = parseInt(data.budget.toString().replace(/[^\d]/g, '')) || 2500;
            data.budget = `₹${rawVal.toLocaleString('en-IN')}`;
        }
        const formData = {
            ...data,
            affiliateId: sessionStorage.getItem('active_affiliate_id') || null,
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

    async function submitFAQFromTerminal(data) {
        vibeLog('SENDING_TO_FAQ_VAULT...');
        const faqData = {
            question: data.question,
            askedByName: data.askedByName || 'Anonymous',
            answer: '',
            isAnswered: false,
            isApproved: false,
            dateAsked: new Date().toISOString()
        };

        try {
            if (window.db) {
                await window.db.collection('faqs').add(faqData);
                vibeLog('TRANSMISSION_COMPLETE', 'success');
                vibeLog('QUESTION_RECEIVED: SYSTEM_PENDING_ANSWER');
            } else {
                const localFaqs = JSON.parse(localStorage.getItem('vibe_faqs') || '[]');
                localFaqs.push({ ...faqData, id: Date.now() });
                localStorage.setItem('vibe_faqs', JSON.stringify(localFaqs));
                vibeLog('LOCAL_SYNC_COMPLETE', 'success');
                vibeLog('QUESTION_RECEIVED_LOCALLY');
            }
        } catch (e) {
            console.error("Terminal FAQ submission error:", e);
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

    // --- Custom Cursor Removed ---

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
            e.stopPropagation(); 
            speakVibeInit(); 
            
            bootTrigger.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                bootTrigger.classList.add('hidden');
                if (loadingSequence) loadingSequence.classList.remove('hidden');
                startLoading();
            }, 300);
        });
    }
    // --- Scrollytelling & Preloader Logic ---
    const frameCount = 65;
    const frames = [];
    const airbnb = { frame: 0 };
    const canvas = document.getElementById('hero-canvas');
    const context = canvas ? canvas.getContext('2d') : null;

    function initHeroScrollytelling() {
        if (!canvas || !context) return;

        // Resize Canvas
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            render();
        }

        // Draw Current Frame
        function render() {
            const img = frames[airbnb.frame];
            if (!img) return;

            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Aspect Fill Logic
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;
            
            context.drawImage(img, x, y, img.width * scale, img.height * scale);
        }

        // Create Scrub Animation
        gsap.to(airbnb, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: "#hero-trigger",
                start: "top top",
                end: "bottom bottom",
                scrub: 0.1,
                pin: "#hero", // Robust pinning via GSAP
                anticipatePin: 1
            },
            onUpdate: render
        });

        // Ensure first frame is drawn
        if (frames[0]) frames[0].onload = render;
        render();

        ScrollTrigger.refresh();
        vibeLog('HERO_SCROLLY_SYNCED');

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    }

    function preloadFrames(onProgress) {
        let loadedCount = 0;
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            const frameNum = i.toString().padStart(2, '0');
            img.src = `frame_${frameNum}_delay-0.041s.webp`;
            img.onload = () => {
                loadedCount++;
                onProgress(loadedCount / frameCount);
                if (loadedCount === frameCount) {
                    initHeroScrollytelling();
                }
            };
            img.onerror = () => {
                loadedCount++;
                if (loadedCount === frameCount) initHeroScrollytelling();
            };
            frames.push(img);
        }
    }

    function startLoading() {
        const details = [
            'LOAD_SYSTEM_CORE...',
            'SYNC_VIBE_PROTOCOL...',
            'CACHING_HERO_FRAMES...',
            'INIT_GSAP_ENGINE...',
            'STABILIZING_INTERFACE...',
            'READY_FOR_DEPLOYMENT'
        ];

        preloadFrames((progress) => {
            const totalProgress = progress * 100;
            if (loadBar) loadBar.style.width = `${totalProgress}%`;
            if (loadPercent) loadPercent.innerText = `${Math.floor(totalProgress)}%`;
            
            if (Math.random() > 0.8 && loadDetails) {
                loadDetails.innerText = details[Math.floor(Math.random() * details.length)];
            }

            if (totalProgress >= 100) {
                setTimeout(finishLoading, 500);
            }
        });
    }

    function finishLoading() {
        const splash = document.getElementById('vibe-splash');
        if (splash) {
            splash.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => splash.remove(), 1000);
        }
        
        // Show Canvas & Nav
        if (canvas) canvas.classList.remove('opacity-0');
        const navLinks = document.getElementById('nav-links-container');
        if (navLinks) gsap.to(navLinks, { opacity: 1, pointerEvents: 'auto', duration: 1.5 });
        
        // Re-enable Scroll
        document.body.classList.remove('no-scroll');
        lenis.start();
        
        tl.play(); // Play hero animation
        ScrollTrigger.refresh();
        vibeLog('SYSTEM_BOOT_SEQUENCE: SUCCESS');
    }

    // Hero Timeline Setup (Entrance only for Name)
    tl.to('#hero-title', { opacity: 1, duration: 1.5, ease: 'power4.out', delay: 0.5 });

    // Scroll-Linked Reveal for Intro Text
    gsap.to(['#hero-tagline-scroll', '#hero-desc-scroll', '#hero-cta-scroll'], {
        opacity: 1,
        y: 0,
        stagger: 0.2,
        scrollTrigger: {
            trigger: "#hero-trigger",
            start: "top -10%", // Start showing after a bit of scroll
            end: "top -60%",  // Fully visible by mid-scroll
            scrub: 1
        }
    });

    // Navigation Layout Transition
    function initNavTransition() {
        const container = document.getElementById('nav-links-container');
        if (!container) return;

        // Start as Vertical Sidebar
        gsap.set(container, {
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '1.5rem',
            position: 'fixed',
            right: '5vw',
            top: '50vh',
            yPercent: -50,
            opacity: 0,
            pointerEvents: 'none'
        });

        // Reveal Nav after boot
        tl.to(container, { opacity: 1, pointerEvents: 'auto', duration: 1 }, '-=1');

        // Transition to Horizontal (Only after reaching black section)
        ScrollTrigger.create({
            trigger: '#expertise',
            start: 'top 80%', // Starts when Tech Arsenal is nearly at the top
            end: 'top 20%',
            scrub: 0.5, // Faster, punchier transition
            onUpdate: (self) => {
                const p = self.progress;
                if (p > 0.8) {
                    // Final Horizontal State (Top Bar)
                    gsap.set(container, {
                        flexDirection: 'row',
                        position: 'relative',
                        top: 'auto',
                        right: 'auto',
                        yPercent: 0,
                        gap: '3rem',
                        backgroundColor: 'transparent',
                        padding: '0',
                        borderRadius: '0',
                        backdropFilter: 'none'
                    });
                } else {
                    // Vertical Sidebar State (Dynamic for screen sizes)
                    const isMobile = window.innerWidth < 768;
                    gsap.set(container, {
                        flexDirection: 'column',
                        position: 'fixed',
                        right: isMobile ? '20px' : '5vw',
                        top: (50 - (p * 45)) + 'vh',
                        yPercent: -50,
                        gap: (1 + (p * 2)) + 'rem',
                        backgroundColor: 'transparent',
                        padding: '0',
                        borderRadius: '0',
                        backdropFilter: 'none',
                        opacity: 1
                    });
                }
            }
        });
    }

    initNavTransition();
    ScrollTrigger.refresh();
    vibeLog('SCROLL_REVEAL_ACTIVE');



    // --- Hero Scrollytelling Sequence ---
    // (Managed by initHeroScrollytelling)

    // --- Expertise Section Reveal ---
    const techBallsContainer = document.getElementById('tech-balls-container');
    if (techBallsContainer) {
        gsap.set(techBallsContainer, { opacity: 0, scale: 0.9 });
        
        ScrollTrigger.create({
            trigger: '#expertise',
            start: 'top 85%',
            onEnter: () => {
                gsap.to(techBallsContainer, {
                    opacity: 1,
                    scale: 1,
                    duration: 1.2,
                    ease: 'expo.out'
                });
                vibeLog('TECH_BALLS_ACTIVE');
            },
            onLeaveBack: () => {
                gsap.to(techBallsContainer, { opacity: 0, scale: 0.9, duration: 0.8 });
            }
        });
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

    // Budget Slider Dynamic Display & Vibe reactions
    const budgetSlider = document.getElementById('form-budget');
    const budgetDisplay = document.getElementById('budget-value-display');
    const budgetReaction = document.getElementById('budget-vibe-reaction');
    const budgetTouched = document.getElementById('form-budget-touched');
    const budgetContainer = document.getElementById('budget-container');

    if (budgetSlider && budgetDisplay) {
        budgetSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            if (budgetTouched) budgetTouched.value = "true";
            
            // Format value
            budgetDisplay.innerText = `₹${val.toLocaleString('en-IN')}`;
            budgetDisplay.className = "text-primary font-mono font-bold text-lg"; // Make active cyan
            
            // Reset validation style if it was red
            if (budgetContainer) {
                budgetContainer.style.borderColor = 'rgba(255,255,255,0.1)';
                budgetContainer.style.boxShadow = 'none';
            }

            // Vibe Reactions based on budget
            let reactionText = '';
            let colorClass = '';
            if (val < 15000) {
                reactionText = '// TIGHT_BUDGET (MVP / Essential Setup) 🛠️';
                colorClass = 'text-white/40';
            } else if (val < 50000) {
                reactionText = '// STANDARD_PROJECT (Professional & Clean) 💻';
                colorClass = 'text-secondary';
            } else if (val < 125000) {
                reactionText = '// PREMIUM_SOLUTION (Cinematic & High Speed) 🚀';
                colorClass = 'text-primary';
            } else {
                reactionText = '// ENTERPRISE_GRADE (Fully Custom & Matter.js) 💎';
                colorClass = 'text-[#00ffcc] font-black drop-shadow-[0_0_5px_#00ffcc]';
            }
            if (budgetReaction) {
                budgetReaction.innerHTML = reactionText;
                budgetReaction.className = `text-[8px] font-mono uppercase tracking-widest mt-2 transition-all duration-300 ${colorClass}`;
            }
            budgetSlider.style.accentColor = val < 50000 ? '#bf00ff' : '#00f2ff'; // Purple to Cyan
        });
    }

    // Enquiry Form
    const enquiryForm = document.getElementById('enquiry-form');
    if (enquiryForm) {
        enquiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Compulsory validation check
            const isBudgetTouched = document.getElementById('form-budget-touched').value === "true";
            if (!isBudgetTouched) {
                if (budgetDisplay) {
                    budgetDisplay.innerText = 'BUDGET_REQUIRED *';
                    budgetDisplay.className = 'text-red-500 font-mono font-bold text-sm';
                }
                if (budgetContainer) {
                    budgetContainer.style.borderColor = '#ef4444';
                    budgetContainer.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.2)';
                }
                vibeLog('TRANSMISSION_ABORTED: BUDGET_REQUIRED', 'error');
                return;
            }

            const rawBudget = document.getElementById('form-budget').value;
            const formData = {
                name: document.getElementById('form-name').value,
                email: document.getElementById('form-email').value,
                countryCode: document.getElementById('form-country-code').value,
                phone: document.getElementById('form-phone').value,
                budget: rawBudget ? `₹${parseInt(rawBudget).toLocaleString('en-IN')}` : '',
                details: document.getElementById('form-details').value,
                referralCode: document.getElementById('form-referral').value.trim().toUpperCase() || null,
                affiliateId: sessionStorage.getItem('active_affiliate_id') || null,
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

    // --- Testimonials Logic ---
    const leaveBtn = document.getElementById('leave-testimonial-btn');
    const tModal = document.getElementById('testimonial-modal');
    const tModalContent = document.getElementById('testimonial-modal-content');
    const closeTBtn = document.getElementById('close-testimonial-modal');
    
    if (leaveBtn && tModal) {
        leaveBtn.addEventListener('click', () => {
            tModal.classList.remove('opacity-0', 'pointer-events-none');
            setTimeout(() => tModalContent.classList.remove('scale-95'), 50);
        });
        
        closeTBtn.addEventListener('click', () => {
            tModalContent.classList.add('scale-95');
            setTimeout(() => tModal.classList.add('opacity-0', 'pointer-events-none'), 300);
        });
    }

    // Star Rating
    const starBtns = document.querySelectorAll('.star-btn');
    const ratingInput = document.getElementById('t-form-rating');
    let currentRating = 0;
    
    starBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const value = parseInt(btn.getAttribute('data-value'));
            currentRating = value;
            ratingInput.value = value;
            
            starBtns.forEach(sb => {
                const sv = parseInt(sb.getAttribute('data-value'));
                if (sv <= value) {
                    sb.classList.add('text-primary');
                    sb.classList.remove('text-white/20');
                } else {
                    sb.classList.remove('text-primary');
                    sb.classList.add('text-white/20');
                }
            });
        });
    });

    // Submit Testimonial
    const tForm = document.getElementById('testimonial-form');
    if (tForm) {
        tForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentRating) {
                alert('Please provide a rating.');
                return;
            }
            
            const tData = {
                name: document.getElementById('t-form-name').value,
                role: document.getElementById('t-form-role').value || 'Client',
                rating: currentRating,
                message: document.getElementById('t-form-message').value,
                date: new Date().toISOString(),
                status: 'approved' // Automatically show for demo purposes
            };
            
            document.getElementById('t-submit-loader').classList.remove('hidden');
            
            try {
                if (window.db) {
                    await window.db.collection('testimonials').add(tData);
                    fetchTestimonials();
                }
                
                document.getElementById('t-submit-loader').classList.add('hidden');
                document.getElementById('t-success-msg').classList.remove('opacity-0', 'pointer-events-none');
                tForm.reset();
                currentRating = 0;
                starBtns.forEach(sb => {
                    sb.classList.remove('text-primary');
                    sb.classList.add('text-white/20');
                });
                
                setTimeout(() => {
                    document.getElementById('t-success-msg').classList.add('opacity-0', 'pointer-events-none');
                    closeTBtn.click();
                }, 3000);
            } catch (error) {
                console.error("Testimonial Error:", error);
                document.getElementById('t-submit-loader').classList.add('hidden');
                alert('Failed to submit testimonial.');
            }
        });
    }

    // Fetch and Display Testimonials
    async function fetchTestimonials() {
        const container = document.getElementById('testimonials-container');
        if (!container || !window.db) return;
        
        try {
            const snapshot = await window.db.collection('testimonials')
                .orderBy('date', 'desc')
                .limit(20)
                .get();
                
            const approvedTestimonials = [];
            snapshot.forEach(doc => {
                if (doc.data().status === 'approved') {
                    approvedTestimonials.push(doc.data());
                }
            });

            if (approvedTestimonials.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center text-white/40 italic">No testimonials yet. Be the first!</div>`;
                return;
            }

            
            container.innerHTML = '';
            approvedTestimonials.slice(0, 6).forEach(data => {
                const starsHTML = Array(5).fill(0).map((_, i) => 
                    `<svg class="w-4 h-4 ${i < data.rating ? 'text-primary' : 'text-white/20'}" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>`
                ).join('');

                
                const card = document.createElement('div');
                card.className = 'p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-primary/30 transition-all flex flex-col justify-between h-full';
                card.innerHTML = `
                    <div>
                        <div class="flex gap-1 mb-4">${starsHTML}</div>
                        <p class="text-white/80 leading-relaxed mb-6 italic">"${data.message}"</p>
                    </div>
                    <div>
                        <h4 class="font-bold text-lg text-primary">${data.name}</h4>
                        <p class="text-xs text-white/40 uppercase tracking-widest font-mono mt-1">${data.role}</p>
                    </div>
                `;
                container.appendChild(card);
            });
            
            // Add ScrollSpy for Testimonials section if not already added
            if (!sections.includes('testimonials')) {
                sections.push('testimonials');
                ScrollTrigger.create({
                    trigger: '#testimonials', start: 'top 20%', end: 'bottom 20%',
                    onEnter: () => updateNav('testimonials'), onEnterBack: () => updateNav('testimonials'),
                });
            }
            ScrollTrigger.refresh();
            
        } catch (error) {
            console.error("Error fetching testimonials:", error);
            container.innerHTML = `<div class="col-span-full text-center text-red-500/80">Unable to load testimonials at this time.</div>`;
        }
    }
    
    // Call fetch once DB might be ready. We wait a bit to ensure Firebase init.
    setTimeout(fetchTestimonials, 1000);

    // --- FAQs Logic ---
    const DEFAULT_FAQS = [
        {
            question: "What technologies do you specialize in?",
            answer: "I specialize in Next.js, React, HTML5, CSS3, JavaScript (ESNext), Tailwind CSS, GSAP for fluid animations, and Three.js for immersive 3D experiences.",
            askedByName: "System"
        },
        {
            question: "What is your typical turnaround time?",
            answer: "Turnaround time varies by project size: MVP setups typically take 1-2 weeks, standard professional sites take 3-4 weeks, and premium custom interactive web apps take 6+ weeks.",
            askedByName: "System"
        },
        {
            question: "Do you offer post-launch support?",
            answer: "Yes, I provide post-launch support including maintenance, speed optimization, and custom monthly retainers depending on your needs.",
            askedByName: "System"
        },
        {
            question: "How do we get started?",
            answer: "You can send an inquiry via the Connect form below, initiate the inquiry flow in the Vibe Terminal (type 'start'), or schedule a free 15-minute call.",
            askedByName: "System"
        }
    ];

    async function fetchFAQs() {
        const container = document.getElementById('faq-container');
        if (!container) return;
        
        let activeFaqs = [];
        try {
            if (window.db) {
                const snapshot = await window.db.collection('faqs')
                    .orderBy('dateAsked', 'desc')
                    .get();
                    
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.isApproved && data.isAnswered) {
                        activeFaqs.push(data);
                    }
                });
            } else {
                const localFaqs = JSON.parse(localStorage.getItem('vibe_faqs') || '[]');
                activeFaqs = localFaqs.filter(faq => faq.isApproved && faq.isAnswered);
            }
        } catch (error) {
            console.warn("Firestore blocked or offline. Using LocalStorage fallback:", error);
            try {
                const localFaqs = JSON.parse(localStorage.getItem('vibe_faqs') || '[]');
                activeFaqs = localFaqs.filter(faq => faq.isApproved && faq.isAnswered);
            } catch (fallbackError) {
                console.error("LocalStorage fallback failed:", fallbackError);
            }
        }
        
        try {
            // Merge defaults and active FAQs
            const allFaqs = [...DEFAULT_FAQS, ...activeFaqs];
            window.loadedFAQs = allFaqs;
            
            container.innerHTML = '';
            allFaqs.forEach((faq, index) => {
                const card = document.createElement('div');
                card.className = 'glass rounded-[2rem] border border-white/10 hover:border-primary/20 transition-all overflow-hidden';
                card.innerHTML = `
                    <button class="w-full text-left p-8 flex justify-between items-center gap-6 focus:outline-none faq-toggle-btn" data-index="${index}">
                        <h3 class="text-xl font-bold tracking-tight text-white transition-colors hover:text-primary">${faq.question}</h3>
                        <span class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-primary font-bold text-lg faq-icon transition-all">+</span>
                    </button>
                    <div class="faq-answer-container h-0 overflow-hidden">
                        <div class="px-8 pb-8 text-white/60 leading-relaxed border-t border-white/5 pt-6 mt-2">
                            <p>${faq.answer}</p>
                            ${faq.askedByName && faq.askedByName !== 'System' && faq.askedByName !== 'Anonymous' ? `<p class="text-[10px] uppercase font-mono tracking-widest text-primary/40 mt-4">// Asked by ${faq.askedByName}</p>` : ''}
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
            
            // Initialize Accordion interaction
            const toggles = container.querySelectorAll('.faq-toggle-btn');
            toggles.forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const answer = toggle.nextElementSibling;
                    const icon = toggle.querySelector('.faq-icon');
                    const isOpen = answer.classList.contains('faq-open');
                    
                    toggles.forEach(t => {
                        const a = t.nextElementSibling;
                        const i = t.querySelector('.faq-icon');
                        if (a !== answer && a.classList.contains('faq-open')) {
                            a.classList.remove('faq-open');
                            gsap.to(a, { height: 0, duration: 0.4, ease: 'power2.inOut' });
                            gsap.to(i, { rotation: 0, duration: 0.3 });
                        }
                    });
                    
                    if (isOpen) {
                        answer.classList.remove('faq-open');
                        gsap.to(answer, { height: 0, duration: 0.4, ease: 'power2.inOut' });
                        gsap.to(icon, { rotation: 0, duration: 0.3 });
                    } else {
                        answer.classList.add('faq-open');
                        gsap.to(answer, { height: answer.scrollHeight, duration: 0.5, ease: 'power2.out' });
                        gsap.to(icon, { rotation: 45, duration: 0.3 });
                    }
                });
            });
            
            // Add ScrollSpy for FAQ section if not already added
            if (typeof sections !== 'undefined' && !sections.includes('faq')) {
                sections.push('faq');
                ScrollTrigger.create({
                    trigger: '#faq', start: 'top 20%', end: 'bottom 20%',
                    onEnter: () => updateNav('faq'), onEnterBack: () => updateNav('faq'),
                });
            }
            ScrollTrigger.refresh();
            
        } catch (renderError) {
            console.error("Error rendering FAQs:", renderError);
            container.innerHTML = `<div class="text-center text-red-500/80">Unable to render FAQs.</div>`;
        }
    }
    
    // Call fetch once DB might be ready
    setTimeout(fetchFAQs, 1000);

    // --- FAQ Modal Logic ---
    const askFaqBtn = document.getElementById('ask-question-btn');
    const faqModal = document.getElementById('faq-modal');
    const faqModalContent = document.getElementById('faq-modal-content');
    const closeFaqBtn = document.getElementById('close-faq-modal');
    
    if (askFaqBtn && faqModal) {
        askFaqBtn.addEventListener('click', () => {
            faqModal.classList.remove('opacity-0', 'pointer-events-none');
            setTimeout(() => faqModalContent.classList.remove('scale-95'), 50);
        });
        
        closeFaqBtn.addEventListener('click', () => {
            faqModalContent.classList.add('scale-95');
            setTimeout(() => faqModal.classList.add('opacity-0', 'pointer-events-none'), 300);
        });
    }

    const faqForm = document.getElementById('faq-form');
    if (faqForm) {
        faqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const questionText = document.getElementById('faq-form-question').value.trim();
            const askedBy = document.getElementById('faq-form-name').value.trim() || 'Anonymous';
            
            if (!questionText) return;
            
            const faqData = {
                question: questionText,
                askedByName: askedBy,
                answer: '',
                isAnswered: false,
                isApproved: false,
                dateAsked: new Date().toISOString()
            };
            
            const loader = document.getElementById('faq-submit-loader');
            if (loader) loader.classList.remove('hidden');
            
            try {
                if (window.db) {
                    await window.db.collection('faqs').add(faqData);
                } else {
                    const localFaqs = JSON.parse(localStorage.getItem('vibe_faqs') || '[]');
                    localFaqs.push({ ...faqData, id: Date.now() });
                    localStorage.setItem('vibe_faqs', JSON.stringify(localFaqs));
                }
                
                if (loader) loader.classList.add('hidden');
                
                const successMsg = document.getElementById('faq-success-msg');
                if (successMsg) successMsg.classList.remove('opacity-0', 'pointer-events-none');
                
                faqForm.reset();
                
                setTimeout(() => {
                    if (successMsg) successMsg.classList.add('opacity-0', 'pointer-events-none');
                    if (closeFaqBtn) closeFaqBtn.click();
                }, 3000);
            } catch (error) {
                console.error("FAQ Submission Error:", error);
                if (loader) loader.classList.add('hidden');
                alert('Failed to submit question. Please try again.');
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

    // --- Interactive Tech Balls (Matter.js) ---
    function initTechBalls() {
        const container = document.getElementById('tech-balls-container');
        if (!container) return;

        const techItems = [
            { name: 'HTML5', color: '#FF4D00' },
            { name: 'CSS3', color: '#00A8FF' },
            { name: 'JS_ESNext', color: '#FFD700' },
            { name: 'Tailwind', color: '#00F2FF' },
            { name: 'GSAP', color: '#88CE02' },
            { name: 'SASS', color: '#FF66B2' },
            { name: 'Three.js', color: '#FFFFFF' },
            { name: 'WebGL', color: '#FF3333' },
            { name: 'Shaders', color: '#BF00FF' },
            { name: 'Firebase', color: '#FFCA28' },
            { name: 'Supabase', color: '#3ECF8E' },
            { name: 'PostgreSQL', color: '#4D90FE' },
            { name: 'VibeEngine', color: '#00F2FF' }
        ];

        const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

        const engine = Engine.create();
        engine.world.gravity.y = 0; // No gravity for floaty vibe

        const render = Render.create({
            element: container,
            engine: engine,
            options: {
                width: container.offsetWidth,
                height: container.offsetHeight,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio
            }
        });

        const runner = Runner.create();
        Runner.run(runner, engine);
        Render.run(render);

        // Walls
        const wallOptions = { isStatic: true, render: { visible: false } };
        const walls = [
            Bodies.rectangle(container.offsetWidth / 2, -50, container.offsetWidth, 100, wallOptions),
            Bodies.rectangle(container.offsetWidth / 2, container.offsetHeight + 50, container.offsetWidth, 100, wallOptions),
            Bodies.rectangle(-50, container.offsetHeight / 2, 100, container.offsetHeight, wallOptions),
            Bodies.rectangle(container.offsetWidth + 50, container.offsetHeight / 2, 100, container.offsetHeight, wallOptions)
        ];
        Composite.add(engine.world, walls);

        // Central Cluster Logic (Clustered Structure)
        let centerX = container.offsetWidth / 2;
        let centerY = container.offsetHeight / 2;
        const isMobile = window.innerWidth < 768;
        const itemsToDisplay = isMobile ? techItems.slice(0, 8) : techItems;
        const balls = [];

        itemsToDisplay.forEach((item, idx) => {
            // Responsive radius for mobile/desktop
            const radius = isMobile ? (35 + Math.random() * 15) : (60 + Math.random() * 30);
            
            // Diamond Grid Logic
            const rowCount = Math.ceil(Math.sqrt(itemsToDisplay.length));
            const row = Math.floor(idx / rowCount);
            const col = idx % rowCount;
            
            // Offset for diamond shape
            const xOffset = (col - (rowCount / 2)) * (radius * 2.2);
            const yOffset = (row - (rowCount / 2)) * (radius * 2.2) + (col % 2 === 0 ? 0 : radius);
            
            const ball = Bodies.circle(
                centerX + xOffset, 
                centerY + yOffset, 
                radius, 
                {
                    restitution: 0.8,
                    friction: 0.1,
                    frictionAir: 0.05,
                    render: {
                        fillStyle: 'rgba(255, 255, 255, 0.03)',
                        strokeStyle: item.color,
                        lineWidth: 2
                    }
                }
            );
            
            ball.label = item.name;
            ball.color = item.color;
            balls.push(ball);
        });

        Composite.add(engine.world, balls);

        // Mouse Control
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        Composite.add(engine.world, mouseConstraint);

        // Custom Rendering for Illustrative 3D Spheres
        Events.on(render, 'afterRender', () => {
            const ctx = render.context;
            
            // Sort balls by Y to handle overlapping correctly
            const sortedBalls = [...balls].sort((a, b) => a.position.y - b.position.y);

            sortedBalls.forEach(ball => {
                const { x, y } = ball.position;
                const radius = ball.circleRadius;

                // 1. Thick Outer Outline (Cartoon/Illustrative style)
                ctx.beginPath();
                ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
                ctx.fillStyle = '#000000';
                ctx.fill();

                // 2. 3D Shaded Sphere (Opaque)
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.clip();

                const gradient = ctx.createRadialGradient(
                    x - radius * 0.3, 
                    y - radius * 0.3, 
                    radius * 0.1, 
                    x, y, radius
                );
                
                const baseColor = ball.color;
                gradient.addColorStop(0, '#ffffff'); // Highlight
                gradient.addColorStop(0.2, baseColor); 
                gradient.addColorStop(1, '#050505'); // Deep shadow
                
                ctx.fillStyle = gradient;
                ctx.fill();

                // Subtle rim light
                ctx.strokeStyle = baseColor;
                ctx.lineWidth = 4;
                ctx.globalAlpha = 0.3;
                ctx.stroke();
                ctx.restore();

                // 3. Illustrative "Pattern" (Subtle curves like basketball)
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x - radius, y, radius, -0.5, 0.5);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x + radius, y, radius, Math.PI - 0.5, Math.PI + 0.5);
                ctx.stroke();

                // 4. Label
                ctx.font = `bold ${Math.floor(radius/4.5)}px "JetBrains Mono"`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(ball.label, x, y);
                ctx.shadowBlur = 0;
            });
        });

        // Update Loop: Central Gravity (Cluster) + Mouse Attraction
        Events.on(engine, 'beforeUpdate', () => {
            balls.forEach(ball => {
                // 1. Central Gravity Force (Keep them clustered)
                const clusterDx = centerX - ball.position.x;
                const clusterDy = centerY - ball.position.y;
                Matter.Body.applyForce(ball, ball.position, {
                    x: clusterDx * 0.0005,
                    y: clusterDy * 0.0005
                });

                // 2. Mouse Attraction
                if (mouse.position.x > 0 && mouse.position.y > 0) {
                    const mouseDx = mouse.position.x - ball.position.x;
                    const mouseDy = mouse.position.y - ball.position.y;
                    const distSq = mouseDx * mouseDx + mouseDy * mouseDy;
                    
                    if (distSq < 300 * 300) {
                        const dist = Math.sqrt(distSq);
                        const force = 0.003 * (1 - dist / 300);
                        Matter.Body.applyForce(ball, ball.position, {
                            x: mouseDx * force,
                            y: mouseDy * force
                        });
                    }
                }
            });
        });

        window.addEventListener('resize', () => {
            if (!container) return;
            const newWidth = container.offsetWidth;
            const newHeight = container.offsetHeight;
            
            render.canvas.width = newWidth;
            render.canvas.height = newHeight;
            render.options.width = newWidth;
            render.options.height = newHeight;
            
            // Re-calculate center for gravity
            centerX = newWidth / 2;
            centerY = newHeight / 2;
            
            // Re-position walls
            Matter.Body.setPosition(walls[0], { x: newWidth / 2, y: -50 });
            Matter.Body.setPosition(walls[1], { x: newWidth / 2, y: newHeight + 50 });
            Matter.Body.setPosition(walls[2], { x: -50, y: newHeight / 2 });
            Matter.Body.setPosition(walls[3], { x: newWidth + 50, y: newHeight / 2 });
            
            // Re-calculate bounds for walls
            walls[0].vertices = Matter.Vertices.fromPath(`0 0 ${newWidth} 0 ${newWidth} 100 0 100`);
            walls[1].vertices = Matter.Vertices.fromPath(`0 0 ${newWidth} 0 ${newWidth} 100 0 100`);
        });

        vibeLog('TECH_BALLS_LOADED');
    }

    initDotGrid();

    // Final Engine Refresh
    ScrollTrigger.refresh();
    vibeLog('VIBE_PROTOCOL: FULLY_SYNCED');
});

