/* ==========================================================================
   IoT InFo Device Management Page View
   ========================================================================== */

import { store } from '../store.js';

let searchFilter = '';
let statusFilter = 'all';
let typeFilter = 'all';

export function renderDeviceMgmtPage(state) {
    const { devices } = state;

    // Filter devices based on local page filters
    const filteredDevices = devices.filter(dev => {
        const matchesSearch = dev.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                             dev.location.toLowerCase().includes(searchFilter.toLowerCase());
        const matchesStatus = statusFilter === 'all' || dev.status === statusFilter;
        const matchesType = typeFilter === 'all' || dev.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const deviceCardsHtml = filteredDevices.map(dev => {
        let statusBadge = '';
        let dotClass = 'online';
        if (dev.status === 'online') {
            statusBadge = `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 py-1 px-2"><span class="glow-dot online me-1"></span> ONLINE</span>`;
            dotClass = 'online';
        } else if (dev.status === 'offline') {
            statusBadge = `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 py-1 px-2"><span class="glow-dot offline me-1"></span> OFFLINE</span>`;
            dotClass = 'offline';
        } else {
            statusBadge = `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 py-1 px-2"><span class="glow-dot maintenance me-1"></span> MAINTENANCE</span>`;
            dotClass = 'maintenance';
        }

        // Determine icon based on device type
        let deviceIcon = 'bi-cpu-fill';
        if (dev.type === 'temperature') deviceIcon = 'bi-thermometer-half';
        else if (dev.type === 'gateway') deviceIcon = 'bi-router-fill';
        else if (dev.type === 'vibration') deviceIcon = 'bi-activity';
        else if (dev.type === 'pressure') deviceIcon = 'bi-speedometer';

        // Render type-specific metrics in grid format
        let metricsHtml = '';
        if (dev.status === 'offline') {
            metricsHtml = `
                <div class="col-12 py-3 text-center text-secondary small">
                    <i class="bi bi-slash-circle me-1"></i> Device offline. No telemetry.
                </div>
            `;
        } else {
            if (dev.type === 'temperature') {
                metricsHtml = `
                    <div class="col-6 mb-2">
                        <div class="text-secondary" style="font-size: 0.7rem;">Temperature</div>
                        <div class="fw-bold text-info font-outfit dev-metric-temp">${dev.metrics.temp}°C</div>
                    </div>
                    <div class="col-6 mb-2">
                        <div class="text-secondary" style="font-size: 0.7rem;">Humidity</div>
                        <div class="fw-bold text-light font-outfit dev-metric-humidity">${dev.metrics.humidity}%</div>
                    </div>
                `;
            } else if (dev.type === 'gateway') {
                metricsHtml = `
                    <div class="col-6 mb-2">
                        <div class="text-secondary" style="font-size: 0.7rem;">Load Factor</div>
                        <div class="fw-bold text-warning font-outfit dev-metric-load">${dev.metrics.load}%</div>
                    </div>
                    <div class="col-6 mb-2">
                        <div class="text-secondary" style="font-size: 0.7rem;">Line Voltage</div>
                        <div class="fw-bold text-light font-outfit dev-metric-voltage">${dev.metrics.voltage}V</div>
                    </div>
                `;
            } else if (dev.type === 'vibration') {
                metricsHtml = `
                    <div class="col-6 mb-2">
                        <div class="text-secondary" style="font-size: 0.7rem;">Vibration</div>
                        <div class="fw-bold text-danger font-outfit dev-metric-vibration">${dev.metrics.vibration}g</div>
                    </div>
                    <div class="col-6 mb-2">
                        <div class="text-secondary" style="font-size: 0.7rem;">Motor Speed</div>
                        <div class="fw-bold text-light font-outfit dev-metric-speed">${dev.metrics.speed} RPM</div>
                    </div>
                `;
            } else if (dev.type === 'pressure') {
                metricsHtml = `
                    <div class="col-6 mb-2">
                        <div class="text-secondary" style="font-size: 0.7rem;">Pressure</div>
                        <div class="fw-bold text-info font-outfit dev-metric-pressure">${dev.metrics.pressure} bar</div>
                    </div>
                    <div class="col-6 mb-2">
                        <div class="text-secondary" style="font-size: 0.7rem;">Flow Rate</div>
                        <div class="fw-bold text-light font-outfit dev-metric-flowRate">${dev.metrics.flowRate} L/m</div>
                    </div>
                `;
            }
        }

        const isChecked = dev.status === 'online' ? 'checked' : '';

        return `
            <div class="col-sm-6 col-xl-4 device-card-outer" data-id="${dev.id}">
                <div class="glass-card p-4 h-100 d-flex flex-column">
                    
                    <!-- Card Top Header -->
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="d-flex align-items-center gap-2.5">
                            <div class="bg-info bg-opacity-10 p-2 rounded-3 text-info">
                                <i class="bi ${deviceIcon} fs-4"></i>
                            </div>
                            <div>
                                <h5 class="text-white font-outfit fw-bold mb-0" style="font-size: 0.95rem;">${dev.name}</h5>
                                <small class="text-secondary" style="font-size: 0.75rem;">${dev.location}</small>
                            </div>
                        </div>
                        ${statusBadge}
                    </div>

                    <!-- Card Live Telemetry Stats -->
                    <div class="row g-2 py-3 border-top border-bottom my-auto" style="border-color: rgba(255, 255, 255, 0.05) !important;">
                        ${metricsHtml}
                    </div>

                    <!-- Card Action Footer -->
                    <div class="pt-3 d-flex justify-content-between align-items-center mt-3">
                        <div class="d-flex align-items-center gap-2">
                            <div class="form-check form-switch p-0 m-0 d-flex align-items-center">
                                <input class="form-check-input dev-card-power-switch ms-0" type="checkbox" data-id="${dev.id}" ${isChecked} style="cursor: pointer; width: 2.2em; height: 1.1em;">
                                <label class="text-secondary small font-outfit ms-1.5" style="font-size: 0.75rem;">Power</label>
                            </div>
                        </div>
                        
                        <div class="d-flex gap-2">
                            <a href="#analytics?device=${dev.id}" class="btn btn-outline-info btn-sm px-2.5 py-1" style="font-size: 0.75rem;">
                                <i class="bi bi-graph-up"></i>
                            </a>
                            <button class="btn btn-outline-danger btn-sm px-2.5 py-1 dev-delete-btn" data-id="${dev.id}" style="font-size: 0.75rem;">
                                <i class="bi bi-trash3"></i>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }).join('');

    const emptyStateHtml = `
        <div class="col-12 py-5 text-center text-secondary">
            <i class="bi bi-cpu-fill fs-1 text-muted mb-3 d-block"></i>
            <h5 class="text-white font-outfit">No active hardware nodes found</h5>
            <p class="small">Refine your search parameters or register a new device to trigger logs.</p>
        </div>
    `;

    return `
        <div class="container-fluid p-4 page-fade-in">
            <!-- Header section -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 class="text-white font-outfit fw-bold mb-1">Fleet Provisioning</h4>
                    <p class="text-secondary mb-0">Configure, monitor, and deploy hardware tags across zones</p>
                </div>
                <button class="btn btn-neon-cyan d-flex align-items-center gap-1.5" data-bs-toggle="modal" data-bs-target="#addDeviceModal">
                    <i class="bi bi-plus-lg fw-bold"></i> Provision Device
                </button>
            </div>

            <!-- Filters Bar -->
            <div class="glass-card p-3 mb-4">
                <div class="row g-3 align-items-center">
                    <!-- Search input -->
                    <div class="col-md-5">
                        <div class="position-relative">
                            <i class="bi bi-search text-secondary position-absolute ms-3 top-50 translate-middle-y"></i>
                            <input type="text" id="dev-filter-search" class="form-control form-control-dark ps-5" placeholder="Search by name, zone, location..." value="${searchFilter}">
                        </div>
                    </div>
                    
                    <!-- Status Filter Dropdown -->
                    <div class="col-sm-6 col-md-3">
                        <select id="dev-filter-status" class="form-select form-select-dark">
                            <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>Status: All Fleet</option>
                            <option value="online" ${statusFilter === 'online' ? 'selected' : ''}>Status: Online</option>
                            <option value="offline" ${statusFilter === 'offline' ? 'selected' : ''}>Status: Offline</option>
                            <option value="maintenance" ${statusFilter === 'maintenance' ? 'selected' : ''}>Status: Maintenance</option>
                        </select>
                    </div>

                    <!-- Type Filter Dropdown -->
                    <div class="col-sm-6 col-md-3">
                        <select id="dev-filter-type" class="form-select form-select-dark">
                            <option value="all" ${typeFilter === 'all' ? 'selected' : ''}>Type: All Hardware</option>
                            <option value="temperature" ${typeFilter === 'temperature' ? 'selected' : ''}>Type: Temp Thermostat</option>
                            <option value="gateway" ${typeFilter === 'gateway' ? 'selected' : ''}>Type: Core Power Gateway</option>
                            <option value="vibration" ${typeFilter === 'vibration' ? 'selected' : ''}>Type: Vibration Fan</option>
                            <option value="pressure" ${typeFilter === 'pressure' ? 'selected' : ''}>Type: Pressure PLC</option>
                        </select>
                    </div>

                    <!-- Reset filters button (only visible if filtered) -->
                    <div class="col-auto">
                        <button id="dev-filter-reset" class="btn btn-outline-secondary btn-sm px-2.5 py-2 font-outfit" style="border-radius: 8px;">
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <!-- Devices Grid -->
            <div class="row g-4" id="device-cards-grid">
                ${filteredDevices.length > 0 ? deviceCardsHtml : emptyStateHtml}
            </div>
        </div>

        <!-- Add Device Bootstrap Modal -->
        <div class="modal fade" id="addDeviceModal" tabindex="-1" aria-labelledby="addDeviceModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content glass-card border-1" style="background-color: var(--bg-card-solid);">
                    <div class="modal-header border-bottom" style="border-color: rgba(255, 255, 255, 0.05);">
                        <h5 class="modal-title font-outfit text-white fw-bold" id="addDeviceModalLabel">Provision New Device Tag</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="add-device-form">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="modal-device-name" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Device Name</label>
                                <input type="text" class="form-control form-control-dark" id="modal-device-name" required placeholder="e.g. Compressor Pump #1">
                            </div>
                            <div class="mb-3">
                                <label for="modal-device-type" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Hardware Type</label>
                                <select class="form-select form-select-dark" id="modal-device-type" required>
                                    <option value="temperature">Temperature & Humidity Node</option>
                                    <option value="gateway">Core Power Gateway Analyzer</option>
                                    <option value="vibration">Vibration & RPM Calibrator</option>
                                    <option value="pressure">Pressure PLC Sensor</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="modal-device-location" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Installation Zone</label>
                                <input type="text" class="form-control form-control-dark" id="modal-device-location" required placeholder="e.g. Plant Floor Area C">
                            </div>
                        </div>
                        <div class="modal-footer border-top" style="border-color: rgba(255, 255, 255, 0.05);">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-neon-cyan px-4">Register Tag</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

export function initDeviceMgmtPage(state) {
    bindDeviceEvents();
}

export function updateDeviceMgmtPage(state) {
    const { devices } = state;
    
    // We update telemetry values and online badge statuses in real time for existing visible cards
    devices.forEach(dev => {
        const card = document.querySelector(`.device-card-outer[data-id="${dev.id}"]`);
        if (card) {
            // Update online statuses
            const badgeSpan = card.querySelector('.badge');
            if (badgeSpan) {
                if (dev.status === 'online') {
                    badgeSpan.className = 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 py-1 px-2';
                    badgeSpan.innerHTML = `<span class="glow-dot online me-1"></span> ONLINE`;
                } else if (dev.status === 'offline') {
                    badgeSpan.className = 'badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 py-1 px-2';
                    badgeSpan.innerHTML = `<span class="glow-dot offline me-1"></span> OFFLINE`;
                } else {
                    badgeSpan.className = 'badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 py-1 px-2';
                    badgeSpan.innerHTML = `<span class="glow-dot maintenance me-1"></span> MAINTENANCE`;
                }
            }

            // Update power switch
            const switchEl = card.querySelector('.dev-card-power-switch');
            if (switchEl) {
                switchEl.checked = dev.status === 'online';
            }

            // Update specific metrics
            if (dev.status === 'online') {
                const tempEl = card.querySelector('.dev-metric-temp');
                const humEl = card.querySelector('.dev-metric-humidity');
                const loadEl = card.querySelector('.dev-metric-load');
                const voltEl = card.querySelector('.dev-metric-voltage');
                const vibEl = card.querySelector('.dev-metric-vibration');
                const speedEl = card.querySelector('.dev-metric-speed');
                const pressEl = card.querySelector('.dev-metric-pressure');
                const flowEl = card.querySelector('.dev-metric-flowRate');

                if (tempEl && dev.metrics.temp !== undefined) tempEl.innerText = `${dev.metrics.temp}°C`;
                if (humEl && dev.metrics.humidity !== undefined) humEl.innerText = `${dev.metrics.humidity}%`;
                if (loadEl && dev.metrics.load !== undefined) loadEl.innerText = `${dev.metrics.load}%`;
                if (voltEl && dev.metrics.voltage !== undefined) voltEl.innerText = `${dev.metrics.voltage}V`;
                if (vibEl && dev.metrics.vibration !== undefined) vibEl.innerText = `${dev.metrics.vibration}g`;
                if (speedEl && dev.metrics.speed !== undefined) speedEl.innerText = `${dev.metrics.speed} RPM`;
                if (pressEl && dev.metrics.pressure !== undefined) pressEl.innerText = `${dev.metrics.pressure} bar`;
                if (flowEl && dev.metrics.flowRate !== undefined) flowEl.innerText = `${dev.metrics.flowRate} L/m`;
            } else {
                // If device went offline during telemetry stream, refresh page state or replace metrics with Offline text
                const rowGrid = card.querySelector('.row.g-2');
                if (rowGrid && !rowGrid.querySelector('.text-center')) {
                    rowGrid.innerHTML = `
                        <div class="col-12 py-3 text-center text-secondary small">
                            <i class="bi bi-slash-circle me-1"></i> Device offline. No telemetry.
                        </div>
                    `;
                }
            }
        }
    });
}

function bindDeviceEvents() {
    // Search input
    const searchEl = document.getElementById('dev-filter-search');
    if (searchEl) {
        searchEl.addEventListener('input', (e) => {
            searchFilter = e.target.value;
            triggerUIRefresh();
        });
    }

    // Status dropdown filter
    const statusEl = document.getElementById('dev-filter-status');
    if (statusEl) {
        statusEl.addEventListener('change', (e) => {
            statusFilter = e.target.value;
            triggerUIRefresh();
        });
    }

    // Type dropdown filter
    const typeEl = document.getElementById('dev-filter-type');
    if (typeEl) {
        typeEl.addEventListener('change', (e) => {
            typeFilter = e.target.value;
            triggerUIRefresh();
        });
    }

    // Reset button
    const resetEl = document.getElementById('dev-filter-reset');
    if (resetEl) {
        resetEl.addEventListener('click', () => {
            searchFilter = '';
            statusFilter = 'all';
            typeFilter = 'all';
            triggerUIRefresh();
        });
    }

    // Power switches on cards
    document.querySelectorAll('.dev-card-power-switch').forEach(el => {
        el.addEventListener('change', (e) => {
            const id = e.target.getAttribute('data-id');
            store.toggleDevicePower(id);
        });
    });

    // Delete buttons on cards
    document.querySelectorAll('.dev-delete-btn').forEach(el => {
        el.addEventListener('click', (e) => {
            const btn = e.target.closest('.dev-delete-btn');
            const id = btn.getAttribute('data-id');
            if (confirm('Decommission and delete this device? Active alerts and historical telemetry logs will be cleared.')) {
                store.deleteDevice(id);
                triggerUIRefresh();
            }
        });
    });

    // Form submit inside Add Modal
    const form = document.getElementById('add-device-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('modal-device-name').value;
            const type = document.getElementById('modal-device-type').value;
            const location = document.getElementById('modal-device-location').value;

            store.addDevice({ name, type, location });
            
            // Hide Bootstrap Modal
            const modalEl = document.getElementById('addDeviceModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
                modalInstance.hide();
            }

            // Reset Form fields
            form.reset();
            
            // Refresh
            triggerUIRefresh();
        });
    }
}

// Emits route change to trigger page rebuilds
function triggerUIRefresh() {
    window.dispatchEvent(new CustomEvent('iotinfo-route-changed'));
}
