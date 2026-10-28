// The only whole-page navigation the app does, in one place so the quiz's "reload for a
// fresh token" branch can be stubbed in tests (jsdom 29 freezes `window.location`, so the
// global itself cannot be replaced). Calling this at runtime behaves exactly like calling
// `window.location.reload()` directly; it is client-side only.
export function reloadPage(): void {
  window.location.reload();
}
