document.addEventListener('DOMContentLoaded', () => {
    // 1. 3D Dot Sphere Canvas
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let points = [];
        const numPoints = 1500;
        let radius = 250;
        let angleX = 0;
        let angleY = 0;

        function initPoints() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Make the sphere radius 45% of the smallest screen dimension so it fills the screen nicely
            radius = Math.min(canvas.width, canvas.height) * 0.45;
            if (radius < 300) radius = 300; // Minimum size for mobile

            points = [];
            for (let i = 0; i < numPoints; i++) {
                const theta = Math.random() * 2 * Math.PI;
                const phi = Math.acos(2 * Math.random() - 1);
                points.push({
                    x: radius * Math.sin(phi) * Math.cos(theta),
                    y: radius * Math.sin(phi) * Math.sin(theta),
                    z: radius * Math.cos(phi)
                });
            }
        }

        function project(x, y, z) {
            // Adjust perspective based on the new massive radius
            const camZ = radius * 2.5; 
            const perspective = camZ / (camZ + z);
            return {
                x: x * perspective + canvas.width / 2,
                y: y * perspective + canvas.height / 2,
                scale: perspective
            };
        }

        function rotate(p, ax, ay) {
            let y1 = p.y * Math.cos(ax) - p.z * Math.sin(ax);
            let z1 = p.y * Math.sin(ax) + p.z * Math.cos(ax);
            let x2 = p.x * Math.cos(ay) + z1 * Math.sin(ay);
            let z2 = -p.x * Math.sin(ay) + z1 * Math.cos(ay);
            return { x: x2, y: y1, z: z2 };
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            angleX += 0.001;
            angleY += 0.0015;

            // Sort points by Z index for proper 3D rendering (back to front)
            const rotatedPoints = points.map(p => {
                const r = rotate(p, angleX, angleY);
                return { original: p, rotated: r };
            }).sort((a, b) => b.rotated.z - a.rotated.z);

            rotatedPoints.forEach(p => {
                const projected = project(p.rotated.x, p.rotated.y, p.rotated.z);
                
                // Calculate depth alpha and size
                // Map z from [-radius, radius] to [0, 1]
                const depth = (p.rotated.z + radius) / (2 * radius);
                const alpha = Math.max(0.1, depth * 0.8);
                
                // Color variation based on depth (from indigo to cyan)
                const rColor = Math.floor(99 + (1 - depth) * 50);
                const gColor = Math.floor(102 + depth * 100);
                const bColor = 241;

                ctx.fillStyle = `rgba(${rColor}, ${gColor}, ${bColor}, ${alpha})`;
                
                // Add glow to points in the front
                if (depth > 0.7) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = `rgba(${rColor}, ${gColor}, ${bColor}, ${alpha})`;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.beginPath();
                // Base size + depth scale
                const particleSize = Math.max(0.5, projected.scale * 2.5);
                ctx.arc(projected.x, projected.y, particleSize, 0, Math.PI * 2);
                ctx.fill();
            });
            requestAnimationFrame(draw);
        }

        let mouseX = 0;
        let mouseY = 0;
        let targetAngleX = 0;
        let targetAngleY = 0;

        const handleInteraction = (clientX, clientY) => {
            mouseX = (clientX - canvas.width / 2) / canvas.width;
            mouseY = (clientY - canvas.height / 2) / canvas.height;
            // Interaction drives the rotation slightly
            angleY += mouseX * 0.02;
            angleX -= mouseY * 0.02;
        };

        window.addEventListener('mousemove', (e) => handleInteraction(e.clientX, e.clientY));
        
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        initPoints();
        draw();
        window.addEventListener('resize', initPoints);
    }

    // 2. Reveal Observer
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // 3D Tilt Engine
    function bind3DTilt() {
        const cards = document.querySelectorAll('.glass-card');
        cards.forEach(card => {
            if (card.dataset.tiltBound) return;
            card.dataset.tiltBound = 'true';

            // Set perspective on parent to enable true 3D depth
            card.parentElement.style.perspective = '1500px';
            
            const handleMove = (clientX, clientY) => {
                const rect = card.getBoundingClientRect();
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                
                // If touch moves outside the physical card bounds, reset it
                if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
                    resetTilt();
                    return;
                }
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Calculate rotation (max 12 degrees)
                const rotateX = ((y - centerY) / centerY) * -12; 
                const rotateY = ((x - centerX) / centerX) * 12;
                
                card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                
                // Dynamic glare
                const glareX = (x / rect.width) * 100;
                const glareY = (y / rect.height) * 100;
                card.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%)`;
            };

            const resetTilt = () => {
                card.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.5s';
                card.style.background = `rgba(255, 255, 255, 0.03)`;
            };

            const startTilt = () => {
                card.style.transition = 'transform 0.1s ease-out';
            };

            // Mouse Events
            card.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
            card.addEventListener('mouseleave', resetTilt);
            card.addEventListener('mouseenter', startTilt);

            // Touch Events (Mobile/Tablet)
            card.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });
            card.addEventListener('touchend', resetTilt);
            card.addEventListener('touchstart', startTilt, { passive: true });
        });
    }

    // Initialize tilt on static cards
    bind3DTilt();

    // 3. Shop Logic (Firestore Only)
    const publicWorksGrid = document.getElementById('public-works-grid');

    const renderWorks = (works) => {
        publicWorksGrid.innerHTML = '';
        if (works.length === 0) {
            publicWorksGrid.innerHTML = '<p class="col-span-full text-center py-20 text-slate-500 font-medium">No items found in database.</p>';
            return;
        }
        works.forEach(data => {
            const card = document.createElement('div');
            card.className = 'glass-card p-10 flex flex-col gap-6 reveal';
            card.innerHTML = `
                <div class="flex justify-between items-start float-3d">
                    <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Asset v1.0</span>
                    <i data-lucide="package" class="w-5 h-5 text-slate-600"></i>
                </div>
                <div class="float-3d">
                    <h3 class="text-2xl font-display font-bold mb-3">${data.title}</h3>
                    <p class="text-slate-500 text-sm font-medium leading-relaxed mb-8">${data.description}</p>
                    <div class="flex items-center justify-between mt-auto">
                        <span class="text-xl font-bold">₹${data.price}</span>
                        <button class="buy-btn border border-white/10 px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all" 
                                data-id="${data.id}" data-title="${data.title}" data-price="${data.price}">
                            Acquire
                        </button>
                    </div>
                </div>
            `;
            publicWorksGrid.appendChild(card);
            revealObserver.observe(card);
        });
        lucide.createIcons();
        bindBuyEvents();
        bind3DTilt(); // Re-bind for dynamic elements
    };

    async function loadShopWorks() {
        if (!publicWorksGrid) return;

        const defaultArtifacts = [
            { id: 'mock-1', title: 'Aether UI Kit', description: 'A futuristic design system for next-gen web applications.', price: '1200' },
            { id: 'mock-2', title: 'Hyper-Fluid Pack', description: 'Interactive canvas animations and fluid shaders for high-end portfolios.', price: '800' },
            { id: 'mock-3', title: 'Neural Admin', description: 'Advanced dashboard architecture with real-time data visualization.', price: '1500' }
        ];

        const render = (works, isLive = false) => {
            publicWorksGrid.innerHTML = '';
            const items = works.length > 0 ? works : defaultArtifacts;
            items.forEach(data => {
                const card = document.createElement('div');
                card.className = 'glass-card p-10 flex flex-col gap-6 reveal';
                if (isLive) card.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">${isLive ? 'Live Sync' : 'Asset v1.0'}</span>
                        <i data-lucide="${isLive ? 'database' : 'package'}" class="w-5 h-5 text-slate-600"></i>
                    </div>
                    <div>
                        <h3 class="text-2xl font-display font-bold mb-3">${data.title}</h3>
                        <p class="text-slate-500 text-sm font-medium leading-relaxed mb-8">${data.description}</p>
                        <div class="flex items-center justify-between mt-auto">
                            <span class="text-xl font-bold">₹${data.price}</span>
                            <button class="buy-btn border border-white/10 px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all" 
                                    data-id="${data.id}" data-title="${data.title}" data-price="${data.price}">
                                Acquire
                            </button>
                        </div>
                    </div>
                `;
                publicWorksGrid.appendChild(card);
                setTimeout(() => card.classList.add('active'), 100);
            });
            lucide.createIcons();
            bindBuyEvents();
        };

        // 1. Show mocks immediately
        render([]);

        // 2. Direct Firestore Sync
        try {
            const firestore = firebase.firestore();
            firestore.collection('works').onSnapshot((snapshot) => {
                if (!snapshot.empty) {
                    const works = [];
                    snapshot.forEach(doc => works.push({ id: doc.id, ...doc.data() }));
                    console.log("Firebase Sync: Found " + works.length + " items");
                    render(works, true);
                } else {
                    console.log("Firebase Sync: Collection is empty, using mocks");
                }
            }, (err) => {
                console.error("Firebase Sync Error:", err);
            });
        } catch (e) {
            console.error("Firebase Initialization Error:", e);
        }
    }

    function bindBuyEvents() {
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { id, title, price } = e.currentTarget.dataset;
                if (!firebase.auth().currentUser) {
                    localStorage.setItem('pendingPurchase', JSON.stringify({ id, title, price }));
                    window.location.href = 'login.html';
                    return;
                }
                openPaymentModal(title, price, id);
            });
        });
    }

    // 4. Payment Modal Logic
    const paymentModal = document.getElementById('payment-modal');
    const closeModal = document.getElementById('close-modal');
    let currentProductId = null;

    function openPaymentModal(title, price, id) {
        currentProductId = id;
        document.querySelector('.modal-title').textContent = title;
        document.getElementById('pay-amount').value = price || '100';
        document.getElementById('pay-amount').readOnly = !!price;
        
        updateUPI();
        paymentModal.classList.add('active');
    }

    function updateUPI() {
        const amount = document.getElementById('pay-amount').value;
        const upi = `upi://pay?pa=rajsimariaa-2@okaxis&pn=Raj%20Simaria&cu=INR&am=${amount}`;
        document.getElementById('upi-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upi)}&color=6366f1&bgcolor=030014`;
        document.getElementById('upi-link').href = upi;
    }

    document.getElementById('pay-amount').addEventListener('input', updateUPI);

    if (closeModal) closeModal.addEventListener('click', () => paymentModal.classList.remove('active'));

    document.getElementById('payment-done-btn').addEventListener('click', async () => {
        const btn = document.getElementById('payment-done-btn');
        const name = document.getElementById('pay-name').value;
        const email = document.getElementById('pay-email').value;
        const amount = document.getElementById('pay-amount').value;
        
        if (!name || !email || !amount) return alert('Fill all fields.');

        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            await db.collection('payments').add({
                name, email, amount: Number(amount),
                productId: currentProductId,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            document.getElementById('payment-form').style.display = 'none';
            document.getElementById('payment-success').style.display = 'block';
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Confirm Payment';
        }
    });

    // Auth State & Pending Purchase
    firebase.auth().onAuthStateChanged((user) => {
        const pending = localStorage.getItem('pendingPurchase');
        if (user && pending) {
            try {
                const { id, title, price } = JSON.parse(pending);
                localStorage.removeItem('pendingPurchase');
                setTimeout(() => openPaymentModal(title, price, id), 1000);
            } catch (e) {
                console.error("Pending purchase parse error", e);
            }
        }
    });

    // Mobile Menu Logic
    const menuBtn = document.getElementById('menu-btn');
    const mobCloseBtn = document.getElementById('close-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => mobileMenu.classList.add('active'));
    }

    if (mobCloseBtn && mobileMenu) {
        mobCloseBtn.addEventListener('click', () => mobileMenu.classList.remove('active'));
    }

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.remove('active'));
    });

    // Handle Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    loadShopWorks();
});
