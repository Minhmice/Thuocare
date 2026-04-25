# Home Screen UX and Flow Definition

## Screen Objective

The Home screen is the "Daily Reassurance" surface. It provides the user with an immediate understanding of their current status (stats), their most urgent task (next dose), and their progress for the day (schedule). The UX prioritizes calm, high-contrast clarity for the most important action while keeping the rest of the day's context easily accessible.

## Layout Hierarchy

Based on `example/home.html`, the screen is structured into five distinct vertical zones:

1.  **Header & Greeting:** Fixed top area with personal context and live time.
2.  **Alerts & Notifications:** Dynamic zone for missed doses or stock warnings.
3.  **Compact Dashboard (~15%):** Fast-scan statistics for the current day.
4.  **Next-Dose Hero (Main Focus):** High-contrast, dominant card for the immediate task.
5.  **Today Schedule:** Timeline view of past and future doses for the day.

---

## 1. Header & Greeting Behavior

- **Content:**
  - Greeting: "Chào buổi sáng, [Tên]" (Adapts to time of day: Buổi sáng, Buổi trưa, Buổi chiều, Buổi tối).
  - Date: "Thứ Ba, 24 Th10" (Localized).
  - Live Clock: A small, high-contrast pill-shaped badge showing the current time (HH:mm).
- **Interaction:** Tapping the greeting does nothing in MVP (Reserved for future profile navigation).

## 2. Compact Top Dashboard

- **Structure:** Three equal columns with high-contrast value-label pairs.
  - **Đã uống (Taken):** Count of doses confirmed today. Uses `primary` color.
  - **Còn lại (Remaining):** Count of doses scheduled but not yet taken. Uses `on-surface` color.
  - **Quên (Missed):** Count of doses marked as missed or ignored. Uses `error` color.
- **Intent:** Provides an immediate sense of "Where am I today?" without requiring scrolling.

## 3. Alerts: Missed-Dose & Stock-Warning

- **Missed-Dose Alert:**
  - **Placement:** Directly below the header, above the stats.
  - **Visual:** `tertiary-container` background (soft red), high-contrast text.
  - **Copy:** "Bạn đã lỡ 1 liều [Tên thuốc]".
  - **Action:** "Uống ngay" button. Tapping scrolls the Hero area to that missed dose or opens a quick-action modal.
- **Stock-Warning Alert:**
  - **Placement:** Stacked below the Missed-Dose alert.
  - **Visual:** Subtle yellow/neutral tint if both exist, or same style as missed-dose if single.
  - **Copy:** "[Tên thuốc] sắp hết (còn 2 ngày)".
  - **Intent:** Pre-emptive nudge for pharmacy trips.

## 4. Next-Dose Hero Structure

- **Intent:** The dominant "Job to be done."
- **Visual:** High-contrast background (Primary Blue Gradient from `DESIGN_STYLE.md`).
- **Contents:**
  - **State Badge:** "Đúng giờ" (On time) or "Trễ [X] phút" (Late).
  - **Target Time:** Large headline (e.g., "09:00").
  - **Medication List:** A list of items scheduled for this time slot.
    - Format: "[Tên thuốc] • [Liều lượng]".
  - **Large Slider-Confirm:** A full-width horizontal slider.
    - Initial State: "Trượt để uống" (Swipe to take).
    - Action: User swipes a circular handle from left to right.
    - Completion: Triggers haptics (iPhone-first) and transitions the card to a "Success" state before updating the stats dashboard.

## 5. Today-Schedule Section

- **Structure:** A vertical timeline below the Hero card.
- **Time Slots:** Grouped by "Sáng" (Morning), "Trưa" (Midday), "Chiều" (Afternoon), "Tối" (Evening).
- **Item States:**
  - **Completed:** Dimmed text, strikethrough on medication name, checked icon (Primary color).
  - **Missed:** Error icon, time colored in Error red.
  - **Upcoming:** Standard high-contrast text, empty circle or medication icon.
- **Empty/Success State (All set today):**
  - If all scheduled doses for the day are taken:
    - Hero card is replaced with a "Calm" variant (Soft background or illustration).
    - Copy: "Bạn đã hoàn thành hôm nay" (All set today).
    - Subtitle: "Nghỉ ngơi và giữ gìn sức khỏe."

## 6. Reserved Placement: Photo Confirmation

- **Location:** Between the Next-Dose Hero list and the Slider-Confirm.
- **UX Note:** A placeholder area labeled "Xác nhận bằng ảnh (Sắp ra mắt)" or similar.
- **Intent:** Reserved for a camera trigger to take a photo of the medication before swiping. Deferred from MVP implementation.

---

## iPhone vs Android Behavior Notes

- **Haptics (iPhone):** Utilize `Impact` haptics on slider completion and `Success` haptics on dashboard update. Android uses standard vibration fallback.
- **Motion:** Calming fade-in for the Hero card on state change. Avoid heavy spring animations; prefer smooth ease-in-out as per `DESIGN_STYLE.md`.
- **Safe Areas:** Ensure the Greeting header respects the notch on iPhone and the status bar on Android.
- **Backdrop Blur:** Use the Glassmorphism rule for the header on iPhone; fallback to solid 95% surface on Android.

---

## Deferred But Reserved

- **Customizable Greeting:** Ability to change nickname.
- **Camera Integration:** The actual photo-verification logic.
- **Dashboard Expansion:** Tapping stats to see a detailed weekly report.
- **Personalized Nudges:** Voice/copy tone adjustment based on onboarding survey.
