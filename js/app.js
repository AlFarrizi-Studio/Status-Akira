/* ============================================
   AL FARRIZI MUSIC BOT - DASHBOARD APPLICATION
   Version: 4.23.7
   ============================================ */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    API_ENDPOINT: 'https://unclaiming-fully-camron.ngrok-free.dev/all',
    REFRESH_INTERVAL: 5000, // 5 seconds
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
        uptime: []
    },
    refreshInterval: null,
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    navItems: document.querySelectorAll('.nav-item'),
    
    // Theme
    themeToggle: document.getElementById('themeToggle'),
    themeToggleMobile: document.getElementById('themeToggleMobile'),
    
    // Pages
    pages: document.querySelectorAll('.page'),
    
    // Dashboard
    apiStatusIndicator: document.getElementById('apiStatusIndicator'),
    lastUpdated: document.getElementById('lastUpdated'),
    apiStatus: document.getElementById('apiStatus'),
    responseTime: document.getElementById('responseTime'),
    serverVersion: document.getElementById('serverVersion'),
    healthGrade: document.getElementById('healthGrade'),
    healthScore: document.getElementById('healthScore'),
    uptime: document.getElementById('uptime'),
    
    // Now Playing
    nowPlayingContainer: document.getElementById('nowPlayingContainer'),
    playingCount: document.getElementById('playingCount'),
    
    // Quick Stats
    totalPlayers: document.getElementById('totalPlayers'),
    activePlaying: document.getElementById('activePlaying'),
    idlePlayers: document.getElementById('idlePlayers'),
    frameIntegrity: document.getElementById('frameIntegrity'),
    playersBar: document.getElementById('playersBar'),
    activeBar: document.getElementById('activeBar'),
    idleBar: document.getElementById('idleBar'),
    frameBar: document.getElementById('frameBar'),
    
    // Stats Page
    cpuSystemLoad: document.getElementById('cpuSystemLoad'),
    cpuLavalinkLoad: document.getElementById('cpuLavalinkLoad'),
    cpuCores: document.getElementById('cpuCores'),
    memUsed: document.getElementById('memUsed'),
    memAllocated: document.getElementById('memAllocated'),
    memFree: document.getElementById('memFree'),
    memUsage: document.getElementById('memUsage'),
    statTotalPlayers: document.getElementById('statTotalPlayers'),
    statPlayingPlayers: document.getElementById('statPlayingPlayers'),
    statIdlePlayers: document.getElementById('statIdlePlayers'),
    statFrameIntegrity: document.getElementById('statFrameIntegrity'),
    statFrameStatus: document.getElementById('statFrameStatus'),
    statFrameSent: document.getElementById('statFrameSent'),
    statFrameExpected: document.getElementById('statFrameExpected'),
    
    // Sources & Filters
    sourcesGrid: document.getElementById('sourcesGrid'),
    filtersGrid: document.getElementById('filtersGrid'),
    
    // Commands
    commandSearch: document.getElementById('commandSearch'),
    commandsContainer: document.getElementById('commandsContainer'),
    
    // Feedback
    feedbackForm: document.getElementById('feedbackForm'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer'),
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initNavigation();
    initCommands();
    initFAQ();
    initFeedbackForm();
    initCharts();
    fetchData();
    startAutoRefresh();
});

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
    const toggles = [elements.themeToggle, elements.themeToggleMobile];
    
    toggles.forEach(toggle => {
        if (toggle) {
            toggle.innerHTML = `<i class="fas ${icon}"></i>`;
        }
    });
    
    // Update charts if they exist
    updateChartsTheme();
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
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
        text: isDark ? '#a0a0b0' : '#4a4a5a',
        grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    };
}

// ============================================
// SIDEBAR MANAGEMENT
// ============================================
function initSidebar() {
    elements.sidebarToggle?.addEventListener('click', () => {
        elements.sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', elements.sidebar.classList.contains('collapsed'));
    });
    
    elements.mobileMenuBtn?.addEventListener('click', () => {
        elements.sidebar.classList.add('mobile-open');
        elements.sidebarOverlay.classList.add('active');
    });
    
    elements.sidebarOverlay?.addEventListener('click', closeMobileSidebar);
    
    // Restore sidebar state
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed && window.innerWidth > 992) {
        elements.sidebar.classList.add('collapsed');
    }
}

function closeMobileSidebar() {
    elements.sidebar.classList.remove('mobile-open');
    elements.sidebarOverlay.classList.remove('active');
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateToPage(page);
            closeMobileSidebar();
        });
    });
    
    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1) || 'dashboard';
        navigateToPage(hash, false);
    });
    
    // Initial navigation
    const initialPage = window.location.hash.slice(1) || 'dashboard';
    navigateToPage(initialPage, false);
}

function navigateToPage(pageName, updateHash = true) {
    // Update nav items
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });
    
    // Update pages
    elements.pages.forEach(page => {
        const isActive = page.id === `page-${pageName}`;
        page.classList.toggle('active', isActive);
    });
    
    // Update URL hash
    if (updateHash) {
        window.location.hash = pageName;
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// ============================================
// API DATA FETCHING
// ============================================
async function fetchData() {
    const startTime = performance.now();
    
    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        
        state.apiData = data;
        state.isOnline = true;
        state.lastUpdated = new Date();
        
        updateDashboard(data, responseTime);
        updateStats(data);
        updateNowPlaying(data);
        updateSources(data);
        updateFilters(data);
        updateCharts(data);
        
    } catch (error) {
        console.error('Failed to fetch data:', error);
        state.isOnline = false;
        updateOfflineState();
    }
}

function startAutoRefresh() {
    if (state.refreshInterval) {
        clearInterval(state.refreshInterval);
    }
    state.refreshInterval = setInterval(fetchData, CONFIG.REFRESH_INTERVAL);
}

// ============================================
// DASHBOARD UPDATES
// ============================================
function updateDashboard(data, responseTime) {
    // Update API status indicator
    elements.apiStatusIndicator.classList.remove('offline');
    elements.apiStatusIndicator.querySelector('.status-text').textContent = 'API Online';
    
    // Update last updated time
    elements.lastUpdated.textContent = 'Just now';
    
    // Update status cards
    elements.apiStatus.textContent = data.success ? 'Online' : 'Offline';
    elements.responseTime.textContent = `${responseTime}ms`;
    elements.serverVersion.textContent = data.server?.version?.semver || '--';
    
    const health = data.performance?.health || {};
    elements.healthGrade.textContent = health.grade || '--';
    elements.healthScore.textContent = health.score ? `${health.score}%` : '--%';
    elements.uptime.textContent = data.performance?.uptime?.formatted || '--';
    
    // Update quick stats
    const players = data.performance?.players || {};
    const totalPlayers = players.total || 0;
    const playingPlayers = players.playing || 0;
    const idlePlayers = totalPlayers - playingPlayers;
    
    elements.totalPlayers.textContent = totalPlayers;
    elements.activePlaying.textContent = playingPlayers;
    elements.idlePlayers.textContent = idlePlayers;
    
    const maxPlayers = Math.max(totalPlayers, 10);
    elements.playersBar.style.width = `${(totalPlayers / maxPlayers) * 100}%`;
    elements.activeBar.style.width = `${totalPlayers > 0 ? (playingPlayers / totalPlayers) * 100 : 0}%`;
    elements.idleBar.style.width = `${totalPlayers > 0 ? (idlePlayers / totalPlayers) * 100 : 0}%`;
    
    const frameIntegrity = data.performance?.frames?.integrity || 0;
    elements.frameIntegrity.textContent = `${frameIntegrity}%`;
    elements.frameBar.style.width = `${frameIntegrity}%`;
}

function updateOfflineState() {
    elements.apiStatusIndicator.classList.add('offline');
    elements.apiStatusIndicator.querySelector('.status-text').textContent = 'API Offline';
    elements.apiStatus.textContent = 'Offline';
    elements.responseTime.textContent = '--ms';
}

// ============================================
// STATS PAGE UPDATES
// ============================================
function updateStats(data) {
    const cpu = data.performance?.cpu || {};
    const memory = data.performance?.memory || {};
    const players = data.performance?.players || {};
    const frames = data.performance?.frames || {};
    
    // CPU Stats
    elements.cpuSystemLoad.textContent = cpu.system_load ? `${cpu.system_load.toFixed(1)}%` : '--%';
    elements.cpuLavalinkLoad.textContent = cpu.lavalink_load ? `${cpu.lavalink_load.toFixed(1)}%` : '--%';
    elements.cpuCores.textContent = cpu.cores || '--';
    
    // Memory Stats
    elements.memUsed.textContent = memory.used ? formatBytes(memory.used) : '-- MB';
    elements.memAllocated.textContent = memory.allocated ? formatBytes(memory.allocated) : '-- MB';
    elements.memFree.textContent = memory.free ? formatBytes(memory.free) : '-- MB';
    elements.memUsage.textContent = memory.usage_percent ? `${memory.usage_percent.toFixed(1)}%` : '--%';
    
    // Players Stats
    elements.statTotalPlayers.textContent = players.total || '0';
    elements.statPlayingPlayers.textContent = players.playing || '0';
    elements.statIdlePlayers.textContent = (players.total || 0) - (players.playing || 0);
    
    // Frame Stats
    elements.statFrameIntegrity.textContent = frames.integrity ? `${frames.integrity}%` : '--%';
    elements.statFrameStatus.textContent = frames.status || '--';
    elements.statFrameSent.textContent = frames.sent || '--';
    elements.statFrameExpected.textContent = frames.expected || '--';
}

// ============================================
// NOW PLAYING UPDATES
// ============================================
function updateNowPlaying(data) {
    const nowPlaying = data.now_playing || [];
    
    elements.playingCount.textContent = `${nowPlaying.length} track${nowPlaying.length !== 1 ? 's' : ''}`;
    
    if (nowPlaying.length === 0) {
        elements.nowPlayingContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-music"></i>
                <p>No tracks currently playing</p>
            </div>
        `;
        return;
    }
    
    elements.nowPlayingContainer.innerHTML = nowPlaying.map(track => createNowPlayingCard(track)).join('');
}

function createNowPlayingCard(track) {
    const progress = track.duration > 0 ? (track.position / track.duration) * 100 : 0;
    const currentTime = formatDuration(track.position || 0);
    const totalTime = formatDuration(track.duration || 0);
    const sourceIcon = getSourceIcon(track.source);
    
    return `
        <div class="now-playing-card">
            <div class="np-header">
                <div class="np-artwork">
                    <img src="${track.artwork || 'https://via.placeholder.com/80?text=🎵'}" alt="Album Art" onerror="this.src='https://via.placeholder.com/80?text=🎵'">
                    <div class="np-playing-indicator">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="np-info">
                    <h4 class="np-title" title="${escapeHtml(track.title || 'Unknown Title')}">${escapeHtml(track.title || 'Unknown Title')}</h4>
                    <p class="np-artist" title="${escapeHtml(track.author || 'Unknown Artist')}">${escapeHtml(track.author || 'Unknown Artist')}</p>
                    <span class="np-source">
                        <i class="${sourceIcon}"></i>
                        ${track.source || 'Unknown'}
                    </span>
                </div>
            </div>
            <div class="np-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-time">
                    <span>${currentTime}</span>
                    <span>${totalTime}</span>
                </div>
            </div>
            <div class="np-footer">
                <div class="np-stats">
                    <span class="np-stat">
                        <i class="fas fa-signal"></i>
                        ${track.ping || '--'}ms
                    </span>
                    <span class="np-stat">
                        <i class="fas fa-server"></i>
                        ${track.guild_id ? `Guild ${track.guild_id.slice(-4)}` : '--'}
                    </span>
                </div>
                <span class="np-status ${track.connected ? 'connected' : 'disconnected'}">
                    <i class="fas fa-${track.connected ? 'check-circle' : 'times-circle'}"></i>
                    ${track.connected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
        </div>
    `;
}

// ============================================
// SOURCES PAGE
// ============================================
function updateSources(data) {
    const sources = data.server?.capabilities?.sources || [];
    
    if (sources.length === 0) {
        elements.sourcesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-plug"></i>
                <p>No sources available</p>
            </div>
        `;
        return;
    }
    
    elements.sourcesGrid.innerHTML = sources.map(source => createSourceCard(source)).join('');
}

function createSourceCard(source) {
    const sourceInfo = getSourceInfo(source);
    
    return `
        <div class="source-card">
            <div class="source-icon ${sourceInfo.class}">
                <i class="${sourceInfo.icon}"></i>
            </div>
            <div class="source-info">
                <h4 class="source-name">${sourceInfo.name}</h4>
                <p class="source-status">Available</p>
            </div>
            <div class="source-toggle active"></div>
        </div>
    `;
}

function getSourceInfo(source) {
    const sources = {
        youtube: { name: 'YouTube', icon: 'fab fa-youtube', class: 'youtube' },
        spotify: { name: 'Spotify', icon: 'fab fa-spotify', class: 'spotify' },
        soundcloud: { name: 'SoundCloud', icon: 'fab fa-soundcloud', class: 'soundcloud' },
        twitch: { name: 'Twitch', icon: 'fab fa-twitch', class: 'twitch' },
        bandcamp: { name: 'Bandcamp', icon: 'fab fa-bandcamp', class: 'bandcamp' },
        vimeo: { name: 'Vimeo', icon: 'fab fa-vimeo', class: 'vimeo' },
        http: { name: 'HTTP Stream', icon: 'fas fa-globe', class: 'http' },
        local: { name: 'Local Files', icon: 'fas fa-folder', class: 'default' },
    };
    
    const key = source.toLowerCase();
    return sources[key] || { name: source, icon: 'fas fa-music', class: 'default' };
}

// ============================================
// FILTERS PAGE
// ============================================
function updateFilters(data) {
    const filters = data.server?.capabilities?.filters || [];
    
    if (filters.length === 0) {
        elements.filtersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sliders-h"></i>
                <p>No filters available</p>
            </div>
        `;
        return;
    }
    
    elements.filtersGrid.innerHTML = filters.map(filter => createFilterCard(filter)).join('');
    
    // Initialize filter toggles
    initFilterToggles();
}

function createFilterCard(filter) {
    const filterInfo = getFilterInfo(filter);
    
    return `
        <div class="filter-card" data-filter="${filter}">
            <div class="filter-header">
                <span class="filter-name">${filterInfo.name}</span>
                <div class="filter-toggle" data-filter="${filter}"></div>
            </div>
            <p class="filter-description">${filterInfo.description}</p>
            ${filterInfo.hasSlider ? `
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
}

function getFilterInfo(filter) {
    const filters = {
        karaoke: { name: 'Karaoke', description: 'Remove vocals from the track', hasSlider: true },
        timescale: { name: 'Timescale', description: 'Adjust playback speed and pitch', hasSlider: true },
        tremolo: { name: 'Tremolo', description: 'Add trembling effect to audio', hasSlider: true },
        vibrato: { name: 'Vibrato', description: 'Add vibrating pitch effect', hasSlider: true },
        rotation: { name: 'Rotation', description: 'Rotate audio around stereo field', hasSlider: true },
        distortion: { name: 'Distortion', description: 'Add distortion effect', hasSlider: true },
        channelmix: { name: 'Channel Mix', description: 'Mix left and right channels', hasSlider: false },
        lowpass: { name: 'Low Pass', description: 'Filter high frequencies', hasSlider: true },
        highpass: { name: 'High Pass', description: 'Filter low frequencies', hasSlider: true },
        bassboost: { name: 'Bass Boost', description: 'Enhance bass frequencies', hasSlider: true },
        nightcore: { name: 'Nightcore', description: 'Speed up with higher pitch', hasSlider: false },
        vaporwave: { name: 'Vaporwave', description: 'Slow down with lower pitch', hasSlider: false },
        '8d': { name: '8D Audio', description: 'Rotating spatial audio effect', hasSlider: false },
        echo: { name: 'Echo', description: 'Add echo effect', hasSlider: true },
    };
    
    const key = filter.toLowerCase();
    return filters[key] || { name: filter, description: 'Audio filter', hasSlider: false };
}

function initFilterToggles() {
    document.querySelectorAll('.filter-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            this.classList.toggle('active');
            const filterName = this.dataset.filter;
            const isActive = this.classList.contains('active');
            
            showToast(
                isActive ? 'Filter Enabled' : 'Filter Disabled',
                `${filterName} has been ${isActive ? 'enabled' : 'disabled'}`,
                isActive ? 'success' : 'info'
            );
        });
    });
}

// ============================================
// CHARTS
// ============================================
function initCharts() {
    const colors = getChartColors();
    const chartConfig = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 500,
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#a0a0b0',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
            },
        },
        scales: {
            x: {
                display: false,
            },
            y: {
                display: true,
                grid: {
                    color: colors.grid,
                    drawBorder: false,
                },
                ticks: {
                    color: colors.text,
                    font: {
                        size: 11,
                    },
                },
            },
        },
    };
    
    // CPU Chart
    const cpuCtx = document.getElementById('cpuChart')?.getContext('2d');
    if (cpuCtx) {
        state.charts.cpu = new Chart(cpuCtx, {
            type: 'line',
            data: {
                labels: Array(CONFIG.CHART_HISTORY_LENGTH).fill(''),
                datasets: [{
                    label: 'System Load',
                    data: Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryLight,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2,
                }, {
                    label: 'Lavalink Load',
                    data: Array(CONFIG.CHART_HISTORY_LENGTH).fill(0),
                    borderColor: colors.info,
                    backgroundColor: colors.infoLight,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2,
                }],
            },
            options: {
                ...chartConfig,
                scales: {
                    ...chartConfig.scales,
                    y: {
                        ...chartConfig.scales.y,
                        min: 0,
                        max: 100,
                    },
                },
            },
        });
    }
    
    // Memory Chart
    const memoryCtx = document.getElementById('memoryChart')?.getContext('2d');
    if (memoryCtx) {
        state.charts.memory = new Chart(memoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Used', 'Free'],
                datasets: [{
                    data: [0, 100],
                    backgroundColor: [colors.primary, colors.grid],
                    borderWidth: 0,
                    cutout: '75%',
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw.toFixed(1)}%`;
                            },
                        },
                    },
                },
            },
        });
    }
    
    // Players Chart
    const playersCtx = document.getElementById('playersChart')?.getContext('2d');
    if (playersCtx) {
        state.charts.players = new Chart(playersCtx, {
            type: 'bar',
            data: {
                labels: ['Total', 'Playing', 'Idle'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [colors.primary, colors.success, colors.warning],
                    borderRadius: 8,
                    borderSkipped: false,
                }],
            },
            options: {
                ...chartConfig,
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: colors.text,
                        },
                    },
                    y: {
                        ...chartConfig.scales.y,
                        beginAtZero: true,
                    },
                },
            },
        });
    }
    
    // Frame Chart
    const frameCtx = document.getElementById('frameChart')?.getContext('2d');
    if (frameCtx) {
        state.charts.frame = new Chart(frameCtx, {
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
            options: {
                ...chartConfig,
                scales: {
                    ...chartConfig.scales,
                    y: {
                        ...chartConfig.scales.y,
                        min: 0,
                        max: 100,
                    },
                },
            },
        });
    }
    
    // Uptime Chart
    const uptimeCtx = document.getElementById('uptimeChart')?.getContext('2d');
    if (uptimeCtx) {
        state.charts.uptime = new Chart(uptimeCtx, {
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
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                }],
            },
            options: {
                ...chartConfig,
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: colors.grid,
                        },
                        ticks: {
                            color: colors.text,
                            maxTicksLimit: 10,
                        },
                    },
                    y: {
                        ...chartConfig.scales.y,
                        beginAtZero: true,
                    },
                },
            },
        });
    }
}

function updateCharts(data) {
    const cpu = data.performance?.cpu || {};
    const memory = data.performance?.memory || {};
    const players = data.performance?.players || {};
    const frames = data.performance?.frames || {};
    
    // Update CPU Chart
    if (state.charts.cpu) {
        const systemLoad = cpu.system_load || 0;
        const lavalinkLoad = cpu.lavalink_load || 0;
        
        state.charts.cpu.data.datasets[0].data.push(systemLoad);
        state.charts.cpu.data.datasets[0].data.shift();
        state.charts.cpu.data.datasets[1].data.push(lavalinkLoad);
        state.charts.cpu.data.datasets[1].data.shift();
        state.charts.cpu.update('none');
    }
    
    // Update Memory Chart
    if (state.charts.memory) {
        const usagePercent = memory.usage_percent || 0;
        state.charts.memory.data.datasets[0].data = [usagePercent, 100 - usagePercent];
        state.charts.memory.update('none');
    }
    
    // Update Players Chart
    if (state.charts.players) {
        const total = players.total || 0;
        const playing = players.playing || 0;
        const idle = total - playing;
        
        state.charts.players.data.datasets[0].data = [total, playing, idle];
        state.charts.players.update('none');
    }
    
    // Update Frame Chart
    if (state.charts.frame) {
        const integrity = frames.integrity || 100;
        
        state.charts.frame.data.datasets[0].data.push(integrity);
        state.charts.frame.data.datasets[0].data.shift();
        state.charts.frame.update('none');
    }
    
    // Update Uptime Chart (using response time as a metric)
    if (state.charts.uptime) {
        const responseTime = parseInt(elements.responseTime.textContent) || 0;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        state.charts.uptime.data.labels.push(time);
        state.charts.uptime.data.labels.shift();
        state.charts.uptime.data.datasets[0].data.push(responseTime);
        state.charts.uptime.data.datasets[0].data.shift();
        state.charts.uptime.update('none');
    }
}

function updateChartsTheme() {
    const colors = getChartColors();
    
    Object.values(state.charts).forEach(chart => {
        if (chart && chart.options) {
            if (chart.options.scales?.y) {
                chart.options.scales.y.grid.color = colors.grid;
                chart.options.scales.y.ticks.color = colors.text;
            }
            if (chart.options.scales?.x) {
                chart.options.scales.x.grid.color = colors.grid;
                chart.options.scales.x.ticks.color = colors.text;
            }
            chart.update('none');
        }
    });
}

// ============================================
// COMMANDS PAGE
// ============================================
function initCommands() {
    // Search functionality
    elements.commandSearch?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterCommands(query);
    });
    
    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const command = this.dataset.command;
            copyToClipboard(command);
            
            this.classList.add('copied');
            this.innerHTML = '<i class="fas fa-check"></i>';
            
            setTimeout(() => {
                this.classList.remove('copied');
                this.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        });
    });
}

function filterCommands(query) {
    const categories = document.querySelectorAll('.command-category');
    
    categories.forEach(category => {
        const items = category.querySelectorAll('.command-item');
        let hasVisibleItems = false;
        
        items.forEach(item => {
            const code = item.querySelector('code')?.textContent.toLowerCase() || '';
            const desc = item.querySelector('p')?.textContent.toLowerCase() || '';
            const matches = code.includes(query) || desc.includes(query);
            
            item.style.display = matches ? 'flex' : 'none';
            if (matches) hasVisibleItems = true;
        });
        
        category.style.display = hasVisibleItems ? 'block' : 'none';
    });
}

// ============================================
// FAQ
// ============================================
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const isActive = faqItem.classList.contains('active');
            
            // Close all other FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current FAQ
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}

// ============================================
// FEEDBACK FORM
// ============================================
function initFeedbackForm() {
    elements.feedbackForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('feedbackUsername')?.value,
            email: document.getElementById('feedbackEmail')?.value,
            type: document.getElementById('feedbackType')?.value,
            message: document.getElementById('feedbackMessage')?.value,
            contactConsent: document.getElementById('feedbackContact')?.checked,
        };
        
        // Simulate form submission
        const submitBtn = elements.feedbackForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            showToast(
                'Feedback Sent!',
                'Thank you for your feedback. We\'ll review it shortly.',
                'success'
            );
            
            elements.feedbackForm.reset();
            
        } catch (error) {
            showToast(
                'Error',
                'Failed to send feedback. Please try again.',
                'error'
            );
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(title, message, type = 'info') {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });
    
    // Auto remove
    setTimeout(() => {
        removeToast(toast);
    }, CONFIG.TOAST_DURATION);
}

function removeToast(toast) {
    toast.classList.add('hide');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms) {
    if (!ms || ms < 0) return '0:00';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getSourceIcon(source) {
    const icons = {
        youtube: 'fab fa-youtube',
        spotify: 'fab fa-spotify',
        soundcloud: 'fab fa-soundcloud',
        twitch: 'fab fa-twitch',
        bandcamp: 'fab fa-bandcamp',
        vimeo: 'fab fa-vimeo',
        http: 'fas fa-globe',
    };
    
    const key = (source || '').toLowerCase();
    return icons[key] || 'fas fa-music';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied!', `"${text}" copied to clipboard`, 'success');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Copied!', `"${text}" copied to clipboard`, 'success');
    } catch (err) {
        showToast('Error', 'Failed to copy to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
}

// ============================================
// WINDOW EVENTS
// ============================================
window.addEventListener('resize', () => {
    // Close mobile sidebar on resize to desktop
    if (window.innerWidth > 992) {
        closeMobileSidebar();
    }
});

// Handle visibility change (pause/resume refresh)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(state.refreshInterval);
    } else {
        fetchData();
        startAutoRefresh();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    clearInterval(state.refreshInterval);
});
