/* ==========================================================================
   IoT InFo Data Store & Live REST API Integration Engine
   ========================================================================== */

class IoTStore {
    constructor() {
        this.accessToken = localStorage.getItem('iotinfo_access_token') || null;
        this.refreshToken = localStorage.getItem('iotinfo_refresh_token') || null;
        this.currentUser = JSON.parse(localStorage.getItem('iotinfo_user')) || null;
        
        // Console profile config
        this.profile = JSON.parse(localStorage.getItem('iotinfo_profile')) || {
            username: 'Node Operator',
            email: 'operator@iotinfo.com',
            role: 'Administrator',
            apiKey: 'nx_live_51hG67FkL9zQA8p1x9V2K3cR',
            notifyEmail: true,
            notifySms: false,
            notifyPush: true,
            simSpeed: 'medium'
        };

        this.devices = [];
        this.alerts = [];
        this.listeners = [];
        this.simIntervalId = null;
        this.pollIntervalId = null;

        // If authenticated, load initial data and boot live routines
        if (this.accessToken) {
            this.loadInitialData();
            this.startPolling();
            this.startSimulation();
        }
    }

    // Pub/Sub pattern to notify UI of state updates
    subscribe(listener) {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        // Cache user details locally
        localStorage.setItem('iotinfo_access_token', this.accessToken || '');
        localStorage.setItem('iotinfo_refresh_token', this.refreshToken || '');
        localStorage.setItem('iotinfo_user', JSON.stringify(this.currentUser));
        localStorage.setItem('iotinfo_profile', JSON.stringify(this.profile));

        this.listeners.forEach(listener => listener(this.getState()));
    }

    getState() {
        return {
            devices: [...this.devices],
            alerts: [...this.alerts],
            currentUser: this.currentUser ? { ...this.currentUser } : null,
            profile: { ...this.profile },
            stats: this.getStats()
        };
    }

    getStats() {
        const total = this.devices.length;
        const online = this.devices.filter(d => d.status === 'online').length;
        const offline = this.devices.filter(d => d.status === 'offline').length;
        const maintenance = this.devices.filter(d => d.status === 'maintenance').length;
        const unackAlerts = this.alerts.filter(a => a.status === 'UNRESOLVED').length;

        return { total, online, offline, maintenance, unackAlerts };
    }

    // ----------------------------------------------------------------------
    // Secure DRF API Wrapper (with simplejwt automatic token refresh)
    // ----------------------------------------------------------------------
    async apiCall(endpoint, options = {}) {
        const headers = options.headers || {};
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        options.headers = headers;

        let response = await fetch(endpoint, options);

        // Access token expired, attempt transparent refresh flow
        if (response.status === 401 && this.refreshToken) {
            console.log("Access token expired. Refreshing token...");
            try {
                const refreshResponse = await fetch('/api/auth/token/refresh/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: this.refreshToken })
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    this.accessToken = data.access;
                    localStorage.setItem('iotinfo_access_token', this.accessToken);
                    
                    // Retry original request with new token
                    options.headers['Authorization'] = `Bearer ${this.accessToken}`;
                    response = await fetch(endpoint, options);
                } else {
                    // Refresh token invalid, clear session
                    console.warn("Refresh token invalid. Signing operator out.");
                    this.logout();
                    window.location.hash = '#login';
                }
            } catch (err) {
                console.error("Token refresh communication error:", err);
                this.logout();
                window.location.hash = '#login';
            }
        }

        return response;
    }

    // ----------------------------------------------------------------------
    // Data Sync & Loaders
    // ----------------------------------------------------------------------
    async loadInitialData() {
        try {
            await Promise.all([
                this.fetchDevices(),
                this.fetchAlerts()
            ]);
            this.notify();
        } catch (e) {
            console.error("Error loading console fleet data:", e);
        }
    }

    async fetchDevices() {
        if (!this.accessToken) return;
        try {
            const res = await this.apiCall('/api/devices/');
            if (res.ok) {
                const data = await res.json();
                this.devices = data.map(dev => {
                    // Seed initial/fallback metrics if device has no database sensor data yet
                    if (!dev.latest_metrics) {
                        dev.metrics = this.getDefaultMetrics(dev.type);
                    } else {
                        dev.metrics = dev.latest_metrics;
                    }
                    return dev;
                });
            }
        } catch (e) {
            console.error("Error fetching devices from REST API:", e);
        }
    }

    async fetchAlerts() {
        if (!this.accessToken) return;
        try {
            const res = await this.apiCall('/api/alerts/');
            if (res.ok) {
                const data = await res.json();
                this.alerts = data.map(alt => {
                    // Map backend Alert model values to match frontend expected fields
                    return {
                        id: alt.id,
                        deviceId: alt.device,
                        deviceName: alt.device_name,
                        severity: alt.alert_type.toLowerCase(), // warning, critical, info
                        message: alt.message,
                        timestamp: alt.timestamp,
                        acknowledged: alt.status !== 'UNRESOLVED'
                    };
                });
            }
        } catch (e) {
            console.error("Error fetching alerts from REST API:", e);
        }
    }

    getDefaultMetrics(type) {
        if (type === 'temperature') return { temp: 21.5, humidity: 42.0, battery_level: 95, air_quality: 15 };
        if (type === 'gateway') return { voltage: 240.2, load: 45.0, battery_level: 100, air_quality: 10 };
        if (type === 'vibration') return { speed: 1800, vibration: 0.9, battery_level: 88, air_quality: 20 };
        if (type === 'pressure') return { pressure: 4.2, flowRate: 22.0, battery_level: 92, air_quality: 12 };
        return { battery_level: 100, air_quality: 10 };
    }

    startPolling() {
        if (this.pollIntervalId) clearInterval(this.pollIntervalId);
        // Poll for fleet updates and system alerts every 5 seconds
        this.pollIntervalId = setInterval(() => {
            this.fetchDevices();
            this.fetchAlerts();
            this.notify();
        }, 5000);
    }

    stopPolling() {
        if (this.pollIntervalId) {
            clearInterval(this.pollIntervalId);
            this.pollIntervalId = null;
        }
    }

    // ----------------------------------------------------------------------
    // Simulation Engine (Client-side drifts -> REST API POST telemetry)
    // ----------------------------------------------------------------------
    startSimulation() {
        if (this.simIntervalId) clearInterval(this.simIntervalId);

        let intervalTime = 3000;
        if (this.profile.simSpeed === 'slow') intervalTime = 6000;
        if (this.profile.simSpeed === 'fast') intervalTime = 1000;

        this.simIntervalId = setInterval(() => {
            this.simulateDataTick();
        }, intervalTime);
    }

    stopSimulation() {
        if (this.simIntervalId) {
            clearInterval(this.simIntervalId);
            this.simIntervalId = null;
        }
    }

    async simulateDataTick() {
        if (!this.accessToken || this.devices.length === 0) return;

        let changed = false;

        for (let i = 0; i < this.devices.length; i++) {
            const device = this.devices[i];
            if (device.status !== 'online') continue;

            changed = true;
            const metrics = { ...device.metrics };

            // Perform float drift
            if (device.type === 'temperature') {
                metrics.temp = parseFloat((metrics.temp + (Math.random() - 0.5) * 0.8).toFixed(1));
                metrics.humidity = parseFloat(Math.min(100, Math.max(10, metrics.humidity + (Math.random() - 0.5) * 1.5)).toFixed(1));
            } else if (device.type === 'gateway') {
                metrics.voltage = parseFloat((metrics.voltage + (Math.random() - 0.5) * 1.2).toFixed(1));
                metrics.load = parseFloat(Math.min(100, Math.max(0, metrics.load + (Math.random() - 0.5) * 4.0)).toFixed(1));
            } else if (device.type === 'vibration') {
                metrics.vibration = parseFloat(Math.max(0.1, metrics.vibration + (Math.random() - 0.5) * 0.15).toFixed(2));
                metrics.speed = Math.round(Math.max(100, metrics.speed + (Math.random() - 0.5) * 50));
            } else if (device.type === 'pressure') {
                metrics.pressure = parseFloat(Math.max(0.5, metrics.pressure + (Math.random() - 0.5) * 0.2).toFixed(2));
                metrics.flowRate = parseFloat(Math.max(2, metrics.flowRate + (Math.random() - 0.5) * 0.8).toFixed(1));
            }

            // Drift battery level downwards very slowly
            metrics.battery_level = parseFloat(Math.max(0, metrics.battery_level - 0.05).toFixed(2));
            metrics.air_quality = parseFloat(Math.min(100, Math.max(1, metrics.air_quality + (Math.random() - 0.5) * 2)).toFixed(1));

            // Write modified metrics locally
            device.metrics = metrics;

            // Prepare database payload mapped to backend fields
            const payload = {
                device: device.id,
                temperature: device.type === 'temperature' ? metrics.temp : (device.type === 'vibration' ? metrics.vibration : null),
                humidity: device.type === 'temperature' ? metrics.humidity : (device.type === 'gateway' ? metrics.load : (device.type === 'vibration' ? metrics.speed : metrics.flowRate)),
                pressure: device.type === 'pressure' ? metrics.pressure : (device.type === 'gateway' ? metrics.voltage : null),
                battery_level: metrics.battery_level,
                air_quality: metrics.air_quality
            };

            // Post telemetry to backend REST API (unblocking background operation)
            this.apiCall('/api/sensor-data/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(e => console.error("Failed to post telemetry tick:", e));
        }

        // 5% chance to toggle device online/offline for alert/state verification
        if (Math.random() < 0.04) {
            const index = Math.floor(Math.random() * this.devices.length);
            const dev = this.devices[index];
            const newStatus = dev.status === 'online' ? 'offline' : 'online';
            
            this.apiCall(`/api/devices/${dev.id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            }).then(() => {
                this.fetchDevices();
                this.fetchAlerts();
            }).catch(e => console.error("Status check update failed:", e));
        }

        if (changed) {
            this.notify();
        }
    }

    // ----------------------------------------------------------------------
    // Operator Auth API Endpoints
    // ----------------------------------------------------------------------
    async login(email, password) {
        try {
            const res = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, password: password })
            });

            if (res.ok) {
                const data = await res.json();
                this.accessToken = data.access;
                this.refreshToken = data.refresh;
                
                // Set default operator info
                this.currentUser = { email: email, username: email.split('@')[0], role: 'Administrator' };
                this.profile.username = this.currentUser.username;
                this.profile.email = email;

                // Persist
                this.notify();

                // Boot live routines
                await this.loadInitialData();
                this.startPolling();
                this.startSimulation();

                return { success: true };
            } else {
                const errData = await res.json();
                return { success: false, message: errData.detail || 'Invalid username or password.' };
            }
        } catch (e) {
            console.error("API login request error:", e);
            return { success: false, message: 'Server communication error.' };
        }
    }

    async register(email, username, password) {
        try {
            const res = await fetch('/api/auth/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            if (res.ok) {
                // Log in newly registered user
                return await this.login(username, password);
            } else {
                const errData = await res.json();
                let errMsg = 'Registration failed.';
                if (errData.username) errMsg = errData.username[0];
                else if (errData.email) errMsg = errData.email[0];
                return { success: false, message: errMsg };
            }
        } catch (e) {
            console.error("API registration request error:", e);
            return { success: false, message: 'Server communication error.' };
        }
    }

    async logout() {
        if (this.refreshToken) {
            try {
                await fetch('/api/auth/logout/', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`
                    },
                    body: JSON.stringify({ refresh: this.refreshToken })
                });
            } catch (e) {
                console.error("Failed to revoke token in backend:", e);
            }
        }

        // Stop polling and simulation
        this.stopPolling();
        this.stopSimulation();

        // Clear local credentials
        this.accessToken = null;
        this.refreshToken = null;
        this.currentUser = null;
        this.devices = [];
        this.alerts = [];

        localStorage.removeItem('iotinfo_access_token');
        localStorage.removeItem('iotinfo_refresh_token');
        localStorage.removeItem('iotinfo_user');
        localStorage.removeItem('iotinfo_profile');

        this.notify();
    }

    // ----------------------------------------------------------------------
    // Hardware Fleet CRUD
    // ----------------------------------------------------------------------
    async toggleDevicePower(id) {
        const device = this.devices.find(d => d.id === id);
        if (!device) return;

        const newStatus = device.status === 'online' ? 'offline' : 'online';
        try {
            const res = await this.apiCall(`/api/devices/${id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                await Promise.all([this.fetchDevices(), this.fetchAlerts()]);
                this.notify();
            }
        } catch (e) {
            console.error("Toggle device power failed:", e);
        }
    }

    async addDevice(deviceData) {
        const type = deviceData.type || 'temperature';
        const serial = `SN-${type.toUpperCase().slice(0,4)}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const payload = {
            name: deviceData.name || 'Generic Device',
            type: type,
            serial_number: serial,
            location: deviceData.location || 'Building Floor',
            status: 'online'
        };

        try {
            const res = await this.apiCall('/api/devices/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await Promise.all([this.fetchDevices(), this.fetchAlerts()]);
                this.notify();
                return { success: true };
            }
        } catch (e) {
            console.error("Device registration request failed:", e);
        }
        return { success: false };
    }

    async deleteDevice(id) {
        try {
            const res = await this.apiCall(`/api/devices/${id}/`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await Promise.all([this.fetchDevices(), this.fetchAlerts()]);
                this.notify();
            }
        } catch (e) {
            console.error("Device decommissioning failed:", e);
        }
    }

    // ----------------------------------------------------------------------
    // Alerts Ack Logic
    // ----------------------------------------------------------------------
    async dismissAlert(id) {
        try {
            const res = await this.apiCall(`/api/alerts/${id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ACKNOWLEDGED' })
            });

            if (res.ok) {
                await this.fetchAlerts();
                this.notify();
            }
        } catch (e) {
            console.error("Alert acknowledgment failed:", e);
        }
    }

    async clearAllAlerts() {
        const unresolvedAlerts = this.alerts.filter(a => !a.acknowledged);
        try {
            await Promise.all(unresolvedAlerts.map(alert => {
                return this.apiCall(`/api/alerts/${alert.id}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'ACKNOWLEDGED' })
                });
            }));
            await this.fetchAlerts();
            this.notify();
        } catch (e) {
            console.error("Batch clear alerts failed:", e);
        }
    }

    // ----------------------------------------------------------------------
    // Profile settings
    // ----------------------------------------------------------------------
    updateProfile(data) {
        this.profile = {
            ...this.profile,
            ...data
        };
        // Restart simulator if simSpeed changed
        this.startSimulation();
        this.notify();
    }

    generateNewApiKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = 'nx_live_';
        for (let i = 0; i < 24; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.profile.apiKey = key;
        this.notify();
        return key;
    }
}

// Instantiate and export singleton instance
export const store = new IoTStore();
