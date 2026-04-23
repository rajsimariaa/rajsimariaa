document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const userDashboard = document.getElementById('user-dashboard');
    const dashboardLoader = document.getElementById('dashboard-loader');
    const logoutBtn = document.getElementById('logout-btn');
    const ordersTbody = document.getElementById('orders-tbody');

    firebase.auth().onAuthStateChanged((user) => {
        if (user && (user.emailVerified || user.email === 'rajsimariaa@gmail.com')) {
            if (user.email === 'rajsimariaa@gmail.com') {
                window.location.href = 'admin.html';
                return;
            }
            dashboardLoader.style.display = 'none';
            userDashboard.style.display = 'flex';
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
                    ordersTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-muted);">No orders found. Buy something from the shop!</td></tr>';
                    return;
                }

                const docs = [];
                snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));

                // Manual sort by timestamp desc
                docs.sort((a, b) => {
                    const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
                    const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
                    return timeB - timeA;
                });

                docs.forEach(data => {
                    const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'Just now';
                    const statusClass = data.status === 'verified' ? 'status-verified' : 'status-pending';
                    const statusText = data.status === 'verified' ? 'Verified' : 'Pending Verification';

                    const tr = document.createElement('tr');

                    let actionHtml = '';
                    if (data.status === 'verified' && data.fileUrl) {
                        actionHtml = `<a href="${data.fileUrl}" target="_blank" class="product-link"><i data-lucide="download"></i> Download</a>`;
                    } else if (data.status !== 'verified') {
                        actionHtml = `<button class="cancel-btn" onclick="cancelOrder('${data.id}')">Cancel & Delete</button>`;
                    }

                    tr.innerHTML = `
                        <td>${date}</td>
                        <td>${data.product || 'Coffee'}</td>
                        <td>₹${data.amount}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${actionHtml}</td>
                    `;
                    ordersTbody.appendChild(tr);
                });
                lucide.createIcons();
            }, error => {
                console.error("Error loading orders:", error);
                if (error.code === 'failed-precondition') {
                    ordersTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Indexing in progress. Please wait a few minutes.</td></tr>';
                }
            });
    }

    window.cancelOrder = async (id) => {
        if (confirm('Are you sure you want to cancel and delete this order?')) {
            try {
                await db.collection('payments').doc(id).delete();
            } catch (error) {
                alert("Error deleting order: " + error.message);
            }
        }
    }
});
