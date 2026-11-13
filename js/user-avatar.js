/**
 * User Avatar Manager
 * Applies the logged-in user's profile photo to every avatar slot on the page,
 * and the user's registered name to every name slot. Falls back to
 * images/userprofile.jpg when no custom photo is set, and syncs the stored
 * user object with the database so all pages stay consistent.
 */
(function (window) {
    const DEFAULT_AVATAR = 'images/userprofile.jpg';
    const STORAGE_KEYS = ['motomasterStudent', 'motomasterTeacher', 'motomasterAdmin'];
    const AVATAR_SELECTOR = '.nav-avatar img, img[data-user-avatar]';
    const NAME_SELECTOR = '.nav-user-name, [data-user-name]';

    function getStoredUser() {
        for (const key of STORAGE_KEYS) {
            const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (!raw) continue;
            try {
                const user = JSON.parse(raw);
                if (user && typeof user === 'object') {
                    return { key, user };
                }
            } catch (e) {
                // Ignore malformed stored data.
            }
        }
        return null;
    }

    function persistUser(storageKey, user) {
        const serialized = JSON.stringify(user);
        if (localStorage.getItem(storageKey)) {
            localStorage.setItem(storageKey, serialized);
        }
        if (sessionStorage.getItem(storageKey)) {
            sessionStorage.setItem(storageKey, serialized);
        }
    }

    function displayName(user) {
        const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
        return full || (typeof user.name === 'string' ? user.name.trim() : '');
    }

    function applyAvatars(src) {
        document.querySelectorAll(AVATAR_SELECTOR).forEach((img) => {
            img.src = src || DEFAULT_AVATAR;
        });
    }

    function applyName(name) {
        if (!name) return;
        document.querySelectorAll(NAME_SELECTOR).forEach((el) => {
            el.textContent = name;
        });
    }

    function currentPhoto() {
        const stored = getStoredUser();
        return (stored && stored.user.profile_photo) || DEFAULT_AVATAR;
    }

    async function refresh() {
        applyAvatars(currentPhoto());

        const stored = getStoredUser();
        applyName(stored ? displayName(stored.user) : '');

        try {
            const res = await fetch('profile_photo.php');
            if (!res.ok) return;
            const data = await res.json();
            if (!data.success) return;

            if (data.profile_photo) applyAvatars(data.profile_photo);
            if (data.name) applyName(data.name);

            const stored = getStoredUser();
            if (stored) {
                let changed = false;
                if (data.profile_photo && stored.user.profile_photo !== data.profile_photo) {
                    stored.user.profile_photo = data.profile_photo;
                    changed = true;
                }
                if (data.first_name && stored.user.first_name !== data.first_name) {
                    stored.user.first_name = data.first_name;
                    changed = true;
                }
                if (data.last_name && stored.user.last_name !== data.last_name) {
                    stored.user.last_name = data.last_name;
                    changed = true;
                }
                if (changed) persistUser(stored.key, stored.user);
            }
        } catch (e) {
            // Endpoint unavailable — stored/default photo and name already applied.
        }
    }

    window.MotoMasterAvatar = {
        DEFAULT_AVATAR,
        applyAvatars,
        refresh,
    };

    document.addEventListener('DOMContentLoaded', refresh);
    window.addEventListener('pageshow', refresh);
})(window);
