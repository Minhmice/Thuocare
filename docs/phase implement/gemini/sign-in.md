# Sign In Screen UX and Flow Definition

## Screen Objective

The Sign In screen's primary objective is to enable existing users to securely access their Thuocare account. It is designed to offer a clear, calm, and efficient path for authentication, prioritizing a phone number as the primary identifier and email as an alternative. Upon successful authentication, it seamlessly transitions the user to the onboarding survey if incomplete, or to the main application tabs otherwise. The UX focuses on minimizing cognitive load, providing clear feedback, and adhering to the "clinical minimal" design aesthetic.

## Content Hierarchy

The screen elements are organized to guide the user naturally through the sign-in process, respecting the calm and breathable visual direction.

1.  **Header/Hero Area:**
    *   **App Logo/Icon:** Prominently displayed at the top, reinforcing brand identity.
    *   **Title:** "Sign In" (Utilizing `Plus Jakarta Sans` display/headline style, as per `DESIGN_STYLE.md` for hero moments).
    *   **Subtitle/Instruction:** A short, welcoming phrase (Using `Inter` body style) – e.g., "Welcome back. Please sign in to continue." This copy will be concise and direct, aligning with "Short Copy Guidance."

2.  **Primary Authentication Form:**
    *   **Phone Number Input (Default View):**
        *   Label: "Phone Number"
        *   Input Field: Placeholder "e.g., (123) 456-7890". Expected keyboard type: numeric, with appropriate formatting.
        *   Action Toggle: "Use Email Instead" (secondary button/text link, `Inter` label style). Positioned subtly below the phone input.
    *   **Email Input (Alternative View):**
        *   Label: "Email Address"
        *   Input Field: Placeholder "e.g., you@example.com". Expected keyboard type: email-optimized.
        *   Action Toggle: "Use Phone Number Instead" (secondary button/text link, `Inter` label style). Visible when email is the active input mode.
    *   **Password Input:**
        *   Label: "Password"
        *   Input Field: Placeholder "••••••••". Characters masked by default.
        *   Visibility Toggle: An eye icon (from Phosphor Icons / Material Symbols Rounded) within the input field to toggle password visibility. Default state is hidden.

3.  **Action Buttons & Links:**
    *   **Sign In Button (Primary CTA):**
        *   Design: Rounded, full (9999px), using the signature Blue Gradient from `DESIGN_STYLE.md`.
        *   Text: "Sign In".
    *   **Forgot Password Link:**
        *   Text link, smaller font, positioned below the "Sign In" button. Text: "Forgot Password?".
    *   **"Don't have an account?" Text:** Small, neutral text, preceding the sign-up link.
    *   **Sign Up Link:** Text link, clearly navigable to the Sign Up flow. Text: "Sign Up".
    *   **Legal Content Links:** Text links at the bottom (e.g., "Terms of Service", "Privacy Policy"), triggering a modal.

4.  **Error Display Area:**
    *   Positioned contextually – either as a field-specific error message directly below the offending input, or as a general banner/toast notification above the primary CTA for broader issues.
    *   Clear, concise error messages (e.g., "Incorrect password. Please try again.").

## Phone-First Sign-In Logic

1.  **Initial Screen Load:** The screen defaults to displaying the "Phone Number" input field. The "Password" input and "Sign In" button are always present.
2.  **Toggle to Email Mode:** A clearly visible "Use Email Instead" text link is presented. Tapping this link:
    *   Switches the active input field to "Email Address".
    *   Changes the toggle text to "Use Phone Number Instead".
    *   The keyboard type hint updates accordingly.
3.  **Input Behavior:**
    *   Focus on the phone number input will bring up a numeric keypad, pre-formatted for local phone number entry (country code selection is deferred for MVP).
    *   Lightweight client-side validation for phone number format (e.g., minimum length, numeric characters).

## Email-Alternative Sign-In Logic

1.  **Activation:** This mode is activated by tapping "Use Email Instead" from the phone-first view.
2.  **Toggle to Phone Mode:** A "Use Phone Number Instead" text link is presented. Tapping this reverts the UI to the phone-first mode.
3.  **Input Behavior:**
    *   Focus on the email input will bring up an email-optimized keypad.
    *   Lightweight client-side validation for email format (e.g., presence of '@' and '.').

## Password Interaction Notes

*   **Visibility Toggle:** The password input field will include a toggle button (e.g., an eye icon using Phosphor Icons or Material Symbols Rounded) to switch between masked and visible password entry. This enhances usability and reduces input errors.
*   **Security Best Practice:** Characters will be masked by default.
*   **Accessibility:** Focus states will adhere to the `DESIGN_STYLE.md` guidelines, utilizing `outline` with minimum 40% opacity of the primary color for clear visual feedback.

## Error Behavior for Wrong Password

*   **Specific Error Message:** If the authentication attempt fails due to an incorrect password, a direct and actionable error message will be displayed: "Incorrect password. Please try again."
*   **Location:** This message will be shown in a designated error area, potentially below the password field or as a general message at the bottom of the form, ensuring it doesn't obstruct other crucial elements.
*   **Input State:** The password input field may visually indicate an error (e.g., a subtle red border), but remains editable for user correction.
*   **Account Not Found:** For cases where the phone number or email is not registered, a generic message like "Account not found. Please check your details or sign up." will be used to simplify MVP implementation, rather than distinguishing between specific non-existent identifiers.

## Forgot-Password Entry Behavior

*   **Clearly Labeled Entry Point:** A "Forgot Password?" text link will be visible and easily tappable, positioned below the "Sign In" button for easy access.
*   **Transition:** Tapping this link will navigate the user to a separate "Forgot Password" screen.
*   **MVP Scope:** For the MVP, this "Forgot Password" screen will primarily serve as a placeholder. It will contain clear, short copy guiding the user on the next steps (e.g., "Please contact support to reset your password" or "Password reset functionality is coming soon."). It will *not* initiate an actual password reset flow (e.g., email verification, SMS OTP), as the full recovery flow is deferred. This interaction will be a full-screen transition, not a modal on the Sign In screen itself, to simplify the flow and reduce cognitive load.

## Legal Modal Entry Behavior

*   **Entry Points:** Text links for "Terms of Service" and "Privacy Policy" (and potentially other legal documents) will be placed at the very bottom of the screen, clearly distinguishable from primary actions.
*   **Interaction:** Tapping any of these links will trigger a modal overlay.
*   **Modal Design:** The modal will adhere to the "Glass & Gradient Rule" from `DESIGN_STYLE.md`, using `surface-container-lowest` at 80% opacity with a `20px backdrop-blur` for its background.
*   **MVP Content:** For MVP, the modal content can be placeholder text indicating that the full legal document will appear here, or it could embed a web view linking to the live documents. The full content rendering and interaction within the modal are deferred.

## Transition to Onboarding

*   **Success Condition:** Upon successful authentication (valid phone/email and password), the application checks the user's onboarding status.
*   **Onboarding Incomplete:** If the user has not yet completed the onboarding survey, the app performs a full-screen transition directly to the "Onboarding Survey" screen (`docs/screen_feature/onboarding-survey.md`). This ensures new users complete essential profile setup before accessing core features.
*   **Onboarding Complete:** If the user has already completed the onboarding survey, the app transitions directly to the main application tabs (e.g., the Home screen).
*   **Session Persistence:** After a successful sign-in, the user's session will be persisted locally. Subsequent app launches will bypass the Sign In screen, directing the user to either the Onboarding Survey (if incomplete) or the main tabs (if complete), maintaining a seamless experience.

## Short Copy Guidance

All copy on the Sign In screen will be:

*   **Calm & Reassuring:** Reflecting the "clinical minimal" and "Digital Sanatorium" aesthetic.
*   **Direct & Clear:** Avoiding ambiguity, technical jargon, or overly complex sentences.
*   **Concise:** Using the fewest words necessary to convey the message.
*   **Actionable:** Guiding the user clearly on what to do next.

**Examples:**

*   **Title:** "Sign In"
*   **Subtitle:** "Welcome back. Please sign in to continue."
*   **Primary CTA:** "Sign In"
*   **Input Labels:** "Phone Number", "Email Address", "Password"
*   **Toggle Actions:** "Use Email Instead", "Use Phone Number Instead"
*   **Forgot Password:** "Forgot Password?"
*   **Sign Up Prompt:** "Don't have an account?"
*   **Sign Up Link:** "Sign Up"
*   **Legal Links:** "Terms of Service", "Privacy Policy"
*   **Error (Wrong Password):** "Incorrect password. Please try again."
*   **Error (Account Not Found):** "Account not found. Please check your details or sign up."

## iPhone vs Android Behavior Notes

The design maintains a consistent "clinical minimal" aesthetic across both platforms, with platform-specific nuances where appropriate to enhance the native feel.

*   **Visual Consistency:** The core layout, typography (`Plus Jakarta Sans` and `Inter`), color palette, and spacing (`1.4rem (4)` base unit) will be universally applied as per `DESIGN_STYLE.md`. The intentional asymmetry and value-label pairings will be consistent.
*   **Native Affordances (iPhone Favoring):**
    *   **Keyboard Types:** Ensure correct keyboard appearance for phone, email, and password inputs on both platforms.
    *   **Navigation Animations:** Where Expo allows, slight preference for iOS-native transition animations while ensuring Android transitions are smooth and non-jarring.
    *   **Haptics:** Potential for subtle haptic feedback on key interactions (e.g., successful sign-in, primary button press) on iOS, ensuring graceful degradation or appropriate Android equivalents.
*   **Android Parity:** All functionalities will be fully usable and visually coherent on Android. No iOS-specific gestures or UI patterns that would feel out of place on Android will be introduced.
*   **Glassmorphism Fallback:** Elements utilizing Glassmorphism (e.g., legal modal) will implement the graceful degradation rule from `DESIGN_STYLE.md` for low-end Android devices, falling back to 95% opacity solid color for blurred backgrounds to maintain performance.
*   **Touch Targets:** All interactive elements (buttons, links) will adhere to platform-recommended minimum touch target sizes for accessibility on both iPhone and Android.

## Deferred Items

The following functionalities are explicitly deferred for MVP but the architecture should allow for their future integration:

*   Full "Forgot Password" recovery flow (e.g., email/SMS verification, multi-step reset process).
*   Detailed legal document content directly embedded and navigable within the modal.
*   Phone number verification (e.g., OTP via SMS).
*   Email verification flows.
*   Third-party social sign-in options (e.g., Google, Apple, Facebook).
*   Passkey integration.
*   Sophisticated account lockout mechanisms after multiple failed attempts.
*   Biometric authentication (e.g., Face ID, Touch ID, Android Biometrics).
*   Country code selection for phone numbers.

## Next Screen Questions

Based on the completion of the Sign In UX and flow:

1.  Given that the Sign In screen now transitions to the "Onboarding Survey" if incomplete, what is the priority for defining the UX/flow for the "Sign Up" screen versus further detailing the "Onboarding Survey" screen (which is the immediate next step after Sign In)?
2.  What specific requirements or content should the MVP "Forgot Password" placeholder screen contain beyond a simple instructional message? For instance, should it offer a direct link to support, or simply state that the feature is "coming soon"?
