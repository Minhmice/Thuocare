import { useLocalSearchParams } from "expo-router";

import { EditMedicationScreen } from "@/features/personal/screens/EditMedicationScreen";

export default function EditMedicationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const medicationId = typeof id === "string" ? id : "";

  return <EditMedicationScreen medicationId={medicationId} />;
}
