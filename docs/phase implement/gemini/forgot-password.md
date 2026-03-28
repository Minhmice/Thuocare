# Forgot Password Modal UX and Flow Definition

## Modal Objective

The Forgot Password modal serves as a mock-friendly recovery helper for users who have forgotten their password. It is designed to be accessible from both the Sign In screen and the duplicate-phone error message in the Sign Up flow. For MVP, it simulates sending recovery information to the user's registered phone or email, without implementing actual delivery or reset mechanisms. The objective is to provide a calm, supportive, and clear user experience for initiating password recovery within the prototype.

## Content Hierarchy

The modal is designed to be short, focused, and clinically minimal, adhering to the `DESIGN_STYLE.md` principles for modals and overlays.

1.  **Modal Header:**
    *   **Title:** "Forgot Password?" (Utilizing `Plus Jakarta Sans` headline style).
    *   **Close Button:** An 'X' icon (Phosphor Icons / Material Symbols Rounded) for dismissing the modal.

2.  **Instructional Text:**
    *   A concise message explaining the purpose (Using `Inter` body style) – e.g., "Enter your registered phone number or email to receive recovery instructions."

3.  **Identifier Input:**
    *   **Label:** "Phone or Email"
    *   **Input Field:** A single input field with placeholder "e.g., (123) 456-7890 or you@example.com". This input will intelligently adapt its keyboard type based on user input (numeric for phone, email for email, or default for mixed characters).

4.  **Action Button:**
    *   **Send Instructions Button (Primary CTA):** Rounded, full, using the signature Blue Gradient. Text: "Send Instructions".

5.  **Result Message Area:**
    *   A dedicated area for displaying success or failure messages after the "Send Instructions" button is tapped. Messages will be calm, direct, and supportive.

## Input Behavior for Phone-or-Email

*   **Single Input Field:** Users will enter either their registered phone number or email address into a single input field.
*   **Intelligent Input Type:** The input field should be flexible. When a user starts typing digits, it can hint towards a phone number keyboard. When '@' is typed, it can switch to an email keyboard. This adaptability minimizes friction.
*   **Local Data Check:** Upon tapping "Send Instructions", the app will check its local account data to see if an account exists that matches the entered phone number OR email address.
    *   **No Priority:** The system does not prioritize phone over email or vice versa; it simply looks for a match.

## Success and Failure State UX

### Success State

*   **Condition:** The entered phone number or email exists in the local account data.
*   **Visual Feedback:** The input field and button may be temporarily disabled or hidden, and a clear success message is displayed in the result message area.
*   **Copy Guidance:**
    *   If input was a phone: "We've simulated sending recovery instructions to your phone."
    *   If input was an email: "We've simulated sending recovery instructions to your email."
*   **Dismissal:** The modal can auto-close after a short delay (e.g., 3-5 seconds) or wait for the user to tap the close button.

### Failure State

*   **Condition:** The entered phone number or email does NOT exist in the local account data.
*   **Visual Feedback:** An error message is displayed in the result message area. The input field remains active and editable.
*   **Copy Guidance:** "We couldn't find an account with that phone or email. Please check your details or try signing up."
*   **Dismissal:** The modal remains open, allowing the user to correct their input or try again.

## Copy Guidance

All copy will be short, supportive, and direct, adhering to the "clinical minimal" and "Digital Sanatorium" aesthetic.

*   **Modal Title:** "Forgot Password?"
*   **Instructional Text:** "Enter your registered phone number or email to receive recovery instructions."
*   **Input Placeholder:** "Phone or Email"
*   **Primary CTA:** "Send Instructions"
*   **Success (Phone):** "We've simulated sending recovery instructions to your phone."
*   **Success (Email):** "We've simulated sending recovery instructions to your email."
*   **Failure:** "We couldn't find an account with that phone or email. Please check your details or try signing up."

## Rules for Shared Use from Sign In and Sign Up

The Forgot Password modal is a single, reusable component designed to be opened from multiple points:

*   **From Sign In Screen:** Tapping the "Forgot Password?" link on the Sign In screen will trigger this modal.
*   **From Sign Up Screen (Duplicate Phone Error):** When a user attempts to sign up with an already registered phone number, the error message ("This phone number is already registered. Please tap Sign In to recover access.") will include a linked action that, when tapped, specifically opens this Forgot Password modal. This provides immediate, recovery-oriented guidance in context.
*   **Consistency:** The modal's appearance and behavior will be identical regardless of its entry point.

## iPhone vs Android Notes

*   **Visual Consistency:** The modal will maintain the "clinical minimal" design across both platforms, using shared component styling, typography (`Plus Jakarta Sans` and `Inter`), color palette, and spacing, as defined in `DESIGN_STYLE.md`.
*   **Modal Design:** The modal will adhere to the "Glass & Gradient Rule" from `DESIGN_STYLE.md`, utilizing `surface-container-lowest` at 80% opacity with a `20px backdrop-blur` for its background on supporting devices. A graceful degradation fallback (95% opaque solid color) will be implemented for lower-end Android devices or web platforms.
*   **Keyboard Management:** Ensure the intelligent input field correctly suggests and triggers the appropriate native keyboard types (numeric, email-optimized) on both platforms.
*   **Touch Targets:** All interactive elements will meet platform-recommended minimum touch target sizes for accessibility.

## Deferred Items

The following functionalities are explicitly deferred for MVP but should be considered for future integration:

*   **Real Recovery Transport:** Actual sending of OTPs via SMS or recovery links via email.
*   **OTP Flow:** Implementation of a screen or modal for entering an OTP received via phone/email.
*   **Reset Password Screen:** A dedicated screen where users can set a new password after successful recovery.
*   **Token Validation:** Backend logic for validating recovery tokens or OTPs.
*   **Backend-Backed Rate Limiting:** Measures to prevent abuse of the password recovery system.
*   **"Forgot Password" screen (not modal):** For future, more complex recovery flows, this might become a dedicated screen instead of a modal.
