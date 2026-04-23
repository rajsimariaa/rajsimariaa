document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Set current year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Sticky Navbar
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('close-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    }

    if (menuBtn && closeBtn && mobileMenu) {
        menuBtn.addEventListener('click', toggleMenu);
        closeBtn.addEventListener('click', toggleMenu);
        mobileLinks.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    }

    // Scroll Reveal Animation

    function checkReveal() {
        const revealElements = document.querySelectorAll('.reveal');
        const windowHeight = window.innerHeight;
        const revealPoint = 100;

        revealElements.forEach(el => {
            const revealTop = el.getBoundingClientRect().top;
            if (revealTop < windowHeight - revealPoint) {
                el.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', checkReveal);
    checkReveal(); // Trigger on initial load

    // Auth State for Navbar
    const adminNavLink = document.querySelector('.admin-nav-link');
    const mobileAdminLink = document.querySelector('.mobile-nav-links a[href="admin.html"]');

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const isUserAdmin = user.email === 'rajsimariaa@gmail.com';
            const targetPage = isUserAdmin ? 'admin.html' : 'dashboard.html';
            const label = isUserAdmin ? ' Admin' : ' Dashboard';

            if (adminNavLink) {
                adminNavLink.href = targetPage;
                adminNavLink.innerHTML = `<i data-lucide="${isUserAdmin ? 'lock' : 'user'}"></i>${label}`;
            }
            if (mobileAdminLink) {
                mobileAdminLink.href = targetPage;
                mobileAdminLink.textContent = label;
            }
        } else {
            if (adminNavLink) {
                adminNavLink.href = 'login.html';
                adminNavLink.innerHTML = `<i data-lucide="user"></i> Portal`;
            }
            if (mobileAdminLink) {
                mobileAdminLink.href = 'login.html';
                mobileAdminLink.textContent = 'Portal Login';
            }
        }
        lucide.createIcons();
    });

    // Shop Logic - Fetch and display works
    const publicWorksGrid = document.getElementById('public-works-grid');

    async function loadShopWorks() {
        if (!publicWorksGrid) return;

        function renderWorks(snapshot) {
            publicWorksGrid.innerHTML = '';

            if (snapshot.empty) {
                publicWorksGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">No products available yet.</p>';
                return;
            }

            const docs = [];
            snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));

            docs.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
                return timeB - timeA;
            });

            docs.forEach(data => {
                const workItem = document.createElement('div');
                workItem.className = 'work-item reveal';
                workItem.innerHTML = `
                    <h3>${data.title}</h3>
                    <p>${data.description}</p>
                    <div class="work-price">₹${data.price}</div>
                    <button class="primary-btn w-full buy-btn" 
                        data-id="${data.id}" 
                        data-title="${data.title}" 
                        data-price="${data.price}">
                        Buy Now
                    </button>
                `;
                publicWorksGrid.appendChild(workItem);
            });

            lucide.createIcons();
            checkReveal();

            document.querySelectorAll('.buy-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const title = e.currentTarget.getAttribute('data-title');
                    const price = e.currentTarget.getAttribute('data-price');
                    openPaymentModal(title, price, id);
                });
            });
        }

        try {
            if (typeof db === 'undefined') {
                publicWorksGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Firebase not configured.</p>';
                return;
            }

            db.collection('works').onSnapshot(
                snapshot => renderWorks(snapshot),
                err => {
                    console.error("Firestore fetch failed:", err);
                    publicWorksGrid.innerHTML = `<p style="text-align:center; grid-column:1/-1;">Error loading products: ${err.message}</p>`;
                }
            );
        } catch (error) {
            console.error("Error loading shop:", error);
            publicWorksGrid.innerHTML = '<p style="text-align:center; grid-column:1/-1;">Error loading products.</p>';
        }
    }

    let currentProductId = null;

    function openPaymentModal(productTitle = "a coffee", price = "", productId = null) {
        const modalTitle = document.querySelector('.modal-title');
        const nameInput = document.getElementById('pay-name');
        const emailInput = document.getElementById('pay-email');
        const amountInput = document.getElementById('pay-amount');
        const upiQr = document.getElementById('upi-qr');
        const upiLink = document.getElementById('upi-link');

        currentProductId = productId;

        const user = firebase.auth().currentUser;
        if (user) {
            nameInput.value = user.displayName || '';
            emailInput.value = user.email || '';
        }

        if (productTitle !== "a coffee") {
            modalTitle.textContent = `Purchase ${productTitle} 🛍️`;
        } else {
            modalTitle.textContent = "Buy Me A Coffee ☕";
        }

        if (price) {
            amountInput.value = price;
            amountInput.readOnly = true;
        } else {
            amountInput.value = '';
            amountInput.readOnly = false;
        }

        // Update QR and Link
        const finalPrice = price || amountInput.value || '10';
        const upiData = `upi://pay?pa=rajsimariaa-2@okaxis&pn=Raj%20Simaria&cu=INR&am=${finalPrice}`;
        upiQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiData)}`;
        upiLink.href = upiData;

        // If amount changes manually, update QR
        amountInput.addEventListener('input', () => {
            const newPrice = amountInput.value || '10';
            const newUpiData = `upi://pay?pa=rajsimariaa-2@okaxis&pn=Raj%20Simaria&cu=INR&am=${newPrice}`;
            upiQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(newUpiData)}`;
            upiLink.href = newUpiData;
        });

        paymentModal.classList.add('active');
    }

    // Modal Logic
    const coffeeBtn = document.getElementById('coffee-btn');
    const paymentModal = document.getElementById('payment-modal');
    const closeModal = document.getElementById('close-modal');
    const paymentDoneBtn = document.getElementById('payment-done-btn');
    const paymentForm = document.getElementById('payment-form');
    const paymentSuccess = document.getElementById('payment-success');

    if (coffeeBtn && paymentModal) {
        coffeeBtn.addEventListener('click', () => {
            openPaymentModal();
        });

        closeModal.addEventListener('click', () => {
            paymentModal.classList.remove('active');
            setTimeout(() => {
                paymentForm.style.display = 'flex';
                paymentSuccess.style.display = 'none';
                const inputs = paymentForm.querySelectorAll('input');
                inputs.forEach(i => {
                    i.value = '';
                    i.readOnly = false;
                });
            }, 300);
        });

        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) {
                paymentModal.classList.remove('active');
            }
        });

        paymentDoneBtn.addEventListener('click', async () => {
            const nameInput = document.getElementById('pay-name').value;
            const emailInput = document.getElementById('pay-email').value;
            const amountInput = document.getElementById('pay-amount').value;
            const user = firebase.auth().currentUser;

            if (nameInput && emailInput && amountInput) {
                paymentDoneBtn.textContent = 'Processing...';
                paymentDoneBtn.disabled = true;

                try {
                    await db.collection('payments').add({
                        userId: user ? user.uid : null,
                        productId: currentProductId,
                        name: nameInput,
                        email: emailInput.toLowerCase().trim(),
                        amount: Number(amountInput),
                        product: document.querySelector('.modal-title').textContent.replace('Purchase ', '').replace('Buy Me A Coffee ☕', 'Coffee'),
                        status: 'pending_verification',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    paymentForm.style.display = 'none';
                    paymentSuccess.style.display = 'block';
                    lucide.createIcons();
                } catch (error) {
                    console.error("Error saving payment: ", error);
                    alert("Something went wrong: " + error.message);
                } finally {
                    paymentDoneBtn.textContent = "I've Made the Payment";
                    paymentDoneBtn.disabled = false;
                }
            } else {
                alert('Please fill in all fields.');
            }
        });
    }

    loadShopWorks();
});
