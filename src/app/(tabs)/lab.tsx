/**
 * Lab — dev-only UI component review screen.
 *
 * Not visible in production builds (tab is hidden via _layout.tsx).
 * This file is intentionally self-contained for easy removal later.
 */
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-paper";

// Wrappers
import { Button } from "../../features/components/wrapper/button";
import { Card } from "../../features/components/wrapper/card";
import { Checkbox } from "../../features/components/wrapper/checkbox";
import { Field } from "../../features/components/wrapper/field";
import { Icon } from "../../features/components/wrapper/icon";
import { Input } from "../../features/components/wrapper/input";
import { Separator } from "../../features/components/wrapper/separator";
import { Spinner } from "../../features/components/wrapper/spinner";
import { Toast } from "../../features/components/wrapper/toast";
import { Typography } from "../../features/components/wrapper/typography";

// Composed
import { AlertBanner } from "../../features/components/composed/alert-banner";
import { EmptyState } from "../../features/components/composed/empty-state";
import { MedicationTile } from "../../features/components/composed/medication-tile";
import { ScreenHeader } from "../../features/components/composed/screen-header";
import { SettingsSection } from "../../features/components/composed/settings-section";
import { SliderConfirm } from "../../features/components/composed/slider-confirm";
import { SummaryStatsRow } from "../../features/components/composed/summary-stats-row";
import { SupportSection } from "../../features/components/composed/support-section";

// State components
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import { MainTabBar } from "../../features/components/composed/main-tab-bar";

// ─── internal lab helpers ────────────────────────────────────────────────────

function LabSection({ title, note }: { title: string; note?: string }) {
  return (
    <View style={labStyles.section}>
      <View style={labStyles.sectionRule} />
      <View style={labStyles.sectionLabel}>
        <Text style={labStyles.sectionTitle}>{title.toUpperCase()}</Text>
        {note ? <Text style={labStyles.sectionNote}>{note}</Text> : null}
      </View>
    </View>
  );
}

function LabSub({ title }: { title: string }) {
  return (
    <Text style={labStyles.subTitle}>{title}</Text>
  );
}

function TogglePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[labStyles.pill, active && labStyles.pillActive]}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Text style={[labStyles.pillText, active && labStyles.pillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ToggleRow({ children }: { children: React.ReactNode }) {
  return <View style={labStyles.toggleRow}>{children}</View>;
}

/** Bounded preview box for full-screen state components. */
function PreviewBox({
  height = 200,
  children,
}: {
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <View style={[labStyles.previewBox, { height }]}>{children}</View>
  );
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function LabScreen() {
  if (!__DEV__) return null;

  const theme = useTheme();
  const { t } = useLanguage();

  // ── button states
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);

  // ── input states
  const [inputVal, setInputVal] = useState("");
  const [inputError, setInputError] = useState(false);

  // ── checkbox states
  const [checked, setChecked] = useState(false);

  // ── medication tile state
  type MedState = "normal" | "lowStock" | "outOfStock";
  const [medState, setMedState] = useState<MedState>("normal");

  // ── slider states
  const [sliderLoading, setSliderLoading] = useState(false);
  const [sliderDisabled, setSliderDisabled] = useState(false);
  const [sliderKey, setSliderKey] = useState(0); // re-mount to reset

  // ── toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"info" | "success" | "error">("info");

  function showToast(msg: string, type: "info" | "success" | "error") {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  }

  // ── auth snippet state
  const [phoneVal, setPhoneVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");

  // ── add-med snippet state
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={labStyles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Lab header ─────────────────────────────────────────────────── */}
        <View style={labStyles.header}>
          <Typography variant="headline-md" weight="bold">
            {`⚗ ${t("lab_title")}`}
          </Typography>
          <Typography
            variant="body-sm"
            color={theme.colors.onSurfaceVariant}
            style={labStyles.headerNote}
          >
            {t("lab_subtitle")}
          </Typography>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            1. PRIMITIVES
        ══════════════════════════════════════════════════════════════════ */}
        <LabSection title="1 · Primitives" note="ui/ — base atoms" />

        {/* Typography scale */}
        <LabSub title="Typography" />
        <Card variant="elevated" style={labStyles.card}>
          {(
            [
              ["headline-lg", "Headline LG", "bold"],
              ["headline-md", "Headline MD", "bold"],
              ["headline-sm", "Headline SM", "semi-bold"],
              ["title-lg", "Title LG", "semi-bold"],
              ["title-md", "Title MD", "medium"],
              ["title-sm", "Title SM", "medium"],
              ["body-lg", "Body LG", "normal"],
              ["body-md", "Body MD — default", "normal"],
              ["body-sm", "Body SM", "normal"],
              ["label-lg", "LABEL LG", "bold"],
              ["label-md", "LABEL MD", "medium"],
              ["label-sm", "LABEL SM", "medium"],
            ] as const
          ).map(([variant, label, weight]) => (
            <View key={variant} style={labStyles.typoRow}>
              <Typography variant={variant} weight={weight}>
                {label}
              </Typography>
              <Typography
                variant="label-sm"
                color={theme.colors.onSurfaceVariant}
                style={labStyles.typoVariantLabel}
              >
                {variant}
              </Typography>
            </View>
          ))}
        </Card>

        {/* Spinner */}
        <LabSub title="Spinner" />
        <Card variant="elevated" style={labStyles.card}>
          <View style={labStyles.row}>
            <View style={labStyles.centeredItem}>
              <Spinner size="sm" />
              <Typography
                variant="label-sm"
                color={theme.colors.onSurfaceVariant}
                style={labStyles.itemLabel}
              >
                sm
              </Typography>
            </View>
            <View style={labStyles.centeredItem}>
              <Spinner size="md" />
              <Typography
                variant="label-sm"
                color={theme.colors.onSurfaceVariant}
                style={labStyles.itemLabel}
              >
                md
              </Typography>
            </View>
            <View style={labStyles.centeredItem}>
              <Spinner size="lg" />
              <Typography
                variant="label-sm"
                color={theme.colors.onSurfaceVariant}
                style={labStyles.itemLabel}
              >
                lg
              </Typography>
            </View>
          </View>
        </Card>

        {/* Icon */}
        <LabSub title="Icon" />
        <Card variant="elevated" style={labStyles.card}>
          <View style={labStyles.iconGrid}>
            {(
              [
                ["pill", "primary"],
                ["alert-circle-outline", "error"],
                ["check-circle-outline", "primary"],
                ["clock-outline", "onSurfaceVariant"],
                ["calendar-blank", "onSurfaceVariant"],
                ["chevron-right", "onSurfaceVariant"],
                ["inbox-outline", "onSurfaceVariant"],
                ["camera-outline", "onSurfaceVariant"],
                ["help-circle-outline", "primary"],
                ["package-variant", "onSurfaceVariant"],
                ["information", "primary"],
                ["alert-octagon", "error"],
              ] as const
            ).map(([name, variant]) => (
              <View key={name} style={labStyles.iconItem}>
                <Icon name={name} size="md" variant={variant} />
                <Typography
                  variant="label-sm"
                  color={theme.colors.onSurfaceVariant}
                  style={labStyles.iconLabel}
                >
                  {name}
                </Typography>
              </View>
            ))}
          </View>
        </Card>

        {/* Separator */}
        <LabSub title="Separator" />
        <Card variant="elevated" style={labStyles.card}>
          <Typography
            variant="body-sm"
            color={theme.colors.onSurfaceVariant}
          >
            Horizontal (theme-aware color)
          </Typography>
          <Separator style={labStyles.separator} />
          <Typography
            variant="body-sm"
            color={theme.colors.onSurfaceVariant}
          >
            Below separator
          </Typography>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            2. WRAPPERS
        ══════════════════════════════════════════════════════════════════ */}
        <LabSection title="2 · Wrappers" note="wrapper/ — themed variants" />

        {/* Button variants */}
        <LabSub title="Button" />
        <ToggleRow>
          <TogglePill
            label="loading"
            active={btnLoading}
            onPress={() => setBtnLoading((v) => !v)}
          />
          <TogglePill
            label="disabled"
            active={btnDisabled}
            onPress={() => setBtnDisabled((v) => !v)}
          />
        </ToggleRow>
        <Card variant="elevated" style={labStyles.card}>
          {(
            [
              ["primary", "Primary"],
              ["secondary", "Secondary"],
              ["ghost", "Ghost"],
              ["text", "Text"],
              ["error", "Error"],
            ] as const
          ).map(([variant, label]) => (
            <View key={variant} style={labStyles.buttonRow}>
              <Button
                variant={variant}
                label={label}
                loading={btnLoading}
                disabled={btnDisabled}
                onPress={() => {}}
              />
              <Typography
                variant="label-sm"
                color={theme.colors.onSurfaceVariant}
                style={labStyles.buttonVariantLabel}
              >
                {variant}
              </Typography>
            </View>
          ))}
        </Card>

        {/* Card variants */}
        <LabSub title="Card" />
        <View style={labStyles.row}>
          <Card variant="flat" style={labStyles.cardVariant}>
            <Typography variant="label-md" weight="bold">
              flat
            </Typography>
          </Card>
          <Card variant="elevated" style={labStyles.cardVariant}>
            <Typography variant="label-md" weight="bold">
              elevated
            </Typography>
          </Card>
          <Card variant="outlined" style={labStyles.cardVariant}>
            <Typography variant="label-md" weight="bold">
              outlined
            </Typography>
          </Card>
        </View>

        {/* Input */}
        <LabSub title="Input" />
        <ToggleRow>
          <TogglePill
            label="error"
            active={inputError}
            onPress={() => setInputError((v) => !v)}
          />
        </ToggleRow>
        <Card variant="elevated" style={labStyles.card}>
          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            value={inputVal}
            onChangeText={setInputVal}
            error={inputError ? "Required field" : undefined}
          />
          <Input
            label="Số điện thoại"
            placeholder="0912 345 678"
            keyboardType="phone-pad"
          />
        </Card>

        {/* Checkbox */}
        <LabSub title="Checkbox" />
        <Card variant="elevated" style={labStyles.card}>
          <View style={labStyles.checkboxGroup}>
            <Checkbox
              checked={checked}
              onCheckedChange={setChecked}
              label="I agree to the terms of service"
            />
            <Checkbox
              checked
              onCheckedChange={() => {}}
              label="Checked (static)"
            />
            <Checkbox
              checked={false}
              onCheckedChange={() => {}}
              label="Disabled"
              disabled
            />
          </View>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            3. COMPOSED
        ══════════════════════════════════════════════════════════════════ */}
        <LabSection title="3 · Composed" note="composed/ — app-level components" />

        {/* ScreenHeader */}
        <LabSub title="ScreenHeader" />
        <Card variant="elevated" style={labStyles.card}>
          <ScreenHeader
            title={`Good morning, Minh`}
            subtitle="Saturday, March 28"
            style={labStyles.noInset}
          />
          <Separator />
          <ScreenHeader
            title="Meds"
            subtitle="Track medications and today's supply."
            rightSlot={
              <Button variant="ghost" label="+ Add" onPress={() => {}} />
            }
            style={labStyles.noInset}
          />
        </Card>

        {/* AlertBanner */}
        <LabSub title="AlertBanner" />
        <View style={labStyles.stack}>
          <AlertBanner
            variant="info"
            icon="information"
            title="Info banner"
            description="Neutral system information or tip."
          />
          <AlertBanner
            variant="warning"
            icon="alert-circle"
            title="You missed Paracetamol"
            description="This morning dose still needs your attention."
            actionLabel="Take now"
            onAction={() => {}}
          />
          <AlertBanner
            variant="critical"
            icon="alert-octagon"
            title="Drug interaction detected"
            description="Do not take Ibuprofen with your current Warfarin dose."
          />
        </View>

        {/* SummaryStatsRow */}
        <LabSub title="SummaryStatsRow" />
        <View
          style={[
            labStyles.statsCard,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <SummaryStatsRow
            segmented
            items={[
              { label: "Taken", value: 3, color: "#0058BC", emphasize: true },
              { label: "Remaining", value: 2 },
              { label: "Missed", value: 1, color: "#C41E1E" },
            ]}
          />
        </View>

        {/* MedicationTile */}
        <LabSub title="MedicationTile" />
        <ToggleRow>
          {(
            [
              ["normal", "normal"],
              ["lowStock", "low stock"],
              ["outOfStock", "out of stock"],
            ] as const
          ).map(([state, label]) => (
            <TogglePill
              key={state}
              label={label}
              active={medState === state}
              onPress={() => setMedState(state)}
            />
          ))}
        </ToggleRow>
        <MedicationTile
          name="Paracetamol (Acetaminophen)"
          dosage="500 mg"
          schedule="Sáng · Chiều · Tối"
          remaining={
            medState === "outOfStock" ? 0 : medState === "lowStock" ? 4 : 18
          }
          lowStock={medState === "lowStock"}
          outOfStock={medState === "outOfStock"}
          highlighted={medState === "normal"}
          stockLabel={
            medState === "outOfStock"
              ? "Out of stock"
              : medState === "lowStock"
              ? "4 remaining"
              : "18 remaining"
          }
        />

        {/* SettingsSection */}
        <LabSub title="SettingsSection" />
        <SettingsSection
          title="Account"
          items={[
            { id: "phone", label: "Phone", value: "0912 345 678", onPress: () => {} },
            { id: "email", label: "Email", value: "user@example.com", onPress: () => {} },
            {
              id: "since",
              label: "Member since",
              value: "March 2026",
              onPress: () => {},
              showChevron: false,
            },
          ]}
        />

        {/* SupportSection */}
        <LabSub title="SupportSection" />
          <SupportSection
          title={t("lab_supportTitle")}
          description={t("lab_supportDescription")}
          actionLabel={t("lab_getSupport")}
          onPress={() => {}}
        />

        {/* SliderConfirm */}
        <LabSub title="SliderConfirm" />
        <ToggleRow>
          <TogglePill
            label="loading"
            active={sliderLoading}
            onPress={() => setSliderLoading((v) => !v)}
          />
          <TogglePill
            label="disabled"
            active={sliderDisabled}
            onPress={() => setSliderDisabled((v) => !v)}
          />
          <TogglePill
            label="reset"
            active={false}
            onPress={() => setSliderKey((k) => k + 1)}
          />
        </ToggleRow>
        <View style={labStyles.sliderWrap}>
          <SliderConfirm
            key={sliderKey}
            label="Slide to confirm"
            loading={sliderLoading}
            disabled={sliderDisabled}
            onConfirm={() => setSliderKey((k) => k + 1)}
          />
        </View>

        {/* EmptyState */}
        <LabSub title="EmptyState" />
        <PreviewBox height={260}>
          <EmptyState
            icon="pill"
            title={t("lab_emptyTitle")}
            description={t("lab_emptyDescription")}
            actionLabel={t("lab_emptyAction")}
            onAction={() => {}}
          />
        </PreviewBox>

        {/* LoadingState */}
        <LabSub title="LoadingState" />
        <PreviewBox height={160}>
          <LoadingState />
        </PreviewBox>

        {/* ErrorState */}
        <LabSub title="ErrorState" />
        <PreviewBox height={280}>
          <ErrorState
            message={t("lab_errorMessage")}
            onRetry={() => {}}
          />
        </PreviewBox>

        {/* ══════════════════════════════════════════════════════════════════
            4. SCREEN SNIPPETS
        ══════════════════════════════════════════════════════════════════ */}
        <LabSection title="4 · Screen Snippets" note="representative UI blocks" />

        {/* Auth — sign in */}
        <LabSub title="Auth · Sign In" />
        <Card variant="elevated" style={labStyles.card}>
          <Typography variant="headline-sm" weight="bold" style={labStyles.snippetHeading}>
            {t("lab_signInTitle")}
          </Typography>
          <Field label="Phone number" required>
            <Input
              placeholder="0912 345 678"
              keyboardType="phone-pad"
              value={phoneVal}
              onChangeText={setPhoneVal}
            />
          </Field>
          <Field label="Password" required>
            <Input
              placeholder="••••••••"
              secureTextEntry
              value={passwordVal}
              onChangeText={setPasswordVal}
            />
          </Field>
          <View style={labStyles.forgotRow}>
            <Typography variant="body-sm" color={theme.colors.primary}>
              {t("lab_forgotPassword")}
            </Typography>
          </View>
          <Button variant="primary" label={t("auth_signIn")} onPress={() => {}} />
        </Card>

        {/* Auth — sign up (name + phone) */}
        <LabSub title="Auth · Sign Up (step 1)" />
        <Card variant="elevated" style={labStyles.card}>
          <Typography variant="headline-sm" weight="bold" style={labStyles.snippetHeading}>
            {t("lab_signUpTitle")}
          </Typography>
          <Field label="Full name" required>
            <Input placeholder="Nguyễn Văn A" />
          </Field>
          <Field label="Phone number" required>
            <Input placeholder="0912 345 678" keyboardType="phone-pad" />
          </Field>
          <Field label="Email" hint="Optional">
            <Input placeholder="you@example.com" keyboardType="email-address" />
          </Field>
          <Checkbox
            checked={checked}
            onCheckedChange={setChecked}
            label={t("lab_termsAgreement")}
          />
          <Button
            variant="primary"
            label={t("auth_createAccountButton")}
            onPress={() => {}}
            style={labStyles.snippetBtn}
          />
        </Card>

        {/* Add Medication step 1 — name + dosage */}
        <LabSub title="Add Medication · Step 1 (Name + Dosage)" />
        <Card variant="elevated" style={labStyles.card}>
          <Typography variant="headline-sm" weight="bold" style={labStyles.snippetHeading}>
            {t("lab_addMedicationTitle")}
          </Typography>
          <Field label="Medication name" required>
            <Input
              placeholder="e.g. Paracetamol"
              value={medName}
              onChangeText={setMedName}
            />
          </Field>
          <Field label="Dosage" required hint="e.g. 500 mg">
            <Input
              placeholder="500 mg"
              value={medDosage}
              onChangeText={setMedDosage}
            />
          </Field>
          <Button variant="primary" label={t("lab_continue")} onPress={() => {}} />
        </Card>

        {/* Me — profile card */}
        <LabSub title="Me · Profile Card" />
        <Card variant="elevated" style={[labStyles.card, { padding: 24, borderRadius: 32 }]}>
          <View style={labStyles.profileRow}>
            <View
              style={[
                labStyles.avatar,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Typography variant="headline-sm" weight="bold" color="#FFFFFF">
                MN
              </Typography>
            </View>
            <View style={labStyles.profileText}>
              <Typography variant="title-lg" weight="bold">
                Minh Nguyen
              </Typography>
              <Typography
                variant="body-md"
                color={theme.colors.onSurfaceVariant}
              >
                0912 345 678
              </Typography>
              <Typography
                variant="body-sm"
                color={theme.colors.onSurfaceVariant}
              >
                minh@example.com
              </Typography>
            </View>
          </View>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            5. TOAST PREVIEW
        ══════════════════════════════════════════════════════════════════ */}
        <LabSection title="5 · Toast Preview" note="manual trigger — no auto fire" />

        <Card variant="elevated" style={labStyles.card}>
          <Typography
            variant="body-sm"
            color={theme.colors.onSurfaceVariant}
            style={labStyles.toastNote}
          >
            {t("lab_toastNote")}
          </Typography>
          <View style={labStyles.toastRow}>
            <Button
              variant="secondary"
              label="Info"
              onPress={() => showToast(t("lab_infoMessage"), "info")}
              style={labStyles.toastBtn}
            />
            <Button
              variant="primary"
              label="Success"
              onPress={() => showToast(t("lab_successMessage"), "success")}
              style={labStyles.toastBtn}
            />
            <Button
              variant="error"
              label="Error"
              onPress={() => showToast(t("lab_errorToastMessage"), "error")}
              style={labStyles.toastBtn}
            />
          </View>
        </Card>

        {/* bottom clearance */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Toast rendered outside ScrollView so absolute positioning works */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />
      <MainTabBar />
    </View>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const PRIMARY = "#0058BC";
const ON_SURFACE_VARIANT = "#5F6673";
const SURFACE_LOW = "#F3F3F8";

const labStyles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 150, // Space for internal tab bar
    gap: 16,
  },
  // Lab header
  header: {
    paddingBottom: 4,
  },
  headerNote: {
    marginTop: 4,
  },
  // Section divider
  section: {
    marginTop: 16,
    gap: 10,
  },
  sectionRule: {
    height: 2,
    backgroundColor: PRIMARY,
    opacity: 0.15,
    borderRadius: 1,
  },
  sectionLabel: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: PRIMARY,
    letterSpacing: 1.5,
  },
  sectionNote: {
    fontSize: 12,
    color: ON_SURFACE_VARIANT,
    letterSpacing: 0.2,
  },
  // Sub-section
  subTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: ON_SURFACE_VARIANT,
    marginTop: 4,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  // Generic card container
  card: {
    padding: 16,
  },
  // Toggle pills
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: SURFACE_LOW,
  },
  pillActive: {
    backgroundColor: PRIMARY,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    color: ON_SURFACE_VARIANT,
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  // Typography preview
  typoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  typoVariantLabel: {
    opacity: 0.5,
  },
  // Generic row
  row: {
    flexDirection: "row",
    gap: 12,
  },
  centeredItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  itemLabel: {
    opacity: 0.6,
  },
  // Icon grid
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  iconItem: {
    width: "25%",
    alignItems: "center",
    paddingVertical: 10,
    gap: 4,
  },
  iconLabel: {
    fontSize: 9,
    textAlign: "center",
    opacity: 0.6,
  },
  // Separator
  separator: {
    marginVertical: 12,
  },
  // Button rows
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  buttonVariantLabel: {
    opacity: 0.5,
    marginLeft: 12,
  },
  // Card variants
  cardVariant: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    minHeight: 60,
    justifyContent: "center",
  },
  // Checkbox
  checkboxGroup: {
    gap: 8,
  },
  // Stats card
  statsCard: {
    borderRadius: 24,
    overflow: "hidden",
  },
  // Slider
  sliderWrap: {
    backgroundColor: PRIMARY,
    borderRadius: 28,
    padding: 24,
  },
  // No inset override for ScreenHeader inside card
  noInset: {
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  // Stack of components
  stack: {
    gap: 8,
  },
  // Preview box (bounded container for full-screen states)
  previewBox: {
    backgroundColor: SURFACE_LOW,
    borderRadius: 20,
    overflow: "hidden",
  },
  // Screen snippet pieces
  snippetHeading: {
    marginBottom: 16,
  },
  snippetBtn: {
    marginTop: 8,
  },
  forgotRow: {
    alignItems: "flex-end",
    marginTop: -8,
    marginBottom: 16,
  },
  // Profile card
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  // Toast section
  toastNote: {
    marginBottom: 16,
  },
  toastRow: {
    flexDirection: "row",
    gap: 8,
  },
  toastBtn: {
    flex: 1,
  },
});
