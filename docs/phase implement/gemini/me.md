# Me Screen UX and Flow Definition

## Screen Objective

The "Me" screen provides a calm, personal overview of the user's account and essential settings within the MVP. Its primary objective is to present a profile summary first, followed by relevant account settings, support access, and a clear sign-out option. The screen prioritizes a "profile-summary-first" approach, maintaining a clinically minimal aesthetic and avoiding the density of an admin panel.

## Content Hierarchy

The screen's layout is structured to emphasize the user's identity first, followed by a logical grouping of settings and actions. Calm spacing and strong visual hierarchy will be used as per `DESIGN_STYLE.md`.

1.  **Screen Title Area:**
    - **Title:** "Me" or "My Profile" (Utilizing `Plus Jakarta Sans` display/headline style).

2.  **Profile Summary Card (Hero Section):**
    - **Purpose:** To quickly identify the user and make the screen feel personal.
    - **Content:**
      - User's `Full Name` (prominently displayed).
      - `Phone Number`.
      - `Email Address` (if available).
      - _Optional placeholder:_ A reserved circular area for a future profile image/avatar, but without requiring an upload feature in MVP.
    - **Design:** This will be a primary `surface-container-lowest` card, utilizing the large radius (`lg`) from `DESIGN_STYLE.md`, and ample padding (`6`).

3.  **Settings Section (Grouped below summary):**
    - **Purpose:** To provide access to core account-related configurations.
    - **Design:** Each setting category will likely be represented by a `surface-container-low` grouping or similar visual separation to avoid visual clutter. Each setting item will be a tappable row.

    - **Sub-section: Account Details (Lightweight view):**
      - **Purpose:** Present core identity data without editing complexity.
      - **Content:**
        - `Full Name` (read-only).
        - `Phone Number` (read-only).
        - `Email Address` (read-only, if available).
      - _Note:_ This can be combined with the Profile Summary if it keeps the layout clean and readable. If separated, it should be a simple list of labels and values.

    - **Sub-section: Reminder & Notification Settings:**
      - **Purpose:** Expose meaningful user controls and reserve space for future Expo notification integration.
      - **Content (MVP Placeholder-ready):**
        - "Reminder Intensity" (Display current preference, e.g., "Gentle", "Balanced", "Firm" – from onboarding survey). This row will be tappable to potentially open a future setting modal/screen.
        - "Notifications" (Toggle or placeholder indicating future on/off state for app-wide notifications). This row will clearly state its future intent, e.g., "Notifications (coming soon)".
        - "Reminder Preferences" (Placeholder row for future granular reminder settings). This row will state its future intent, e.g., "Edit Reminder Preferences (coming soon)".
      - **Behavior:** These are primarily display/placeholder items in MVP. Tapping them will show a toast message like "Feature coming soon" or navigate to a placeholder screen/modal. The design ensures future integration with Expo SDK for native notifications.

4.  **Support Section:**
    - **Purpose:** Provide safe and non-destructive access to help resources.
    - **Content:**
      - "Help & Support" (Tappable row, potentially leading to a modal with FAQ or a web view to a support page).
      - _Optional:_ "About Thuocare" (Tappable row for app version, legal links, etc.).

5.  **Sign Out Action:**
    - **Purpose:** Provide a clear and visually distinct option to log out of the current account.
    - **Placement:** Always the bottom-most action on the screen, visually separated from other settings to prevent accidental taps.
    - **Visual Treatment:** A clear button or distinct text link, potentially using a secondary button style to differentiate it from primary actions, but with clear and unambiguous "Sign Out" copy. Tapping it will prompt a confirmation dialog to prevent accidental logout.

## Profile Summary Structure

- **Hero Element:** The Profile Summary Card will be the first prominent interactive element after the screen title.
- **Information Density:** Designed for quick scanning, not deep editing.
- **Aesthetic:** Uses `Plus Jakarta Sans` for names and `Inter` for supporting details, respecting the editorial contrast from `DESIGN_STYLE.md`.

## Settings Section Structure

- **Logical Grouping:** Settings will be logically grouped into concise sections (e.g., Account, Reminders & Notifications, Support).
- **List Items:** Each setting will be a clear, tappable list item, not a dense form.
- **Hierarchy:** Uses vertical rhythm (`5` or `10` spacing units) and subtle background shifts (`surface-container-low` for groups) rather than heavy dividers, as per `DESIGN_STYLE.md`'s "No-Line" Rule.

## Reminder/Notification Section Behavior

- **MVP Scope:** Primarily for displaying current states (from onboarding) and reserving space for future functionality.
- **User Interaction (MVP):** Tappable rows might lead to simple "coming soon" messages or placeholder screens. No complex configuration is expected in MVP.
- **Future-Proofing:** Designed to seamlessly accommodate full Expo notification permissions, scheduling, and granular reminder controls in subsequent phases.

## Support/Help Placement and Intent

- **Placement:** Positioned clearly below the main settings, but distinctly above the "Sign Out" action.
- **Intent:** To offer assistance without direct technical support in MVP. Tapping the "Help & Support" row will likely open a modal displaying an FAQ or a WebView linking to online support.

## Sign-Out Placement and Visual Treatment

- **Placement:** Fixed at the very bottom of the screen, visually separated by ample vertical space (`10` spacing unit) or a different background to highlight its finality.
- **Visual Treatment:** A neutral, but clear button (e.g., secondary button style as per `DESIGN_STYLE.md`) or a text link.
- **Interaction:** Tapping "Sign Out" will trigger a confirmation dialog ("Are you sure you want to sign out?") before logging the user out.

## Concise Copy Guidance

All copy on the "Me" screen will be calm, direct, reassuring, and concise, reflecting the "clinical minimal" aesthetic.

- **Screen Title:** "Me" / "My Profile"
- **Profile Summary:** Uses actual user name, phone, email.
- **Settings Titles:** "Account Details", "Reminders & Notifications", "Support", "About"
- **Setting Items:** "Full Name", "Phone Number", "Email", "Reminder Intensity: [Gentle/Balanced/Firm]", "Notifications (coming soon)", "Edit Reminder Preferences (coming soon)", "Help & Support", "Sign Out"
- **Sign Out Confirmation:** "Are you sure you want to sign out?" (Title), "You will need to sign in again to access your account." (Body)

## iPhone vs Android Behavior Notes

- **Visual Consistency:** The core design elements, typography, color palette, and spacing will be universally applied across both platforms, maintaining the "clinical minimal" design.
- **Native Feel:**
  - **Navigation:** Standard tab navigation behavior will be consistent.
  - **Action Sheets/Modals:** Platform-native (or Expo-compatible that feels native) presentation of confirmation dialogs for sign-out or help modals.
- **Android Parity:** All functionalities and visual presentations will be fully usable and coherent on Android.
- **Touch Targets:** All interactive elements (tappable rows, buttons) will adhere to platform-recommended minimum touch target sizes for accessibility on both iPhone and Android.

## Deferred Items

- **Edit Profile Flow:** Actual forms and functionality to change name, phone, or email.
- **Avatar Upload/Management:** Feature to add or change a profile picture.
- **Richer Medical Detail:** Displaying or managing medical history, conditions, or prescriptions directly on this screen.
- **Manager/Caregiver/Linked-Person Detail:** Any functionality related to managing others' medication.
- **Deeper Routine Summary:** Detailed medication routine summaries embedded on this screen (might be better suited for a dedicated dashboard or settings sub-screen).
- **Full Notification Configuration:** Granular settings for notification types, sounds, schedules beyond simple enable/disable.
- **Legal & Privacy Full Content:** Detailed legal documents accessible within the app (only placeholder modals for now).
