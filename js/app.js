/**
 * NodeLink Status Monitor
 * Real-time WebSocket connection to Akira Lavalink
 */

class NodeLinkMonitor {
    constructor() {
        this.wsUrl = 'ws://212.132.120.102:12115/v4/websocket';
        this.cloudflareUrl = 'https://circulation-grocery-essay-gotten.trycloudflare.com';
        this.password = 'AkiraMusic';
        this.userId = 'test';
        this.clientName = 'github-status';
        
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.pingInterval = null;
        this.lastPingTime = null;
        this.statsUpdateInterval = 30000;
        
        // Music sources dengan mapping ke file icon PNG
        this.musicSources = [
            { name: 'YouTube', icon: 'youtube.png' },
            { name: 'YouTube Music', icon: 'youtubemusic.png' },
            { name: 'SoundCloud', icon: 'soundcloud.png' },
            { name: 'Unified', icon: 'unified.png' },
            { name: 'Spotify', icon: 'spotify.png' },
            { name: 'Apple Music', icon: 'applemusic.png' },
            { name: 'Deezer', icon: 'deezer.png' },
            { name: 'Tidal', icon: 'tidal.png' },
            { name: 'Bandcamp', icon: 'bandcamp.png' },
            { name: 'Audiomack', icon: 'audiomack.png' },
            { name: 'Gaana', icon: 'gaana.png' },
            { name: 'JioSaavn', icon: 'jiosaavn.png' },
            { name: 'Last.fm', icon: 'lastfm.png' },
            { name: 'Pandora', icon: 'pandora.png' },
            { name: 'VK Music', icon: 'vkmusic.png' },
            { name: 'Mixcloud', icon: 'mixcloud.png' },
            { name: 'NicoVideo', icon: 'nicovideo.png' },
            { name: 'Bilibili', icon: 'bilibili.png' },
            { name: 'Shazam', icon: 'shazam.png' },
            { name: 'Eternal Box', icon: 'eternalbox.png' },
            { name: 'Songlink', icon: 'songlink.png' },
            { name: 'Qobuz', icon: 'qobuz.png' },
            { name: 'Yandex Music', icon: 'yandexmusic.png' },
            { name: 'Audius', icon: 'audius.png' },
            { name: 'Amazon Music', icon: 'amazonmusic.png' },
            { name: 'Anghami', icon: 'anghami.png' },
            { name: 'Bluesky', icon: 'bluesky.png' },
            { name: 'Letras.mus.br', icon: 'letras.png' },
            { name: 'Piper TTS', icon: 'pipertts.png' },
            { name: 'Google TTS', icon: 'googletts.png' },
            { name: 'Flowery TTS', icon: 'flowerytts.png' }
        ];
        
        this.init();
    }
    
    init() {
        this.renderMusicSources();
        this.checkServerStatus();
        this.connect();
        
        // Periodic server status check via Cloudflare
        setInterval(() => this.checkServerStatus(), 30000);
    }
    
    async checkServerStatus() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(this.cloudflareUrl, {
                method: 'GET',
                headers: {
                    'Authorization': this.password
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok || response.status === 401) {
                console.log('Server is reachable via Cloudflare tunnel');
            }
        } catch (error) {
            console.log('Cloudflare tunnel check failed:', error.message);
        }
    }
    
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }
        
        console.log('Attempting to connect to NodeLink...');
        
        try {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = (event) => this.handleClose(event);
            this.ws.onerror = (error) => this.handleError(error);
            
        } catch (error) {
            console.error('WebSocket creation error:', error);
            this.handleError(error);
        }
    }
    
    handleOpen() {
        console.log('WebSocket connected!');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        this.updateStatus(true);
        this.startPingInterval();
        
        this.sendMessage({
            op: 'identify',
            d: {
                authorization: this.password,
                userId: this.userId,
                clientName: this.clientName
            }
        });
    }
    
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('Received:', data);
            
            switch (data.op) {
                case 'stats':
                    this.updateStats(data);
                    break;
                case 'ready':
                    console.log('NodeLink ready!', data);
                    break;
                case 'playerUpdate':
                    break;
                case 'event':
                    this.handleEvent(data);
                    break;
                case 'pong':
                    this.handlePong();
                    break;
                default:
                    console.log('Unknown op:', data.op);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }
    
    handleEvent(data) {
        if (data.type === 'StatsEvent') {
            this.updateStats(data);
        }
    }
    
    handleClose(event) {
        console.log('WebSocket closed:', event.code, event.reason);
        this.isConnected = false;
        this.updateStatus(false);
        this.stopPingInterval();
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
            console.log('Max reconnect attempts reached');
        }
    }
    
    handleError(error) {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.updateStatus(false);
    }
    
    sendMessage(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    startPingInterval() {
        this.pingInterval = setInterval(() => {
            this.lastPingTime = Date.now();
            this.sendMessage({ op: 'ping' });
        }, 30000);
        
        this.lastPingTime = Date.now();
        this.sendMessage({ op: 'ping' });
    }
    
    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
    
    handlePong() {
        if (this.lastPingTime) {
            const ping = Date.now() - this.lastPingTime;
            this.updatePing(ping);
        }
    }
    
    updateStatus(isOnline) {
        const badge = document.getElementById('statusBadge');
        const body = document.body;
        
        if (isOnline) {
            badge.classList.remove('offline');
            badge.classList.add('online');
            badge.querySelector('.status-text').textContent = 'Online';
            body.classList.remove('offline');
        } else {
            badge.classList.remove('online');
            badge.classList.add('offline');
            badge.querySelector('.status-text').textContent = 'Offline';
            body.classList.add('offline');
            this.resetStats();
        }
    }
    
    updatePing(ping) {
        const pingElement = document.getElementById('pingValue');
        this.animateValue(pingElement, parseInt(pingElement.textContent) || 0, ping, 500);
        
        const waves = document.querySelectorAll('.ping-wave .wave');
        waves.forEach(wave => {
            const speed = Math.max(0.3, Math.min(2, ping / 100));
            wave.style.animationDuration = `${speed}s`;
        });
    }
    
    updateStats(data) {
        if (data.players !== undefined) {
            const totalPlayers = document.getElementById('totalPlayers');
            this.animateValue(totalPlayers, parseInt(totalPlayers.textContent) || 0, data.players, 500);
        }
        
        if (data.playingPlayers !== undefined) {
            const playingPlayers = document.getElementById('playingPlayers');
            this.animateValue(playingPlayers, parseInt(playingPlayers.textContent) || 0, data.playingPlayers, 500);
        }
        
        if (data.uptime !== undefined) {
            this.updateUptime(data.uptime);
        }
        
        if (data.memory) {
            this.updateMemory(data.memory);
        }
        
        if (data.cpu) {
            this.updateCPU(data.cpu);
        }
        
        if (data.frameStats) {
            this.updateFrameStats(data.frameStats);
        }
    }
    
    updateUptime(uptimeMs) {
        const hours = Math.floor(uptimeMs / 3600000);
        const minutes = Math.floor((uptimeMs % 3600000) / 60000);
        const seconds = Math.floor((uptimeMs % 60000) / 1000);
        
        const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('uptimeValue').textContent = formatted;
        
        const maxUptime = 30 * 24 * 60 * 60 * 1000;
        const percentage = Math.min((uptimeMs / maxUptime) * 100, 100);
        document.getElementById('uptimeFill').style.width = `${percentage}%`;
    }
    
    updateMemory(memory) {
        const formatBytes = (bytes) => {
            if (bytes >= 1073741824) {
                return (bytes / 1073741824).toFixed(2) + ' GB';
            }
            return (bytes / 1048576).toFixed(2) + ' MB';
        };
        
        document.getElementById('memUsed').textContent = formatBytes(memory.used);
        document.getElementById('memFree').textContent = formatBytes(memory.free);
        document.getElementById('memAllocated').textContent = formatBytes(memory.allocated);
        document.getElementById('memReservable').textContent = formatBytes(memory.reservable);
        
        const usedPercent = (memory.used / memory.allocated) * 100;
        const batteryFill = document.getElementById('memoryBatteryFill');
        const batteryPercentage = document.getElementById('memoryPercentage');
        
        batteryFill.style.height = `${usedPercent}%`;
        batteryPercentage.textContent = `${Math.round(usedPercent)}%`;
        
        if (usedPercent > 80) {
            batteryFill.style.background = 'linear-gradient(135deg, #EF4444, #F59E0B)';
        } else if (usedPercent > 60) {
            batteryFill.style.background = 'linear-gradient(135deg, #F59E0B, #10B981)';
        } else {
            batteryFill.style.background = 'var(--gradient-success)';
        }
    }
    
    updateCPU(cpu) {
        document.getElementById('cpuCores').textContent = `${cpu.cores} cores`;
        
        const systemLoad = (cpu.systemLoad * 100).toFixed(1);
        document.getElementById('systemLoadValue').textContent = `${systemLoad}%`;
        document.getElementById('systemLoadBar').style.width = `${Math.min(systemLoad, 100)}%`;
        
        const processLoad = (cpu.lavalinkLoad * 100).toFixed(1);
        document.getElementById('processLoadValue').textContent = `${processLoad}%`;
        document.getElementById('processLoadBar').style.width = `${Math.min(processLoad, 100)}%`;
    }
    
    updateFrameStats(frameStats) {
        const elements = {
            frameSent: frameStats.sent,
            frameNulled: frameStats.nulled,
            frameDeficit: frameStats.deficit
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value !== undefined) {
                this.animateValue(element, parseInt(element.textContent) || 0, value, 500);
            }
        });
        
        if (frameStats.sent !== undefined && frameStats.deficit !== undefined) {
            const expected = frameStats.sent + frameStats.deficit;
            const expectedElement = document.getElementById('frameExpected');
            this.animateValue(expectedElement, parseInt(expectedElement.textContent) || 0, expected, 500);
        }
    }
    
    resetStats() {
        const elements = [
            'pingValue', 'uptimeValue', 'totalPlayers', 'playingPlayers',
            'memUsed', 'memFree', 'memAllocated', 'memReservable',
            'systemLoadValue', 'processLoadValue', 'cpuCores',
            'frameSent', 'frameNulled', 'frameDeficit', 'frameExpected'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'uptimeValue') {
                    element.textContent = '--:--:--';
                } else if (id === 'cpuCores') {
                    element.textContent = '-- cores';
                } else if (id.startsWith('mem')) {
                    element.textContent = '-- MB';
                } else if (id.includes('Load')) {
                    element.textContent = '--%';
                } else {
                    element.textContent = '--';
                }
            }
        });
        
        document.getElementById('systemLoadBar').style.width = '0%';
        document.getElementById('processLoadBar').style.width = '0%';
        document.getElementById('uptimeFill').style.width = '0%';
        document.getElementById('memoryBatteryFill').style.height = '0%';
        document.getElementById('memoryPercentage').textContent = '--%';
    }
    
    animateValue(element, start, end, duration) {
        if (!element || isNaN(start) || isNaN(end)) return;
        
        const startTime = performance.now();
        const diff = end - start;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            
            const current = Math.round(start + diff * easeOutQuart);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    renderMusicSources() {
        const grid = document.getElementById('sourcesGrid');
        
        grid.innerHTML = this.musicSources.map(source => `
            <div class="source-item">
                <img 
                    src="assets/icons/${source.icon}" 
                    alt="${source.name}" 
                    class="source-icon"
                    onerror="this.src='assets/icons/default.png'"
                >
                <span class="source-name">${source.name}</span>
            </div>
        `).join('');
    }
}

// Demo Mode untuk testing
class DemoMode {
    constructor(monitor) {
        this.monitor = monitor;
        this.isDemo = false;
    }
    
    start() {
        if (this.isDemo) return;
        this.isDemo = true;
        
        console.log('Starting demo mode...');
        
        setTimeout(() => {
            this.monitor.updateStatus(true);
            this.simulateStats();
        }, 2000);
    }
    
    simulateStats() {
        const updateStats = () => {
            if (!this.isDemo) return;
            
            const stats = {
                players: Math.floor(Math.random() * 50) + 10,
                playingPlayers: Math.floor(Math.random() * 30) + 5,
                uptime: Date.now() - (Math.random() * 86400000),
                memory: {
                    free: Math.floor(Math.random() * 500000000) + 100000000,
                    used: Math.floor(Math.random() * 800000000) + 200000000,
                    allocated: 1073741824,
                    reservable: 2147483648
                },
                cpu: {
                    cores: 4,
                    systemLoad: Math.random() * 0.5,
                    lavalinkLoad: Math.random() * 0.3
                },
                frameStats: {
                    sent: Math.floor(Math.random() * 10000) + 5000,
                    nulled: Math.floor(Math.random() * 100),
                    deficit: Math.floor(Math.random() * 50)
                }
            };
            
            this.monitor.updateStats(stats);
            this.monitor.updatePing(Math.floor(Math.random() * 100) + 20);
            
            setTimeout(updateStats, 5000);
        };
        
        updateStats();
    }
    
    stop() {
        this.isDemo = false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const monitor = new NodeLinkMonitor();
    
    // Uncomment untuk demo mode:
    // const demo = new DemoMode(monitor);
    // setTimeout(() => demo.start(), 3000);
    
    window.nodelink = monitor;
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.nodelink) {
        if (!window.nodelink.isConnected) {
            window.nodelink.reconnectAttempts = 0;
            window.nodelink.connect();
        }
    }
});
