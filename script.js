// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAwk9nj-PBU7K6BRIwde2gaiTsm-LcGxoE",
    authDomain: "car7ps.firebaseapp.com",
    projectId: "car7ps",
    storageBucket: "car7ps.firebasestorage.app",
    messagingSenderId: "196399922356",
    appId: "1:196399922356:web:f234ab0c42ddb3998f6be1",
    measurementId: "G-R7PN3FNPHT"
};

let auth = null;

// قائمة بريد المسؤولين المصرح لهم
const ADMIN_EMAILS = [
    'admin@realmadrid.com',
    'admin@example.com',
    'admin@cr7.com',
];

// دالة للتحقق من أن المستخدم مسؤول
function isAdminEmail(email) {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Initialize Firebase Compat gracefully
let db = null;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

// Global Helper to convert YouTube Watch URL to Embed URL
function convertToEmbedUrl(url) {
    if (!url) return '';
    try {
        if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
            let videoId = '';
            if (url.includes('v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('/live/')) {
                videoId = url.split('/live/')[1].split('?')[0];
            } else if (url.includes('/shorts/')) {
                videoId = url.split('/shorts/')[1].split('?')[0];
            } else if (url.includes('/embed/')) {
                if (!url.includes('enablejsapi=1')) {
                    const separator = url.includes('?') ? '&' : '?';
                    return `${url}${separator}enablejsapi=1&autoplay=1&mute=1`;
                }
                return url;
            }
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1`;
            }
        }
    } catch (e) {
        console.error('Error converting URL:', e);
    }
    return url;
}

// --- GLOBAL ADMIN FUNCTIONS (Defined EARLY to ensure availability) ---

window.openAddNewsModal = function () {
    const newsForm = document.getElementById('newsForm');
    const newsModal = document.getElementById('newsModal');
    const newsModalTitle = document.getElementById('newsModalTitle');
    const articleIdInput = document.getElementById('articleId');

    if (!newsModal) console.error('newsModal NOT FOUND IN DOM!');

    if (newsForm) newsForm.reset();
    if (articleIdInput) articleIdInput.value = '';
    if (newsModalTitle) newsModalTitle.textContent = 'إضافة خبر جديد';

    if (newsModal) {
        newsModal.classList.add('active');
        // Standardized high-priority visibility logic
        newsModal.style.setProperty('display', 'flex', 'important');
        newsModal.style.setProperty('z-index', '100000', 'important');
        newsModal.style.setProperty('visibility', 'visible', 'important');
        newsModal.style.setProperty('opacity', '1', 'important');
    }
};

window.openEditNewsModal = async function (id) {
    console.log('Global openEditNewsModal called for ID:', id);
    if (!id) return;

    // Ensure DB is available
    if (typeof db === 'undefined' || !db) {
        if (typeof firebase !== 'undefined') db = firebase.firestore();
    }

    if (!db) {
        alert('جاري تحميل قاعدة البيانات... يرجى المحاولة بعد ثوانٍ.');
        return;
    }

    try {
        const doc = await db.collection('news').doc(id).get();
        if (doc.exists) {
            const n = doc.data();
            const newsModal = document.getElementById('newsModal');
            const newsModalTitle = document.getElementById('newsModalTitle');

            const articleIdInput = document.getElementById('articleId');
            const articleTitleInput = document.getElementById('articleTitle');
            const articleExcerptInput = document.getElementById('articleExcerpt');
            const articleImgInput = document.getElementById('articleImg');
            const articleLinkInput = document.getElementById('articleLink');

            if (articleIdInput) articleIdInput.value = id;
            if (articleTitleInput) articleTitleInput.value = n.title || '';
            if (articleExcerptInput) articleExcerptInput.value = n.excerpt || '';
            if (articleImgInput) articleImgInput.value = n.img || '';
            if (articleLinkInput) articleLinkInput.value = n.link || n.id || '';

            if (newsModalTitle) newsModalTitle.textContent = 'تعديل الخبر';

            if (newsModal) {
                newsModal.classList.add('active');
                newsModal.style.setProperty('display', 'flex', 'important');
                newsModal.style.setProperty('z-index', '100000', 'important');
                newsModal.style.setProperty('visibility', 'visible', 'important');
                newsModal.style.setProperty('opacity', '1', 'important');
            }
        } else {
            alert('الخبر غير موجود.');
        }
    } catch (error) {
        console.error("Error fetching news for edit:", error);
        alert('حدث خطأ أثناء جلب بيانات الخبر: ' + error.message);
    }
};

window.deleteNews = async function (id) {
    if (!id) return;

    // Ensure DB is available
    if (typeof db === 'undefined' || !db) {
        if (typeof firebase !== 'undefined') db = firebase.firestore();
    }

    if (!db) {
        alert('خطأ: قاعدة البيانات غير متصلة. يرجى تحديث الصفحة.');
        return;
    }
    if (!confirm('هل أنت متأكد من حذف هذا الخبر؟')) return;
    try {
        await db.collection('news').doc(id).delete();
        alert('تم الحذف بنجاح');
        // Reload to refresh list
        location.reload();
    } catch (error) {
        console.error("Error deleting news:", error);
        alert('حدث خطأ أثناء الحذف: ' + error.message);
    }
};

console.log("Admin Global Functions Initialized");

window.openAddWallpaperModal = function () {
    const wallpaperForm = document.getElementById('wallpaperForm');
    const wallpaperModal = document.getElementById('wallpaperModal');
    const wallpaperModalTitle = document.getElementById('wallpaperModalTitle');

    if (wallpaperForm) wallpaperForm.reset();
    if (wallpaperModalTitle) wallpaperModalTitle.textContent = 'إضافة خلفية جديدة';

    if (wallpaperModal) {
        wallpaperModal.classList.add('active');
        // Standardized high-priority visibility logic
        wallpaperModal.style.setProperty('display', 'flex', 'important');
        wallpaperModal.style.setProperty('z-index', '100000', 'important');
        wallpaperModal.style.setProperty('visibility', 'visible', 'important');
        wallpaperModal.style.setProperty('opacity', '1', 'important');
    }
};

window.deleteWallpaper = async function (id) {
    if (!id) return;
    if (confirm('هل أنت متأكد من حذف هذه الخلفية؟')) {
        try {
            await db.collection('wallpapers').doc(id).delete();
            alert('تم الحذف بنجاح');
            location.reload();
        } catch (error) {
            console.error("Error deleting wallpaper:", error);
            alert("حدث خطأ أثناء الحذف");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {

    // --- Core Admin & UI Elements Consolidation ---
    const adminDashboard = document.getElementById('adminDashboard');
    const closeDashboardBtn = document.getElementById('closeDashboard');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const adminEmailDisplay = document.getElementById('adminEmailDisplay');
    const adminPlayersCount = document.getElementById('adminPlayersCount');
    const heroSubscribeBtn = document.getElementById('heroSubscribeBtn');

    const adminHeroImage = document.getElementById('adminHeroImage');
    const adminTeamDesc = document.getElementById('adminTeamDesc');
    const saveSiteConfigBtn = document.getElementById('saveSiteConfigBtn');
    const siteConfigMsg = document.getElementById('siteConfigMsg');

    const serversListContainer = document.getElementById('serversListContainer');
    const addServerBtn = document.getElementById('addServerBtn');
    const saveStreamUrlBtn = document.getElementById('saveStreamUrlBtn');
    const streamSaveMsg = document.getElementById('streamSaveMsg');
    const streamServerSelector = document.getElementById('streamServerSelector');
    const streamVideo = document.getElementById('streamVideo');
    const streamFrame = document.getElementById('streamFrame');
    const streamModal = document.getElementById('streamModal');
    const closeStreamBtn = document.getElementById('closeStream');

    const matchStatusToggle = document.getElementById('matchStatusToggle');
    const matchStatusText = document.getElementById('matchStatusText');
    const fallbackChannelsGroup = document.getElementById('fallbackChannelsGroup');
    const newsStreamUrlInput = document.getElementById('newsStreamUrl');
    const docStreamUrlInput = document.getElementById('docStreamUrl');

    const adminPlayersTableBody = document.getElementById('adminPlayersTableBody');
    const playerModal = document.getElementById('playerModal');
    const playerForm = document.getElementById('playerForm');
    const openAddPlayerModalBtn = document.getElementById('openAddPlayerModal');
    const closePlayerModalBtn = document.getElementById('closePlayerModal');
    const cancelPlayerBtn = document.getElementById('cancelPlayerBtn');
    const playerModalTitle = document.getElementById('playerModalTitle');

    const adminNewsTableBody = document.getElementById('adminNewsTableBody');
    const newsModal = document.getElementById('newsModal');
    const newsForm = document.getElementById('newsForm');
    const newsModalTitle = document.getElementById('newsModalTitle');
    const openAddNewsModalBtn = document.getElementById('openAddNewsModal');
    const closeNewsModalBtn = document.getElementById('closeNewsModal');
    const cancelNewsBtn = document.getElementById('cancelNewsBtn');

    const heroMainImage = document.querySelector('.hero-main-image');
    const teamSectionDesc = document.querySelector('.team-section .section-header p');

    // --- News Listeners ---
    // The main Add News button uses onclick="window.openAddNewsModal()" in HTML.
    // We can also attach a listener here as a double-guarantee.
    if (openAddNewsModalBtn) {
        openAddNewsModalBtn.addEventListener('click', (e) => {
            // No need to preventDefault if we want the onclick to fire too, 
            // but let's just make sure it calls the global function if available.
            console.log('Listener: Open Add News Modal');
        });
    }

    closeNewsModalBtn?.addEventListener('click', () => {
        if (newsModal) {
            newsModal.classList.remove('active');
            newsModal.style.display = '';
        }
    });

    cancelNewsBtn?.addEventListener('click', () => {
        if (newsModal) {
            newsModal.classList.remove('active');
            newsModal.style.display = '';
        }
    });

    newsModal?.addEventListener('click', (e) => {
        if (e.target === newsModal) {
            newsModal.classList.remove('active');
            newsModal.style.display = '';
        }
    });

    // FAQ Accordion Logic
    const faqButtons = document.querySelectorAll('.faq-btn');

    faqButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const isActive = item.classList.contains('active');

            document.querySelectorAll('.faq-item').forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Simple Entrance Animation using Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';

                const counter = entry.target.querySelector('.counter-number');
                if (counter) {
                    startCounter(counter);
                }

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    function startCounter(el) {
        const target = +el.getAttribute('data-target');
        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentVal = Math.floor(easeOutQuart * target);
            el.innerText = currentVal;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.innerText = target;
            }
        }
        requestAnimationFrame(update);
    }

    const animatedElements = document.querySelectorAll('.hero-text, .logos-grid, .devices-mockup, .faq-item, .special-trophy-item');
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        observer.observe(el);
    });

    // Slider Navigation Logic
    const scrollContainer = document.querySelector('.horizontal-scroll');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (scrollContainer && prevBtn && nextBtn) {
        const cardWidth = 300;
        const updateArrowState = () => {
            const scrollLeft = Math.abs(scrollContainer.scrollLeft);
            const scrollWidth = scrollContainer.scrollWidth;
            const clientWidth = scrollContainer.clientWidth;
            prevBtn.classList.toggle('disabled', scrollLeft <= 1);
            nextBtn.classList.toggle('disabled', scrollLeft + clientWidth >= scrollWidth - 5);
        };

        nextBtn.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: cardWidth, behavior: 'smooth' });
        });

        scrollContainer.addEventListener('scroll', updateArrowState);
        updateArrowState();
    }

    // --- Team & Position Logic ---
    const teamTabBtns = document.querySelectorAll('.tab-btn');
    const posFilterBtns = document.querySelectorAll('.pos-btn');
    const teamTracks = document.querySelectorAll('.team-track');
    const starsScrollContainer = document.querySelector('.team-scroll-container');
    const starsNextBtn = document.getElementById('starsNextBtn');

    let allPlayersData = { first: [], youth: [], women: [] };
    let currentTeam = 'first';
    let currentPosition = 'all';

    function renderFilteredPlayers() {
        const track = document.getElementById(`${currentTeam}-team`);
        if (!track || !starsScrollContainer) return;

        let players = allPlayersData[currentTeam] || [];
        if (currentPosition !== 'all') {
            players = players.filter(p => p.role === currentPosition);
        }

        const html = [...players, ...players, ...players].map(p => createPlayerCard(p)).join('');
        track.innerHTML = html || `<p class="no-results">لا يوجد لاعبين في هذا المركز حالياً.</p>`;

        starsScrollContainer.style.scrollBehavior = 'auto';
        requestAnimationFrame(() => {
            const setWidth = track.scrollWidth / 3;
            starsScrollContainer.scrollLeft = -setWidth;
            setTimeout(() => { starsScrollContainer.style.scrollBehavior = 'smooth'; }, 50);
        });
    }

    const fetchAllPlayers = async () => {
        if (!db) return;
        try {
            const snapshot = await db.collection('players').get();
            const data = { first: [], youth: [], women: [] };

            snapshot.forEach(doc => {
                const p = doc.data();
                if (data[p.team]) {
                    data[p.team].push(p);
                }
            });

            allPlayersData = data;
            renderFilteredPlayers();

        } catch (error) {
            console.error("Error fetching all players:", error);
        }
    };

    function createPlayerCard(p) {
        return `
            <div class="player-card">
                <div class="player-img">
                    <span class="player-number">${p.number}</span>
                    <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/200'">
                </div>
                <div class="player-info">
                    <h3>${p.name}</h3>
                    <span>${p.role}</span>
                </div>
            </div>`;
    }

    function updateActiveStates() {
        teamTabBtns.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-team') === currentTeam));
        posFilterBtns.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-pos') === currentPosition));
        teamTracks.forEach(track => track.classList.toggle('active', track.id === `${currentTeam}-team`));
    }

    teamTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentTeam = btn.getAttribute('data-team');
            updateActiveStates();
            renderFilteredPlayers();
        });
    });

    posFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentPosition = btn.getAttribute('data-pos');
            updateActiveStates();
            renderFilteredPlayers();
        });
    });

    // Initial load
    fetchAllPlayers();

    // Infinity Logic
    const handleInfinityJump = () => {
        if (!starsScrollContainer) return;
        const track = starsScrollContainer.querySelector('.team-track.active');
        if (!track || !track.innerHTML || track.querySelector('.no-results')) return;

        const setWidth = track.scrollWidth / 3;
        const scrollLeft = starsScrollContainer.scrollLeft;

        if (scrollLeft > -10) {
            starsScrollContainer.style.scrollBehavior = 'auto';
            starsScrollContainer.scrollLeft = scrollLeft - setWidth;
            void starsScrollContainer.offsetHeight;
            starsScrollContainer.style.scrollBehavior = 'smooth';
        } else if (Math.abs(scrollLeft) + starsScrollContainer.clientWidth >= (setWidth * 2) + 10) {
            starsScrollContainer.style.scrollBehavior = 'auto';
            starsScrollContainer.scrollLeft = scrollLeft + setWidth;
            void starsScrollContainer.offsetHeight;
            starsScrollContainer.style.scrollBehavior = 'smooth';
        }
    };

    let autoPlayInterval;
    const startAutoPlay = () => {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            starsScrollContainer.scrollBy({ left: -230, behavior: 'smooth' });
        }, 3000);
    };
    const stopAutoPlay = () => clearInterval(autoPlayInterval);

    if (starsScrollContainer && starsPrevBtn && starsNextBtn) {
        starsNextBtn.addEventListener('click', () => {
            starsScrollContainer.scrollBy({ left: -230, behavior: 'smooth' });
            startAutoPlay();
        });
        starsPrevBtn.addEventListener('click', () => {
            starsScrollContainer.scrollBy({ left: 230, behavior: 'smooth' });
            startAutoPlay();
        });
        starsScrollContainer.addEventListener('scroll', handleInfinityJump);
        starsScrollContainer.addEventListener('mouseenter', stopAutoPlay);
        starsScrollContainer.addEventListener('mouseleave', startAutoPlay);
        startAutoPlay();
    }

    // Sticky Header
    const header = document.querySelector('.main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

    // --- Authentication Flow ---
    const authModal = document.getElementById('authModal');
    const loginLink = document.querySelector('.login-link');
    const closeAuth = document.getElementById('closeAuth');
    const authForm = document.getElementById('authForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const btnText = authSubmitBtn?.querySelector('.btn-text');
    const authLoader = document.getElementById('authLoader');
    const authError = document.getElementById('authError');

    let currentAuthTab = 'login';

    const toggleAuthModal = (show) => {
        authModal?.classList.toggle('active', show);
        if (!show) authForm?.reset();
    };

    loginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        if (auth?.currentUser) {
            auth.signOut();
        } else {
            toggleAuthModal(true);
        }
    });


    closeAuth?.addEventListener('click', () => toggleAuthModal(false));

    const displayNameGroup = document.getElementById('displayNameGroup');
    const displayNameInput = document.getElementById('displayName');
    const forgotPasswordWrapper = document.getElementById('forgotPasswordWrapper');
    const authSuccess = document.getElementById('authSuccess');
    const passwordGroup = document.getElementById('passwordGroup');
    const passwordInput = document.getElementById('password');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLoginLink = document.getElementById('backToLoginLink');

    let isResetPasswordMode = false;

    const toggleResetPasswordMode = (isReset) => {
        isResetPasswordMode = isReset;

        // Toggle UI elements
        if (passwordGroup) passwordGroup.style.display = isReset ? 'none' : '';
        if (passwordInput) passwordInput.required = !isReset;

        if (forgotPasswordLink) forgotPasswordLink.style.display = isReset ? 'none' : 'inline';
        if (backToLoginLink) backToLoginLink.style.display = isReset ? 'inline' : 'none';

        // Update button text
        if (btnText) btnText.textContent = isReset ? 'إرسال الرابط' : 'دخول';

        // Clear messages
        if (authError) authError.textContent = '';
        if (authSuccess) authSuccess.textContent = '';
    };

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            currentAuthTab = tab.dataset.tab;
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Reset reset password mode when switching tabs
            toggleResetPasswordMode(false);

            // Update button text
            if (btnText) btnText.textContent = currentAuthTab === 'login' ? 'دخول' : 'تسجيل';

            // Show/hide display name field
            if (displayNameGroup) {
                displayNameGroup.style.display = currentAuthTab === 'register' ? 'block' : 'none';
                if (displayNameInput) {
                    displayNameInput.required = currentAuthTab === 'register';
                }
            }

            // Show/hide forgot password link wrapper
            if (forgotPasswordWrapper) {
                forgotPasswordWrapper.style.display = currentAuthTab === 'login' ? 'block' : 'none';
            }
        });
    });

    // Forgot Password Link Handler
    forgotPasswordLink?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleResetPasswordMode(true);
    });

    // Back to Login Link Handler
    backToLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        toggleResetPasswordMode(false);
    });

    authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth) return;

        authError.textContent = '';
        if (authSuccess) authSuccess.textContent = '';
        authLoader.style.display = 'block';
        if (btnText) btnText.style.display = 'none';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const displayName = displayNameInput?.value.trim();

        try {
            // Check if in Reset Password Mode
            if (isResetPasswordMode) {
                await auth.sendPasswordResetEmail(email);
                if (authSuccess) {
                    authSuccess.textContent = 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني';
                }
                // Stay in reset mode or maybe switch back? Let's stay to show success message.
            } else {
                // Normal Login/Register Flow
                let userCredential;
                if (currentAuthTab === 'login') {
                    userCredential = await auth.signInWithEmailAndPassword(email, password);
                } else {
                    // Create new account
                    userCredential = await auth.createUserWithEmailAndPassword(email, password);

                    // Set display name if provided
                    if (displayName && userCredential.user) {
                        await userCredential.user.updateProfile({
                            displayName: displayName
                        });
                    }
                }

                // Sync User to Firestore (users collection) for Admin List
                if (userCredential && userCredential.user) {
                    const usr = userCredential.user;
                    db.collection('users').doc(usr.uid).set({
                        email: usr.email,
                        displayName: usr.displayName || displayName || 'مستخدم', // Fallback
                        lastLogin: new Date(),
                        joinedAt: usr.metadata.creationTime || new Date()
                    }, { merge: true }).catch(err => console.warn('User sync failed', err));
                }

                // Check admin and redirect/close modal logic...
                const user = userCredential.user;
                if (isAdminEmail(user.email)) {
                    localStorage.setItem('isAdmin', 'true');
                    localStorage.setItem('adminEmail', user.email);
                    toggleAuthModal(false);
                    showAdminDashboard(user.email);
                } else {
                    toggleAuthModal(false);
                }
            }

        } catch (error) {
            console.error('Auth error:', error);
            let errorMsg = 'خطأ في العملية، يرجى التحقق من البيانات';

            if (isResetPasswordMode) {
                // Reset Password Specific Errors
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMsg = 'البريد الإلكتروني غير مسجل';
                        break;
                    case 'auth/invalid-email':
                        errorMsg = 'البريد الإلكتروني غير صحيح';
                        break;
                }
            } else {
                // Login/Register Errors
                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMsg = 'البريد الإلكتروني غير صحيح';
                        break;
                    case 'auth/user-disabled':
                        errorMsg = 'هذا الحساب معطل';
                        break;
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                        break;
                    case 'auth/email-already-in-use':
                        errorMsg = 'هذا البريد مستخدم بالفعل';
                        break;
                    case 'auth/weak-password':
                        errorMsg = 'كلمة المرور ضعيفة جداً';
                        break;
                }
            }

            // Common Errors
            switch (error.code) {
                case 'auth/too-many-requests':
                    errorMsg = 'تم تجاوز عدد المحاولات، يرجى المحاولة لاحقاً';
                    break;
            }

            authError.textContent = errorMsg;
        } finally {
            authLoader.style.display = 'none';
            if (btnText) btnText.style.display = 'inline';
        }
    });

    // Forgot Password Handler
    // REMOVED: This logic is now integrated into authForm submit handler and toggleResetPasswordMode
    // const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    // forgotPasswordLink?.addEventListener('click', async (e) => {
    //     e.preventDefault();

    //     const emailInput = document.getElementById('email');
    //     const email = emailInput?.value.trim();

    //     if (!email) {
    //         authError.textContent = 'يرجى إدخال البريد الإلكتروني أولاً';
    //         return;
    //     }

    //     if (!auth) return;

    //     authError.textContent = '';
    //     if (authSuccess) authSuccess.textContent = '';

    //     try {
    //         await auth.sendPasswordResetEmail(email);
    //         if (authSuccess) {
    //             authSuccess.textContent = 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني';
    //         }
    //     } catch (error) {
    //         console.error('Password reset error:', error);
    //         let errorMsg = 'حدث خطأ أثناء إرسال رابط إعادة التعيين';

    //         switch (error.code) {
    //             case 'auth/user-not-found':
    //                 errorMsg = 'البريد الإلكتروني غير مسجل';
    //                 break;
    //             case 'auth/invalid-email':
    //                 errorMsg = 'البريد الإلكتروني غير صحيح';
    //                 break;
    //             case 'auth/too-many-requests':
    //                 errorMsg = 'تم تجاوز عدد المحاولات، يرجى المحاولة لاحقاً';
    //                 break;
    //         }

    //         authError.textContent = errorMsg;
    //     }
    // });

    if (auth) {
        auth.onAuthStateChanged((user) => {
            const loginLink = document.querySelector('.login-link');
            const profileContainer = document.getElementById('profileContainer');
            const profileDropdownName = document.getElementById('profileDropdownName');
            const profileDropdownEmail = document.getElementById('profileDropdownEmail');
            const adminDashboardLink = document.getElementById('adminDashboardLink');
            const heroTag = document.querySelector('.hero-text .tag');
            const heroSubscribeBtn = document.getElementById('heroSubscribeBtn');
            const promoSliderSection = document.getElementById('promoSliderSection');
            const latestSection = document.getElementById('latest-section');
            const teamSection = document.getElementById('teamSection');
            const programsSection = document.getElementById('programs-section');
            const devicesSection = document.getElementById('devicesSection');
            const scoresWidgetContainer = document.getElementById('scoresWidgetContainer');
            const wallpapersSection = document.getElementById('wallpapersSection');
            const faqSection = document.querySelector('.faq-section');
            const searchBtn = document.getElementById('searchBtn');
            const searchModal = document.getElementById('searchModal');

            if (user) {
                // User is logged in - hide login link, show profile icon
                if (loginLink) loginLink.style.display = 'none';
                if (profileContainer) {
                    profileContainer.classList.add('active');

                    // Update profile info
                    const userName = user.displayName || user.email.split('@')[0];
                    if (profileDropdownName) profileDropdownName.textContent = userName;
                    if (profileDropdownEmail) profileDropdownEmail.textContent = user.email;

                    // Show admin dashboard link if user is admin
                    if (isAdminEmail(user.email) && adminDashboardLink) {
                        adminDashboardLink.style.display = 'flex';
                    }

                    // Update hero section text
                    if (heroTag) {
                        // Keep the SVG icon and update only the text
                        const svgIcon = heroTag.querySelector('svg');
                        heroTag.innerHTML = `مرحبا <span class="user-highlight">${userName}</span> بك في كار7`;
                        if (svgIcon) {
                            heroTag.appendChild(svgIcon);
                        }
                    }

                    // Update subscribe button text
                    if (heroSubscribeBtn) {
                        heroSubscribeBtn.textContent = 'شاهد البث الآن';
                    }

                    // Hide Promo, Programs & Devices when logged in
                    if (promoSliderSection) promoSliderSection.style.display = 'none';
                    if (programsSection) programsSection.style.display = 'none';
                    if (devicesSection) devicesSection.style.display = 'none';
                    if (faqSection) faqSection.style.display = 'none';

                    // Show News, Team & Scores when logged in
                    if (latestSection) latestSection.style.display = 'block';
                    if (teamSection) teamSection.style.display = 'block';
                    if (scoresWidgetContainer) scoresWidgetContainer.style.display = 'block';

                    // Show Wallpapers Section
                    if (wallpapersSection) wallpapersSection.style.display = 'block';

                    // Show Search Button
                    if (searchBtn) searchBtn.style.display = 'flex';
                }
            } else {
                // User is logged out - show login link, hide profile icon
                if (loginLink) loginLink.style.display = 'block';
                if (profileContainer) profileContainer.classList.remove('active');

                // Hide admin dashboard link
                if (adminDashboardLink) adminDashboardLink.style.display = 'none';

                // Restore original hero section text
                if (heroTag) {
                    const svgIcon = heroTag.querySelector('svg');
                    heroTag.innerHTML = `اشتراك كار7`;
                    if (svgIcon) {
                        heroTag.appendChild(svgIcon);
                    }
                }

                // Restore original subscribe button text
                if (heroSubscribeBtn) {
                    heroSubscribeBtn.textContent = 'اشترك الآن';
                }

                // Show Promo, Programs & Devices when logged out
                if (promoSliderSection) promoSliderSection.style.display = 'block';
                if (programsSection) programsSection.style.display = 'block';
                if (devicesSection) devicesSection.style.display = 'block';
                if (faqSection) faqSection.style.display = 'block';

                // Hide News, Team & Scores when logged out
                if (latestSection) latestSection.style.display = 'none';
                if (teamSection) teamSection.style.display = 'none';
                if (scoresWidgetContainer) scoresWidgetContainer.style.display = 'none';

                // Hide Wallpapers Section
                if (wallpapersSection) wallpapersSection.style.display = 'none';

                // Hide Search Button & Modal
                if (searchBtn) searchBtn.style.display = 'none';
                if (searchModal) {
                    searchModal.classList.remove('active');
                    searchModal.style.setProperty('display', 'none', 'important');
                }
            }
        });
    }

    // --- Wallpapers Slider Logic ---
    const wallpapersScroll = document.getElementById('wallpapersScroll');
    const wallpapersPrevBtn = document.getElementById('wallpapersPrevBtn');
    const wallpapersNextBtn = document.getElementById('wallpapersNextBtn');
    const wallpapersTrack = document.getElementById('wallpapersTrack');

    // Lightbox Elements
    const imagePreviewModal = document.getElementById('imagePreviewModal');
    const lightboxImage = document.getElementById('lightboxImage');
    const closeLightboxBtn = document.getElementById('closeLightboxBtn');
    const lightboxDownloadBtn = document.getElementById('lightboxDownloadBtn');
    let currentPreviewUrl = '';
    let currentPreviewTitle = '';

    // State
    let currentWallpaperMode = 'mobile'; // 'mobile' or 'desktop'

    // Force Download Helper
    const forceDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to direct link
            window.open(url, '_blank');
        }
    };
    // Make it global
    window.downloadWallpaper = (url, title) => {
        const ext = url.split('.').pop().split('?')[0] || 'jpg';
        const filename = `${title}_${currentWallpaperMode}.${ext}`;
        forceDownload(url, filename);
    };

    // Open Lightbox
    window.openImagePreview = (url, title) => {
        if (!imagePreviewModal) return;
        currentPreviewUrl = url;
        currentPreviewTitle = title;

        lightboxImage.src = url;
        imagePreviewModal.classList.add('active');
    };

    // Close Lightbox
    if (closeLightboxBtn) {
        closeLightboxBtn.addEventListener('click', () => {
            imagePreviewModal.classList.remove('active');
        });
    }

    if (imagePreviewModal) {
        imagePreviewModal.addEventListener('click', (e) => {
            if (e.target === imagePreviewModal) {
                imagePreviewModal.classList.remove('active');
            }
        });
    }

    // Lightbox Download Action
    if (lightboxDownloadBtn) {
        lightboxDownloadBtn.addEventListener('click', () => {
            if (currentPreviewUrl) {
                window.downloadWallpaper(currentPreviewUrl, currentPreviewTitle);
            }
        });
    }

    // Dynamic Rendering for Public
    const renderWallpapers = async () => {
        if (!wallpapersTrack || !db) return;
        try {
            const snapshot = await db.collection('wallpapers').orderBy('timestamp', 'desc').get();
            if (snapshot.empty) {
                wallpapersTrack.innerHTML = '<p style="padding: 20px; color: #888;">لا توجد خلفيات حالياً.</p>';
                return;
            }

            let html = '';
            let hasItems = false;

            snapshot.forEach(doc => {
                const w = doc.data();
                const mobileUrl = w.mobileImageUrl || w.imageUrl;
                const desktopUrl = w.desktopImageUrl;

                // Determine URL based on mode
                let targetUrl = '';
                if (currentWallpaperMode === 'mobile') {
                    targetUrl = mobileUrl;
                } else {
                    targetUrl = desktopUrl;
                }

                // Skip if no image for current mode
                if (!targetUrl) return;

                hasItems = true;

                html += `
                    <div class="content-card wallpaper-card ${currentWallpaperMode}">
                        <div class="card-img" onclick="openImagePreview('${targetUrl}', '${w.title}')" style="cursor: pointer;">
                            <img src="${targetUrl}" alt="${w.title}" onerror="this.src='https://via.placeholder.com/300x450'">
                            <div class="overlay-opacity"></div>
                        </div>
                        <div class="card-info">
                            <h3>${w.title}</h3>
                            <button class="btn-download" onclick="downloadWallpaper('${targetUrl}', '${w.title}')">
                                <i class="fas fa-download"></i> تحميل
                            </button>
                        </div>
                    </div>`;
            });

            if (!hasItems) {
                wallpapersTrack.innerHTML = '<p style="padding: 20px; color: #888;">لا توجد خلفيات لهذا الوضع.</p>';
            } else {
                wallpapersTrack.innerHTML = html;
            }

        } catch (error) {
            console.error("Error rendering wallpapers:", error);
        }
    };

    // Filter Buttons Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update mode and re-render
            const mode = btn.getAttribute('data-mode');
            if (mode) {
                currentWallpaperMode = mode;
                renderWallpapers();
            }
        });
    });



    if (wallpapersScroll && wallpapersPrevBtn && wallpapersNextBtn) {
        const cardWidth = 300;
        const updateArrowState = () => {
            const scrollLeft = Math.abs(wallpapersScroll.scrollLeft);
            const scrollWidth = wallpapersScroll.scrollWidth;
            const clientWidth = wallpapersScroll.clientWidth;
            wallpapersPrevBtn.classList.toggle('disabled', scrollLeft <= 1);
            wallpapersNextBtn.classList.toggle('disabled', scrollLeft + clientWidth >= scrollWidth - 5);
        };

        wallpapersNextBtn.addEventListener('click', () => {
            wallpapersScroll.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        });

        wallpapersPrevBtn.addEventListener('click', () => {
            wallpapersScroll.scrollBy({ left: cardWidth, behavior: 'smooth' });
        });

        wallpapersScroll.addEventListener('scroll', updateArrowState);
        updateArrowState();
    }

    // Call render on load
    renderWallpapers();


    // --- Admin Wallpapers Management ---
    const adminWallpapersTableBody = document.getElementById('adminWallpapersTableBody');
    const adminWallpapersCount = document.getElementById('adminWallpapersCount');
    const openAddWallpaperModal = document.getElementById('openAddWallpaperModal');
    const wallpaperModal = document.getElementById('wallpaperModal');
    const closeWallpaperModal = document.getElementById('closeWallpaperModal');
    const cancelWallpaperBtn = document.getElementById('cancelWallpaperBtn');
    const wallpaperForm = document.getElementById('wallpaperForm');

    // Admin Add Mode State
    let adminAddMode = 'mobile'; // 'mobile' | 'desktop'

    // Fetch and Render Admin Table
    const fetchAdminWallpapers = async () => {
        if (!db || !adminWallpapersTableBody) return;
        try {
            adminWallpapersTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">جاري التحميل...</td></tr>';
            const snapshot = await db.collection('wallpapers').orderBy('timestamp', 'desc').get();

            if (adminWallpapersCount) adminWallpapersCount.textContent = snapshot.size;

            if (snapshot.empty) {
                adminWallpapersTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">لا توجد خلفيات.</td></tr>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const w = doc.data();
                const previewImg = w.mobileImageUrl || w.imageUrl || w.desktopImageUrl || 'https://via.placeholder.com/50';

                html += `
                    <tr>
                        <td style="padding: 12px;">
                            <img src="${previewImg}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" alt="preview">
                        </td>
                        <td style="padding: 12px;">
                            <div>${w.title}</div>
                            <div style="font-size:10px; opacity:0.7;">
                                ${w.mobileImageUrl ? '<i class="fas fa-mobile-alt"></i> Mobile ' : ''}
                                ${w.desktopImageUrl ? '<i class="fas fa-desktop"></i> Desktop' : ''}
                            </div>
                        </td>
                        <td style="padding: 12px;">
                             <button class="btn btn-danger btn-sm" onclick="deleteWallpaper('${doc.id}')" style="background: rgba(255,0,0,0.2); color: #ff4444; border: 1px solid rgba(255,0,0,0.3); padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            adminWallpapersTableBody.innerHTML = html;

        } catch (error) {
            console.error("Error fetching admin wallpapers:", error);
            adminWallpapersTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: red;">حدث خطأ في جلب البيانات.</td></tr>';
        }
    };

    // Handle Admin Type Toggles (Specific to Wallpaper Modal)
    const wallpaperToggleGroup = document.querySelector('#wallpaperModal .admin-toggle-group');
    const adminToggleBtns = wallpaperToggleGroup ? wallpaperToggleGroup.querySelectorAll('.admin-toggle-btn') : [];

    adminToggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            adminToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            adminAddMode = btn.getAttribute('data-type');
            console.log('Admin Wallpaper Mode changed to:', adminAddMode);
        });
    });

    // Add Wallpaper
    wallpaperForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('wallpaperTitle').value;
        const urlInput = document.getElementById('wallpaperUrl').value; // Single Input - Matches top modal
        const btn = wallpaperForm.querySelector('button[type="submit"]');

        if (btn) btn.disabled = true;

        // Construct data based on mode
        const data = {
            title,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            mobileImageUrl: '',
            desktopImageUrl: ''
        };

        if (adminAddMode === 'mobile') {
            data.mobileImageUrl = urlInput;
        } else {
            data.desktopImageUrl = urlInput;
        }

        try {
            await db.collection('wallpapers').add(data);

            wallpaperModal.classList.remove('active');
            wallpaperForm.reset();
            // Reset Admin Toggle to default
            adminToggleBtns.forEach(b => b.classList.remove('active'));
            const defaultMobileBtn = document.querySelector('.admin-toggle-btn[data-type="mobile"]');
            if (defaultMobileBtn) defaultMobileBtn.classList.add('active');
            adminAddMode = 'mobile';

            fetchAdminWallpapers();
            renderWallpapers(); // Update public view as well

        } catch (error) {
            console.error("Error adding wallpaper:", error);
            alert("حدث خطأ أثناء الإضافة: " + error.message);
        } finally {
            if (btn) btn.disabled = false;
        }
    });


    // Modal Toggles
    openAddWallpaperModal?.addEventListener('click', () => {
        if (window.openAddWallpaperModal) {
            window.openAddWallpaperModal();
        } else {
            wallpaperModal.classList.add('active');
        }
    });

    closeWallpaperModal?.addEventListener('click', () => {
        wallpaperModal.classList.remove('active');
        wallpaperModal.style.setProperty('display', 'none', 'important');
    });

    cancelWallpaperBtn?.addEventListener('click', () => {
        wallpaperModal.classList.remove('active');
        wallpaperModal.style.setProperty('display', 'none', 'important');
    });

    // Close modal properly if clicked outside
    wallpaperModal?.addEventListener('click', (e) => {
        if (e.target === wallpaperModal) {
            wallpaperModal.classList.remove('active');
        }
    });

    // Admin Sidebar Tab Switching Logic Update
    const adminNavItems = document.querySelectorAll('.admin-nav-item');
    const adminTabContents = document.querySelectorAll('.admin-tab-content');

    adminNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');

            // Remove active class from all
            adminNavItems.forEach(i => i.classList.remove('active'));
            adminTabContents.forEach(c => c.classList.remove('active'));

            // Add active class to current
            item.classList.add('active');
            const targetTab = document.getElementById(`tab-${tabId}`);
            if (targetTab) targetTab.classList.add('active');

            // Load data if needed
            if (tabId === 'wallpapers') fetchAdminWallpapers();
            // Add other tab loads if necessary... e.g., if(tabId === 'players') fetchAllPlayersForAdmin();
        });
    });

    // Profile Icon Dropdown Toggle
    const profileIcon = document.getElementById('profileIcon');
    const profileContainer = document.getElementById('profileContainer');

    profileIcon?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileContainer.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (profileContainer && !profileContainer.contains(e.target)) {
            profileContainer.classList.remove('open');
        }
    });

    // Admin Dashboard Link
    const adminDashboardLink = document.getElementById('adminDashboardLink');
    adminDashboardLink?.addEventListener('click', () => {
        profileContainer.classList.remove('open');
        if (auth?.currentUser && isAdminEmail(auth.currentUser.email)) {
            showAdminDashboard(auth.currentUser.email);
        }
    });

    // User Profile Link
    const userProfileLink = document.getElementById('userProfileLink');
    const userProfileModal = document.getElementById('userProfileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    const profileModalName = document.getElementById('profileModalName');
    const profileModalEmail = document.getElementById('profileModalEmail');
    const profileJoinDate = document.getElementById('profileJoinDate');

    userProfileLink?.addEventListener('click', () => {
        profileContainer.classList.remove('open');
        if (auth?.currentUser) {
            // Update profile modal with user data
            const userName = auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
            if (profileModalName) profileModalName.textContent = userName;
            if (profileModalEmail) profileModalEmail.textContent = auth.currentUser.email;

            // Format join date
            if (auth.currentUser.metadata && profileJoinDate) {
                const joinDate = new Date(auth.currentUser.metadata.creationTime);
                const options = { year: 'numeric', month: 'long' };
                profileJoinDate.textContent = joinDate.toLocaleDateString('ar-SA', options);
            }

            userProfileModal?.classList.add('active');
        }
    });

    closeProfileModal?.addEventListener('click', () => {
        userProfileModal?.classList.remove('active');
    });

    closeProfileModalBtn?.addEventListener('click', () => {
        userProfileModal?.classList.remove('active');
    });

    // Close profile modal when clicking outside
    userProfileModal?.addEventListener('click', (e) => {
        if (e.target === userProfileModal) {
            userProfileModal.classList.remove('active');
        }
    });

    // Profile Logout Button
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');
    profileLogoutBtn?.addEventListener('click', async () => {
        try {
            if (auth) {
                await auth.signOut();
            }
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminEmail');
            profileContainer.classList.remove('open');
            hideAdminDashboard();
        } catch (error) {
            console.error('Logout error:', error);
            alert('حدث خطأ أثناء تسجيل الخروج');
        }
    });


    // --- Edit Profile Functionality ---
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeEditProfileModal = document.getElementById('closeEditProfileModal');
    const cancelEditProfileBtn = document.getElementById('cancelEditProfileBtn');
    const editProfileForm = document.getElementById('editProfileForm');
    const editDisplayName = document.getElementById('editDisplayName');
    const editEmail = document.getElementById('editEmail');
    const editCurrentPassword = document.getElementById('editCurrentPassword');
    const editNewPassword = document.getElementById('editNewPassword');
    const editConfirmPassword = document.getElementById('editConfirmPassword');
    const editError = document.getElementById('editError');
    const editSuccess = document.getElementById('editSuccess');

    // Open edit profile modal
    editProfileBtn?.addEventListener('click', () => {
        userProfileModal?.classList.remove('active');
        if (auth?.currentUser) {
            // Pre-fill form with current user data
            if (editDisplayName) editDisplayName.value = auth.currentUser.displayName || '';
            if (editEmail) editEmail.value = auth.currentUser.email;

            // Clear password fields and messages
            if (editCurrentPassword) editCurrentPassword.value = '';
            if (editNewPassword) editNewPassword.value = '';
            if (editConfirmPassword) editConfirmPassword.value = '';
            if (editError) editError.textContent = '';
            if (editSuccess) editSuccess.textContent = '';

            editProfileModal?.classList.add('active');
        }
    });

    // Close edit profile modal
    closeEditProfileModal?.addEventListener('click', () => {
        editProfileModal?.classList.remove('active');
    });

    cancelEditProfileBtn?.addEventListener('click', () => {
        editProfileModal?.classList.remove('active');
    });

    // Close edit modal when clicking outside
    editProfileModal?.addEventListener('click', (e) => {
        if (e.target === editProfileModal) {
            editProfileModal.classList.remove('active');
        }
    });

    // Handle edit profile form submission
    editProfileForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth?.currentUser) return;

        editError.textContent = '';
        editSuccess.textContent = '';

        const newDisplayName = editDisplayName.value.trim();
        const currentPassword = editCurrentPassword.value;
        const newPassword = editNewPassword.value;
        const confirmPassword = editConfirmPassword.value;

        try {
            let updated = false;

            // Update display name if changed
            if (newDisplayName && newDisplayName !== auth.currentUser.displayName) {
                await auth.currentUser.updateProfile({
                    displayName: newDisplayName
                });
                updated = true;
            }

            // Update password if provided
            if (currentPassword && newPassword) {
                // Validate password match
                if (newPassword !== confirmPassword) {
                    editError.textContent = 'كلمات المرور الجديدة غير متطابقة';
                    return;
                }

                // Validate password length
                if (newPassword.length < 6) {
                    editError.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
                    return;
                }

                // Re-authenticate user before changing password
                const credential = firebase.auth.EmailAuthProvider.credential(
                    auth.currentUser.email,
                    currentPassword
                );

                await auth.currentUser.reauthenticateWithCredential(credential);
                await auth.currentUser.updatePassword(newPassword);
                updated = true;
            }

            if (updated) {
                editSuccess.textContent = 'تم تحديث الملف الشخصي بنجاح!';

                // Update UI with new display name
                const userName = auth.currentUser.displayName || auth.currentUser.email.split('@')[0];
                if (profileDropdownName) profileDropdownName.textContent = userName;
                if (profileModalName) profileModalName.textContent = userName;

                // Update hero section if user is logged in
                const heroTag = document.querySelector('.hero-text .tag');
                if (heroTag) {
                    const svgIcon = heroTag.querySelector('svg');
                    heroTag.innerHTML = `مرحبا ${userName} بك في كار7`;
                    if (svgIcon) {
                        heroTag.appendChild(svgIcon);
                    }
                }

                // Clear form after 2 seconds and close modal
                setTimeout(() => {
                    editProfileModal?.classList.remove('active');
                    editProfileForm?.reset();
                }, 2000);
            } else {
                editError.textContent = 'لم يتم إجراء أي تغييرات';
            }

        } catch (error) {
            console.error('Profile update error:', error);
            let errorMsg = 'حدث خطأ أثناء تحديث الملف الشخصي';

            switch (error.code) {
                case 'auth/wrong-password':
                    errorMsg = 'كلمة المرور الحالية غير صحيحة';
                    break;
                case 'auth/weak-password':
                    errorMsg = 'كلمة المرور الجديدة ضعيفة جداً';
                    break;
                case 'auth/requires-recent-login':
                    errorMsg = 'يرجى تسجيل الخروج ثم الدخول مرة أخرى لإجراء هذا التغيير';
                    break;
            }

            editError.textContent = errorMsg;
        }
    });


    // Live Stream Modal Logic
    // Variables consolidated at the top

    // Function to stop video when closing modal
    const stopStreamVideo = () => {
        if (streamFrame) {
            const currentSrc = streamFrame.src;
            streamFrame.src = '';
            streamFrame.src = currentSrc;
        }
    };


    // Close Stream Modal
    closeStreamBtn?.addEventListener('click', () => {
        streamModal?.classList.remove('active');
        stopStreamVideo();
    });

    // Close on click outside
    streamModal?.addEventListener('click', (e) => {
        if (e.target === streamModal) {
            streamModal.classList.remove('active');
            stopStreamVideo();
        }
    });


    // --- Latest News Logic ---
    let newsData = [];

    const fetchAllNews = async () => {
        console.log('fetchAllNews called');
        if (!db) {
            console.error('Database (db) is not initialized');
            return;
        }
        try {
            // Temporarily removing orderBy to check for indexing or missing field issues
            const snapshot = await db.collection('news').get();
            newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort manually if needed or just use as is for now
            newsData.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.seconds : 0;
                const dateB = b.createdAt ? b.createdAt.seconds : 0;
                return dateB - dateA;
            });

            console.log('News data fetched:', newsData.length);
            renderLatestNews();
        } catch (error) {
            console.error("Error fetching news:", error);
        }
    };

    function renderLatestNews() {
        console.log('renderLatestNews called with', newsData.length, 'items');
        const newsGrid = document.getElementById('news-grid');
        if (!newsGrid) {
            console.error('news-grid NOT FOUND in DOM');
            return;
        }

        if (newsData.length === 0) {
            newsGrid.innerHTML = '<p class="no-results">لا توجد أخبار حالياً.</p>';
            return;
        }

        // --- Homepage: Show only first 6 ---
        const displayedNews = newsData.slice(0, 6);

        newsGrid.innerHTML = displayedNews.map(news => {
            const date = news.createdAt ? new Date(news.createdAt.seconds * 1000).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            return `
                <div class="news-card" onclick="openNewsPreview('${news.id}')" style="cursor: pointer;">
                    <div class="news-img">
                        <img src="${news.img}" alt="${news.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x300'">
                    </div>
                    <div class="news-content">
                        <div class="news-meta">
                            <span>${news.category || 'خبر'}</span>
                            <span>•</span>
                            <span>${date}</span>
                        </div>
                        <h3>${news.title}</h3>
                        <p>${news.excerpt}</p>
                    </div>
                </div>`;
        }).join('');

        // Standardized high-priority visibility enforcement
        newsGrid.style.setProperty('display', 'grid', 'important');

        // --- Add "View All" Button Logic ---
        const existingBtn = document.querySelector('.view-all-news-container');
        if (existingBtn) existingBtn.remove();

        if (newsData.length > 6) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'view-all-news-container';
            btnContainer.innerHTML = `
                <button class="btn-view-all-news" onclick="openAllNewsModal()">
                    عرض جميع الأخبار (${newsData.length}) <i class="fas fa-arrow-left"></i>
                </button>
            `;
            newsGrid.parentNode.appendChild(btnContainer);
        }
    }

    // --- All News Modal Logic ---
    let currentNewsPage = 1;
    const NEWS_PER_PAGE = 9;

    window.openAllNewsModal = () => {
        const modal = document.getElementById('allNewsModal');
        if (!modal) return;

        currentNewsPage = 1; // Reset page
        renderAllNewsGrid();

        modal.classList.add('active');
        // Standardized high-priority visibility logic
        modal.style.setProperty('display', 'flex', 'important');
        modal.style.setProperty('z-index', '100000', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('opacity', '1', 'important');
    };

    function renderAllNewsGrid() {
        const grid = document.getElementById('allNewsGrid');
        const loadMoreBtn = document.getElementById('loadMoreNewsBtn');
        if (!grid) return;

        const start = 0;
        const end = currentNewsPage * NEWS_PER_PAGE;
        const newsToShow = newsData.slice(start, end);

        if (currentNewsPage === 1) {
            grid.innerHTML = ''; // Clear only on initial load
        } else {
            // For Load More, ideally we append, but simplistic approach is re-render or append logic.
            // To be efficient, we'll re-render all for now or optimize to append.
            // Given the requirements, re-rendering visible set is acceptable for < 100 items.
            // Alternatively, let's just clear and render 'newsToShow' which grows.
            grid.innerHTML = '';
        }

        grid.innerHTML = newsToShow.map(news => {
            const date = news.createdAt ? new Date(news.createdAt.seconds * 1000).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            return `
                <div class="news-card" onclick="openNewsPreview('${news.id}')" style="cursor: pointer;">
                    <div class="news-img">
                        <img src="${news.img}" alt="${news.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x300'">
                    </div>
                    <div class="news-content">
                        <div class="news-meta">
                            <span>${news.category || 'خبر'}</span>
                            <span>•</span>
                            <span>${date}</span>
                        </div>
                        <h3>${news.title}</h3>
                        <p>${news.excerpt}</p>
                    </div>
                </div>`;
        }).join('');

        // Handle Load More Button Visibility
        if (end >= newsData.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-flex';
        }
    }

    // Load More Event Listener (needs to be attached once)
    const loadMoreBtn = document.getElementById('loadMoreNewsBtn');
    if (loadMoreBtn) {
        loadMoreBtn.onclick = () => {
            currentNewsPage++;
            renderAllNewsGrid();
        };
    }

    // Close All News Modal
    const closeAllNewsBtn = document.getElementById('closeAllNewsModal');
    const allNewsModal = document.getElementById('allNewsModal');

    closeAllNewsBtn?.addEventListener('click', () => {
        allNewsModal?.classList.remove('active');
        allNewsModal?.style.setProperty('display', 'none', 'important');
    });


    // --- Search Functionality ---
    const searchBtn = document.getElementById('searchBtn');
    const searchModal = document.getElementById('searchModal');
    const closeSearchModalBtn = document.getElementById('closeSearchModal');
    const searchInput = document.getElementById('searchInput');
    const searchResultsGrid = document.getElementById('searchResultsGrid');

    searchBtn?.addEventListener('click', () => {
        searchModal?.classList.add('active');
        searchModal?.style.setProperty('display', 'flex', 'important');
        searchModal?.style.setProperty('z-index', '100000', 'important');
        searchModal?.style.setProperty('visibility', 'visible', 'important');
        searchModal?.style.setProperty('opacity', '1', 'important');

        // Focus input after a slight delay for better animation experience
        setTimeout(() => searchInput?.focus(), 300);
    });

    const closeSearch = () => {
        searchModal?.classList.remove('active');
        searchModal?.style.setProperty('display', 'none', 'important');
        searchInput.value = '';
        renderSearchResults('');
    };

    closeSearchModalBtn?.addEventListener('click', closeSearch);

    searchModal?.addEventListener('click', (e) => {
        if (e.target === searchModal) closeSearch();
    });

    // Close search on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal?.classList.contains('active')) {
            closeSearch();
        }
    });

    searchInput?.addEventListener('input', (e) => {
        renderSearchResults(e.target.value.trim());
    });

    function renderSearchResults(query) {
        if (!searchResultsGrid) return;

        if (!query) {
            searchResultsGrid.innerHTML = `
                <div class="search-empty-state" style="text-align: center; padding: 50px 20px; color: var(--text-gray);">
                    <i class="fas fa-keyboard" style="font-size: 40px; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>ابدأ الكتابة للبحث في أحدث الأخبار</p>
                </div>`;
            return;
        }

        const filtered = newsData.filter(news =>
            news.title?.toLowerCase().includes(query.toLowerCase()) ||
            news.excerpt?.toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length === 0) {
            searchResultsGrid.innerHTML = `
                <div class="search-empty-state" style="text-align: center; padding: 50px 20px; color: var(--text-gray);">
                    <i class="fas fa-search" style="font-size: 40px; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>لا توجد نتائج لـ "${query}"</p>
                </div>`;
            return;
        }

        searchResultsGrid.innerHTML = filtered.map(news => {
            const date = news.createdAt ? new Date(news.createdAt.seconds * 1000).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
            return `
                <div class="news-card" onclick="openNewsPreview('${news.id}')" style="cursor: pointer;">
                    <div class="news-img">
                        <img src="${news.img}" alt="${news.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x300'">
                    </div>
                    <div class="news-content">
                        <div class="news-meta">
                            <span>${news.category || 'خبر'}</span>
                            <span>•</span>
                            <span>${date}</span>
                        </div>
                        <h3>${news.title}</h3>
                        <p>${news.excerpt}</p>
                    </div>
                </div>`;
        }).join('');
    }


    // Open News Preview Modal
    window.openNewsPreview = (id) => {
        const news = newsData.find(n => n.id === id);
        const modal = document.getElementById('newsPreviewModal');
        if (!news || !modal) return;

        // Populate Data
        const titleEl = document.getElementById('newsPreviewTitle');
        const imgEl = document.getElementById('newsPreviewImage');
        const descEl = document.getElementById('newsPreviewDescription');
        const dateEl = document.getElementById('newsPreviewDate');
        const catEl = document.getElementById('newsPreviewCategory');
        const readBtn = document.getElementById('newsPreviewReadBtn');

        if (titleEl) titleEl.textContent = news.title;
        if (imgEl) imgEl.src = news.img || 'https://via.placeholder.com/600x400';
        if (descEl) descEl.textContent = news.excerpt || news.description || 'لا يوجد تفاصيل إضافية...';

        if (dateEl && news.createdAt) {
            dateEl.textContent = new Date(news.createdAt.seconds * 1000).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
        }

        if (catEl) catEl.textContent = news.category || 'خبر';

        // Read More Button Logic
        if (readBtn) {
            if (news.link) {
                readBtn.style.display = 'flex';
                readBtn.href = news.link;
            } else {
                readBtn.style.display = 'none';
            }
        }

        modal.classList.add('active');
    };

    // Close News Preview Modal Logic
    const closeNewsPreviewModalBtn = document.getElementById('closeNewsPreviewModal');
    const newsPreviewModal = document.getElementById('newsPreviewModal');

    closeNewsPreviewModalBtn?.addEventListener('click', () => {
        newsPreviewModal?.classList.remove('active');
    });

    newsPreviewModal?.addEventListener('click', (e) => {
        if (e.target === newsPreviewModal) {
            newsPreviewModal.classList.remove('active');
        }
    });

    // Initial fetch
    fetchAllNews();

    // --- Programs Logic ---
    const programsData = [
        {
            title: "هلا مدريد",
            desc: "البرنامج الأسبوعي الشامل لكل ما يخص النادي",
            img: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=450&fit=crop"
        },
        {
            title: "خلف الأضواء",
            desc: "قصص لم تروَ عن لاعبين خلدوا أسماءهم في التاريخ",
            img: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800&h=450&fit=crop"
        }
    ];

    function renderPrograms() {
        const programsGrid = document.getElementById('programs-grid');
        if (!programsGrid) return;

        programsGrid.innerHTML = programsData.map(prog => `
            <div class="program-card">
                <img src="${prog.img}" alt="${prog.title}">
                <div class="program-overlay">
                    <h3>${prog.title}</h3>
                    <p>${prog.desc}</p>
                </div>
            </div>
        `).join('');
    }

    // --- Smooth Scroll Logic ---
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.main-header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - (headerHeight - 20);
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Initial load additions
    renderFilteredPlayers();
    renderLatestNews();
    renderPrograms();

    // --- Dynamic Stream URL Logic (Multi-Server) ---
    // Variables consolidated at the top

    // Function to fetch Users for Admin
    async function fetchUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (!db) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">قاعدة البيانات غير متصلة</td></tr>';
            return;
        }

        try {
            const snapshot = await db.collection('users').get();
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">لا يوجد مستخدمين مسجلين بعد.</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            snapshot.forEach(doc => {
                const user = doc.data();
                const joinedDate = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('ar-EG') : '-';

                const tr = document.createElement('tr');
                tr.style.cssText = "border-bottom: 1px solid rgba(255,255,255,0.05);";
                tr.innerHTML = `
                    <td style="padding: 12px;">${user.displayName || 'مستخدم'}</td>
                    <td style="padding: 12px; font-family: sans-serif; opacity: 0.8;">${user.email}</td>
                    <td style="padding: 12px; opacity: 0.6;">${joinedDate}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error("Error fetching users:", error);
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #ff4757;">فشل تحميل البيانات</td></tr>';
        }
    }

    // دالة لعرض لوحة تحكم المسؤول
    function showAdminDashboard(email) {
        if (adminDashboard) {
            adminDashboard.style.display = 'block';
            if (adminEmailDisplay) { // Assuming adminEmailDisplay is the correct element for the email
                adminEmailDisplay.textContent = email;
            }

            // افتح أول تبويب افتراضياً
            if (typeof switchAdminTab === 'function') switchAdminTab('stats');

            // Fetch users when dashboard opens
            fetchUsers();

            // جلب إعدادات الواجهة
            fetchSiteConfig();

            // جلب اللاعبين للإدارة
            fetchAdminPlayers();

            // جلب الأخبار للإدارة
            fetchAdminNews();

            // حساب عدد اللاعبين
            updateAdminPlayersCount();
        }
    }

    // --- إعدادات الواجهة (Hero & Team Desc) ---
    // Variables consolidated at the top

    async function fetchSiteConfig() {
        if (!db) return;
        try {
            const doc = await db.collection('settings').doc('siteConfig').get();
            if (doc.exists) {
                const data = doc.data();
                if (data.heroImageUrl) {
                    if (adminHeroImage) adminHeroImage.value = data.heroImageUrl;
                    if (heroMainImage) heroMainImage.src = data.heroImageUrl;
                }
                if (data.teamDescription) {
                    if (adminTeamDesc) adminTeamDesc.value = data.teamDescription;
                    if (teamSectionDesc) teamSectionDesc.textContent = data.teamDescription;
                }
            }
        } catch (error) {
            console.error("Error fetching site config:", error);
        }
    }

    async function saveSiteConfig() {
        if (!db || !saveSiteConfigBtn) return;

        saveSiteConfigBtn.disabled = true;
        saveSiteConfigBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

        const heroUrl = adminHeroImage.value ? adminHeroImage.value.trim() : '';
        const teamDesc = adminTeamDesc.value ? adminTeamDesc.value.trim() : '';

        try {
            await db.collection('settings').doc('siteConfig').set({
                heroImageUrl: heroUrl,
                teamDescription: teamDesc,
                updatedAt: new Date()
            });

            if (heroMainImage && heroUrl) heroMainImage.src = heroUrl;
            if (teamSectionDesc && teamDesc) teamSectionDesc.textContent = teamDesc;

            if (siteConfigMsg) {
                siteConfigMsg.textContent = 'تم حفظ الإعدادات بنجاح';
                siteConfigMsg.style.color = 'var(--primary-green)';
                setTimeout(() => { siteConfigMsg.textContent = ''; }, 3000);
            }
            alert('تم حفظ إعدادات الواجهة بنجاح');

        } catch (error) {
            console.error("Error saving site config:", error);
            if (siteConfigMsg) {
                siteConfigMsg.textContent = 'فشل الحفظ، حاول مرة أخرى';
                siteConfigMsg.style.color = '#ff4757';
            }
            alert('حدث خطأ أثناء حفظ الإعدادات: ' + error.message);
        } finally {
            saveSiteConfigBtn.disabled = false;
            saveSiteConfigBtn.innerHTML = '<i class="fas fa-save"></i> حفظ إعدادات الواجهة';
        }
    };

    saveSiteConfigBtn?.addEventListener('click', saveSiteConfig);

    // استدعاء جلب الإعدادات عند تحميل الصفحة للمستخدمين العاديين أيضاً
    fetchSiteConfig();

    // دالة لإخفاء لوحة تحكم المسؤول
    function hideAdminDashboard() {
        if (adminDashboard) {
            adminDashboard.style.display = 'none';
        }
    }

    // --- Admin Tab Switching Logic ---
    function switchAdminTab(tabId) {
        const adminNavItems = document.querySelectorAll('.admin-nav-item');
        const adminTabContents = document.querySelectorAll('.admin-tab-content');

        // Update Nav
        adminNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tab === tabId) item.classList.add('active');
        });

        // Update Content
        adminTabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `tab-${tabId}`) content.classList.add('active');
        });
    }

    // Event Listeners for Tabs
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            switchAdminTab(btn.dataset.tab);
        });
    });

    // زر إغلاق لوحة التحكم
    closeDashboardBtn?.addEventListener('click', hideAdminDashboard);

    // زر تسجيل خروج المسؤول
    adminLogoutBtn?.addEventListener('click', async () => {
        try {
            if (auth) {
                await auth.signOut();
            }
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminEmail');
            hideAdminDashboard();
        } catch (error) {
            console.error('Logout error:', error);
            alert('حدث خطأ أثناء تسجيل الخروج');
        }
    });

    // --- Dynamic Stream URL Logic (Multi-Server) ---
    // Variables consolidated at the top

    let hls = null;
    // Default Servers (Fallback)
    let streamServers = [
        { url: 'https://www.youtube.com/embed/jfKfPfyJRdk?enablejsapi=1' }
    ];

    // Helper to convert YouTube Watch URL to Embed URL
    // (Already defined above globally or reuse here if needed)

    // Function to load stream into appropriate player
    // (Reuse loadStream from previous step, assuming it is defined globally or we redefine it to handle context)
    // Actually, loadStream is defined above. We just need to call it.

    // --- إدارة اللاعبين (Player Management) ---
    // Variables consolidated at the top
    let currentAdminFilter = 'first';

    // فلترة السجلات في لوحة التحكم
    document.querySelectorAll('.admin-data-filters .btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.admin-data-filters .btn-filter').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            currentAdminFilter = target.dataset.filter;
            fetchAdminPlayers();
        });
    });

    async function updateAdminPlayersCount() {
        if (!db || !adminPlayersCount) return;
        try {
            const snapshot = await db.collection('players').get();
            adminPlayersCount.textContent = snapshot.size;
        } catch (error) {
            console.error("Error updating player count:", error);
        }
    }

    async function fetchAdminPlayers() {
        if (!db || !adminPlayersTableBody) return;

        adminPlayersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">جاري التحميل...</td></tr>';

        try {
            const snapshot = await db.collection('players').where('team', '==', currentAdminFilter).get();
            adminPlayersTableBody.innerHTML = '';

            if (snapshot.empty) {
                adminPlayersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">لا يوجد لاعبين في هذا الفريق</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const p = doc.data();
                const tr = document.createElement('tr');
                tr.style.cssText = "border-bottom: 1px solid rgba(255,255,255,0.05);";
                tr.innerHTML = `
                    <td style="padding: 12px;">
                        <div class="player-admin-cell">
                            <img src="${p.img}" class="player-admin-img" onerror="this.src='https://via.placeholder.com/40'">
                            <span>${p.name}</span>
                        </div>
                    </td>
                    <td style="padding: 12px;">${p.number}</td>
                    <td style="padding: 12px;">${p.role}</td>
                    <td style="padding: 12px;">
                        <button class="btn-edit-player" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete-player" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                adminPlayersTableBody.appendChild(tr);
            });

            // إضافة أحداث الأزرار
            document.querySelectorAll('.btn-edit-player').forEach(btn => {
                btn.onclick = () => openEditPlayerModal(btn.dataset.id);
            });
            document.querySelectorAll('.btn-delete-player').forEach(btn => {
                btn.onclick = () => deletePlayer(btn.dataset.id);
            });

        } catch (error) {
            console.error("Error fetching admin players:", error);
            adminPlayersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ff4757;">فشل التحميل</td></tr>';
        }
    }

    function openAddPlayerModal() {
        if (!playerForm) {
            alert('تحذير: لم يتم العثور على نموذج اللاعب (playerForm) في الصفحة.');
        } else {
            playerForm.reset();
        }
        const playerIdInput = document.getElementById('playerId');
        if (playerIdInput) playerIdInput.value = '';
        if (playerModalTitle) playerModalTitle.textContent = 'إضافة لاعب جديد';
        if (playerModal) playerModal.classList.add('active');
    }

    async function openEditPlayerModal(id) {
        if (!db) return;
        try {
            const doc = await db.collection('players').doc(id).get();
            if (doc.exists) {
                const p = doc.data();
                const playerIdInput = document.getElementById('playerId');
                const playerNameInput = document.getElementById('playerName');
                const playerNumberInput = document.getElementById('playerNumber');
                const playerRoleInput = document.getElementById('playerRole');
                const playerTeamInput = document.getElementById('playerTeam');
                const playerImgInput = document.getElementById('playerImg');

                if (playerIdInput) playerIdInput.value = id;
                if (playerNameInput) playerNameInput.value = p.name || '';
                if (playerNumberInput) playerNumberInput.value = p.number || '';
                if (playerRoleInput) playerRoleInput.value = p.role || 'مهاجم';
                if (playerTeamInput) playerTeamInput.value = p.team || 'first';
                if (playerImgInput) playerImgInput.value = p.img || '';

                if (playerModalTitle) playerModalTitle.textContent = 'تعديل بيانات اللاعب';
                if (playerModal) playerModal.classList.add('active');
            }
        } catch (error) {
            console.error("Error fetching player for edit:", error);
        }
    }

    async function deletePlayer(id) {
        if (!db || !confirm('هل أنت متأكد من حذف هذا اللاعب؟')) return;
        try {
            await db.collection('players').doc(id).delete();
            fetchAdminPlayers();
            updateAdminPlayersCount();
            fetchAllPlayers(); // تحديث القائمة الرئيسية
        } catch (error) {
            console.error("Error deleting player:", error);
        }
    }

    playerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!db) {
            alert('خطأ: لم يتم تهيئة قاعدة البيانات. يرجى تحديث الصفحة.');
            return;
        }

        const saveBtn = document.getElementById('savePlayerBtn');
        const originalBtnText = saveBtn ? saveBtn.innerHTML : 'حفظ اللاعب';

        // Provide immediate feedback
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        }

        const id = document.getElementById('playerId')?.value;
        const nameInput = document.getElementById('playerName');
        const numberInput = document.getElementById('playerNumber');
        const roleInput = document.getElementById('playerRole');
        const teamInput = document.getElementById('playerTeam');
        const imgInput = document.getElementById('playerImg');

        if (!nameInput || !numberInput || !imgInput) {
            alert('خطأ: لم يتم العثور على بعض حقول الإدخال.');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalBtnText;
            }
            return;
        }

        const playerData = {
            name: nameInput.value.trim(),
            number: numberInput.value.trim(),
            role: roleInput.value,
            team: teamInput.value,
            img: imgInput.value.trim(),
            updatedAt: new Date()
        };

        try {
            // Firestore call with timeout to prevent hanging UI
            const savePromise = id ?
                db.collection('players').doc(id).update(playerData) :
                db.collection('players').add(playerData);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('تجاوز وقت الانتظار (15 ثانية). قد تكون خدمة Firestore غير مفعلة أو هناك مشكلة في الاتصال.')), 15000)
            );

            await Promise.race([savePromise, timeoutPromise]);

            alert(id ? 'تم تعديل بيانات اللاعب بنجاح' : 'تم إضافة اللاعب بنجاح');

            if (playerModal) playerModal.classList.remove('active');
            fetchAdminPlayers();
            updateAdminPlayersCount();
            if (typeof fetchAllPlayers === 'function') fetchAllPlayers();
        } catch (error) {
            console.error("Error saving player:", error);
            let userMsg = 'حدث خطأ أثناء حفظ البيانات: ' + error.message;

            if (error.message.includes('Cloud Firestore API has not been used')) {
                userMsg = 'خطأ في إعدادات المشروع: يجب تفعيل Cloud Firestore API من لوحة تحكم Firebase (Console).';
            } else if (error.code === 'permission-denied') {
                userMsg = 'ليس لديك صلاحية الكتابة، تأكد من تسجيل الدخول كمسؤول ومن إعدادات قواعد الحماية (Rules).';
            }

            alert(userMsg);
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalBtnText;
            }
        }
    });

    openAddPlayerModalBtn?.addEventListener('click', openAddPlayerModal);
    closePlayerModalBtn?.addEventListener('click', () => playerModal.classList.remove('active'));
    cancelPlayerBtn?.addEventListener('click', () => playerModal.classList.remove('active'));
    // --- إدارة الأخبار للإدارة ---
    // News Elements
    // Variables consolidated at the top

    async function fetchAdminNews() {
        if (!db || !adminNewsTableBody) return;
        adminNewsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">جاري التحميل...</td></tr>';

        try {
            const snapshot = await db.collection('news').orderBy('createdAt', 'desc').get();
            adminNewsTableBody.innerHTML = '';

            if (snapshot.empty) {
                adminNewsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px;">لا يوجد أخبار حالياً</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const n = doc.data();
                const date = n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : '-';
                const tr = document.createElement('tr');
                tr.style.cssText = "border-bottom: 1px solid rgba(255,255,255,0.05);";
                tr.innerHTML = `
                    <td style="padding: 12px;">
                        <div class="player-admin-cell">
                            <img src="${n.img}" class="player-admin-img" style="border-radius: 4px; width: 60px; height: 35px;" onerror="this.src='https://via.placeholder.com/60'">
                            <span>${n.title}</span>
                        </div>
                    </td>
                    <td style="padding: 12px; opacity: 0.7;">${date}</td>
                    <td style="padding: 12px;">
                        <button class="btn-edit-news" data-id="${doc.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete-news" data-id="${doc.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                adminNewsTableBody.appendChild(tr);
            });

            document.querySelectorAll('.btn-edit-news').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    const id = btn.getAttribute('data-id'); // Safer than dataset sometimes
                    console.log('Edit clicked for ID:', id);
                    if (typeof window.openEditNewsModal === 'function') {
                        window.openEditNewsModal(id);
                    } else {
                        console.error('window.openEditNewsModal missing');
                    }
                };
            });
            document.querySelectorAll('.btn-delete-news').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    const id = btn.getAttribute('data-id');
                    if (typeof window.deleteNews === 'function') {
                        window.deleteNews(id);
                    }
                };
            });

        } catch (error) {
            console.error("Error fetching admin news:", error);
            adminNewsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #ff4757;">فشل التحميل</td></tr>';
        }
    }

    // --- Exposed to Window to fix Scope Issues ---
    // --- Exposed to Window to fix Scope Issues (MOVED TO END OF FILE) ---
    // See bottom of file


    newsForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!db) return;

        const id = document.getElementById('articleId').value;
        const newsData = {
            title: document.getElementById('articleTitle').value.trim(),
            excerpt: document.getElementById('articleExcerpt').value.trim(),
            img: document.getElementById('articleImg').value.trim(),
            link: document.getElementById('articleLink').value.trim(),
            createdAt: id ? undefined : new Date(), // Only set on creation
            updatedAt: new Date()
        };

        // Remove undefined fields for update
        if (id) delete newsData.createdAt;

        try {
            const savePromise = id ?
                db.collection('news').doc(id).update(newsData) :
                db.collection('news').add(newsData);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('تجاوز وقت الانتظار (15 ثانية).')), 15000)
            );

            await Promise.race([savePromise, timeoutPromise]);

            alert(id ? 'تم تعديل الخبر بنجاح' : 'تم إضافة الخبر بنجاح');

            if (newsModal) newsModal.classList.remove('active');
            fetchAdminNews();
            fetchAllNews();
        } catch (error) {
            console.error("Error saving news:", error);
            let userMsg = 'حدث خطأ أثناء حفظ الخبر: ' + error.message;
            if (error.message.includes('Cloud Firestore API has not been used')) {
                userMsg = 'خطأ: يجب تفعيل Cloud Firestore API للمشروع.';
            }
            alert(userMsg);
        } finally {
            const saveBtn = newsForm.querySelector('button[type="submit"]');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = id ? 'تعديل الخبر' : 'حفظ الخبر';
            }
        }
    });

    // --- News Logic Cleaned Up ---


    // --- Wallpaper Logic ---
    function openAddWallpaperModalHandler() {
        if (wallpaperForm) wallpaperForm.reset();

        // Reset Admin Toggle to default (Mobile)
        adminToggleBtns.forEach(b => b.classList.remove('active'));
        const defaultMobileBtn = document.querySelector('.admin-toggle-btn[data-type="mobile"]');
        if (defaultMobileBtn) defaultMobileBtn.classList.add('active');
        adminAddMode = 'mobile';

        if (wallpaperModal) wallpaperModal.classList.add('active');
    }

    openAddWallpaperModal?.addEventListener('click', openAddWallpaperModalHandler);

    closeWallpaperModal?.addEventListener('click', () => wallpaperModal.classList.remove('active'));
    cancelWallpaperBtn?.addEventListener('click', () => wallpaperModal.classList.remove('active'));
    wallpaperModal?.addEventListener('click', (e) => {
        if (e.target === wallpaperModal) wallpaperModal.classList.remove('active');
    });

    // --- Admin Dashboard logic ---

    // Render Server Inputs in Admin Panel
    function renderServerInputs() {
        if (!serversListContainer) return;
        serversListContainer.innerHTML = '';

        // Helper text
        const helperP = document.createElement('p');
        helperP.style.cssText = "color: #888; font-size: 13px; margin-bottom: 20px;";
        helperP.textContent = "أضف أسماء وسيرفرات البث هنا. سيتم حفظها سحابياً ومحلياً.";
        serversListContainer.appendChild(helperP);

        streamServers.forEach((server, index) => {
            const div = document.createElement('div');
            div.className = 'server-input-group';
            div.style.cssText = "display: flex; gap: 10px; margin-bottom: 12px; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;";
            div.innerHTML = `
                <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 11px; color: #777;">اسم السيرفر</label>
                    <input type="text" class="server-name" placeholder="سيرفر ${index + 1}" value="${server.name || ''}" 
                        style="width: 100%; padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff;">
                </div>
                <div style="flex: 2; display: flex; flex-direction: column; gap: 5px;">
                    <label style="font-size: 11px; color: #777;">رابط البث</label>
                    <input type="text" class="server-url" placeholder="https://..." value="${server.url}" 
                        style="width: 100%; padding: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff;">
                </div>
                <button class="btn-remove-server" data-index="${index}" title="حذف"
                    style="background: rgba(255,68,68,0.1); color: #ff4444; border: none; padding: 10px; border-radius: 6px; cursor: pointer; margin-top: 15px;">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            serversListContainer.appendChild(div);
        });

        // Add Listeners
        document.querySelectorAll('.btn-remove-server').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                streamServers.splice(idx, 1);
                renderServerInputs();
            });
        });

        // Auto Save to data model on change
        document.querySelectorAll('.server-name').forEach((input, i) => {
            input.addEventListener('change', (e) => {
                streamServers[i].name = e.target.value.trim();
            });
        });
        document.querySelectorAll('.server-url').forEach((input, i) => {
            input.addEventListener('change', (e) => {
                streamServers[i].url = e.target.value.trim();
            });
        });
    }

    // Add New Server Button
    addServerBtn?.addEventListener('click', () => {
        streamServers.push({ url: '', name: '' });
        renderServerInputs();
    });

    // --- Player UI Logic ---

    // Render Server Selection Buttons in Modal
    function renderServerButtons() {
        if (!streamServerSelector) return;
        streamServerSelector.innerHTML = '';

        streamServers.forEach((server, index) => {
            const btn = document.createElement('button');
            btn.className = `btn-server ${index === 0 ? 'premium' : ''}`;
            const serverName = server.name || `سيرفر ${index + 1}`;
            btn.innerHTML = `<i class="fas fa-play"></i> ${serverName}`;

            btn.onclick = (e) => {
                document.querySelectorAll('.btn-server').forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                const safeUrl = convertToEmbedUrl(server.url);
                loadStream(safeUrl);
            };

            streamServerSelector.appendChild(btn);
        });
    }

    // --- Stream Elements & State ---
    // Variables consolidated at the top

    // Update UI based on toggle
    function updateMatchStatusUI() {
        if (!matchStatusText || !matchStatusToggle || !fallbackChannelsGroup) return;

        if (matchStatusToggle.checked) {
            matchStatusText.innerHTML = 'حالة البث: <span style="color: #ff4444;">🔴 مباراة مباشرة</span>';
            fallbackChannelsGroup.style.display = 'none';
            isMatchLive = true;
        } else {
            matchStatusText.innerHTML = 'حالة البث: <span style="color: #26d47f;">🔵 بث مستمر (إخباري/وثائقي)</span>';
            fallbackChannelsGroup.style.display = 'block';
            isMatchLive = false;
        }
    }

    // --- Persistence & Save Logic ---

    // Unified Save Function
    async function saveStreamSettings(showFeedback = true) {
        if (showFeedback && saveStreamUrlBtn) {
            saveStreamUrlBtn.disabled = true;
            saveStreamUrlBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        }

        let savedToCloud = false;

        try {
            // Collect current state directly from DOM to ensure latest values
            const serverGroups = document.querySelectorAll('.server-input-group');
            const currentServers = Array.from(serverGroups).map(group => ({
                name: group.querySelector('.server-name')?.value.trim() || '',
                url: group.querySelector('.server-url')?.value.trim() || ''
            }));

            const validServers = currentServers.filter(s => s.url !== '');

            // Auto-convert YouTube Links for all servers
            const processedServers = validServers.map(s => ({
                url: convertToEmbedUrl(s.url),
                name: s.name
            }));

            // Collect Fallback URLs from inputs if they exist, else use variables
            const newsUrl = newsStreamUrlInput ? newsStreamUrlInput.value.trim() : newsStreamUrl;
            const docUrl = docStreamUrlInput ? docStreamUrlInput.value.trim() : docStreamUrl;

            const processedNewsUrl = convertToEmbedUrl(newsUrl);
            const processedDocUrl = convertToEmbedUrl(docUrl);

            // Update local variables
            streamServers = processedServers;
            isMatchLive = matchStatusToggle ? matchStatusToggle.checked : isMatchLive;
            newsStreamUrl = processedNewsUrl;
            docStreamUrl = processedDocUrl;

            const settingsData = {
                servers: processedServers,
                isMatchLive: isMatchLive,
                newsUrl: processedNewsUrl,
                docUrl: processedDocUrl,
                updatedAt: new Date()
            };

            // 1. Try Firestore Save
            if (db) {
                try {
                    const timeout = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Request timed out')), 5000)
                    );

                    await Promise.race([
                        db.collection('settings').doc('liveStream').set(settingsData),
                        timeout
                    ]);
                    savedToCloud = true;
                } catch (error) {
                    console.error("Firestore save error:", error);
                }
            }

            // 2. Always save locally (Backup)
            localStorage.setItem('streamServers', JSON.stringify(processedServers));
            localStorage.setItem('isMatchLive', isMatchLive);
            localStorage.setItem('newsUrl', processedNewsUrl);
            localStorage.setItem('docUrl', processedDocUrl);

            // Refresh UI components
            renderServerInputs();
            renderServerButtons();
            updateMatchStatusUI();
        } catch (err) {
            console.error("Global save error:", err);
        } finally {
            // UI Feedback End
            if (showFeedback && saveStreamUrlBtn) {
                saveStreamUrlBtn.disabled = false;
                saveStreamUrlBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الإعدادات';

                if (streamSaveMsg) {
                    streamSaveMsg.textContent = savedToCloud ? 'تم حفظ الإعدادات بنجاح (سحابي)' : 'تم الحفظ محلياً (فشل الاتصال)';
                    streamSaveMsg.style.color = savedToCloud ? 'var(--primary-green)' : '#f1c40f';
                    setTimeout(() => { streamSaveMsg.textContent = ''; }, 3000);
                }
            }
        }
    }

    // Fetch Servers & Settings Function
    async function fetchStreamServers() {
        let found = false;

        // 1. Try Firestore
        if (db) {
            try {
                const doc = await db.collection('settings').doc('liveStream').get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data.servers) streamServers = data.servers;
                    if (data.isMatchLive !== undefined) isMatchLive = data.isMatchLive;
                    if (data.newsUrl !== undefined) newsStreamUrl = data.newsUrl;
                    if (data.docUrl !== undefined) docStreamUrl = data.docUrl;
                    found = true;
                }
            } catch (error) {
                console.warn("Firestore fetch error:", error);
            }
        }

        // 2. Fallback to LocalStorage
        if (!found) {
            const localServers = localStorage.getItem('streamServers');
            if (localServers) streamServers = JSON.parse(localServers);

            const localMatchStatus = localStorage.getItem('isMatchLive');
            if (localMatchStatus !== null) isMatchLive = (localMatchStatus === 'true');

            newsStreamUrl = localStorage.getItem('newsUrl') || '';
            docStreamUrl = localStorage.getItem('docUrl') || '';
        }

        // Apply to UI
        if (matchStatusToggle) matchStatusToggle.checked = isMatchLive;
        if (newsStreamUrlInput) newsStreamUrlInput.value = newsStreamUrl;
        if (docStreamUrlInput) docStreamUrlInput.value = docStreamUrl;

        updateMatchStatusUI();
        renderServerInputs();
        renderServerButtons();
    }

    // Initial Fetch
    fetchStreamServers();

    // --- Events ---

    // Toggle change -> Auto Save
    matchStatusToggle?.addEventListener('change', () => {
        updateMatchStatusUI();
        saveStreamSettings(false); // Save silently in background
    });

    // Save Button click -> Explicit Save with Feedback
    saveStreamUrlBtn?.addEventListener('click', () => {
        saveStreamSettings(true);
    });


    // Update the Open Stream Modal logic to ensure latest URL is used
    heroSubscribeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user) {
            streamModal?.classList.add('active');

            // Check Broadcast Status
            if (isMatchLive) {
                // Normal Match Mode
                if (streamServers.length > 0) {
                    loadStream(streamServers[0].url);
                    renderServerButtons();
                    // Highlight first button
                    setTimeout(() => {
                        if (streamServerSelector?.children[0]) {
                            // Reset all
                            Array.from(streamServerSelector.children).forEach(b => {
                                b.classList.remove('active');
                            });
                            // Highlight first
                            streamServerSelector.children[0].classList.add('active');
                        }
                    }, 50);
                }
            } else {
                // Offline/Fallback Mode
                stopAndResetPlayers(); // Ensure no video is playing initially

                // Show Notification Toast (10 Seconds)
                const toast = document.createElement('div');
                toast.textContent = "لا توجد مباراة مباشرة حالياً. يمكنك متابعة القنوات البديلة.";
                toast.style.cssText = `
                    position: absolute; top: 10%; left: 50%; transform: translateX(-50%);
                    background: rgba(0,0,0,0.8); color: #fff; padding: 15px 30px; border-radius: 50px;
                    border: 1px solid var(--primary-green); z-index: 1000; font-size: 16px;
                    animation: fadeInOut 10s forwards; pointer-events: none;
                `;
                const content = streamModal.querySelector('.stream-modal-content');
                if (content) content.appendChild(toast);

                // Auto-load Documentary (or News)
                let fallbackUrl = docStreamUrl || newsStreamUrl;
                if (fallbackUrl) {
                    loadStream(fallbackUrl);
                }

                // Render Custom Buttons for Fallback
                streamServerSelector.innerHTML = ''; // Clear match servers

                const createFallbackBtn = (text, url, icon) => {
                    const btn = document.createElement('button');
                    btn.className = 'btn-server'; // Use the same class for styling
                    btn.innerHTML = `${icon} ${text}`;
                    btn.style.cssText = `
                        padding: 10px 20px; 
                        background: rgba(255,255,255,0.1); 
                        border: 1px solid rgba(255,255,255,0.2); 
                        color: #fff; 
                        cursor: pointer; 
                        border-radius: 50px; 
                        transition: all 0.3s ease;
                        font-family: inherit;
                        display: flex; align-items: center; gap: 8px;
                     `;

                    btn.addEventListener('click', () => {
                        // Reset styles
                        Array.from(streamServerSelector.children).forEach(b => {
                            b.classList.remove('active');
                        });
                        // Active style
                        btn.classList.add('active');

                        loadStream(url);
                    });
                    return btn;
                };

                if (docStreamUrl) {
                    const btn = createFallbackBtn("القناة الوثائقية", docStreamUrl, '<i class="fas fa-film"></i>');
                    streamServerSelector.appendChild(btn);
                    if (fallbackUrl === docStreamUrl) {
                        btn.classList.add('active');
                    }
                }

                if (newsStreamUrl) {
                    const btn = createFallbackBtn("قناة الأخبار", newsStreamUrl, '<i class="fas fa-newspaper"></i>');
                    streamServerSelector.appendChild(btn);
                    if (fallbackUrl === newsStreamUrl && !docStreamUrl) {
                        btn.classList.add('active');
                    }
                }

                // Remove toast after 10s
                setTimeout(() => { if (toast.parentNode) toast.remove(); }, 10000);
            }

        } else {
            toggleAuthModal(true);
        }
    });

    // --- Helpers & Player Logic ---

    // Function to load stream into appropriate player
    function loadStream(url) {
        if (!url) return;

        const isM3U8 = url.includes('.m3u8');
        const isMP4 = url.includes('.mp4');

        // Reset players
        if (streamFrame) {
            streamFrame.style.display = 'none';
            streamFrame.src = '';
        }
        if (streamVideo) {
            streamVideo.style.display = 'none';
            streamVideo.pause();
            streamVideo.removeAttribute('src'); // Clear src
            if (hls) {
                hls.destroy();
                hls = null;
            }
        }

        if (isM3U8 || isMP4) {
            // Use Video Element
            if (streamVideo) {
                streamVideo.style.display = 'block';

                if (isM3U8) {
                    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                        hls = new Hls();
                        hls.loadSource(url);
                        hls.attachMedia(streamVideo);
                        hls.on(Hls.Events.MANIFEST_PARSED, function () {
                            streamVideo.play().catch(e => console.log('Auto-play prevented:', e));
                        });
                    } else if (streamVideo.canPlayType('application/vnd.apple.mpegurl')) {
                        // Native HLS support (Safari)
                        streamVideo.src = url;
                        streamVideo.addEventListener('loadedmetadata', function () {
                            streamVideo.play().catch(e => console.log('Auto-play prevented:', e));
                        });
                    }
                } else {
                    // MP4
                    streamVideo.src = url;
                    streamVideo.play().catch(e => console.log('Auto-play prevented:', e));
                }
            }
        } else {
            // Use iFrame (YouTube/Other)
            if (streamFrame) {
                streamFrame.style.display = 'block';
                // Auto-convert standard YouTube URLs to Embed before setting src
                streamFrame.src = convertToEmbedUrl(url);
            }
        }
    }

    // Stop video when closing modal
    const stopAndResetPlayers = () => {
        if (streamFrame) {
            streamFrame.src = '';
            streamFrame.style.display = 'none';
        }
        if (streamVideo) {
            streamVideo.pause();
            streamVideo.removeAttribute('src');
            streamVideo.style.display = 'none';
            if (hls) {
                hls.destroy();
                hls = null;
            }
        }
    };

    closeStreamBtn?.addEventListener('click', () => {
        streamModal?.classList.remove('active');
        stopAndResetPlayers();
    });

    streamModal?.addEventListener('click', (e) => {
        if (e.target === streamModal) {
            streamModal.classList.remove('active');
            stopAndResetPlayers();
        }
    });

});

