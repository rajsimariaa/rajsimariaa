document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const adminDashboard = document.getElementById('admin-dashboard');
    const logoutBtn = document.getElementById('logout-btn');
    const navItems = document.querySelectorAll('.admin-nav-item');
    const views = document.querySelectorAll('.admin-view');
    const uploadForm = document.getElementById('upload-form');
    const uploadStatus = document.getElementById('upload-status');
    const paymentsTbody = document.getElementById('payments-tbody');
    const worksGrid = document.getElementById('works-grid');

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
            navItems.forEach(nav => nav.classList.remove('active'));
            views.forEach(view => view.style.display = 'none');
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';
        });
    });

    function loadPayments() {
        db.collection('payments').onSnapshot(snapshot => {
            paymentsTbody.innerHTML = '';

            const docs = [];
            snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));

            docs.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
                return timeB - timeA;
            });

            docs.forEach(data => {
                const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'Just now';
                const statusClass = data.status === 'verified' ? 'status-verified' : 'status-pending';
                const statusText = data.status === 'verified' ? 'Verified' : 'Pending';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${date}</td>
                    <td>${data.name}<br><small>${data.email}</small></td>
                    <td>${data.product || 'Coffee'}</td>
                    <td>₹${data.amount}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="work-actions">
                            ${data.status !== 'verified' ? `<button class="action-btn" style="color:var(--cyan); background:rgba(34,211,238,0.1)" onclick="verifyOrder('${data.id}', '${data.productId}')">Verify</button>` : ''}
                            <button class="action-btn btn-delete" onclick="deleteOrder('${data.id}')"><i data-lucide="trash-2" style="width:14px;"></i></button>
                        </div>
                    </td>
                `;
                paymentsTbody.appendChild(tr);
            });
            lucide.createIcons();
        });
    }

    window.verifyOrder = async (paymentId, productId) => {
        if (!confirm('Mark as verified? User will receive their download link.')) return;

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
            alert("Error verifying: " + error.message);
        }
    }

    window.deleteOrder = async (id) => {
        if (confirm('Permanently delete this order record?')) {
            await db.collection('payments').doc(id).delete();
        }
    }

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('work-title').value;
        const desc = document.getElementById('work-desc').value;
        const price = document.getElementById('work-price').value;
        const fileUrl = document.getElementById('work-file-url').value;

        uploadStatus.textContent = 'Saving to Database...';

        try {
            await db.collection('works').add({
                title,
                description: desc,
                price: Number(price),
                fileUrl: fileUrl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            uploadStatus.style.color = "var(--emerald)";
            uploadStatus.textContent = 'Work added successfully!';
            uploadForm.reset();
            setTimeout(() => { uploadStatus.textContent = ''; }, 3000);
        } catch (error) {
            uploadStatus.style.color = "#ef4444";
            uploadStatus.textContent = `Error: ${error.message}`;
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
                div.className = 'work-item';
                div.innerHTML = `
                    <h3>${data.title}</h3>
                    <p>${data.description}</p>
                    <div class="work-price">₹${data.price}</div>
                    <div class="work-actions">
                        <button class="action-btn btn-delete" onclick="deleteWork('${data.id}')">Delete Product</button>
                    </div>
                `;
                worksGrid.appendChild(div);
            });
            lucide.createIcons();
        });
    }

    window.deleteWork = async (id) => {
        if (confirm('Delete this product?')) {
            await db.collection('works').doc(id).delete();
        }
    }
});
