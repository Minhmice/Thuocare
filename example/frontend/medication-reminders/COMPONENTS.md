# Medication Reminders Components

The following reusable UI components were identified from the "Medication Reminders" flow mockups and have been implemented in the HTML prototypes.

1. **AppShell**: A mobile-sized container (`max-w-md`) centered on the screen with subtle bordering/shadow to simulate a mobile app frame on desktop, and full-width on mobile.
2. **OnboardingIllustration**: The abstract geometric art piece consisting of layered blue and light-blue shapes (rectangles with rounded corners, circles).
3. **PrimaryButton**: The main call to action button, used primarily in the bottom navigation (e.g., the blue bottom bar).
4. **HeaderBar**: Top navigation bar with a back button, title, and trailing action icon.
5. **DateStrip**: A horizontal scrollable list of dates.
6. **DateChip**: An individual date item (day of week + date number). Features an active state (blue background, white text).
7. **MedicationCard**: A list item showing medication name, dosage, form (tablet/capsule/drops), and an icon. Uses distinct pastel backgrounds for different medications.
8. **TimeDivider**: A vertical timeline or time block label (e.g., `7:00 AM`, `12:00 PM`) grouping the medication cards.
9. **BottomNavBar**: The uniquely shaped pill-like bottom navigation element with icons for Today, Calendar, Pills, and Profile.
10. **InfoCard**: A rounded card used to display properties (e.g., Duration, Dose, Frequency) with a label and value.
11. **ProgressRing**: A circular progress indicator showing the completion percentage of the active course.
12. **SideEffectsCard**: A prominent, accented card (often blue) providing educational information about the medication.

These components are built using Tailwind CSS utility classes and can be extracted as React/React Native structured components in the main application.
