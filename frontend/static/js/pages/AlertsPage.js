/* ==========================================================================
   IoT InFo Alerts Page View
   ========================================================================== */

import { store } from '../store.js';

let filterSeverity = 'all';
let filterStatus = 'unack'; // 'unack', 'ack', 'all'

export function renderAlertsPage(state) {
    const { alerts } = state;

    // Filter alerts based on local selection
    const filteredAlerts = alerts.filter(a => {
        const matchesSeverity = filterSeverity === 'all' || a.severity === filterSeverity;
        
        let matchesStatus = true;
        if (filterStatus === 'unack') matchesStatus = !a.acknowledged;
        else if (filterStatus === 'ack') matchesStatus = a.acknowledged;
        
        return matchesSeverity && matchesStatus;
    });

    const alertRowsHtml = filteredAlerts.map(alert => {
        let severityBadge = 'bg-info';
        if (alert.severity === 'critical') severityBadge = 'bg-danger';
        else if (alert.severity === 'warning') severityBadge = 'bg-warning text-dark';
        
        const timestamp = new Date(alert.timestamp).toLocaleString();
        
        const statusHtml = alert.acknowledged
            ? `<span class="text-secondary small d-flex align-items-center gap-1.5"><i class="bi bi-check2-all text-success fs-5"></i> Acknowledged</span>`
            : `<span class="text-warning small d-flex align-items-center gap-1.5"><span class="glow-dot maintenance"></span> Active</span>`;

        const actionHtml = alert.acknowledged
            ? `<button class="btn btn-sm btn-link text-secondary font-outfit p-0 border-0" disabled style="font-size: 0.75rem; text-decoration: none;">Resolved</button>`
            : `<button class="btn btn-outline-info btn-sm alert-page-ack-btn px-2.5 py-1" data-id="${alert.id}" style="font-size: 0.75rem;">Acknowledge</button>`;

        return `
            <tr data-alert-id="${alert.id}">
                <td class="text-secondary small font-outfit" style="width: 180px;">${timestamp}</td>
                <td style="width: 100px;">
                    <span class="badge ${severityBadge} font-outfit text-uppercase fw-bold" style="font-size: 0.65rem;">
                        ${alert.severity}
                    </span>
                </td>
                <td class="text-white fw-medium" style="width: 180px;">${alert.deviceName}</td>
                <td>
                    <span class="text-secondary" style="font-size: 0.85rem;">${alert.message}</span>
                </td>
                <td style="width: 140px;">${statusHtml}</td>
                <td class="text-end" style="width: 120px;">${actionHtml}</td>
            </tr>
        `;
    }).join('');

    const emptyStateHtml = `
        <tr>
            <td colspan="6" class="text-center py-5 text-secondary">
                <i class="bi bi-shield-check fs-1 text-success mb-2 d-block"></i>
                <h5 class="text-white font-outfit mt-3">No matching system alerts</h5>
                <p class="small">There are no warnings or critical events recorded matching the current filters.</p>
            </td>
        </tr>
    `;

    return `
        <div class="container-fluid p-4 page-fade-in">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 class="text-white font-outfit fw-bold mb-1">System Warnings & Alerts</h4>
                    <p class="text-secondary mb-0">Audit history logs of fleet performance exceptions</p>
                </div>
                <button class="btn btn-outline-neon d-flex align-items-center gap-1.5" id="alert-page-clear-all">
                    <i class="bi bi-check-lg fw-bold"></i> Acknowledge All
                </button>
            </div>

            <!-- Filter Card -->
            <div class="glass-card p-3 mb-4">
                <div class="row g-3 align-items-center">
                    
                    <!-- Severity Selector -->
                    <div class="col-md-4 col-sm-6">
                        <label for="alerts-filter-severity" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Severity Filter</label>
                        <select id="alerts-filter-severity" class="form-select form-select-dark">
                            <option value="all" ${filterSeverity === 'all' ? 'selected' : ''}>Severity: All Categories</option>
                            <option value="critical" ${filterSeverity === 'critical' ? 'selected' : ''}>Severity: Critical Danger</option>
                            <option value="warning" ${filterSeverity === 'warning' ? 'selected' : ''}>Severity: Warnings</option>
                            <option value="info" ${filterSeverity === 'info' ? 'selected' : ''}>Severity: Info Notifications</option>
                        </select>
                    </div>

                    <!-- Status Selector -->
                    <div class="col-md-4 col-sm-6">
                        <label for="alerts-filter-status" class="form-label text-secondary small font-outfit text-uppercase tracking-wider">Ack Status Filter</label>
                        <select id="alerts-filter-status" class="form-select form-select-dark">
                            <option value="unack" ${filterStatus === 'unack' ? 'selected' : ''}>Status: Active (Unacknowledged)</option>
                            <option value="ack" ${filterStatus === 'ack' ? 'selected' : ''}>Status: Resolved (Acknowledged)</option>
                            <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>Status: All Logs</option>
                        </select>
                    </div>

                    <!-- Reset Filter buttons -->
                    <div class="col-md-4 d-flex align-items-end justify-content-md-end h-100" style="padding-top: 28px;">
                        <button id="alerts-filter-reset" class="btn btn-outline-secondary px-4 py-2 font-outfit" style="border-radius: 8px;">
                            Reset Log Filters
                        </button>
                    </div>

                </div>
            </div>

            <!-- Alerts Table -->
            <div class="glass-card p-4">
                <div class="table-responsive">
                    <table class="table table-dark-custom align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Severity</th>
                                <th>Source Device</th>
                                <th>Exception Message</th>
                                <th>Status</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="alerts-table-tbody">
                            ${filteredAlerts.length > 0 ? alertRowsHtml : emptyStateHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

export function initAlertsPage(state) {
    bindAlertsEvents();
}

export function updateAlertsPage(state) {
    // If telemetry triggers alerts, let's trigger a full UI route update event to refresh list content safely
    // Since alerts could be added/removed, simple row updates might miss new items. Refreshing route keeps filters correct.
    // However, to prevent excessive redraws we can check if number of alerts changed.
    const tbody = document.getElementById('alerts-table-tbody');
    if (tbody) {
        // Just trigger route update so the table re-draws new entries dynamically
        triggerUIRefresh();
    }
}

function bindAlertsEvents() {
    // Severity Filter
    const sevSelect = document.getElementById('alerts-filter-severity');
    if (sevSelect) {
        sevSelect.addEventListener('change', (e) => {
            filterSeverity = e.target.value;
            triggerUIRefresh();
        });
    }

    // Status Filter
    const statSelect = document.getElementById('alerts-filter-status');
    if (statSelect) {
        statSelect.addEventListener('change', (e) => {
            filterStatus = e.target.value;
            triggerUIRefresh();
        });
    }

    // Reset Filters
    const resetBtn = document.getElementById('alerts-filter-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            filterSeverity = 'all';
            filterStatus = 'unack';
            triggerUIRefresh();
        });
    }

    // Acknowledge Single Alert
    document.querySelectorAll('.alert-page-ack-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            store.dismissAlert(id);
            triggerUIRefresh();
        });
    });

    // Acknowledge All Alerts
    const ackAllBtn = document.getElementById('alert-page-clear-all');
    if (ackAllBtn) {
        ackAllBtn.addEventListener('click', () => {
            if (confirm('Acknowledge all system warnings? This will archive active alerts.')) {
                store.clearAllAlerts();
                triggerUIRefresh();
            }
        });
    }
}

function triggerUIRefresh() {
    window.dispatchEvent(new CustomEvent('iotinfo-route-changed'));
}
