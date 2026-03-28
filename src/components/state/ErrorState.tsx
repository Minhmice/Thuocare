import { AppButton } from "../ui/AppButton";
import { AppCard } from "../ui/AppCard";
import { AppText } from "../ui/AppText";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <AppCard title="Something went wrong">
      <AppText>{message}</AppText>
      {onRetry ? <AppButton onPress={onRetry}>Try again</AppButton> : null}
    </AppCard>
  );
}
