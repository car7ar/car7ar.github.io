// 90 Show - Final Fixed Universal Player Logic (Stable YouTube & HLS)

const DEFAULT_CHANNELS = [
    {
        id: 1,
        name: "90 شو 1",
        servers: [
            { name: "SD", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
            { name: "HD", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
        ]
    },
    {
        id: 2,
        name: "90 شو 2",
        servers: [{ name: "رئيسي", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" }]
    }
];

// Load and Migrate Data
let rawChannels = JSON.parse(localStorage.getItem('90show_channels')) || DEFAULT_CHANNELS;
let CHANNELS = rawChannels.map(ch => {
    if (ch.url && !ch.servers) {
        return { id: ch.id, name: ch.name, servers: [{ name: "تلقائي", url: ch.url }] };
    }
    return ch;
});

let currentPlayer = null;
let hlsInstance = null;
let currentChannelId = CHANNELS.length > 0 ? CHANNELS[0].id : null;
let currentServerIndex = 0;
let isAdmin = localStorage.getItem('90show_admin') === 'true';

// 1. Initialization
document.addEventListener('DOMContentLoaded', () => {
    initPlatform();
});

function initPlatform() {
    renderChannels();
    setupSmartTV();
    if (currentChannelId) {
        const channel = CHANNELS.find(c => c.id === currentChannelId);
        renderServers(channel);
        loadStream(channel.servers[0].url);
    }
    updateAuthUI();

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

function updateAuthUI() {
    const trigger = document.querySelector('.login-trigger');
    const loggedIn = localStorage.getItem('90show_admin') === 'true';
    if (trigger) {
        if (loggedIn) trigger.style.color = 'var(--accent-neon)';
        else trigger.style.color = '';
    }
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

    const channel = CHANNELS.find(c => c.id === id);
    renderServers(channel);
    loadStream(channel.servers[0].url);
}

function switchServer(index) {
    currentServerIndex = index;
    const channel = CHANNELS.find(c => c.id === currentChannelId);
    renderServers(channel);
    loadStream(channel.servers[index].url);
}

// 5. Universal Stream Loader (Robust Reconstruction)
function loadStream(url) {
    if (!url) return;

    // A. ALWAYS Cleanup previous instances thoroughly
    if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null; }
    if (currentPlayer) { currentPlayer.destroy(); currentPlayer = null; }

    const container = document.getElementById('player-container');
    if (!container) return;

    // Keep the live-indicator but clear the rest
    const indicator = container.querySelector('.live-indicator-on-screen');
    container.innerHTML = '';
    if (indicator) container.appendChild(indicator);

    const youtubeId = getYouTubeId(url);

    // B. Re-create base elements and Initialize
    if (youtubeId) {
        // YouTube Path: Build a clean div for Plyr to handle
        const div = document.createElement('div');
        div.id = 'player';
        container.appendChild(div);

        currentPlayer = new Plyr(div, getPlyrConfig());
        injectBranding();

        // Critical: Set the source explicitly to target the YouTube Provider
        currentPlayer.source = {
            type: 'video',
            sources: [{ src: youtubeId, provider: 'youtube' }]
        };
    } else {
        // HTML5/HLS Path: Build a clean video tag
        const video = document.createElement('video');
        video.id = 'player';
        video.playsInline = true;
        video.controls = true;
        video.crossOrigin = 'anonymous';
        container.appendChild(video);

        currentPlayer = new Plyr(video, getPlyrConfig());
        injectBranding();

        const isStream = url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('.ts');
        if (isStream && Hls.isSupported()) {
            hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
            hlsInstance.loadSource(url);
            hlsInstance.attachMedia(video);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => { }));
            hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hlsInstance.startLoad();
                    else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hlsInstance.recoverMediaError();
                }
            });
        } else {
            video.src = url;
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
    // Wait for Plyr to mount the controls
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

        // Find volume control to place branding next to it
        const volume = controls.querySelector('.plyr__volume');
        if (volume) {
            volume.parentNode.insertBefore(branding, volume);
        } else {
            controls.appendChild(branding);
        }
    }, 200);
}

// --- ADMIN SYSTEM ---

function toggleAdmin() {
    const loggedIn = localStorage.getItem('90show_admin') === 'true';
    if (loggedIn) showAdminPanel();
    else showLoginModal();
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
    if (user === 'admin' && pass === 'admin') {
        localStorage.setItem('90show_admin', 'true');
        isAdmin = true;
        updateAuthUI();
        document.getElementById('login-modal').style.display = 'none';
        showAdminPanel();
    } else alert('خطأ في البيانات');
}

function handleLogout() {
    localStorage.removeItem('90show_admin');
    isAdmin = false;
    location.reload();
}

function showAdminPanel() {
    document.getElementById('admin-panel').style.display = 'flex';
    renderAdminChannels();
}

function renderAdminChannels() {
    const list = document.getElementById('admin-channel-list');
    if (!list) return;
    list.innerHTML = CHANNELS.map((ch, index) => `
        <tr>
            <td class="channel-name-cell">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="row-reorder-btns">
                        <button class="reorder-btn" onclick="moveChannel(${ch.id}, -1)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        </button>
                        <button class="reorder-btn" onclick="moveChannel(${ch.id}, 1)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
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

function moveChannel(id, direction) {
    const index = CHANNELS.findIndex(c => c.id == id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= CHANNELS.length) return;

    // Swap channels in the array
    const temp = CHANNELS[index];
    CHANNELS[index] = CHANNELS[newIndex];
    CHANNELS[newIndex] = temp;

    // Save and re-render
    localStorage.setItem('90show_channels', JSON.stringify(CHANNELS));
    renderChannels();
    renderAdminChannels();
}

function addServerInputRow(name = "", url = "") {
    const container = document.getElementById('server-inputs-container');
    const row = document.createElement('div');
    row.className = 'server-row';
    row.innerHTML = `
        <div class="row-reorder-btns">
            <button class="reorder-btn" onclick="moveServerRow(this, -1)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </button>
            <button class="reorder-btn" onclick="moveServerRow(this, 1)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
        </div>
        <input type="text" placeholder="مثال: HD" value="${name}" class="srv-name" style="flex: 1;">
        <input type="text" placeholder="رابط البث M3U8 أو YouTube" value="${url}" class="srv-url" style="flex: 2;">
        <button class="btn-primary btn-sm btn-danger" onclick="this.parentElement.remove()" style="width: auto; padding: 12px 15px;">حذف</button>
    `;
    container.appendChild(row);
}

function moveServerRow(btn, direction) {
    const row = btn.closest('.server-row');
    const container = row.parentNode;
    if (direction === -1) {
        const prev = row.previousElementSibling;
        if (prev && prev.classList.contains('server-row')) {
            container.insertBefore(row, prev);
        }
    } else if (direction === 1) {
        const next = row.nextElementSibling;
        if (next && next.classList.contains('server-row')) {
            container.insertBefore(next, row);
        }
    }
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
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('ch-name').value;
    const serverRows = document.querySelectorAll('.server-row');
    const servers = [];
    serverRows.forEach(row => {
        const sName = row.querySelector('.srv-name').value;
        const sUrl = row.querySelector('.srv-url').value;
        if (sName && sUrl) servers.push({ name: sName, url: sUrl });
    });

    if (!name || servers.length === 0) return alert('يرجى ملء البيانات');

    if (id) {
        const index = CHANNELS.findIndex(c => c.id == id);
        CHANNELS[index] = { ...CHANNELS[index], name, servers };
    } else {
        CHANNELS.push({ id: Date.now(), name, servers });
    }

    localStorage.setItem('90show_channels', JSON.stringify(CHANNELS));
    renderChannels();
    renderAdminChannels();
    hideChannelForm();
}

function editChannel(id) {
    const ch = CHANNELS.find(c => c.id == id);
    document.getElementById('edit-id').value = ch.id;
    document.getElementById('ch-name').value = ch.name;
    const container = document.getElementById('server-inputs-container');
    container.innerHTML = '';
    ch.servers.forEach(s => addServerInputRow(s.name, s.url));
    document.getElementById('channel-form').style.display = 'block';
}

function deleteChannel(id) {
    if (confirm('حذف القناة؟')) {
        CHANNELS = CHANNELS.filter(c => c.id != id);
        localStorage.setItem('90show_channels', JSON.stringify(CHANNELS));
        renderChannels();
        renderAdminChannels();
    }
}

function setupSmartTV() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('webos')) document.body.classList.add('tv-optimized');
}

// PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => { });
    });
}

function switchAdminTab(tabId) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });

    // Deactivate all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(tabId).style.display = 'block';

    // Activate clicked button
    const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn =>
        btn.getAttribute('onclick').includes(tabId)
    );
    if (targetBtn) targetBtn.classList.add('active');

    // Load kids channels when switching to kids tab
    if (tabId === 'kids-channels-tab') {
        renderAdminKidsChannels();
    }
}

// Kids Channel Management Functions
let KIDS_CHANNELS = JSON.parse(localStorage.getItem('90show_kids_channels')) || [
    { id: 1, name: "قناة الأطفال 1", servers: [{ name: "رئيسي", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }] },
    { id: 2, name: "قناة الأطفال 2", servers: [{ name: "رئيسي", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" }] }
];

function renderAdminKidsChannels() {
    const list = document.getElementById('admin-kids-channel-list');
    if (!list) return;
    list.innerHTML = KIDS_CHANNELS.map((ch, index) => `
        <tr>
            <td class="channel-name-cell">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="row-reorder-btns">
                        <button class="reorder-btn" onclick="moveKidsChannel(${ch.id}, -1)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        </button>
                        <button class="reorder-btn" onclick="moveKidsChannel(${ch.id}, 1)">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                    </div>
                    ${ch.name}
                </div>
            </td>
            <td><span class="server-count-badge" style="background: rgba(255,107,157,0.1); color: #FF6B9D;">${ch.servers.length} سيرفرات</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-primary btn-sm btn-edit" onclick="editKidsChannel(${ch.id})">تعديل</button>
                    <button class="btn-primary btn-sm btn-danger" onclick="deleteKidsChannel(${ch.id})">حذف</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function moveKidsChannel(id, direction) {
    const index = KIDS_CHANNELS.findIndex(c => c.id == id);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= KIDS_CHANNELS.length) return;

    const temp = KIDS_CHANNELS[index];
    KIDS_CHANNELS[index] = KIDS_CHANNELS[newIndex];
    KIDS_CHANNELS[newIndex] = temp;

    localStorage.setItem('90show_kids_channels', JSON.stringify(KIDS_CHANNELS));
    renderAdminKidsChannels();
}

function addKidsServerInputRow(name = "", url = "") {
    const container = document.getElementById('kids-server-inputs-container');
    const row = document.createElement('div');
    row.className = 'server-row';
    row.innerHTML = `
        <div class="row-reorder-btns">
            <button class="reorder-btn" onclick="moveServerRow(this, -1)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </button>
            <button class="reorder-btn" onclick="moveServerRow(this, 1)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
        </div>
        <input type="text" placeholder="مثال: HD" value="${name}" class="srv-name" style="flex: 1;">
        <input type="text" placeholder="رابط البث M3U8 أو YouTube" value="${url}" class="srv-url" style="flex: 2;">
        <button class="btn-primary btn-sm btn-danger" onclick="this.parentElement.remove()" style="width: auto; padding: 12px 15px;">حذف</button>
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
    const id = document.getElementById('kids-edit-id').value;
    const name = document.getElementById('kids-ch-name').value;
    const serverRows = document.querySelectorAll('#kids-server-inputs-container .server-row');
    const servers = [];
    serverRows.forEach(row => {
        const sName = row.querySelector('.srv-name').value;
        const sUrl = row.querySelector('.srv-url').value;
        if (sName && sUrl) servers.push({ name: sName, url: sUrl });
    });

    if (!name || servers.length === 0) return alert('يرجى ملء البيانات');

    if (id) {
        const index = KIDS_CHANNELS.findIndex(c => c.id == id);
        KIDS_CHANNELS[index] = { ...KIDS_CHANNELS[index], name, servers };
    } else {
        KIDS_CHANNELS.push({ id: Date.now(), name, servers });
    }

    localStorage.setItem('90show_kids_channels', JSON.stringify(KIDS_CHANNELS));
    renderAdminKidsChannels();
    hideKidsChannelForm();
}

function editKidsChannel(id) {
    const ch = KIDS_CHANNELS.find(c => c.id == id);
    document.getElementById('kids-edit-id').value = ch.id;
    document.getElementById('kids-ch-name').value = ch.name;
    const container = document.getElementById('kids-server-inputs-container');
    container.innerHTML = '';
    ch.servers.forEach(s => addKidsServerInputRow(s.name, s.url));
    document.getElementById('kids-channel-form').style.display = 'block';
}

function deleteKidsChannel(id) {
    if (confirm('حذف قناة الأطفال؟')) {
        KIDS_CHANNELS = KIDS_CHANNELS.filter(c => c.id != id);
        localStorage.setItem('90show_kids_channels', JSON.stringify(KIDS_CHANNELS));
        renderAdminKidsChannels();
    }
}
