/* ==========================================================================
   IoT InFo Dashboard Page View
   ========================================================================== */

import { store } from '../store.js';

let telemetryChart = null;
let distributionChart = null;
let telemetryDataPoints = Array(12).fill(0);
let telemetryLabels = Array(12).fill('');

export function renderDashboardPage(state) {
    const { stats, devices, alerts } = state;
    
    // Quick device list (first 5 devices) for the table
    const quickDevicesHtml = devices.slice(0, 5).map(dev => {
        let statusBadge = '';
        if (dev.status === 'online') {
            statusBadge = `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 d-inline-flex align-items-center gap-1.5"><span class="glow-dot online"></span> Online</span>`;
        } else if (dev.status === 'offline') {
            statusBadge = `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 d-inline-flex align-items-center gap-1.5"><span class="glow-dot offline"></span> Offline</span>`;
        } else {
            statusBadge = `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 d-inline-flex align-items-center gap-1.5"><span class="glow-dot maintenance"></span> Maintenance</span>`;
        }

        let primaryMetric = 'N/A';
        if (dev.status === 'online') {
            if (dev.metrics.temp !== undefined) primaryMetric = `${dev.metrics.temp}°C`;
            else if (dev.metrics.load !== undefined) primaryMetric = `${dev.metrics.load}%`;
            else if (dev.metrics.pressure !== undefined) primaryMetric = `${dev.metrics.pressure} bar`;
        }

        const isChecked = dev.status === 'online' ? 'checked' : '';

        return `
            <tr data-device-id="${dev.id}">
                <td class="fw-semibold text-white">${dev.name}</td>
                <td class="text-secondary small">${dev.location}</td>
                <td>${statusBadge}</td>
                <td class="text-info font-outfit fw-bold">${primaryMetric}</td>
                <td>
                    <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input dev-power-switch" type="checkbox" data-id="${dev.id}" ${isChecked} style="cursor: pointer;">
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Recent 4 Alerts list HTML
    const recentAlerts = alerts.filter(a => !a.acknowledged).slice(0, 4);
    let alertsHtml = '';
    
    if (recentAlerts.length === 0) {
        alertsHtml = `
            <div class="text-center py-5 text-secondary">
                <i class="bi bi-shield-check fs-2 text-success mb-2"></i>
                <div class="small">System secured. No active critical alerts.</div>
            </div>
        `;
    } else {
        alertsHtml = recentAlerts.map(alert => {
            let severityBadge = 'bg-info';
            if (alert.severity === 'critical') severityBadge = 'bg-danger';
            else if (alert.severity === 'warning') severityBadge = 'bg-warning text-dark';
            
            const timeStr = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="d-flex align-items-start gap-3 p-3 glass-card mb-2" style="background: rgba(255,255,255,0.015);">
                    <span class="badge ${severityBadge} font-outfit fw-bold text-uppercase" style="font-size: 0.65rem; width: 65px; text-align: center;">
                        ${alert.severity}
                    </span>
                    <div class="flex-grow-1 min-w-0">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="text-white small fw-bold mb-0 text-truncate">${alert.deviceName}</h6>
                            <span class="text-secondary" style="font-size: 0.7rem;">${timeStr}</span>
                        </div>
                        <p class="text-secondary mb-0 small text-truncate-custom" style="font-size: 0.75rem;">${alert.message}</p>
                    </div>
                    <button class="btn btn-outline-info btn-sm alert-quick-ack-btn px-2 py-0.5" data-id="${alert.id}" style="font-size: 0.7rem;">
                        Ack
                    </button>
                </div>
            `;
        }).join('');
    }

    return `
        <div class="container-fluid p-4 page-fade-in">
            <!-- Row 1: Overview Cards -->
            <div class="row g-4 mb-4">
                
                <!-- Total Devices Card -->
                <div class="col-sm-6 col-xl-3">
                    <div class="glass-card p-4 d-flex align-items-center justify-content-between">
                        <div>
                            <div class="text-secondary small font-outfit text-uppercase tracking-wider mb-1">Total Fleet Devices</div>
                            <h2 class="display-6 font-outfit fw-bold text-white mb-0" id="stat-total">${stats.total}</h2>
                        </div>
                        <div class="bg-info bg-opacity-10 p-3 rounded-3 text-info" style="box-shadow: 0 0 15px rgba(0, 229, 255, 0.1);">
                            <i class="bi bi-cpu fs-3"></i>
                        </div>
                    </div>
                </div>

                <!-- Online Devices Card -->
                <div class="col-sm-6 col-xl-3">
                    <div class="glass-card p-4 d-flex align-items-center justify-content-between">
                        <div>
                            <div class="text-secondary small font-outfit text-uppercase tracking-wider mb-1">Online Devices</div>
                            <h2 class="display-6 font-outfit fw-bold text-success mb-0" id="stat-online">${stats.online}</h2>
                        </div>
                        <div class="bg-success bg-opacity-10 p-3 rounded-3 text-success" style="box-shadow: 0 0 15px rgba(0, 230, 118, 0.1);">
                            <i class="bi bi-activity fs-3"></i>
                        </div>
                    </div>
                </div>

                <!-- Offline Devices Card -->
                <div class="col-sm-6 col-xl-3">
                    <div class="glass-card p-4 d-flex align-items-center justify-content-between">
                        <div>
                            <div class="text-secondary small font-outfit text-uppercase tracking-wider mb-1">Offline Devices</div>
                            <h2 class="display-6 font-outfit fw-bold text-danger mb-0" id="stat-offline">${stats.offline}</h2>
                        </div>
                        <div class="bg-danger bg-opacity-10 p-3 rounded-3 text-danger" style="box-shadow: 0 0 15px rgba(255, 23, 68, 0.1);">
                            <i class="bi bi-wifi-off fs-3"></i>
                        </div>
                    </div>
                </div>

                <!-- Active Alerts Card -->
                <div class="col-sm-6 col-xl-3">
                    <div class="glass-card p-4 d-flex align-items-center justify-content-between">
                        <div>
                            <div class="text-secondary small font-outfit text-uppercase tracking-wider mb-1">Active Alerts</div>
                            <h2 class="display-6 font-outfit fw-bold text-warning mb-0" id="stat-alerts">${stats.unackAlerts}</h2>
                        </div>
                        <div class="bg-warning bg-opacity-10 p-3 rounded-3 text-warning" style="box-shadow: 0 0 15px rgba(255, 234, 0, 0.1);">
                            <i class="bi bi-exclamation-triangle-fill fs-3"></i>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Row 2: Charts -->
            <div class="row g-4 mb-4">
                
                <!-- Line Chart: Real-time Telemetry -->
                <div class="col-lg-8">
                    <div class="glass-card p-4" style="height: 380px;">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h5 class="text-white font-outfit fw-bold mb-0">System Telemetry Stream</h5>
                                <small class="text-secondary">Fluctuation of average system temperature (°C)</small>
                            </div>
                            <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small font-outfit">
                                <span class="glow-dot online me-1"></span> SIMULATOR RUNNING
                            </span>
                        </div>
                        <div style="height: 270px; width: 100%;">
                            <canvas id="dashboardTelemetryChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Donut Chart: Device Status Distribution -->
                <div class="col-lg-4">
                    <div class="glass-card p-4" style="height: 380px;">
                        <h5 class="text-white font-outfit fw-bold mb-3">Device Status</h5>
                        <div class="d-flex align-items-center justify-content-center" style="height: 220px; position: relative;">
                            <canvas id="deviceDistributionChart"></canvas>
                        </div>
                        <div class="row text-center mt-3 small font-outfit">
                            <div class="col-4">
                                <div class="text-success fw-bold" id="dist-online">${stats.online}</div>
                                <div class="text-secondary">Online</div>
                            </div>
                            <div class="col-4">
                                <div class="text-danger fw-bold" id="dist-offline">${stats.offline}</div>
                                <div class="text-secondary">Offline</div>
                            </div>
                            <div class="col-4">
                                <div class="text-warning fw-bold" id="dist-maint">${stats.maintenance}</div>
                                <div class="text-secondary">Maint.</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Row 3: Recent Activity & Quick Controls -->
            <div class="row g-4">
                
                <!-- Quick Control Table -->
                <div class="col-xl-6">
                    <div class="glass-card p-4 h-100">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="text-white font-outfit fw-bold mb-0">Quick Fleet Controls</h5>
                            <a href="#device-mgmt" class="text-info font-outfit small text-decoration-none fw-medium">Manage all devices</a>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-dark-custom align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Primary Metric</th>
                                        <th>Power</th>
                                    </tr>
                                </thead>
                                <tbody id="dashboard-device-tbody">
                                    ${quickDevicesHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Recent Alerts Feed -->
                <div class="col-xl-6">
                    <div class="glass-card p-4 h-100">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="text-white font-outfit fw-bold mb-0">Active System Warnings</h5>
                            <a href="#alerts" class="text-info font-outfit small text-decoration-none fw-medium">All alert logs</a>
                        </div>
                        <div class="alerts-feed-container" id="dashboard-alerts-feed">
                            ${alertsHtml}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;
}

export function initDashboardPage(state) {
    bindDashboardEvents();
    setupCharts(state);
}

export function updateDashboardPage(state) {
    const { stats, devices, alerts } = state;
    
    // Update stats counters
    const t = document.getElementById('stat-total');
    const o = document.getElementById('stat-online');
    const f = document.getElementById('stat-offline');
    const a = document.getElementById('stat-alerts');
    if (t) t.innerText = stats.total;
    if (o) o.innerText = stats.online;
    if (f) f.innerText = stats.offline;
    if (a) a.innerText = stats.unackAlerts;

    // Update distribution text
    const doText = document.getElementById('dist-online');
    const dfText = document.getElementById('dist-offline');
    const dmText = document.getElementById('dist-maint');
    if (doText) doText.innerText = stats.online;
    if (dfText) dfText.innerText = stats.offline;
    if (dmText) dmText.innerText = stats.maintenance;

    // Refresh quick device table state (mainly checkboxes and live metrics)
    devices.slice(0, 5).forEach(dev => {
        const row = document.querySelector(`#dashboard-device-tbody tr[data-device-id="${dev.id}"]`);
        if (row) {
            // Update metric column (4th column, index 3)
            const metricTd = row.children[3];
            let primaryMetric = 'N/A';
            if (dev.status === 'online') {
                if (dev.metrics.temp !== undefined) primaryMetric = `${dev.metrics.temp}°C`;
                else if (dev.metrics.load !== undefined) primaryMetric = `${dev.metrics.load}%`;
                else if (dev.metrics.pressure !== undefined) primaryMetric = `${dev.metrics.pressure} bar`;
            }
            if (metricTd) metricTd.innerText = primaryMetric;

            // Update status badge
            const statusTd = row.children[2];
            if (statusTd) {
                let badgeClass = 'bg-success bg-opacity-10 text-success border-success';
                let dotClass = 'online';
                let label = 'Online';
                if (dev.status === 'offline') {
                    badgeClass = 'bg-danger bg-opacity-10 text-danger border-danger';
                    dotClass = 'offline';
                    label = 'Offline';
                } else if (dev.status === 'maintenance') {
                    badgeClass = 'bg-warning bg-opacity-10 text-warning border-warning';
                    dotClass = 'maintenance';
                    label = 'Maintenance';
                }
                statusTd.innerHTML = `<span class="badge ${badgeClass} border border-opacity-25 d-inline-flex align-items-center gap-1.5"><span class="glow-dot ${dotClass}"></span> ${label}</span>`;
            }

            // Update power checkbox
            const checkbox = row.querySelector('.dev-power-switch');
            if (checkbox) {
                checkbox.checked = dev.status === 'online';
            }
        }
    });

    // Update live telemetry data arrays
    const onlineTemps = devices.filter(d => d.status === 'online' && d.metrics.temp !== undefined).map(d => d.metrics.temp);
    const avgTemp = onlineTemps.length > 0 ? (onlineTemps.reduce((s, v) => s + v, 0) / onlineTemps.length).toFixed(1) : 22.0;
    
    // Shift telemetry
    telemetryDataPoints.shift();
    telemetryDataPoints.push(parseFloat(avgTemp));
    telemetryLabels.shift();
    telemetryLabels.push(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    // Update Telemetry Chart
    if (telemetryChart) {
        telemetryChart.data.labels = telemetryLabels;
        telemetryChart.data.datasets[0].data = telemetryDataPoints;
        telemetryChart.update('none'); // silent update
    }

    // Update Distribution Chart
    if (distributionChart) {
        distributionChart.data.datasets[0].data = [stats.online, stats.offline, stats.maintenance];
        distributionChart.update('none');
    }

    // Update alerts feed HTML (only updates if HTML structure matches)
    const alertFeed = document.getElementById('dashboard-alerts-feed');
    if (alertFeed) {
        const recentAlerts = alerts.filter(a => !a.acknowledged).slice(0, 4);
        if (recentAlerts.length === 0) {
            alertFeed.innerHTML = `
                <div class="text-center py-5 text-secondary">
                    <i class="bi bi-shield-check fs-2 text-success mb-2"></i>
                    <div class="small">System secured. No active critical alerts.</div>
                </div>
            `;
        } else {
            alertFeed.innerHTML = recentAlerts.map(alert => {
                let severityBadge = 'bg-info';
                if (alert.severity === 'critical') severityBadge = 'bg-danger';
                else if (alert.severity === 'warning') severityBadge = 'bg-warning text-dark';
                
                const timeStr = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return `
                    <div class="d-flex align-items-start gap-3 p-3 glass-card mb-2" style="background: rgba(255,255,255,0.015);">
                        <span class="badge ${severityBadge} font-outfit fw-bold text-uppercase" style="font-size: 0.65rem; width: 65px; text-align: center;">
                            ${alert.severity}
                        </span>
                        <div class="flex-grow-1 min-w-0">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <h6 class="text-white small fw-bold mb-0 text-truncate">${alert.deviceName}</h6>
                                <span class="text-secondary" style="font-size: 0.7rem;">${timeStr}</span>
                            </div>
                            <p class="text-secondary mb-0 small text-truncate-custom" style="font-size: 0.75rem;">${alert.message}</p>
                        </div>
                        <button class="btn btn-outline-info btn-sm alert-quick-ack-btn px-2 py-0.5" data-id="${alert.id}" style="font-size: 0.7rem;">
                            Ack
                        </button>
                    </div>
                `;
            }).join('');
            
            // Re-bind alert ack click handlers
            bindDashboardAlertClicks();
        }
    }
}

function bindDashboardEvents() {
    // Checkbox switches for device power
    document.querySelectorAll('.dev-power-switch').forEach(el => {
        el.addEventListener('change', (e) => {
            const id = e.target.getAttribute('data-id');
            store.toggleDevicePower(id);
        });
    });

    bindDashboardAlertClicks();
}

function bindDashboardAlertClicks() {
    document.querySelectorAll('.alert-quick-ack-btn').forEach(el => {
        el.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            store.dismissAlert(id);
        });
    });
}

function setupCharts(state) {
    const telemetryCtx = document.getElementById('dashboardTelemetryChart');
    const distributionCtx = document.getElementById('deviceDistributionChart');

    if (!telemetryCtx || !distributionCtx) return;

    // Seed mock dynamic telemetry sparkline labels
    if (telemetryLabels.every(l => l === '')) {
        for (let i = 0; i < 12; i++) {
            const timeVal = new Date(Date.now() - (12 - i) * 5000);
            telemetryLabels[i] = timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            // Seed a reasonable initial temp
            telemetryDataPoints[i] = parseFloat((18.5 + Math.random() * 6).toFixed(1));
        }
    }

    // Telemetry chart configuration
    if (telemetryChart) telemetryChart.destroy();
    telemetryChart = new Chart(telemetryCtx, {
        type: 'line',
        data: {
            labels: telemetryLabels,
            datasets: [{
                label: 'Avg Temperature (°C)',
                data: telemetryDataPoints,
                borderColor: '#00e5ff',
                backgroundColor: 'rgba(0, 229, 255, 0.05)',
                borderWidth: 2,
                pointRadius: 2,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#151c2c',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    titleColor: '#8a99ad',
                    bodyColor: '#ffffff',
                    titleFont: { family: 'Outfit' },
                    bodyFont: { family: 'Inter' }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#8a99ad', font: { size: 9 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#8a99ad', font: { size: 9 } }
                }
            }
        }
    });

    // Distribution donut chart
    if (distributionChart) distributionChart.destroy();
    distributionChart = new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Online', 'Offline', 'Maintenance'],
            datasets: [{
                data: [state.stats.online, state.stats.offline, state.stats.maintenance],
                backgroundColor: ['#00e676', '#ff1744', '#ffea00'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false }
            }
        }
    });
}
