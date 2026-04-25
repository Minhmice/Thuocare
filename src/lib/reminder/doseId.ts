export type DoseId = `${string}T${string}`;

export function formatDoseId(params: {
  readonly scheduledDate: string;
  readonly scheduledAt: string;
}): DoseId {
  return `${params.scheduledDate}T${params.scheduledAt}`;
}

export function parseDoseId(doseId: string): {
  readonly scheduledDate: string;
  readonly scheduledAt: string;
} {
  const i = doseId.indexOf("T");
  if (i < 0) {
    return { scheduledDate: "", scheduledAt: "" };
  }
  return {
    scheduledDate: doseId.slice(0, i),
    scheduledAt: doseId.slice(i + 1)
  };
}
