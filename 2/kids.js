// 90 Show - Kids Section (Firebase Connected)
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

// Security Helpers
const obfuscate = (str) => btoa(unescape(encodeURIComponent(str)));
const deobfuscate = (str) => {
    try { return decodeURIComponent(escape(atob(str))); }
    catch (e) { return str; }
};

// DevTools Protection
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'i' || e.key === 'j')) e.preventDefault();
    if (e.key === 'F12') e.preventDefault();
});

// Initialize Firebase
let app, db;
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("Firebase initialized for Kids Section");
} catch (e) {
    console.error("Firebase init error:", e);
}

// Global State
let KIDS_CHANNELS = [];
let currentPlayer = null;
let hlsInstance = null;
let currentChannelId = null;
let currentServerIndex = 0;

// 1. Initialization
document.addEventListener('DOMContentLoaded', () => {
    initKidsPlatform();
});

function initKidsPlatform() {
    subscribeToKidsData();
    setupSmartTV();

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

// 2. Real-time Subscription
function subscribeToKidsData() {
    db.collection('kids_channels').onSnapshot(snapshot => {
        KIDS_CHANNELS = [];
        snapshot.forEach(doc => KIDS_CHANNELS.push(doc.data()));

        // Sort by order/id
        KIDS_CHANNELS.sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : a.id;
            const orderB = b.order !== undefined ? b.order : b.id;
            return orderA - orderB;
        });

        renderChannels();

        if (KIDS_CHANNELS.length > 0) {
            if (!currentChannelId) {
                selectChannel(KIDS_CHANNELS[0].id);
            } else {
                const exists = KIDS_CHANNELS.find(c => c.id === currentChannelId);
                if (!exists) selectChannel(KIDS_CHANNELS[0].id);
                else {
                    // Update server list if current channel changed
                    renderServers(exists);
                }
            }
        }
    }, err => console.error("Kids Data Sync Error:", err));
}

// 3. Render Channels
function renderChannels() {
    const list = document.getElementById('channel-list');
    if (!list) return;
    list.innerHTML = KIDS_CHANNELS.map(ch => `
        <button class="channel-btn ${ch.id === currentChannelId ? 'active' : ''}" 
                onclick="selectChannel(${ch.id}, this)">
            ${ch.name}
        </button>
    `).join('');
}

// 4. Select Channel
function selectChannel(id, btn) {
    currentChannelId = id;
    currentServerIndex = 0;

    // UI Feedback
    document.querySelectorAll('.channel-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    else {
        const target = Array.from(document.querySelectorAll('.channel-btn')).find(b => b.getAttribute('onclick').includes(id));
        if (target) target.classList.add('active');
    }

    const channel = KIDS_CHANNELS.find(c => c.id === id);
    if (channel) {
        renderServers(channel);
        loadStream(channel.servers[0].url, channel.servers[0].audioUrl || "", channel.servers[0].type || "hls");
    }
}

// 5. Render Servers
function renderServers(channel) {
    const container = document.getElementById('server-switcher');
    if (!container || !channel || !channel.servers || channel.servers.length <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    container.innerHTML = channel.servers.map((srv, idx) => `
        <button class="server-btn ${idx === currentServerIndex ? 'active' : ''}" 
                onclick="switchServer(${idx})">
            ${srv.name || `سيرفر ${idx + 1}`}
        </button>
    `).join('');
}

// 6. Switch Server
function switchServer(index) {
    currentServerIndex = index;
    const channel = KIDS_CHANNELS.find(c => c.id === currentChannelId);
    if (channel && channel.servers[index]) {
        renderServers(channel);
        loadStream(channel.servers[index].url, channel.servers[index].audioUrl || "", channel.servers[index].type || "hls");
    }
}

// 7. Universal Stream Loader
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
            hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
            hlsInstance.loadSource(sourceUrl);
            hlsInstance.attachMedia(video);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => { }));
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-16a2 2 0 0 1-2-2v-2"></path>
                <path d="M2 12h10"></path>
                <path d="m9 15 3-3-3-3"></path>
            </svg>
            <span>90s شو</span>
        `;

        const volume = controls.querySelector('.plyr__volume');
        if (volume) volume.parentNode.insertBefore(branding, volume);
        else controls.appendChild(branding);
    }, 500);
}

function setupSmartTV() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('webos')) document.body.classList.add('tv-optimized');
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
