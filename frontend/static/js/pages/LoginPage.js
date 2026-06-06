/* ==========================================================================
   IoT InFo Login Page View
   ========================================================================== */

export function renderLoginPage() {
    return `
        <div class="auth-page-wrapper">
            <div class="glass-card p-4 auth-card">
                
                <!-- Logo Header -->
                <div class="text-center mb-4">
                    <a href="#" class="d-inline-flex align-items-center text-decoration-none text-white mb-2">
                        <i class="bi bi-lightning-charge-fill text-info me-2 fs-2" style="filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.6));"></i>
                        <span class="font-outfit fw-bold tracking-wide text-uppercase fs-3">IoT <span class="text-info">InFo</span></span>
                    </a>
                    <h5 class="text-white font-outfit fw-bold">Operator Control Sign In</h5>
                    <p class="text-secondary small">Access the IoT device monitoring network console</p>
                </div>

                <!-- Alert with Credentials Seed -->
                <div class="alert alert-info bg-info bg-opacity-10 text-info border-info border-opacity-25 small mb-4 py-2.5 px-3" role="alert">
                    <i class="bi bi-info-circle-fill me-1.5"></i>
                    <strong>Demo Mode:</strong> Use <code class="text-white">admin@iotinfo.com</code> & <code class="text-white">admin123</code> to access.
                </div>

                <!-- Error Container -->
                <div id="auth-error-container" class="d-none alert alert-danger bg-danger bg-opacity-10 text-danger border-danger border-opacity-25 small mb-3 py-2 px-3"></div>

                <!-- Login Form -->
                <form id="login-form">
                    <div class="mb-3">
                        <label for="login-email" class="form-label text-secondary small font-outfit text-uppercase fw-bold tracking-wide">Operator Email</label>
                        <input type="email" class="form-control form-control-dark" id="login-email" required placeholder="name@company.com" value="admin@iotinfo.com">
                    </div>
                    
                    <div class="mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <label for="login-password" class="form-label text-secondary small font-outfit text-uppercase fw-bold tracking-wide mb-0">Password</label>
                            <a href="#reset-password" class="text-info small text-decoration-none font-outfit" style="font-size: 0.8rem;">Forgot?</a>
                        </div>
                        <input type="password" class="form-control form-control-dark" id="login-password" required placeholder="••••••••" value="admin123">
                    </div>

                    <div class="mb-4 form-check">
                        <input type="checkbox" class="form-check-input bg-dark border-secondary" id="login-remember" checked>
                        <label class="form-check-label text-secondary small" for="login-remember">Keep console session active</label>
                    </div>

                    <button type="submit" class="btn btn-neon-cyan w-100 py-2.5 font-outfit text-uppercase tracking-wider fw-bold mb-3" style="font-size: 0.85rem;">
                        Authorize Terminal
                    </button>
                </form>

                <div class="text-center mt-3">
                    <span class="text-secondary small">New node administrator?</span>
                    <a href="#register" class="text-info small text-decoration-none font-outfit fw-bold ms-1">Create Account</a>
                </div>

            </div>
        </div>
    `;
}
