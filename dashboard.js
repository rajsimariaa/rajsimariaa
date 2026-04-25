document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const userDashboard = document.getElementById('user-dashboard');
    const dashboardLoader = document.getElementById('dashboard-loader');
    const logoutBtn = document.getElementById('logout-btn');
    const ordersTbody = document.getElementById('orders-tbody');
    const userEmailDisplay = document.getElementById('user-email-display');
    
    // Stat elements
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statVerified = document.getElementById('stat-verified');

    firebase.auth().onAuthStateChanged((user) => {
        if (user && (user.emailVerified || user.email === 'rajsimariaa@gmail.com' || user.providerData[0].providerId === 'google.com')) {
            if (user.email === 'rajsimariaa@gmail.com') {
                window.location.href = 'admin.html';
                return;
            }
            
            // UI Transition
            dashboardLoader.style.opacity = '0';
            setTimeout(() => {
                dashboardLoader.style.display = 'none';
                userDashboard.style.display = 'flex';
                setTimeout(() => userDashboard.style.opacity = '1', 50);
            }, 500);

            if(userEmailDisplay) userEmailDisplay.textContent = user.email;
            loadUserOrders(user.email);
        } else {
            window.location.href = 'login.html';
        }
    });

    logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut();
    });

    function loadUserOrders(email) {
        db.collection('payments')
            .where('email', '==', email.toLowerCase().trim())
            .onSnapshot(snapshot => {
                ordersTbody.innerHTML = '';

                if (snapshot.empty) {
                    ordersTbody.innerHTML = '<tr><td colspan="5" class="px-8 py-20 text-center text-slate-500 font-medium italic">No assets found. Visit the shop to get started!</td></tr>';
                    updateStats(0, 0, 0);
                    return;
                }

                const docs = [];
                let pendingCount = 0;
                let verifiedCount = 0;

                snapshot.forEach(doc => {
                    const data = doc.data();
                    docs.push({ id: doc.id, ...data });
                    if (data.status === 'verified') verifiedCount++;
                    else pendingCount++;
                });

                updateStats(docs.length, pendingCount, verifiedCount);

                docs.sort((a, b) => {
                    const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                    const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
                    return timeB - timeA;
                });

                docs.forEach(data => {
                    const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'Just now';
                    const isVerified = data.status === 'verified';
                    
                    const statusBadge = isVerified 
                        ? `<span class="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Verified</span>`
                        : `<span class="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Pending</span>`;

                    let actionHtml = '';
                    if (isVerified && data.fileUrl) {
                        actionHtml = `
                            <a href="${data.fileUrl}" target="_blank" class="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:scale-105 transition-transform shadow-lg shadow-white/5">
                                <i data-lucide="download" class="w-3 h-3"></i> Download
                            </a>`;
                    } else if (!isVerified) {
                        actionHtml = `
                            <button onclick="cancelOrder('${data.id}')" class="text-xs font-bold text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-widest">
                                Cancel
                            </button>`;
                    }

                    const tr = document.createElement('tr');
                    tr.className = "hover:bg-white/[0.02] transition-colors group";
                    tr.innerHTML = `
                        <td class="px-8 py-6 text-sm text-slate-400 font-medium">${date}</td>
                        <td class="px-8 py-6">
                            <div class="font-bold text-white group-hover:text-cyan transition-colors">${data.product || 'Coffee'}</div>
                            <div class="text-[10px] text-slate-600 font-mono mt-1">${data.id.substring(0,8)}...</div>
                        </td>
                        <td class="px-8 py-6 text-center font-bold text-slate-300 italic">₹${data.amount}</td>
                        <td class="px-8 py-6 text-center">${statusBadge}</td>
                        <td class="px-8 py-6 text-right">${actionHtml}</td>
                    `;
                    ordersTbody.appendChild(tr);
                });
                lucide.createIcons();
            });
    }

    function updateStats(total, pending, verified) {
        if(statTotal) statTotal.textContent = total;
        if(statPending) statPending.textContent = pending;
        if(statVerified) statVerified.textContent = verified;
    }

    window.cancelOrder = async (id) => {
        if (confirm('Permanently cancel this order request?')) {
            try {
                await db.collection('payments').doc(id).delete();
            } catch (error) {
                alert("Action failed: " + error.message);
            }
        }
    }
});
