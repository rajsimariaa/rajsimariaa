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

    // Hero Effects - Commented out to keep the hero title static on scroll
    /*
    gsap.to('#hero-title', {
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
        y: 150, scale: 0.9, opacity: 0, ease: 'none'
    });

    gsap.to('.border-text', {
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
        x: 100, ease: 'none'
    });
    */

    // Scrollspy
    const sections = ['hero', 'about', 'expertise', 'work', 'contact'];
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


    // --- Simple Preloader Logic ---
    const tl = gsap.timeline({ paused: true });
    const progressBar = document.getElementById('loading-progress-bar');
    const progressText = document.getElementById('loading-percentage');

    async function runBootSequence() {
        let displayedProgress = 0;
        
        // Load frames in the background without blocking the UI
        preloadFrames(() => {});

        await new Promise((resolve) => {
            const progressInterval = setInterval(() => {
                displayedProgress += 2; // Slower constant speed (2% per tick)
                if (displayedProgress >= 100) {
                    displayedProgress = 100;
                    clearInterval(progressInterval);
                    resolve();
                }
                
                if (progressBar && progressText) {
                    progressBar.style.width = `${displayedProgress}%`;
                    progressText.innerText = `${Math.floor(displayedProgress)}%`;
                }
            }, 30); // ~1.5 seconds total loading animation time
        });

        // Brief pause at 100% so the user can see it completed
        await new Promise(resolve => setTimeout(resolve, 400));
        finishLoading();
    }

    // --- Scrollytelling & Preloader Logic ---
    const frameCount = 65;
    const frames = [];
    const airbnb = { frame: 0 };
    const canvas = document.getElementById('hero-canvas');
    const context = canvas ? canvas.getContext('2d') : null;

    // Auto-start full boot sequence immediately on load
    runBootSequence();

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

    function finishLoading() {
        const splash = document.getElementById('vibe-splash');
        if (splash) {
            splash.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => splash.remove(), 300);
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
    gsap.to(['#hero-tagline-scroll', '#hero-cta-scroll'], {
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



    const DEFAULT_TESTIMONIALS = [
        {
            name: "Sunil",
            role: "Founder, K Lulla Enterprises",
            rating: 5,
            message: "Raj transformed our B2B digital catalog into a sleek, high-performing platform. His expertise in performance optimization and eye for motion design led to a 35% increase in direct customer inquiries. Highly recommended for premium, custom web work.",
            date: "2026-05-15T10:30:00.000Z"
        }
    ];

    // Fetch and Display Testimonials
    async function fetchTestimonials() {
        const container = document.getElementById('testimonials-container');
        if (!container) return;
        
        let approvedTestimonials = [];
        try {
            if (window.db) {
                const snapshot = await window.db.collection('testimonials')
                    .orderBy('date', 'desc')
                    .limit(20)
                    .get();
                    
                snapshot.forEach(doc => {
                    if (doc.data().status === 'approved') {
                        approvedTestimonials.push(doc.data());
                    }
                });
            }
        } catch (error) {
            console.warn("Firestore testimonials fetch failed, using fallback:", error);
        }

        const allTestimonials = [...DEFAULT_TESTIMONIALS, ...approvedTestimonials].filter(data => {
            // Hide the test review submitted via the UI form
            return !(data.name === 'Sunil' && data.message.includes('good experience'));
        });

        if (allTestimonials.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center text-white/40 italic">No testimonials yet. Be the first!</div>`;
            return;
        }

        container.innerHTML = '';
        allTestimonials.slice(0, 6).forEach(data => {
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
        
        if (!sections.includes('testimonials')) {
            sections.push('testimonials');
            ScrollTrigger.create({
                trigger: '#testimonials', start: 'top 20%', end: 'bottom 20%',
                onEnter: () => updateNav('testimonials'), onEnterBack: () => updateNav('testimonials'),
            });
        }
        ScrollTrigger.refresh();
    }
    
    // Call fetch once DB might be ready. We wait a bit to ensure Firebase init.
    setTimeout(fetchTestimonials, 1000);

    // --- FAQs Logic ---
    const DEFAULT_FAQS = [
        {
            question: "What types of clients do you work with?",
            answer: "I partner primarily with D2C brands, luxury fashion labels, premium hospitality groups, and high-end real estate agencies looking to stand out. If your brand needs to justify premium pricing or capture attention instantly, my cinematic web experiences are built for you.",
            askedByName: "System"
        },
        {
            question: "What is your pricing model, and what does a project cost?",
            answer: "Custom interactive web projects are quoted based on the unique value, scope, and complexity of your requirements. I provide clear, milestone-based quotes and ensure full transparency on costs before we write a single line of code.",
            askedByName: "System"
        },
        {
            question: "How do you ensure cinematic websites are also fast and SEO-friendly?",
            answer: "Every cinematic site I build utilizes Next.js and React for Server-Side Rendering (SSR) and optimized asset delivery, combined with highly-compressed WebP/GLTF media. Animation libraries like GSAP are decoupled and load asynchronously, ensuring page load times remain under 1.5 seconds and SEO performance is top-tier.",
            askedByName: "System"
        },
        {
            question: "How long does a typical custom project take to launch?",
            answer: "A typical custom creative landing page takes 2–3 weeks, while a comprehensive B2B catalog or e-commerce storefront experience takes 4–6 weeks. This timeline includes planning, UI/UX concept design, interactive implementation, testing, and launch support.",
            askedByName: "System"
        },
        {
            question: "How do we get started and track progress?",
            answer: "We kick off with a brief alignment call to discuss your goals and budget. Once approved, I build in public using staging URLs, allowing you to review and interact with the design and animations at every phase of the project.",
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
            { name: 'Next.js', color: '#FFFFFF' },
            { name: 'React', color: '#61DAFB' },
            { name: 'Three.js', color: '#FFFFFF' },
            { name: 'GSAP', color: '#88CE02' },
            { name: 'Framer Motion', color: '#BF00FF' },
            { name: 'WebGL', color: '#FF3333' },
            { name: 'Shaders', color: '#BF00FF' },
            { name: 'Tailwind', color: '#00F2FF' },
            { name: 'Firebase', color: '#FFCA28' },
            { name: 'Supabase', color: '#3ECF8E' },
            { name: 'Matter.js', color: '#88CE02' },
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

    vibeLog('VIBE_PROTOCOL: FULLY_SYNCED');
});

