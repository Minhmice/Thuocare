import { useState, useCallback, useMemo } from "react";
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppScreen } from "../../components/ui/AppScreen";
import { AppText } from "../../components/ui/AppText";
import { AppButton } from "../../components/ui/AppButton";
import { AppTextField } from "../../components/ui/AppTextField";
import { AppCard } from "../../components/ui/AppCard";
import { paperTheme } from "../../theme/paperTheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { addLocalMedication, setPendingHighlightId } from "../../lib/meds/localMedsStore";

type Step = 1 | 2 | 3 | 4 | 5;

type DosageForm = "tablet" | "liquid" | "powder";
type MealRelation = "before" | "with" | "after";

type Moment = {
  id: "morning" | "noon" | "evening";
  label: string;
  active: boolean;
  mealRelation: MealRelation;
};

type FormData = {
  name: string;
  whatFor: string;
  form: DosageForm;
  quantity: string;
  moments: Moment[];
  stock: string;
  startDate: string;
  endDate: string;
};

const INITIAL_DATA: FormData = {
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
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormData>(INITIAL_DATA);

  const canContinue = useMemo(() => {
    if (step === 1) {
      return data.name.trim().length > 0 && data.quantity.trim().length > 0;
    }
    if (step === 2) {
      return data.moments.some((m) => m.active);
    }
    return true;
  }, [step, data]);

  const handleBack = useCallback(() => {
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => (s - 1) as Step);
    }
  }, [step, router]);

  const handleContinue = useCallback(() => {
    if (step < 5) {
      setStep((s) => (s + 1) as Step);
    }
  }, [step]);

  const handleSave = useCallback(() => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Construct dosage and schedule strings for the list view
    const dosageLabel = data.form === "tablet" ? (parseInt(data.quantity) > 1 ? "pills" : "pill") : (data.form === "liquid" ? "ml" : "");
    const dosageStr = `${data.quantity} ${dosageLabel}`.trim();
    
    const activeMoments = data.moments.filter(m => m.active);
    const scheduleStr = activeMoments.map(m => {
        const meal = m.mealRelation === "before" ? "before meal" : (m.mealRelation === "with" ? "with meal" : "after meal");
        return `${m.label} (${meal})`;
    }).join(", ");

    addLocalMedication({
      id,
      name: data.name,
      dosage: dosageStr,
      schedule: scheduleStr || "—",
      remainingDoses: data.stock ? parseInt(data.stock) : undefined,
    });

    setPendingHighlightId(id);
    router.back();
  }, [data, router]);

  const renderStepProgress = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(step / 5) * 100}%` }
            ]} 
          />
        </View>
        <AppText variant="labelSmall" style={styles.stepText}>
          Step {step} of 5
        </AppText>
      </View>
    );
  };

  const updateMoment = (id: string, updates: Partial<Moment>) => {
    setData(prev => ({
      ...prev,
      moments: prev.moments.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
  };

  return (
    <AppScreen scrollable={false}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <AppText variant="headlineSmall">Add Medication</AppText>
        {renderStepProgress()}
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
              <AppText variant="labelMedium" style={styles.sectionLabel}>Dosage Form</AppText>
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
                      name={f === "tablet" ? "pill" : f === "liquid" ? "cup-water" : "shaker-outline"} 
                      size={24} 
                      color={data.form === f ? "#FFFFFF" : paperTheme.colors.onSurfaceVariant} 
                    />
                    <AppText style={[styles.formLabel, data.form === f && styles.formLabelActive]}>
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
              placeholder={data.form === "tablet" ? "1" : data.form === "liquid" ? "10" : "1 scoop"}
              keyboardType={data.form === "powder" ? "default" : "numeric"}
              value={data.quantity}
              onChangeText={(quantity) => setData((d) => ({ ...d, quantity }))}
              style={{ marginTop: 24 }}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <AppText variant="labelMedium" style={styles.sectionLabel}>When do you take it?</AppText>
            
            {data.moments.map((m) => (
              <AppCard key={m.id} style={styles.momentCard}>
                <TouchableOpacity 
                  style={styles.momentHeader}
                  onPress={() => updateMoment(m.id, { active: !m.active })}
                >
                  <MaterialCommunityIcons 
                    name={m.active ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                    size={24} 
                    color={m.active ? paperTheme.colors.primary : paperTheme.colors.outline} 
                  />
                  <View style={{ marginLeft: 12 }}>
                    <AppText variant="titleMedium" style={styles.momentTitle}>{m.label}</AppText>
                  </View>
                </TouchableOpacity>

                {m.active && (
                  <View style={styles.mealRelationContainer}>
                    <AppText variant="labelSmall" style={styles.mealLabel}>Meal relation</AppText>
                    <View style={styles.mealPicker}>
                      {(["before", "with", "after"] as MealRelation[]).map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[
                            styles.mealOption,
                            m.mealRelation === r && styles.mealOptionActive,
                          ]}
                          onPress={() => updateMoment(m.id, { mealRelation: r })}
                        >
                          <AppText style={[styles.mealOptionText, m.mealRelation === r && styles.mealOptionTextActive]}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
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
            <AppText variant="bodySmall" style={{ marginTop: 12, color: paperTheme.colors.onSurfaceVariant, paddingHorizontal: 4 }}>
              We'll use this to notify you when you're running low.
            </AppText>
          </View>
        )}

        {step === 4 && (
          <View style={styles.step}>
            <AppText variant="labelMedium" style={styles.sectionLabel}>Duration (Optional)</AppText>
            <AppTextField
              label="Start Date"
              placeholder="YYYY-MM-DD"
              value={data.startDate}
              onChangeText={(startDate) => setData((d) => ({ ...d, startDate }))}
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
            <AppText variant="titleLarge" style={{ marginBottom: 20 }}>Review Medication</AppText>
            
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
              title={data.moments.filter(m => m.active).map(m => `${m.label} (${m.mealRelation})`).join(", ")} 
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
                title={
                  [
                    data.startDate ? `Starts: ${data.startDate}` : null,
                    data.endDate ? `Ends: ${data.endDate}` : null
                  ].filter(Boolean).join("\n")
                } 
                onEdit={() => setStep(4)} 
              />
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <AppButton 
          mode="text" 
          onPress={handleBack} 
          style={styles.navButton}
        >
          {step === 1 ? "Cancel" : "Back"}
        </AppButton>
        
        {step < 5 ? (
          <AppButton 
            onPress={handleContinue} 
            disabled={!canContinue}
            style={styles.navButton}
          >
            Continue
          </AppButton>
        ) : (
          <AppButton 
            onPress={handleSave} 
            style={styles.navButton}
          >
            Save Medication
          </AppButton>
        )}
      </View>
    </AppScreen>
  );
}

function ReviewItem({ label, title, subtitle, onEdit }: { label: string, title: string, subtitle?: string, onEdit: () => void }) {
  return (
    <TouchableOpacity style={styles.reviewItem} onPress={onEdit}>
      <View style={{ flex: 1 }}>
        <AppText variant="labelSmall" style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 2 }}>{label}</AppText>
        <AppText variant="titleMedium">{title}</AppText>
        {subtitle ? <AppText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>{subtitle}</AppText> : null}
      </View>
      <MaterialCommunityIcons name="pencil-outline" size={20} color={paperTheme.colors.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: paperTheme.colors.surfaceVariant,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: paperTheme.colors.surfaceVariant,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: paperTheme.colors.primary,
  },
  stepText: {
    marginTop: 6,
    color: paperTheme.colors.onSurfaceVariant,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  step: {
    gap: 8,
  },
  sectionLabel: {
    marginBottom: 12,
    color: paperTheme.colors.onSurfaceVariant,
  },
  formPicker: {
    flexDirection: "row",
    gap: 12,
  },
  formOption: {
    flex: 1,
    height: 80,
    borderRadius: 20,
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
    marginBottom: 12,
    overflow: "hidden",
  },
  momentHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 0,
  },
  momentTitle: {
    fontWeight: "600",
  },
  mealRelationContainer: {
    borderTopWidth: 1,
    borderTopColor: paperTheme.colors.surfaceVariant,
    padding: 16,
    backgroundColor: "rgba(0, 88, 188, 0.03)",
  },
  mealLabel: {
    marginBottom: 8,
    color: paperTheme.colors.onSurfaceVariant,
  },
  mealPicker: {
    flexDirection: "row",
    backgroundColor: paperTheme.colors.surfaceVariant,
    borderRadius: 12,
    padding: 2,
  },
  mealOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  mealOptionActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  mealOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: paperTheme.colors.onSurfaceVariant,
  },
  mealOptionTextActive: {
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
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: paperTheme.colors.surfaceVariant,
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
});
