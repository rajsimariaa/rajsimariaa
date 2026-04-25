document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const adminDashboard = document.getElementById('admin-dashboard');
    const logoutBtn = document.getElementById('logout-btn');
    const navItems = document.querySelectorAll('.sidebar-item');
    const views = document.querySelectorAll('.admin-view');
    const uploadForm = document.getElementById('upload-form');
    const uploadStatus = document.getElementById('upload-status');
    const paymentsTbody = document.getElementById('payments-tbody');
    const worksGrid = document.getElementById('works-grid');

    // Stats
    const statRev = document.getElementById('stat-rev');
    const statOrders = document.getElementById('stat-orders');
    const statPending = document.getElementById('stat-admin-pending');
    const statVerified = document.getElementById('stat-admin-verified');

    firebase.auth().onAuthStateChanged((user) => {
        if (user && user.email === 'rajsimariaa@gmail.com') {
            adminDashboard.style.display = 'flex';
            loadPayments();
            loadWorks();
        } else {
            window.location.href = 'login.html';
        }
    });

    logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut();
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            if(!targetId) return;

            navItems.forEach(nav => nav.classList.remove('active'));
            views.forEach(view => view.classList.add('hidden'));
            
            item.classList.add('active');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    function loadPayments() {
        db.collection('payments').onSnapshot(snapshot => {
            paymentsTbody.innerHTML = '';
            let totalRev = 0;
            let pendingCount = 0;
            let verifiedCount = 0;

            const docs = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                docs.push({ id: doc.id, ...data });
                if (data.status === 'verified') {
                    totalRev += Number(data.amount || 0);
                    verifiedCount++;
                } else {
                    pendingCount++;
                }
            });

            if(statRev) statRev.textContent = `₹${totalRev.toLocaleString()}`;
            if(statOrders) statOrders.textContent = docs.length;
            if(statPending) statPending.textContent = pendingCount;
            if(statVerified) statVerified.textContent = verifiedCount;

            docs.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
                return timeB - timeA;
            });

            docs.forEach(data => {
                const date = data.timestamp ? data.timestamp.toDate().toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Just now';
                const isVerified = data.status === 'verified';
                
                const statusBadge = isVerified 
                    ? `<span class="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Verified</span>`
                    : `<span class="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20 pulse">Pending</span>`;

                const tr = document.createElement('tr');
                tr.className = "hover:bg-white/[0.02] transition-colors group";
                tr.innerHTML = `
                    <td class="px-8 py-6 text-slate-500 font-medium">${date}</td>
                    <td class="px-8 py-6">
                        <div class="font-bold text-white">${data.name}</div>
                        <div class="text-[10px] text-slate-500 lowercase">${data.email}</div>
                    </td>
                    <td class="px-8 py-6 font-bold text-slate-300">${data.product || 'Coffee'}</td>
                    <td class="px-8 py-6 text-center font-black text-cyan italic text-lg">₹${data.amount}</td>
                    <td class="px-8 py-6 text-center">${statusBadge}</td>
                    <td class="px-8 py-6 text-right">
                        <div class="flex items-center justify-end gap-3">
                            ${!isVerified ? `<button class="text-xs font-black text-cyan hover:bg-cyan/10 px-3 py-2 rounded-lg border border-cyan/20 transition-all uppercase tracking-tighter" onclick="verifyOrder('${data.id}', '${data.productId}')">Approve</button>` : ''}
                            <button class="text-slate-600 hover:text-red-500 transition-colors" onclick="deleteOrder('${data.id}')"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </td>
                `;
                paymentsTbody.appendChild(tr);
            });
            lucide.createIcons();
        });
    }

    window.verifyOrder = async (paymentId, productId) => {
        if (!confirm('Authorize this transaction? Product access will be granted.')) return;

        try {
            let fileUrl = '';
            if (productId) {
                const productDoc = await db.collection('works').doc(productId).get();
                if (productDoc.exists) {
                    fileUrl = productDoc.data().fileUrl;
                }
            }

            await db.collection('payments').doc(paymentId).update({
                status: 'verified',
                fileUrl: fileUrl
            });
        } catch (error) {
            alert("Approval failed: " + error.message);
        }
    }

    window.deleteOrder = async (id) => {
        if (confirm('Permanently scrub this record?')) {
            await db.collection('payments').doc(id).delete();
        }
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('work-title').value;
        const desc = document.getElementById('work-desc').value;
        const price = document.getElementById('work-price').value;
        const fileUrl = document.getElementById('work-file-url').value;

        uploadStatus.textContent = 'Synchronizing...';
        uploadStatus.className = "text-sm font-bold text-cyan";

        try {
            await db.collection('works').add({
                title,
                description: desc,
                price: Number(price),
                fileUrl: fileUrl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            uploadStatus.textContent = 'Asset deployed successfully.';
            uploadStatus.className = "text-sm font-bold text-emerald-500";
            uploadForm.reset();
            setTimeout(() => { uploadStatus.textContent = ''; }, 3000);
        } catch (error) {
            uploadStatus.textContent = `Deployment Error: ${error.message}`;
            uploadStatus.className = "text-sm font-bold text-red-500";
        }
    });

    function loadWorks() {
        db.collection('works').onSnapshot(snapshot => {
            worksGrid.innerHTML = '';

            const docs = [];
            snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));

            docs.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
                return timeB - timeA;
            });

            docs.forEach(data => {
                const div = document.createElement('div');
                div.className = 'glass-panel p-8 flex flex-col group hover:border-cyan/30 transition-all duration-500';
                div.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="font-black text-xl group-hover:text-cyan transition-colors">${data.title}</h3>
                        <div class="text-cyan font-black italic">₹${data.price}</div>
                    </div>
                    <p class="text-slate-500 text-sm mb-8 flex-1">${data.description}</p>
                    <div class="flex items-center justify-between pt-6 border-t border-white/5">
                        <span class="text-[10px] font-mono text-slate-700">${data.id}</span>
                        <button class="text-xs font-black text-red-500/40 hover:text-red-500 uppercase tracking-widest transition-colors" onclick="deleteWork('${data.id}')">Remove</button>
                    </div>
                `;
                worksGrid.appendChild(div);
            });
            lucide.createIcons();
        });
    }

    window.deleteWork = async (id) => {
        if (confirm('Purge this asset from the catalog?')) {
            await db.collection('works').doc(id).delete();
        }
    }
});
