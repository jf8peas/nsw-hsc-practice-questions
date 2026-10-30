"use client";

import { useState } from "react";

/**
 * Photo answer capture (specs/004-photo-answers).
 *
 * - Native file input: rear camera on phones (`capture="environment"`), file picker elsewhere.
 * - Each photo is drawn to a canvas (longest side 1,600 px, JPEG quality 0.8) which drops EXIF
 *   including GPS before anything is sent (FR-010).
 * - 1-3 photos as thumbnails with Retake and Remove; an optional note of at most 500 characters.
 * - "Check my answer" is disabled while a read is in flight (single-flight on the client).
 * - Photos live only in this tab: a reload before checking loses them (the panel says so).
 */

export interface PhotoFile {
  id: string;
  dataUrl: string;
  name: string;
}

const MAX_PHOTOS = 3;
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;
const MAX_NOTE = 500;

const TIP = "Write clearly in dark pen, one question per photo, fill the frame.";

let nextId = 0;

/** Shrink a photo on a canvas and return a JPEG data URL, or null when the browser cannot decode it. */
async function resizeImage(file: File): Promise<PhotoFile | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return { id: `photo-${++nextId}`, dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY), name: file.name };
  } catch (e) {
    void e;
    return null; // e.g. HEIC on a laptop browser: the caller tells the student to use JPEG/PNG
  }
}

export function PhotoAnswerPanel({
  onCheck,
  busy,
  disabled,
  inputRef,
}: {
  onCheck: (photos: PhotoFile[], note: string) => void;
  busy: boolean;
  disabled: boolean;
  /** Hidden file input owned by the quiz so the mode toggle can open it directly. */
  inputRef: { current: HTMLInputElement | null };
}) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [note, setNote] = useState("");
  const [decodeError, setDecodeError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || busy || disabled) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const toAdd = Array.from(files).slice(0, remaining);
    const resized = await Promise.all(toAdd.map(resizeImage));
    const ok = resized.filter((p): p is PhotoFile => p !== null);
    if (ok.length < toAdd.length) {
      setDecodeError("One of those photos couldn't be opened. Please use a JPEG or PNG photo.");
    } else {
      setDecodeError(null);
    }
    if (ok.length > 0) setPhotos((prev) => [...prev, ...ok].slice(0, MAX_PHOTOS));
    if (inputRef.current) inputRef.current.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function retakePhoto(id: string) {
    // Retake = remove this photo and open the camera/file picker again.
    removePhoto(id);
    inputRef.current?.click();
  }

  const canAdd = photos.length < MAX_PHOTOS && !busy && !disabled;
  const canCheck = photos.length > 0 && !busy && !disabled;

  return (
    <div className="photo-panel">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        style={{ display: "none" }}
        onChange={(e) => void handleFiles(e.target.files)}
        data-testid="photo-input"
      />

      {photos.length > 0 && (
        <div className="photo-thumbs" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {photos.map((p) => (
            <div key={p.id} className="photo-thumb" style={{ position: "relative", width: 96 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.dataUrl}
                alt="Your answer photo"
                style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, display: "block" }}
              />
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => retakePhoto(p.id)}
                  disabled={busy || disabled}
                >
                  Retake
                </button>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => removePhoto(p.id)}
                  disabled={busy || disabled}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {canAdd && photos.length > 0 && (
        <button
          type="button"
          className="link-btn"
          style={{ marginTop: 8 }}
          onClick={() => inputRef.current?.click()}
        >
          Add another photo ({photos.length}/{MAX_PHOTOS})
        </button>
      )}

      {decodeError && (
        <div className="notice warn" role="alert" style={{ marginTop: 8 }}>
          {decodeError}
        </div>
      )}

      <div className="photo-note" style={{ marginTop: 12 }}>
        <textarea
          className="q-textarea"
          value={note}
          maxLength={MAX_NOTE}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional) — e.g. see the diagram on photo 2"
          disabled={busy || disabled}
          rows={2}
          data-testid="photo-note"
        />
        <div style={{ fontSize: 12, color: "var(--rd-muted, #666)", textAlign: "right" }}>
          {note.length}/{MAX_NOTE}
        </div>
      </div>

      <p className="photo-tip" style={{ fontSize: 13, color: "var(--rd-muted, #666)", margin: "8px 0" }}>
        {TIP}
      </p>

      <button
        type="button"
        className="rd-btn"
        style={{ width: "100%", justifyContent: "center" }}
        onClick={() => onCheck(photos, note.trim())}
        disabled={!canCheck}
        data-testid="check-answer"
      >
        {busy ? "Reading your answer…" : "Check my answer"}
      </button>

      <p style={{ fontSize: 12, color: "var(--rd-muted, #666)", margin: "8px 0 0" }}>
        Photos are kept only until the page is reloaded.
      </p>
    </div>
  );
}