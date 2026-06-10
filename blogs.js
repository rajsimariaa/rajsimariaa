// blogs.js
const isPostPage = window.location.pathname.includes('blog-post.html');
const urlParams = new URLSearchParams(window.location.search);
const currentBlogId = urlParams.get('id');

window.addEventListener('DOMContentLoaded', () => {
    if (isPostPage) {
        if (!currentBlogId) {
            window.location.href = 'blogs.html';
            return;
        }
        loadSingleBlog(currentBlogId);
        loadComments(currentBlogId);
    } else {
        loadAllBlogs();
    }
});

async function loadAllBlogs() {
    if (!window.db) return;
    try {
        const snapshot = await window.db.collection('blogs')
            .where('published', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
            
        const blogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderBlogsList(blogs);
    } catch (error) {
        console.error("Error loading blogs:", error);
        // Fallback if index missing
        try {
            const snapshot = await window.db.collection('blogs').get();
            let blogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            blogs = blogs.filter(b => b.published).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            renderBlogsList(blogs);
        } catch(e) {
            document.getElementById('loading-state').innerText = "FAILED TO LOAD TRANSMISSIONS.";
        }
    }
}

function renderBlogsList(blogs) {
    document.getElementById('loading-state').classList.add('hidden');
    const container = document.getElementById('blogs-container');
    container.classList.remove('hidden');
    container.innerHTML = '';

    if (blogs.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-20 opacity-20 font-mono uppercase tracking-widest bg-white/5 rounded-3xl border border-white/5">
                No transmissions found.
            </div>
        `;
        return;
    }

    blogs.forEach(blog => {
        const date = new Date(blog.createdAt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        
        // Extract plain text for preview
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = blog.content;
        const plainText = tempDiv.textContent || tempDiv.innerText || "";
        
        const card = document.createElement('a');
        card.href = `blog-post.html?id=${blog.id}`;
        card.className = 'glass p-8 rounded-[32px] border border-white/5 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.1)] transition-all group block cursor-pointer flex flex-col h-full';
        card.innerHTML = `
            <div class="flex-1">
                <div class="text-[10px] text-primary font-mono tracking-widest uppercase mb-4">// ${date}</div>
                <h3 class="text-3xl font-black tracking-tighter mb-4 group-hover:text-primary transition-colors">${blog.title}</h3>
                <p class="text-white/60 text-sm leading-relaxed mb-6 truncate-2-lines">${plainText}</p>
            </div>
            <div class="pt-6 border-t border-white/5 flex gap-6 mt-auto">
                <div class="flex items-center gap-2 text-white/40">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    <span class="text-xs font-bold">${blog.likes || 0}</span>
                </div>
                <div class="flex items-center gap-2 text-white/40">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <span class="text-xs font-bold">${blog.commentsCount || 0}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Single Post Logic
async function loadSingleBlog(id) {
    if (!window.db) return;
    try {
        const doc = await window.db.collection('blogs').doc(id).get();
        if (doc.exists) {
            const blog = doc.data();
            document.getElementById('loading-state').classList.add('hidden');
            document.getElementById('blog-article').classList.remove('hidden');
            
            document.title = `${blog.title} | Vibe Vault`;
            document.getElementById('blog-title').innerText = blog.title;
            const date = new Date(blog.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
            document.getElementById('blog-date').innerText = `// ${date}`;
            document.getElementById('blog-content').innerHTML = blog.content;
            document.getElementById('likes-count').innerText = blog.likes || 0;
            
            // Check if liked already
            if (localStorage.getItem(`liked_${id}`)) {
                document.getElementById('like-btn').classList.add('text-primary');
            }
        } else {
            document.getElementById('loading-state').innerText = "TRANSMISSION NOT FOUND.";
        }
    } catch (e) {
        console.error("Error loading post", e);
        document.getElementById('loading-state').innerText = "SYSTEM ERROR.";
    }
}

window.likeBlog = async function() {
    if (!currentBlogId || !window.db) return;
    if (localStorage.getItem(`liked_${currentBlogId}`)) return; // Already liked

    try {
        const btn = document.getElementById('like-btn');
        btn.classList.add('text-primary', 'scale-110');
        setTimeout(() => btn.classList.remove('scale-110'), 200);
        
        const countEl = document.getElementById('likes-count');
        let currentLikes = parseInt(countEl.innerText);
        countEl.innerText = currentLikes + 1;
        
        localStorage.setItem(`liked_${currentBlogId}`, 'true');

        await window.db.collection('blogs').doc(currentBlogId).update({
            likes: firebase.firestore.FieldValue.increment(1)
        });
    } catch (e) {
        console.error("Failed to like", e);
    }
};

window.shareBlog = async function() {
    const url = window.location.href;
    try {
        if (navigator.share) {
            await navigator.share({
                title: document.title,
                url: url
            });
        } else {
            await navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        }
        
        if (window.db && currentBlogId) {
            await window.db.collection('blogs').doc(currentBlogId).update({
                shares: firebase.firestore.FieldValue.increment(1)
            });
        }
    } catch (e) {
        console.error("Share failed", e);
    }
};

// Comments Logic
async function loadComments(blogId) {
    if (!window.db) return;
    try {
        const snapshot = await window.db.collection('blogComments')
            .where('blogId', '==', blogId)
            .orderBy('createdAt', 'desc')
            .get();
            
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPostComments(comments);
    } catch (e) {
        console.error("Error loading comments", e);
        try {
            const snapshot2 = await window.db.collection('blogComments').where('blogId', '==', blogId).get();
            const comments = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            comments.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            renderPostComments(comments);
        } catch(e2) {
             document.getElementById('comments-list').innerHTML = `<div class="text-red-400 font-mono">Failed to load comments.</div>`;
        }
    }
}

function renderPostComments(comments) {
    const list = document.getElementById('comments-list');
    document.getElementById('comments-count').innerText = `(${comments.length})`;
    list.innerHTML = '';
    
    if (comments.length === 0) {
        list.innerHTML = `<div class="text-center py-10 opacity-20 font-mono uppercase tracking-widest bg-white/5 rounded-3xl border border-white/5">Be the first to share your thoughts.</div>`;
        return;
    }

    comments.forEach(comment => {
        const date = new Date(comment.createdAt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        
        let repliesHtml = '';
        if (comment.replies && comment.replies.length > 0) {
            repliesHtml = `<div class="mt-6 space-y-4 pl-6 border-l-2 border-white/10">`;
            comment.replies.forEach(reply => {
                const rDate = new Date(reply.createdAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                });
                repliesHtml += `
                    <div class="bg-white/5 p-5 rounded-2xl border border-primary/20 relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                        <div class="flex justify-between items-start mb-2">
                            <span class="font-bold text-sm text-primary flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                                ${reply.author}
                            </span>
                            <span class="text-[10px] text-white/40 font-mono">${rDate}</span>
                        </div>
                        <p class="text-white/80 text-sm leading-relaxed">${reply.text}</p>
                    </div>
                `;
            });
            repliesHtml += `</div>`;
        }

        const div = document.createElement('div');
        div.className = 'glass p-6 md:p-8 rounded-[32px] border border-white/5';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="font-bold text-white text-lg">${comment.author}</span>
                <span class="text-[10px] text-white/40 font-mono">${date}</span>
            </div>
            <p class="text-white/80 mb-2 leading-relaxed">${comment.text}</p>
            ${repliesHtml}
        `;
        list.appendChild(div);
    });
}

window.submitComment = async function() {
    if (!currentBlogId || !window.db) return;
    
    const authorInput = document.getElementById('comment-author');
    const textInput = document.getElementById('comment-text');
    
    const author = authorInput.value.trim() || 'Anonymous';
    const text = textInput.value.trim();
    
    if (!text) {
        alert("Please enter a comment.");
        return;
    }
    
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "POSTING...";
    
    try {
        await window.db.collection('blogComments').add({
            blogId: currentBlogId,
            author: author,
            text: text,
            createdAt: new Date().toISOString(),
            replies: []
        });
        
        await window.db.collection('blogs').doc(currentBlogId).update({
            commentsCount: firebase.firestore.FieldValue.increment(1)
        });
        
        authorInput.value = '';
        textInput.value = '';
        loadComments(currentBlogId);
    } catch (e) {
        console.error("Failed to post comment", e);
        alert("Failed to post comment.");
    } finally {
        btn.innerText = originalText;
    }
};
