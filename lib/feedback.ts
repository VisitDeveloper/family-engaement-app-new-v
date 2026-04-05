import i18n from "@/i18n";
import {
  useFeedbackUiStore,
  type FeedbackActionOption,
  type FeedbackAlertButton,
} from "@/store/feedback-ui";
import { toast } from "sonner-native";

export type { FeedbackActionOption, FeedbackAlertButton };

function showAlert(title: string, message?: string, buttons?: FeedbackAlertButton[]) {
  const normalized: FeedbackAlertButton[] =
    buttons && buttons.length > 0
      ? buttons
      : [{ text: i18n.t("common.ok"), style: "default" }];
  useFeedbackUiStore.getState().showAlert(title, message, normalized);
}

function desc(text2?: string) {
  const t = text2?.trim();
  return t ? { description: t } : undefined;
}

export const feedback = {
  alert: showAlert,

  toast: {
    success(text1: string, text2?: string) {
      toast.success(text1, { ...desc(text2), duration: 2600 });
    },
    error(text1: string, text2?: string) {
      toast.error(text1, { ...desc(text2), duration: 3800 });
    },
    info(text1: string, text2?: string) {
      toast.info(text1, { ...desc(text2), duration: 2800 });
    },
  },

  actionSheet(config: {
    title?: string;
    message?: string;
    options: FeedbackActionOption[];
  }) {
    return useFeedbackUiStore.getState().presentActionSheet(config);
  },
};
