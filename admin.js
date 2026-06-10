// --- Auth System ---
const PASS = 'BayMax';
const overlay = document.getElementById('login-overlay');

function checkAccess() {
    const input = document.getElementById('admin-pass');
    if (input.value === PASS) {
        overlay.style.display = 'none';
        loadEnquiries();
        loadAffiliates();
    } else {
        alert('ACCESS DENIED: INCORRECT VIBE CODE');
        input.value = '';
    }
}

// Robotic Welcome Voice Optimization
let welcomeSpoken = false;
let welcomeUtterance = new SpeechSynthesisUtterance("WELCOME MASTER. PLEASE ENTER THE ACCESS CODE TO ENTER THE VAULT.");
welcomeUtterance.pitch = 0.1; 
welcomeUtterance.rate = 0.85;
welcomeUtterance.volume = 1;

function loadAdminVoices() {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        welcomeUtterance.voice = voices.find(v => v.name.includes('Google UK English Male')) || 
                                voices.find(v => v.lang.includes('en')) || 
                                voices[0];
    }
}

if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadAdminVoices;
}
loadAdminVoices();

// Immediate click feedback using Web Audio API (no lag)
function playAdminClickSound() {
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

function speakWelcome() {
    if (welcomeSpoken) return;
    
    // Only proceed if not already speaking to avoid overlap
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    playAdminClickSound(); // Instant feedback
    welcomeSpoken = true;
    
    // Ensure voice is set
    if (!welcomeUtterance.voice) loadAdminVoices();
    
    window.speechSynthesis.speak(welcomeUtterance);
    
    // Remove listeners once we've successfully initiated speech
    overlay.removeEventListener('click', speakWelcome);
    document.removeEventListener('keydown', speakWelcome);
}

// Trigger voice on load and first interaction
window.addEventListener('load', () => {
    // Try to warm up
    loadAdminVoices();
    // Small delay to ensure voices are loaded
    setTimeout(() => {
        if (!welcomeSpoken) speakWelcome();
    }, 1500);
});

overlay.addEventListener('click', speakWelcome);
document.addEventListener('keydown', speakWelcome);


// Support Enter key for login
document.getElementById('admin-pass').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAccess();
});

// --- Data Management ---
const listContainer = document.getElementById('enquiry-list');
const emptyState = document.getElementById('empty-state');
const statsLine = document.getElementById('stats-line');

async function loadEnquiries() {
    let vault = [];
    
    if (window.db) {
        try {
            const snapshot = await window.db.collection('enquiries').orderBy('date', 'desc').get();
            vault = snapshot.docs.map(doc => {
                const data = doc.data();
                return { ...data, id: doc.id, internalId: data.id };
            });
            // Save to cache for optimistic UI updates
            localStorage.setItem('vibe_vault_cache', JSON.stringify(vault));
        } catch (error) {
            console.error("Firestore Load Error:", error);
            vault = JSON.parse(localStorage.getItem('vibe_vault') || '[]');
        }
    } else {
        vault = JSON.parse(localStorage.getItem('vibe_vault') || '[]');
        vault.reverse();
    }
    
    renderCards(vault);
}

function renderCards(vault) {
    const listContainer = document.getElementById('enquiry-list');
    const contractListContainer = document.getElementById('contract-list');
    const emptyState = document.getElementById('empty-state');
    const statsLine = document.getElementById('stats-line');
    const contractStatsLine = document.getElementById('contracts-stats-line');

    listContainer.innerHTML = '';
    contractListContainer.innerHTML = '';
    
    const activeLeads = vault.filter(item => item.contractClosed !== true);
    const closedContracts = vault.filter(item => item.contractClosed === true);

    statsLine.innerText = `// ${activeLeads.length} TRANSMISSIONS CAPTURED`;
    contractStatsLine.innerText = `// ${closedContracts.length} DEALS FINALIZED`;

    if (activeLeads.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'text-center py-40 opacity-20';
        empty.innerHTML = `
            <div class="text-8xl mb-4 font-black">EMPTY</div>
            <p class="font-mono tracking-widest uppercase">Waiting for the first vibe...</p>
        `;
        listContainer.appendChild(empty);
    }

    if (closedContracts.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'text-center py-20 opacity-20 font-mono uppercase tracking-widest';
        empty.innerText = 'No closed contracts yet.';
        contractListContainer.appendChild(empty);
    }

    vault.forEach(item => {
        const date = new Date(item.date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const card = document.createElement('div');
        card.className = 'glass p-8 md:p-10 rounded-[40px] border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden';
        card.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div class="text-[10px] text-primary font-mono tracking-widest uppercase mb-1">TRANSMISSION_ID: ${item.id}</div>
                    <h3 class="text-3xl font-black tracking-tighter">${item.name}</h3>
                    <div class="flex flex-wrap gap-x-4 gap-y-1">
                        <a href="mailto:${item.email}" class="text-white/40 hover:text-primary transition-colors text-sm font-medium">${item.email}</a>
                        <a href="tel:${item.countryCode}${item.phone}" class="text-white/40 hover:text-secondary transition-colors text-sm font-medium">${item.countryCode} ${item.phone}</a>
                        ${item.budget ? `<span class="text-primary text-sm font-black tracking-wide border-l border-white/10 pl-4">Budget: ${item.budget}</span>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-[10px] text-white/20 font-mono tracking-widest uppercase mb-1">RECEIVED_AT</div>
                    <div class="text-xl font-bold text-white/80">${date}</div>
                </div>
            </div>
            <div class="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p class="text-white/60 leading-relaxed font-light">${item.details}</p>
                <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <div class="flex flex-wrap gap-4">
                        ${(item.source === 'terminal' || item.source === 'terminal_flow') ? '<div class="text-[10px] text-primary/40 font-mono tracking-widest uppercase">Source: Terminal</div>' : ''}
                        ${item.referralCode ? `<div class="text-[10px] text-accent font-mono tracking-widest uppercase border border-accent/20 px-2 py-0.5 rounded">Referral: ${item.referralCode}</div>` : ''}
                    </div>
                    ${!item.contractClosed ? `
                        <button onclick="openContractModal('${item.id}', '${item.referralCode || ''}', '${item.affiliateId || ''}')" class="px-6 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-black text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border border-primary/20">Close Contract</button>
                    ` : `
                        <div class="text-[10px] text-green-400 font-mono tracking-widest uppercase border border-green-400/20 px-2 py-0.5 rounded">Contract Closed (₹${item.contractAmount})</div>
                    `}
                </div>
            </div>
        `;
        
        if (item.contractClosed) {
            contractListContainer.appendChild(card);
        } else {
            listContainer.appendChild(card);
        }
    });
}

async function clearVault() {
    if (confirm('CAUTION: THIS WILL WIPE ALL ENQUIRIES FROM THE CLOUD AND LOCAL STORAGE. PROCEED?')) {
        if (window.db) {
            try {
                const snapshot = await window.db.collection('enquiries').get();
                if (snapshot.size > 0) {
                    const batch = window.db.batch();
                    snapshot.docs.forEach((doc) => {
                        batch.delete(doc.ref);
                    });
                    await batch.commit();
                }
            } catch (error) {
                console.error("Firestore Clear Error:", error);
            }
        }
        localStorage.removeItem('vibe_vault');
        loadEnquiries();
    }
}

// Auto-check if already unlocked (session persistence simple mock)
if (sessionStorage.getItem('vibe_unlocked') === 'true') {
    overlay.style.display = 'none';
    loadEnquiries();
}

// Update checkAccess to set session
const originalCheck = checkAccess;
window.checkAccess = () => {
    const input = document.getElementById('admin-pass');
    if (input.value === PASS) {
        sessionStorage.setItem('vibe_unlocked', 'true');
    }
    originalCheck();
};

// Logout Functionality
function logout() {
    sessionStorage.removeItem('vibe_unlocked');
    window.location.reload();
}

// --- Tab System ---
// --- Tab System ---
window.switchTab = (tab) => {
    const enqSec = document.getElementById('enquiries-section');
    const conSec = document.getElementById('contracts-section');
    const affSec = document.getElementById('affiliates-section');
    const faqSec = document.getElementById('faqs-section');
    const blogSec = document.getElementById('blogs-section');
    
    const enqBtn = document.getElementById('tab-enquiries');
    const conBtn = document.getElementById('tab-contracts');
    const affBtn = document.getElementById('tab-affiliates');
    const faqBtn = document.getElementById('tab-faqs');
    const blogBtn = document.getElementById('tab-blogs');

    // Reset all
    [enqSec, conSec, affSec, faqSec, blogSec].forEach(s => { if (s) s.classList.add('hidden'); });
    [enqBtn, conBtn, affBtn, faqBtn, blogBtn].forEach(b => {
        if (b) {
            b.classList.replace('bg-primary', 'bg-white/5');
            b.classList.replace('text-black', 'text-white/40');
        }
    });

    if (tab === 'enquiries') {
        if (enqSec) enqSec.classList.remove('hidden');
        if (enqBtn) {
            enqBtn.classList.replace('bg-white/5', 'bg-primary');
            enqBtn.classList.replace('text-white/40', 'text-black');
        }
    } else if (tab === 'contracts') {
        if (conSec) conSec.classList.remove('hidden');
        if (conBtn) {
            conBtn.classList.replace('bg-white/5', 'bg-primary');
            conBtn.classList.replace('text-white/40', 'text-black');
        }
    } else if (tab === 'affiliates') {
        if (affSec) affSec.classList.remove('hidden');
        if (affBtn) {
            affBtn.classList.replace('bg-white/5', 'bg-primary');
            affBtn.classList.replace('text-white/40', 'text-black');
        }
        loadAffiliates();
    } else if (tab === 'faqs') {
        if (faqSec) faqSec.classList.remove('hidden');
        if (faqBtn) {
            faqBtn.classList.replace('bg-white/5', 'bg-primary');
            faqBtn.classList.replace('text-white/40', 'text-black');
        }
        loadFAQs();
    } else if (tab === 'blogs') {
        if (blogSec) blogSec.classList.remove('hidden');
        if (blogBtn) {
            blogBtn.classList.replace('bg-white/5', 'bg-primary');
            blogBtn.classList.replace('text-white/40', 'text-black');
        }
        loadBlogs();
    }
};

// --- Affiliate Management ---
const affListContainer = document.getElementById('affiliate-list');
const affStatsLine = document.getElementById('aff-stats-line');

async function loadAffiliates() {
    if (!window.db) return;
    try {
        const snapshot = await window.db.collection('affiliates').orderBy('dateJoined', 'desc').get();
        const affiliates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAffiliates(affiliates);
    } catch (error) {
        console.error("Affiliate Load Error:", error);
    }
}

function renderAffiliates(affiliates) {
    affListContainer.innerHTML = '';
    affStatsLine.innerText = `// ${affiliates.length} AGENTS ACTIVE`;

    affiliates.forEach(aff => {
        const card = document.createElement('div');
        card.className = 'glass p-8 rounded-[32px] border border-white/5 hover:border-secondary/30 transition-all';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h3 class="text-2xl font-black tracking-tighter">${aff.name}</h3>
                    <p class="text-white/40 text-sm font-medium">${aff.email}</p>
                </div>
                <div class="bg-secondary/10 text-secondary border border-secondary/20 px-4 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase">
                    ${aff.referralCode}
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-white/5 p-4 rounded-2xl">
                    <div class="text-[8px] text-white/20 uppercase font-bold mb-1">Referrals</div>
                    <div class="text-xl font-black">${aff.referralsCount || 0}</div>
                </div>
                <div class="bg-white/5 p-4 rounded-2xl">
                    <div class="text-[8px] text-white/20 uppercase font-bold mb-1">Pending</div>
                    <div class="text-xl font-black text-primary">₹${aff.pendingBalance || 0}</div>
                </div>
                <div class="bg-white/5 p-4 rounded-2xl">
                    <div class="text-[8px] text-white/20 uppercase font-bold mb-1">Total Paid</div>
                    <div class="text-xl font-black text-green-400">₹${aff.totalEarnings || 0}</div>
                </div>
            </div>
            <div class="mt-6 flex justify-between items-center">
                <button onclick="deleteAffiliate('${aff.id}', '${aff.name}')" class="text-[10px] text-red-400/40 hover:text-red-400 font-bold uppercase tracking-widest transition-colors">Terminate Agent</button>
                <button onclick="openPaymentModal('${aff.id}', '${aff.name}', ${aff.pendingBalance || 0})" class="px-5 py-2 bg-secondary/10 hover:bg-secondary text-secondary hover:text-black text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border border-secondary/20">Record Payment</button>
            </div>
        `;
        affListContainer.appendChild(card);
    });
}

window.deleteAffiliate = async function(id, name) {
    if (confirm(`CAUTION: TERMINATING AGENT "${name.toUpperCase()}". THIS WILL REMOVE THEM FROM THE NETWORK. PROCEED?`)) {
        try {
            if (window.db) {
                await window.db.collection('affiliates').doc(id).delete();
                alert('AGENT_TERMINATED: VAULT_UPDATED');
                loadAffiliates();
            }
        } catch (error) {
            console.error("Delete Affiliate Error:", error);
            alert('ERROR: TERMINATION_FAILED');
        }
    }
}

// --- Contract Management ---
let currentEnquiryId = null;
let currentReferralCode = null;
let currentAffiliateId = null;

window.openContractModal = (enquiryId, referralCode, affiliateId) => {
    currentEnquiryId = enquiryId;
    currentReferralCode = referralCode;
    currentAffiliateId = affiliateId;
    document.getElementById('contract-modal').classList.remove('hidden');
    document.getElementById('contract-amount').value = '';
    document.getElementById('contract-calc').classList.add('hidden');
};

window.closeContractModal = () => {
    document.getElementById('contract-modal').classList.add('hidden');
};

const contractInput = document.getElementById('contract-amount');
const contractCalc = document.getElementById('contract-calc');

contractInput.addEventListener('input', () => {
    const amount = parseFloat(contractInput.value) || 0;
    if (amount > 0) {
        contractCalc.classList.remove('hidden');
        const hasReferral = currentReferralCode || currentAffiliateId;
        const discount = hasReferral ? Math.round(amount * 0.05) : 0;
        const commission = hasReferral ? Math.round(amount * 0.10) : 0;
        const finalValue = amount - discount;

        document.getElementById('calc-gross').innerText = `₹${amount}`;
        document.getElementById('calc-discount').innerText = `-₹${discount}`;
        document.getElementById('calc-comm').innerText = `₹${commission}`;
        document.getElementById('calc-final').innerText = `₹${finalValue}`;
    } else {
        contractCalc.classList.add('hidden');
    }
});

document.getElementById('confirm-contract-btn').addEventListener('click', async () => {
    const amount = parseFloat(contractInput.value);
    if (!amount || amount <= 0) return;

    if (!currentEnquiryId) {
        alert('ERROR: SESSION_EXPIRED. RE-OPEN CONTRACT.');
        return;
    }

    const commission = (currentReferralCode || currentAffiliateId) ? Math.round(amount * 0.10) : 0;

    try {
        if (window.db) {
            // 1. Mark Enquiry as closed (use set with merge to be safe)
            await window.db.collection('enquiries').doc(currentEnquiryId).set({
                contractClosed: true,
                contractAmount: amount,
                commissionEarned: commission
            }, { merge: true });

            // 2. Create Contract record
            await window.db.collection('contracts').add({
                enquiryId: currentEnquiryId,
                amount: amount,
                referralCode: currentReferralCode || 'NONE',
                commission: commission,
                date: new Date().toISOString()
            });

            // 3. Update Affiliate balance if applicable
            if (currentAffiliateId || currentReferralCode) {
                if (currentAffiliateId) {
                    // DIRECT AUTOMATIC LOOKUP
                    const affDoc = await window.db.collection('affiliates').doc(currentAffiliateId).get();
                    if (affDoc.exists) {
                        const affData = affDoc.data();
                        await affDoc.ref.update({
                            referralsCount: (affData.referralsCount || 0) + 1,
                            pendingBalance: (affData.pendingBalance || 0) + commission
                        });
                    }
                } else if (currentReferralCode) {
                    // MANUAL CODE FALLBACK
                    const affSnapshot = await window.db.collection('affiliates')
                        .where('referralCode', '==', currentReferralCode)
                        .get();
                    
                    if (!affSnapshot.empty) {
                        const affDoc = affSnapshot.docs[0];
                        const affData = affDoc.data();
                        await affDoc.ref.update({
                            referralsCount: (affData.referralsCount || 0) + 1,
                            pendingBalance: (affData.pendingBalance || 0) + commission
                        });
                    }
                }
            }

            console.log("Transaction Success:", { enquiryId: currentEnquiryId, amount, commission });
            alert('CONTRACT_FINALIZED: DATA_SYNC_COMPLETE');
            closeContractModal();
            
            // 3. Optimistic UI Update: Update local vault and re-render immediately
            const vault = JSON.parse(localStorage.getItem('vibe_vault_cache') || '[]');
            const index = vault.findIndex(item => item.id === currentEnquiryId);
            if (index !== -1) {
                vault[index].contractClosed = true;
                vault[index].contractAmount = amount;
                vault[index].commissionEarned = commission;
                localStorage.setItem('vibe_vault_cache', JSON.stringify(vault));
                renderCards(vault);
            } else {
                // Fallback: Full reload if cache is missing
                loadEnquiries();
            }
            loadAffiliates();
        }
    } catch (error) {
        console.error("Contract finalize error:", error);
        alert(`SYSTEM_ERROR: TRANSACTION_FAILED\nReason: ${error.message}`);
    }
});

// --- Mobile Menu Toggle ---
const adminMenuToggle = document.getElementById('admin-menu-toggle');
const adminMobileMenu = document.getElementById('admin-mobile-menu');
let isMenuOpen = false;

window.toggleMobileMenu = () => {
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
        adminMobileMenu.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');
        adminMenuToggle.children[0].classList.add('rotate-45', 'translate-y-2');
        adminMenuToggle.children[1].classList.add('-rotate-45', '-translate-y-0', 'w-8');
    } else {
        adminMobileMenu.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
        adminMenuToggle.children[0].classList.remove('rotate-45', 'translate-y-2');
        adminMenuToggle.children[1].classList.remove('-rotate-45', '-translate-y-0', 'w-8');
    }
}

if (adminMenuToggle) {
    adminMenuToggle.addEventListener('click', toggleMobileMenu);
}

// --- Payment Modal Management ---
let currentPaymentAffId = null;
let currentAffUpi = null;
let currentAffName = null;
const paymentModal = document.getElementById('payment-modal');
const paymentInput = document.getElementById('payment-amount');
const upiSection = document.getElementById('upi-section');
const upiQr = document.getElementById('upi-qr');
const payViaAppBtn = document.getElementById('pay-via-app');

window.openPaymentModal = async (id, name, pending) => {
    currentPaymentAffId = id;
    currentAffName = name;
    document.getElementById('payment-agent-name').innerText = name;
    document.getElementById('payment-pending-hint').innerText = `PENDING: ₹${pending}`;
    paymentInput.value = '';
    upiSection.classList.add('hidden');
    paymentModal.classList.remove('hidden');

    // Fetch UPI ID
    if (window.db) {
        const doc = await window.db.collection('affiliates').doc(id).get();
        if (doc.exists) {
            currentAffUpi = doc.data().upiId;
        }
    }
};

paymentInput.addEventListener('input', () => {
    const amount = parseFloat(paymentInput.value);
    const warning = document.getElementById('upi-warning');
    
    if (amount > 0) {
        if (currentAffUpi) {
            // Construct UPI URI
            const upiUri = `upi://pay?pa=${currentAffUpi}&pn=${encodeURIComponent(currentAffName)}&am=${amount}&cu=INR&tn=Affiliate%20Payout`;
            
            // Update QR Code
            upiQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;
            
            // Update App Link
            payViaAppBtn.href = upiUri;
            
            upiSection.classList.remove('hidden');
            if (warning) warning.classList.add('hidden');
        } else {
            // Show missing UPI warning
            upiSection.classList.add('hidden');
            if (warning) {
                warning.innerText = "Agent has not provided a UPI ID. Payout must be handled manually.";
                warning.classList.remove('hidden');
            }
        }
    } else {
        upiSection.classList.add('hidden');
        if (warning) warning.classList.add('hidden');
    }
});

window.closePaymentModal = () => {
    paymentModal.classList.add('hidden');
};

document.getElementById('confirm-payment-btn').addEventListener('click', async () => {
    const payAmount = Math.round(parseFloat(paymentInput.value));
    if (!payAmount || payAmount <= 0) return;

    try {
        if (window.db && currentPaymentAffId) {
            const affRef = window.db.collection('affiliates').doc(currentPaymentAffId);
            const doc = await affRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                const newPending = Math.max(0, (data.pendingBalance || 0) - payAmount);
                const newTotalPaid = (data.totalEarnings || 0) + payAmount; // totalEarnings acts as 'Total Paid'

                await affRef.update({
                    pendingBalance: newPending,
                    totalEarnings: newTotalPaid
                });

                alert('PAYMENT_RECORDED: BALANCES_UPDATED');
                closePaymentModal();
                loadAffiliates();
            }
        }
    } catch (error) {
        console.error("Payment Record Error:", error);
        alert('SYSTEM_ERROR: PAYMENT_FAILED');
    }
});

// --- FAQ Management ---
async function loadFAQs() {
    if (!window.db) {
        const localFaqs = JSON.parse(localStorage.getItem('vibe_faqs') || '[]');
        renderFAQs(localFaqs);
        return;
    }
    
    try {
        const snapshot = await window.db.collection('faqs').orderBy('dateAsked', 'desc').get();
        const faqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderFAQs(faqs);
    } catch (error) {
        console.warn("Error loading FAQs from Firestore, falling back to LocalStorage:", error);
        const localFaqs = JSON.parse(localStorage.getItem('vibe_faqs') || '[]');
        renderFAQs(localFaqs);
    }
}

function renderFAQs(faqs) {
    const unansweredContainer = document.getElementById('unanswered-faq-list');
    const activeContainer = document.getElementById('active-faq-list');
    const statsLine = document.getElementById('faqs-stats-line');
    
    if (!unansweredContainer || !activeContainer) return;
    
    unansweredContainer.innerHTML = '';
    activeContainer.innerHTML = '';
    
    const unanswered = faqs.filter(faq => !faq.isAnswered);
    const active = faqs.filter(faq => faq.isAnswered);
    
    if (statsLine) {
        statsLine.innerText = `// ${faqs.length} QUESTIONS IN DATABASE`;
    }
    
    if (unanswered.length === 0) {
        unansweredContainer.innerHTML = `
            <div class="text-center py-20 opacity-20 font-mono uppercase tracking-widest bg-white/5 rounded-3xl border border-white/5">
                No new questions.
            </div>
        `;
    } else {
        unanswered.forEach(faq => {
            const date = new Date(faq.dateAsked).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });
            const card = document.createElement('div');
            card.className = 'glass p-8 rounded-[32px] border border-white/5 space-y-4 hover:border-primary/20 transition-all';
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-[10px] text-primary font-mono tracking-widest uppercase mb-1">// UNANSWERED</div>
                        <h4 class="text-xl font-bold tracking-tight text-white font-sans">Q: "${faq.question}"</h4>
                        <p class="text-white/40 text-xs mt-1 font-sans">Asked by: <span class="text-white/60">${faq.askedByName || 'Anonymous'}</span> | ${date}</p>
                    </div>
                </div>
                <div class="space-y-2">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-white/40">Write Answer</label>
                    <textarea id="answer-text-${faq.id}" class="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-primary text-white text-sm resize-none font-sans" rows="3" placeholder="Provide answer..."></textarea>
                </div>
                <div class="flex gap-4 pt-2">
                    <button onclick="deleteFAQ('${faq.id}')" class="px-5 py-2 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all">Delete</button>
                    <button onclick="submitFAQAnswer('${faq.id}')" class="flex-1 py-2 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-full hover:scale-105 transition-transform flex justify-center items-center gap-2">
                        <span>Answer & Approve</span>
                    </button>
                </div>
            `;
            unansweredContainer.appendChild(card);
        });
    }
    
    if (active.length === 0) {
        activeContainer.innerHTML = `
            <div class="text-center py-20 opacity-20 font-mono uppercase tracking-widest bg-white/5 rounded-3xl border border-white/5">
                No active FAQs.
            </div>
        `;
    } else {
        active.forEach(faq => {
            const date = new Date(faq.dateAsked).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });
            const card = document.createElement('div');
            card.className = 'glass p-8 rounded-[32px] border border-white/5 space-y-4 hover:border-secondary/20 transition-all';
            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start">
                        <div class="text-[10px] text-secondary font-mono tracking-widest uppercase mb-1">// ACTIVE FAQ</div>
                        <span class="px-3 py-0.5 ${faq.isApproved ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'} text-[8px] font-mono rounded-full uppercase">
                            ${faq.isApproved ? 'Public' : 'Hidden'}
                        </span>
                    </div>
                    <h4 class="text-lg font-bold tracking-tight text-white font-sans">Q: "${faq.question}"</h4>
                    <p class="text-white/40 text-xs mt-1 font-sans">Asked by: <span class="text-white/60">${faq.askedByName || 'Anonymous'}</span> | ${date}</p>
                </div>
                <div class="space-y-2">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-white/40">Edit Answer</label>
                    <textarea id="answer-text-${faq.id}" class="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-secondary text-white text-sm resize-none font-sans" rows="3">${faq.answer}</textarea>
                </div>
                <div class="flex gap-4 pt-2">
                    <button onclick="deleteFAQ('${faq.id}')" class="px-5 py-2 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all">Delete</button>
                    <button onclick="toggleFAQApproval('${faq.id}', ${faq.isApproved})" class="px-5 py-2 border border-white/10 hover:bg-white/5 text-white/60 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all">
                        ${faq.isApproved ? 'Hide/Unapprove' : 'Show/Approve'}
                    </button>
                    <button onclick="updateFAQAnswer('${faq.id}')" class="flex-1 py-2 bg-secondary text-black font-black uppercase tracking-widest text-[10px] rounded-full hover:scale-105 transition-transform flex justify-center items-center gap-2">
                        <span>Save Changes</span>
                    </button>
                </div>
            `;
            activeContainer.appendChild(card);
        });
    }
}

window.submitFAQAnswer = async function(id) {
    const answerInput = document.getElementById(`answer-text-${id}`);
    if (!answerInput) return;
    
    const answerText = answerInput.value.trim();
    if (!answerText) {
        alert("Please write an answer before submitting.");
        return;
    }
    
    let dbUpdated = false;
    try {
        if (window.db) {
            await window.db.collection('faqs').doc(id).update({
                answer: answerText,
                isAnswered: true,
                isApproved: true,
                dateAnswered: new Date().toISOString()
            });
            dbUpdated = true;
        }
    } catch (error) {
        console.warn("Firestore blocked or offline. Falling back to LocalStorage for write:", error);
    }
    
    if (!dbUpdated) {
        try {
            const localFaqs = JSON.parse(localStorage.getItem('vibe_faqs') || '[]');
            const index = localFaqs.findIndex(f => f.id.toString() === id.toString());
            if (index !== -1) {
                localFaqs[index].answer = answerText;
                localFaqs[index].isAnswered = true;
                localFaqs[index].isApproved = true;
                localFaqs[index].dateAnswered = new Date().toISOString();
                localStorage.setItem('vibe_faqs', JSON.stringify(localFaqs));
            }
        } catch (localError) {
            console.error("LocalStorage write failed:", localError);
            alert("Failed to save answer locally.");
            return;
        }
    }
    
    alert(dbUpdated ? "Answer submitted and approved on Cloud!" : "Answer saved locally (offline fallback)!");
    loadFAQs();
};

window.updateFAQAnswer = async function(id) {
    const answerInput = document.getElementById(`answer-text-${id}`);
    if (!answerInput) return;
    
    const answerText = answerInput.value.trim();
    if (!answerText) {
        alert("Please write an answer.");
        return;
    }
    
    let dbUpdated = false;
    try {
        if (window.db) {
            await window.db.collection('faqs').doc(id).update({
                answer: answerText
            });
            dbUpdated = true;
        }
    } catch (error) {
        console.warn("Firestore blocked or offline. Falling back to LocalStorage for update:", error);
    }
    
    if (!dbUpdated) {
        try {
            const localFaqs = JSON.parse(localStorage.getItem('vibe_faqs') || '[]');
            const index = localFaqs.findIndex(f => f.id.toString() === id.toString());
            if (index !== -1) {
                localFaqs[index].answer = answerText;
                localStorage.setItem('vibe_faqs', JSON.stringify(localFaqs));
            }
        } catch (localError) {
            console.error("LocalStorage write failed:", localError);
            alert("Failed to update answer locally.");
            return;
        }
    }
    
    alert(dbUpdated ? "FAQ answer updated on Cloud!" : "FAQ answer updated locally (offline fallback)!");
    loadFAQs();
};

window.toggleFAQApproval = async function(id, isApproved) {
    let dbUpdated = false;
    try {
        if (window.db) {
            await window.db.collection('faqs').doc(id).update({
                isApproved: !isApproved
            });
            dbUpdated = true;
        }
    } catch (error) {
        console.warn("Firestore blocked or offline. Falling back to LocalStorage for approval toggle:", error);
    }
    
    if (!dbUpdated) {
        try {
            const localFaqs = JSON.parse(localStorage.getItem('vibe_faqs') || '[]');
            const index = localFaqs.findIndex(f => f.id.toString() === id.toString());
            if (index !== -1) {
                localFaqs[index].isApproved = !isApproved;
                localStorage.setItem('vibe_faqs', JSON.stringify(localFaqs));
            }
        } catch (localError) {
            console.error("LocalStorage write failed:", localError);
            alert("Failed to toggle approval locally.");
            return;
        }
    }
    
    const statusText = !isApproved ? "visible (Public)" : "hidden (Private)";
    alert(dbUpdated ? `FAQ status updated to ${statusText} on Cloud!` : `FAQ status updated to ${statusText} locally (offline fallback)!`);
    loadFAQs();
};

window.deleteFAQ = async function(id) {
    if (confirm("ARE YOU SURE YOU WANT TO DELETE THIS FAQ? THIS ACTION IS PERMANENT.")) {
        let dbDeleted = false;
        try {
            if (window.db) {
                await window.db.collection('faqs').doc(id).delete();
                dbDeleted = true;
            }
        } catch (error) {
            console.warn("Firestore blocked or offline. Falling back to LocalStorage for deletion:", error);
        }
        
        try {
            const localFaqs = JSON.parse(localStorage.getItem('vibe_faqs') || '[]');
            const filtered = localFaqs.filter(f => f.id.toString() !== id.toString());
            localStorage.setItem('vibe_faqs', JSON.stringify(filtered));
        } catch (localError) {
            console.error("LocalStorage write failed:", localError);
            alert("Failed to delete FAQ locally.");
            return;
        }
        
        alert(dbDeleted ? "FAQ deleted from Cloud!" : "FAQ deleted locally!");
        loadFAQs();
    }
};

// --- Blogs & Documentations Management ---
let quill;
let currentBlogId = null;

// Initialize Quill
function initQuill() {
    if (!quill) {
        quill = new Quill('#blog-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'font': [] }, { 'size': [] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'script': 'sub'}, { 'script': 'super' }],
                    [{ 'header': '1'}, { 'header': '2'}, 'blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet'}, { 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'direction': 'rtl' }, { 'align': [] }],
                    ['link', 'image', 'video'],
                    ['clean']
                ]
            }
        });
    }
}

async function loadBlogs() {
    if (!window.db) return;
    try {
        const snapshot = await window.db.collection('blogs').orderBy('createdAt', 'desc').get();
        const blogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderBlogs(blogs);
    } catch (error) {
        console.error("Blogs Load Error:", error);
    }
}

function renderBlogs(blogs) {
    const listContainer = document.getElementById('blog-list');
    const statsLine = document.getElementById('blogs-stats-line');
    
    listContainer.innerHTML = '';
    statsLine.innerText = `// ${blogs.length} PUBLISHED POSTS`;

    if (blogs.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-20 opacity-20 font-mono uppercase tracking-widest bg-white/5 rounded-3xl border border-white/5 md:col-span-2">
                No blogs yet.
            </div>
        `;
        return;
    }

    blogs.forEach(blog => {
        const date = new Date(blog.createdAt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        const card = document.createElement('div');
        card.className = 'glass p-8 rounded-[32px] border border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between';
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-2xl font-black tracking-tighter truncate" title="${blog.title}">${blog.title}</h3>
                </div>
                <div class="text-white/40 text-xs font-mono mb-6">${date}</div>
                <div class="flex gap-6 mb-6">
                    <div class="text-center">
                        <div class="text-xl font-black text-primary">${blog.likes || 0}</div>
                        <div class="text-[8px] uppercase tracking-widest text-white/40 font-bold">Likes</div>
                    </div>
                    <div class="text-center">
                        <div class="text-xl font-black text-secondary">${blog.shares || 0}</div>
                        <div class="text-[8px] uppercase tracking-widest text-white/40 font-bold">Shares</div>
                    </div>
                    <div class="text-center cursor-pointer hover:bg-white/5 rounded-lg px-2 transition-colors" onclick="openCommentsModal('${blog.id}', '${blog.title.replace(/'/g, "\\\\'")}')">
                        <div class="text-xl font-black text-white">${blog.commentsCount || 0}</div>
                        <div class="text-[8px] uppercase tracking-widest text-white/40 font-bold">Comments</div>
                    </div>
                </div>
            </div>
            <div class="flex gap-4">
                <button onclick="editBlog('${blog.id}')" class="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] rounded-full transition-colors border border-white/10">Edit</button>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

window.openBlogEditor = function() {
    currentBlogId = null;
    document.getElementById('blog-modal-title').innerText = "New Blog";
    document.getElementById('blog-title').value = "";
    document.getElementById('delete-blog-btn').classList.add('hidden');
    initQuill();
    quill.root.innerHTML = "";
    document.getElementById('blog-modal').classList.remove('hidden');
};

window.editBlog = async function(id) {
    if (!window.db) return;
    try {
        const doc = await window.db.collection('blogs').doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            currentBlogId = id;
            document.getElementById('blog-modal-title').innerText = "Edit Blog";
            document.getElementById('blog-title').value = data.title || "";
            document.getElementById('delete-blog-btn').classList.remove('hidden');
            initQuill();
            quill.root.innerHTML = data.content || "";
            document.getElementById('blog-modal').classList.remove('hidden');
        }
    } catch (e) {
        console.error("Error fetching blog", e);
    }
};

window.closeBlogModal = function() {
    document.getElementById('blog-modal').classList.add('hidden');
};

window.saveBlog = async function() {
    const title = document.getElementById('blog-title').value.trim();
    if (!title) { alert("Please enter a title"); return; }
    const content = quill.root.innerHTML;
    if (quill.getText().trim().length === 0) { alert("Please enter some content"); return; }

    const blogData = {
        title: title,
        content: content,
        updatedAt: new Date().toISOString()
    };

    if (!window.db) return;
    const saveBtn = document.getElementById('save-blog-btn');
    saveBtn.innerText = "Publishing...";
    
    try {
        if (currentBlogId) {
            await window.db.collection('blogs').doc(currentBlogId).update(blogData);
        } else {
            blogData.createdAt = new Date().toISOString();
            blogData.likes = 0;
            blogData.shares = 0;
            blogData.commentsCount = 0;
            blogData.published = true;
            await window.db.collection('blogs').add(blogData);
        }
        closeBlogModal();
        loadBlogs();
    } catch (error) {
        console.error("Error saving blog", error);
        alert("Failed to save blog.");
    } finally {
        saveBtn.innerText = "Publish";
    }
};

window.deleteBlogModal = async function() {
    if (!currentBlogId) return;
    if (confirm("Are you sure you want to delete this post? This action is permanent.")) {
        try {
            await window.db.collection('blogs').doc(currentBlogId).delete();
            closeBlogModal();
            loadBlogs();
        } catch (e) {
            console.error("Error deleting blog", e);
            alert("Failed to delete blog.");
        }
    }
};

// --- Comments Management ---
let currentCommentsBlogId = null;

window.openCommentsModal = async function(blogId, blogTitle) {
    currentCommentsBlogId = blogId;
    document.getElementById('comments-blog-title').innerText = `// ${blogTitle}`;
    document.getElementById('comments-list').innerHTML = `<div class="text-white/40 text-center font-mono">Loading...</div>`;
    document.getElementById('comments-modal').classList.remove('hidden');
    loadComments(blogId);
};

window.closeCommentsModal = function() {
    document.getElementById('comments-modal').classList.add('hidden');
};

async function loadComments(blogId) {
    if (!window.db) return;
    try {
        const snapshot = await window.db.collection('blogComments')
            .where('blogId', '==', blogId)
            .orderBy('createdAt', 'desc')
            .get();
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderComments(comments);
    } catch (error) {
        console.error("Comments Load Error:", error);
        // Error here often means missing composite index for where+orderBy
        // We'll fallback to unsorted if it fails
        try {
            const snapshot2 = await window.db.collection('blogComments').where('blogId', '==', blogId).get();
            const comments = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            comments.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            renderComments(comments);
        } catch (e) {
             document.getElementById('comments-list').innerHTML = `<div class="text-red-400 text-center font-mono">Failed to load.</div>`;
        }
    }
}

function renderComments(comments) {
    const list = document.getElementById('comments-list');
    list.innerHTML = '';
    
    if (comments.length === 0) {
        list.innerHTML = `<div class="text-center py-10 opacity-20 font-mono uppercase tracking-widest bg-white/5 rounded-3xl border border-white/5">No comments yet.</div>`;
        return;
    }

    comments.forEach(comment => {
        const date = new Date(comment.createdAt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        
        let repliesHtml = '';
        if (comment.replies && comment.replies.length > 0) {
            repliesHtml = `<div class="mt-4 space-y-3 pl-4 border-l border-white/10">`;
            comment.replies.forEach(reply => {
                const rDate = new Date(reply.createdAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                });
                repliesHtml += `
                    <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                        <div class="flex justify-between items-start mb-2">
                            <span class="font-bold text-sm text-primary">${reply.author}</span>
                            <span class="text-[10px] text-white/40 font-mono">${rDate}</span>
                        </div>
                        <p class="text-white/80 text-sm">${reply.text}</p>
                    </div>
                `;
            });
            repliesHtml += `</div>`;
        }

        const div = document.createElement('div');
        div.className = 'glass p-6 rounded-[24px] border border-white/5';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-white text-lg">${comment.author}</span>
                <span class="text-[10px] text-white/40 font-mono">${date}</span>
            </div>
            <p class="text-white/80 mb-4">${comment.text}</p>
            
            ${repliesHtml}
            
            <div class="mt-4 flex gap-2">
                <input type="text" id="reply-input-${comment.id}" placeholder="Write a reply..." class="flex-1 bg-white/5 border border-white/10 py-2 px-4 rounded-xl outline-none focus:border-primary transition-all text-sm">
                <button onclick="replyToComment('${comment.id}')" class="px-6 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-black font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all border border-primary/20">Reply</button>
            </div>
        `;
        list.appendChild(div);
    });
}

window.replyToComment = async function(commentId) {
    const input = document.getElementById(`reply-input-${commentId}`);
    const text = input.value.trim();
    if (!text) return;
    
    if (!window.db) return;
    
    const reply = {
        author: 'Admin',
        text: text,
        createdAt: new Date().toISOString()
    };
    
    try {
        const commentRef = window.db.collection('blogComments').doc(commentId);
        const doc = await commentRef.get();
        if (doc.exists) {
            const data = doc.data();
            const replies = data.replies || [];
            replies.push(reply);
            await commentRef.update({ replies: replies });
            input.value = '';
            loadComments(currentCommentsBlogId); // Refresh list
        }
    } catch (e) {
        console.error("Failed to reply", e);
        alert("Failed to send reply");
    }
};
