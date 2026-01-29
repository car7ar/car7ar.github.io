// Kids Section - Dedicated Channel Management
// Based on the main site's architecture with kid-appropriate content

const DEFAULT_KIDS_CHANNELS = [
    {
        id: 1,
        name: "قناة الأطفال 1",
        servers: [
            { name: "رئيسي", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
        ]
    },
    {
        id: 2,
        name: "قناة الأطفال 2",
        servers: [
            { name: "رئيسي", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" }
        ]
    }
];

// Load and Migrate Kids Data
let rawKidsChannels = JSON.parse(localStorage.getItem('90show_kids_channels')) || DEFAULT_KIDS_CHANNELS;
let KIDS_CHANNELS = rawKidsChannels.map(ch => {
    if (ch.url && !ch.servers) {
        return { id: ch.id, name: ch.name, servers: [{ name: "تلقائي", url: ch.url }] };
    }
    return ch;
});

let currentPlayer = null;
let hlsInstance = null;
let currentChannelId = KIDS_CHANNELS.length > 0 ? KIDS_CHANNELS[0].id : null;
let currentServerIndex = 0;

// 1. Initialization
document.addEventListener('DOMContentLoaded', () => {
    initKidsPlatform();
});

function initKidsPlatform() {
    renderChannels();
    setupSmartTV();
    if (currentChannelId) {
        const channel = KIDS_CHANNELS.find(c => c.id === currentChannelId);
        renderServers(channel);
        loadStream(channel.servers[0].url);
    }

    // Auto-hide alert
    const alertBox = document.querySelector('.info-alert');
    if (alertBox) {
        setTimeout(() => {
            alertBox.style.transition = 'opacity 1s ease, transform 1s ease';
            alertBox.style.opacity = '0';
            alertBox.style.transform = 'translateY(-10px)'; // Slide up slightly
            setTimeout(() => {
                alertBox.style.display = 'none'; // Use display none to collapse space if needed, or remove
                alertBox.remove();
            }, 1000);
        }, 8000); // Disappear after 8 seconds
    }
}

// 2. Render Channels
function renderChannels() {
    const list = document.getElementById('channel-list');
    if (!list) return;
    list.innerHTML = KIDS_CHANNELS.map(ch => `
        <button class="channel-btn ${ch.id === currentChannelId ? 'active' : ''}" 
                onclick="selectChannel(${ch.id})">
            ${ch.name}
        </button>
    `).join('');
}

// 3. Select Channel
function selectChannel(id) {
    currentChannelId = id;
    currentServerIndex = 0;
    const channel = KIDS_CHANNELS.find(c => c.id === id);
    renderChannels();
    renderServers(channel);
    loadStream(channel.servers[0].url);
}

// 4. Render Servers
function renderServers(channel) {
    const container = document.getElementById('server-switcher');
    if (!container || !channel || !channel.servers || channel.servers.length === 0) {
        if (container) container.innerHTML = '';
        return;
    }

    console.log('Rendering servers:', channel.servers);

    container.innerHTML = channel.servers.map((srv, idx) => `
        <button class="server-btn ${idx === currentServerIndex ? 'active' : ''}" 
                onclick="switchServer(${idx})">
            ${srv.name || `سيرفر ${idx + 1}`}
        </button>
    `).join('');
}

// 5. Switch Server
function switchServer(index) {
    currentServerIndex = index;
    const channel = KIDS_CHANNELS.find(c => c.id === currentChannelId);
    renderServers(channel);
    loadStream(channel.servers[index].url);
}

// 6. Load Stream (Universal: YouTube + HLS)
function loadStream(url) {
    const videoElement = document.getElementById('player');
    if (!videoElement) return;

    // Cleanup previous instances
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }
    if (currentPlayer) {
        currentPlayer.destroy();
        currentPlayer = null;
    }

    // YouTube Detection
    const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);

    if (match) {
        // YouTube Provider
        const videoId = match[1];
        const container = document.getElementById('player-container');
        container.innerHTML = '<div id="player" data-plyr-provider="youtube" data-plyr-embed-id="' + videoId + '"></div>';

        setTimeout(() => {
            currentPlayer = new Plyr('#player', {
                autoplay: true, // Enable Playr Autoplay
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
                youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1, autoplay: 1 } // YouTube specific autoplay
            });

            // Ensure play triggers
            currentPlayer.on('ready', () => {
                currentPlayer.play();
            });

            injectBranding();
        }, 100);
    } else {
        // HLS Provider
        const container = document.getElementById('player-container');
        const liveIndicator = container.querySelector('.live-indicator-on-screen');
        // server-switcher is now outside container, no need to save/restore
        container.innerHTML = '<video id="player" playsinline controls autoplay></video>'; // Added autoplay attribute
        if (liveIndicator) container.insertBefore(liveIndicator, container.firstChild);

        const newVideoElement = document.getElementById('player');
        const isStream = url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('.ts');

        if (isStream && Hls.isSupported()) {
            hlsInstance = new Hls({
                enableWorker: location.protocol !== 'file:', // Disable worker on local file to prevent blob errors
                lowLatencyMode: true
            });
            hlsInstance.loadSource(url);
            hlsInstance.attachMedia(newVideoElement);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                currentPlayer = new Plyr(newVideoElement, {
                    autoplay: true,
                    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen']
                });

                // Explicit play attempt
                try {
                    const playPromise = newVideoElement.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.log("Autoplay prevented:", error);
                        });
                    }
                } catch (e) {
                    console.log("Autoplay error:", e);
                }

                injectBranding();
            });
        } else if (isStream && newVideoElement.canPlayType('application/vnd.apple.mpegurl')) {
            newVideoElement.src = url;
            currentPlayer = new Plyr(newVideoElement, {
                autoplay: true,
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen']
            });
            newVideoElement.play();
            injectBranding();
        } else {
            // Fallback for non-HLS (e.g. MP4) or if HLS not supported
            newVideoElement.src = url;
            currentPlayer = new Plyr(newVideoElement, {
                autoplay: true,
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen']
            });
            newVideoElement.play().catch(e => console.log("Autoplay error (generic):", e));
            injectBranding();
        }
    }
}

// 7. Inject Branding
function injectBranding() {
    let attempts = 0;
    const maxAttempts = 10;

    const tryInject = () => {
        const controls = document.querySelector('.plyr__controls');

        if (controls && !document.querySelector('.plyr-branding')) {
            const brandDiv = document.createElement('div');
            brandDiv.className = 'plyr-branding';
            brandDiv.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-16a2 2 0 0 1-2-2v-2"></path>
                    <path d="M2 12h10"></path>
                    <path d="m9 15 3-3-3-3"></path>
                </svg>
                <span>90s شو</span>
            `;

            const volumeControl = controls.querySelector('.plyr__volume');
            if (volumeControl) {
                // Insert BEFORE volume control
                volumeControl.parentNode.insertBefore(brandDiv, volumeControl);
            } else {
                controls.appendChild(brandDiv);
            }
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(tryInject, 300);
        }
    };

    setTimeout(tryInject, 500);
}

// 8. Smart TV Support
function setupSmartTV() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('webos')) document.body.classList.add('tv-optimized');
}

// PWA
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => { console.warn('SW failed:', err); });
    });
}
