/* ==========================================================================
   IoT InFo SPA Orchestrator and Client Router
   ========================================================================== */

import { store } from './store.js';

// Import Components
import { renderSidebar } from './components/Sidebar.js';
import { renderNavbar } from './components/Navbar.js';

// Import Pages
import { renderLandingPage } from './pages/LandingPage.js';
import { renderLoginPage } from './pages/LoginPage.js';
import { renderRegisterPage } from './pages/RegisterPage.js';
import { renderDashboardPage, initDashboardPage, updateDashboardPage } from './pages/DashboardPage.js';
import { renderDeviceMgmtPage, initDeviceMgmtPage, updateDeviceMgmtPage } from './pages/DeviceMgmtPage.js';
import { renderAnalyticsPage, initAnalyticsPage, updateAnalyticsPage } from './pages/AnalyticsPage.js';
import { renderAlertsPage, initAlertsPage, updateAlertsPage } from './pages/AlertsPage.js';
import { renderReportsPage, initReportsPage, updateReportsPage } from './pages/ReportsPage.js';
import { renderProfilePage, initProfilePage, updateProfilePage } from './pages/ProfilePage.js';

// Router mapping
const routes = {
    '': { render: renderLandingPage, title: 'Welcome', isAuth: false },
    '#landing': { render: renderLandingPage, title: 'Welcome', isAuth: false },
    '#login': { render: renderLoginPage, title: 'Sign In', isAuth: false, init: initLogin },
    '#register': { render: renderRegisterPage, title: 'Register', isAuth: false, init: initRegister },
    '#dashboard': { render: renderDashboardPage, init: initDashboardPage, update: updateDashboardPage, title: 'Dashboard Console', isAuth: true },
    '#device-mgmt': { render: renderDeviceMgmtPage, init: initDeviceMgmtPage, update: updateDeviceMgmtPage, title: 'Fleet Devices', isAuth: true },
    '#analytics': { render: renderAnalyticsPage, init: initAnalyticsPage, update: updateAnalyticsPage, title: 'Sensor Analytics', isAuth: true },
    '#alerts': { render: renderAlertsPage, init: initAlertsPage, update: updateAlertsPage, title: 'System Alerts Log', isAuth: true },
    '#reports': { render: renderReportsPage, init: initReportsPage, update: updateReportsPage, title: 'Telemetry Exporter', isAuth: true },
    '#profile': { render: renderProfilePage, init: initProfilePage, update: updateProfilePage, title: 'Console Settings', isAuth: true }
};

let currentRoute = null;

// SPA router entry point
function router() {
    // Hide initial loader first
    const loader = document.getElementById('initial-loader');
    if (loader) loader.classList.add('d-none');

    // Get current hash route, clean query parameters
    let hash = window.location.hash || '';
    if (hash.includes('?')) {
        hash = hash.split('?')[0];
    }

    // Logout operation check
    if (hash === '#logout') {
        store.logout();
        window.location.hash = '#landing';
        return;
    }

    const state = store.getState();
    const route = routes[hash];

    if (!route) {
        // Fallback to landing if invalid route
        window.location.hash = '#landing';
        return;
    }

    currentRoute = hash;

    // Route authentication check
    if (route.isAuth && !state.currentUser) {
        window.location.hash = '#login';
        return;
    }
    
    // Redirect authenticated users away from Login/Register/Landing
    if (!route.isAuth && state.currentUser && hash !== '#landing' && hash !== '') {
        window.location.hash = '#dashboard';
        return;
    }

    renderView(route, state);
}

// Layout rendering engine
function renderView(route, state) {
    const appEl = document.getElementById('app');
    
    if (!route.isAuth) {
        // Marketing or auth layout (standalone screens)
        appEl.className = '';
        appEl.innerHTML = route.render(state);
        
        // Execute optional page lifecycle init callback
        if (route.init) {
            route.init(state);
        }
    } else {
        // Console UI layout (dashboard frame wrapper with sidebar/navbar)
        appEl.className = 'app-layout';
        
        // Create frame inner layout
        appEl.innerHTML = `
            <!-- Sidebar drawer wrapper -->
            <aside class="sidebar-wrapper" id="sidebar-container">
                ${renderSidebar(currentRoute, state.stats)}
            </aside>
            
            <!-- Mobile drawer backdrop click overlay -->
            <div class="sidebar-overlay" id="sidebar-overlay"></div>
            
            <!-- Main viewport panel -->
            <main class="main-viewport" id="viewport-container">
                <header id="navbar-container">
                    ${renderNavbar(route.title, state.alerts, state.profile)}
                </header>
                <div class="page-content" id="page-content-wrapper">
                    ${route.render(state)}
                </div>
            </main>
        `;

        // Bind global shell/layout event listeners
        bindShellEvents();

        // Run Page-specific lifecycle init callbacks
        if (route.init) {
            route.init(state);
        }
    }
}

// Binds shell elements: Hamburger drawer, ack alert links
function bindShellEvents() {
    const sidebar = document.getElementById('sidebar-container');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');

    // Mobile drawer toggle click handlers
    if (toggleBtn && sidebar && overlay) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('show');
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('show');
        });
    }

    if (closeBtn && sidebar && overlay) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('show');
        });
    }

    // Global Navbar search (filters active devices on device page dynamically)
    const searchEl = document.getElementById('global-device-search');
    if (searchEl) {
        searchEl.addEventListener('input', (e) => {
            const val = e.target.value;
            // If operator is on another page, direct to device manager with query
            if (currentRoute !== '#device-mgmt') {
                window.location.hash = `#device-mgmt?search=${encodeURIComponent(val)}`;
            } else {
                // If already on device page, inject value into filter search and dispatch event
                const filterInput = document.getElementById('dev-filter-search');
                if (filterInput) {
                    filterInput.value = val;
                    filterInput.dispatchEvent(new Event('input'));
                }
            }
        });
    }

    // Bind ack alert actions from navbar notifications bell
    document.querySelectorAll('.alert-ack-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            store.dismissAlert(id);
        });
    });

    const clearAllBtn = document.getElementById('clear-all-alerts-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            store.clearAllAlerts();
        });
    }
}

// ----------------------------------------------------------------------
// View Specific Inits (Login, Register Validation)
// ----------------------------------------------------------------------
function initLogin(state) {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const errorContainer = document.getElementById('auth-error-container');

        const submitBtn = form.querySelector('button[type="submit"]');
        const origText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Authorizing...';

        const result = await store.login(email, pass);
        if (result.success) {
            window.location.hash = '#dashboard';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerText = origText;
            if (errorContainer) {
                errorContainer.innerText = result.message;
                errorContainer.classList.remove('d-none');
            }
        }
    });
}

function initRegister(state) {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const pass = document.getElementById('register-password').value;
        const confirmPass = document.getElementById('register-confirm-password').value;
        const errorContainer = document.getElementById('auth-error-container');

        if (pass.length < 6) {
            if (errorContainer) {
                errorContainer.innerText = 'Password must be at least 6 characters.';
                errorContainer.classList.remove('d-none');
            }
            return;
        }

        if (pass !== confirmPass) {
            if (errorContainer) {
                errorContainer.innerText = 'Passwords do not match.';
                errorContainer.classList.remove('d-none');
            }
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const origText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating Node...';

        const result = await store.register(email, name, pass);
        if (result.success) {
            window.location.hash = '#dashboard';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerText = origText;
            if (errorContainer) {
                errorContainer.innerText = result.message;
                errorContainer.classList.remove('d-none');
            }
        }
    });
}

// ----------------------------------------------------------------------
// Pub/Sub subscription for background simulation ticking
// ----------------------------------------------------------------------
store.subscribe((state) => {
    const route = routes[currentRoute];
    
    // Do not sync if on Landing or Login/Register pages
    if (!route || !route.isAuth) return;

    // 1. Smoothly update global Sidebar notifications badge
    const sidebar = document.getElementById('sidebar-container');
    if (sidebar) {
        // Redraw sidebar navigation badges or clear-btn to avoid layout flashes
        const activeAlertsBadge = state.stats.unackAlerts > 0 
            ? `<span class="badge rounded-pill bg-danger ms-auto px-2 py-1 text-white fw-bold" style="font-size: 0.75rem; box-shadow: 0 0 8px rgba(255, 23, 68, 0.4);">${state.stats.unackAlerts}</span>`
            : '';
        
        // Find alert anchor in menu list
        const alertLink = sidebar.querySelector('a[href="#alerts"]');
        if (alertLink) {
            // Remove previous badge if any
            const prevBadge = alertLink.querySelector('.badge');
            if (prevBadge) prevBadge.remove();
            
            // Add new badge if alerts exist
            if (activeAlertsBadge) {
                alertLink.insertAdjacentHTML('beforeend', activeAlertsBadge);
            }
        }
    }

    // 2. Smoothly update Navbar elements (Alert Count and Alert Bell list dropdown content)
    const navbar = document.getElementById('navbar-container');
    if (navbar) {
        // Update bell red dot indicator
        const bellIcon = navbar.querySelector('#notifyDropdownBtn');
        if (bellIcon) {
            const dot = bellIcon.querySelector('.notification-badge');
            const hasUnread = state.alerts.filter(a => !a.acknowledged).length > 0;
            
            if (hasUnread && !dot) {
                bellIcon.insertAdjacentHTML('beforeend', '<span class="notification-badge"></span>');
            } else if (!hasUnread && dot) {
                dot.remove();
            }
        }

        // Update alert dropdown items
        const notifyList = navbar.querySelector('.notify-list-container');
        if (notifyList) {
            const unreadAlerts = state.alerts.filter(a => !a.acknowledged);
            if (unreadAlerts.length === 0) {
                notifyList.innerHTML = `
                    <div class="p-3 text-center text-secondary small">
                        <i class="bi bi-bell-slash fs-4 d-block mb-1 text-muted"></i>
                        No new alerts
                    </div>
                `;
            } else {
                notifyList.innerHTML = unreadAlerts.slice(0, 4).map(alert => {
                    let badgeClass = 'bg-info';
                    let iconClass = 'bi-info-circle-fill';
                    
                    if (alert.severity === 'critical') {
                        badgeClass = 'bg-danger';
                        iconClass = 'bi-exclamation-octagon-fill';
                    } else if (alert.severity === 'warning') {
                        badgeClass = 'bg-warning text-dark';
                        iconClass = 'bi-exclamation-triangle-fill';
                    }
                    
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
                            <div class="text-secondary text-truncate" style="font-size: 0.75rem;">${alert.message}</div>
                            <div class="text-end mt-1">
                                <button class="btn btn-link p-0 text-info font-outfit border-0 alert-ack-btn" data-id="${alert.id}" style="font-size: 0.75rem; text-decoration: none;">
                                    Acknowledge
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
                
                // Rebind the dynamically drawn ack buttons
                notifyList.querySelectorAll('.alert-ack-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id');
                        store.dismissAlert(id);
                    });
                });
            }
        }
    }

    // 3. Smoothly update active Page Telemetries
    if (route.update) {
        route.update(state);
    }
});

// Route change event listener to handle internal link triggers
window.addEventListener('iotinfo-route-changed', router);
window.addEventListener('hashchange', router);
window.addEventListener('load', router);
