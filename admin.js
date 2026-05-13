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
                        <button onclick="openContractModal('${item.id}', '${item.referralCode || ''}')" class="px-6 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-black text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border border-primary/20">Close Contract</button>
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
window.switchTab = (tab) => {
    const enqSec = document.getElementById('enquiries-section');
    const conSec = document.getElementById('contracts-section');
    const affSec = document.getElementById('affiliates-section');
    
    const enqBtn = document.getElementById('tab-enquiries');
    const conBtn = document.getElementById('tab-contracts');
    const affBtn = document.getElementById('tab-affiliates');

    // Reset all
    [enqSec, conSec, affSec].forEach(s => s.classList.add('hidden'));
    [enqBtn, conBtn, affBtn].forEach(b => {
        b.classList.replace('bg-primary', 'bg-white/5');
        b.classList.replace('text-black', 'text-white/40');
    });

    if (tab === 'enquiries') {
        enqSec.classList.remove('hidden');
        enqBtn.classList.replace('bg-white/5', 'bg-primary');
        enqBtn.classList.replace('text-white/40', 'text-black');
    } else if (tab === 'contracts') {
        conSec.classList.remove('hidden');
        conBtn.classList.replace('bg-white/5', 'bg-primary');
        conBtn.classList.replace('text-white/40', 'text-black');
    } else {
        affSec.classList.remove('hidden');
        affBtn.classList.replace('bg-white/5', 'bg-primary');
        affBtn.classList.replace('text-white/40', 'text-black');
        loadAffiliates();
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

window.openContractModal = (enquiryId, referralCode) => {
    currentEnquiryId = enquiryId;
    currentReferralCode = referralCode;
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
        const discount = currentReferralCode ? Math.round(amount * 0.05) : 0;
        const commission = currentReferralCode ? Math.round(amount * 0.10) : 0;
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

    const commission = currentReferralCode ? Math.round(amount * 0.10) : 0;

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
            if (currentReferralCode) {
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
