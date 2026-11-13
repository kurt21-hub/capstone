/**
 * js/teacher-notif-badge.js
 * Replaces the hardcoded notification badge on teacher pages with the real
 * unread message count and wires the bell button to the notifications page.
 */
(function () {
    async function refreshTeacherBadge() {
        const badge = document.querySelector('.notif-badge');
        const btn = document.querySelector('.notif-btn');

        if (btn && !btn.dataset.wired) {
            btn.dataset.wired = '1';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', () => { location.href = 'teachernotif.html'; });
        }
        if (!badge) return;

        try {
            const res = await fetch('student_messages.php');
            const data = await res.json();
            if (!res.ok || !data.success) { badge.style.display = 'none'; return; }
            const count = Number(data.unread_count) || 0;
            badge.textContent = count;
            badge.style.display = count > 0 ? '' : 'none';
        } catch (err) {
            badge.style.display = 'none';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', refreshTeacherBadge);
    } else {
        refreshTeacherBadge();
    }
    setInterval(refreshTeacherBadge, 30000);
})();
