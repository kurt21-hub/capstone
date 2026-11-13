/**
 * MotoMaster DevTools guard (student pages).
 *
 * Two layers:
 *  1. Blocks the usual keyboard shortcuts and the context menu that open
 *     DevTools, the console, the element inspector, or view-source.
 *  2. Detects an open DevTools (docked via window-size gap, undocked via
 *     a `debugger` timing check) and covers the page with a blocking
 *     overlay until it is closed.
 *
 * This is a deterrent, not real protection: the database records remain
 * the source of truth.
 */
(function () {
    'use strict';

    function cancel(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    /* ── 1. Entry-point blocking ─────────────────────────────────────── */

    document.addEventListener('keydown', function (e) {
        var key = e.key || '';
        var code = e.keyCode || e.which;

        // F12 opens DevTools directly
        if (key === 'F12' || code === 123) return cancel(e);

        var k = key.toLowerCase();

        // Ctrl+Shift+I / J / C / K — DevTools, console, inspector
        if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c', 'k'].indexOf(k) !== -1) return cancel(e);
        // Ctrl+U — view source; Ctrl+S — save page
        if (e.ctrlKey && !e.shiftKey && (k === 'u' || k === 's')) return cancel(e);
        // macOS: Cmd+Opt+I / J / C
        if (e.metaKey && e.altKey && ['i', 'j', 'c'].indexOf(k) !== -1) return cancel(e);
    }, true);

    // Right-click menu is the "Inspect" entry point
    document.addEventListener('contextmenu', function (e) {
        return cancel(e);
    }, true);

    /* ── 2. Open-DevTools detection + blocking overlay ───────────────── */

    var overlay = null;
    function ensureOverlay() {
        if (overlay && overlay.parentNode) return overlay;
        overlay = document.createElement('div');
        overlay.setAttribute('id', 'mm-devtools-blocker');
        overlay.style.cssText =
            'position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,0.62);' +
            'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
            'display:none;align-items:center;justify-content:center;text-align:center;' +
            'padding:32px;color:#e2e8f0;font-family:"Nunito",sans-serif;';
        overlay.innerHTML =
            '<div style="max-width:400px;background:rgba(15,23,42,0.78);' +
            'border:1px solid rgba(148,163,184,0.28);border-radius:16px;' +
            'padding:36px 44px;box-shadow:0 24px 60px rgba(0,0,0,0.55);">' +
            '<h2 style="margin:0 0 8px;font-size:21px;font-weight:800;color:#f8fafc;">Access blocked</h2>' +
            '<p style="margin:0;font-size:14px;line-height:1.6;color:#cbd5e1;">' +
            'Developer tools are not allowed while using MotoMaster.' +
            '</p></div>';
        // Attached to <html> so a deleted <body> can't remove the blocker
        document.documentElement.appendChild(overlay);
        return overlay;
    }

    var blocked = false;
    function setBlocked(open) {
        if (open === blocked) return;
        blocked = open;
        ensureOverlay().style.display = open ? 'flex' : 'none';
    }

    // Docked DevTools eats a chunk of the outer window
    function openBySize() {
        return (window.outerWidth - window.innerWidth > 160) ||
               (window.outerHeight - window.innerHeight > 160);
    }

    // An open console eagerly formats logged objects — reading this getter
    // only happens while DevTools is attached. Catches undocked DevTools
    // even when breakpoints are deactivated.
    var probeEl = document.createElement('div');
    var consoleFlag = false;
    Object.defineProperty(probeEl, 'id', {
        get: function () {
            consoleFlag = true;
            return 'mm-probe';
        }
    });

    function openByConsole() {
        consoleFlag = false;
        console.log(probeEl);
        return consoleFlag;
    }

    function check() {
        var open = openBySize() || openByConsole();
        // `debugger` only pauses while DevTools is open — an undocked or
        // detached instance still trips this timing check.
        var t0 = performance.now();
        debugger;
        if (performance.now() - t0 > 100) open = true;
        setBlocked(open);
    }

    setInterval(check, 1000);
    window.addEventListener('resize', check);
    window.addEventListener('load', check);
    check();
})();
