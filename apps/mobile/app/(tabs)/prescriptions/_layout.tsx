import { Stack } from 'expo-router';

export default function PrescriptionsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Prescriptions' }} />
      <Stack.Screen name="[prescriptionId]" options={{ title: 'Prescription' }} />
    </Stack>
  );
}
