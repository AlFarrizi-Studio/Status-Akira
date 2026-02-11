/**
 * Akira Status Page - JavaScript
 * Real-time Lavalink Server Status Monitor
 * 
 * @version 2.1.0
 * @author Akira
 */

(function() {
    'use strict';

    // ============================================
    // Configuration - GANTI DENGAN URL TUNNEL ANDA
    // ============================================
    const CONFIG = {
        server: {
            // Cloudflare Tunnel URL (TANPA https:// atau wss://)
            host: 'understand-nec-our-pushed.trycloudflare.com',
            password: 'AkiraMusic',
            secure: true // Cloudflare Tunnel = SELALU true
        },
        reconnect: {
            maxAttempts: 10,
            baseDelay: 2000,
            maxDelay: 30000
        },
        updateInterval: 5000,
        iconsPath: 'icons/'
    };

    // Build URLs - Cloudflare Tunnel SELALU secure (wss/https)
    const URLS = {
        websocket: `wss://${CONFIG.server.host}/v4/websocket`,
        stats: `https://${CONFIG.server.host}/v4/stats`,
        info: `https://${CONFIG.server.host}/v4/info`,
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
    // State Management
    // ============================================
    const state = {
        ws: null,
        isConnected: false,
        connectionMode: 'connecting',
        reconnectAttempts: 0,
        reconnectTimeout: null,
        httpPollInterval: null,
        lastPingTime: null,
        pingLatency: 0,
        uptimeMs: 0,
        uptimeInterval: null,
        startTime: Date.now(),
        lastStats: null,
        wsConnectStartTime: null
    };

    // ============================================
    // DOM Elements Cache
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
    // Utility Functions
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
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return {
            days: String(days).padStart(2, '0'),
            hours: String(hours).padStart(2, '0'),
            minutes: String(minutes).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0')
        };
    }

    function formatNumber(num) {
        if (num === undefined || num === null || isNaN(num)) return '--';
        return num.toLocaleString();
    }

    function setText(elementId, text) {
        if (elements[elementId]) {
            elements[elementId].textContent = text;
        }
    }

    function setStyle(elementId, property, value) {
        if (elements[elementId]) {
            elements[elementId].style[property] = value;
        }
    }

    function showToast(message, type = 'info', duration = 4000) {
        if (!elements.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
        `;

        elements.toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ============================================
    // UI Update Functions
    // ============================================

    function initMusicSources() {
        if (!elements.sourcesGrid) return;

        const fragment = document.createDocumentFragment();

        MUSIC_SOURCES.forEach((source, index) => {
            const item = document.createElement('div');
            item.className = 'source-item';
            item.setAttribute('data-source', source.name);
            item.style.animationDelay = `${0.02 * index}s`;

            item.innerHTML = `
                <div class="source-icon" style="background: ${source.color}15;">
                    <img 
                        src="${CONFIG.iconsPath}${source.icon}" 
                        alt="${source.name}"
                        class="source-icon-img"
                        loading="lazy"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    >
                    <span class="source-icon-fallback" style="display:none;">${source.fallback}</span>
                </div>
                <span class="source-name">${source.name}</span>
            `;

            fragment.appendChild(item);
        });

        elements.sourcesGrid.innerHTML = '';
        elements.sourcesGrid.appendChild(fragment);

        if (elements.sourcesCount) {
            elements.sourcesCount.textContent = `${MUSIC_SOURCES.length} Sources`;
        }
    }

    function updateStatus(status) {
        const statusClasses = ['online', 'offline', 'connecting'];
        const statusConfig = {
            online: { text: 'Operational' },
            offline: { text: 'Offline' },
            connecting: { text: 'Connecting...' }
        };

        [elements.connectionBar, elements.statusDot, elements.statusText].forEach(el => {
            if (el) {
                statusClasses.forEach(cls => el.classList.remove(cls));
                el.classList.add(status);
            }
        });

        setText('statusText', statusConfig[status]?.text || status);
    }

    function updateConnectionMode(mode) {
        state.connectionMode = mode;
        const modeTexts = {
            websocket: '🟢 WebSocket',
            'http-polling': '🔄 HTTP Poll',
            offline: '🔴 Offline',
            connecting: '🟡 Connecting'
        };
        setText('connectionModeText', modeTexts[mode] || mode);
    }

    function updatePing(ping) {
        if (!elements.pingValue) return;

        const pingNum = parseInt(ping) || 0;
        state.pingLatency = pingNum;
        setText('pingValue', pingNum);

        elements.pingValue.className = 'ping-value';
        
        let status = 'Good';
        let colorClass = 'good';
        
        if (pingNum < 50) {
            status = 'Excellent';
            colorClass = 'good';
        } else if (pingNum < 100) {
            status = 'Good';
            colorClass = 'good';
        } else if (pingNum < 200) {
            status = 'Fair';
            colorClass = 'medium';
        } else {
            status = 'Poor';
            colorClass = 'bad';
        }

        elements.pingValue.classList.add(colorClass);
        setText('pingStatus', status);

        if (elements.pingWave) {
            const colors = {
                good: '#10b981',
                medium: '#f59e0b',
                bad: '#ef4444'
            };
            const color = colors[colorClass];
            elements.pingWave.querySelectorAll('span').forEach(span => {
                span.style.background = color;
            });
        }
    }

    function updateUptimeDisplay() {
        const uptime = formatUptime(state.uptimeMs);
        setText('uptimeDays', uptime.days);
        setText('uptimeHours', uptime.hours);
        setText('uptimeMinutes', uptime.minutes);
        setText('uptimeSeconds', uptime.seconds);
        state.uptimeMs += 1000;
    }

    function resetStats() {
        const defaults = {
            pingValue: '--',
            pingStatus: '--',
            totalPlayers: '--',
            playingPlayersText: '-- playing',
            cpuCores: '-- Cores',
            systemLoadText: '--%',
            processLoadText: '--%',
            memoryUsageText: '-- / --',
            memoryUsed: '--',
            memoryFree: '--',
            memoryAllocated: '--',
            memoryReservable: '--',
            framesSent: '--',
            framesNulled: '--',
            framesDeficit: '--',
            framesExpected: '--',
            uptimeDays: '00',
            uptimeHours: '00',
            uptimeMinutes: '00',
            uptimeSeconds: '00'
        };

        Object.entries(defaults).forEach(([key, value]) => setText(key, value));

        ['playersProgress', 'systemLoadProgress', 'processLoadProgress', 'memoryProgress'].forEach(id => {
            setStyle(id, 'width', '0%');
        });

        if (state.uptimeInterval) {
            clearInterval(state.uptimeInterval);
            state.uptimeInterval = null;
        }
    }

    function updateStats(data) {
        if (!data) return;

        state.lastStats = data;

        if (data.players !== undefined) {
            setText('totalPlayers', formatNumber(data.players));
        }

        if (data.playingPlayers !== undefined) {
            setText('playingPlayersText', `${formatNumber(data.playingPlayers)} playing`);
            const percentage = data.players > 0 ? (data.playingPlayers / Math.max(data.players, 1)) * 100 : 0;
            setStyle('playersProgress', 'width', `${Math.min(percentage, 100)}%`);
        }

        if (data.uptime !== undefined) {
            state.uptimeMs = data.uptime;
            updateUptimeDisplay();

            if (!state.uptimeInterval) {
                state.uptimeInterval = setInterval(updateUptimeDisplay, 1000);
            }
        }

        if (data.memory) {
            const { used = 0, free = 0, allocated = 0, reservable = 0 } = data.memory;

            setText('memoryUsed', formatBytes(used));
            setText('memoryFree', formatBytes(free));
            setText('memoryAllocated', formatBytes(allocated));
            setText('memoryReservable', formatBytes(reservable));
            setText('memoryUsageText', `${formatBytes(used)} / ${formatBytes(allocated)}`);

            const memoryPercentage = allocated > 0 ? (used / allocated) * 100 : 0;
            setStyle('memoryProgress', 'width', `${Math.min(memoryPercentage, 100)}%`);
        }

        if (data.cpu) {
            setText('cpuCores', `${data.cpu.cores || '--'} Cores`);

            const systemLoad = (data.cpu.systemLoad || 0) * 100;
            const lavalinkLoad = (data.cpu.lavalinkLoad || data.cpu.processLoad || 0) * 100;

            setText('systemLoadText', `${systemLoad.toFixed(1)}%`);
            setStyle('systemLoadProgress', 'width', `${Math.min(systemLoad, 100)}%`);

            setText('processLoadText', `${lavalinkLoad.toFixed(1)}%`);
            setStyle('processLoadProgress', 'width', `${Math.min(lavalinkLoad, 100)}%`);
        }

        if (data.frameStats) {
            setText('framesSent', formatNumber(data.frameStats.sent || 0));
            setText('framesNulled', formatNumber(data.frameStats.nulled || 0));
            setText('framesDeficit', formatNumber(data.frameStats.deficit || 0));
            setText('framesExpected', formatNumber(data.frameStats.expected || 0));
        }

        setText('lastUpdate', new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }));
    }

    // ============================================
    // HTTP API Functions
    // ============================================

    async function fetchStats() {
        const startTime = performance.now();
        
        try {
            const response = await fetch(URLS.stats, {
                method: 'GET',
                headers: {
                    'Authorization': CONFIG.server.password,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const latency = Math.round(performance.now() - startTime);
            
            updatePing(latency);
            updateStats(data);
            
            return data;
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            throw error;
        }
    }

    async function checkServerAvailability() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(URLS.version, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Authorization': CONFIG.server.password
                }
            });

            clearTimeout(timeoutId);
            console.log('Server check response:', response.status);
            return response.ok;
        } catch (error) {
            console.warn('Server availability check failed:', error.message);
            return false;
        }
    }

    function startHttpPolling() {
        if (state.httpPollInterval) return;

        console.log('📡 Starting HTTP polling mode');
        updateStatus('online');
        updateConnectionMode('http-polling');

        fetchStats().catch(console.error);

        state.httpPollInterval = setInterval(async () => {
            try {
                await fetchStats();
                if (!state.isConnected) {
                    updateStatus('online');
                }
            } catch (error) {
                console.error('HTTP poll failed:', error);
                updateStatus('offline');
            }
        }, CONFIG.updateInterval);
    }

    function stopHttpPolling() {
        if (state.httpPollInterval) {
            clearInterval(state.httpPollInterval);
            state.httpPollInterval = null;
            console.log('Stopped HTTP polling');
        }
    }

    // ============================================
    // WebSocket Connection
    // ============================================

    function connectWebSocket() {
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
            state.reconnectTimeout = null;
        }

        if (state.ws) {
            state.ws.close();
            state.ws = null;
        }

        updateStatus('connecting');
        updateConnectionMode('connecting');
        
        console.log('🔌 Connecting to WebSocket:', URLS.websocket);
        state.wsConnectStartTime = performance.now();

        try {
            state.ws = new WebSocket(URLS.websocket);

            const connectTimeout = setTimeout(() => {
                if (state.ws && state.ws.readyState === WebSocket.CONNECTING) {
                    console.warn('⏰ WebSocket connection timeout');
                    state.ws.close();
                }
            }, 10000);

            state.ws.onopen = () => {
                clearTimeout(connectTimeout);
                handleWebSocketOpen();
            };
            
            state.ws.onmessage = handleWebSocketMessage;
            
            state.ws.onclose = (event) => {
                clearTimeout(connectTimeout);
                handleWebSocketClose(event);
            };
            
            state.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };

        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            handleConnectionFailure();
        }
    }

    function handleWebSocketOpen() {
        const connectTime = Math.round(performance.now() - state.wsConnectStartTime);
        console.log(`✅ WebSocket connected in ${connectTime}ms`);
        
        state.isConnected = true;
        state.reconnectAttempts = 0;
        state.lastPingTime = Date.now();
        
        updateStatus('online');
        updateConnectionMode('websocket');
        updatePing(connectTime);
        showToast('Connected to Lavalink via WebSocket!', 'success');

        stopHttpPolling();
    }

    function handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            const now = Date.now();
            if (state.lastPingTime && data.op === 'stats') {
                const instantPing = Math.min(now - state.lastPingTime, 1000);
                const smoothedPing = Math.round((state.pingLatency * 0.7) + (instantPing * 0.3));
                updatePing(smoothedPing);
            }
            state.lastPingTime = now;

            switch (data.op) {
                case 'stats':
                    updateStats(data);
                    break;
                case 'ready':
                    console.log('🎵 Lavalink ready:', data);
                    showToast(`Session: ${data.sessionId?.substring(0, 8)}...`, 'info');
                    break;
                case 'playerUpdate':
                case 'event':
                    console.debug('Event:', data.op);
                    break;
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }

    function handleWebSocketClose(event) {
        console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason || 'No reason'}`);
        state.isConnected = false;
        state.ws = null;

        if (state.reconnectAttempts < CONFIG.reconnect.maxAttempts) {
            attemptReconnect();
        } else {
            console.log('Max attempts reached, switching to HTTP polling');
            showToast('Switched to HTTP polling', 'warning');
            startHttpPolling();
        }
    }

    function handleConnectionFailure() {
        state.isConnected = false;
        
        if (state.reconnectAttempts < CONFIG.reconnect.maxAttempts) {
            attemptReconnect();
        } else {
            startHttpPolling();
        }
    }

    function attemptReconnect() {
        state.reconnectAttempts++;
        const delay = Math.min(
            CONFIG.reconnect.baseDelay * Math.pow(1.5, state.reconnectAttempts - 1),
            CONFIG.reconnect.maxDelay
        );

        console.log(`🔄 Reconnecting in ${(delay / 1000).toFixed(1)}s (${state.reconnectAttempts}/${CONFIG.reconnect.maxAttempts})`);
        updateStatus('connecting');
        updateConnectionMode('connecting');

        state.reconnectTimeout = setTimeout(connectWebSocket, delay);
    }

    // ============================================
    // Event Handlers
    // ============================================

    async function handleRefresh() {
        console.log('🔄 Manual refresh');
        
        state.reconnectAttempts = 0;
        stopHttpPolling();
        
        if (state.ws) {
            state.ws.close();
        }

        resetStats();
        showToast('Refreshing...', 'info');
        
        setTimeout(async () => {
            const available = await checkServerAvailability();
            
            if (available) {
                connectWebSocket();
                
                setTimeout(() => {
                    if (!state.isConnected && !state.httpPollInterval) {
                        startHttpPolling();
                    }
                }, 8000);
            } else {
                showToast('Server not reachable', 'error');
                updateStatus('offline');
                updateConnectionMode('offline');
            }
        }, 500);
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            if (!state.isConnected && !state.httpPollInterval) {
                state.reconnectAttempts = 0;
                connectWebSocket();
            }
        }
    }

    function handleOnline() {
        console.log('🌐 Network restored');
        showToast('Network restored', 'success');
        
        if (!state.isConnected && !state.httpPollInterval) {
            state.reconnectAttempts = 0;
            connectWebSocket();
        }
    }

    function handleOffline() {
        console.log('📵 Network lost');
        showToast('Network lost', 'error');
        updateStatus('offline');
        updateConnectionMode('offline');
        
        stopHttpPolling();
        if (state.ws) state.ws.close();
    }

    // ============================================
    // Initialization
    // ============================================

    async function init() {
        console.log('🎵 Akira Status Page v2.1.0');
        console.log('📍 Server:', CONFIG.server.host);
        console.log('🔗 WebSocket:', URLS.websocket);
        console.log('📊 Stats:', URLS.stats);

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

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check server and connect
        console.log('🔍 Checking server...');
        updateStatus('connecting');
        updateConnectionMode('connecting');

        const isAvailable = await checkServerAvailability();
        
        if (isAvailable) {
            console.log('✅ Server available!');
            showToast('Server online, connecting...', 'success');
            
            // Try WebSocket
            connectWebSocket();
            
            // Fallback to HTTP after 8s
            setTimeout(() => {
                if (!state.isConnected && !state.httpPollInterval) {
                    console.log('WebSocket timeout, using HTTP');
                    startHttpPolling();
                }
            }, 8000);
        } else {
            console.log('❌ Server not available');
            updateStatus('offline');
            updateConnectionMode('offline');
            showToast('Server not reachable', 'error');
            
            // Retry every 30s
            setInterval(async () => {
                if (!state.isConnected && !state.httpPollInterval) {
                    const available = await checkServerAvailability();
                    if (available) {
                        showToast('Server back online!', 'success');
                        connectWebSocket();
                    }
                }
            }, 30000);
        }

        console.log('✅ Initialized');
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Debug
    window.AkiraStatus = {
        state,
        CONFIG,
        URLS,
        refresh: handleRefresh,
        fetchStats,
        checkServer: checkServerAvailability,
        startHttp: startHttpPolling,
        stopHttp: stopHttpPolling,
        connectWs: connectWebSocket
    };

})();
