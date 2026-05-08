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
    function vibeLog(message) {
        if (!consoleLogs) return;
        const log = document.createElement('div');
        log.className = 'opacity-0 transition-opacity duration-300';
        log.innerText = `> ${message}`;
        consoleLogs.prepend(log);
        setTimeout(() => log.classList.remove('opacity-0'), 10);
        
        if (consoleLogs.children.length > 6) {
            consoleLogs.lastElementChild.remove();
        }
    }

    vibeLog('VIBE_PROTOCOL_INITIALIZED...');

    // --- Three.js Background ---
    let torusKnot;
    let camera, scene, renderer;
    let mouseX = 0, mouseY = 0;

    try {
        const canvas = document.getElementById('vibe-canvas');
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create a 3D Mesh - Slightly smaller and more responsive
        const geometry = new THREE.TorusKnotGeometry(8, 2.5, 120, 20);
        const material = new THREE.MeshNormalMaterial({ 
            wireframe: true, 
            transparent: true, 
            opacity: 0.2,
            blending: THREE.AdditiveBlending 
        });
        torusKnot = new THREE.Mesh(geometry, material);
        scene.add(torusKnot);

        camera.position.z = 30;
        vibeLog('THREE_JS_SCENE: READY');

        // Animation Loop
        function animate() {
            requestAnimationFrame(animate);
            if (torusKnot) {
                torusKnot.rotation.x += 0.005;
                torusKnot.rotation.y += 0.005;
                torusKnot.rotation.x += (mouseY * 0.5 - torusKnot.rotation.x) * 0.05;
                torusKnot.rotation.y += (mouseX * 0.5 - torusKnot.rotation.y) * 0.05;
            }
            renderer.render(scene, camera);
        }
        animate();
    } catch (e) {
        console.error('Three.js Init Failed:', e);
    }

    // Mouse Movement
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) / 100;
        mouseY = (e.clientY - window.innerHeight / 2) / 100;
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        if (camera && renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    });

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
                if (torusKnot) {
                    gsap.to(torusKnot.material, { opacity: 0.8, duration: 0.5 });
                    gsap.to(torusKnot.rotation, { z: '+=2', duration: 1 });
                }

                lenis.scrollTo(target, {
                    offset: 0,
                    duration: 2.5,
                    easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
                    onComplete: () => {
                        // Safety: Ensure main is restored even if scroll ends abruptly
                        gsap.to('main', { filter: 'blur(0px)', opacity: 1, duration: 0.8, ease: 'power2.out' });
                        if (torusKnot) gsap.to(torusKnot.material, { opacity: 0.3, duration: 0.8 });
                        vibeLog(`WARP_COMPLETE: ${targetId.toUpperCase()}`);
                        isWarping = false;
                        ScrollTrigger.refresh();
                    }
                });
            }
        });
    });

    // --- Scroll Effects ---
    if (torusKnot) {
        gsap.to(torusKnot.rotation, {
            scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1 },
            x: Math.PI * 2, y: Math.PI, ease: 'none'
        });
    }

    gsap.to(camera.position, {
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1 },
        z: 50, ease: 'none'
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
                details: document.getElementById('form-details').value,
                date: new Date().toISOString(), 
                id: Date.now()
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

    // Final Engine Refresh
    ScrollTrigger.refresh();
    vibeLog('VIBE_PROTOCOL: FULLY_SYNCED');
});

