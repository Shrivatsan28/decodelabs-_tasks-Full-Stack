/* ==========================================================================
   IoT InFo Reports Page View
   ========================================================================== */

import { store } from '../store.js';

let isGenerating = false;
let progressVal = 0;
let exportCompleted = false;
let generatedFileName = '';

export function renderReportsPage(state) {
    const { devices } = state;

    // Devices checklist HTML
    const devicesChecklistHtml = devices.map(dev => {
        return `
            <div class="form-check col-sm-6 mb-2">
                <input class="form-check-input report-device-check" type="checkbox" value="${dev.id}" id="chk-${dev.id}" checked>
                <label class="form-check-label text-secondary small" for="chk-${dev.id}">
                    ${dev.name}
                </label>
            </div>
        `;
    }).join('');

    // Mock exported records preview rows (random telemetry values for display)
    const previewRowsHtml = devices.slice(0, 4).map(dev => {
        let metricInfo = 'Uptime: 100%';
        if (dev.status === 'online') {
            if (dev.metrics.temp !== undefined) metricInfo = `Temp: ${dev.metrics.temp}°C, Humid: ${dev.metrics.humidity}%`;
            else if (dev.metrics.load !== undefined) metricInfo = `Load: ${dev.metrics.load}%, Volt: ${dev.metrics.voltage}V`;
            else if (dev.metrics.pressure !== undefined) metricInfo = `Pres: ${dev.metrics.pressure} bar, Flow: ${dev.metrics.flowRate}L/m`;
        } else {
            metricInfo = 'Device offline / No signals';
        }

        const dateStr = new Date(dev.updated_at || dev.created_at).toLocaleString();

        return `
            <tr>
                <td class="text-white fw-medium font-outfit" style="font-size: 0.85rem;">DEV-${dev.id}</td>
                <td class="text-white">${dev.name}</td>
                <td class="text-secondary small">${dev.location}</td>
                <td><span class="text-info font-outfit small">${metricInfo}</span></td>
                <td class="text-secondary small font-outfit">${dateStr}</td>
            </tr>
        `;
    }).join('');

    // Generate progress panel HTML
    let progressPanelHtml = '';
    if (isGenerating) {
        progressPanelHtml = `
            <div class="glass-card p-4 mb-4 text-center">
                <h6 class="text-white font-outfit fw-bold text-uppercase tracking-wider mb-3">Compiling Core Logs</h6>
                <div class="progress bg-dark border border-secondary border-opacity-25 mb-3" style="height: 12px; border-radius: 6px;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated bg-info" role="progressbar" style="width: ${progressVal}%; box-shadow: 0 0 10px rgba(0, 229, 255, 0.4);" aria-valuenow="${progressVal}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                <div class="text-secondary small" id="report-progress-text">Consolidating packet aggregates... ${progressVal}%</div>
            </div>
        `;
    } else if (exportCompleted) {
        progressPanelHtml = `
            <div class="glass-card p-4 mb-4 bg-success bg-opacity-10 border-success border-opacity-20 text-center animate-pulse">
                <i class="bi bi-file-earmark-check-fill text-success fs-1 mb-2 d-block"></i>
                <h5 class="text-success font-outfit fw-bold">Report Compiled Successfully</h5>
                <p class="text-secondary small mb-3">File size: 148.2 KB &bull; MD5 Checksum: Valid</p>
                <div class="d-flex justify-content-center gap-2">
                    <button class="btn btn-neon-cyan btn-sm font-outfit" id="report-download-btn">
                        <i class="bi bi-download me-1"></i> Download ${generatedFileName}
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" id="report-reset-btn">Compile New</button>
                </div>
            </div>
        `;
    }

    return `
        <div class="container-fluid p-4 page-fade-in">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 class="text-white font-outfit fw-bold mb-1">Telemetry Exporter & Reports</h4>
                    <p class="text-secondary mb-0">Package and download telemetry logs and fleet audits</p>
                </div>
            </div>

            <!-- Main row grid -->
            <div class="row g-4">
                
                <!-- Configure exporter form -->
                <div class="col-lg-5">
                    <div class="glass-card p-4 h-100">
                        <h5 class="text-white font-outfit fw-bold mb-4">Export Configuration</h5>
                        <form id="report-config-form">
                            
                            <!-- Select Type -->
                            <div class="mb-3">
                                <label for="rep-type" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Report Format Type</label>
                                <select id="rep-type" class="form-select form-select-dark" required>
                                    <option value="system_health">System Health Audit Log</option>
                                    <option value="telemetry_dump">Full Telemetry Dump</option>
                                    <option value="alerts_history">Critical Alerts Log History</option>
                                    <option value="fleet_uptime">Fleet Connectivity Analysis</option>
                                </select>
                            </div>

                            <!-- Select Time range -->
                            <div class="mb-3">
                                <label for="rep-range" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Date/Time Span</label>
                                <select id="rep-range" class="form-select form-select-dark" required>
                                    <option value="today">Today (Past 24 Hours)</option>
                                    <option value="week">Past 7 Days</option>
                                    <option value="month">Past 30 Days</option>
                                    <option value="custom">Custom Date Scope</option>
                                </select>
                            </div>

                            <!-- Target Devices checklist -->
                            <div class="mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="form-label text-secondary small font-outfit text-uppercase tracking-wider mb-0">Source Nodes</label>
                                    <button type="button" class="btn btn-link p-0 text-info font-outfit border-0" id="report-select-all" style="font-size: 0.75rem; text-decoration: none;">Select All</button>
                                </div>
                                <div class="glass-card p-3" style="max-height: 140px; overflow-y: auto; background-color: rgba(0,0,0,0.15);">
                                    <div class="row g-1">
                                        ${devicesChecklistHtml}
                                    </div>
                                </div>
                            </div>

                            <!-- Exporter File Type -->
                            <div class="mb-4">
                                <label class="form-label text-secondary small font-outfit text-uppercase tracking-wider">File Format</label>
                                <div class="d-flex gap-4">
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="fileFormat" id="fmt-csv" value="CSV" checked>
                                        <label class="form-check-label text-secondary small" for="fmt-csv">CSV Spreadsheet</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="fileFormat" id="fmt-pdf" value="PDF">
                                        <label class="form-check-label text-secondary small" for="fmt-pdf">PDF Document</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="fileFormat" id="fmt-json" value="JSON">
                                        <label class="form-check-label text-secondary small" for="fmt-json">JSON Stream</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Submit Btn -->
                            <button type="submit" class="btn btn-neon-cyan w-100 py-2.5 font-outfit fw-bold text-uppercase tracking-wider" style="font-size: 0.8rem;" ${isGenerating ? 'disabled' : ''}>
                                <i class="bi bi-file-earmark-arrow-down-fill me-1"></i> Build Exporter File
                            </button>

                        </form>
                    </div>
                </div>

                <!-- Preview list and exporter loaders -->
                <div class="col-lg-7">
                    <div class="d-flex flex-column h-100">
                        
                        <!-- Compiler loaders -->
                        <div id="report-progress-container">
                            ${progressPanelHtml}
                        </div>

                        <!-- Preview Table -->
                        <div class="glass-card p-4 flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h5 class="text-white font-outfit fw-bold mb-0">Record Sample Preview</h5>
                                    <small class="text-secondary">First 4 mock records matching selected filters</small>
                                </div>
                                <span class="badge bg-secondary font-outfit text-white-50 px-2 py-1 small fw-bold">SAMPLE PROTOCOL</span>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-dark-custom align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Tag ID</th>
                                            <th>Device Name</th>
                                            <th>Location</th>
                                            <th>Preview Value</th>
                                            <th>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${previewRowsHtml}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    `;
}

export function initReportsPage(state) {
    bindReportsEvents();
}

export function updateReportsPage(state) {
    // Background simulation doesn't need to overwrite reports configuration or exporter values.
}

function bindReportsEvents() {
    // Select All Nodes check
    const selectAllBtn = document.getElementById('report-select-all');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            const checks = document.querySelectorAll('.report-device-check');
            const allChecked = Array.from(checks).every(c => c.checked);
            checks.forEach(c => c.checked = !allChecked);
            selectAllBtn.innerText = allChecked ? 'Select All' : 'Deselect All';
        });
    }

    // Form submission
    const form = document.getElementById('report-config-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (isGenerating || exportCompleted) return;

            const repType = document.getElementById('rep-type').value;
            const fileFormat = form.elements.fileFormat.value;
            
            // Build filename based on selects
            generatedFileName = `iotinfo_report_${repType}_${Date.now().toString().slice(-4)}.${fileFormat.toLowerCase()}`;

            // Trigger simulated compile process
            isGenerating = true;
            progressVal = 0;
            
            // Disable submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            // Render progress panel
            updateProgressUI();

            const interval = setInterval(() => {
                progressVal += Math.floor(Math.random() * 8) + 4; // Smaller steps for smooth glide
                if (progressVal >= 100) {
                    progressVal = 100;
                    clearInterval(interval);
                    updateProgressUI();

                    // Smooth transition delay before showing success screen
                    setTimeout(() => {
                        isGenerating = false;
                        exportCompleted = true;
                        updateProgressUI();
                    }, 500);
                } else {
                    updateProgressUI();
                }
            }, 180); // Higher frequency updates for fluid movement
        });
    }

    // Sync progress UI and its event handlers on init
    updateProgressUI();
}

function updateProgressUI() {
    const progressContainer = document.getElementById('report-progress-container');
    if (!progressContainer) return;

    if (isGenerating) {
        const progressBar = document.getElementById('report-progress-bar');
        const progressText = document.getElementById('report-progress-text');
        
        if (progressBar && progressText) {
            // Smoothly glide to the new progress position using CSS transitions
            progressBar.style.width = `${progressVal}%`;
            progressBar.setAttribute('aria-valuenow', progressVal);
            progressText.innerText = `Consolidating packet aggregates... ${progressVal}%`;
        } else {
            progressContainer.innerHTML = `
                <div class="glass-card p-4 mb-4 text-center">
                    <h6 class="text-white font-outfit fw-bold text-uppercase tracking-wider mb-3">Compiling Core Logs</h6>
                    <div class="progress bg-dark border border-secondary border-opacity-25 mb-3" style="height: 12px; border-radius: 6px; overflow: hidden;">
                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-info" 
                             id="report-progress-bar" 
                             role="progressbar" 
                             style="width: ${progressVal}%; box-shadow: 0 0 10px rgba(0, 229, 255, 0.4);" 
                             aria-valuenow="${progressVal}" 
                             aria-valuemin="0" 
                             aria-valuemax="100"></div>
                    </div>
                    <div class="text-secondary small" id="report-progress-text">Consolidating packet aggregates... ${progressVal}%</div>
                </div>
            `;
        }
    } else if (exportCompleted) {
        // Success panel without the distracting full-card pulsing, but with micro-interactions
        progressContainer.innerHTML = `
            <div class="glass-card p-4 mb-4 bg-success bg-opacity-10 border-success border-opacity-20 text-center animate-fade-in" style="animation: page-fade 0.4s ease-out forwards;">
                <i class="bi bi-file-earmark-check-fill text-success fs-1 mb-2 d-block" style="animation: bounce 1s infinite alternate;"></i>
                <h5 class="text-success font-outfit fw-bold">Report Compiled Successfully</h5>
                <p class="text-secondary small mb-3">File size: 148.2 KB &bull; MD5 Checksum: Valid</p>
                <div class="d-flex justify-content-center gap-2">
                    <button class="btn btn-neon-cyan btn-sm font-outfit" id="report-download-btn">
                        <i class="bi bi-download me-1"></i> Download ${generatedFileName}
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" id="report-reset-btn">Compile New</button>
                </div>
            </div>
        `;

        // Bind download button
        const downloadBtn = document.getElementById('report-download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', handleDownload);
        }

        // Bind reset button
        const resetBtn = document.getElementById('report-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', handleReset);
        }
    } else {
        progressContainer.innerHTML = '';
    }
}

async function handleDownload() {
    const downloadBtn = document.getElementById('report-download-btn');
    if (!downloadBtn) return;

    const form = document.getElementById('report-config-form');
    if (!form) return;

    const rangeSelect = document.getElementById('rep-range').value;
    const format = form.elements.fileFormat.value.toLowerCase();
    
    // Map range selector to backend API routes
    let rangeType = 'daily';
    if (rangeSelect === 'week') rangeType = 'weekly';
    if (rangeSelect === 'month') rangeType = 'monthly';

    // Gather selected device IDs
    const deviceIds = Array.from(document.querySelectorAll('.report-device-check:checked'))
                           .map(c => c.value)
                           .join(',');

    const url = `/api/reports/${rangeType}/?format=${format}&devices=${deviceIds}`;
    
    downloadBtn.disabled = true;
    const origText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Downloading...';

    try {
        const res = await store.apiCall(url);
        if (res.ok) {
            const blob = await res.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = generatedFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } else {
            alert('Error compiling report on the backend server.');
        }
    } catch (e) {
        console.error("Report download failure:", e);
        alert('Connection error. Could not download the report file.');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = origText;
    }
}

function handleReset() {
    exportCompleted = false;
    progressVal = 0;
    isGenerating = false;
    
    // Enable submit button
    const form = document.getElementById('report-config-form');
    if (form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = false;
    }
    
    updateProgressUI();
}
