import { useEffect, useState } from 'react';
import { mobileSupabase } from '@/lib/supabase/mobile-client';
import { useRouter, useSegments } from 'expo-router';

export type UserKind = 'staff' | 'patient' | 'unresolved' | 'none';

export interface ActorState {
  kind: UserKind;
  patientId?: string;
  organizationId?: string;
}

type AuthBindingStatus = {
  patient_id: string | null;
  organization_id: string | null;
  staff_user_account_id: string | null;
};

export function useActor() {
  const [actor, setActor] = useState<ActorState | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await mobileSupabase.auth.getSession();
      
      if (!session) {
        setActor({ kind: 'none' });
        setLoading(false);
        return;
      }

      // High-level RPC call to evaluate binding status (provided by backend)
      const { data, error } = await mobileSupabase.rpc('my_auth_binding_status');
      const binding = data as AuthBindingStatus | null;

      if (error || !binding) {
        setActor({ kind: 'unresolved' });
      } else if (binding.patient_id && binding.organization_id) {
        setActor({ 
          kind: 'patient', 
          patientId: binding.patient_id, 
          organizationId: binding.organization_id 
        });
      } else if (binding.staff_user_account_id) {
        setActor({ kind: 'staff' });
      } else {
        setActor({ kind: 'unresolved' });
      }
      
      setLoading(false);
    };

    checkUser();
  }, []);

  useEffect(() => {
    if (loading || !actor) return;

    const inAuthGroup = segments[0] === '(auth)';
    const kind = actor.kind;

    const secondSegment = (segments as string[])[1];

    if (kind === 'none' && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (kind === 'patient' && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (kind === 'staff' && inAuthGroup) {
      router.replace('/(auth)/unsupported'); // High-level decision: staff not supported on mobile yet
    } else if (kind === 'unresolved' && inAuthGroup && secondSegment !== 'resolve-account') {
      router.replace('/(auth)/resolve-account');
    }
  }, [actor, loading, segments]);

  return { actor, loading };
}
