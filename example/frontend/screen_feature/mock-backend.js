/**
 * Thuocare screen_feature — mock backend
 * All features return null or empty collections (no real persistence).
 * Use in browser: <script src="../mock-backend.js"></script> then MockBackend.signIn(...)
 */

(function (global) {
  "use strict";

  /** @returns {{ data: null, error: null }} */
  function nullData() {
    return Promise.resolve({ data: null, error: null });
  }

  /** @returns {{ data: [], error: null }} */
  function emptyList() {
    return Promise.resolve({ data: [], error: null });
  }

  function log(tag, payload) {
    if (typeof console !== "undefined" && console.log) {
      console.log("[MockBackend]", tag, payload !== undefined ? payload : "");
    }
  }

  var MockBackend = {
    // --- Auth (sign-in.md, sign-up.md) ---
    signIn: function (phoneOrEmail, password) {
      log("POST /auth/sign-in", { phoneOrEmail: phoneOrEmail, password: Boolean(password) });
      return nullData();
    },

    signUp: function (payload) {
      log("POST /auth/sign-up", payload);
      return nullData();
    },

    signOut: function () {
      log("POST /auth/sign-out");
      return nullData();
    },

    /** forgot-password.md — recovery request */
    recoverAccount: function (identifier) {
      log("POST /auth/recover", { identifier: identifier });
      return nullData();
    },

    /** Local check for prototype; still returns null user payload */
    findAccountByIdentifier: function (identifier) {
      log("GET /auth/lookup", { identifier: identifier });
      return nullData();
    },

    // --- Session ---
    getSession: function () {
      log("GET /session");
      return nullData();
    },

    setSession: function (_session) {
      log("PUT /session", _session);
      return nullData();
    },

    // --- Onboarding (onboarding-survey.md) ---
    getOnboardingSurvey: function (userId) {
      log("GET /onboarding/survey", { userId: userId });
      return nullData();
    },

    saveOnboardingSurvey: function (userId, answers) {
      log("POST /onboarding/survey", { userId: userId, answers: answers });
      return nullData();
    },

    // --- Home / Today (home.md) ---
    getDailySummary: function (dateIso) {
      log("GET /home/daily-summary", { date: dateIso });
      return nullData();
    },

    getScheduleForDate: function (dateIso) {
      log("GET /home/schedule", { date: dateIso });
      return emptyList();
    },

    markDoseTaken: function (doseId) {
      log("POST /home/doses/taken", { doseId: doseId });
      return nullData();
    },

    snoozeDose: function (doseId, untilIso) {
      log("POST /home/doses/snooze", { doseId: doseId, until: untilIso });
      return nullData();
    },

    // --- Meds (meds.md) ---
    getMedications: function (userId) {
      log("GET /medications", { userId: userId });
      return emptyList();
    },

    getMedsDashboardSummary: function (userId) {
      log("GET /medications/summary", { userId: userId });
      return nullData();
    },

    addMedication: function (userId, medPayload) {
      log("POST /medications", { userId: userId, medPayload: medPayload });
      return nullData();
    },

    // --- Add medication wizard (add-medication.md) ---
    saveAddMedicationDraft: function (userId, stepIndex, partial) {
      log("PUT /medications/add-draft", { userId: userId, step: stepIndex, partial: partial });
      return nullData();
    },

    submitAddMedication: function (userId, fullPayload) {
      log("POST /medications/add-complete", { userId: userId, fullPayload: fullPayload });
      return nullData();
    },

    // --- Me (me.md) ---
    getProfile: function (userId) {
      log("GET /me/profile", { userId: userId });
      return nullData();
    },

    updateSettings: function (userId, settings) {
      log("PUT /me/settings", { userId: userId, settings: settings });
      return nullData();
    },

    // --- Notifications (notifications.md) ---
    listNotifications: function (userId) {
      log("GET /notifications", { userId: userId });
      return emptyList();
    },

    getNotificationPreferences: function (userId) {
      log("GET /notifications/preferences", { userId: userId });
      return nullData();
    },

    markNotificationRead: function (userId, notificationId) {
      log("PATCH /notifications/read", { userId: userId, notificationId: notificationId });
      return nullData();
    },

    // --- Legal placeholder (sign-in.md deferred) ---
    getLegalDocument: function (slug) {
      log("GET /legal", { slug: slug });
      return nullData();
    }
  };

  global.MockBackend = MockBackend;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { MockBackend: MockBackend };
  }
})(typeof window !== "undefined" ? window : globalThis);
