export function requireElement<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: { className?: string; text?: string } = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (options.className) {
    element.className = options.className;
  }
  if (options.text !== undefined) {
    element.textContent = options.text;
  }
  return element;
}

export function statusText(status: string): string {
  if (status === "success") {
    return "正常";
  }
  if (status === "error") {
    return "失败";
  }
  return "检测中";
}
