/* ==========================================================================
   IoT InFo Sensor Analytics Page View
   ========================================================================== */

import { store } from '../store.js';

let analyticsChart = null;
let selectedDeviceId = null;
let selectedMetric = 'default';
let chartLabels = [];
let chartDataPoints = [];
let maxPoints = 20;

// Peak stats memory
let sessionPeak = -9999;
let sessionMin = 9999;

export function renderAnalyticsPage(state) {
    const { devices } = state;
    const onlineDevices = devices.filter(d => d.status === 'online');

    // Default selection logic if none chosen yet
    if (!selectedDeviceId && onlineDevices.length > 0) {
        // Check if device query parameter was passed in url route (e.g., #analytics?device=dev-02)
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const queryDev = urlParams.get('device');
        
        if (queryDev && devices.find(d => d.id === queryDev)) {
            selectedDeviceId = queryDev;
        } else {
            selectedDeviceId = onlineDevices[0].id;
        }
    }

    const currentDevice = devices.find(d => d.id === selectedDeviceId) || null;

    // Build select devices options
    const deviceOptionsHtml = devices.map(d => {
        const isSelected = d.id === selectedDeviceId ? 'selected' : '';
        const statusText = d.status === 'online' ? 'Online' : 'Offline';
        return `<option value="${d.id}" ${isSelected}>${d.name} (${statusText})</option>`;
    }).join('');

    // Determine available metrics for dropdown based on selected device type
    let metricOptionsHtml = '';
    if (currentDevice) {
        if (currentDevice.type === 'temperature') {
            if (selectedMetric === 'default' || !['temp', 'humidity'].includes(selectedMetric)) selectedMetric = 'temp';
            metricOptionsHtml = `
                <option value="temp" ${selectedMetric === 'temp' ? 'selected' : ''}>Temperature (°C)</option>
                <option value="humidity" ${selectedMetric === 'humidity' ? 'selected' : ''}>Humidity (%)</option>
            `;
        } else if (currentDevice.type === 'gateway') {
            if (selectedMetric === 'default' || !['load', 'voltage'].includes(selectedMetric)) selectedMetric = 'load';
            metricOptionsHtml = `
                <option value="load" ${selectedMetric === 'load' ? 'selected' : ''}>Load Factor (%)</option>
                <option value="voltage" ${selectedMetric === 'voltage' ? 'selected' : ''}>Line Voltage (V)</option>
            `;
        } else if (currentDevice.type === 'vibration') {
            if (selectedMetric === 'default' || !['vibration', 'speed'].includes(selectedMetric)) selectedMetric = 'vibration';
            metricOptionsHtml = `
                <option value="vibration" ${selectedMetric === 'vibration' ? 'selected' : ''}>Vibration (g)</option>
                <option value="speed" ${selectedMetric === 'speed' ? 'selected' : ''}>Motor Speed (RPM)</option>
            `;
        } else if (currentDevice.type === 'pressure') {
            if (selectedMetric === 'default' || !['pressure', 'flowRate'].includes(selectedMetric)) selectedMetric = 'pressure';
            metricOptionsHtml = `
                <option value="pressure" ${selectedMetric === 'pressure' ? 'selected' : ''}>System Pressure (bar)</option>
                <option value="flowRate" ${selectedMetric === 'flowRate' ? 'selected' : ''}>Flow Rate (L/m)</option>
            `;
        }
    }

    // Quick telemetry preview widget
    let detailsPanelHtml = '';
    if (!currentDevice || currentDevice.status === 'offline') {
        detailsPanelHtml = `
            <div class="col-12">
                <div class="alert alert-danger bg-danger bg-opacity-10 text-danger border-danger border-opacity-25 py-3 text-center">
                    <i class="bi bi-slash-circle fs-4 d-block mb-2"></i>
                    <strong>Target device is offline or decommissioned.</strong> Please select an active online node to monitor sensor telemetry.
                </div>
            </div>
        `;
    } else {
        const curVal = currentDevice.metrics[selectedMetric] || 0;
        
        // Reset/init session peaks when selecting new combinations
        if (sessionPeak === -9999 || sessionMin === 9999) {
            sessionPeak = curVal;
            sessionMin = curVal;
        }

        let metricUnit = '';
        if (selectedMetric === 'temp') metricUnit = '°C';
        else if (selectedMetric === 'humidity' || selectedMetric === 'load') metricUnit = '%';
        else if (selectedMetric === 'voltage') metricUnit = 'V';
        else if (selectedMetric === 'vibration') metricUnit = 'g';
        else if (selectedMetric === 'speed') metricUnit = ' RPM';
        else if (selectedMetric === 'pressure') metricUnit = ' bar';
        else if (selectedMetric === 'flowRate') metricUnit = ' L/m';

        detailsPanelHtml = `
            <div class="col-md-4">
                <div class="glass-card p-3 text-center">
                    <div class="text-secondary small font-outfit text-uppercase tracking-wider">Current Value</div>
                    <h3 class="font-outfit fw-bold text-info mt-2 mb-1" id="an-current-val">${curVal}${metricUnit}</h3>
                    <small class="text-success" id="an-status-tick"><i class="bi bi-arrow-repeat spin-slow me-1"></i> Live Stream</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="glass-card p-3 text-center">
                    <div class="text-secondary small font-outfit text-uppercase tracking-wider">Peak Value (Session)</div>
                    <h3 class="font-outfit fw-bold text-danger mt-2 mb-1" id="an-peak-val">${sessionPeak}${metricUnit}</h3>
                    <small class="text-secondary">Maximum recorded</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="glass-card p-3 text-center">
                    <div class="text-secondary small font-outfit text-uppercase tracking-wider">Min Value (Session)</div>
                    <h3 class="font-outfit fw-bold text-success mt-2 mb-1" id="an-min-val">${sessionMin}${metricUnit}</h3>
                    <small class="text-secondary">Minimum recorded</small>
                </div>
            </div>
        `;
    }

    return `
        <div class="container-fluid p-4 page-fade-in">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 class="text-white font-outfit fw-bold mb-1">Sensor Telemetry Analytics</h4>
                    <p class="text-secondary mb-0">High-fidelity graphing and real-time analytical monitoring</p>
                </div>
            </div>

            <!-- Configuration Selector Panel -->
            <div class="glass-card p-3 mb-4">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label for="an-device-select" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Select Device Node</label>
                        <select id="an-device-select" class="form-select form-select-dark">
                            ${deviceOptionsHtml}
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label for="an-metric-select" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Select Telemetry Sensor</label>
                        <select id="an-metric-select" class="form-select form-select-dark" ${!currentDevice || currentDevice.status === 'offline' ? 'disabled' : ''}>
                            ${metricOptionsHtml}
                        </select>
                    </div>
                </div>
            </div>

            <!-- Quick Metrics Overview Row -->
            <div class="row g-4 mb-4" id="analytics-details-row">
                ${detailsPanelHtml}
            </div>

            <!-- Main Graphic Canvas -->
            <div class="row">
                <div class="col-12">
                    <div class="glass-card p-4" style="height: 450px;">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 class="text-white font-outfit fw-bold mb-0" id="chart-title-text">
                                    ${currentDevice ? `${currentDevice.name} - Telemetry Wave` : 'No Device Selected'}
                                </h5>
                                <small class="text-secondary">20-point historical telemetry tracking</small>
                            </div>
                            <button class="btn btn-outline-secondary btn-sm" id="reset-analytics-peak">Reset Peaks</button>
                        </div>
                        <div class="chart-container" style="height: 330px;">
                            <canvas id="analyticsMainChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function initAnalyticsPage(state) {
    bindAnalyticsEvents();
    setupAnalyticsChart(state);
}

export function updateAnalyticsPage(state) {
    const { devices } = state;
    const currentDevice = devices.find(d => d.id === selectedDeviceId) || null;

    if (!currentDevice || currentDevice.status === 'offline') {
        // If device goes offline, clear graph
        if (analyticsChart) {
            analyticsChart.data.labels = [];
            analyticsChart.data.datasets[0].data = [];
            analyticsChart.update();
        }
        
        // Refresh detail containers to display offline state
        const detailRow = document.getElementById('analytics-details-row');
        if (detailRow) {
            detailRow.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger bg-danger bg-opacity-10 text-danger border-danger border-opacity-25 py-3 text-center">
                        <i class="bi bi-slash-circle fs-4 d-block mb-2"></i>
                        <strong>Target device went offline.</strong> Telemetry stream disconnected.
                    </div>
                </div>
            `;
        }
        return;
    }

    const curVal = currentDevice.metrics[selectedMetric] || 0;

    // Fluctuate peaks
    if (curVal > sessionPeak) sessionPeak = curVal;
    if (curVal < sessionMin) sessionMin = curVal;

    let metricUnit = '';
    if (selectedMetric === 'temp') metricUnit = '°C';
    else if (selectedMetric === 'humidity' || selectedMetric === 'load') metricUnit = '%';
    else if (selectedMetric === 'voltage') metricUnit = 'V';
    else if (selectedMetric === 'vibration') metricUnit = 'g';
    else if (selectedMetric === 'speed') metricUnit = ' RPM';
    else if (selectedMetric === 'pressure') metricUnit = ' bar';
    else if (selectedMetric === 'flowRate') metricUnit = ' L/m';

    // Update details counters
    const curValEl = document.getElementById('an-current-val');
    const peakValEl = document.getElementById('an-peak-val');
    const minValEl = document.getElementById('an-min-val');
    if (curValEl) curValEl.innerText = `${curVal}${metricUnit}`;
    if (peakValEl) peakValEl.innerText = `${sessionPeak}${metricUnit}`;
    if (minValEl) minValEl.innerText = `${sessionMin}${metricUnit}`;

    // Update values array
    chartDataPoints.shift();
    chartDataPoints.push(curVal);
    chartLabels.shift();
    chartLabels.push(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    if (analyticsChart) {
        analyticsChart.data.labels = chartLabels;
        analyticsChart.data.datasets[0].data = chartDataPoints;
        analyticsChart.data.datasets[0].label = `${selectedMetric.toUpperCase()} readings`;
        analyticsChart.update('none');
    }
}

function bindAnalyticsEvents() {
    // Device select change
    const devSelect = document.getElementById('an-device-select');
    if (devSelect) {
        devSelect.addEventListener('change', (e) => {
            selectedDeviceId = e.target.value;
            selectedMetric = 'default';
            resetPeaks();
            // Trigger routing/re-rendering
            triggerUIRefresh();
        });
    }

    // Metric select change
    const metSelect = document.getElementById('an-metric-select');
    if (metSelect) {
        metSelect.addEventListener('change', (e) => {
            selectedMetric = e.target.value;
            resetPeaks();
            // Re-render
            triggerUIRefresh();
        });
    }

    // Reset peaks button
    const resetPeaksBtn = document.getElementById('reset-analytics-peak');
    if (resetPeaksBtn) {
        resetPeaksBtn.addEventListener('click', () => {
            resetPeaks();
            triggerUIRefresh();
        });
    }
}

function resetPeaks() {
    sessionPeak = -9999;
    sessionMin = 9999;
    chartLabels = [];
    chartDataPoints = [];
}

function setupAnalyticsChart(state) {
    const ctx = document.getElementById('analyticsMainChart');
    if (!ctx) return;

    const currentDevice = state.devices.find(d => d.id === selectedDeviceId) || null;
    if (!currentDevice || currentDevice.status === 'offline') return;

    // Seed mock telemetry buffer data points if empty
    if (chartLabels.length === 0) {
        const initialVal = currentDevice.metrics[selectedMetric] || 0;
        for (let i = 0; i < maxPoints; i++) {
            const timeVal = new Date(Date.now() - (maxPoints - i) * 3000);
            chartLabels.push(timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            
            // Generate some random fluctuation centered around initial telemetry val
            let drift = (Math.random() - 0.5) * 4;
            if (selectedMetric === 'vibration') drift = (Math.random() - 0.5) * 0.4;
            chartDataPoints.push(parseFloat(Math.max(0, initialVal + drift).toFixed(1)));
        }
    }

    if (analyticsChart) analyticsChart.destroy();
    
    // Choose neon glow color based on metric
    let lineColor = '#00e5ff'; // cyan
    let gradientStart = 'rgba(0, 229, 255, 0.2)';
    if (selectedMetric === 'temp' || selectedMetric === 'vibration') {
        lineColor = '#ff1744'; // red
        gradientStart = 'rgba(255, 23, 68, 0.2)';
    } else if (selectedMetric === 'load' || selectedMetric === 'pressure') {
        lineColor = '#ffea00'; // yellow
        gradientStart = 'rgba(255, 234, 0, 0.15)';
    }

    analyticsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: `${selectedMetric.toUpperCase()} readings`,
                data: chartDataPoints,
                borderColor: lineColor,
                backgroundColor: gradientStart,
                borderWidth: 2,
                pointRadius: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#151c2c',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleColor: '#8a99ad',
                    bodyColor: '#ffffff'
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.02)' },
                    ticks: { color: '#8a99ad', font: { size: 9 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.02)' },
                    ticks: { color: '#8a99ad', font: { size: 9 } }
                }
            }
        }
    });
}

function triggerUIRefresh() {
    window.dispatchEvent(new CustomEvent('iotinfo-route-changed'));
}
