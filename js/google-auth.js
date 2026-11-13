/**
 * MotoMaster Google Sign-In helper.
 *
 * Usage on a page that already has custom-styled Google buttons:
 *   <script src="js/google-auth.js"></script>
 *   <script>
 *     MotoMasterGoogleAuth.init({
 *       role: 'student',               // 'student' | 'teacher' | 'admin'
 *       buttons: ['googleBtn'],        // element ids (or elements)
 *       errorId: 'loginError',         // optional error element
 *     });
 *   </script>
 *
 * A real (but invisible) Google-rendered button is overlaid on each custom
 * button, so clicking it opens the genuine Google account chooser. The
 * returned ID token is verified by google_auth.php on the server.
 */
(function (global) {
    'use strict';

    var GSI_SRC = 'https://accounts.google.com/gsi/client';

    var ROLE_CONFIG = {
        student: { storageKey: 'motomasterStudent', payloadKey: 'student', redirect: 'feature.html' },
        teacher: { storageKey: 'motomasterTeacher', payloadKey: 'teacher', redirect: 'teacherdash.html' },
        admin: { storageKey: 'motomasterAdmin', payloadKey: 'admin', redirect: 'admindash.html' }
    };

    var gsiLoadPromise = null;

    function loadGsi() {
        if (global.google && global.google.accounts && global.google.accounts.id) {
            return Promise.resolve();
        }
        if (!gsiLoadPromise) {
            gsiLoadPromise = new Promise(function (resolve, reject) {
                var s = document.createElement('script');
                s.src = GSI_SRC;
                s.async = true;
                s.defer = true;
                s.onload = resolve;
                s.onerror = function () { reject(new Error('gsi load failed')); };
                document.head.appendChild(s);
            });
        }
        return gsiLoadPromise;
    }

    function showError(opts, message) {
        if (typeof opts.onError === 'function') {
            opts.onError(message);
            return;
        }
        var el = null;
        if (opts.errorId) {
            el = document.getElementById(opts.errorId);
        }
        if (!el) {
            el = document.getElementById('loginError') || document.getElementById('signupError');
        }
        if (el) {
            el.textContent = message;
            el.classList.add('show');
        } else {
            alert(message);
        }
    }

    function sendCredential(opts, credential) {
        var cfg = ROLE_CONFIG[opts.role];
        var body = { credential: credential, role: opts.role };
        // Pages with a section picker (student signup) pass its value through
        // so a first-time Google account lands in a real class section.
        if (opts.sectionId) {
            var secEl = document.getElementById(opts.sectionId);
            var sec = secEl ? String(secEl.value || '').trim().toUpperCase() : '';
            if (opts.requireSection && !/^[A-Z]$/.test(sec)) {
                showError(opts, 'Please select your section.');
                return;
            }
            if (/^[A-Z]$/.test(sec)) {
                body.section = sec;
            }
        }
        fetch('google_auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
            .then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (data) {
                    return { ok: res.ok, data: data };
                });
            })
            .then(function (result) {
                var data = result.data || {};
                if (result.ok && data.success) {
                    var payload = data[cfg.payloadKey];
                    if (payload) {
                        try {
                            var serialized = JSON.stringify(payload);
                            sessionStorage.setItem(cfg.storageKey, serialized);
                            localStorage.setItem(cfg.storageKey, serialized);
                        } catch (e) { /* storage unavailable — session cookie still works */ }
                    }
                    global.location.href = data.redirect || cfg.redirect;
                    return;
                }
                showError(opts, data.message || 'Google sign-in failed. Please try again.');
            })
            .catch(function () {
                showError(opts, 'Network or server error during Google sign-in.');
            });
    }

    function attachOverlay(btn, opts) {
        if (btn.dataset.mmGoogleAttached === '1') {
            return;
        }
        btn.dataset.mmGoogleAttached = '1';

        if (getComputedStyle(btn).position === 'static') {
            btn.style.position = 'relative';
        }
        var host = document.createElement('div');
        host.className = 'mm-google-overlay';
        host.style.cssText =
            'position:absolute;inset:0;z-index:5;display:flex;align-items:center;' +
            'justify-content:center;overflow:hidden;opacity:0.02;';
        btn.appendChild(host);

        var width = Math.max(160, Math.min(400, Math.round(btn.offsetWidth) || 240));
        global.google.accounts.id.renderButton(host, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: width
        });
    }

    function init(opts) {
        opts = opts || {};
        var role = String(opts.role || 'student').toLowerCase();
        if (!ROLE_CONFIG[role]) {
            console.error('MotoMasterGoogleAuth: unknown role "' + role + '"');
            return;
        }
        opts.role = role;

        var ids = Array.isArray(opts.buttons) ? opts.buttons : [opts.buttons];
        var buttons = ids
            .map(function (b) { return typeof b === 'string' ? document.getElementById(b) : b; })
            .filter(Boolean);
        if (!buttons.length) {
            return;
        }

        fetch('google_client_id.php', { cache: 'no-store' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var clientId = data && data.configured ? data.client_id : '';

                if (!clientId) {
                    buttons.forEach(function (btn) {
                        btn.addEventListener('click', function (ev) {
                            ev.preventDefault();
                            showError(opts, 'Google sign-in is not configured yet. Add your Google Client ID in google_config.php.');
                        });
                    });
                    return;
                }

                loadGsi()
                    .then(function () {
                        global.google.accounts.id.initialize({
                            client_id: clientId,
                            callback: function (response) {
                                if (response && response.credential) {
                                    sendCredential(opts, response.credential);
                                }
                            }
                        });
                        buttons.forEach(function (btn) { attachOverlay(btn, opts); });
                    })
                    .catch(function () {
                        buttons.forEach(function (btn) {
                            btn.addEventListener('click', function (ev) {
                                ev.preventDefault();
                                showError(opts, 'Could not load Google sign-in. Check your internet connection.');
                            });
                        });
                    });
            })
            .catch(function () {
                buttons.forEach(function (btn) {
                    btn.addEventListener('click', function (ev) {
                        ev.preventDefault();
                        showError(opts, 'Could not reach the server. Make sure Apache is running.');
                    });
                });
            });
    }

    global.MotoMasterGoogleAuth = { init: init };
})(window);
