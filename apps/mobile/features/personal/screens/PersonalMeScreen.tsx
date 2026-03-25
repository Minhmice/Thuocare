import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";

import { useMobileAuth } from "@/lib/auth/mobile-auth";
import { usePersonalProfile } from "@/lib/personal/use-personal-profile";
import { useUpdatePersonalProfile } from "@/lib/personal/use-update-personal-profile";

export function PersonalMeScreen() {
  const { signOut } = useMobileAuth();
  const { data: profile, isLoading } = usePersonalProfile();
  const { mutateAsync: saveProfile, isPending: saving } = useUpdatePersonalProfile();
  const [signingOut, setSigningOut] = useState(false);

  const [preferredName, setPreferredName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [languageCode, setLanguageCode] = useState("");

  useEffect(() => {
    if (!profile) return;
    setPreferredName(profile.preferredName ?? "");
    setTimezone(profile.timezone ?? "");
    setLanguageCode(profile.languageCode ?? "");
  }, [profile]);

  const displayName = preferredName.trim() || profile?.preferredName?.trim() || "Bạn";

  const onSave = () => {
    void (async () => {
      try {
        await saveProfile({
          preferredName: preferredName.trim() === "" ? null : preferredName.trim(),
          timezone: timezone.trim() === "" ? null : timezone.trim(),
          languageCode: languageCode.trim() === "" ? null : languageCode.trim().toLowerCase(),
        });
        Alert.alert("Đã lưu", "Hồ sơ cá nhân đã được cập nhật.");
      } catch {
        Alert.alert("Lỗi", "Không lưu được. Kiểm tra kết nối và thử lại.");
      }
    })();
  };

  const onSignOut = () => {
    Alert.alert("Đăng xuất?", "Bạn sẽ cần đăng nhập lại để xem lịch thuốc.", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setSigningOut(true);
            try {
              await signOut();
            } finally {
              setSigningOut(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <Text style={styles.lanePill}>Theo dõi cá nhân</Text>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.tagline}>Ứng dụng nhắc thuốc cho bạn — không thay cho tư vấn y tế.</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color="#4a6670" style={{ marginVertical: 16 }} />
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hồ sơ cá nhân</Text>
          <Text style={styles.fieldHint}>Chỉnh sửa và nhấn Lưu. Để trống mục tùy chọn nếu không cần lưu.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Tên gọi ưa thích</Text>
            <TextInput
              style={styles.input}
              value={preferredName}
              onChangeText={setPreferredName}
              placeholder="VD: Chị Lan"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Múi giờ (IANA)</Text>
            <TextInput
              style={styles.input}
              value={timezone}
              onChangeText={setTimezone}
              placeholder="VD: Asia/Ho_Chi_Minh"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
            <Text style={styles.microHint}>Dùng khi bạn muốn lưu múi giờ cố định trên hồ sơ (không bắt buộc).</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mã ngôn ngữ hồ sơ</Text>
            <TextInput
              style={styles.input}
              value={languageCode}
              onChangeText={setLanguageCode}
              placeholder="vi hoặc en"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              maxLength={12}
            />
            <Text style={styles.microHint}>Giao diện app có thể vẫn là tiếng Việt; trường này để đồng bộ hồ sơ.</Text>
          </View>

          <Pressable
            onPress={onSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.disabled]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Lưu hồ sơ</Text>
            )}
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nhắc nhở</Text>
        <Text style={styles.body}>
          Thuocare hiện nhắc trong ứng dụng khi bạn mở app. Chúng tôi chưa gửi thông báo đẩy (push) tự động —
          sẽ thông báo khi tính năng sẵn sàng.
        </Text>
      </View>

      <Pressable
        onPress={onSignOut}
        disabled={signingOut}
        style={[styles.signOutBtn, signingOut && styles.disabled]}
      >
        {signingOut ? (
          <ActivityIndicator color="#b91c1c" />
        ) : (
          <Text style={styles.signOutText}>Đăng xuất</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f5" },
  content: { padding: 20, paddingBottom: 48 },
  hero: { marginBottom: 20 },
  lanePill: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "700",
    color: "#374942",
    backgroundColor: "#dce6e1",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: { fontSize: 26, fontWeight: "700", color: "#1c2a24", marginTop: 12 },
  tagline: { fontSize: 14, color: "#5c6f66", marginTop: 8, lineHeight: 21 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8e4",
    gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1c2a24", marginBottom: 4 },
  fieldHint: { fontSize: 13, color: "#5c6f66", lineHeight: 20, marginBottom: 8 },
  field: { gap: 6, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151" },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#111827",
  },
  microHint: { fontSize: 11, color: "#9ca3af", lineHeight: 16 },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#4a6670",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  body: { fontSize: 14, color: "#374942", lineHeight: 22 },
  signOutBtn: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  signOutText: { color: "#b91c1c", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.6 },
});
