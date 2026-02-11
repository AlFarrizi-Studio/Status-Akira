/**
 * NodeLink Status Page - Application JavaScript
 * Real-time monitoring for Akira Lavalink
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
    WS_URL: 'ws://212.132.120.102:12115/v4/websocket',
    HTTP_URL: 'https://circulation-grocery-essay-gotten.trycloudflare.com',
    AUTH: 'AkiraMusic',
    USER_ID: 'status-page',
    CLIENT_NAME: 'nodelink-status',
    STATS_INTERVAL: 30000,
    PING_INTERVAL: 5000,
    RECONNECT_BASE_DELAY: 1000,
    RECONNECT_MAX_DELAY: 30000,
    MAX_LOGS: 100
};

// ============================================
// Music Sources with Icons
// ============================================
const MUSIC_SOURCES = [
    { name: 'YouTube', icon: 'youtube.png' },
    { name: 'YouTube Music', icon: 'youtube-music.png' },
    { name: 'SoundCloud', icon: 'soundcloud.png' },
    { name: 'Unified', icon: 'unified.png' },
    { name: 'Spotify', icon: 'spotify.png' },
    { name: 'Apple Music', icon: 'apple-music.png' },
    { name: 'Deezer', icon: 'deezer.png' },
    { name: 'Tidal', icon: 'tidal.png' },
    { name: 'Bandcamp', icon: 'bandcamp.png' },
    { name: 'Audiomack', icon: 'audiomack.png' },
    { name: 'Gaana', icon: 'gaana.png' },
    { name: 'JioSaavn', icon: 'jiosaavn.png' },
    { name: 'Last.fm', icon: 'lastfm.png' },
    { name: 'Pandora', icon: 'pandora.png' },
    { name: 'VK Music', icon: 'vk-music.png' },
    { name: 'Mixcloud', icon: 'mixcloud.png' },
    { name: 'NicoVideo', icon: 'nicovideo.png' },
    { name: 'Bilibili', icon: 'bilibili.png' },
    { name: 'Shazam', icon: 'shazam.png' },
    { name: 'Eternal Box', icon: 'eternalbox.png' },
    { name: 'Songlink', icon: 'songlink.png' },
    { name: 'Qobuz', icon: 'qobuz.png' },
    { name: 'Yandex Music', icon: 'yandex-music.png' },
    { name: 'Audius', icon: 'audius.png' },
    { name: 'Amazon Music', icon: 'amazon-music.png' },
    { name: 'Anghami', icon: 'anghami.png' },
    { name: 'Bluesky', icon: 'bluesky.png' },
    { name: 'Letras.mus.br', icon: 'letras.png' },
    { name: 'Piper TTS', icon: 'piper-tts.png' },
    { name: 'Google TTS', icon: 'google-tts.png' },
    { name: 'Flowery TTS', icon: 'flowery-tts.png' }
];

// ============================================
// State Management
// ============================================
const state = {
    ws: null,
    isConnected: false,
    pingStart: 0,
    reconnectAttempts: 0,
    uptimeInterval: null,
    pingInterval: null,
    currentUptime: 0,
    sessionId: null
};

// ============================================
// DOM Elements Cache
// ============================================
const elements = {};

function cacheElements() {
    elements.statusCard = document.getElementById('statusCard');
    elements.statusDot = document.getElementById('statusDot');
    elements.ring1 = document.getElementById('ring1');
    elements.ring2 = document.getElementById('ring2');
    elements.ring3 = document.getElementById('ring3');
    elements.statusTitle = document.getElementById('statusTitle');
    elements.statusSubtitle = document.getElementById('statusSubtitle');
    elements.pingValue = document.getElementById('pingValue');
    elements.playersCount = document.getElementById('playersCount');
    elements.totalPlayers = document.getElementById('totalPlayers');
    elements.playingPlayers = document.getElementById('playingPlayers');
    elements.cpuCores = document.getElementById('cpuCores');
    elements.cpuSystemValue = document.getElementById('cpuSystemValue');
    elements.cpuProcessValue = document.getElementById('cpuProcessValue');
    elements.cpuSystemBar = document.getElementById('cpuSystemBar');
    elements.cpuProcessBar = document.getElementById('cpuProcessBar');
    elements.memoryTotal = document.getElementById('memoryTotal');
    elements.memoryUsedValue = document.getElementById('memoryUsedValue');
    elements.memoryAllocatedValue = document.getElementById('memoryAllocatedValue');
    elements.memoryUsedBar = document.getElementById('memoryUsedBar');
    elements.memoryAllocatedBar = document.getElementById('memoryAllocatedBar');
    elements.uptimeDays = document.getElementById('uptimeDays');
    elements.uptimeHours = document.getElementById('uptimeHours');
    elements.uptimeMinutes = document.getElementById('uptimeMinutes');
    elements.uptimeSeconds = document.getElementById('uptimeSeconds');
    elements.framesSent = document.getElementById('framesSent');
    elements.framesNulled = document.getElementById('framesNulled');
    elements.framesDeficit = document.getElementById('framesDeficit');
    elements.framesExpected = document.getElementById('framesExpected');
    elements.batteryLevel = document.getElementById('batteryLevel');
    elements.healthPercent = document.getElementById('healthPercent');
    elements.sourcesGrid = document.getElementById('sourcesGrid');
    elements.sourceCount = document.getElementById('sourceCount');
    elements.logContainer = document.getElementById('logContainer');
    elements.clearLogBtn = document.getElementById('clearLogBtn');
}

// ============================================
// Utility Functions
// ============================================
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}

function getTimeString() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
}

// ============================================
// Logging System
// ============================================
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-time">${getTimeString()}</span>
        <span class="log-message ${type}">${message}</span>
    `;
    
    elements.logContainer.insertBefore(entry, elements.logContainer.firstChild);
    
    // Limit logs
    while (elements.logContainer.children.length > CONFIG.MAX_LOGS) {
        elements.logContainer.removeChild(elements.logContainer.lastChild);
    }
}

function clearLogs() {
    elements.logContainer.innerHTML = '';
    addLog('Logs cleared', 'info');
}

// ============================================
// UI Update Functions
// ============================================
function updateStatusUI(online) {
    const statusElements = [
        elements.statusCard,
        elements.statusDot,
        elements.ring1,
        elements.ring2,
        elements.ring3
    ];

    if (online) {
        statusElements.forEach(el => el.classList.remove('offline'));
        elements.statusTitle.textContent = 'Operational';
        elements.statusSubtitle.textContent = 'All systems running smoothly';
    } else {
        statusElements.forEach(el => el.classList.add('offline'));
        elements.statusTitle.textContent = 'Offline';
        elements.statusSubtitle.textContent = 'Connection lost - Attempting to reconnect...';
        resetStats();
    }
}

function resetStats() {
    elements.pingValue.textContent = '--';
    elements.playersCount.textContent = '-';
    elements.totalPlayers.textContent = '-';
    elements.playingPlayers.textContent = '-';
    elements.cpuCores.textContent = '- cores';
    elements.cpuSystemValue.textContent = '--%';
    elements.cpuProcessValue.textContent = '--%';
    elements.cpuSystemBar.style.width = '0%';
    elements.cpuProcessBar.style.width = '0%';
    elements.memoryTotal.textContent = '-';
    elements.memoryUsedValue.textContent = '-';
    elements.memoryAllocatedValue.textContent = '-';
    elements.memoryUsedBar.style.width = '0%';
    elements.memoryAllocatedBar.style.width = '0%';
    elements.uptimeDays.textContent = '-';
    elements.uptimeHours.textContent = '-';
    elements.uptimeMinutes.textContent = '-';
    elements.uptimeSeconds.textContent = '-';
    elements.framesSent.textContent = '-';
    elements.framesNulled.textContent = '-';
    elements.framesDeficit.textContent = '-';
    elements.framesExpected.textContent = '-';
    elements.batteryLevel.style.height = '0%';
    elements.healthPercent.textContent = '--%';
}

function updateStats(data) {
    // Players
    const totalPlayers = data.players || 0;
    const playing = data.playingPlayers || 0;
    elements.totalPlayers.textContent = totalPlayers;
    elements.playingPlayers.textContent = playing;
    elements.playersCount.textContent = totalPlayers;

    // Uptime
    if (data.uptime) {
        state.currentUptime = data.uptime;
        updateUptimeDisplay();
    }

    // Memory
    if (data.memory) {
        const { free, used, allocated, reservable } = data.memory;
        const maxMem = reservable || allocated || 1;
        
        const usedPercent = Math.min((used / maxMem) * 100, 100);
        const allocatedPercent = Math.min((allocated / maxMem) * 100, 100);

        elements.memoryTotal.textContent = formatBytes(maxMem);
        elements.memoryUsedValue.textContent = `${formatBytes(used)} (${usedPercent.toFixed(1)}%)`;
        elements.memoryAllocatedValue.textContent = `${formatBytes(allocated)} (${allocatedPercent.toFixed(1)}%)`;
        elements.memoryUsedBar.style.width = `${usedPercent}%`;
        elements.memoryAllocatedBar.style.width = `${allocatedPercent}%`;
    }

    // CPU
    if (data.cpu) {
        const cores = data.cpu.cores || 0;
        const systemLoad = (data.cpu.systemLoad || 0) * 100;
        const processLoad = (data.cpu.lavalinkLoad || data.cpu.processLoad || 0) * 100;

        elements.cpuCores.textContent = `${cores} cores`;
        elements.cpuSystemValue.textContent = `${systemLoad.toFixed(1)}%`;
        elements.cpuProcessValue.textContent = `${processLoad.toFixed(1)}%`;
        elements.cpuSystemBar.style.width = `${Math.min(systemLoad, 100)}%`;
        elements.cpuProcessBar.style.width = `${Math.min(processLoad, 100)}%`;

        // Health Score (inverse of load)
        const healthScore = Math.max(0, 100 - ((systemLoad + processLoad) / 2));
        elements.batteryLevel.style.height = `${healthScore}%`;
        elements.healthPercent.textContent = `${healthScore.toFixed(0)}%`;

        // Update battery color based on health
        updateBatteryColor(healthScore);
    }

    // Frame Stats
    if (data.frameStats) {
        elements.framesSent.textContent = formatNumber(data.frameStats.sent || 0);
        elements.framesNulled.textContent = formatNumber(data.frameStats.nulled || 0);
        elements.framesDeficit.textContent = formatNumber(data.frameStats.deficit || 0);
        const expected = (data.frameStats.sent || 0) + (data.frameStats.nulled || 0);
        elements.framesExpected.textContent = formatNumber(expected);
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function updateBatteryColor(health) {
    const batteryLevel = elements.batteryLevel;
    if (health >= 70) {
        batteryLevel.style.background = 'linear-gradient(90deg, #10b981, #6366f1)';
    } else if (health >= 40) {
        batteryLevel.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    } else {
        batteryLevel.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
    }
}

function updateUptimeDisplay() {
    if (state.currentUptime > 0) {
        const time = formatUptime(state.currentUptime);
        elements.uptimeDays.textContent = padZero(time.days);
        elements.uptimeHours.textContent = padZero(time.hours);
        elements.uptimeMinutes.textContent = padZero(time.minutes);
        elements.uptimeSeconds.textContent = padZero(time.seconds);
    }
}

function tickUptime() {
    if (state.currentUptime > 0 && state.isConnected) {
        state.currentUptime += 1000;
        updateUptimeDisplay();
    }
}

// ============================================
// Music Sources Rendering
// ============================================
function renderMusicSources() {
    elements.sourcesGrid.innerHTML = '';
    
    MUSIC_SOURCES.forEach(source => {
        const tag = document.createElement('div');
        tag.className = 'source-tag';
        tag.innerHTML = `
            <img src="icons/${source.icon}" alt="${source.name}" class="source-icon" 
                 onerror="this.style.display='none'">
            <span class="source-name">${source.name}</span>
        `;
        elements.sourcesGrid.appendChild(tag);
    });
    
    elements.sourceCount.textContent = `${MUSIC_SOURCES.length} Sources`;
}

// ============================================
// WebSocket Connection
// ============================================
function connect() {
    addLog('Attempting WebSocket connection...', 'info');
    updateStatusUI(false);
    elements.statusTitle.textContent = 'Connecting...';
    elements.statusSubtitle.textContent = 'Establishing WebSocket connection';

    try {
        state.ws = new WebSocket(CONFIG.WS_URL);

        state.ws.onopen = handleOpen;
        state.ws.onmessage = handleMessage;
        state.ws.onerror = handleError;
        state.ws.onclose = handleClose;

    } catch (error) {
        addLog(`Connection error: ${error.message}`, 'error');
        scheduleReconnect();
    }
}

function handleOpen() {
    state.isConnected = true;
    state.reconnectAttempts = 0;
    updateStatusUI(true);
    addLog('WebSocket connected successfully!', 'success');
    
    // Start ping measurement
    state.pingStart = performance.now();
    
    // Start intervals
    startIntervals();
}

function handleMessage(event) {
    try {
        const data = JSON.parse(event.data);
        
        // Calculate ping
        if (state.pingStart > 0) {
            const ping = Math.round(performance.now() - state.pingStart);
            elements.pingValue.textContent = `${ping}ms`;
            state.pingStart = 0;
        }

        // Handle message types
        switch (data.op) {
            case 'ready':
                state.sessionId = data.sessionId;
                addLog(`Session ready: ${data.sessionId}`, 'success');
                break;
            
            case 'stats':
                updateStats(data);
                addLog('Stats updated', 'success');
                break;
            
            case 'playerUpdate':
                addLog(`Player update: ${data.guildId}`, 'info');
                break;
            
            case 'event':
                addLog(`Event received: ${data.type}`, 'info');
                break;
            
            default:
                console.log('Unknown message:', data);
        }
    } catch (e) {
        console.error('Failed to parse message:', e);
    }
}

function handleError(error) {
    addLog('WebSocket error occurred', 'error');
    console.error('WebSocket error:', error);
}

function handleClose(event) {
    state.isConnected = false;
    updateStatusUI(false);
    addLog(`Connection closed (Code: ${event.code})`, 'error');
    
    stopIntervals();
    scheduleReconnect();
}

function scheduleReconnect() {
    state.reconnectAttempts++;
    const delay = Math.min(
        CONFIG.RECONNECT_BASE_DELAY * Math.pow(2, state.reconnectAttempts),
        CONFIG.RECONNECT_MAX_DELAY
    );
    
    addLog(`Reconnecting in ${delay / 1000}s...`, 'warning');
    setTimeout(connect, delay);
}

function measurePing() {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.pingStart = performance.now();
        try {
            // NodeLink doesn't have a ping op, but sending any message works
            state.ws.send(JSON.stringify({ op: 'ping' }));
        } catch (e) {
            // Ignore send errors
        }
    }
}

// ============================================
// HTTP Fallback
// ============================================
async function fetchStatsHTTP() {
    try {
        const response = await fetch(`${CONFIG.HTTP_URL}/v4/stats`, {
            headers: {
                'Authorization': CONFIG.AUTH
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateStats(data);
            updateStatusUI(true);
            addLog('Stats fetched via HTTP', 'success');
            return true;
        }
    } catch (e) {
        console.log('HTTP fallback failed:', e);
    }
    return false;
}

// ============================================
// Intervals Management
// ============================================
function startIntervals() {
    // Uptime counter
    if (state.uptimeInterval) clearInterval(state.uptimeInterval);
    state.uptimeInterval = setInterval(tickUptime, 1000);
    
    // Ping measurement
    if (state.pingInterval) clearInterval(state.pingInterval);
    state.pingInterval = setInterval(measurePing, CONFIG.PING_INTERVAL);
}

function stopIntervals() {
    if (state.uptimeInterval) {
        clearInterval(state.uptimeInterval);
        state.uptimeInterval = null;
    }
    if (state.pingInterval) {
        clearInterval(state.pingInterval);
        state.pingInterval = null;
    }
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Clear log button
    elements.clearLogBtn.addEventListener('click', clearLogs);
    
    // Visibility change - reconnect when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !state.isConnected) {
            addLog('Page visible - attempting reconnection', 'info');
            connect();
        }
    });
    
    // Online/Offline events
    window.addEventListener('online', () => {
        addLog('Network online - reconnecting...', 'info');
        connect();
    });
    
    window.addEventListener('offline', () => {
        addLog('Network offline', 'error');
        updateStatusUI(false);
    });
}

// ============================================
// Initialization
// ============================================
function init() {
    // Cache DOM elements
    cacheElements();
    
    // Render music sources
    renderMusicSources();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial log
    addLog('NodeLink Status Page initialized', 'info');
    addLog(`Target: ${CONFIG.WS_URL}`, 'info');
    
    // Start WebSocket connection
    connect();
    
    // HTTP fallback interval
    setInterval(() => {
        if (!state.isConnected) {
            fetchStatsHTTP();
        }
    }, CONFIG.STATS_INTERVAL);
    
    // Initial HTTP fetch attempt
    setTimeout(fetchStatsHTTP, 2000);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
