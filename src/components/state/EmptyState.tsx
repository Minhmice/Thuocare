import { AppCard } from "../ui/AppCard";
import { AppText } from "../ui/AppText";

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <AppCard title={title}>
      <AppText>{message}</AppText>
    </AppCard>
  );
}
