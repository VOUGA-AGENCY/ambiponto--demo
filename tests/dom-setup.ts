import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000",
});
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLTextAreaElement",
  "HTMLSelectElement",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "localStorage",
  "location",
  "FormData",
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value: (dom.window as unknown as Record<string, unknown>)[key],
  });
}
dom.window.scrollTo = () => {};
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  value: true,
  writable: true,
});
