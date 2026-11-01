"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import type { GalleryTemplate } from "@/components/gallery";

type EventDraft = {
  key: string;
  name: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  dressCode: string;
  muhurat: string;
  tithi: string;
  nakshatra: string;
  description: string;
  venueName: string;
  address: string;
  city: string;
  state: string;
  mapUrl: string;
};

const TYPES = ["Engagement", "Haldi", "Mehendi", "Sangeet", "Muhurtham", "Reception", "Custom"];
const emptyEvent = (partial: Partial<EventDraft> = {}): EventDraft => ({
  key: Math.random().toString(36).slice(2, 8),
  name: "Muhurtham",
  type: "Wedding",
  date: "2026-12-20",
  startTime: "09:30",
  endTime: "11:30",
  dressCode: "",
  muhurat: "",
  tithi: "",
  nakshatra: "",
  description: "",
  venueName: "",
  address: "",
  city: "",
  state: "",
  mapUrl: "",
  ...partial,
});

export function Wizard({ templates, initialTemplate }: { templates: GalleryTemplate[]; initialTemplate?: string }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [groomName, setGroom] = useState("");
  const [brideName, setBride] = useState("");
  const [groomNameTa, setGroomTa] = useState("");
  const [brideNameTa, setBrideTa] = useState("");
  const [groomNameHi, setGroomHi] = useState("");
  const [brideNameHi, setBrideHi] = useState("");
  const [weddingDate, setDate] = useState("2026-12-20");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [tagline, setTagline] = useState("");
  const [story, setStory] = useState("");
  const [events, setEvents] = useState<EventDraft[]>([emptyEvent()]);
  const [templateId, setTemplate] = useState(initialTemplate || templates.find((item) => item.tier === "free")?.id || templates[0]?.id || "");
  const [paletteId, setPalette] = useState("classic");
  const [motifPack, setMotif] = useState("");
  const [showScripts, setShowScripts] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("shubh-wizard");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (data.groomName) setGroom(data.groomName);
      if (data.brideName) setBride(data.brideName);
      if (data.events) setEvents(data.events);
      if (data.city) setCity(data.city);
      if (data.state) setState(data.state);
      if (data.templateId && !initialTemplate) setTemplate(data.templateId);
      if (data.motifPack) setMotif(data.motifPack);
      if (typeof data.step === "number") setStep(data.step);
    } catch {
      sessionStorage.removeItem("shubh-wizard");
    }
  }, [initialTemplate]);

  useEffect(() => {
    sessionStorage.setItem("shubh-wizard", JSON.stringify({ groomName, brideName, events, city, state, templateId, motifPack, step }));
  }, [groomName, brideName, events, city, state, templateId, motifPack, step]);

  const template = templates.find((item) => item.id === templateId);
  const steps = ["Couple", "Events", "Venues", "Photos", "Template", "Review"];

  function next() {
    setError("");
    if (step === 0 && (!groomName || !brideName || !city || !state || !weddingDate)) {
      setError("Add both names, the date, the city and the state.");
      return;
    }
    if (step === 1 && events.some((event) => !event.name || !event.date)) {
      setError("Each ceremony needs a name and a date.");
      return;
    }
    if (step === 2 && events.some((event) => !event.venueName || !event.address)) {
      setError("Each ceremony needs a venue name and address.");
      return;
    }
    if (step === 4 && !motifPack) {
      setError("Choose a motif pack. Neutral is there if you prefer no religious symbol.");
      return;
    }
    setStep((value) => Math.min(5, value + 1));
  }

  async function create() {
    setPending(true);
    setError("");
    const res = await fetch("/api/weddings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        groomName, brideName, groomNameTa, brideNameTa, groomNameHi, brideNameHi, tagline, story, weddingDate, city, state, templateId, paletteId, motifPack,
        language: "en",
        events: events.map(({ key, ...event }) => {
          void key;
          return { ...event, city: event.city || city, state: event.state || state };
        }),
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not create the wedding");
      return;
    }
    sessionStorage.removeItem("shubh-wizard");
    window.location.href = `/dashboard/weddings/${data.id}/editor`;
  }

  const set = (key: string, patch: Partial<EventDraft>) => setEvents(events.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  const swap = (index: number, other: number) => setEvents(events.map((item, i) => (i === index ? events[other] : i === other ? events[index] : item)));

  return (
    <div data-testid="wizard">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Create a wedding</p>
      <h1 className="font-serif text-4xl text-maroon">{steps[step]}</h1>
      <ol className="mt-5 grid grid-cols-6 gap-1 sm:gap-2" aria-label="Progress">
        {steps.map((label, index) => (
          <li key={label}>
            <button type="button" aria-current={index === step ? "step" : undefined} className="group w-full text-left" onClick={() => index < step && setStep(index)} disabled={index > step}>
              <span className={`block h-1.5 rounded-full ${index <= step ? "bg-maroon" : "bg-ink/10"}`} />
              <span className={`mt-1.5 hidden text-xs sm:block ${index === step ? "font-semibold text-maroon" : index < step ? "text-ink group-hover:underline" : "text-muted"}`}>
                {index < step ? "✓ " : `${index + 1}. `}{label}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-muted sm:hidden">Step {step + 1} of {steps.length}</p>
      <div className="mt-6 grid gap-3">
        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Groom's name"><Input data-testid="wizard-groom" placeholder="e.g. Raja Iyer" value={groomName} onChange={(event) => setGroom(event.target.value)} /></Field>
            <Field label="Bride's name"><Input data-testid="wizard-bride" placeholder="e.g. Rani Raman" value={brideName} onChange={(event) => setBride(event.target.value)} /></Field>
            {showScripts ? (
              <>
                <Field label="Groom's name in Tamil" optional><Input value={groomNameTa} onChange={(event) => setGroomTa(event.target.value)} /></Field>
                <Field label="Bride's name in Tamil" optional><Input value={brideNameTa} onChange={(event) => setBrideTa(event.target.value)} /></Field>
                <Field label="Groom's name in Hindi" optional><Input value={groomNameHi} onChange={(event) => setGroomHi(event.target.value)} /></Field>
                <Field label="Bride's name in Hindi" optional><Input value={brideNameHi} onChange={(event) => setBrideHi(event.target.value)} /></Field>
              </>
            ) : (
              <button type="button" className="justify-self-start text-sm text-link underline-offset-2 hover:underline md:col-span-2" onClick={() => setShowScripts(true)}>+ Add names in Tamil / Hindi</button>
            )}
            <Field label="Wedding date"><Input data-testid="wizard-date" type="date" value={weddingDate} onChange={(event) => setDate(event.target.value)} /></Field>
            <Field label="City"><Input data-testid="wizard-city" placeholder="e.g. Chennai" value={city} onChange={(event) => setCity(event.target.value)} /></Field>
            <Field label="State"><Input data-testid="wizard-state" placeholder="e.g. Tamil Nadu" value={state} onChange={(event) => setState(event.target.value)} /></Field>
            <Field label="Short tagline" optional><Input placeholder="e.g. Two families, one celebration" value={tagline} onChange={(event) => setTagline(event.target.value)} /></Field>
            <Field label="Welcome note" optional className="md:col-span-2"><Textarea placeholder="A few lines for your guests" value={story} onChange={(event) => setStory(event.target.value)} /></Field>
          </div>
        ) : null}
        {step === 1 || step === 2 ? (
          <div className="grid gap-4">
            {events.map((event, index) => (
              <div key={event.key} className="rounded-2xl border border-ink/10 bg-surface p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="font-serif text-xl text-heading">{index + 1}. {event.name || "Ceremony"}</p>
                  <div className="flex gap-1">
                    <Button type="button" size="sm" variant="ghost" aria-label={`Move ${event.name} up`} disabled={index === 0} onClick={() => swap(index, index - 1)}><ArrowUp className="size-4" aria-hidden /></Button>
                    <Button type="button" size="sm" variant="ghost" aria-label={`Move ${event.name} down`} disabled={index === events.length - 1} onClick={() => swap(index, index + 1)}><ArrowDown className="size-4" aria-hidden /></Button>
                    <Button type="button" size="sm" variant="danger" aria-label={`Remove ${event.name}`} disabled={events.length === 1} onClick={() => setEvents(events.filter((item) => item.key !== event.key))}><Trash2 className="size-4" aria-hidden /></Button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Ceremony type">
                    <select className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink" value={event.type} onChange={(e) => set(event.key, { type: e.target.value, name: e.target.value === "Custom" ? event.name : e.target.value })}>
                      {TYPES.map((type) => <option key={type}>{type}</option>)}
                    </select>
                  </Field>
                  <Field label="Name shown to guests"><Input data-testid="event-name" value={event.name} onChange={(e) => set(event.key, { name: e.target.value })} /></Field>
                  <Field label="Date"><Input type="date" value={event.date} onChange={(e) => set(event.key, { date: e.target.value })} /></Field>
                  <Field label="Start time"><Input type="time" value={event.startTime} onChange={(e) => set(event.key, { startTime: e.target.value })} /></Field>
                  {step === 2 ? (
                    <>
                      <Field label="Venue name"><Input placeholder="Venue" value={event.venueName} onChange={(e) => set(event.key, { venueName: e.target.value })} /></Field>
                      <Field label="Address"><Input placeholder="Address" value={event.address} onChange={(e) => set(event.key, { address: e.target.value })} /></Field>
                      <Field label="Muhurat" optional><Input placeholder="e.g. 9:30 – 10:30 AM" value={event.muhurat} onChange={(e) => set(event.key, { muhurat: e.target.value })} /></Field>
                      <Field label="Tithi / nakshatra" optional><Input value={event.tithi} onChange={(e) => set(event.key, { tithi: e.target.value })} /></Field>
                      <Field label="Dress code" optional><Input placeholder="e.g. Traditional silk" value={event.dressCode} onChange={(e) => set(event.key, { dressCode: e.target.value })} /></Field>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
            <Button type="button" data-testid="event-add" variant="secondary" className="justify-self-start" onClick={() => setEvents([...events, emptyEvent({ name: "Mehendi", type: "Mehendi", date: weddingDate, startTime: "16:00" })])}><Plus className="size-4" aria-hidden />Add ceremony</Button>
          </div>
        ) : null}
        {step === 3 ? <p className="rounded-2xl border border-dashed border-ink/20 p-6 text-sm">You can add photographs in the editor after the wedding is created. This step keeps the wizard moving without a required upload.</p> : null}
        {step === 4 ? (
          <div>
            <p className="mb-3 text-sm">Choose a motif pack. Nothing religious is selected for you.</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {["neutral", "hindu", "muslim", "christian", "sikh"].map((pack) => (
                <button key={pack} type="button" data-testid={`motif-${pack}`} className={`rounded-full border px-3 py-2 text-sm capitalize ${motifPack === pack ? "bg-maroon text-ivory" : "border-line"}`} onClick={() => setMotif(pack)}>{pack}</button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {templates.map((item) => (
                <button key={item.id} type="button" data-testid={`template-card-${item.id}`} className={`overflow-hidden rounded-2xl border text-left ${templateId === item.id ? "border-maroon" : "border-ink/10"}`} onClick={() => setTemplate(item.id)}>
                  <img src={item.thumb} alt="" className="h-40 w-full object-cover" />
                  <span className="block p-3 font-serif">{item.name}</span>
                  <span className="block px-3 pb-3 text-xs text-muted">{item.tier === "premium" ? "Premium" : "Free"}</span>
                </button>
              ))}
            </div>
            {template?.tier === "premium" ? <p data-testid="premium-gate" className="mt-3 text-sm text-maroon">This is a premium template. You can design with it now. Publishing stays locked until a successful simulated payment.</p> : null}
            <label className="mt-3 block text-sm">Palette
              <select className="mt-1 h-11 w-full rounded-xl border px-3" value={paletteId} onChange={(event) => setPalette(event.target.value)}>
                <option value="classic">Classic</option>
                <option value="midnight">Second palette</option>
                <option value="ivory">Third palette</option>
              </select>
            </label>
          </div>
        ) : null}
        {step === 5 ? (
          <div className="rounded-2xl border border-ink/10 bg-surface p-5">
            <h2 className="font-serif text-3xl">{groomName} & {brideName}</h2>
            <p className="mt-2 text-sm">{weddingDate} · {city}, {state}</p>
            <p className="mt-2 text-sm">{events.length} {events.length === 1 ? "ceremony" : "ceremonies"} · {template?.name} · <span className="capitalize">{motifPack}</span> motif</p>
            {template?.tier === "premium" ? <p data-testid="premium-gate" className="mt-2 text-sm text-maroon">Premium template selected on the free plan.</p> : null}
          </div>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-3 rounded-xl bg-blush/50 px-3 py-2 text-sm text-maroon">{error}</p> : null}
      <div className="mt-6 flex gap-2">
        {step > 0 ? <Button type="button" variant="ghost" data-testid="wizard-back" onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button> : null}
        {step < 5 ? <Button type="button" data-testid="wizard-next" onClick={next}>Continue</Button> : <Button type="button" data-testid="wizard-create" disabled={pending} onClick={() => void create()}>{pending ? "Creating…" : "Create wedding"}</Button>}
      </div>
    </div>
  );
}
