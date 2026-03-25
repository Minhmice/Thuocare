import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";

import { Text } from "@/components/Themed";
import { PersonalMedicationsTabScreen } from "@/features/personal/screens/PersonalMedicationsTabScreen";
import { useLaneDetection } from "@/lib/personal/use-lane-detection";

export default function MedicationsTabRoute() {
  const { lane, isLoading } = useLaneDetection();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#4a6670" />
        <Text style={styles.muted}>Đang tải…</Text>
      </View>
    );
  }

  if (lane !== "personal") {
    return <Redirect href="/(tabs)" />;
  }

  return <PersonalMedicationsTabScreen />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  muted: { fontSize: 13, color: "#5c6f66" },
});
