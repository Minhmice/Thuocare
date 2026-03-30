import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  BackHandler,
  Pressable,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Portal, Dialog, Button as PaperButton } from "react-native-paper";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppText } from "../../components/ui/AppText";
import { AppTextField } from "../../components/ui/AppTextField";
import { AppCard } from "../../components/ui/AppCard";
import { paperTheme } from "../../theme/paperTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  addLocalMedication,
  setPendingHighlightId,
  upsertLocalMedication,
} from "../../lib/meds/localMedsStore";
import {
  buildMedFormDataFromMedication,
  snapshotFromFormData,
  type MedFormData,
} from "../../lib/meds/formFromMedication";
import { findMedicationById } from "../../features/meds/repository";
import { useLanguage } from "../../lib/i18n/LanguageProvider";
import type { Medication } from "../../types/medication";

const PRIMARY_SOFT_CHIP = "rgba(0, 88, 188, 0.1)";
/** Light blue hairline on white cards (step 2 moments). */
const MOMENT_CARD_BORDER = "rgba(0, 88, 188, 0.2)";
/** Unselected time disk — light blue ring (mock). */
const MOMENT_DISK_IDLE = "rgba(0, 88, 188, 0.42)";
/** Divider above meal row. */
const MEAL_SECTION_RULE = "rgba(0, 88, 188, 0.12)";

type Step = 1 | 2 | 3 | 4 | 5;

type DosageForm = MedFormData["form"];
type MealRelation = "before" | "with" | "after";
type Moment = MedFormData["moments"][number];

function medicationFromWizardForm(
  id: string,
  data: MedFormData,
): Medication {
  const dosageLabel =
    data.form === "tablet"
      ? parseInt(data.quantity, 10) > 1
        ? "pills"
        : "pill"
      : data.form === "liquid"
        ? "ml"
        : "";
  const dosageStr = `${data.quantity} ${dosageLabel}`.trim();

  const activeMoments = data.moments.filter((m) => m.active);
  const scheduleStr = activeMoments
    .map((m) => {
      const meal =
        m.mealRelation === "before"
          ? "before meal"
          : m.mealRelation === "with"
            ? "with meal"
            : "after meal";
      return `${m.label} (${meal})`;
    })
    .join(", ");

  const stockN = parseInt(data.stock, 10);
  return {
    id,
    name: data.name.trim(),
    dosage: dosageStr,
    schedule: scheduleStr || "—",
    remainingDoses:
      data.stock.trim() && Number.isFinite(stockN) ? stockN : undefined,
    wizardSnapshot: snapshotFromFormData(data),
  };
}

const INITIAL_DATA: MedFormData = {
  name: "",
  whatFor: "",
  form: "tablet",
  quantity: "",
  moments: [
    { id: "morning", label: "Morning", active: false, mealRelation: "after" },
    { id: "noon", label: "Noon", active: false, mealRelation: "after" },
    { id: "evening", label: "Evening", active: false, mealRelation: "after" },
  ],
  stock: "",
  startDate: new Date().toISOString().split("T")[0] ?? "",
  endDate: "",
};

export default function AddMedicationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId =
    typeof params.editId === "string"
      ? params.editId
      : Array.isArray(params.editId)
        ? params.editId[0]
        : undefined;

  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<MedFormData>(INITIAL_DATA);
  const [baselineJson, setBaselineJson] = useState(() =>
    JSON.stringify(INITIAL_DATA),
  );
  const [unsavedVisible, setUnsavedVisible] = useState(false);
  const skipDirtyCheckRef = useRef(false);

  const progressTrackWidth = useSharedValue(0);
  const stepRatio = useSharedValue(step / 5);

  useEffect(() => {
    stepRatio.value = withTiming(step / 5, { duration: 340 });
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps -- stepRatio shared value

  const progressFillAnimated = useAnimatedStyle(() => ({
    width: Math.max(0, progressTrackWidth.value * stepRatio.value),
  }));

  const canContinue = useMemo(() => {
    if (step === 1) {
      return data.name.trim().length > 0 && data.quantity.trim().length > 0;
    }
    if (step === 2) {
      return data.moments.some((m) => m.active);
    }
    return true;
  }, [step, data]);

  const canSaveWizard = useMemo(
    () =>
      data.name.trim().length > 0 &&
      data.quantity.trim().length > 0 &&
      data.moments.some((m) => m.active),
    [data],
  );

  const isDirty = useMemo(
    () => JSON.stringify(data) !== baselineJson,
    [data, baselineJson],
  );

  const dataRef = useRef(data);
  const baselineJsonRef = useRef(baselineJson);
  dataRef.current = data;
  baselineJsonRef.current = baselineJson;

  useEffect(() => {
    if (!editId) {
      setData(INITIAL_DATA);
      setStep(1);
      const b = JSON.stringify(INITIAL_DATA);
      setBaselineJson(b);
      baselineJsonRef.current = b;
      return;
    }
    const med = findMedicationById(editId);
    if (!med) return;
    const next = buildMedFormDataFromMedication(med);
    setData(next);
    setStep(1);
    const b = JSON.stringify(next);
    setBaselineJson(b);
    baselineJsonRef.current = b;
  }, [editId]);

  useEffect(() => {
    const onHardwareBack = () => {
      if (unsavedVisible) {
        setUnsavedVisible(false);
        return true;
      }
      if (step > 1) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStep((s) => (s - 1) as Step);
        return true;
      }
      if (skipDirtyCheckRef.current) return false;
      if (JSON.stringify(dataRef.current) === baselineJsonRef.current) {
        return false;
      }
      setUnsavedVisible(true);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
    return () => sub.remove();
  }, [step, unsavedVisible]);

  const commitSave = useCallback(() => {
    const id = editId ?? Math.random().toString(36).substring(2, 9);
    const med = medicationFromWizardForm(id, data);
    if (editId) {
      upsertLocalMedication(med);
    } else {
      addLocalMedication(med);
      setPendingHighlightId(id);
    }
    const json = JSON.stringify(data);
    setBaselineJson(json);
    baselineJsonRef.current = json;
    skipDirtyCheckRef.current = true;
    router.back();
    setTimeout(() => {
      skipDirtyCheckRef.current = false;
    }, 400);
  }, [editId, data, router]);

  const discardUnsaved = useCallback(() => {
    setUnsavedVisible(false);
    skipDirtyCheckRef.current = true;
    router.back();
    setTimeout(() => {
      skipDirtyCheckRef.current = false;
    }, 400);
  }, [router]);

  const saveUnsavedAndLeave = useCallback(() => {
    if (!canSaveWizard) return;
    setUnsavedVisible(false);
    commitSave();
  }, [canSaveWizard, commitSave]);

  const keepEditing = useCallback(() => {
    setUnsavedVisible(false);
  }, []);

  const handleBack = useCallback(() => {
    if (step > 1) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => (s - 1) as Step);
      return;
    }
    if (!isDirty) {
      router.back();
      return;
    }
    setUnsavedVisible(true);
  }, [step, isDirty, router]);

  const handleContinue = useCallback(() => {
    if (step < 5) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => (s + 1) as Step);
    }
  }, [step]);

  const handleSave = useCallback(() => {
    commitSave();
  }, [commitSave]);

  const updateMoment = (id: string, updates: Partial<Moment>) => {
    setData((prev) => ({
      ...prev,
      moments: prev.moments.map((m) =>
        m.id === id ? { ...m, ...updates } : m,
      ),
    }));
  };

  return (
    <View style={styles.pageRoot}>
      <AppScreen scrollable={false}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <AppText variant="headlineMedium" style={styles.headerTitle}>
            {editId ? t("meds_screenEditTitle") : t("meds_screenAddTitle")}
          </AppText>
          <View style={styles.progressContainer}>
            <View
              style={styles.progressBar}
              onLayout={(e) => {
                progressTrackWidth.value = e.nativeEvent.layout.width;
              }}
            >
              <Animated.View
                style={[styles.progressFill, progressFillAnimated]}
              />
            </View>
            <AppText variant="labelSmall" style={styles.stepText}>
              Step {step} of 5
            </AppText>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            key={step}
            entering={FadeIn.duration(240)}
            exiting={FadeOut.duration(160)}
            style={styles.stepTransitionWrap}
          >
          {step === 1 && (
            <View style={styles.step}>
              <AppTextField
                label="Medication Name"
                placeholder="e.g., Paracetamol"
                value={data.name}
                onChangeText={(name) => setData((d) => ({ ...d, name }))}
              />

              <AppTextField
                label="What is it for? (Optional)"
                placeholder="e.g., Headache"
                value={data.whatFor}
                onChangeText={(whatFor) => setData((d) => ({ ...d, whatFor }))}
                style={{ marginTop: 20 }}
              />

              <View style={{ marginTop: 24 }}>
                <AppText variant="labelMedium" style={styles.sectionLabel}>
                  Dosage Form
                </AppText>
                <View style={styles.formPicker}>
                  {(["tablet", "liquid", "powder"] as DosageForm[]).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.formOption,
                        data.form === f && styles.formOptionActive,
                      ]}
                      onPress={() => setData((d) => ({ ...d, form: f }))}
                    >
                      <MaterialCommunityIcons
                        name={
                          f === "tablet"
                            ? "pill"
                            : f === "liquid"
                              ? "cup-water"
                              : "shaker-outline"
                        }
                        size={24}
                        color={
                          data.form === f
                            ? "#FFFFFF"
                            : paperTheme.colors.onSurfaceVariant
                        }
                      />
                      <AppText
                        style={[
                          styles.formLabel,
                          data.form === f && styles.formLabelActive,
                        ]}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <AppTextField
                label={
                  data.form === "tablet"
                    ? "How many pills?"
                    : data.form === "liquid"
                      ? "Quantity (ml)"
                      : "Quantity (e.g. 1 scoop)"
                }
                placeholder={
                  data.form === "tablet"
                    ? "1"
                    : data.form === "liquid"
                      ? "10"
                      : "1 scoop"
                }
                keyboardType={data.form === "powder" ? "default" : "numeric"}
                value={data.quantity}
                onChangeText={(quantity) =>
                  setData((d) => ({ ...d, quantity }))
                }
                style={{ marginTop: 24 }}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.step}>
              <AppText variant="labelMedium" style={styles.sectionLabelStep2}>
                When do you take it?
              </AppText>

              {data.moments.map((m) => (
                <AppCard
                  key={m.id}
                  style={styles.momentCard}
                  contentStyle={styles.momentCardContent}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.momentHeader,
                      pressed && styles.momentHeaderPressed,
                    ]}
                    onPress={() => updateMoment(m.id, { active: !m.active })}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: m.active }}
                    accessibilityLabel={`${m.label}, ${m.active ? "selected" : "not selected"}`}
                  >
                    <View
                      style={[
                        styles.momentToggleDisk,
                        m.active && styles.momentToggleDiskActive,
                      ]}
                    >
                      {m.active ? (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color="#FFFFFF"
                        />
                      ) : null}
                    </View>
                    <View style={styles.momentTitleWrap}>
                      <AppText variant="titleMedium" style={styles.momentTitle}>
                        {m.label}
                      </AppText>
                    </View>
                  </Pressable>

                  {m.active ? (
                    <Animated.View
                      entering={FadeIn.duration(200)}
                      style={styles.mealRelationContainer}
                      accessibilityLabel={`Meal relation for ${m.label}`}
                    >
                      <AppText variant="labelSmall" style={styles.mealLabel}>
                        Meal relation
                      </AppText>
                      <View
                        style={styles.mealChipRow}
                        accessibilityRole="radiogroup"
                      >
                        {(["before", "with", "after"] as MealRelation[]).map(
                          (r) => {
                            const selected = m.mealRelation === r;
                            return (
                              <Pressable
                                key={r}
                                style={({ pressed }) => [
                                  styles.mealChip,
                                  selected && styles.mealChipActive,
                                  pressed && styles.mealChipPressed,
                                ]}
                                onPress={() =>
                                  updateMoment(m.id, { mealRelation: r })
                                }
                                accessibilityRole="radio"
                                accessibilityState={{ selected }}
                                accessibilityLabel={`${r}, meal relation`}
                              >
                                <AppText
                                  style={[
                                    styles.mealChipText,
                                    selected && styles.mealChipTextActive,
                                  ]}
                                >
                                  {r.charAt(0).toUpperCase() + r.slice(1)}
                                </AppText>
                              </Pressable>
                            );
                          },
                        )}
                      </View>
                    </Animated.View>
                  ) : null}
                </AppCard>
              ))}
            </View>
          )}

          {step === 3 && (
            <View style={styles.step}>
              <AppTextField
                label="Stock Quantity (Optional)"
                placeholder="e.g. 30"
                keyboardType="numeric"
                value={data.stock}
                onChangeText={(stock) => setData((d) => ({ ...d, stock }))}
              />
              <AppText variant="bodySmall" style={styles.helperText}>
                {"We'll use this to notify you when you're running low."}
              </AppText>
            </View>
          )}

          {step === 4 && (
            <View style={styles.step}>
              <AppText variant="labelMedium" style={styles.sectionLabel}>
                Duration (Optional)
              </AppText>
              <AppTextField
                label="Start Date"
                placeholder="YYYY-MM-DD"
                value={data.startDate}
                onChangeText={(startDate) =>
                  setData((d) => ({ ...d, startDate }))
                }
                style={{ marginTop: 12 }}
              />
              <AppTextField
                label="End Date"
                placeholder="YYYY-MM-DD"
                value={data.endDate}
                onChangeText={(endDate) => setData((d) => ({ ...d, endDate }))}
                style={{ marginTop: 20 }}
              />
            </View>
          )}

          {step === 5 && (
            <View style={styles.step}>
              <AppText variant="titleLarge" style={styles.reviewHeading}>
                Review Medication
              </AppText>

              <ReviewItem
                label="Identity"
                title={data.name}
                subtitle={data.whatFor}
                onEdit={() => setStep(1)}
              />

              <ReviewItem
                label="Dosage"
                title={`${data.quantity} ${data.form}`}
                onEdit={() => setStep(1)}
              />

              <ReviewItem
                label="Schedule"
                title={data.moments
                  .filter((m) => m.active)
                  .map((m) => `${m.label} (${m.mealRelation})`)
                  .join(", ")}
                onEdit={() => setStep(2)}
              />

              {data.stock ? (
                <ReviewItem
                  label="Stock"
                  title={`Current stock: ${data.stock}`}
                  onEdit={() => setStep(3)}
                />
              ) : null}

              {(data.startDate || data.endDate) && (
                <ReviewItem
                  label="Duration"
                  title={[
                    data.startDate ? `Starts: ${data.startDate}` : null,
                    data.endDate ? `Ends: ${data.endDate}` : null,
                  ]
                    .filter(Boolean)
                    .join("\n")}
                  onEdit={() => setStep(4)}
                />
              )}
            </View>
          )}
          </Animated.View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <View style={styles.footerCancelWrap}>
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={step === 1 ? "Cancel" : "Back"}
              style={({ pressed }) => [
                styles.footerCancelPressable,
                pressed && styles.footerCancelPressed,
              ]}
            >
              <AppText style={styles.footerCancelLabel}>
                {step === 1 ? "Cancel" : "Back"}
              </AppText>
            </Pressable>
          </View>
          <View style={styles.footerContinueWrap}>
            <Pressable
              onPress={step < 5 ? handleContinue : handleSave}
              disabled={step < 5 && !canContinue}
              accessibilityRole="button"
              accessibilityLabel={step < 5 ? "Continue" : "Save medication"}
              accessibilityState={{
                disabled: step < 5 && !canContinue,
              }}
              style={({ pressed }) => [
                styles.footerContinuePill,
                step < 5 &&
                  !canContinue &&
                  styles.footerContinuePillDisabled,
                pressed &&
                  (step >= 5 || canContinue) &&
                  styles.footerContinuePillPressed,
              ]}
            >
              <AppText
                style={[
                  styles.footerContinueLabel,
                  step < 5 &&
                    !canContinue &&
                    styles.footerContinueLabelDisabled,
                ]}
              >
                {step < 5 ? "Continue" : "Save Medication"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </AppScreen>

      <Portal>
        <Dialog visible={unsavedVisible} onDismiss={keepEditing}>
          <Dialog.Title>{t("meds_unsavedTitle")}</Dialog.Title>
          <Dialog.Content>
            <AppText variant="bodyMedium" style={styles.unsavedDialogBody}>
              {t("meds_unsavedBody")}
            </AppText>
          </Dialog.Content>
          <Dialog.Actions style={styles.unsavedDialogActions}>
            <PaperButton onPress={keepEditing}>{t("meds_unsavedKeep")}</PaperButton>
            <PaperButton onPress={discardUnsaved}>
              {t("meds_unsavedDiscard")}
            </PaperButton>
            <PaperButton
              mode="contained"
              onPress={saveUnsavedAndLeave}
              disabled={!canSaveWizard}
            >
              {t("meds_unsavedSave")}
            </PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function ReviewItem({
  label,
  title,
  subtitle,
  onEdit,
}: {
  label: string;
  title: string;
  subtitle?: string;
  onEdit: () => void;
}) {
  return (
    <TouchableOpacity style={styles.reviewItem} onPress={onEdit}>
      <View style={{ flex: 1 }}>
        <AppText variant="labelSmall" style={styles.reviewLabel}>
          {label}
        </AppText>
        <AppText variant="titleMedium">{title}</AppText>
        {subtitle ? (
          <AppText variant="bodySmall" style={styles.reviewSubtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <MaterialCommunityIcons
        name="pencil-outline"
        size={20}
        color={paperTheme.colors.primary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: paperTheme.colors.background,
  },
  header: {
    paddingHorizontal: 0,
    paddingBottom: 8,
    backgroundColor: paperTheme.colors.background,
  },
  headerTitle: {
    color: paperTheme.colors.onSurface,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  progressContainer: {
    marginTop: 18,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(0, 88, 188, 0.08)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: paperTheme.colors.primary,
    borderRadius: 999,
  },
  stepText: {
    marginTop: 8,
    color: paperTheme.colors.onSurfaceVariant,
    opacity: 0.92,
  },
  content: {
    flex: 1,
    backgroundColor: paperTheme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 40,
  },
  stepTransitionWrap: {
    flexGrow: 1,
  },
  step: {
    gap: 8,
  },
  sectionLabel: {
    marginBottom: 12,
    color: paperTheme.colors.onSurfaceVariant,
  },
  sectionLabelStep2: {
    marginBottom: 14,
    marginTop: 2,
    color: paperTheme.colors.onSurfaceVariant,
    opacity: 0.88,
    letterSpacing: 0.2,
  },
  helperText: {
    marginTop: 12,
    color: paperTheme.colors.onSurfaceVariant,
    paddingHorizontal: 4,
  },
  reviewHeading: {
    marginBottom: 20,
    color: paperTheme.colors.onSurface,
    fontWeight: "700",
  },
  formPicker: {
    flexDirection: "row",
    gap: 12,
  },
  formOption: {
    flex: 1,
    height: 80,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: paperTheme.colors.outline,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  formOptionActive: {
    backgroundColor: paperTheme.colors.primary,
    borderColor: paperTheme.colors.primary,
  },
  formLabel: {
    fontSize: 12,
    color: paperTheme.colors.onSurfaceVariant,
    fontWeight: "600",
  },
  formLabelActive: {
    color: "#FFFFFF",
  },
  momentCard: {
    padding: 0,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: MOMENT_CARD_BORDER,
    backgroundColor: "#FFFFFF",
    elevation: 0,
    shadowOpacity: 0,
  },
  momentCardContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  momentHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    minHeight: 54,
    gap: 14,
  },
  momentHeaderPressed: {
    opacity: 0.85,
  },
  momentToggleDisk: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: MOMENT_DISK_IDLE,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  momentToggleDiskActive: {
    borderColor: paperTheme.colors.primary,
    backgroundColor: paperTheme.colors.primary,
  },
  momentTitleWrap: {
    flex: 1,
    justifyContent: "center",
  },
  momentTitle: {
    fontWeight: "600",
    color: paperTheme.colors.onSurface,
  },
  mealRelationContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: MEAL_SECTION_RULE,
    backgroundColor: "transparent",
  },
  mealLabel: {
    marginBottom: 8,
    color: paperTheme.colors.onSurfaceVariant,
    fontWeight: "500",
    opacity: 0.9,
  },
  mealChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mealChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: paperTheme.colors.outline,
    backgroundColor: "#FFFFFF",
  },
  mealChipActive: {
    borderColor: paperTheme.colors.primary,
    backgroundColor: PRIMARY_SOFT_CHIP,
  },
  mealChipPressed: {
    opacity: 0.88,
  },
  mealChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: paperTheme.colors.onSurfaceVariant,
  },
  mealChipTextActive: {
    color: paperTheme.colors.primary,
  },
  reviewItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: paperTheme.colors.surfaceVariant,
    gap: 12,
  },
  reviewLabel: {
    color: paperTheme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  reviewSubtitle: {
    color: paperTheme.colors.onSurfaceVariant,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingTop: 16,
    gap: 12,
    backgroundColor: paperTheme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: paperTheme.colors.surfaceVariant,
  },
  footerCancelWrap: {
    flexShrink: 0,
    justifyContent: "center",
    minHeight: 56,
  },
  footerContinueWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    minHeight: 56,
  },
  footerCancelPressable: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: paperTheme.colors.outline,
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  footerCancelPressed: {
    opacity: 0.72,
  },
  footerCancelLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: paperTheme.colors.primary,
  },
  footerContinuePill: {
    alignSelf: "stretch",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: paperTheme.colors.primary,
    backgroundColor: paperTheme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  footerContinuePillDisabled: {
    backgroundColor: "#FFFFFF",
    borderColor: paperTheme.colors.outline,
  },
  footerContinuePillPressed: {
    opacity: 0.9,
  },
  footerContinueLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footerContinueLabelDisabled: {
    color: paperTheme.colors.onSurfaceVariant,
  },
  unsavedDialogBody: {
    color: paperTheme.colors.onSurfaceVariant,
  },
  unsavedDialogActions: {
    flexWrap: "wrap",
    justifyContent: "flex-end",
    rowGap: 8,
  },
});
