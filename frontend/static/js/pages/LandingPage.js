/* ==========================================================================
   IoT InFo Landing Page View
   ========================================================================== */

export function renderLandingPage(state) {
    return `
        <div class="landing-hero min-height-100vh d-flex flex-column">
            <!-- Landing Header Nav -->
            <nav class="navbar navbar-expand-lg navbar-dark bg-transparent py-3 border-bottom" style="border-color: rgba(255, 255, 255, 0.05) !important;">
                <div class="container">
                    <a class="navbar-brand d-flex align-items-center" href="#">
                        <i class="bi bi-lightning-charge-fill text-info me-2 fs-3" style="filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.6));"></i>
                        <span class="font-outfit fw-bold tracking-wide text-uppercase fs-4 text-white">IoT <span class="text-info">InFo</span></span>
                    </a>
                    <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#landingNav" aria-controls="landingNav" aria-expanded="false" aria-label="Toggle navigation">
                        <i class="bi bi-list fs-2 text-white"></i>
                    </button>
                    <div class="collapse navbar-collapse" id="landingNav">
                        <ul class="navbar-nav mx-auto mb-2 mb-lg-0 gap-3 font-outfit fw-medium">
                            <li class="nav-item"><a class="nav-link text-white-50 hover-white" href="#features">Features</a></li>
                            <li class="nav-item"><a class="nav-link text-white-50 hover-white" href="#specs">Specifications</a></li>
                            <li class="nav-item"><a class="nav-link text-white-50 hover-white" href="#pricing">Pricing</a></li>
                            <li class="nav-item"><a class="nav-link text-white-50 hover-white" href="#contact">Contact</a></li>
                        </ul>
                        <div class="d-flex align-items-center gap-3">
                            <a href="#login" class="btn btn-link text-info text-decoration-none font-outfit fw-semibold px-3">Log In</a>
                            <a href="#register" class="btn btn-neon-cyan font-outfit px-4 py-2">Get Started</a>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Landing Hero Section -->
            <div class="container my-auto py-5 position-relative z-1">
                <div class="row align-items-center g-5">
                    <div class="col-lg-6 text-center text-lg-start">
                        <div class="badge bg-info bg-opacity-10 text-info font-outfit px-3 py-2 text-uppercase fw-bold mb-4 border border-info border-opacity-25" style="letter-spacing: 0.08em; font-size: 0.75rem;">
                            🚀 State-of-the-Art Core Telemetry Engine
                        </div>
                        <h2 class="display-3 font-outfit fw-extrabold text-white lh-sm mb-4">
                            Connect. Monitor.<br>
                            <span class="text-gradient-cyan">Control your IoT Fleet</span>
                        </h2>
                        <p class="lead text-secondary font-inter mb-5" style="max-width: 500px; line-height: 1.6;">
                            IoT InFo provides a professional, lightning-fast dark-themed dashboard to track sensor analytics, configure automated device alerts, and export telemetry metrics.
                        </p>
                        <div class="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-3">
                            <a href="#login" class="btn btn-neon-cyan btn-lg font-outfit px-4 py-3 fs-6 d-flex align-items-center justify-content-center">
                                Launch Live Dashboard <i class="bi bi-arrow-right-short ms-2 fs-4"></i>
                            </a>
                            <a href="#features" class="btn btn-outline-neon btn-lg font-outfit px-4 py-3 fs-6 d-flex align-items-center justify-content-center">
                                View Capabilities
                            </a>
                        </div>
                    </div>
                    
                    <div class="col-lg-6">
                        <!-- Hero Preview Cards / Mock Visualizer -->
                        <div class="position-relative">
                            <div class="landing-glow-blob"></div>
                            <div class="glass-card p-4 mx-auto" style="max-width: 500px; transform: rotate(-1.5deg);">
                                <div class="d-flex justify-content-between align-items-center pb-3 border-bottom" style="border-color: rgba(255, 255, 255, 0.08) !important;">
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="glow-dot online"></span>
                                        <h6 class="mb-0 font-outfit fw-bold text-white text-uppercase tracking-wider" style="font-size: 0.8rem;">Live Node Stream</h6>
                                    </div>
                                    <span class="badge bg-secondary font-outfit text-white-50 fw-bold" style="font-size: 0.65rem;">ID: PL-912</span>
                                </div>
                                <div class="py-4 row g-3">
                                    <div class="col-6">
                                        <div class="text-secondary small font-outfit text-uppercase tracking-wide">Core Temp</div>
                                        <h3 class="font-outfit fw-bold text-info my-1">42.8°C</h3>
                                        <div class="text-success small"><i class="bi bi-arrow-up-short"></i> Normal limits</div>
                                    </div>
                                    <div class="col-6">
                                        <div class="text-secondary small font-outfit text-uppercase tracking-wide">Flow Pressure</div>
                                        <h3 class="font-outfit fw-bold text-warning my-1">4.2 bar</h3>
                                        <div class="text-warning small"><i class="bi bi-dash"></i> Steady</div>
                                    </div>
                                    <div class="col-12 mt-3">
                                        <div class="text-secondary small font-outfit text-uppercase tracking-wide mb-2">Vibration Spectrum</div>
                                        <div class="d-flex align-items-end gap-1.5" style="height: 50px;">
                                            <div class="bg-info bg-opacity-75 rounded-top w-100" style="height: 30%;"></div>
                                            <div class="bg-info bg-opacity-75 rounded-top w-100" style="height: 55%;"></div>
                                            <div class="bg-cyan bg-opacity-75 rounded-top w-100" style="height: 85%;"></div>
                                            <div class="bg-info bg-opacity-75 rounded-top w-100" style="height: 40%;"></div>
                                            <div class="bg-info bg-opacity-75 rounded-top w-100" style="height: 65%;"></div>
                                            <div class="bg-danger rounded-top w-100" style="height: 90%;"></div>
                                            <div class="bg-info bg-opacity-75 rounded-top w-100" style="height: 45%;"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="pt-3 border-top d-flex justify-content-between align-items-center" style="border-color: rgba(255, 255, 255, 0.08) !important;">
                                    <span class="small text-secondary">Telemetry cycle: 2.5s</span>
                                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style="font-size: 0.7rem;">CALIBRATED</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Bar -->
            <div class="border-top" style="border-color: rgba(255, 255, 255, 0.05) !important; background: rgba(11, 15, 25, 0.5);">
                <div class="container py-4">
                    <div class="row g-4 text-center">
                        <div class="col-6 col-md-3">
                            <h4 class="font-outfit fw-bold text-white mb-0 fs-3 text-gradient-cyan">99.98%</h4>
                            <small class="text-secondary text-uppercase tracking-wide" style="font-size: 0.75rem;">Guaranteed Uptime</small>
                        </div>
                        <div class="col-6 col-md-3">
                            <h4 class="font-outfit fw-bold text-white mb-0 fs-3 text-gradient-purple">4.8M+</h4>
                            <small class="text-secondary text-uppercase tracking-wide" style="font-size: 0.75rem;">Packets Per Day</small>
                        </div>
                        <div class="col-6 col-md-3">
                            <h4 class="font-outfit fw-bold text-white mb-0 fs-3 text-gradient-orange">&lt; 15ms</h4>
                            <small class="text-secondary text-uppercase tracking-wide" style="font-size: 0.75rem;">Message Latency</small>
                        </div>
                        <div class="col-6 col-md-3">
                            <h4 class="font-outfit fw-bold text-white mb-0 fs-3">50K+</h4>
                            <small class="text-secondary text-uppercase tracking-wide" style="font-size: 0.75rem;">Hardware Nodes</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <section id="features" class="py-5" style="background-color: #0f1422;">
            <div class="container py-5">
                <div class="text-center mb-5">
                    <h2 class="font-outfit fw-bold text-white text-uppercase tracking-wide">Consolidated Core Features</h2>
                    <p class="text-secondary" style="max-width: 500px; margin: 0.5rem auto 0 auto;">Designed to satisfy demanding industrial telemetry metrics.</p>
                </div>
                
                <div class="row g-4 mt-2">
                    <div class="col-md-4">
                        <div class="glass-card p-4 h-100">
                            <i class="bi bi-activity text-info fs-1 mb-3 d-block"></i>
                            <h4 class="font-outfit fw-bold text-white mb-2">Live Telemetry</h4>
                            <p class="text-secondary mb-0">Dynamic dashboards showing sensor analytics, temperature charts, and status metrics on a periodic update cycle.</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card p-4 h-100">
                            <i class="bi bi-shield-lock-fill text-purple fs-1 mb-3 d-block" style="color: var(--neon-purple);"></i>
                            <h4 class="font-outfit fw-bold text-white mb-2">API Authentications</h4>
                            <p class="text-secondary mb-0">Secure key manager enabling you to provision, edit, and clear auth endpoints easily for your microservices.</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card p-4 h-100">
                            <i class="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3 d-block"></i>
                            <h4 class="font-outfit fw-bold text-white mb-2">Glow Alerts Grid</h4>
                            <p class="text-secondary mb-0">Intelligent alerts engine generating warnings instantly when hardware sensors breach preset physical thresholds.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="py-4 border-top" style="border-color: rgba(255, 255, 255, 0.05) !important; background-color: var(--bg-dark);">
            <div class="container text-center text-secondary small">
                <p class="mb-0">&copy; 2026 IoT InFo Technologies Inc. All rights reserved. Built with Bootstrap 5 and Glassmorphism design system.</p>
            </div>
        </footer>
    `;
}
