/* ============================================
   AL FARRIZI MUSIC BOT - DASHBOARD APPLICATION
   Version: 4.23.7
   Fully Fixed & Tested
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_ENDPOINT: 'https://unclaiming-fully-camron.ngrok-free.dev/all',
    REFRESH_INTERVAL: 5000,
    CHART_HISTORY_LENGTH: 20,
    TOAST_DURATION: 4000,
};

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    apiData: null,
    isOnline: false,
    lastUpdated: null,
    charts: {},
    chartData: {
        cpu: [],
        memory: [],
        players: [],
        frames: [],
        responseTime: []
    },
    refreshInterval: null,
    chartsInitialized: false,
    sourcesLoaded: false,
    filtersLoaded: false,
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {};

function initElements() {
    // Sidebar
    elements.sidebar = document.getElementById('sidebar');
    elements.sidebarToggle = document.getElementById('sidebarToggle');
    elements.sidebarOverlay = document.getElementById('sidebarOverlay');
    elements.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    elements.navItems = document.querySelectorAll('.nav-item');
    
    // Theme
    elements.themeToggle = document.getElementById('themeToggle');
    elements.themeToggleMobile = document.getElementById('themeToggleMobile');
    
    // Pages
    elements.pages = document.querySelectorAll('.page');
    
    // Dashboard
    elements.apiStatusIndicator = document.getElementById('apiStatusIndicator');
    elements.lastUpdated = document.getElementById('lastUpdated');
    elements.apiStatus = document.getElementById('apiStatus');
    elements.responseTime = document.getElementById('responseTime');
    elements.serverVersion = document.getElementById('serverVersion');
    elements.healthGrade = document.getElementById('healthGrade');
    elements.healthScore = document.getElementById('healthScore');
    elements.uptime = document.getElementById('uptime');
    
    // Now Playing
    elements.nowPlayingContainer = document.getElementById('nowPlayingContainer');
    elements.playingCount = document.getElementById('playingCount');
    
    // Quick Stats
    elements.totalPlayers = document.getElementById('totalPlayers');
    elements.activePlaying = document.getElementById('activePlaying');
    elements.idlePlayers = document.getElementById('idlePlayers');
    elements.frameIntegrity = document.getElementById('frameIntegrity');
    elements.playersBar = document.getElementById('playersBar');
    elements.activeBar = document.getElementById('activeBar');
    elements.idleBar = document.getElementById('idleBar');
    elements.frameBar = document.getElementById('frameBar');
    
    // Stats Page
    elements.cpuSystemLoad = document.getElementById('cpuSystemLoad');
    elements.cpuLavalinkLoad = document.getElementById('cpuLavalinkLoad');
    elements.cpuCores = document.getElementById('cpuCores');
    elements.memUsed = document.getElementById('memUsed');
    elements.memAllocated = document.getElementById('memAllocated');
    elements.memFree = document.getElementById('memFree');
    elements.memUsage = document.getElementById('memUsage');
    elements.statTotalPlayers = document.getElementById('statTotalPlayers');
    elements.statPlayingPlayers = document.getElementById('statPlayingPlayers');
    elements.statIdlePlayers = document.getElementById('statIdlePlayers');
    elements.statFrameIntegrity = document.getElementById('statFrameIntegrity');
    elements.statFrameStatus = document.getElementById('statFrameStatus');
    elements.statFrameSent = document.getElementById('statFrameSent');
    elements.statFrameExpected = document.getElementById('statFrameExpected');
    
    // Sources & Filters
    elements.sourcesGrid = document.getElementById('sourcesGrid');
    elements.filtersGrid = document.getElementById('filtersGrid');
    
    // Commands
    elements.commandSearch = document.getElementById('commandSearch');
    elements.commandsContainer = document.getElementById('commandsContainer');
    
    // Feedback
    elements.feedbackForm = document.getElementById('feedbackForm');
    
    // Toast
    elements.toastContainer = document.getElementById('toastContainer');
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 Al Farrizi Music Bot Dashboard v4.23.7');
    console.log('📡 API Endpoint:', CONFIG.API_ENDPOINT);
    
    // Initialize DOM elements
    initElements();
    
    // Initialize components
    initTheme();
    initSidebar();
    initNavigation();
    initCommands();
    initFAQ();
    initFeedbackForm();
    
    // Initialize charts when Chart.js is ready
    waitForChartJS().then(() => {
        initCharts();
        state.chartsInitialized = true;
        console.log('📊 Charts initialized');
    }).catch(err => {
        console.warn('⚠️ Charts unavailable:', err.message);
    });
    
    // Fetch initial data
    fetchData();
    
    // Start auto-refresh
    startAutoRefresh();
    
    console.log('✅ Dashboard ready');
});

// Wait for Chart.js
function waitForChartJS(timeout = 5000) {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (typeof Chart !== 'undefined') {
                clearInterval(interval);
                resolve();
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                reject(new Error('Chart.js timeout'));
            }
        }, 100);
    });
}

// ============================================
// THEME MANAGEMENT
// ============================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    elements.themeToggle?.addEventListener('click', toggleTheme);
    elements.themeToggleMobile?.addEventListener('click', toggleTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const icon = theme === 'dark' ? 'fa-moon' : 'fa-sun';
    [elements.themeToggle, elements.themeToggleMobile].forEach(toggle => {
        if (toggle) toggle.innerHTML = `<i class="fas ${icon}"></i>`;
    });
    
    if (state.chartsInitialized) updateChartsTheme();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
}

function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        primary: '#6366f1',
        primaryLight: 'rgba(99, 102, 241, 0.2)',
        success: '#10b981',
        successLight: 'rgba(16, 185, 129, 0.2)',
        warning: '#f59e0b',
        warningLight: 'rgba(245, 158, 11, 0.2)',
        info: '#3b82f6',
        infoLight: 'rgba(59, 130, 246, 0.2)',
        danger: '#ef4444',
        dangerLight: 'rgba(239, 68, 68, 0.2)',
        text: isDark ? '#a0a0b0' : '#4a4a5a',
        grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    };
}

// ============================================
// SIDEBAR MANAGEMENT
// ============================================
function initSidebar() {
    elements.sidebarToggle?.addEventListener('click', () => {
        elements.sidebar?.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', elements.sidebar?.classList.contains('collapsed'));
    });
    
    elements.mobileMenuBtn?.addEventListener('click', () => {
        elements.sidebar?.classList.add('mobile-open');
        elements.sidebarOverlay?.classList.add('active');
    });
    
    elements.sidebarOverlay?.addEventListener('click', closeMobileSidebar);
    
    if (localStorage.getItem('sidebarCollapsed') === 'true' && window.innerWidth > 992) {
        elements.sidebar?.classList.add('collapsed');
    }
}

function closeMobileSidebar() {
    elements.sidebar?.classList.remove('mobile-open');
    elements.sidebarOverlay?.classList.remove('active');
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(item.dataset.page);
            closeMobileSidebar();
        });
    });
    
    window.addEventListener('hashchange', () => {
        navigateToPage(window.location.hash.slice(1) || 'dashboard', false);
    });
    
    navigateToPage(window.location.hash.slice(1) || 'dashboard', false);
}

function navigateToPage(pageName, updateHash = true) {
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });
    
    elements.pages.forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageName}`);
    });
    
    if (updateHash) window.location.hash = pageName;
    window.scrollTo(0, 0);
}

// ============================================
// API DATA FETCHING
// ============================================
async function fetchData() {
    const startTime = performance.now();
    
    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true',
                'Accept': 'application/json',
            },
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const json = await response.json();
        const clientResponseTime = Math.round(performance.now() - startTime);
        
        // Handle API structure: { success, data: { ... } }
        const apiData = json.data || json;
        const serverResponseTime = apiData.response_time_ms || clientResponseTime;
        
        state.apiData = apiData;
        state.isOnline = json.success !== false;
        state.lastUpdated = new Date();
        
        console.log('📡 Data fetched:', {
            success: json.success,
            responseTime: serverResponseTime,
            hasData: !!apiData
        });
        
        // Update all sections
        updateDashboard(apiData, serverResponseTime);
        updateStats(apiData);
        updateNowPlaying(apiData);
        updateSources(apiData);
        updateFilters(apiData);
        
        if (state.chartsInitialized) {
            updateCharts(apiData, serverResponseTime);
        }
        
    } catch (error) {
        console.error('❌ Fetch error:', error.message);
        state.isOnline = false;
        updateOfflineState();
    }
}

function startAutoRefresh() {
    clearInterval(state.refreshInterval);
    state.refreshInterval = setInterval(fetchData, CONFIG.REFRESH_INTERVAL);
}

// ============================================
// UTILITY: Parse values
// ============================================
function parsePercentage(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    }
    return 0;
}

function parseMs(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        return parseInt(value.replace(/[^0-9]/g, '')) || 0;
    }
    return 0;
}

// ============================================
// DASHBOARD UPDATES
// ============================================
function updateDashboard(data, responseTime) {
    // API Status
    if (elements.apiStatusIndicator) {
        elements.apiStatusIndicator.classList.toggle('offline', !state.isOnline);
        const statusText = elements.apiStatusIndicator.querySelector('.status-text');
        if (statusText) statusText.textContent = state.isOnline ? 'API Online' : 'API Offline';
    }
    
    // Last Updated
    if (elements.lastUpdated) {
        elements.lastUpdated.textContent = 'Just now';
    }
    
    // Status Cards
    safeSetText(elements.apiStatus, state.isOnline ? 'Online' : 'Offline');
    safeSetText(elements.responseTime, `${responseTime}ms`);
    safeSetText(elements.serverVersion, data.server?.version?.semver || 'N/A');
    
    // Health
    const health = data.performance?.health || {};
    safeSetText(elements.healthGrade, health.grade || 'N/A');
    safeSetText(elements.healthScore, health.score !== undefined ? `${health.score}%` : 'N/A');
    
    // Uptime
    safeSetText(elements.uptime, data.performance?.uptime?.formatted || 'N/A');
    
    // Quick Stats - Players
    const audioStats = data.audio_stats || {};
    const players = audioStats.players || {};
    const totalPlayers = players.total || 0;
    const playingPlayers = players.playing || 0;
    const idlePlayers = players.idle ?? (totalPlayers - playingPlayers);
    
    safeSetText(elements.totalPlayers, totalPlayers.toString());
    safeSetText(elements.activePlaying, playingPlayers.toString());
    safeSetText(elements.idlePlayers, idlePlayers.toString());
    
    // Progress bars
    const maxPlayers = Math.max(totalPlayers, 10);
    safeSetWidth(elements.playersBar, (totalPlayers / maxPlayers) * 100);
    safeSetWidth(elements.activeBar, totalPlayers > 0 ? (playingPlayers / totalPlayers) * 100 : 0);
    safeSetWidth(elements.idleBar, totalPlayers > 0 ? (idlePlayers / totalPlayers) * 100 : 0);
    
    // Frame Integrity
    const frameAnalysis = audioStats.frame_analysis || {};
    const integrity = parsePercentage(frameAnalysis.integrity);
    safeSetText(elements.frameIntegrity, `${integrity.toFixed(0)}%`);
    safeSetWidth(elements.frameBar, integrity);
}

function updateOfflineState() {
    if (elements.apiStatusIndicator) {
        elements.apiStatusIndicator.classList.add('offline');
        const statusText = elements.apiStatusIndicator.querySelector('.status-text');
        if (statusText) statusText.textContent = 'API Offline';
    }
    safeSetText(elements.apiStatus, 'Offline');
    safeSetText(elements.responseTime, '--ms');
}

// ============================================
// STATS PAGE UPDATES
// ============================================
function updateStats(data) {
    const cpu = data.performance?.cpu || {};
    const memory = data.performance?.memory || {};
    const audioStats = data.audio_stats || {};
    const players = audioStats.players || {};
    const frameAnalysis = audioStats.frame_analysis || {};
    
    // CPU
    safeSetText(elements.cpuSystemLoad, cpu.system_load || 'N/A');
    safeSetText(elements.cpuLavalinkLoad, cpu.lavalink_load || 'N/A');
    safeSetText(elements.cpuCores, cpu.cores?.toString() || 'N/A');
    
    // Memory
    safeSetText(elements.memUsed, memory.used?.formatted || 'N/A');
    safeSetText(elements.memAllocated, memory.allocated?.formatted || 'N/A');
    safeSetText(elements.memFree, memory.free?.formatted || 'N/A');
    safeSetText(elements.memUsage, memory.usage_percent || 'N/A');
    
    // Players
    safeSetText(elements.statTotalPlayers, players.total?.toString() || '0');
    safeSetText(elements.statPlayingPlayers, players.playing?.toString() || '0');
    safeSetText(elements.statIdlePlayers, (players.idle ?? 0).toString());
    
    // Frames
    safeSetText(elements.statFrameIntegrity, frameAnalysis.integrity || 'N/A');
    safeSetText(elements.statFrameStatus, frameAnalysis.status || 'N/A');
    safeSetText(elements.statFrameSent, frameAnalysis.raw?.sent?.toString() || 'N/A');
    safeSetText(elements.statFrameExpected, frameAnalysis.raw?.expected?.toString() || 'N/A');
}

// ============================================
// NOW PLAYING
// ============================================
function updateNowPlaying(data) {
    const nowPlaying = data.now_playing || [];
    
    safeSetText(elements.playingCount, `${nowPlaying.length} track${nowPlaying.length !== 1 ? 's' : ''}`);
    
    if (!elements.nowPlayingContainer) return;
    
    if (nowPlaying.length === 0) {
        elements.nowPlayingContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-music"></i>
                <p>No tracks currently playing</p>
            </div>
        `;
        return;
    }
    
    elements.nowPlayingContainer.innerHTML = nowPlaying.map(createNowPlayingCard).join('');
}

function createNowPlayingCard(track) {
    const metadata = track.metadata || {};
    const playback = track.playback_state || {};
    
    const title = metadata.title || 'Unknown Title';
    const author = metadata.author || 'Unknown Artist';
    const artwork = metadata.artwork_url || 'https://via.placeholder.com/80/1a1a25/6366f1?text=♪';
    const source = metadata.source || 'unknown';
    
    const position = playback.position?.raw || 0;
    const duration = playback.duration?.raw || 1;
    const progress = Math.min((position / duration) * 100, 100);
    
    const currentTime = playback.position?.stamp || '00:00:00';
    const totalTime = playback.duration?.stamp || '00:00:00';
    const ping = playback.ping || 'N/A';
    const connected = playback.connected !== false;
    const guildId = track.guild_id || '';
    
    return `
        <div class="now-playing-card">
            <div class="np-header">
                <div class="np-artwork">
                    <img src="${escapeHtml(artwork)}" alt="Artwork" 
                         onerror="this.src='https://via.placeholder.com/80/1a1a25/6366f1?text=♪'">
                    <div class="np-playing-indicator">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="np-info">
                    <h4 class="np-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h4>
                    <p class="np-artist" title="${escapeHtml(author)}">${escapeHtml(author)}</p>
                    <span class="np-source">
                        <i class="${getSourceIcon(source)}"></i>
                        ${capitalize(source)}
                    </span>
                </div>
            </div>
            <div class="np-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-time">
                    <span>${formatTimestamp(currentTime)}</span>
                    <span>${formatTimestamp(totalTime)}</span>
                </div>
            </div>
            <div class="np-footer">
                <div class="np-stats">
                    <span class="np-stat">
                        <i class="fas fa-signal"></i>
                        ${ping}
                    </span>
                    <span class="np-stat">
                        <i class="fas fa-server"></i>
                        ${guildId ? `...${guildId.slice(-6)}` : 'N/A'}
                    </span>
                </div>
                <span class="np-status ${connected ? 'connected' : 'disconnected'}">
                    <i class="fas fa-${connected ? 'check-circle' : 'times-circle'}"></i>
                    ${connected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
        </div>
    `;
}

// ============================================
// SOURCES PAGE
// ============================================
function updateSources(data) {
    if (!elements.sourcesGrid) return;
    
    // Get sources from correct path
    const sources = data.server?.capabilities?.sources || [];
    
    console.log('📦 Sources found:', sources.length);
    
    if (sources.length === 0) {
        elements.sourcesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-plug"></i>
                <p>No sources available</p>
            </div>
        `;
        return;
    }
    
    // Sort alphabetically
    const sortedSources = [...sources].sort((a, b) => a.localeCompare(b));
    
    elements.sourcesGrid.innerHTML = sortedSources.map(source => {
        const info = getSourceInfo(source);
        return `
            <div class="source-card">
                <div class="source-icon ${info.class}">
                    <i class="${info.icon}"></i>
                </div>
                <div class="source-info">
                    <h4 class="source-name">${escapeHtml(info.name)}</h4>
                    <p class="source-status">Available</p>
                </div>
                <div class="source-toggle active"></div>
            </div>
        `;
    }).join('');
    
    state.sourcesLoaded = true;
}

function getSourceInfo(source) {
    const sourceMap = {
        // Major platforms
        youtube: { name: 'YouTube', icon: 'fab fa-youtube', class: 'youtube' },
        spotify: { name: 'Spotify', icon: 'fab fa-spotify', class: 'spotify' },
        soundcloud: { name: 'SoundCloud', icon: 'fab fa-soundcloud', class: 'soundcloud' },
        deezer: { name: 'Deezer', icon: 'fas fa-compact-disc', class: 'deezer' },
        applemusic: { name: 'Apple Music', icon: 'fab fa-apple', class: 'applemusic' },
        tidal: { name: 'Tidal', icon: 'fas fa-water', class: 'tidal' },
        amazonmusic: { name: 'Amazon Music', icon: 'fab fa-amazon', class: 'amazon' },
        pandora: { name: 'Pandora', icon: 'fas fa-podcast', class: 'default' },
        qobuz: { name: 'Qobuz', icon: 'fas fa-headphones', class: 'default' },
        
        // Video platforms
        twitch: { name: 'Twitch', icon: 'fab fa-twitch', class: 'twitch' },
        vimeo: { name: 'Vimeo', icon: 'fab fa-vimeo-v', class: 'vimeo' },
        bilibili: { name: 'Bilibili', icon: 'fas fa-tv', class: 'default' },
        nicovideo: { name: 'Niconico', icon: 'fas fa-play-circle', class: 'default' },
        
        // Social media
        instagram: { name: 'Instagram', icon: 'fab fa-instagram', class: 'instagram' },
        twitter: { name: 'Twitter/X', icon: 'fab fa-twitter', class: 'twitter' },
        reddit: { name: 'Reddit', icon: 'fab fa-reddit-alien', class: 'reddit' },
        tumblr: { name: 'Tumblr', icon: 'fab fa-tumblr', class: 'default' },
        pinterest: { name: 'Pinterest', icon: 'fab fa-pinterest', class: 'default' },
        telegram: { name: 'Telegram', icon: 'fab fa-telegram', class: 'telegram' },
        bluesky: { name: 'Bluesky', icon: 'fas fa-cloud', class: 'default' },
        kwai: { name: 'Kwai', icon: 'fas fa-video', class: 'default' },
        
        // Music platforms
        bandcamp: { name: 'Bandcamp', icon: 'fab fa-bandcamp', class: 'bandcamp' },
        mixcloud: { name: 'Mixcloud', icon: 'fab fa-mixcloud', class: 'mixcloud' },
        audiomack: { name: 'Audiomack', icon: 'fas fa-headphones-alt', class: 'default' },
        audius: { name: 'Audius', icon: 'fas fa-wave-square', class: 'default' },
        
        // Regional
        yandexmusic: { name: 'Yandex Music', icon: 'fab fa-yandex', class: 'default' },
        vkmusic: { name: 'VK Music', icon: 'fab fa-vk', class: 'default' },
        jiosaavn: { name: 'JioSaavn', icon: 'fas fa-music', class: 'default' },
        gaana: { name: 'Gaana', icon: 'fas fa-music', class: 'default' },
        
        // Utility
        genius: { name: 'Genius', icon: 'fas fa-microphone-alt', class: 'default' },
        lastfm: { name: 'Last.fm', icon: 'fab fa-lastfm', class: 'default' },
        shazam: { name: 'Shazam', icon: 'fas fa-bolt', class: 'default' },
        letrasmus: { name: 'Letras', icon: 'fas fa-align-left', class: 'default' },
        
        // TTS
        flowery: { name: 'Flowery TTS', icon: 'fas fa-comment-dots', class: 'default' },
        'google-tts': { name: 'Google TTS', icon: 'fab fa-google', class: 'default' },
        
        // Other
        http: { name: 'HTTP Streams', icon: 'fas fa-globe', class: 'http' },
        local: { name: 'Local Files', icon: 'fas fa-folder-open', class: 'default' },
        rss: { name: 'RSS Feeds', icon: 'fas fa-rss', class: 'default' },
        songlink: { name: 'Songlink', icon: 'fas fa-link', class: 'default' },
        eternalbox: { name: 'Eternal Box', icon: 'fas fa-infinity', class: 'default' },
    };
    
    const key = source.toLowerCase().replace(/[-_\s]/g, '');
    return sourceMap[key] || {
        name: capitalize(source.replace(/[-_]/g, ' ')),
        icon: 'fas fa-music',
        class: 'default'
    };
}

// ============================================
// FILTERS PAGE
// ============================================
function updateFilters(data) {
    if (!elements.filtersGrid) return;
    
    // Get filters from correct path
    const filters = data.server?.capabilities?.filters || [];
    
    console.log('🎛️ Filters found:', filters.length);
    
    if (filters.length === 0) {
        elements.filtersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sliders-h"></i>
                <p>No filters available</p>
            </div>
        `;
        return;
    }
    
    // Sort alphabetically
    const sortedFilters = [...filters].sort((a, b) => a.localeCompare(b));
    
    elements.filtersGrid.innerHTML = sortedFilters.map(filter => {
        const info = getFilterInfo(filter);
        return `
            <div class="filter-card" data-filter="${escapeHtml(filter)}">
                <div class="filter-header">
                    <span class="filter-name">${escapeHtml(info.name)}</span>
                    <div class="filter-toggle" data-filter="${escapeHtml(filter)}"></div>
                </div>
                <p class="filter-description">${escapeHtml(info.description)}</p>
                ${info.hasSlider ? `
                    <div class="filter-slider">
                        <div class="slider-label">
                            <span>Intensity</span>
                            <span class="slider-value">50%</span>
                        </div>
                        <input type="range" class="slider-input" min="0" max="100" value="50">
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // Initialize interactions
    initFilterInteractions();
    state.filtersLoaded = true;
}

function getFilterInfo(filter) {
    const filterMap = {
        tremolo: { name: 'Tremolo', description: 'Add trembling amplitude effect', hasSlider: true },
        vibrato: { name: 'Vibrato', description: 'Add vibrating pitch effect', hasSlider: true },
        lowpass: { name: 'Low Pass', description: 'Filter out high frequencies', hasSlider: true },
        highpass: { name: 'High Pass', description: 'Filter out low frequencies', hasSlider: true },
        rotation: { name: 'Rotation', description: 'Rotate audio in stereo field', hasSlider: true },
        karaoke: { name: 'Karaoke', description: 'Remove vocals from track', hasSlider: true },
        distortion: { name: 'Distortion', description: 'Add distortion effect', hasSlider: true },
        channelmix: { name: 'Channel Mix', description: 'Mix stereo channels', hasSlider: false },
        channelMix: { name: 'Channel Mix', description: 'Mix stereo channels', hasSlider: false },
        equalizer: { name: 'Equalizer', description: 'Adjust frequency bands', hasSlider: true },
        chorus: { name: 'Chorus', description: 'Add chorus effect', hasSlider: true },
        compressor: { name: 'Compressor', description: 'Dynamic range compression', hasSlider: true },
        echo: { name: 'Echo', description: 'Add echo/delay effect', hasSlider: true },
        phaser: { name: 'Phaser', description: 'Add phaser sweep effect', hasSlider: true },
        timescale: { name: 'Timescale', description: 'Adjust speed and pitch', hasSlider: true },
        bassboost: { name: 'Bass Boost', description: 'Enhance bass frequencies', hasSlider: true },
        nightcore: { name: 'Nightcore', description: 'Speed up with higher pitch', hasSlider: false },
        vaporwave: { name: 'Vaporwave', description: 'Slow down with lower pitch', hasSlider: false },
        '8d': { name: '8D Audio', description: 'Rotating spatial audio', hasSlider: false },
    };
    
    const key = filter.toLowerCase();
    return filterMap[key] || {
        name: capitalize(filter.replace(/[-_]/g, ' ')),
        description: 'Audio processing filter',
        hasSlider: false
    };
}

function initFilterInteractions() {
    // Toggle buttons
    document.querySelectorAll('.filter-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            this.classList.toggle('active');
            const name = this.dataset.filter;
            const active = this.classList.contains('active');
            
            showToast(
                active ? 'Filter Enabled' : 'Filter Disabled',
                `${capitalize(name)} has been ${active ? 'enabled' : 'disabled'}`,
                active ? 'success' : 'info'
            );
        });
    });
    
    // Sliders
    document.querySelectorAll('.slider-input').forEach(slider => {
        slider.addEventListener('input', function() {
            const label = this.closest('.filter-slider')?.querySelector('.slider-value');
            if (label) label.textContent = `${this.value}%`;
        });
    });
}

// ============================================
// CHARTS
// ============================================
function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded');
        return;
    }
    
    const colors = getChartColors();
    
    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                cornerRadius: 8,
                padding: 12,
            },
        },
        scales: {
            x: { display: false },
            y: {
                display: true,
                min: 0,
                grid: { color: colors.grid, drawBorder: false },
                ticks: { color: colors.text, font: { size: 11 } },
            },
        },
    };
    
    // CPU Chart
    const cpuCanvas = document.getElementById('cpuChart');
    if (cpuCanvas) {
        state.charts.cpu = new Chart(cpuCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(CONFIG.CHART_HISTORY_LENGTH).fill(''),
                datasets: [
                    {
                        label: 'System Load',
                        data: Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                    },
                    {
                        label: 'Lavalink Load',
                        data: Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                        borderColor: colors.info,
                        backgroundColor: colors.infoLight,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                    },
                ],
            },
            options: { ...lineOptions, scales: { ...lineOptions.scales, y: { ...lineOptions.scales.y, max: 100 } } },
        });
    }
    
    // Memory Chart (Doughnut)
    const memCanvas = document.getElementById('memoryChart');
    if (memCanvas) {
        state.charts.memory = new Chart(memCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Used', 'Free'],
                datasets: [{
                    data: [50, 50],
                    backgroundColor: [colors.primary, colors.grid],
                    borderWidth: 0,
                    cutout: '75%',
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: { legend: { display: false } },
            },
        });
    }
    
    // Players Chart (Bar)
    const playersCanvas = document.getElementById('playersChart');
    if (playersCanvas) {
        state.charts.players = new Chart(playersCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Total', 'Playing', 'Idle'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [colors.primary, colors.success, colors.warning],
                    borderRadius: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 300 },
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: colors.text } },
                    y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text } },
                },
            },
        });
    }
    
    // Frame Chart
    const frameCanvas = document.getElementById('frameChart');
    if (frameCanvas) {
        state.charts.frame = new Chart(frameCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(CONFIG.CHART_HISTORY_LENGTH).fill(''),
                datasets: [{
                    label: 'Frame Integrity',
                    data: Array(CONFIG.CHART_HISTORY_LENGTH).fill(100),
                    borderColor: colors.success,
                    backgroundColor: colors.successLight,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2,
                }],
            },
            options: { ...lineOptions, scales: { ...lineOptions.scales, y: { ...lineOptions.scales.y, max: 100 } } },
        });
    }
    
    // Response Time Chart
    const uptimeCanvas = document.getElementById('uptimeChart');
    if (uptimeCanvas) {
        state.charts.uptime = new Chart(uptimeCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: Array(CONFIG.CHART_HISTORY_LENGTH).fill(''),
                datasets: [{
                    label: 'Response Time (ms)',
                    data: Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryLight,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    borderWidth: 2,
                }],
            },
            options: {
                ...lineOptions,
                scales: {
                    x: { display: true, grid: { color: colors.grid }, ticks: { color: colors.text, maxTicksLimit: 8 } },
                    y: { ...lineOptions.scales.y, beginAtZero: true },
                },
            },
        });
    }
}

function updateCharts(data, responseTime) {
    if (!state.chartsInitialized) return;
    
    const cpu = data.performance?.cpu || {};
    const memory = data.performance?.memory || {};
    const audioStats = data.audio_stats || {};
    const players = audioStats.players || {};
    const frameAnalysis = audioStats.frame_analysis || {};
    
    // CPU Chart
    if (state.charts.cpu) {
        const sysLoad = Math.min(parsePercentage(cpu.system_load), 100);
        const lavaLoad = Math.min(parsePercentage(cpu.lavalink_load), 100);
        
        pushChartData(state.charts.cpu.data.datasets[0].data, sysLoad);
        pushChartData(state.charts.cpu.data.datasets[1].data, lavaLoad);
        state.charts.cpu.update('none');
    }
    
    // Memory Chart
    if (state.charts.memory) {
        const usage = parsePercentage(memory.usage_percent);
        state.charts.memory.data.datasets[0].data = [usage, 100 - usage];
        state.charts.memory.update('none');
    }
    
    // Players Chart
    if (state.charts.players) {
        const total = players.total || 0;
        const playing = players.playing || 0;
        const idle = players.idle ?? (total - playing);
        state.charts.players.data.datasets[0].data = [total, playing, idle];
        state.charts.players.update('none');
    }
    
    // Frame Chart
    if (state.charts.frame) {
        const integrity = parsePercentage(frameAnalysis.integrity);
        pushChartData(state.charts.frame.data.datasets[0].data, integrity);
        state.charts.frame.update('none');
    }
    
    // Response Time Chart
    if (state.charts.uptime) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        pushChartData(state.charts.uptime.data.labels, time);
        pushChartData(state.charts.uptime.data.datasets[0].data, responseTime);
        state.charts.uptime.update('none');
    }
}

function pushChartData(arr, value) {
    arr.push(value);
    if (arr.length > CONFIG.CHART_HISTORY_LENGTH) arr.shift();
}

function updateChartsTheme() {
    const colors = getChartColors();
    
    Object.values(state.charts).forEach(chart => {
        if (!chart?.options?.scales) return;
        
        ['x', 'y'].forEach(axis => {
            if (chart.options.scales[axis]) {
                if (chart.options.scales[axis].grid) {
                    chart.options.scales[axis].grid.color = colors.grid;
                }
                if (chart.options.scales[axis].ticks) {
                    chart.options.scales[axis].ticks.color = colors.text;
                }
            }
        });
        chart.update('none');
    });
}

// ============================================
// COMMANDS
// ============================================
function initCommands() {
    elements.commandSearch?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        filterCommands(query);
    });
    
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cmd = this.dataset.command;
            copyToClipboard(cmd);
            
            this.innerHTML = '<i class="fas fa-check"></i>';
            this.classList.add('copied');
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-copy"></i>';
                this.classList.remove('copied');
            }, 2000);
        });
    });
}

function filterCommands(query) {
    document.querySelectorAll('.command-category').forEach(category => {
        let visible = false;
        
        category.querySelectorAll('.command-item').forEach(item => {
            const code = item.querySelector('code')?.textContent.toLowerCase() || '';
            const desc = item.querySelector('p')?.textContent.toLowerCase() || '';
            const match = !query || code.includes(query) || desc.includes(query);
            
            item.style.display = match ? '' : 'none';
            if (match) visible = true;
        });
        
        category.style.display = visible ? '' : 'none';
    });
}

// ============================================
// FAQ
// ============================================
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.faq-item');
            const wasActive = item.classList.contains('active');
            
            document.querySelectorAll('.faq-item.active').forEach(i => i.classList.remove('active'));
            
            if (!wasActive) item.classList.add('active');
        });
    });
}

// ============================================
// FEEDBACK FORM
// ============================================
function initFeedbackForm() {
    elements.feedbackForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = e.target.querySelector('.submit-btn');
        const originalHTML = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
        
        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));
        
        showToast('Feedback Sent!', 'Thank you for your feedback.', 'success');
        e.target.reset();
        
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    });
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(title, message, type = 'info') {
    if (!elements.toastContainer) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    const close = () => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    };
    
    toast.querySelector('.toast-close').addEventListener('click', close);
    setTimeout(close, CONFIG.TOAST_DURATION);
}

// ============================================
// UTILITIES
// ============================================
function safeSetText(el, text) {
    if (el) el.textContent = text;
}

function safeSetWidth(el, percent) {
    if (el) el.style.width = `${Math.min(Math.max(percent, 0), 100)}%`;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTimestamp(stamp) {
    if (!stamp) return '00:00';
    // Remove leading zeros for hours if 00
    return stamp.replace(/^00:/, '');
}

function getSourceIcon(source) {
    const icons = {
        youtube: 'fab fa-youtube',
        spotify: 'fab fa-spotify',
        soundcloud: 'fab fa-soundcloud',
        deezer: 'fas fa-compact-disc',
        applemusic: 'fab fa-apple',
        twitch: 'fab fa-twitch',
        bandcamp: 'fab fa-bandcamp',
        vimeo: 'fab fa-vimeo-v',
    };
    return icons[source?.toLowerCase()] || 'fas fa-music';
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => showToast('Copied!', `"${text}" copied to clipboard`, 'success'))
            .catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast('Copied!', `"${text}" copied`, 'success');
    } catch {
        showToast('Error', 'Copy failed', 'error');
    }
    ta.remove();
}

// ============================================
// WINDOW EVENTS
// ============================================
window.addEventListener('resize', () => {
    if (window.innerWidth > 992) closeMobileSidebar();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(state.refreshInterval);
    } else {
        fetchData();
        startAutoRefresh();
    }
});

window.addEventListener('beforeunload', () => {
    clearInterval(state.refreshInterval);
});

// ============================================
// DEBUG
// ============================================
window.dashboardDebug = { state, CONFIG, fetchData };

console.log('📜 app.js loaded');
