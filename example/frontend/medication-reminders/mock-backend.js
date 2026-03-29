/**
 * Thuocare Mock Backend Simulator
 * 
 * Provides mock "null" data and structures corresponding to the required features:
 * Auth, Onboarding, Medication tracking, Profiles, and App configurations.
 */

// 1. User & Auth Schema
const mockUsers = [
  {
    id: "user-001",
    fullName: "Nguyễn Văn A",
    phone: "0901234567",
    email: null, // Email is optional
    passwordHash: "mock_hash_x8aj2",
    createdAt: "2026-03-27T10:00:00Z",
    onboardingCompleted: true,
  },
  {
    id: "user-002",
    fullName: "Trần Thị B",
    phone: "0987654321",
    email: "b.tran@example.com",
    passwordHash: "mock_hash_b9f8a",
    createdAt: "2026-03-28T08:30:00Z",
    onboardingCompleted: false,
  }
];

// 2. Onboarding Profile Schema
// Linked to user via userId. Stores survey preferences.
const mockOnboardingProfiles = [
  {
    userId: "user-001",
    forWho: "self", // "self" | "other"
    frequencyEstimate: "two_times_a_day", 
    hardestPart: ["remembering_on_time", "refill_tracking"],
    likelyToForget: ["midday", "when_outside"],
    reminderStrength: "balanced", // "gentle" | "balanced" | "firm"
    duration: "ongoing", // "short" | "ongoing"
    dashboardPreference: "both" // "doses" | "stock" | "both"
  }
];

// 3. Medication & Schedule Schema
const mockMedications = [
  {
    id: "med-101",
    userId: "user-001",
    name: "Garsil 35mg",
    form: "tablet",
    doseQuantity: 2,
    doseUnit: "tablets",
    schedulePresets: ["morning", "evening"], // "morning", "noon", "evening"
    exactTimes: ["07:00", "18:00"], // Optional custom times
    stockRemaining: 42,
    stockThreshold: 10,
    startDate: "2026-01-01",
    endDate: null // Ongoing
  },
  {
    id: "med-102",
    userId: "user-001",
    name: "Roaccutane 30mg",
    form: "capsule",
    doseQuantity: 1,
    doseUnit: "capsule",
    schedulePresets: ["morning"],
    exactTimes: ["07:00"],
    stockRemaining: 5, // Low stock mock state
    stockThreshold: 10,
    startDate: "2026-01-12",
    endDate: "2026-07-12" // 6-month course
  }
];

// 4. API Mock Interfaces (Promises returning null data or mocked records)

class MockBackend {
  // Auth endpoints
  static async signIn(phoneOrEmail, password) {
    console.log(`[POST /auth/signin] Identifying user...`);
    // Simulated empty response based on requirements
    return { data: null, error: null }; 
  }

  static async signUp(fullName, phone, email, password) {
    console.log(`[POST /auth/signup] Creating account...`);
    return { data: null, error: null };
  }

  static async recoverAccount(identifier) {
    console.log(`[POST /auth/recover] Requesting recovery for ${identifier}...`);
    return { data: { message: "Recovery instructions sent" }, error: null };
  }

  // Me / Profile endpoints
  static async getProfile(userId) {
    console.log(`[GET /user/${userId}] Fetching profile...`);
    return { data: null, error: null };
  }

  static async updateSettings(userId, settings) {
    console.log(`[PUT /user/${userId}/settings] Updating reminder/notifications...`);
    return { data: null, error: null };
  }

  // Meds endpoints
  static async getMedications(userId) {
    console.log(`[GET /medications] Fetching meds for user ${userId}...`);
    return { data: [], error: null }; // Null dataset
  }

  static async addMedication(userId, medData) {
    console.log(`[POST /medications] Adding new medication...`, medData);
    return { data: null, error: null };
  }

  // Onboarding
  static async saveOnboardingSurvey(userId, surveyAnswers) {
    console.log(`[POST /onboarding] Saving survey results...`, surveyAnswers);
    return { data: null, error: null };
  }
}

// Export for usage or reference
if (typeof module !== 'undefined') {
  module.exports = { mockUsers, mockOnboardingProfiles, mockMedications, MockBackend };
}
