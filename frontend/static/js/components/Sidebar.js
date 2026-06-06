/* ==========================================================================
   IoT InFo Sidebar Component
   ========================================================================== */

export function renderSidebar(currentRoute, stats) {
    const activeAlertsBadge = stats.unackAlerts > 0 
        ? `<span class="badge rounded-pill bg-danger ms-auto px-2 py-1 text-white fw-bold" style="font-size: 0.75rem; box-shadow: 0 0 8px rgba(255, 23, 68, 0.4);">${stats.unackAlerts}</span>`
        : '';

    const menuItems = [
        { route: '#dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
        { route: '#device-mgmt', label: 'Device Management', icon: 'bi-cpu-fill' },
        { route: '#analytics', label: 'Sensor Analytics', icon: 'bi-graph-up-arrow' },
        { 
            route: '#alerts', 
            label: 'Alerts', 
            icon: 'bi-exclamation-triangle-fill', 
            extra: activeAlertsBadge 
        },
        { route: '#reports', label: 'Reports & Logs', icon: 'bi-file-earmark-bar-graph-fill' },
        { route: '#profile', label: 'User Profile', icon: 'bi-person-badge-fill' }
    ];

    const menuLinksHtml = menuItems.map(item => {
        const isActive = currentRoute === item.route;
        return `
            <li class="sidebar-menu-item">
                <a href="${item.route}" class="sidebar-menu-link ${isActive ? 'active' : ''}">
                    <i class="bi ${item.icon}"></i>
                    <span>${item.label}</span>
                    ${item.extra || ''}
                </a>
            </li>
        `;
    }).join('');

    return `
        <div class="sidebar-brand d-flex align-items-center justify-content-between">
            <a href="#dashboard" class="d-flex align-items-center text-decoration-none text-white">
                <i class="bi bi-lightning-charge-fill text-info me-2 fs-3" style="filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.6));"></i>
                <span class="font-outfit fw-bold tracking-wide text-uppercase fs-4">IoT <span class="text-info">InFo</span></span>
            </a>
            <!-- Mobile Close Button -->
            <button class="btn text-white d-lg-none p-0 border-0" id="sidebar-close-btn" aria-label="Close menu">
                <i class="bi bi-x-lg fs-4"></i>
            </button>
        </div>
        
        <ul class="sidebar-menu mt-4">
            <div class="text-uppercase text-secondary font-outfit fw-bold px-3 mb-2 small tracking-wider" style="font-size: 0.7rem;">Monitoring Console</div>
            ${menuLinksHtml}
        </ul>

        <!-- Sidebar Footer Status Component -->
        <div class="p-3 mt-auto border-top" style="border-color: rgba(255, 255, 255, 0.05) !important;">
            <div class="glass-card p-3" style="background: rgba(255,255,255,0.02);">
                <div class="d-flex align-items-center mb-2">
                    <span class="glow-dot online me-2"></span>
                    <span class="small font-outfit fw-bold text-light tracking-wide text-uppercase" style="font-size: 0.75rem;">Cloud Core Connection</span>
                </div>
                <div class="text-secondary" style="font-size: 0.7rem;">Latency: 24ms</div>
                <div class="text-secondary mb-3" style="font-size: 0.7rem;">Signal: Excellent (-62dB)</div>
                <a href="#logout" class="btn btn-outline-danger w-100 btn-sm font-outfit d-flex align-items-center justify-content-center py-1.5" style="border-radius: 6px; font-size: 0.8rem;">
                    <i class="bi bi-box-arrow-left me-1.5"></i> Sign Out
                </a>
            </div>
        </div>
    `;
}
