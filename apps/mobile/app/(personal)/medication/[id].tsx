import { useLocalSearchParams } from "expo-router";

import { MedicationDetailScreen } from "@/features/personal/screens/MedicationDetailScreen";

export default function MedicationDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MedicationDetailScreen medicationId={typeof id === "string" ? id : ""} />;
}
