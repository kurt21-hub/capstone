/**
 * Practice Progress Manager
 * Handles loading and saving practice simulation progress per user account
 */

const PracticeProgress = {
    _guardLoaded: false,
    ensureGuardLoaded() {
        if (this._guardLoaded) return;
        this._guardLoaded = true;

        if (window.MotoMasterSecurityGuard) {
            window.MotoMasterSecurityGuard.init();
            return;
        }

        if (document.querySelector('script[data-motomaster-security="true"]')) {
            return;
        }

        const guardScript = document.createElement('script');
        guardScript.src = 'js/security-guard.js';
        guardScript.defer = true;
        guardScript.dataset.motomasterSecurity = 'true';
        guardScript.onload = () => window.MotoMasterSecurityGuard && window.MotoMasterSecurityGuard.init();
        document.head.appendChild(guardScript);
    },

    // Configuration
    config: {
        saveEndpoint: 'save_practice_simulation.php',
        loadEndpoint: 'get_practice_progress.php',
        defaultTitle: 'Battery Maintenance'
    },

    /**
     * Get logged in student info from localStorage or session
     */
    getStudentInfo() {
        this.ensureGuardLoaded();
        const motomaster =
            localStorage.getItem('motomasterStudent') ||
            sessionStorage.getItem('motomasterStudent');
        if (motomaster) {
            try {
                return JSON.parse(motomaster);
            } catch (e) {
                console.warn('Failed to parse motomasterStudent');
            }
        }

        const student = localStorage.getItem('loggedInStudent');
        if (student) {
            try {
                return JSON.parse(student);
            } catch (e) {
                console.warn('Failed to parse student from localStorage');
            }
        }

        // Try alternative keys
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const parsed = JSON.parse(user);
                return {
                    student_id: parsed.student_id || parsed.id,
                    email: parsed.email,
                    name: parsed.name || parsed.full_name
                };
            } catch (e) {
                console.warn('Failed to parse user from localStorage');
            }
        }

        // Check for email only
        const email = localStorage.getItem('studentEmail') || localStorage.getItem('userEmail');
        if (email) {
            return { email: email };
        }

        return null;
    },

    /**
     * Load saved progress from database
     */
    async loadProgress(title = this.config.defaultTitle) {
        const student = this.getStudentInfo();
        const params = new URLSearchParams({ title: title });
        
        // Add student_id if available
        if (student && student.student_id) {
            params.append('student_id', student.student_id);
        }

        try {
            const response = await fetch(`${this.config.loadEndpoint}?${params}`);
            const data = await response.json();

            if (data.success) {
                console.log('PracticeProgress: Loaded progress', data);
                return data;
            } else {
                console.warn('PracticeProgress: Failed to load progress', data.message);
                return null;
            }
        } catch (error) {
            console.error('PracticeProgress: Error loading progress', error);
            return null;
        }
    },

    /**
     * Save progress to database
     */
    async saveProgress(progressData) {
        const student = this.getStudentInfo();
        const payload = {
            title: progressData.title || this.config.defaultTitle,
            score: progressData.score || 0,
            completion_status: progressData.completion_status || 'In Progress',
            time_elapsed_seconds: progressData.time_elapsed_seconds || 0,
            current_step_index: progressData.current_step_index ?? null,
            step_instr_done: progressData.step_instr_done ?? null,
            battery_needs_replacement: progressData.battery_needs_replacement ?? null,
            scene_state: progressData.scene_state ?? null,
            steps: progressData.steps || []
        };

        // Include student identity so the backend can save even without a PHP session
        if (student && student.student_id) {
            payload.student_id = student.student_id;
        }
        if (student) {
            payload.student = student;
        }

        try {
            const response = await fetch(this.config.saveEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                console.log('PracticeProgress: Saved progress', data);
            } else {
                console.warn('PracticeProgress: Failed to save progress', data.message);
            }

            return data;
        } catch (error) {
            console.error('PracticeProgress: Error saving progress', error);
            return { success: false, message: error.message };
        }
    },

    /**
     * Transform simulation tracker data to steps payload
     */
    transformTrackerData(simulationTracker, stepTitles) {
        return simulationTracker.steps.map((step, index) => ({
            step_index: index,
            title: step.title || stepTitles[index] || `Step ${index + 1}`,
            correct_actions: step.correct || [],
            mistake_actions: step.mistakes || [],
            correct_count: (step.correct || []).length,
            mistake_count: (step.mistakes || []).length,
            score: this.calculateStepScore(step)
        }));
    },

    /**
     * Calculate score for a step
     */
    calculateStepScore(step) {
        const correct = (step.correct || []).length;
        const mistakes = (step.mistakes || []).length;
        const total = correct + mistakes;

        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    },

    /**
     * Calculate overall score from steps
     */
    calculateOverallScore(steps) {
        if (!steps || steps.length === 0) return 0;

        const totalScore = steps.reduce((sum, step) => {
            return sum + this.calculateStepScore(step);
        }, 0);

        return Math.round(totalScore / steps.length);
    },

    /**
     * Record an action (correct or mistake) to the tracker
     */
    recordAction(tracker, stepIndex, type, message) {
        if (!tracker || !tracker.steps || stepIndex < 0 || stepIndex >= tracker.steps.length) {
            console.warn('PracticeProgress: Invalid tracker or step index');
            return false;
        }

        const step = tracker.steps[stepIndex];
        const timestamp = new Date().toISOString();
        const entry = {
            message: message,
            timestamp: timestamp,
            action_id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        if (type === 'correct') {
            step.correct.push(entry);
        } else if (type === 'mistake') {
            step.mistakes.push(entry);
        }

        return true;
    },

    /**
     * Restore progress from saved data into the simulation tracker
     */
    restoreProgress(savedData, tracker) {
        if (!savedData || !savedData.steps || !tracker || !tracker.steps) {
            console.warn('PracticeProgress: Cannot restore - missing data');
            return false;
        }

        savedData.steps.forEach((savedStep, index) => {
            if (index < tracker.steps.length) {
                tracker.steps[index].correct = savedStep.correct_actions || savedStep.correct || [];
                tracker.steps[index].mistakes = savedStep.mistake_actions || savedStep.mistakes || [];
            }
        });

        console.log('PracticeProgress: Restored progress to tracker', tracker);
        return true;
    },

    /**
     * Get progress summary for display
     */
    getSummary(tracker) {
        if (!tracker || !tracker.steps) return null;

        const steps = tracker.steps.map((step, index) => ({
            step_index: index,
            title: step.title,
            correct_count: (step.correct || []).length,
            mistake_count: (step.mistakes || []).length,
            score: this.calculateStepScore(step)
        }));

        const overallScore = this.calculateOverallScore(tracker.steps);
        const totalCorrect = steps.reduce((sum, s) => sum + s.correct_count, 0);
        const totalMistakes = steps.reduce((sum, s) => sum + s.mistake_count, 0);

        return {
            overall_score: overallScore,
            total_steps: steps.length,
            total_correct: totalCorrect,
            total_mistakes: totalMistakes,
            steps: steps,
            status: overallScore >= 90 ? 'Excellent' :
                overallScore >= 75 ? 'Good' :
                    overallScore >= 60 ? 'Needs Work' : 'Review Again'
        };
    }
};

/**
 * Practice Access Gate
 * A practice simulation may only open when its learning module has been fully
 * read (progress >= 100), or when the student already has a saved simulation
 * record — once unlocked it stays unlocked, even if the module is re-read.
 */
const PracticeAccessGate = {
    pageRules: {
        'practicearea_engine.html': { moduleKey: 'mod_progress_enginemodule', title: 'Engine Oil Change' },
        'practicearea_brake.html': { moduleKey: 'mod_progress_brakemodule', title: 'Brake Pad Replacement' },
        'practicearea_air.html': { moduleKey: 'mod_progress_airmodule', title: 'Air Filter Replacement' },
        'practicearea_fuel.html': { moduleKey: 'mod_progress_fuelmodule', title: 'Fuel Filter Replacement' },
        'practicearea_battery.html': { moduleKey: 'mod_progress_batterymodule', title: 'Battery Maintenance' },
        'practicearea_spark.html': { moduleKey: 'mod_progress_sparkmodule', title: 'Spark Plug Replacement' }
    },

    redirectToHub() {
        window.location.replace('practicetasks.html');
    },

    async enforce() {
        const page = (window.location.pathname.split('/').pop() || '').toLowerCase();
        const rule = this.pageRules[page];
        if (!rule) return;

        // Module fully read -> allowed
        try {
            const res = await fetch('student_progress.php');
            const data = await res.json();
            if (data.success && data.progress && (data.progress[rule.moduleKey] || 0) >= 100) {
                return;
            }
        } catch (e) {
            console.warn('PracticeAccessGate: module progress check failed', e);
        }

        // Existing practice record keeps the sim unlocked
        try {
            const student = PracticeProgress.getStudentInfo();
            if (student) {
                const params = new URLSearchParams({ title: rule.title });
                if (student.student_id) params.append('student_id', student.student_id);
                if (student.email) params.append('email', student.email);
                const res = await fetch(`get_practice_progress.php?${params}`);
                const data = await res.json();
                if (data.success && data.current_progress) {
                    return;
                }
            }
        } catch (e) {
            console.warn('PracticeAccessGate: practice record check failed', e);
        }

        this.redirectToHub();
    }
};

PracticeAccessGate.enforce();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PracticeProgress;
}
