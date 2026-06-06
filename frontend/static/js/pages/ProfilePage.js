/* ==========================================================================
   IoT InFo User Profile & Settings Page View
   ========================================================================== */

import { store } from '../store.js';

export function renderProfilePage(state) {
    const { profile } = state;

    return `
        <div class="container-fluid p-4 page-fade-in">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 class="text-white font-outfit fw-bold mb-1">Operator Profile & Settings</h4>
                    <p class="text-secondary mb-0">Manage credentials, toggle notification limits, and calibrate simulators</p>
                </div>
            </div>

            <!-- Main grid details -->
            <div class="row g-4">
                
                <!-- Profile details form -->
                <div class="col-lg-6">
                    <div class="glass-card p-4 h-100">
                        <h5 class="text-white font-outfit fw-bold mb-3"><i class="bi bi-person-fill text-info me-1.5"></i> Operator Credentials</h5>
                        <p class="text-secondary small mb-4">Admin settings linked to authentication terminal logs</p>
                        
                        <div id="profile-success-msg" class="d-none alert alert-success bg-success bg-opacity-10 text-success border-success border-opacity-20 py-2 px-3 small mb-3">
                            <i class="bi bi-check-circle-fill me-1"></i> Operator details updated successfully!
                        </div>

                        <form id="profile-details-form">
                            <div class="mb-3">
                                <label for="prof-username" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Username</label>
                                <input type="text" class="form-control form-control-dark" id="prof-username" value="${profile.username}" required>
                            </div>
                            <div class="mb-3">
                                <label for="prof-email" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Email Address</label>
                                <input type="email" class="form-control form-control-dark" id="prof-email" value="${profile.email}" required>
                            </div>
                            <div class="mb-4">
                                <label for="prof-role" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Operator Role Access</label>
                                <select class="form-select form-select-dark" id="prof-role">
                                    <option value="Administrator" ${profile.role === 'Administrator' ? 'selected' : ''}>Administrator</option>
                                    <option value="Operator" ${profile.role === 'Operator' ? 'selected' : ''}>Operator</option>
                                    <option value="Viewer" ${profile.role === 'Viewer' ? 'selected' : ''}>Viewer</option>
                                    <option value="Technician" ${profile.role === 'Technician' ? 'selected' : ''}>Technician</option>
                                </select>
                                <small class="text-muted mt-1 d-block" style="font-size: 0.7rem;">Select the access level for this operator account</small>
                            </div>
                            <button type="submit" class="btn btn-neon-cyan px-4 font-outfit fw-medium">Save Changes</button>
                        </form>
                    </div>
                </div>

                <!-- Simulation speed and notification choices -->
                <div class="col-lg-6">
                    <div class="d-flex flex-column gap-4 h-100">
                        
                        <!-- Telemetry Calibration Card -->
                        <div class="glass-card p-4">
                            <h5 class="text-white font-outfit fw-bold mb-3"><i class="bi bi-sliders text-info me-1.5"></i> Core Telemetry Tuning</h5>
                            <p class="text-secondary small mb-4">Calibrate the background simulator cycle interval rates</p>
                            
                            <form id="profile-calibration-form">
                                <div class="mb-3">
                                    <label for="prof-sim-speed" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Data Stream Ticking Rate</label>
                                    <select id="prof-sim-speed" class="form-select form-select-dark">
                                        <option value="slow" ${profile.simSpeed === 'slow' ? 'selected' : ''}>Slow Cycle (Heartbeat every 6 seconds)</option>
                                        <option value="medium" ${profile.simSpeed === 'medium' ? 'selected' : ''}>Standard Cycle (Heartbeat every 3 seconds)</option>
                                        <option value="fast" ${profile.simSpeed === 'fast' ? 'selected' : ''}>High-Frequency Cycle (Heartbeat every 1 second)</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-neon-cyan px-4 font-outfit fw-medium">Calibrate Speed</button>
                            </form>
                        </div>

                        <!-- System alerts routing config -->
                        <div class="glass-card p-4 flex-grow-1">
                            <h5 class="text-white font-outfit fw-bold mb-3"><i class="bi bi-bell-fill text-info me-1.5"></i> Notification Integrations</h5>
                            <p class="text-secondary small mb-4">Configure notification routes for critical severity exceptions</p>
                            
                            <form id="profile-notify-form">
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input bg-dark border-secondary" id="notify-email" ${profile.notifyEmail ? 'checked' : ''}>
                                    <label class="form-check-label text-white-50 small" for="notify-email">
                                        Email Routing (Forward critical logs to operator email)
                                    </label>
                                </div>
                                <div class="mb-3 form-check">
                                    <input type="checkbox" class="form-check-input bg-dark border-secondary" id="notify-sms" ${profile.notifySms ? 'checked' : ''}>
                                    <label class="form-check-label text-white-50 small" for="notify-sms">
                                        SMS Alerts Dispatch (Relay emergency status via SMS gateways)
                                    </label>
                                </div>
                                <div class="mb-4 form-check">
                                    <input type="checkbox" class="form-check-input bg-dark border-secondary" id="notify-push" ${profile.notifyPush ? 'checked' : ''}>
                                    <label class="form-check-label text-white-50 small" for="notify-push">
                                        Push Notifications (Display in-browser diagnostic overlays)
                                    </label>
                                </div>
                                <button type="submit" class="btn btn-neon-cyan px-4 font-outfit fw-medium">Apply Routing</button>
                            </form>
                        </div>

                    </div>
                </div>

                <!-- API Key Manager Box -->
                <div class="col-12">
                    <div class="glass-card p-4">
                        <h5 class="text-white font-outfit fw-bold mb-2"><i class="bi bi-key-fill text-info me-1.5"></i> Access Authorization Keys</h5>
                        <p class="text-secondary small mb-4">Provision access tokens to retrieve telemetry streams programmatically via external microservices</p>
                        
                        <div class="row g-3 align-items-center">
                            <div class="col-md-8">
                                <div class="position-relative">
                                    <i class="bi bi-shield-lock text-secondary position-absolute ms-3 top-50 translate-middle-y"></i>
                                    <input type="text" id="api-key-value" class="form-control form-control-dark ps-5" style="font-family: monospace; font-size: 0.9rem;" value="${profile.apiKey}" readonly>
                                </div>
                            </div>
                            <div class="col-md-4 d-flex gap-2">
                                <button class="btn btn-outline-neon w-100 font-outfit fw-medium py-2.5" id="api-copy-btn">
                                    <i class="bi bi-copy me-1"></i> Copy Key
                                </button>
                                <button class="btn btn-outline-danger w-100 font-outfit fw-medium py-2.5" id="api-regen-btn">
                                    <i class="bi bi-arrow-clockwise me-1"></i> Roll Token
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;
}

export function initProfilePage(state) {
    bindProfileEvents();
}

export function updateProfilePage(state) {
    // Profiling values don't need real-time data sync overlays.
}

function bindProfileEvents() {
    // Details Form
    const detailsForm = document.getElementById('profile-details-form');
    if (detailsForm) {
        detailsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('prof-username').value;
            const email = document.getElementById('prof-email').value;
            const role = document.getElementById('prof-role').value;

            store.updateProfile({ username, email, role });
            showSuccessAlert();
        });
    }

    // Calibration Form
    const calibForm = document.getElementById('profile-calibration-form');
    if (calibForm) {
        calibForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const simSpeed = document.getElementById('prof-sim-speed').value;

            store.updateProfile({ simSpeed });
            showSuccessAlert();
        });
    }

    // Notification Form
    const notifyForm = document.getElementById('profile-notify-form');
    if (notifyForm) {
        notifyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const notifyEmail = document.getElementById('notify-email').checked;
            const notifySms = document.getElementById('notify-sms').checked;
            const notifyPush = document.getElementById('notify-push').checked;

            store.updateProfile({ notifyEmail, notifySms, notifyPush });
            showSuccessAlert();
        });
    }

    // Copy Token
    const copyBtn = document.getElementById('api-copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const val = document.getElementById('api-key-value');
            if (val) {
                navigator.clipboard.writeText(val.value);
                alert('Copied token to clipboard!');
            }
        });
    }

    // Regen Token
    const regenBtn = document.getElementById('api-regen-btn');
    if (regenBtn) {
        regenBtn.addEventListener('click', () => {
            if (confirm('Re-roll this token? Active clients leveraging this token will receive 401 Unauthorized exceptions.')) {
                const newKey = store.generateNewApiKey();
                const input = document.getElementById('api-key-value');
                if (input) {
                    input.value = newKey;
                }
            }
        });
    }
}

function showSuccessAlert() {
    const banner = document.getElementById('profile-success-msg');
    if (banner) {
        banner.classList.remove('d-none');
        setTimeout(() => {
            banner.classList.add('d-none');
        }, 3000);
    }
}
