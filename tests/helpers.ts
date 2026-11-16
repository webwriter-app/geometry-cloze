import snippet from "../snippets/polygon.html";
import "../src/widgets/ww-geometry-cloze";

export { snippet };

export async function until<T>(fn: () => T | Promise<T>, what: string, ms = 20000): Promise<T> {
  const end = performance.now() + ms;
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (performance.now() > end) throw new Error("timed out waiting for " + what);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

/** Mounts the polygon snippet in read or edit mode; the widget's private canvas manager is read through `any`. */
export async function mount(editing: boolean, lang?: string): Promise<any> {
  const host = document.createElement("div");
  host.className = "test-mount";
  host.innerHTML = snippet;
  document.body.append(host);
  const el = host.firstElementChild as any;
  if (lang) el.setAttribute("lang", lang);
  if (editing) {
    el.setAttribute("contenteditable", "");
    document.designMode = "on";
  } else document.designMode = "off";
  await until(() => el.manager && el.updateComplete, "the canvas manager");
  await el.updateComplete;
  return el;
}

export function cleanup() {
  document.designMode = "off";
  document.querySelectorAll(".test-mount").forEach((node) => node.remove());
}

export function key(el: any, init: KeyboardEventInit): KeyboardEvent {
  const canvas = el.shadowRoot.querySelector("canvas");
  const event = new KeyboardEvent("keydown", { bubbles: true, composed: true, cancelable: true, ...init });
  canvas.dispatchEvent(event);
  return event;
}

export const block = (el: Element) =>
  el.querySelector(':scope > script[type="application/json"][slot="data"]') as HTMLScriptElement | null;
export const children = (el: Element) => JSON.parse(block(el)!.textContent!).elements ?? [];
export const shown = (el: any) => el.manager.export().children ?? [];
