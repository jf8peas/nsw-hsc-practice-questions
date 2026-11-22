// Client calls for the pick (spec 009 research R5): save it as soon as it is complete or changed, and again, by
// beacon, when the page is hidden, so leaving and returning (even on another device) restores it. Fire-and-forget:
// the quiz never waits on it (constitution Principle VI), and the route answers 409 once the first try is submitted.

export interface PickPayload {
  attemptId: string;
  attemptToken: string;
  questionId: string;
  pick: string[];
}

const URL = "/api/comparative/pick";

export function savePick(p: PickPayload): Promise<void> {
  try {
    return fetch(URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p), keepalive: true }).then(
      () => undefined,
      () => undefined,
    );
  } catch {
    return Promise.resolve();
  }
}

export function sendPickBeacon(p: PickPayload): void {
  try {
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
    navigator.sendBeacon(URL, new Blob([JSON.stringify(p)], { type: "application/json" }));
  } catch {
    // a beacon that cannot be sent is the same as a pick that was not saved: the student is asked to pick again
  }
}
