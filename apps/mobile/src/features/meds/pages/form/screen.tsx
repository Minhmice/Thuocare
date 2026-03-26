import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Text } from "@/shared/ui";
import type { MedStatus } from "@/shared/types/meds";
import { useCreateMed, useDeleteMed, useMedById, useSetMedStatus, useUpdateMed } from "@/features/meds/data/use-meds";

const statusOptions: Array<{ id: MedStatus; label: string }> = [
  { id: "active", label: "Đang dùng" },
  { id: "paused", label: "Tạm dừng" },
  { id: "stopped", label: "Đã dừng" },
];

function splitTimes(value: string): string[] {
  return value
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isValidHHmm(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(":").map((n) => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function normalizeTimes(raw: string): { times: string[]; error: string | null } {
  const parts = splitTimes(raw);
  if (parts.length === 0) return { times: [], error: null };
  for (const p of parts) {
    if (!isValidHHmm(p)) return { times: [], error: `Giờ uống không hợp lệ: "${p}". Định dạng đúng: HH:mm` };
  }
  const unique = Array.from(new Set(parts));
  unique.sort();
  return { times: unique, error: null };
}

export function MedFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? null;

  const { data: existing } = useMedById(id ?? "");
  const isEdit = Boolean(id && existing);

  const initial = useMemo(() => {
    return {
      displayName: existing?.displayName ?? "",
      strengthText: existing?.strengthText ?? "",
      scheduleTimesText: existing?.scheduleTimes?.join(", ") ?? "",
      notes: existing?.notes ?? "",
      status: existing?.status ?? ("active" as MedStatus),
    };
  }, [existing]);

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [strengthText, setStrengthText] = useState(initial.strengthText);
  const [scheduleTimesText, setScheduleTimesText] = useState(initial.scheduleTimesText);
  const [notes, setNotes] = useState(initial.notes);
  const [status, setStatus] = useState<MedStatus>(initial.status);

  const create = useCreateMed();
  const update = useUpdateMed();
  const setMedStatus = useSetMedStatus();
  const del = useDeleteMed();
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(initial.displayName);
    setStrengthText(initial.strengthText);
    setScheduleTimesText(initial.scheduleTimesText);
    setNotes(initial.notes);
    setStatus(initial.status);
  }, [initial]);

  function close() {
    router.back();
  }

  function save() {
    setErrorText(null);
    const normalized = normalizeTimes(scheduleTimesText);
    if (!displayName.trim()) {
      setErrorText("Vui lòng nhập tên thuốc.");
      return;
    }
    if (normalized.error) {
      setErrorText(normalized.error);
      return;
    }
    const scheduleTimes = normalized.times;

    if (isEdit && id) {
      update.mutate(id, {
        displayName: displayName.trim(),
        strengthText: strengthText.trim() || null,
        scheduleTimes,
        notes: notes.trim() || null,
        status,
      });
      close();
      return;
    }

    create.mutate({
      displayName: displayName.trim(),
      strengthText: strengthText.trim() || null,
      scheduleTimes,
      notes: notes.trim() || null,
      status,
    });
    close();
  }

  return (
    <View className="flex-1 bg-surface">
      <ScrollView contentInsetAdjustmentBehavior="automatic" className="flex-1" contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="px-5 pt-4">
          <Text variant="h3" className="text-text">
            {isEdit ? "Sửa thuốc" : "Thêm thuốc"}
          </Text>
          <Text variant="bodySmall" className="mt-1 text-text-variant">
            MVP: lưu bằng mock data
          </Text>
        </View>

        <View className="mt-4 px-5 gap-3">
          {errorText ? (
            <View className="rounded-3xl border border-error/30 bg-error/5 px-4 py-3">
              <Text variant="bodySmall" className="text-error">
                {errorText}
              </Text>
            </View>
          ) : null}

          <View className="rounded-3xl border border-border bg-surface px-4 py-3">
            <Text variant="label" className="text-text-variant">
              Tên thuốc
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ví dụ: Paracetamol"
              className="mt-1 text-[16px] text-text"
              placeholderTextColor="#717786"
            />
          </View>

          <View className="rounded-3xl border border-border bg-surface px-4 py-3">
            <Text variant="label" className="text-text-variant">
              Hàm lượng
            </Text>
            <TextInput
              value={strengthText}
              onChangeText={setStrengthText}
              placeholder="Ví dụ: 500 mg"
              className="mt-1 text-[16px] text-text"
              placeholderTextColor="#717786"
            />
          </View>

          <View className="rounded-3xl border border-border bg-surface px-4 py-3">
            <Text variant="label" className="text-text-variant">
              Giờ uống (HH:mm)
            </Text>
            <TextInput
              value={scheduleTimesText}
              onChangeText={setScheduleTimesText}
              placeholder="07:00, 13:30"
              multiline
              className="mt-1 text-[16px] text-text"
              placeholderTextColor="#717786"
            />
          </View>

          <View className="rounded-3xl border border-border bg-surface px-4 py-3">
            <Text variant="label" className="text-text-variant">
              Ghi chú
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Tuỳ chọn"
              multiline
              className="mt-1 text-[16px] text-text"
              placeholderTextColor="#717786"
            />
          </View>

          <View className="rounded-3xl border border-border bg-surface px-4 py-3">
            <Text variant="label" className="text-text-variant">
              Trạng thái
            </Text>
            <View className="mt-2 flex-row gap-2">
              {statusOptions.map((o) => (
                <Pressable
                  key={o.id}
                  accessibilityRole="button"
                  onPress={() => setStatus(o.id)}
                  className={
                    o.id === status
                      ? "rounded-full bg-primary/10 px-3 py-2"
                      : "rounded-full bg-surface-low px-3 py-2"
                  }
                >
                  <Text variant="bodySmall" className={o.id === status ? "text-primary font-medium" : "text-text-variant"}>
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {isEdit && id ? (
            <View className="flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const next = status === "active" ? "paused" : "active";
                  setMedStatus.mutate(id, next);
                  setStatus(next);
                }}
                className="flex-1 rounded-2xl bg-surface-low px-4 py-3 active:opacity-90"
              >
                <Text variant="bodyMedium" className="text-center text-text">
                  {status === "active" ? "Tạm dừng" : "Kích hoạt"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setMedStatus.mutate(id, "stopped");
                  close();
                }}
                className="flex-1 rounded-2xl bg-error/10 px-4 py-3 active:opacity-90"
              >
                <Text variant="bodyMedium" className="text-center text-error">
                  Dừng thuốc
                </Text>
              </Pressable>
            </View>
          ) : null}

          {isEdit && id ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                del.mutate(id);
                close();
              }}
              className="rounded-2xl bg-error px-4 py-3 active:opacity-90"
            >
              <Text variant="bodyMedium" className="text-white text-center">
                Xoá thuốc
              </Text>
            </Pressable>
          ) : null}

          <View className="flex-row gap-3 pt-2">
            <Pressable
              accessibilityRole="button"
              onPress={close}
              className="flex-1 rounded-2xl bg-surface-low px-4 py-3 active:opacity-90"
            >
              <Text variant="bodyMedium" className="text-center text-text">
                Huỷ
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={save}
              className="flex-1 rounded-2xl bg-primary px-4 py-3 active:opacity-90"
            >
              <Text variant="bodyMedium" className="text-center text-white">
                Lưu
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

