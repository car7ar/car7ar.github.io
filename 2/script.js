// 90 Show - Firebase Connected
// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAS7Dai5B31cyeC4UNNE8H_o_3GoFuZOf4",
    authDomain: "shwo90s.firebaseapp.com",
    projectId: "shwo90s",
    storageBucket: "shwo90s.firebasestorage.app",
    messagingSenderId: "231335069201",
    appId: "1:231335069201:web:1b935ca1151547189c13b0",
    measurementId: "G-CJF8M3TJEG"
};

// Initialize Firebase
let app, db, auth;
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    console.log("Firebase initialized");
} catch (e) {
    console.error("Firebase init error:", e);
}

// Security Helpers
const obfuscate = (str) => btoa(unescape(encodeURIComponent(str)));
const deobfuscate = (str) => {
    try { return decodeURIComponent(escape(atob(str))); }
    catch (e) { return str; } // Fallback for old plain-text links
};

// DevTools Protection
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'i' || e.key === 'j')) e.preventDefault();
    if (e.key === 'F12') e.preventDefault();
});

// Global State
let CHANNELS = [];
let KIDS_CHANNELS = [];
let currentPlayer = null;
let hlsInstance = null;
let currentChannelId = null;
let currentServerIndex = 0;

// 1. Initialization
document.addEventListener('DOMContentLoaded', () => {
    initPlatform();
});

function initPlatform() {
    subscribeToData(); // Start Real-time Listeners
    setupSmartTV();

    // Auth Listener
    auth.onAuthStateChanged(user => {
        updateAuthUI(user);
        if (!user) {
            document.getElementById('admin-panel').style.display = 'none';
        }
    });

    // Auto-hide alert
    const alertBox = document.querySelector('.info-alert');
    if (alertBox) {
        setTimeout(() => {
            alertBox.style.transition = 'opacity 1s ease, transform 1s ease';
            alertBox.style.opacity = '0';
            alertBox.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                alertBox.style.display = 'none';
                alertBox.remove();
            }, 1000);
        }, 8000);
    }
}

function updateAuthUI(user) {
    const trigger = document.querySelector('.login-trigger');
    if (trigger) {
        if (user) trigger.style.color = 'var(--accent-neon)';
        else trigger.style.color = '';
    }
}

// --- FIREBASE DATA SUBSCRIPTIONS ---

function subscribeToData() {
    // 1. Main Channels
    db.collection('channels').onSnapshot(snapshot => {
        if (snapshot.empty && localStorage.getItem('90show_channels')) {
            const local = JSON.parse(localStorage.getItem('90show_channels'));
            local.forEach(ch => {
                const data = { ...ch, order: ch.id };
                if (data.url && !data.servers) data.servers = [{ name: "تلقائي", url: data.url }];
                db.collection('channels').doc(String(ch.id)).set(data);
            });
            return;
        }

        CHANNELS = [];
        snapshot.forEach(doc => CHANNELS.push(doc.data()));

        // Sort by 'order' field, fallback to 'id'
        CHANNELS.sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : a.id;
            const orderB = b.order !== undefined ? b.order : b.id;
            return orderA - orderB;
        });

        // Self-Correction: Ensure all documents have an 'order' field
        if (CHANNELS.some(c => c.order === undefined) && CHANNELS.length > 0) {
            const batch = db.batch();
            CHANNELS.forEach((ch, index) => {
                const ref = db.collection('channels').doc(String(ch.id));
                batch.update(ref, { order: index });
            });
            batch.commit().catch(e => console.error("Order Migration Error:", e));
        }

        renderChannels();
        if (auth.currentUser) renderAdminChannels();

        if (!currentChannelId && CHANNELS.length > 0) {
            changeChannel(CHANNELS[0].id);
        } else if (currentChannelId) {
            const exists = CHANNELS.find(c => c.id === currentChannelId);
            if (!exists && CHANNELS.length > 0) changeChannel(CHANNELS[0].id);
        }
    }, err => console.error("Channels Sync Error:", err));

    // 2. Kids Channels
    db.collection('kids_channels').onSnapshot(snapshot => {
        if (snapshot.empty && localStorage.getItem('90show_kids_channels')) {
            const local = JSON.parse(localStorage.getItem('90show_kids_channels'));
            local.forEach(ch => {
                const data = { ...ch, order: ch.id };
                db.collection('kids_channels').doc(String(ch.id)).set(data);
            });
            return;
        }

        KIDS_CHANNELS = [];
        snapshot.forEach(doc => KIDS_CHANNELS.push(doc.data()));

        KIDS_CHANNELS.sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : a.id;
            const orderB = b.order !== undefined ? b.order : b.id;
            return orderA - orderB;
        });

        // Self-Correction for Kids
        if (KIDS_CHANNELS.some(c => c.order === undefined) && KIDS_CHANNELS.length > 0) {
            const batch = db.batch();
            KIDS_CHANNELS.forEach((ch, index) => {
                const ref = db.collection('kids_channels').doc(String(ch.id));
                batch.update(ref, { order: index });
            });
            batch.commit().catch(e => console.error("Kids Order Migration Error:", e));
        }

        if (auth.currentUser) renderAdminKidsChannels();
    });

    // 3. Platform Settings
    db.collection('settings').doc('platform').onSnapshot(doc => {
        if (doc.exists) {
            applyPlatformSettings(doc.data());
        } else if (localStorage.getItem('90show_platform_settings')) {
            const local = JSON.parse(localStorage.getItem('90show_platform_settings'));
            db.collection('settings').doc('platform').set(local);
        }
    });
}

// 2. Render Channel List
function renderChannels() {
    const container = document.getElementById('channel-list');
    if (!container) return;
    container.innerHTML = CHANNELS.map(ch => `
        <button class="channel-btn ${ch.id === currentChannelId ? 'active' : ''}" 
                onclick="changeChannel(${ch.id}, this)">
            <span class="badge">LIVE</span>
            ${ch.name}
        </button>
    `).join('');
}

// 3. Render Server Switcher
function renderServers(channel) {
    const container = document.getElementById('server-switcher');
    if (!container) return;
    if (!channel || !channel.servers || channel.servers.length <= 1) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = channel.servers.map((srv, index) => `
        <button class="server-btn ${index === currentServerIndex ? 'active' : ''}" 
                onclick="switchServer(${index})">
            ${srv.name}
        </button>
    `).join('');
}

// 4. Switching Logic
function changeChannel(id, btn) {
    currentChannelId = id;
    currentServerIndex = 0;

    document.querySelectorAll('.channel-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    else {
        const target = Array.from(document.querySelectorAll('.channel-btn')).find(b => b.getAttribute('onclick').includes(id));
        if (target) target.classList.add('active');
    }

    const channel = CHANNELS.find(c => c.id === id);
    if (channel) {
        renderServers(channel);
        loadStream(channel.servers[0].url, channel.servers[0].audioUrl, channel.servers[0].type || "hls");
    }
}

function switchServer(index) {
    currentServerIndex = index;
    const channel = CHANNELS.find(c => c.id === currentChannelId);
    if (channel && channel.servers[index]) {
        renderServers(channel);
        loadStream(channel.servers[index].url, channel.servers[index].audioUrl, channel.servers[index].type || "hls");
    }
}

// 5. Universal Stream Loader
function loadStream(url, audioUrl = "", type = "hls") {
    if (!url) return;

    if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
    if (currentPlayer) { currentPlayer.destroy(); currentPlayer = null; }

    const container = document.getElementById('player-container');
    if (!container) return;

    const indicator = container.querySelector('.live-indicator-on-screen');
    container.innerHTML = '';
    if (indicator) container.appendChild(indicator);

    // Handle Iframe Embed Type
    if (type === 'iframe') {
        const realUrl = deobfuscate(url);
        const iframe = document.createElement('iframe');
        iframe.src = realUrl;
        iframe.className = 'player-iframe';
        iframe.allowFullscreen = true;
        iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        container.appendChild(iframe);
        return;
    }

    const youtubeId = getYouTubeId(url);

    if (youtubeId) {
        const div = document.createElement('div');
        div.id = 'player';
        container.appendChild(div);

        currentPlayer = new Plyr(div, getPlyrConfig());
        handleOrientation(currentPlayer);
        injectBranding();

        currentPlayer.source = {
            type: 'video',
            sources: [{ src: youtubeId, provider: 'youtube' }]
        };
    } else {
        let sourceUrl = url;
        const isHls = url.toLowerCase().includes('.m3u8');

        // Create virtual Master Playlist if audioUrl is provided
        if (isHls && audioUrl) {
            const masterPlaylist =
                "#EXTM3U\n" +
                "#EXT-X-VERSION:3\n" +
                `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Main",DEFAULT=YES,AUTOSELECT=YES,URI="${audioUrl}"\n` +
                `#EXT-X-STREAM-INF:BANDWIDTH=5000000,AUDIO="audio"\n` +
                `${url}`;

            const blob = new Blob([masterPlaylist], { type: 'application/x-mpegURL' });
            sourceUrl = URL.createObjectURL(blob);
        }

        const video = document.createElement('video');
        video.id = 'player';
        video.playsInline = true;
        video.controls = true;
        video.crossOrigin = 'anonymous';
        container.appendChild(video);

        currentPlayer = new Plyr(video, getPlyrConfig());
        handleOrientation(currentPlayer);
        injectBranding();

        if (isHls && Hls.isSupported()) {
            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            hlsInstance.loadSource(sourceUrl);
            hlsInstance.attachMedia(video);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => { }));
            hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hlsInstance.startLoad();
                    else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hlsInstance.recoverMediaError();
                }
            });
        } else {
            video.src = sourceUrl;
            video.load();
            video.play().catch(() => { });
        }
    }
}

function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function getPlyrConfig() {
    return {
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
        i18n: { play: 'تشغيل', pause: 'إيقاف', mute: 'كتم', settings: 'إعدادات' },
        youtube: { noCookie: true, rel: 0, modestbranding: 1, iv_load_policy: 3 }
    };
}

function injectBranding() {
    setTimeout(() => {
        const controls = document.querySelector('.plyr__controls');
        if (!controls || document.querySelector('.plyr-branding')) return;

        const branding = document.createElement('div');
        branding.className = 'plyr-branding';
        branding.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-16a2 2 0 0 1-2-2v-2"></path>
                <path d="M2 12h10"></path>
                <path d="m9 15 3-3-3-3"></path>
            </svg>
            <span>90s شو</span>
        `;

        const volume = controls.querySelector('.plyr__volume');
        if (volume) volume.parentNode.insertBefore(branding, volume);
        else controls.appendChild(branding);
    }, 200);
}

// --- ADMIN SYSTEM ---

function toggleAdmin() {
    if (auth.currentUser) {
        showAdminPanel();
    } else {
        showLoginModal();
    }
}

function showLoginModal() {
    document.getElementById('login-modal').style.display = 'flex';
}

function closeModal(e, id) {
    if (e.target.id === id) document.getElementById(id).style.display = 'none';
}

function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (!user || !pass) {
        showToast('يرجى إدخال البيانات');
        return;
    }

    showToast('جاري تسجيل الدخول...');

    auth.signInWithEmailAndPassword(user, pass)
        .then(() => {
            showToast('تم تسجيل الدخول بنجاح');
            document.getElementById('login-modal').style.display = 'none';
            showAdminPanel();
        })
        .catch((error) => {
            console.error(error);
            showToast('خطأ: ' + error.message);
        });
}

function handleLogout() {
    auth.signOut().then(() => showToast('تم تسجيل الخروج'));
}

function showAdminPanel() {
    if (!auth.currentUser) return;
    document.getElementById('admin-panel').style.display = 'flex';
    renderAdminChannels();
}

function renderAdminChannels() {
    const list = document.getElementById('admin-channel-list');
    if (!list) return;
    list.innerHTML = CHANNELS.map((ch) => `
        <tr>
            <td class="channel-name-cell">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="row-reorder-btns">
                        <button class="reorder-btn" onclick="moveChannel(${ch.id}, -1)">▲</button>
                        <button class="reorder-btn" onclick="moveChannel(${ch.id}, 1)">▼</button>
                    </div>
                    ${ch.name}
                </div>
            </td>
            <td><span class="server-count-badge">${ch.servers.length} سيرفرات</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-primary btn-sm btn-edit" onclick="editChannel(${ch.id})">تعديل</button>
                    <button class="btn-primary btn-sm btn-danger" onclick="deleteChannel(${ch.id})">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function addServerInputRow(name = "", url = "", audioUrl = "", type = "hls") {
    const container = document.getElementById('server-inputs-container');
    const row = document.createElement('div');
    row.className = 'server-row-v2';
    row.setAttribute('data-server-type', type);
    row.innerHTML = `
        <div class="server-row-header">
            <span class="server-drag-handle">☰</span>
            <select class="srv-type" onchange="toggleAudioField(this)">
                <option value="hls" ${type === 'hls' ? 'selected' : ''}>بث مباشر (HLS)</option>
                <option value="iframe" ${type === 'iframe' ? 'selected' : ''}>تضمين (Iframe)</option>
            </select>
            <button class="remove-srv-btn" onclick="this.closest('.server-row-v2').remove()">✕</button>
        </div>
        <div class="server-row-body">
            <div class="field-group">
                <label>اسم السيرفر</label>
                <input type="text" placeholder="مثال: HD" value="${name}" class="srv-name" required>
            </div>
            <div class="field-group" style="flex: 2;">
                <label>رابط الفيديو</label>
                <input type="text" placeholder="رابط m3u8 أو رابط التضمين" value="${url}" class="srv-url" required>
            </div>
            <div class="field-group hls-only-field" style="flex: 2;">
                <label>رابط الصوت (اختياري)</label>
                <input type="text" placeholder="رابط m3u8 الخاص بالصوت" value="${audioUrl}" class="srv-audio-url">
            </div>
        </div>
    `;
    container.appendChild(row);
}

function toggleAudioField(select) {
    const row = select.closest('.server-row-v2');
    row.setAttribute('data-server-type', select.value);
}

function showChannelForm() {
    document.getElementById('channel-form').style.display = 'block';
    document.getElementById('edit-id').value = '';
    document.getElementById('ch-name').value = '';
    document.getElementById('server-inputs-container').innerHTML = '';
    addServerInputRow();
}

function hideChannelForm() { document.getElementById('channel-form').style.display = 'none'; }

function saveChannel() {
    if (!auth.currentUser) return showToast('غير مصرح لك');

    const id = document.getElementById('edit-id').value || Date.now();
    const name = document.getElementById('ch-name').value;
    const serverRows = document.querySelectorAll('#channel-form .server-row-v2');
    const servers = [];
    serverRows.forEach(row => {
        const sName = row.querySelector('.srv-name').value;
        const sUrl = row.querySelector('.srv-url').value;
        const sAudioUrl = row.querySelector('.srv-audio-url').value;
        const sType = row.querySelector('.srv-type').value;

        let finalUrl = sUrl;
        if (sType === 'iframe' && sUrl && !sUrl.startsWith('http')) {
            // Probably already obfuscated encoded string
            finalUrl = sUrl;
        } else if (sType === 'iframe' && sUrl) {
            finalUrl = obfuscate(sUrl);
        }

        if (sName && sUrl) servers.push({ name: sName, url: finalUrl, audioUrl: sAudioUrl, type: sType });
    });

    if (!name || servers.length === 0) return alert('يرجى ملء البيانات');

    let order = Number(id);
    if (document.getElementById('edit-id').value) {
        const existing = CHANNELS.find(c => c.id == id);
        if (existing && existing.order !== undefined) order = existing.order;
    }

    const channelData = { id: Number(id), name, servers, order };

    showToast('جاري الحفظ...');
    db.collection('channels').doc(String(id)).set(channelData, { merge: true })
        .then(() => {
            showToast('تم الحفظ بنجاح');
            hideChannelForm();
        })
        .catch(error => {
            console.error("Save Error:", error);
            showToast('خطأ في الحفظ: ' + error.message);
        });
}

function editChannel(id) {
    const ch = CHANNELS.find(c => c.id == id);
    if (!ch) return;
    document.getElementById('edit-id').value = ch.id;
    document.getElementById('ch-name').value = ch.name;
    const container = document.getElementById('server-inputs-container');
    container.innerHTML = '';
    ch.servers.forEach(s => {
        const realUrl = s.type === 'iframe' ? deobfuscate(s.url) : s.url;
        addServerInputRow(s.name, realUrl, s.audioUrl || "", s.type || "hls");
    });
    document.getElementById('channel-form').style.display = 'block';
}

function deleteChannel(id) {
    if (!auth.currentUser) return showToast('غير مصرح لك');
    if (confirm('حذف القناة؟')) {
        db.collection('channels').doc(String(id)).delete()
            .then(() => showToast('تم الحذف'))
            .catch(e => {
                console.error("Delete Error:", e);
                showToast('خطأ في الحذف: ' + e.message);
            });
    }
}

async function moveChannel(id, direction) {
    if (!auth.currentUser) return;
    const index = CHANNELS.findIndex(c => c.id == id);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= CHANNELS.length) return;

    const items = [...CHANNELS];
    const [movedItem] = items.splice(index, 1);
    items.splice(newIndex, 0, movedItem);

    showToast('جاري الترتيب...');
    try {
        const batch = db.batch();
        items.forEach((ch, idx) => {
            const ref = db.collection('channels').doc(String(ch.id));
            batch.update(ref, { order: idx });
        });
        await batch.commit();
        showToast('تم الترتيب بنجاح');
    } catch (e) {
        console.error("Move Error:", e);
        showToast('خطأ في الترتيب: ' + e.message);
    }
}

function setupSmartTV() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('webos')) document.body.classList.add('tv-optimized');
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => { });
    });
}

function switchAdminTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (targetBtn) targetBtn.classList.add('active');
    if (tabId === 'kids-channels-tab') renderAdminKidsChannels();
}

// --- KIDS CHANNELS ---

function renderAdminKidsChannels() {
    const list = document.getElementById('admin-kids-channel-list');
    if (!list) return;
    list.innerHTML = KIDS_CHANNELS.map((ch) => `
        <tr>
            <td class="channel-name-cell">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="row-reorder-btns">
                        <button class="reorder-btn"  onclick="moveKidsChannel(${ch.id}, -1)">▲</button>
                        <button class="reorder-btn"  onclick="moveKidsChannel(${ch.id}, 1)">▼</button>
                    </div>
                    ${ch.name}
                </div>
            </td>
            <td><span class="server-count-badge">${ch.servers.length} سيرفرات</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-primary btn-sm btn-edit" onclick="editKidsChannel(${ch.id})">تعديل</button>
                    <button class="btn-primary btn-sm btn-danger" onclick="deleteKidsChannel(${ch.id})">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function moveKidsChannel(id, direction) {
    if (!auth.currentUser) return;
    const index = KIDS_CHANNELS.findIndex(c => c.id == id);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= KIDS_CHANNELS.length) return;

    const items = [...KIDS_CHANNELS];
    const [movedItem] = items.splice(index, 1);
    items.splice(newIndex, 0, movedItem);

    showToast('جاري الترتيب...');
    try {
        const batch = db.batch();
        items.forEach((ch, idx) => {
            const ref = db.collection('kids_channels').doc(String(ch.id));
            batch.update(ref, { order: idx });
        });
        await batch.commit();
        showToast('تم الترتيب بنجاح');
    } catch (e) {
        showToast('خطأ في الترتيب');
    }
}

function addKidsServerInputRow(name = "", url = "", audioUrl = "", type = "hls") {
    const container = document.getElementById('kids-server-inputs-container');
    const row = document.createElement('div');
    row.className = 'server-row-v2';
    row.setAttribute('data-server-type', type);
    row.innerHTML = `
        <div class="server-row-header">
            <span class="server-drag-handle">☰</span>
            <select class="srv-type" onchange="toggleAudioField(this)">
                <option value="hls" ${type === 'hls' ? 'selected' : ''}>بث مباشر (HLS)</option>
                <option value="iframe" ${type === 'iframe' ? 'selected' : ''}>تضمين (Iframe)</option>
            </select>
            <button class="remove-srv-btn" onclick="this.closest('.server-row-v2').remove()">✕</button>
        </div>
        <div class="server-row-body">
            <div class="field-group">
                <label>اسم السيرفر</label>
                <input type="text" placeholder="مثال: HD" value="${name}" class="srv-name" required>
            </div>
            <div class="field-group" style="flex: 2;">
                <label>رابط الفيديو</label>
                <input type="text" placeholder="رابط m3u8 أو رابط التضمين" value="${url}" class="srv-url" required>
            </div>
            <div class="field-group hls-only-field" style="flex: 2;">
                <label>رابط الصوت (اختياري)</label>
                <input type="text" placeholder="رابط m3u8 الخاص بالصوت" value="${audioUrl}" class="srv-audio-url">
            </div>
        </div>
    `;
    container.appendChild(row);
}

function showKidsChannelForm() {
    document.getElementById('kids-channel-form').style.display = 'block';
    document.getElementById('kids-edit-id').value = '';
    document.getElementById('kids-ch-name').value = '';
    document.getElementById('kids-server-inputs-container').innerHTML = '';
    addKidsServerInputRow();
}

function hideKidsChannelForm() {
    document.getElementById('kids-channel-form').style.display = 'none';
}

function saveKidsChannel() {
    if (!auth.currentUser) return;
    const id = document.getElementById('kids-edit-id').value || Date.now();
    const name = document.getElementById('kids-ch-name').value;
    const serverRows = document.querySelectorAll('#kids-server-inputs-container .server-row-v2');
    const servers = [];
    serverRows.forEach(row => {
        const sName = row.querySelector('.srv-name').value;
        const sUrl = row.querySelector('.srv-url').value;
        const sAudioUrl = row.querySelector('.srv-audio-url').value;
        const sType = row.querySelector('.srv-type').value;

        let finalUrl = sUrl;
        if (sType === 'iframe' && sUrl && !sUrl.startsWith('http')) {
            finalUrl = sUrl;
        } else if (sType === 'iframe' && sUrl) {
            finalUrl = obfuscate(sUrl);
        }

        if (sName && sUrl) servers.push({ name: sName, url: finalUrl, audioUrl: sAudioUrl, type: sType });
    });

    if (!name || servers.length === 0) return alert('يرجى ملء البيانات');

    let order = Number(id);
    if (document.getElementById('kids-edit-id').value) {
        const existing = KIDS_CHANNELS.find(c => c.id == id);
        if (existing && existing.order !== undefined) order = existing.order;
    }

    const data = { id: Number(id), name, servers, order };
    db.collection('kids_channels').doc(String(id)).set(data, { merge: true })
        .then(() => { showToast('تم حفظ قناة الأطفال'); hideKidsChannelForm(); })
        .catch(e => {
            console.error("Kids Save Error:", e);
            showToast('خطأ في الحفظ: ' + e.message);
        });
}

function editKidsChannel(id) {
    const ch = KIDS_CHANNELS.find(c => c.id == id);
    if (!ch) return;
    document.getElementById('kids-edit-id').value = ch.id;
    document.getElementById('kids-ch-name').value = ch.name;
    const container = document.getElementById('kids-server-inputs-container');
    container.innerHTML = '';
    ch.servers.forEach(s => {
        const realUrl = s.type === 'iframe' ? deobfuscate(s.url) : s.url;
        addKidsServerInputRow(s.name, realUrl, s.audioUrl || "", s.type || "hls");
    });
    document.getElementById('kids-channel-form').style.display = 'block';
}

function deleteKidsChannel(id) {
    if (!auth.currentUser) return;
    if (confirm('حذف قناة الأطفال؟')) {
        db.collection('kids_channels').doc(String(id)).delete();
    }
}

function handleOrientation(player) {
    player.on('enterfullscreen', () => {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => { });
        }
    });
    player.on('exitfullscreen', () => {
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    });
}

function savePlatformSettings() {
    if (!auth.currentUser) return showToast('غير مصرح لك');
    const statusText = document.getElementById('site-status-text').value;
    const siteTitle = document.getElementById('site-title').value;
    const settings = {
        statusText: statusText || 'بث مباشر (Ultra HD)',
        siteTitle: siteTitle || '90 شو'
    };
    db.collection('settings').doc('platform').set(settings)
        .then(() => showToast('تم حفظ الإعدادات'))
        .catch(e => {
            console.error("Settings Save Error:", e);
            showToast('خطأ في حفظ الإعدادات: ' + e.message);
        });
}

function applyPlatformSettings(settings) {
    if (!settings) return;
    const statusInput = document.getElementById('site-status-text');
    const titleInput = document.getElementById('site-title');
    if (statusInput && document.activeElement !== statusInput) statusInput.value = settings.statusText;
    if (titleInput && document.activeElement !== titleInput) titleInput.value = settings.siteTitle;
    if (settings.siteTitle) document.title = '90 Show | ' + settings.siteTitle;
    if (settings.statusText) {
        const liveIndicator = document.querySelector('.live-indicator-on-screen');
        if (liveIndicator) {
            liveIndicator.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                    stroke-linecap="round" stroke-linejoin="round" style="margin-left: 5px; opacity: 0.9;">
                    <path d="M5 12h14"></path>
                    <path d="M12 5v14"></path>
                </svg>
                <div class="live-dot"></div>
                ${settings.statusText}
            `;
        }
        const siteBranding = document.querySelector('.site-branding');
        if (siteBranding) siteBranding.textContent = settings.statusText;
    }
}

function showToast(message) {
    let toast = document.querySelector('.toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        ${message}
    `;
    void toast.offsetWidth;
    toast.classList.add('show');
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => toast.classList.remove('show'), 3000);
}
