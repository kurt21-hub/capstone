/**
 * Section picker — converts any <select class="section-picker"> into a compact
 * custom dropdown that shows ~7 options at a time and scrolls for the rest.
 *
 * The original select stays in the DOM (hidden) so existing form code can keep
 * reading `select.value`. The visible list is rebuilt from the select's
 * current options every time the dropdown opens, so options can be populated
 * or replaced asynchronously at any time.
 *
 * If code changes select.value programmatically, dispatch a 'change' event on
 * the select so the visible label updates:
 *   sel.value = 'B'; sel.dispatchEvent(new Event('change'));
 */
(function () {
    const PICKER_CSS = `
.section-picker-wrap { position: relative; width: 100%; }
.sp-toggle {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; width: 100%; text-align: left; cursor: pointer;
}
.sp-toggle::after { content: '\\25BE'; font-size: 0.75em; opacity: 0.7; }
.sp-toggle.sp-placeholder { opacity: 0.6; }
.sp-list {
    position: fixed;
    max-height: 238px; overflow-y: auto;
    background: #fff; color: #1a1a2e;
    border-radius: 10px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
    z-index: 9999; display: none;
}
.sp-list.open { display: block; }
.sp-item { padding: 8px 14px; font-size: 0.9rem; font-family: 'Nunito', sans-serif; cursor: pointer; }
.sp-item:hover { background: #eef2ff; }
.sp-item.selected { background: #dbe4ff; font-weight: 700; }
.sp-list::-webkit-scrollbar { width: 6px; }
.sp-list::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.25); border-radius: 3px; }
`;

    function enhance(sel) {
        if (sel.dataset.pickerReady === '1') return;
        sel.dataset.pickerReady = '1';

        const placeholder = sel.dataset.placeholder || 'Select section';
        const wrap = document.createElement('div');
        wrap.className = 'section-picker-wrap';

        const btn = document.createElement('button');
        btn.type = 'button';
        // Reuse the host page's select styling (e.g. .form-select) on the toggle
        btn.className = (sel.className.replace(/\bsection-picker\b/g, '').trim() + ' sp-toggle').trim();

        const list = document.createElement('div');
        list.className = 'sp-list';

        function refreshLabel() {
            const opt = sel.options[sel.selectedIndex];
            if (sel.value && opt) {
                btn.textContent = opt.textContent;
                btn.classList.remove('sp-placeholder');
            } else {
                btn.textContent = placeholder;
                btn.classList.add('sp-placeholder');
            }
        }

        function refreshSelected() {
            list.querySelectorAll('.sp-item').forEach(item => {
                item.classList.toggle('selected', item.dataset.value === sel.value);
            });
        }

        function close() {
            list.classList.remove('open');
        }

        function rebuildItems() {
            list.innerHTML = '';
            Array.from(sel.options).forEach(opt => {
                const item = document.createElement('div');
                item.className = 'sp-item';
                item.dataset.value = opt.value;
                item.textContent = opt.textContent;
                if (opt.value === sel.value) item.classList.add('selected');
                item.addEventListener('click', () => {
                    sel.value = opt.value;
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                    refreshLabel();
                    refreshSelected();
                    close();
                });
                list.appendChild(item);
            });
        }
        rebuildItems();

        const LIST_MAX_HEIGHT = 238;

        function positionList() {
            const rect = btn.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            list.style.left = rect.left + 'px';
            list.style.width = rect.width + 'px';
            if (spaceBelow < LIST_MAX_HEIGHT + 8 && rect.top > LIST_MAX_HEIGHT + 8) {
                list.style.top = '';
                list.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
            } else {
                list.style.bottom = '';
                list.style.top = (rect.bottom + 4) + 'px';
            }
        }

        btn.addEventListener('click', () => {
            if (list.classList.contains('open')) {
                close();
                return;
            }
            rebuildItems(); // pick up options added/removed after init
            positionList();
            list.classList.add('open');
            const selItem = list.querySelector('.sp-item.selected');
            if (selItem) selItem.scrollIntoView({ block: 'nearest' });
        });

        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target) && !list.contains(e.target)) close();
        });

        // Repositioning on every scroll frame is fragile — just close instead,
        // but ignore scrolls inside the list itself so options stay scrollable.
        document.addEventListener('scroll', (e) => {
            if (!list.contains(e.target)) close();
        }, true);
        window.addEventListener('resize', close);

        sel.addEventListener('change', () => {
            refreshLabel();
            refreshSelected();
        });

        sel.style.display = 'none';
        sel.parentNode.insertBefore(wrap, sel.nextSibling);
        wrap.appendChild(btn);
        wrap.appendChild(list);

        refreshLabel();
        refreshSelected();
    }

    function init() {
        const style = document.createElement('style');
        style.textContent = PICKER_CSS;
        document.head.appendChild(style);
        document.querySelectorAll('select.section-picker').forEach(enhance);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
