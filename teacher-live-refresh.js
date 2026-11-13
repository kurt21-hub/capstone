/*
 * teacher-live-refresh.js
 * Keeps teacher portal data in sync with student work.
 * Each page sets window.TEACHER_REFRESH_FN to the name (or reference)
 * of its data-loading function; this script re-invokes it periodically
 * while the tab is visible, and immediately when the tab regains focus.
 */
(function () {
    var POLL_INTERVAL_MS = 15000; // refresh every 15 seconds
    var MIN_GAP_MS = 3000;        // debounce back-to-back triggers
    var inFlight = false;
    var lastRun = 0;

    function resolveFn() {
        var fn = window.TEACHER_REFRESH_FN;
        if (typeof fn === 'string') {
            fn = window[fn];
        }
        return typeof fn === 'function' ? fn : null;
    }

    function run(force) {
        var now = Date.now();
        if (inFlight || (!force && now - lastRun < MIN_GAP_MS)) return;
        var fn = resolveFn();
        if (!fn) return;
        lastRun = now;
        try {
            var result = fn();
            if (result && typeof result.then === 'function') {
                inFlight = true;
                result.finally(function () { inFlight = false; });
            }
        } catch (e) {
            console.error('Teacher live refresh failed:', e);
        }
    }

    setInterval(function () {
        if (document.visibilityState === 'visible') run(true);
    }, POLL_INTERVAL_MS);

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') run(false);
    });

    window.addEventListener('focus', function () { run(false); });
})();
