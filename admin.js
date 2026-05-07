// --- Auth System ---
const PASS = 'BayMax';
const overlay = document.getElementById('login-overlay');

function checkAccess() {
    const input = document.getElementById('admin-pass');
    if (input.value === PASS) {
        overlay.style.display = 'none';
        loadEnquiries();
    } else {
        alert('ACCESS DENIED: INCORRECT VIBE CODE');
        input.value = '';
    }
}

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
            vault = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Firestore Load Error:", error);
            // Fallback if rules are not set yet
            vault = JSON.parse(localStorage.getItem('vibe_vault') || '[]');
        }
    } else {
        vault = JSON.parse(localStorage.getItem('vibe_vault') || '[]');
        vault.reverse(); // Newest first for localStorage
    }
    
    renderCards(vault);
}

function renderCards(vault) {
    listContainer.innerHTML = '';
    
    if (vault.length === 0) {
        listContainer.appendChild(emptyState);
        statsLine.innerText = '// 0 TRANSMISSIONS CAPTURED';
        return;
    }

    emptyState.remove();
    statsLine.innerText = `// ${vault.length} TRANSMISSIONS CAPTURED`;

    vault.forEach(item => {
        const date = new Date(item.date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const card = document.createElement('div');
        card.className = 'glass p-8 md:p-10 rounded-[32px] border border-white/5 hover:border-primary/30 transition-all group';
        card.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div class="text-[10px] text-primary font-mono tracking-widest uppercase mb-1">TRANSMISSION_ID: ${item.id}</div>
                    <h3 class="text-3xl font-black tracking-tighter">${item.name}</h3>
                    <a href="mailto:${item.email}" class="text-white/40 hover:text-primary transition-colors text-sm font-medium">${item.email}</a>
                </div>
                <div class="text-right">
                    <div class="text-[10px] text-white/20 font-mono tracking-widest uppercase mb-1">RECEIVED_AT</div>
                    <div class="text-xl font-bold text-white/80">${date}</div>
                </div>
            </div>
            <div class="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p class="text-white/60 leading-relaxed font-light">${item.details}</p>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

function clearVault() {
    if (confirm('CAUTION: THIS WILL WIPE ALL ENQUIRIES. PROCEED?')) {
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
