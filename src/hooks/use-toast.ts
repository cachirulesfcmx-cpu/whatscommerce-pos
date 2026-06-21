"use client";
// Adapted from shadcn/ui toast hook.
import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 4;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type State = { toasts: ToasterToast[] };
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Partial<State> & { type: string; toast?: ToasterToast; id?: string }) {
  switch (action.type) {
    case "ADD":
      memoryState = {
        toasts: [action.toast!, ...memoryState.toasts].slice(0, TOAST_LIMIT),
      };
      break;
    case "DISMISS":
      memoryState = {
        toasts: memoryState.toasts.filter((t) => t.id !== action.id),
      };
      break;
  }
  listeners.forEach((l) => l(memoryState));
}

export function toast(props: Omit<ToasterToast, "id">) {
  const id = genId();
  dispatch({ type: "ADD", toast: { ...props, id, open: true } });
  setTimeout(() => dispatch({ type: "DISMISS", id }), TOAST_REMOVE_DELAY);
  return { id, dismiss: () => dispatch({ type: "DISMISS", id }) };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);
  return {
    ...state,
    toast,
    dismiss: (id: string) => dispatch({ type: "DISMISS", id }),
  };
}
