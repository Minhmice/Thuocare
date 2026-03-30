import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View
} from "react-native";
import { Menu, Button as PaperButton } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppScreen } from "../components/ui/AppScreen";
import { AppTextField } from "../components/ui/AppTextField";
import { AppText } from "../components/ui/AppText";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "../features/feedback/types";
import { submitAppFeedback } from "../features/feedback/repository";
import { Button } from "../features/components/wrapper/button";
import { useLanguage, type TranslationKey } from "../lib/i18n/LanguageProvider";
import { paperTheme } from "../theme/paperTheme";

const PROBLEM_MIN_LEN = 10;

const CATEGORY_I18N: Record<FeedbackCategory, TranslationKey> = {
  bug: "feedback_category_bug",
  ui_ux: "feedback_category_ui_ux",
  medications: "feedback_category_medications",
  account: "feedback_category_account",
  performance: "feedback_category_performance",
  other: "feedback_category_other"
};

function newFeedbackId(): string {
  const bytes = new Uint8Array(16);
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function FeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [problem, setProblem] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const categoryLabel = useCallback(
    (c: FeedbackCategory) => t(CATEGORY_I18N[c]),
    [t]
  );

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("feedback_title"), t("feedback_photoPermissionDenied"));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85
    });
    if (!res.canceled && res.assets[0]?.uri) {
      setImageUri(res.assets[0].uri);
    }
  }, [t]);

  const clearImage = useCallback(() => {
    setImageUri(null);
  }, []);

  const onSubmit = useCallback(async () => {
    if (rating == null) {
      Alert.alert(t("feedback_title"), t("feedback_validationRating"));
      return;
    }
    if (!category) {
      Alert.alert(t("feedback_title"), t("feedback_validationCategory"));
      return;
    }
    if (problem.trim().length < PROBLEM_MIN_LEN) {
      Alert.alert(t("feedback_title"), t("feedback_validationProblem"));
      return;
    }
    setSubmitting(true);
    try {
      await submitAppFeedback({
        id: newFeedbackId(),
        rating,
        category,
        problemDescription: problem,
        imageUri
      });
      Alert.alert(t("feedback_title"), t("feedback_success"), [
        { text: t("common_ok"), onPress: () => router.back() }
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("feedback_error");
      Alert.alert(t("feedback_title"), msg);
    } finally {
      setSubmitting(false);
    }
  }, [rating, category, problem, imageUri, router, t]);

  const menuAnchor = (
    <PaperButton
      mode="outlined"
      onPress={() => setMenuOpen(true)}
      style={styles.categoryButton}
      contentStyle={styles.categoryButtonContent}
    >
      {category ? categoryLabel(category) : t("feedback_categoryPlaceholder")}
    </PaperButton>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backHit}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("feedback_back")}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={paperTheme.colors.primary}
          />
        </Pressable>
        <AppText variant="titleLarge" style={styles.topTitle}>
          {t("feedback_title")}
        </AppText>
        <View style={styles.backHit} />
      </View>

      <AppScreen>
        <AppText variant="bodyMedium" style={styles.guide}>
          {t("feedback_guide")}
        </AppText>

        <AppText variant="labelLarge" style={styles.fieldLabel}>
          {t("feedback_ratingLabel")}
        </AppText>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setRating(n)}
              style={styles.starHit}
              accessibilityRole="button"
              accessibilityLabel={`${n}`}
            >
              <MaterialCommunityIcons
                name={rating != null && n <= rating ? "star" : "star-outline"}
                size={36}
                color={paperTheme.colors.primary}
              />
            </Pressable>
          ))}
        </View>

        <AppText variant="labelLarge" style={styles.fieldLabel}>
          {t("feedback_categoryLabel")}
        </AppText>
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={menuAnchor}
        >
          {FEEDBACK_CATEGORIES.map((c) => (
            <Menu.Item
              key={c}
              onPress={() => {
                setCategory(c);
                setMenuOpen(false);
              }}
              title={categoryLabel(c)}
            />
          ))}
        </Menu>

        <AppTextField
          label={t("feedback_problemLabel")}
          placeholder={t("feedback_problemPlaceholder")}
          value={problem}
          onChangeText={setProblem}
          multiline
          numberOfLines={5}
          style={styles.problemField}
          textAlignVertical="top"
        />

        <AppText variant="labelLarge" style={styles.fieldLabel}>
          {t("feedback_screenshotLabel")}
        </AppText>
        <AppText variant="bodySmall" style={styles.hint}>
          {t("feedback_screenshotHint")}
        </AppText>
        <View style={styles.photoRow}>
          <Button
            variant="secondary"
            label={t("feedback_pickPhoto")}
            onPress={pickImage}
            style={styles.pickPhotoBtn}
          />
          {imageUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: imageUri }} style={styles.preview} />
              <Pressable onPress={clearImage} style={styles.removePhoto}>
                <AppText variant="labelMedium" style={{ color: paperTheme.colors.error }}>
                  {t("feedback_removePhoto")}
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Button
          variant="primary"
          label={t("feedback_submit")}
          onPress={() => void onSubmit()}
          loading={submitting}
          disabled={submitting}
          style={styles.submitBtn}
        />
      </AppScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  backHit: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: "700"
  },
  guide: {
    lineHeight: 22,
    color: paperTheme.colors.onSurfaceVariant
  },
  fieldLabel: {
    marginTop: 8,
    marginBottom: 6
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8
  },
  starHit: {
    padding: 4
  },
  categoryButton: {
    borderRadius: 12,
    borderColor: paperTheme.colors.outline
  },
  categoryButtonContent: {
    justifyContent: "flex-start"
  },
  problemField: {
    minHeight: 120
  },
  hint: {
    color: paperTheme.colors.onSurfaceVariant,
    marginBottom: 4
  },
  photoRow: {
    gap: 12,
    marginTop: 8
  },
  pickPhotoBtn: {
    alignSelf: "flex-start"
  },
  previewWrap: {
    gap: 8
  },
  preview: {
    width: "100%",
    maxWidth: 280,
    height: 200,
    borderRadius: 12,
    backgroundColor: paperTheme.colors.surfaceVariant
  },
  removePhoto: {
    alignSelf: "flex-start"
  },
  submitBtn: {
    marginTop: 16
  }
});
