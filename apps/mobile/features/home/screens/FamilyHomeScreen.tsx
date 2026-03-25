import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export function FamilyHomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Family lane</Text>
        <Text style={styles.title}>Quan ly thuoc cho nguoi than</Text>
        <Text style={styles.body}>
          Workflow gia dinh da co nen tang trong schema va lane detection. App layer hien
          tai da route dung vao family lane, va phase tiep theo se bo sung ho so nguoi than,
          delegated caregiver workflow, va shared reminders.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Muc tieu lane nay</Text>
        <Text style={styles.cardText}>1 tai khoan co the quan ly nhieu thanh vien trong gia dinh.</Text>
        <Text style={styles.cardText}>Moi profile co the duoc gan role caregiver / guardian / viewer / proxy.</Text>
        <Text style={styles.cardText}>Dose reminders, missed-dose alerts va coordination se di theo quyen.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trang thai hien tai</Text>
        <Text style={styles.cardText}>
          Day la family-specific home thay cho QA shell. UI household chi tiet se duoc them theo phase plan.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16, gap: 16 },
  hero: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  eyebrow: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },
  body: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  cardText: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 20,
  },
});
