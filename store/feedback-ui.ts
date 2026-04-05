import { create } from "zustand";

export type FeedbackAlertButtonStyle = "default" | "cancel" | "destructive";

export interface FeedbackAlertButton {
  text: string;
  style?: FeedbackAlertButtonStyle;
  onPress?: () => void;
}

export interface FeedbackActionOption {
  label: string;
  destructive?: boolean;
}

interface FeedbackUiState {
  alertVisible: boolean;
  alertTitle: string;
  alertMessage?: string;
  alertButtons: FeedbackAlertButton[];

  showAlert: (title: string, message?: string, buttons?: FeedbackAlertButton[]) => void;
  dismissAlert: () => void;

  actionVisible: boolean;
  actionTitle?: string;
  actionMessage?: string;
  actionOptions: FeedbackActionOption[];
  actionResolve: ((index: number | null) => void) | null;

  presentActionSheet: (config: {
    title?: string;
    message?: string;
    options: FeedbackActionOption[];
  }) => Promise<number | null>;
  finishActionSheet: (index: number | null) => void;
}

export const useFeedbackUiStore = create<FeedbackUiState>((set, get) => ({
  alertVisible: false,
  alertTitle: "",
  alertMessage: undefined,
  alertButtons: [],

  showAlert: (title, message, buttons) => {
    set({
      alertVisible: true,
      alertTitle: title,
      alertMessage: message,
      alertButtons: buttons ?? [],
    });
  },

  dismissAlert: () =>
    set({
      alertVisible: false,
      alertTitle: "",
      alertMessage: undefined,
      alertButtons: [],
    }),

  actionVisible: false,
  actionTitle: undefined,
  actionMessage: undefined,
  actionOptions: [],
  actionResolve: null,

  presentActionSheet: ({ title, message, options }) =>
    new Promise<number | null>((resolve) => {
      set({
        actionVisible: true,
        actionTitle: title,
        actionMessage: message,
        actionOptions: options,
        actionResolve: resolve,
      });
    }),

  finishActionSheet: (index) => {
    const resolve = get().actionResolve;
    if (!resolve) return;
    set({
      actionVisible: false,
      actionTitle: undefined,
      actionMessage: undefined,
      actionOptions: [],
      actionResolve: null,
    });
    resolve(index);
  },
}));
