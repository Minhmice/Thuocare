import { ActivityIndicator, StyleSheet } from "react-native";

import { View } from "@/components/Themed";
import { FamilyHomeScreen } from "@/features/home/screens/FamilyHomeScreen";
import { HospitalHomeScreen } from "@/features/home/screens/HospitalHomeScreen";
import { PersonalHomeScreen } from "@/features/personal/screens/PersonalHomeScreen";
import { useLaneDetection } from "@/lib/personal/use-lane-detection";

export default function HomeTabRoute() {
  const { lane, isLoading: laneLoading } = useLaneDetection();

  if (laneLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  }

  if (lane === "personal") return <PersonalHomeScreen />;
  if (lane === "family") return <FamilyHomeScreen />;
  return <HospitalHomeScreen lane={lane} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
