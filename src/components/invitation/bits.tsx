"use client";

import { useEffect, useState } from "react";

export function FallbackImage(props: React.ImgHTMLAttributes<HTMLImageElement> & { fallbackClassName?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={props.fallbackClassName} aria-hidden />;
  const { fallbackClassName, alt, ...rest } = props;
  return <img {...rest} alt={alt ?? ""} onError={() => setFailed(true)} />;
}

export function Countdown({ date, labels }: { date: string; labels: { days: string; hours: string; minutes: string; seconds: string } }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const target = new Date(`${date}T09:00:00+05:30`).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [date]);
  const cells = [
    [labels.days, parts.d],
    [labels.hours, parts.h],
    [labels.minutes, parts.m],
    [labels.seconds, parts.s],
  ] as const;
  return (
    <div data-testid="countdown" className="grid grid-cols-4 gap-3 text-center">
      {cells.map(([label, value]) => (
        <div key={label} className="inv-card px-2 py-4">
          <div className="font-serif text-3xl">{value}</div>
          <div className="text-xs uppercase tracking-widest opacity-70">{label}</div>
        </div>
      ))}
    </div>
  );
}

export function GalleryLightbox({
  images,
}: {
  images: { url: string; alt: string; focalX: number; focalY: number; mask: string }[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <button key={image.url + index} type="button" onClick={() => setOpen(index)} className="overflow-hidden">
            <FallbackImage
              src={image.url}
              alt={image.alt}
              width={640}
              height={800}
              loading="lazy"
              className={`h-48 w-full ${image.mask === "circle" ? "mask-circle" : image.mask === "arch" ? "mask-arch" : "mask-rounded"}`}
              style={{ objectPosition: `${image.focalX * 100}% ${image.focalY * 100}%` }}
            />
          </button>
        ))}
      </div>
      {open !== null && images[open] ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" role="dialog" aria-modal>
          <button type="button" className="absolute right-4 top-4 text-white" onClick={() => setOpen(null)}>
            Close
          </button>
          <img src={images[open].url} alt={images[open].alt} className="max-h-[85vh] max-w-full rounded-xl" />
        </div>
      ) : null}
    </>
  );
}

export function MusicControl({ src, play, pause }: { src: string; play: string; pause: string }) {
  const [on, setOn] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="rounded-full border border-current px-4 py-2 text-sm"
        onClick={(event) => {
          const audio = event.currentTarget.nextElementSibling as HTMLAudioElement | null;
          if (!audio) return;
          if (on) {
            audio.pause();
            setOn(false);
          } else {
            void audio.play();
            setOn(true);
          }
        }}
      >
        {on ? pause : play}
      </button>
      <audio src={src} preload="none" />
    </div>
  );
}

export function VideoBlock({ url, title }: { url: string; title: string }) {
  const [show, setShow] = useState(false);
  if (!url) return <p className="opacity-70">Add a YouTube link in the editor.</p>;
  if (!show) {
    return (
      <button type="button" className="rounded-full border border-current px-4 py-2" onClick={() => setShow(true)}>
        Play video
      </button>
    );
  }
  return <iframe title={title} src={url} className="aspect-video w-full rounded-xl" allow="encrypted-media" />;
}

export function RsvpForm({
  slug,
  token,
  guestName,
  locale,
  labels,
}: {
  slug: string;
  token?: string;
  guestName?: string;
  locale: string;
  labels: Record<string, string>;
}) {
  const [status, setStatus] = useState<"attending" | "not_attending" | "maybe">("attending");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      data-testid="public-rsvp"
      className="grid gap-3 text-left"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        const form = new FormData(event.currentTarget);
        const res = await fetch(`/api/public/${slug}/rsvp`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: String(form.get("name") || ""),
            status,
            headcount: Number(form.get("headcount") || 1),
            dietary: String(form.get("dietary") || "veg"),
            message,
            website: String(form.get("website") || ""),
            token: token || "",
          }),
        });
        const data = await res.json();
        if (!res.ok) setError(data.error || "Could not save");
        else setDone(locale === "ta" ? "நன்றி, பதில் சேமிக்கப்பட்டது." : locale === "hi" ? "धन्यवाद, उत्तर सहेजा गया।" : "Thank you, your reply is saved.");
      }}
    >
      <label className="grid gap-1 text-sm">
        {labels.name}
        <input data-testid="rsvp-name" name="name" required defaultValue={guestName || ""} className="h-11 rounded-xl border border-current/20 bg-white/80 px-3 text-ink" />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="flex flex-wrap gap-2">
        {(["attending", "not_attending", "maybe"] as const).map((key) => (
          <button
            key={key}
            type="button"
            data-testid={`rsvp-${key}`}
            onClick={() => setStatus(key)}
            className={`rounded-full border px-3 py-2 text-sm ${status === key ? "bg-[var(--inv-accent)] text-[var(--inv-bg)]" : ""}`}
          >
            {labels[key]}
          </button>
        ))}
      </div>
      <label className="grid gap-1 text-sm">
        {labels.headcount}
        <input name="headcount" type="number" min={0} max={12} defaultValue={1} className="h-11 rounded-xl border border-current/20 bg-white/80 px-3 text-ink" />
      </label>
      <label className="grid gap-1 text-sm">
        {labels.dietary}
        <select name="dietary" className="h-11 rounded-xl border border-current/20 bg-white/80 px-3 text-ink">
          <option value="veg">{labels.veg}</option>
          <option value="non-veg">{labels.nonveg}</option>
          <option value="jain">{labels.jain}</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        {labels.message}
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-20 rounded-xl border border-current/20 bg-white/80 px-3 py-2 text-ink" />
      </label>
      <p className="text-xs opacity-70">{labels.consent}</p>
      {error ? <p className="text-sm">{error}</p> : null}
      {done ? <p data-testid="rsvp-thanks">{done}</p> : <button className="h-11 rounded-full bg-[var(--inv-accent)] px-4 text-[var(--inv-bg)]">{labels.submit}</button>}
    </form>
  );
}
