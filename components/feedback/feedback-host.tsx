import { ActionSheetHost } from "@/components/feedback/action-sheet-host";
import { FeedbackToaster } from "@/components/feedback/feedback-toaster";
import { ThemedAlertModal } from "@/components/feedback/themed-alert-modal";

export function FeedbackHost() {
  return (
    <>
      <ThemedAlertModal />
      <ActionSheetHost />
      <FeedbackToaster />
    </>
  );
}
