"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DndContext, PointerSensor, closestCenter, useDraggable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Copy, Eye, EyeOff, LayoutList, Lock, Monitor, Palette, Redo2, Smartphone, Tablet, Trash2, Undo2 } from "lucide-react";
import { InvitationView, type InvitationModel, type InviteEvent, type InviteMedia } from "@/components/invitation/view";
import { Badge, Button, Input } from "@/components/ui";
import { section, type Design, type Section, type SectionType, diffDesign } from "@/lib/design";
import { canUseTemplate } from "@/lib/domain";
import { humanize } from "@/lib/labels";
import type { ThemeBundle } from "@/lib/templates";

const PALETTE: { type: SectionType; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "welcome", label: "Welcome" },
  { type: "countdown", label: "Countdown" },
  { type: "schedule", label: "Schedule" },
  { type: "venue", label: "Venue" },
  { type: "gallery", label: "Gallery" },
  { type: "video", label: "Video" },
  { type: "family", label: "Family" },
  { type: "rsvp", label: "RSVP" },
  { type: "music", label: "Music" },
  { type: "quote", label: "Blessing" },
  { type: "travel", label: "Travel" },
  { type: "gifts", label: "Gifts" },
  { type: "faq", label: "FAQ" },
  { type: "footer", label: "Footer" },
  { type: "freeform", label: "Freeform" },
];

function blank(type: SectionType): Section {
  const text = { en: "", ta: "", hi: "" };
  const titled = { title: { en: type[0].toUpperCase() + type.slice(1), ta: "", hi: "" }, body: text, text };
  if (type === "video") return section(type, { ...titled, url: "" });
  if (type === "music") return section(type, { ...titled, src: "" });
  if (type === "family") return section(type, { ...titled, members: [] });
  if (type === "freeform") return section(type, titled);
  return section(type, titled);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function paletteOf(theme: ThemeBundle, paletteId: string) {
  return theme.palettes.find((item) => item.id === paletteId) ?? theme.palettes[0];
}

export function Editor({
  weddingId,
  initialDesign,
  revision: initialRevision,
  plan,
  level,
  wedding,
  events,
  initialMedia,
  themes,
  userName,
}: {
  weddingId: string;
  initialDesign: Design;
  revision: number;
  plan: string;
  level: string;
  wedding: InvitationModel;
  events: InviteEvent[];
  initialMedia: InviteMedia[];
  themes: ThemeBundle[];
  userName: string;
}) {
  const canEdit = level === "editor" || level === "owner";
  const [design, setDesign] = useState(initialDesign);
  const [past, setPast] = useState<Design[]>([]);
  const [future, setFuture] = useState<Design[]>([]);
  const [selected, setSelected] = useState<string[]>(initialDesign.sections[0] ? [initialDesign.sections[0].id] : []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revision, setRevision] = useState(initialRevision);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "failed" | "offline" | "conflict">("saved");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [zoom, setZoom] = useState(1);
  const [media, setMedia] = useState(initialMedia);
  const [others, setOthers] = useState<string[]>([]);
  const [versions, setVersions] = useState<{ id: string; label: string; createdAt: string }[]>([]);
  const [compare, setCompare] = useState("");
  const [locale, setLocale] = useState<"en" | "ta" | "hi">(initialDesign.language);
  const [panel, setPanel] = useState<"preview" | "sections" | "style">("preview");
  const [toast, setToast] = useState<string | null>(null);
  const skip = useRef(true);
  const designRef = useRef(design);
  const revisionRef = useRef(revision);
  const pastRef = useRef(past);
  const futureRef = useRef(future);
  designRef.current = design;
  revisionRef.current = revision;
  pastRef.current = past;
  futureRef.current = future;
  const premium = canUseTemplate(plan, "premium");
  const theme = themes.find((item) => item.id === design.templateId) ?? themes[0];
  const palette = theme ? (paletteOf(theme, design.paletteId)?.colors ?? theme.colors) : undefined;
  const current = design.sections.find((item) => item.id === selected[0]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // History is kept in refs as well as state so several edits in one tick, and the
  // keyboard handler's older closure, always build on the latest design.
  function apply(design: Design, past: Design[], future: Design[]) {
    designRef.current = design;
    pastRef.current = past;
    futureRef.current = future;
    setDesign(design);
    setPast(past);
    setFuture(future);
  }

  function commit(recipe: (draft: Design) => Design) {
    if (!canEdit) return;
    const currentDesign = designRef.current;
    apply(recipe(clone(currentDesign)), [...pastRef.current, currentDesign].slice(-50), []);
  }

  function undo() {
    const previous = pastRef.current[pastRef.current.length - 1];
    if (!previous) return;
    apply(previous, pastRef.current.slice(0, -1), [designRef.current, ...futureRef.current]);
  }
  function redo() {
    const next = futureRef.current[0];
    if (!next) return;
    apply(next, [...pastRef.current, designRef.current], futureRef.current.slice(1));
  }

  async function save() {
    if (!canEdit) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSaveState("offline");
      return;
    }
    setSaveState("saving");
    try {
      const res = await fetch(`/api/weddings/${weddingId}/design`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ design: designRef.current, revision: revisionRef.current }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setSaveState("conflict");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Save failed");
      revisionRef.current = data.revision;
      setRevision(data.revision);
      setSaveState("saved");
      localStorage.setItem(`shubh-draft-${weddingId}`, JSON.stringify(designRef.current));
    } catch {
      setSaveState("failed");
    }
  }

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const handle = window.setTimeout(() => void save(), 700);
    return () => window.clearTimeout(handle);
  }, [design]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicate();
      } else if (event.key === "Escape") setEditingId(null);
      else if (!typing && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        removeSelected();
      } else if (!typing && event.key.startsWith("Arrow")) {
        event.preventDefault();
        nudge(event.key);
      }
    };
    window.addEventListener("keydown", onKey);
    const beat = window.setInterval(() => {
      void fetch(`/api/weddings/${weddingId}/presence`, { method: "POST" }).then(async (res) => {
        const data = await res.json();
        setOthers((data.others || []).map((person: { name: string }) => person.name));
      });
    }, 8000);
    void refreshVersions();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearInterval(beat);
    };
  }, [weddingId, selected.join("|")]);

  function patchSection(id: string, recipe: (section: Section) => Section) {
    commit((draft) => ({ ...draft, sections: draft.sections.map((item) => (item.id === id && !item.locked ? recipe(item) : item)) }));
  }

  function duplicate() {
    if (!current || current.locked) return;
    const copy = clone(current);
    copy.id = `${current.type}-${Math.random().toString(36).slice(2, 7)}`;
    commit((draft) => {
      const index = draft.sections.findIndex((item) => item.id === current.id);
      const sections = [...draft.sections];
      sections.splice(index + 1, 0, copy);
      return { ...draft, sections };
    });
  }

  function removeSelected() {
    const doomed = new Set(design.sections.filter((item) => selected.includes(item.id) && !item.locked).map((item) => item.id));
    if (!doomed.size || design.sections.length - doomed.size < 1) return;
    commit((draft) => ({ ...draft, sections: draft.sections.filter((item) => !doomed.has(item.id)) }));
    setSelected([]);
    setToast(doomed.size > 1 ? `${doomed.size} sections deleted` : "Section deleted");
  }

  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(handle);
  }, [toast]);

  function move(id: string, direction: -1 | 1) {
    commit((draft) => {
      const index = draft.sections.findIndex((item) => item.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= draft.sections.length) return draft;
      return { ...draft, sections: arrayMove(draft.sections, index, next) };
    });
  }

  function nudge(key: string) {
    if (!current) return;
    if (current.type === "freeform" && current.elements?.length) {
      const delta = key === "ArrowUp" ? [0, -1] : key === "ArrowDown" ? [0, 1] : key === "ArrowLeft" ? [-1, 0] : [1, 0];
      patchSection(current.id, (item) => ({
        ...item,
        elements: (item.elements ?? []).map((el, index) => (index === 0 ? { ...el, x: el.x + delta[0], y: el.y + delta[1] } : el)),
      }));
      return;
    }
    if (key === "ArrowUp") move(current.id, -1);
    if (key === "ArrowDown") move(current.id, 1);
  }

  function onDragEnd(event: DragEndEvent) {
    const from = event.active.data.current?.from;
    if (from === "palette") {
      const type = event.active.data.current?.type as SectionType;
      add(type);
      return;
    }
    if (!event.over || event.active.id === event.over.id) return;
    commit((draft) => {
      const oldIndex = draft.sections.findIndex((item) => item.id === event.active.id);
      const newIndex = draft.sections.findIndex((item) => item.id === event.over?.id);
      if (oldIndex < 0 || newIndex < 0) return draft;
      return { ...draft, sections: arrayMove(draft.sections, oldIndex, newIndex) };
    });
  }

  function add(type: SectionType) {
    if (type === "freeform" && !premium) return;
    const created = blank(type);
    commit((draft) => ({ ...draft, sections: [...draft.sections, created] }));
    setSelected([created.id]);
    setPanel("preview");
  }

  async function refreshVersions() {
    const res = await fetch(`/api/weddings/${weddingId}/versions`);
    if (res.ok) {
      const data = await res.json();
      setVersions(data.versions || []);
    }
  }

  const width = device === "mobile" ? 390 : device === "tablet" ? 820 : 1100;
  const gate = theme && theme.tier === "premium" && !canUseTemplate(plan, theme.tier);
  const comparison = useMemo(() => {
    const version = versions.find((item) => item.id === compare) as { id: string; json?: string } | undefined;
    if (!version?.json) return null;
    try {
      return diffDesign(JSON.parse(version.json) as Design, design);
    } catch {
      return null;
    }
  }, [compare, versions, design]);

  if (!theme || !palette) return <p>Templates are still loading.</p>;

  const textDefault = current?.style.color || palette.text;
  const backgroundDefault = current?.style.background || design.pageBackground || palette.background;
  const setStyle = (patch: Partial<Section["style"]>) => current && patchSection(current.id, (item) => ({ ...item, style: { ...item.style, ...patch } }));

  return (
    <div className="relative grid min-h-[70vh] grid-cols-1 pb-16 lg:h-full lg:min-h-0 lg:grid-cols-[220px_minmax(0,1fr)_300px] lg:overflow-hidden lg:pb-0" data-testid="editor">
      <aside className={`${panel === "sections" ? "block" : "hidden"} editor-scroll min-h-0 overflow-y-auto border-r border-ink/10 bg-surface p-3 lg:block`}>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Add a section</p>
        <DndContext id="editor-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
            {PALETTE.map((item) => (
              <PaletteItem key={item.type} type={item.type} label={item.label} disabled={item.type === "freeform" && !premium} onAdd={() => add(item.type)} />
            ))}
          </div>
          <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wider text-muted">Your sections</p>
          <SortableContext items={design.sections.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <div className="grid gap-1">
              {design.sections.map((item) => (
                <LayerRow
                  key={item.id}
                  section={item}
                  active={selected.includes(item.id)}
                  onSelect={(multi) => {
                    setSelected((curr) => (multi ? (curr.includes(item.id) ? curr.filter((id) => id !== item.id) : [...curr, item.id]) : [item.id]));
                  }}
                  onUp={() => move(item.id, -1)}
                  onDown={() => move(item.id, 1)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </aside>
      <div className={`${panel === "preview" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col overflow-hidden bg-surface-muted lg:flex`}>
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line bg-page/95 px-3 py-1.5">
          <span data-testid="save-status" className={`rounded-full px-2.5 py-1 text-xs ${saveState === "saved" || saveState === "saving" ? "text-muted" : "bg-blush/60 text-maroon"}`}>{SAVE_LABEL[saveState]}</span>
          {saveState === "failed" || saveState === "offline" ? <Button type="button" size="sm" variant="ghost" onClick={() => void save()}>Retry</Button> : null}
          <Button type="button" size="sm" variant="ghost" data-testid="undo" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!past.length} onClick={undo}><Undo2 className="size-4" aria-hidden /></Button>
          <Button type="button" size="sm" variant="ghost" data-testid="redo" aria-label="Redo" title="Redo (Ctrl+Y)" disabled={!future.length} onClick={redo}><Redo2 className="size-4" aria-hidden /></Button>
          <div className="ml-auto hidden items-center gap-1 rounded-full border border-line p-0.5 sm:flex">
            {(["desktop", "tablet", "mobile"] as const).map((item) => {
              const Icon = item === "desktop" ? Monitor : item === "tablet" ? Tablet : Smartphone;
              return (
                <Button key={item} type="button" size="sm" className="h-8 px-2.5" variant={device === item ? "primary" : "ghost"} aria-label={`${item} preview`} title={`${item[0].toUpperCase()}${item.slice(1)} preview`} data-testid={`preview-${item}`} onClick={() => setDevice(item)}>
                  <Icon className="size-4" aria-hidden />
                </Button>
              );
            })}
          </div>
          <label className="hidden items-center gap-2 text-xs text-muted xl:flex">
            Zoom
            <input type="range" min={0.5} max={1.2} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            <span className="w-9 tabular-nums">{Math.round(zoom * 100)}%</span>
          </label>
          {others.length ? <span className="text-xs">Also editing: {others.join(", ")}</span> : null}
          {gate ? <span data-testid="premium-gate" className="w-full text-xs text-maroon">Premium template. Upgrade before publishing.</span> : null}
          {saveState === "conflict" ? (
            <Button type="button" size="sm" variant="danger" onClick={() => window.location.reload()}>
              Load their version
            </Button>
          ) : null}
        </div>
        {editingId ? (
          <div className="sticky top-12 z-20 mx-auto flex w-fit flex-wrap items-center gap-2 rounded-full border border-ink/10 bg-surface px-3 py-2 shadow-sm">
            <Button type="button" size="sm" variant="ghost" onClick={() => setStyle({ bold: !current?.style.bold })}>Bold</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setStyle({ italic: !current?.style.italic })}>Italic</Button>
            <label className="text-xs">Size <input data-testid="inline-size" type="number" className="w-16 rounded-md border border-line bg-surface px-1" value={current?.style.fontSize ?? 18} onChange={(event) => setStyle({ fontSize: Number(event.target.value) })} /></label>
            <label className="flex items-center gap-1 text-xs">Colour <input data-testid="inline-color" type="color" value={textDefault} onChange={(event) => setStyle({ color: event.target.value })} /></label>
            {(["en", "ta", "hi"] as const).map((item) => (
              <Button key={item} type="button" size="sm" variant={locale === item ? "primary" : "ghost"} onClick={() => { setLocale(item); commit((draft) => ({ ...draft, language: item })); }}>{LOCALE_LABEL[item]}</Button>
            ))}
          </div>
        ) : null}
        <div className="editor-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto my-4 max-w-full overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow" style={{ width: device === "desktop" ? "min(100%, 960px)" : width, zoom }} data-testid="editor-canvas">
          <InvitationView
            theme={theme}
            palette={palette}
            design={{ ...design, language: locale }}
            wedding={wedding}
            events={events}
            media={media}
            locale={locale}
            mode="editor"
            showHidden
            selected={selected}
            editingId={editingId}
            onSelect={(id) => setSelected([id])}
            onEdit={(id) => {
              setSelected([id]);
              setEditingId(id);
            }}
            onText={(id, field, value) => {
              patchSection(id, (item) => {
                const currentValue = (item.content[field] && typeof item.content[field] === "object" ? item.content[field] : { en: "", ta: "", hi: "" }) as Record<string, string>;
                return { ...item, content: { ...item.content, [field]: { ...currentValue, [locale]: value } } };
              });
            }}
          />
        </div>
        </div>
      </div>
      <aside className={`${panel === "style" ? "block" : "hidden"} editor-scroll min-h-0 min-w-0 overflow-y-auto border-l border-ink/10 bg-surface p-3 lg:block [&_input]:max-w-full [&_select]:max-w-full`}>
        <Group title="Invitation" open>
          <label className="block text-xs">Template
            <select className={SELECT} data-testid="template-switch" value={design.templateId} onChange={(event) => commit((draft) => ({ ...draft, templateId: event.target.value, paletteId: "classic" }))}>
              {themes.map((item) => <option key={item.id} value={item.id}>{item.name}{item.tier === "premium" ? " · Premium" : ""}</option>)}
            </select>
          </label>
          <div className="text-xs">
            Palette
            <div className="mt-1 flex flex-wrap gap-2">
              {theme.palettes.map((item) => (
                <button key={item.id} type="button" title={item.name} aria-label={item.name} aria-pressed={design.paletteId === item.id} onClick={() => commit((draft) => ({ ...draft, paletteId: item.id }))} className={`flex overflow-hidden rounded-full border-2 ${design.paletteId === item.id ? "border-maroon" : "border-line"}`}>
                  {[item.colors.background, item.colors.text, item.colors.accent].map((colour) => <span key={colour} className="block size-5" style={{ background: colour }} />)}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-xs">Font pairing
            <select className={SELECT} value={design.fontPairing} onChange={(event) => commit((draft) => ({ ...draft, fontPairing: event.target.value }))}>
              <option value="classic">Classic serif</option>
              <option value="modern">Modern sans</option>
              <option value="tamil" disabled={!premium}>Tamil display (Premium)</option>
              <option value="devanagari" disabled={!premium}>Devanagari display (Premium)</option>
            </select>
          </label>
          <label className="block text-xs">Motif pack
            <select className={SELECT} value={design.motifPack} onChange={(event) => commit((draft) => ({ ...draft, motifPack: event.target.value as Design["motifPack"] }))}>
              <option value="neutral">Neutral</option>
              <option value="hindu">Hindu</option>
              <option value="muslim">Muslim</option>
              <option value="christian">Christian</option>
              <option value="sikh">Sikh</option>
            </select>
          </label>
          <ColourField label="Page background" value={design.pageBackground || palette.background} onChange={(value) => commit((draft) => ({ ...draft, pageBackground: value }))} />
        </Group>
        {current ? (
          <>
            <div className="mt-3 border-t border-ink/10 pt-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Selected: {labelOf(current.type)}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Button type="button" size="sm" variant="ghost" data-testid="duplicate-section" onClick={duplicate}><Copy className="size-4" aria-hidden />Duplicate</Button>
                <Button type="button" size="sm" variant="ghost" data-testid="hide-section" onClick={() => patchSection(current.id, (item) => ({ ...item, hidden: !item.hidden }))}>{current.hidden ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}{current.hidden ? "Show" : "Hide"}</Button>
                <Button type="button" size="sm" variant="ghost" data-testid="lock-section" onClick={() => commit((draft) => ({ ...draft, sections: draft.sections.map((item) => item.id === current.id ? { ...item, locked: !item.locked } : item) }))}><Lock className="size-4" aria-hidden />{current.locked ? "Unlock" : "Lock"}</Button>
              </div>
            </div>
            <Group title="Text" open>
              <ColourField label="Text colour" testId="prop-color" value={textDefault} onChange={(value) => setStyle({ color: value })} />
              <SliderField label="Font size" testId="prop-font-size" min={12} max={72} step={1} unit="px" value={current.style.fontSize} onChange={(value) => setStyle({ fontSize: value })} />
              <SliderField label="Line height" min={1} max={2.4} step={0.1} value={current.style.lineHeight} onChange={(value) => setStyle({ lineHeight: value })} />
              <SliderField label="Letter spacing" min={-2} max={10} step={0.5} unit="px" value={current.style.letterSpacing} onChange={(value) => setStyle({ letterSpacing: value })} />
              <div className="text-xs">
                Align
                <div className="mt-1 grid grid-cols-3 gap-1 rounded-xl border border-line p-0.5">
                  {(["left", "center", "right"] as const).map((item) => (
                    <button key={item} type="button" aria-pressed={current.style.align === item} onClick={() => setStyle({ align: item })} className={`rounded-lg py-1.5 ${current.style.align === item ? "bg-maroon text-ivory" : ""}`}>{item === "center" ? "Centre" : item[0].toUpperCase() + item.slice(1)}</button>
                  ))}
                </div>
              </div>
            </Group>
            <Group title="Background & border">
              <ColourField label="Background" value={backgroundDefault} onChange={(value) => setStyle({ background: value })} />
              <SliderField label="Corner radius" min={0} max={48} step={1} unit="px" value={current.style.radius} onChange={(value) => setStyle({ radius: value })} />
              <SliderField label="Border" min={0} max={8} step={1} unit="px" value={current.style.borderWidth} onChange={(value) => setStyle({ borderWidth: value })} />
            </Group>
            <Group title="Spacing">
              <SliderField label="Padding" testId="prop-padding" min={0} max={120} step={4} unit="px" value={current.style.padding} onChange={(value) => setStyle({ padding: value })} />
              <SliderField label="Margin" min={0} max={120} step={4} unit="px" value={current.style.margin} onChange={(value) => setStyle({ margin: value })} />
            </Group>
            <Group title="Effects">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={current.style.ornament} onChange={(event) => setStyle({ ornament: event.target.checked })} /> Show ornaments</label>
              <label className="block text-xs">Animation
                <select className={SELECT} value={current.style.animation} onChange={(event) => setStyle({ animation: event.target.value as Section["style"]["animation"] })}>
                  <option value="none">None</option>
                  <option value="fade">Fade in</option>
                  <option value="rise">Rise up</option>
                </select>
              </label>
            </Group>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-ink/10 pt-3">
              <Button type="button" size="sm" variant="ghost" onClick={() => setStyle({ color: "", background: "", fontSize: 18, padding: 32, letterSpacing: 0, lineHeight: 1.5, ornament: true })}>Reset style</Button>
              <Button type="button" size="sm" variant="danger" className="ml-auto" data-testid="delete-section" disabled={current.locked} onClick={removeSelected}><Trash2 className="size-4" aria-hidden />Delete section</Button>
            </div>
          </>
        ) : <p className="mt-3 border-t border-ink/10 pt-3 text-xs text-muted">Select a section in the preview to change its style.</p>}
        {current?.type === "freeform" ? <FreeformTools section={current} onChange={(next) => patchSection(current.id, () => next)} /> : null}
        <Group title="Versions" open>
          <Button type="button" size="sm" data-testid="version-snapshot" onClick={async () => {
            await fetch(`/api/weddings/${weddingId}/versions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label: "Manual snapshot" }) });
            await refreshVersions();
          }}>Save snapshot</Button>
          <ul className="grid gap-1 text-xs">
            {versions.map((version) => (
              <li key={version.id} className="flex items-center justify-between gap-2">
                <span>{version.label}</span>
                <button type="button" className="text-link underline-offset-2 hover:underline" data-testid="version-restore" onClick={async () => {
                  const res = await fetch(`/api/weddings/${weddingId}/versions/${version.id}`, { method: "POST" });
                  const data = await res.json();
                  if (res.ok) {
                    skip.current = true;
                    setDesign(data.design);
                    setRevision(data.revision);
                    revisionRef.current = data.revision;
                  }
                }}>Restore</button>
              </li>
            ))}
          </ul>
          {comparison ? <p className="text-xs">Changed sections: {comparison.changed.length}. Added {comparison.added.length}. Removed {comparison.removed.length}.</p> : null}
        </Group>
        <GalleryTools weddingId={weddingId} media={media} plan={plan} onChange={setMedia} />
      </aside>
      {toast ? (
        <div role="status" className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-4 py-2 text-sm text-page shadow-lg lg:bottom-6">
          {toast}
          <button type="button" className="font-medium text-gold-soft" onClick={() => { undo(); setToast(null); }}>Undo</button>
        </div>
      ) : null}
      <nav aria-label="Editor panels" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-surface lg:hidden">
        {([["preview", "Preview", Eye], ["sections", "Sections", LayoutList], ["style", "Style", Palette]] as const).map(([id, label, Icon]) => (
          <button key={id} type="button" aria-pressed={panel === id} onClick={() => setPanel(id)} className={`flex flex-col items-center gap-0.5 py-2 text-xs ${panel === id ? "text-maroon" : "text-muted"}`}>
            <Icon className="size-5" aria-hidden />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

const SELECT = "mt-1 h-10 w-full rounded-xl border border-line bg-surface px-2 text-ink";
const SAVE_LABEL = { saved: "All changes saved", saving: "Saving…", failed: "Couldn't save", offline: "Offline · not saved", conflict: "Edited elsewhere" } as const;
const LOCALE_LABEL = { en: "English", ta: "தமிழ்", hi: "हिन्दी" } as const;

function labelOf(type: SectionType) {
  return PALETTE.find((item) => item.type === type)?.label ?? type;
}

function Group({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group mt-3 border-t border-ink/10 pt-3 first:mt-0 first:border-t-0 first:pt-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium uppercase tracking-wider text-muted">
        {title}
        <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-2 grid gap-3">{children}</div>
    </details>
  );
}

function SliderField({ label, value, min, max, step, unit = "", testId, onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; testId?: string; onChange: (value: number) => void }) {
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="flex items-center gap-1 text-muted">
          <input type="number" data-testid={testId} aria-label={label} className="w-14 rounded-md border border-line bg-surface px-1 text-right text-ink" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
          {unit}
        </span>
      </div>
      <input type="range" aria-hidden tabIndex={-1} className="mt-1 w-full accent-maroon" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}

function ColourField({ label, value, testId, onChange }: { label: string; value: string; testId?: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      {label}
      <span className="flex items-center gap-2 rounded-xl border border-line px-2 py-1">
        <input type="color" data-testid={testId} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" value={value} onChange={(event) => onChange(event.target.value)} />
        <span className="font-mono uppercase text-muted">{value}</span>
      </span>
    </label>
  );
}

function PaletteItem({ type, label, onAdd, disabled }: { type: SectionType; label: string; onAdd: () => void; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `pal-${type}`, data: { from: "palette", type }, disabled });
  return (
    <button ref={setNodeRef} type="button" data-testid={`palette-${type}`} className="rounded-lg border border-ink/10 px-2 py-2 text-left text-sm hover:border-maroon/40 hover:bg-surface-muted disabled:opacity-40" disabled={disabled} onClick={onAdd} title={disabled ? "Premium plan only" : `Add ${label}`} {...attributes} {...listeners}>
      + {label}{disabled ? " · Premium" : ""}
    </button>
  );
}

function LayerRow({ section, active, onSelect, onUp, onDown }: { section: Section; active: boolean; onSelect: (multi: boolean) => void; onUp: () => void; onDown: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id, disabled: section.locked });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm ${active ? "bg-blush/60" : "hover:bg-surface-muted"}`}>
      <button type="button" className="flex-1 text-left" onClick={(event) => onSelect(event.shiftKey)} {...attributes} {...listeners}>
        {labelOf(section.type)}
        {section.hidden ? <span className="ml-1 text-xs text-muted">· hidden</span> : null}
        {section.locked ? <span className="ml-1 text-xs text-muted">· locked</span> : null}
      </button>
      <button type="button" className="rounded px-1 text-muted hover:text-ink" aria-label="Move up" data-testid="layer-up" onClick={onUp}>↑</button>
      <button type="button" className="rounded px-1 text-muted hover:text-ink" aria-label="Move down" data-testid="layer-down" onClick={onDown}>↓</button>
    </div>
  );
}

function FreeformTools({ section, onChange }: { section: Section; onChange: (section: Section) => void }) {
  const elements = section.elements ?? [];
  return (
    <div className="mt-3 grid gap-2 border-t border-ink/10 pt-3" data-testid="freeform-tools">
      <p className="text-xs font-medium uppercase tracking-wider">Freeform</p>
      <Button type="button" size="sm" onClick={() => onChange({ ...section, elements: [...elements, { id: `el-${Date.now()}`, type: "text", x: 40, y: 40, w: 160, h: 48, rotation: 0, z: elements.length + 1, text: { en: "Blessing", ta: "வாழ்த்து", hi: "आशीर्वाद" }, fontSize: 22 }] })}>Add text</Button>
      <Button type="button" size="sm" variant="secondary" onClick={() => onChange({ ...section, elements: [...elements, { id: `el-${Date.now()}`, type: "shape", x: 48, y: 120, w: 120, h: 80, rotation: 0, z: elements.length + 1, shape: "rect", color: "#D4AF37" }] })}>Add shape</Button>
      {elements[0] ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label>X <input type="number" value={elements[0].x} onChange={(event) => onChange({ ...section, elements: elements.map((el, i) => i === 0 ? { ...el, x: snap(Number(event.target.value)) } : el) })} /></label>
          <label>Y <input type="number" value={elements[0].y} onChange={(event) => onChange({ ...section, elements: elements.map((el, i) => i === 0 ? { ...el, y: snap(Number(event.target.value)) } : el) })} /></label>
          <label>Rotate <input type="number" value={elements[0].rotation} onChange={(event) => onChange({ ...section, elements: elements.map((el, i) => i === 0 ? { ...el, rotation: Number(event.target.value) } : el) })} /></label>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ ...section, elements: elements.map((el, i) => i === 0 ? { ...el, z: el.z + 1 } : el) })}>Bring forward</Button>
        </div>
      ) : null}
    </div>
  );
}

function snap(value: number) {
  return Math.round(value / 8) * 8;
}

function GalleryTools({ weddingId, media, plan, onChange }: { weddingId: string; media: InviteMedia[]; plan: string; onChange: (media: InviteMedia[]) => void }) {
  const limit = plan === "premium" ? 50 : 6;
  return (
    <div className="mt-4 border-t border-ink/10 pt-3">
      <p className="mb-2 text-xs">Gallery {media.length}/{limit}</p>
      <input
        type="file"
        accept="image/*"
        data-testid="image-upload"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const compressed = await compressImage(file);
          const body = new FormData();
          body.set("file", compressed);
          body.set("alt", "Wedding photograph");
          body.set("kind", "gallery");
          const res = await fetch(`/api/weddings/${weddingId}/media`, { method: "POST", body });
          const data = await res.json();
          if (res.ok) onChange([...media, data.media]);
          else alert(data.error);
        }}
      />
      {media.map((item) => (
        <div key={item.id} className="mt-2 text-xs">
          <p>{item.alt}</p>
          <label>Focal X <input type="range" min={0} max={1} step={0.01} value={item.focalX} onChange={(event) => updateMedia(weddingId, item, { focalX: Number(event.target.value) }, media, onChange)} /></label>
          <label>Mask
            <select value={item.mask} onChange={(event) => updateMedia(weddingId, item, { mask: event.target.value }, media, onChange)}>
              <option value="rounded">Rounded</option>
              <option value="circle">Circle</option>
              <option value="arch">Arch</option>
            </select>
          </label>
          <Badge>{humanize(item.kind)}</Badge>
        </div>
      ))}
    </div>
  );
}

async function updateMedia(weddingId: string, item: InviteMedia, patch: Partial<InviteMedia>, media: InviteMedia[], onChange: (media: InviteMedia[]) => void) {
  const next = media.map((entry) => (entry.id === item.id ? { ...entry, ...patch } : entry));
  onChange(next);
  await fetch(`/api/weddings/${weddingId}/media/${item.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
}

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) return file;
  return new File([blob], "photo.webp", { type: "image/webp" });
}
