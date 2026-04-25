# Sign Up Screen UX and Flow Definition

## Screen Objective

The Sign Up screen's primary objective is to allow new users to create a Thuocare account securely and efficiently. It focuses on a streamlined account creation process, prioritizing the phone number as the main identifier while offering email as an optional contact method. Upon successful account creation, the user is immediately signed in and redirected to the onboarding survey, ensuring a guided entry into the application.

## Content Hierarchy

The screen elements are designed to be calm, breathable, and clinically minimal, guiding the user through the account creation process without overwhelming them.

1.  **Header/Hero Area:**
    - **App Logo/Icon:** Prominently displayed at the top, reinforcing brand identity.
    - **Title:** "Create Account" (Utilizing `Plus Jakarta Sans` display/headline style, as per `DESIGN_STYLE.md` for hero moments).
    - **Subtitle/Instruction:** Short, welcoming phrase (Using `Inter` body style) – e.g., "Join Thuocare to manage your medication easily."

2.  **Account Creation Form (Exact Order):**
    - **Full Name Input (Required):**
      - Label: "Full Name"
      - Input Field: Placeholder "e.g., Nguyễn Văn A"
    - **Phone Number Input (Required):**
      - Label: "Phone Number"
      - Input Field: Placeholder "e.g., (123) 456-7890" (numeric keypad).
    - **Email Address Input (Optional):**
      - Label: "Email Address (Optional)"
      - Input Field: Placeholder "e.g., you@example.com" (email-optimized keypad).
    - **Password Input (Required):**
      - Label: "Password"
      - Input Field: Placeholder "••••••••" (masked characters).
      - Visibility Toggle: Eye icon (Phosphor Icons / Material Symbols Rounded).
    - **Confirm Password Input (Required):**
      - Label: "Confirm Password"
      - Input Field: Placeholder "••••••••" (masked characters).
      - Visibility Toggle: Eye icon (Phosphor Icons / Material Symbols Rounded).

3.  **Legal Acceptance:**
    - **Checkbox:** "I agree to the "Terms of Service" and "Privacy Policy"."
    - **Links:** "Terms of Service" and "Privacy Policy" (text links, smaller font, open legal modal).

4.  **Action Buttons & Links:**
    - **Create Account Button (Primary CTA):**
      - Design: Rounded, full (9999px), using the signature Blue Gradient from `DESIGN_STYLE.md`.
      - Text: "Create Account".
    - **"Already have an account?" Text:** Small, neutral text, preceding the sign-in link.
    - **Sign In Link:** Text link, clearly navigable to the Sign In flow. Text: "Sign In".

5.  **Error Display Area:**
    - Contextual positioning for field-specific errors (e.g., password mismatch).
    - General error messages (e.g., "This phone number is already registered.") displayed prominently but calmly.

## Exact Form Order and Rationale

The form fields are ordered to provide a natural, personal, and progressive disclosure flow:

1.  **Full Name (Required):** Starts with a personal touch, making the user feel recognized rather than just a number. It's a low-friction input.
2.  **Phone Number (Required, Primary Identity):** Placed after the name as the primary unique identifier for the account, aligning with the "phone-first" model.
3.  **Email Address (Optional):** Positioned after the phone number to visually reinforce its optional nature and avoid overemphasizing it.
4.  **Password (Required):** Standard security input.
5.  **Confirm Password (Required):** Essential for account creation to prevent typos and ensure password accuracy.
6.  **Legal Acceptance Checkbox (Required):** A mandatory step before account creation, ensuring user consent.

## Treatment of Optional Email

- **Labeling:** Clearly labeled as "Email Address (Optional)".
- **Placement:** Placed logically within the form but without visual prominence that would suggest it's required.
- **Validation:** If provided, basic client-side validation for email format (e.g., presence of '@' and '.') will be applied, but uniqueness is deferred for MVP.
- **Purpose:** Primarily for secondary contact and future communication, not as a primary account identifier in MVP.

## Password and Confirm-Password Behavior

- **Input Masking:** Both password fields will mask characters by default.
- **Visibility Toggle:** An eye icon (Phosphor Icons / Material Symbols Rounded) within each input field will allow users to toggle password visibility independently, improving usability and reducing entry errors.
- **Mismatch Error:** If "Password" and "Confirm Password" fields do not match upon an attempt to create an account, a clear, field-specific error message will appear immediately (e.g., "Passwords do not match."). The "Create Account" button will remain disabled until the mismatch is resolved.
- **Password Policy (Deferred for MVP):** No strict password complexity rules are enforced in MVP beyond requiring a non-empty value. Stronger policies are deferred.

## Duplicate Phone Error Experience

- **Specific Error Message:** If a user attempts to sign up with a phone number that is already registered, a clear, recovery-oriented error message will be displayed: "This phone number is already registered. Please tap Sign In to recover access or use a different phone number."
- **Location:** This message will appear prominently, ideally near the phone number input field or in a general error area, to guide the user to the correct action.
- **Actionable Guidance:** The error message should include a direct link or prominent call to action to the "Sign In" screen, facilitating a smooth transition for existing users who might have forgotten they already have an account.

## Legal Checkbox and Legal Entry-Point Behavior

- **Required Checkbox:** A checkbox labeled "I agree to the Terms of Service and Privacy Policy" is mandatory for account creation. The "Create Account" button will remain disabled until this checkbox is checked.
- **Legal Links:** "Terms of Service" and "Privacy Policy" will be presented as clickable text links within the checkbox label.
- **Modal Activation:** Tapping these links will trigger a modal overlay. This modal will adhere to the "Glass & Gradient Rule" from `DESIGN_STYLE.md`.
- **MVP Content:** For MVP, the modal will contain placeholder text indicating the legal document will be displayed here, or a link to an external web view. The full content rendering and interaction within the modal are deferred. The same legal modal functionality defined for Sign In will be reused here to maintain consistency.

## Redirect into Onboarding

- **Successful Sign-Up:** Upon successful validation of all fields and acceptance of legal terms, the user's account is created locally, and the user is immediately signed in.
- **Transition to Onboarding:** The application then performs a full-screen transition directly to the "Onboarding Survey" screen. This ensures a consistent first-time user experience after account creation.
- **Post-Onboarding:** After the onboarding survey is completed, the user is redirected to the main application tabs (e.g., Home screen).
- **Local Session Persistence:** The user's session is persisted locally upon sign-up. Subsequent app launches will bypass both the Sign Up and Sign In screens, leading directly to the Onboarding Survey (if incomplete) or the main tabs (if complete).

## Concise Copy Recommendations

All copy on the Sign Up screen will be: calm, direct, reassuring, and concise, adhering to the "clinical minimal" aesthetic.

- **Title:** "Create Account"
- **Subtitle:** "Join Thuocare to manage your medication easily."
- **Input Labels:** "Full Name", "Phone Number", "Email Address (Optional)", "Password", "Confirm Password"
- **Legal Checkbox:** "I agree to the Terms of Service and Privacy Policy."
- **Primary CTA:** "Create Account"
- **Sign In Prompt:** "Already have an account?"
- **Sign In Link:** "Sign In"
- **Error (Phone Exists):** "This phone number is already registered. Please tap Sign In to recover access or use a different phone number."
- **Error (Password Mismatch):** "Passwords do not match."
- **Error (Required Field):** "This field is required."

## iPhone vs Android Behavior Notes

- **Visual Consistency:** The core design elements (layout, typography, color palette, spacing, and use of intentional asymmetry) will be consistently applied across both platforms, maintaining the "clinical minimal" design.
- **Native Feel:**
  - **Keyboard Types:** Ensure correct keyboard appearance (e.g., text for name, numeric for phone, email for email) is triggered on both platforms.
  - **Navigation:** Standard navigation patterns for full-screen transitions will be used.
- **Android Parity:** All features and interactions will be fully functional and visually coherent on Android.
- **Glassmorphism Fallback:** The legal modal will implement the graceful degradation rule from `DESIGN_STYLE.md` for lower-end Android devices.
- **Touch Targets:** All interactive elements will meet platform-recommended minimum touch target sizes for accessibility.

## Deferred Items

- **Email Uniqueness:** Whether the optional email field must be unique if provided. For MVP, duplicates are tolerated.
- **Stronger Password Policy:** Implementation of specific requirements for password length, character types, etc.
- **Phone Number Verification:** OTP via SMS to confirm phone ownership.
- **Email Verification:** Link-based or code-based verification for email addresses.
- **Full Legal Content:** Embedding and full navigation within the legal modal.
- **Social Sign-Up:** Integration with Google, Apple, etc.
- **Country Code Selector:** For phone number input.

## Next Screen Questions

1.  What is the next highest priority UX definition? (e.g., the "Forgot Password" placeholder screen, or a detailed breakdown of the Onboarding Survey which is the immediate next step?)
2.  Should the "prototype mode" allowing multiple local accounts be explicitly documented in a more central place (e.g., `docs/PROJECT_PLAN.md` or `docs/MVP_SCREEN_PHASES.md`) for clarity across agents and phases?
