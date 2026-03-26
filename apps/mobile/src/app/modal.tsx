import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Text } from '@/shared/ui';
import { MedFormScreen } from '@/features/meds/pages/form/screen';
import { ActionMenuModal } from '@/features/modals/components/ActionMenuModal';

export default function ModalScreen() {
  const params = useLocalSearchParams<{ screen?: string; id?: string }>();

  if (params.screen === 'med-form') {
    return <MedFormScreen />;
  }

  return <ActionMenuModal />;
}
