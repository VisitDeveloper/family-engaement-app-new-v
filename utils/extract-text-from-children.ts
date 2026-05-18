import { Children, isValidElement, type ReactNode } from "react";

/** Flatten React children into speakable plain text (for voice narration). */
export function extractTextFromChildren(children: ReactNode): string {
  const parts: string[] = [];

  Children.forEach(children, (child) => {
    if (child == null || typeof child === "boolean") return;
    if (typeof child === "string" || typeof child === "number") {
      parts.push(String(child));
      return;
    }
    if (Array.isArray(child)) {
      parts.push(extractTextFromChildren(child));
      return;
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children != null) {
      parts.push(extractTextFromChildren(child.props.children));
    }
  });

  return parts.join(" ").replace(/\s+/g, " ").trim();
}
