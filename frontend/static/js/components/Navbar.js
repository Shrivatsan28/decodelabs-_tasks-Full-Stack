/* ==========================================================================
   IoT InFo Navbar Component
   ========================================================================== */

export function renderNavbar(title, alerts, profile) {
    const unreadAlerts = alerts.filter(a => !a.acknowledged);
    const hasUnread = unreadAlerts.length > 0;
    
    // Notification items HTML for the dropdown
    let notificationItemsHtml = '';
    if (!hasUnread) {
        notificationItemsHtml = `
            <div class="p-3 text-center text-secondary small">
                <i class="bi bi-bell-slash fs-4 d-block mb-1 text-muted"></i>
                No new alerts
            </div>
        `;
    } else {
        notificationItemsHtml = unreadAlerts.slice(0, 4).map(alert => {
            let badgeClass = 'bg-info';
            let iconClass = 'bi-info-circle-fill';
            
            if (alert.severity === 'critical') {
                badgeClass = 'bg-danger';
                iconClass = 'bi-exclamation-octagon-fill';
            } else if (alert.severity === 'warning') {
                badgeClass = 'bg-warning text-dark';
                iconClass = 'bi-exclamation-triangle-fill';
            }
            
            // Format timestamp (just hh:mm:ss for simplicity)
            const timeStr = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            return `
                <div class="notify-item" data-alert-id="${alert.id}">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <span class="badge ${badgeClass} font-outfit px-1.5 py-0.5 text-uppercase fw-bold" style="font-size: 0.65rem;">
                            <i class="bi ${iconClass} me-0.5"></i> ${alert.severity}
                        </span>
                        <small class="text-secondary" style="font-size: 0.7rem;">${timeStr}</small>
                    </div>
                    <div class="text-white fw-medium mb-1" style="font-size: 0.8rem; line-height: 1.25;">${alert.deviceName}</div>
                    <div class="text-secondary text-truncate-custom" style="font-size: 0.75rem;">${alert.message}</div>
                    <div class="text-end mt-1">
                        <button class="btn btn-link p-0 text-info font-outfit border-0 alert-ack-btn" data-id="${alert.id}" style="font-size: 0.75rem; text-decoration: none;">
                            Acknowledge
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    return `
        <div class="top-navbar d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
                <!-- Hamburger Menu for Mobile -->
                <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" aria-label="Toggle Navigation">
                    <i class="bi bi-list"></i>
                </button>
                <h1 class="h4 font-outfit fw-bold mb-0 text-white tracking-wide text-uppercase">${title}</h1>
            </div>

            <!-- Right Nav utilities -->
            <div class="d-flex align-items-center gap-3">
                
                <!-- Quick Search Input (Desktop) -->
                <div class="d-none d-md-flex align-items-center position-relative">
                    <i class="bi bi-search text-secondary position-absolute ms-3" style="font-size: 0.9rem;"></i>
                    <input type="text" class="form-control form-control-dark ps-5 py-1.5" placeholder="Search devices..." style="font-size: 0.85rem; width: 220px;" id="global-device-search">
                </div>

                <!-- Notifications Dropdown -->
                <div class="dropdown">
                    <div class="nav-icon" id="notifyDropdownBtn" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                        <i class="bi bi-bell"></i>
                        ${hasUnread ? '<span class="notification-badge"></span>' : ''}
                    </div>
                    <div class="dropdown-menu dropdown-menu-end notify-dropdown" aria-labelledby="notifyDropdownBtn">
                        <div class="d-flex justify-content-between align-items-center p-3 border-bottom" style="border-color: rgba(255, 255, 255, 0.05) !important;">
                            <h6 class="mb-0 font-outfit fw-bold text-white text-uppercase tracking-wider" style="font-size: 0.8rem;">Live Alerts Feed</h6>
                            ${hasUnread ? `
                                <button class="btn btn-link p-0 text-secondary font-outfit border-0" id="clear-all-alerts-btn" style="font-size: 0.75rem; text-decoration: none;">
                                    Ack All
                                </button>
                            ` : ''}
                        </div>
                        
                        <div class="notify-list-container">
                            ${notificationItemsHtml}
                        </div>
                        
                        <div class="p-2 border-top text-center" style="border-color: rgba(255, 255, 255, 0.05) !important;">
                            <a href="#alerts" class="text-info font-outfit small text-decoration-none py-1 d-block" style="font-size: 0.75rem; font-weight: 500;">
                                View all logged notifications
                            </a>
                        </div>
                    </div>
                </div>

                <!-- Profile Dropdown -->
                <div class="dropdown" style="position: relative;">
                    <div class="d-flex align-items-center gap-2 cursor-pointer dropdown-toggle text-decoration-none" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer;">
                        <div class="text-white fw-semibold font-outfit" style="font-size: 0.85rem;">${profile.username}</div>
                    </div>
                    <ul class="dropdown-menu dropdown-menu-end glass-card p-2 border-1 mt-2" aria-labelledby="profileDropdown" style="background-color: var(--bg-card-solid); min-width: 200px; z-index: 9999;">
                        <li>
                            <div class="px-3 py-2 border-bottom mb-2" style="border-color: rgba(255,255,255,0.05);">
                                <div class="text-white fw-medium font-outfit" style="font-size: 0.85rem;">${profile.username}</div>
                                <div class="text-secondary small text-truncate" style="font-size: 0.75rem;">${profile.email}</div>
                            </div>
                        </li>
                        <li><a class="dropdown-item rounded py-1.5 font-outfit d-flex align-items-center text-white" href="#profile" style="font-size: 0.85rem;"><i class="bi bi-person-fill me-2 text-info"></i> Profile Details</a></li>
                        <li><a class="dropdown-item rounded py-1.5 font-outfit d-flex align-items-center text-white" href="#profile" style="font-size: 0.85rem;"><i class="bi bi-key-fill me-2 text-info"></i> API Keys</a></li>
                        <li><a class="dropdown-item rounded py-1.5 font-outfit d-flex align-items-center text-white" href="#profile" style="font-size: 0.85rem;"><i class="bi bi-gear-fill me-2 text-info"></i> Preferences</a></li>
                        <li><hr class="dropdown-divider" style="border-color: rgba(255,255,255,0.05);"></li>
                        <li><a class="dropdown-item rounded py-1.5 font-outfit d-flex align-items-center text-danger" href="#logout" style="font-size: 0.85rem;"><i class="bi bi-box-arrow-right me-2"></i> Log Out</a></li>
                    </ul>
                </div>

            </div>
        </div>
    `;
}
