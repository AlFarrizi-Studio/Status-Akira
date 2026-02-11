/**
 * Akira Status Page - JavaScript
 * Real-time Lavalink Server Status Monitor (HTTP Polling Mode)
 * 
 * @version 2.2.0
 * @author Akira
 */

(function() {
    'use strict';

    // ============================================
    // Configuration - GANTI URL TUNNEL DI SINI
    // ============================================
    const CONFIG = {
        server: {
            host: 'lips-flash-advertisement-telecom.trycloudflare.com',
            password: 'AkiraMusic'
        },
        updateInterval: 3000,
        iconsPath: 'icons/'
    };

    const URLS = {
        stats: `https://${CONFIG.server.host}/v4/stats`,
        version: `https://${CONFIG.server.host}/version`
    };

    // ============================================
    // Music Sources Data
    // ============================================
    const MUSIC_SOURCES = [
        { name: 'YouTube', icon: 'youtube.png', fallback: '▶️', color: '#FF0000' },
        { name: 'YouTube Music', icon: 'youtube-music.png', fallback: '🎵', color: '#FF0000' },
        { name: 'SoundCloud', icon: 'soundcloud.png', fallback: '☁️', color: '#FF5500' },
        { name: 'Spotify', icon: 'spotify.png', fallback: '🟢', color: '#1DB954' },
        { name: 'Apple Music', icon: 'apple-music.png', fallback: '🍎', color: '#FC3C44' },
        { name: 'Deezer', icon: 'deezer.png', fallback: '🎧', color: '#FEAA2D' },
        { name: 'Tidal', icon: 'tidal.png', fallback: '🌊', color: '#00FFFF' },
        { name: 'Bandcamp', icon: 'bandcamp.png', fallback: '💿', color: '#629AA9' },
        { name: 'Audiomack', icon: 'audiomack.png', fallback: '🎤', color: '#FFA200' },
        { name: 'Gaana', icon: 'gaana.png', fallback: '🎶', color: '#E72C30' },
        { name: 'JioSaavn', icon: 'jiosaavn.png', fallback: '🇮🇳', color: '#2BC5B4' },
        { name: 'Last.fm', icon: 'lastfm.png', fallback: '📻', color: '#D51007' },
        { name: 'Pandora', icon: 'pandora.png', fallback: '📡', color: '#005483' },
        { name: 'VK Music', icon: 'vk-music.png', fallback: '💙', color: '#4C75A3' },
        { name: 'Mixcloud', icon: 'mixcloud.png', fallback: '🎚️', color: '#5000FF' },
        { name: 'NicoVideo', icon: 'nicovideo.png', fallback: '📺', color: '#252525' },
        { name: 'Bilibili', icon: 'bilibili.png', fallback: '📱', color: '#00A1D6' },
        { name: 'Shazam', icon: 'shazam.png', fallback: '🔍', color: '#0088FF' },
        { name: 'Eternal Box', icon: 'eternal-box.png', fallback: '📦', color: '#9B59B6' },
        { name: 'Songlink', icon: 'songlink.png', fallback: '🔗', color: '#1E90FF' },
        { name: 'Qobuz', icon: 'qobuz.png', fallback: '🎼', color: '#0170CC' },
        { name: 'Yandex Music', icon: 'yandex-music.png', fallback: '🟡', color: '#FFCC00' },
        { name: 'Audius', icon: 'audius.png', fallback: '🎪', color: '#CC0FE0' },
        { name: 'Amazon Music', icon: 'amazon-music.png', fallback: '🛒', color: '#00A8E1' },
        { name: 'Anghami', icon: 'anghami.png', fallback: '💜', color: '#9B2FAE' },
        { name: 'Bluesky', icon: 'bluesky.png', fallback: '🦋', color: '#0085FF' },
        { name: 'Letras.mus.br', icon: 'letras.png', fallback: '📝', color: '#FF6B35' },
        { name: 'Piper TTS', icon: 'piper-tts.png', fallback: '🗣️', color: '#4CAF50' },
        { name: 'Google TTS', icon: 'google-tts.png', fallback: '🔊', color: '#4285F4' },
        { name: 'Flowery TTS', icon: 'flowery-tts.png', fallback: '🌸', color: '#FF69B4' },
        { name: 'URL Stream', icon: 'unified.png', fallback: '🔄', color: '#6366F1' }
    ];

    // ============================================
    // State
    // ============================================
    const state = {
        isConnected: false,
        pollInterval: null,
        pingLatency: 0,
        uptimeMs: 0,
        uptimeInterval: null,
        failCount: 0,
        maxFails: 5
    };

    // ============================================
    // DOM Elements
    // ============================================
    const elements = {};
    const elementIds = [
        'connectionBar', 'statusDot', 'statusText', 'connectionModeText',
        'pingValue', 'pingWave', 'pingStatus',
        'uptimeDays', 'uptimeHours', 'uptimeMinutes', 'uptimeSeconds',
        'totalPlayers', 'playingPlayersText', 'playersProgress',
        'cpuCores', 'systemLoadText', 'systemLoadProgress',
        'processLoadText', 'processLoadProgress',
        'memoryUsageText', 'memoryProgress',
        'memoryUsed', 'memoryFree', 'memoryAllocated', 'memoryReservable',
        'framesSent', 'framesNulled', 'framesDeficit', 'framesExpected',
        'lastUpdate', 'sourcesGrid', 'sourcesCount', 'toastContainer',
        'refreshBtn', 'updateInterval', 'serverAddress'
    ];

    function cacheElements() {
        elementIds.forEach(id => {
            elements[id] = document.getElementById(id);
        });
    }

    // ============================================
    // Utilities
    // ============================================
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatUptime(ms) {
        if (!ms || ms < 0) ms = 0;
        const totalSeconds = Math.floor(ms / 1000);
        return {
            days: String(Math.floor(totalSeconds / 86400)).padStart(2, '0'),
            hours: String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0'),
            minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'),
            seconds: String(totalSeconds % 60).padStart(2, '0')
        };
    }

    function formatNumber(num) {
        if (num === undefined || num === null || isNaN(num)) return '--';
        return num.toLocaleString();
    }

    function setText(id, text) {
        if (elements[id]) elements[id].textContent = text;
    }

    function setStyle(id, prop, val) {
        if (elements[id]) elements[id].style[prop] = val;
    }

    function showToast(message, type = 'info', duration = 4000) {
        if (!elements.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span class="toast-message">${message}</span>`;
        elements.toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ============================================
    // UI Updates
    // ============================================
    function initMusicSources() {
        if (!elements.sourcesGrid) return;
        const fragment = document.createDocumentFragment();
        MUSIC_SOURCES.forEach((source, i) => {
            const item = document.createElement('div');
            item.className = 'source-item';
            item.style.animationDelay = `${0.02 * i}s`;
            item.innerHTML = `
                <div class="source-icon" style="background: ${source.color}15;">
                    <img src="${CONFIG.iconsPath}${source.icon}" alt="${source.name}" class="source-icon-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <span class="source-icon-fallback" style="display:none;">${source.fallback}</span>
                </div>
                <span class="source-name">${source.name}</span>
            `;
            fragment.appendChild(item);
        });
        elements.sourcesGrid.innerHTML = '';
        elements.sourcesGrid.appendChild(fragment);
        if (elements.sourcesCount) elements.sourcesCount.textContent = `${MUSIC_SOURCES.length} Sources`;
    }

    function updateStatus(status) {
        ['online', 'offline', 'connecting'].forEach(cls => {
            [elements.connectionBar, elements.statusDot, elements.statusText].forEach(el => {
                if (el) el.classList.remove(cls);
            });
        });
        [elements.connectionBar, elements.statusDot, elements.statusText].forEach(el => {
            if (el) el.classList.add(status);
        });
        const texts = { online: 'Operational', offline: 'Offline', connecting: 'Connecting...' };
        setText('statusText', texts[status] || status);
    }

    function updateConnectionMode(mode) {
        const modes = { polling: '🟢 Live', offline: '🔴 Offline', connecting: '🟡 Connecting' };
        setText('connectionModeText', modes[mode] || mode);
    }

    function updatePing(ping) {
        const pingNum = parseInt(ping) || 0;
        state.pingLatency = pingNum;
        setText('pingValue', pingNum);
        
        if (elements.pingValue) {
            elements.pingValue.className = 'ping-value';
            let colorClass = 'good', status = 'Excellent';
            if (pingNum >= 500) { colorClass = 'bad'; status = 'Slow'; }
            else if (pingNum >= 300) { colorClass = 'medium'; status = 'Fair'; }
            else if (pingNum >= 100) { colorClass = 'good'; status = 'Good'; }
            elements.pingValue.classList.add(colorClass);
            setText('pingStatus', status);
            
            if (elements.pingWave) {
                const colors = { good: '#10b981', medium: '#f59e0b', bad: '#ef4444' };
                elements.pingWave.querySelectorAll('span').forEach(s => s.style.background = colors[colorClass]);
            }
        }
    }

    function updateUptimeDisplay() {
        const u = formatUptime(state.uptimeMs);
        setText('uptimeDays', u.days);
        setText('uptimeHours', u.hours);
        setText('uptimeMinutes', u.minutes);
        setText('uptimeSeconds', u.seconds);
        state.uptimeMs += 1000;
    }

    function resetStats() {
        const defaults = {
            pingValue: '--', pingStatus: '--', totalPlayers: '--',
            playingPlayersText: '-- playing', cpuCores: '-- Cores',
            systemLoadText: '--%', processLoadText: '--%',
            memoryUsageText: '-- / --', memoryUsed: '--', memoryFree: '--',
            memoryAllocated: '--', memoryReservable: '--',
            framesSent: '--', framesNulled: '--', framesDeficit: '--', framesExpected: '--',
            uptimeDays: '00', uptimeHours: '00', uptimeMinutes: '00', uptimeSeconds: '00'
        };
        Object.entries(defaults).forEach(([k, v]) => setText(k, v));
        ['playersProgress', 'systemLoadProgress', 'processLoadProgress', 'memoryProgress'].forEach(id => setStyle(id, 'width', '0%'));
        if (state.uptimeInterval) { clearInterval(state.uptimeInterval); state.uptimeInterval = null; }
    }

    function updateStats(data) {
        if (!data) return;
        
        if (data.players !== undefined) setText('totalPlayers', formatNumber(data.players));
        if (data.playingPlayers !== undefined) {
            setText('playingPlayersText', `${formatNumber(data.playingPlayers)} playing`);
            const pct = data.players > 0 ? (data.playingPlayers / data.players) * 100 : 0;
            setStyle('playersProgress', 'width', `${Math.min(pct, 100)}%`);
        }
        
        if (data.uptime !== undefined) {
            state.uptimeMs = data.uptime;
            updateUptimeDisplay();
            if (!state.uptimeInterval) state.uptimeInterval = setInterval(updateUptimeDisplay, 1000);
        }
        
        if (data.memory) {
            const { used = 0, free = 0, allocated = 0, reservable = 0 } = data.memory;
            setText('memoryUsed', formatBytes(used));
            setText('memoryFree', formatBytes(free));
            setText('memoryAllocated', formatBytes(allocated));
            setText('memoryReservable', formatBytes(reservable));
            setText('memoryUsageText', `${formatBytes(used)} / ${formatBytes(allocated)}`);
            const memPct = allocated > 0 ? (used / allocated) * 100 : 0;
            setStyle('memoryProgress', 'width', `${Math.min(memPct, 100)}%`);
        }
        
        if (data.cpu) {
            setText('cpuCores', `${data.cpu.cores || '--'} Cores`);
            const sysLoad = (data.cpu.systemLoad || 0) * 100;
            const procLoad = (data.cpu.lavalinkLoad || data.cpu.processLoad || 0) * 100;
            setText('systemLoadText', `${sysLoad.toFixed(1)}%`);
            setStyle('systemLoadProgress', 'width', `${Math.min(sysLoad, 100)}%`);
            setText('processLoadText', `${procLoad.toFixed(1)}%`);
            setStyle('processLoadProgress', 'width', `${Math.min(procLoad, 100)}%`);
        }
        
        if (data.frameStats) {
            setText('framesSent', formatNumber(data.frameStats.sent || 0));
            setText('framesNulled', formatNumber(data.frameStats.nulled || 0));
            setText('framesDeficit', formatNumber(data.frameStats.deficit || 0));
            setText('framesExpected', formatNumber(data.frameStats.expected || 0));
        }
        
        setText('lastUpdate', new Date().toLocaleString('id-ID'));
    }

    // ============================================
    // HTTP Polling
    // ============================================
    async function fetchStats() {
        const start = performance.now();
        try {
            const ctrl = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 10000);
            
            const res = await fetch(URLS.stats, {
                method: 'GET',
                headers: { 'Authorization': CONFIG.server.password },
                signal: ctrl.signal
            });
            
            clearTimeout(timeout);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const data = await res.json();
            const latency = Math.round(performance.now() - start);
            
            state.failCount = 0;
            state.isConnected = true;
            
            updateStatus('online');
            updateConnectionMode('polling');
            updatePing(latency);
            updateStats(data);
            
            return data;
        } catch (err) {
            state.failCount++;
            console.error(`❌ Fetch failed (${state.failCount}/${state.maxFails}):`, err.message);
            if (state.failCount >= state.maxFails) {
                state.isConnected = false;
                updateStatus('offline');
                updateConnectionMode('offline');
            }
            throw err;
        }
    }

    async function checkServer() {
        try {
            const ctrl = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 10000);
            const res = await fetch(URLS.version, {
                method: 'GET',
                headers: { 'Authorization': CONFIG.server.password },
                signal: ctrl.signal
            });
            clearTimeout(timeout);
            if (res.ok) {
                console.log('✅ Server online!');
                return true;
            }
            console.log('❌ Server returned:', res.status);
            return false;
        } catch (err) {
            console.log('❌ Server check failed:', err.message);
            return false;
        }
    }

    function startPolling() {
        if (state.pollInterval) return;
        console.log('📡 Starting polling (every ' + CONFIG.updateInterval + 'ms)');
        fetchStats().catch(() => {});
        state.pollInterval = setInterval(() => fetchStats().catch(() => {}), CONFIG.updateInterval);
    }

    function stopPolling() {
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
            state.pollInterval = null;
        }
    }

    // ============================================
    // Event Handlers
    // ============================================
    async function handleRefresh() {
        console.log('🔄 Refreshing...');
        stopPolling();
        resetStats();
        state.failCount = 0;
        updateStatus('connecting');
        updateConnectionMode('connecting');
        showToast('Refreshing...', 'info');
        
        const available = await checkServer();
        if (available) {
            showToast('Connected!', 'success');
            startPolling();
        } else {
            showToast('Server not reachable', 'error');
            updateStatus('offline');
            updateConnectionMode('offline');
        }
    }

    // ============================================
    // Init
    // ============================================
    async function init() {
        console.log('🎵 Akira Status Page v2.2.0');
        console.log('📍 Server:', CONFIG.server.host);
        console.log('📊 Using HTTP Polling (WebSocket tidak support auth headers di browser)');

        cacheElements();
        initMusicSources();
        setText('serverAddress', CONFIG.server.host);
        setText('updateInterval', `${CONFIG.updateInterval / 1000}s`);

        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleRefresh();
            });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !state.pollInterval) startPolling();
        });
        window.addEventListener('online', () => { state.failCount = 0; startPolling(); });
        window.addEventListener('offline', () => { updateStatus('offline'); stopPolling(); });

        updateStatus('connecting');
        updateConnectionMode('connecting');

        const available = await checkServer();
        if (available) {
            showToast('Connected to NodeLink!', 'success');
            startPolling();
        } else {
            updateStatus('offline');
            updateConnectionMode('offline');
            showToast('Server not reachable. Check tunnel URL.', 'error');
            
            // Auto retry every 30s
            setInterval(async () => {
                if (!state.isConnected) {
                    const ok = await checkServer();
                    if (ok) { showToast('Reconnected!', 'success'); startPolling(); }
                }
            }, 30000);
        }

        console.log('✅ Ready!');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.AkiraStatus = { state, CONFIG, URLS, refresh: handleRefresh, fetchStats, checkServer };
})();
