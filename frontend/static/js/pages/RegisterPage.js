/* ==========================================================================
   IoT InFo Register Page View
   ========================================================================== */

export function renderRegisterPage() {
    return `
        <div class="auth-page-wrapper">
            <div class="glass-card p-4 auth-card">
                
                <!-- Logo Header -->
                <div class="text-center mb-4">
                    <a href="#" class="d-inline-flex align-items-center text-decoration-none text-white mb-2">
                        <i class="bi bi-lightning-charge-fill text-info me-2 fs-2" style="filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.6));"></i>
                        <span class="font-outfit fw-bold tracking-wide text-uppercase fs-3">IoT <span class="text-info">InFo</span></span>
                    </a>
                    <h5 class="text-white font-outfit fw-bold">Provision New Operator</h5>
                    <p class="text-secondary small">Register administrator profile credentials</p>
                </div>

                <!-- Error Container -->
                <div id="auth-error-container" class="d-none alert alert-danger bg-danger bg-opacity-10 text-danger border-danger border-opacity-25 small mb-3 py-2 px-3"></div>

                <!-- Register Form -->
                <form id="register-form">
                    <div class="mb-3">
                        <label for="register-name" class="form-label text-secondary small font-outfit text-uppercase fw-bold tracking-wide">Full Name</label>
                        <input type="text" class="form-control form-control-dark" id="register-name" required placeholder="Alex Mercer">
                    </div>

                    <div class="mb-3">
                        <label for="register-email" class="form-label text-secondary small font-outfit text-uppercase fw-bold tracking-wide">Operator Email</label>
                        <input type="email" class="form-control form-control-dark" id="register-email" required placeholder="name@company.com">
                    </div>
                    
                    <div class="mb-3">
                        <label for="register-password" class="form-label text-secondary small font-outfit text-uppercase fw-bold tracking-wide">Password</label>
                        <input type="password" class="form-control form-control-dark" id="register-password" required placeholder="Min 6 characters">
                    </div>

                    <div class="mb-4">
                        <label for="register-confirm-password" class="form-label text-secondary small font-outfit text-uppercase fw-bold tracking-wide">Confirm Password</label>
                        <input type="password" class="form-control form-control-dark" id="register-confirm-password" required placeholder="Re-enter password">
                    </div>

                    <div class="mb-4 form-check">
                        <input type="checkbox" class="form-check-input bg-dark border-secondary" id="register-agree" required>
                        <label class="form-check-label text-secondary small" for="register-agree">
                            I accept the security telemetry agreement protocols
                        </label>
                    </div>

                    <button type="submit" class="btn btn-neon-cyan w-100 py-2.5 font-outfit text-uppercase tracking-wider fw-bold mb-3" style="font-size: 0.85rem;">
                        Provision Operator
                    </button>
                </form>

                <div class="text-center mt-3">
                    <span class="text-secondary small">Already have a terminal key?</span>
                    <a href="#login" class="text-info small text-decoration-none font-outfit fw-bold ms-1">Sign In</a>
                </div>

            </div>
        </div>
    `;
}
