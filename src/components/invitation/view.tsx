"use client";

import type { CSSProperties } from "react";
import { readLocale, type Design, type Section, type SectionStyle } from "@/lib/design";
import { t, type Locale } from "@/lib/i18n";
import { youtubeEmbed } from "@/lib/domain";
import type { ThemeBundle, ThemeColors } from "@/lib/templates";
import { Countdown, FallbackImage, GalleryLightbox, MusicControl, RsvpForm, VideoBlock } from "@/components/invitation/bits";

export type InviteEvent = {
  id: string;
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
  mapUrl: string;
};

export type InviteMedia = {
  id: string;
  url: string;
  alt: string;
  focalX: number;
  focalY: number;
  mask: string;
  kind: string;
};

export type InvitationModel = {
  groomName: string;
  brideName: string;
  city: string;
  state: string;
  weddingDate: string;
  slug: string;
  watermark: boolean;
};

function text(section: Section, field: string, locale: Locale) {
  return readLocale(section.content[field], locale);
}

function boxStyle(style: SectionStyle): CSSProperties {
  return {
    textAlign: style.align,
    color: style.color || undefined,
    background: style.background || undefined,
    backgroundImage: style.backgroundImage ? `url(${style.backgroundImage})` : undefined,
    backgroundSize: "cover",
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    letterSpacing: `${style.letterSpacing}px`,
    padding: style.padding,
    marginTop: style.margin,
    border: style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor || "var(--inv-accent)"}` : undefined,
    borderRadius: style.radius || undefined,
    opacity: style.opacity,
    boxShadow: style.shadow === "soft" ? "0 10px 30px rgba(60,20,20,.08)" : style.shadow === "medium" ? "0 18px 40px rgba(60,20,20,.16)" : undefined,
    fontWeight: style.bold ? 700 : undefined,
    fontStyle: style.italic ? "italic" : undefined,
  };
}

function Ornament({ svg, className }: { svg?: string; className?: string }) {
  if (!svg) return null;
  return <span className={`ornament ${className ?? ""}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function InvitationView({
  theme,
  palette,
  design,
  wedding,
  events,
  media,
  locale,
  mode = "public",
  guestName,
  token,
  showHidden = false,
  selected = [],
  onSelect,
  onEdit,
  editingId,
  onText,
}: {
  theme: ThemeBundle;
  palette: ThemeColors;
  design: Design;
  wedding: InvitationModel;
  events: InviteEvent[];
  media: InviteMedia[];
  locale: Locale;
  mode?: "public" | "editor" | "card";
  guestName?: string;
  token?: string;
  showHidden?: boolean;
  selected?: string[];
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  editingId?: string | null;
  onText?: (id: string, field: string, value: string) => void;
}) {
  const labels = {
    name: t(locale, "name"),
    attending: t(locale, "attending"),
    not_attending: t(locale, "notAttending"),
    maybe: t(locale, "maybe"),
    headcount: t(locale, "headcount"),
    dietary: t(locale, "dietary"),
    veg: t(locale, "veg"),
    nonveg: t(locale, "nonveg"),
    jain: t(locale, "jain"),
    message: t(locale, "message"),
    submit: t(locale, "submit"),
    consent: t(locale, "consent"),
  };
  const hero = design.sections.find((s) => s.type === "hero");
  const visible = design.sections.filter((s) => (showHidden || !s.hidden) && s.type !== "hero");
  const styleName = theme.layout.heroStyle;
  return (
    <article
      className={`invitation inv-${styleName} font-${design.fontPairing} lang-${locale}`}
      style={{
        ["--inv-bg" as string]: design.pageBackground || palette.background,
        ["--inv-surface" as string]: palette.surface,
        ["--inv-text" as string]: palette.text,
        ["--inv-muted" as string]: palette.muted,
        ["--inv-accent" as string]: palette.accent,
        ["--ornament-color" as string]: palette.accent,
        background: design.pageBackground || palette.background,
      }}
      data-testid="invitation"
      data-template={theme.id}
    >
      {hero && (showHidden || !hero.hidden) ? (
        <header
          className={`inv-hero ${selected.includes(hero.id) ? "section-selected" : ""} ${hero.hidden ? "section-hidden-edit" : ""}`}
          data-testid={`section-${hero.id}`}
          data-section-type="hero"
          onClick={() => onSelect?.(hero.id)}
          onDoubleClick={(event) => {
            event.stopPropagation();
            onEdit?.(hero.id);
          }}
        >
          <FallbackImage
            src={theme.ornaments.heroBg}
            srcSet={`${theme.ornaments.heroBgSmall} 640w, ${theme.ornaments.heroBg} 1280w`}
            sizes="100vw"
            width={1280}
            height={720}
            alt=""
            aria-hidden
            className="inv-hero-bg"
            fallbackClassName="inv-hero-bg"
          />
          <div className="inv-hero-shade" />
          <Ornament svg={theme.svg.corners.tl} className="inv-corner tl" />
          <Ornament svg={theme.svg.corners.tr} className="inv-corner tr" />
          <Ornament svg={theme.svg.corners.bl} className="inv-corner bl" />
          <Ornament svg={theme.svg.corners.br} className="inv-corner br" />
          <div className="inv-frame">
            {design.motifPack === "hindu" ? <span className="motif-glyph" aria-hidden>ॐ</span> : null}
            {design.motifPack === "sikh" ? <span className="motif-glyph" lang="pa">ੴ</span> : null}
            {design.motifPack === "muslim" ? <Ornament svg={theme.svg.motifs.arch || ""} className="mx-auto mb-3 w-16" /> : null}
            {design.motifPack === "christian" ? <span className="motif-glyph" aria-hidden>✝</span> : null}
            <p className="inv-eyebrow inv-copy">{text(hero, "eyebrow", locale)}</p>
            <h1 className="inv-names inv-copy mt-4">
              {editingId === hero.id ? (
                <input
                  data-testid="inline-text"
                  className="w-full bg-transparent text-center"
                  value={text(hero, "title", locale)}
                  onChange={(event) => onText?.(hero.id, "title", event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                />
              ) : (
                text(hero, "title", locale) || `${wedding.groomName} & ${wedding.brideName}`
              )}
            </h1>
            {hero.style.ornament ? <Ornament svg={theme.svg.divider} className="mx-auto my-6 w-56" /> : null}
            <p className="inv-copy text-lg">{text(hero, "subtitle", locale)}</p>
            <p className="inv-date mt-4">{text(hero, "date", locale)}</p>
            <p className="mt-2 opacity-80">{text(hero, "place", locale) || `${wedding.city}, ${wedding.state}`}</p>
            {guestName ? <p className="mt-6 text-sm uppercase tracking-[0.18em]">Dear {guestName}</p> : null}
          </div>
        </header>
      ) : null}
      {hero?.style.ornament ? <Ornament svg={theme.svg.borderTop} className="inv-border" /> : null}
      {visible.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          theme={theme}
          locale={locale}
          wedding={wedding}
          events={events}
          media={media}
          mode={mode}
          token={token}
          guestName={guestName}
          labels={labels}
          editingId={editingId}
          onText={onText}
          onEdit={onEdit}
          selected={selected.includes(section.id)}
          onSelect={onSelect}
        />
      ))}
      {wedding.watermark ? (
        <p className="pb-8 text-center text-xs uppercase tracking-[0.2em] opacity-60">{t(locale, "madeWith")}</p>
      ) : null}
    </article>
  );
}

function SectionBlock(props: {
  section: Section;
  theme: ThemeBundle;
  locale: Locale;
  wedding: InvitationModel;
  events: InviteEvent[];
  media: InviteMedia[];
  mode: "public" | "editor" | "card";
  token?: string;
  guestName?: string;
  labels: Record<string, string>;
  selected: boolean;
  editingId?: string | null;
  onText?: (id: string, field: string, value: string) => void;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  const { section, locale, theme } = props;
  const anim = section.style.animation !== "none" ? `anim-${section.style.animation}` : "";
  return (
    <section
      className={`inv-section ${anim} ${props.selected ? "section-selected" : ""} ${section.hidden ? "section-hidden-edit" : ""}`}
      style={boxStyle(section.style)}
      data-testid={`section-${section.id}`}
      data-section-type={section.type}
      onClick={() => props.onSelect?.(section.id)}
      onDoubleClick={(event) => {
        event.stopPropagation();
        props.onEdit?.(section.id);
      }}
    >
      <div className="inv-section-inner inv-copy">
        {section.style.ornament && section.type !== "footer" ? <Ornament svg={theme.svg.divider} className="mx-auto mb-6 w-40" /> : null}
        <SectionBody {...props} />
      </div>
    </section>
  );
}

function SectionBody({
  section,
  locale,
  wedding,
  events,
  media,
  mode,
  token,
  guestName,
  editingId,
  onText,
  labels,
}: {
  section: Section;
  locale: Locale;
  wedding: InvitationModel;
  events: InviteEvent[];
  media: InviteMedia[];
  mode: "public" | "editor" | "card";
  token?: string;
  guestName?: string;
  editingId?: string | null;
  onText?: (id: string, field: string, value: string) => void;
  labels: Record<string, string>;
}) {
  const title = text(section, "title", locale);
  const field = section.type === "quote" || section.type === "footer" ? "text" : section.type === "welcome" || section.type === "travel" || section.type === "gifts" || section.type === "faq" ? "body" : "title";
  const inline = editingId === section.id ? (
    <textarea
      data-testid="inline-text"
      className="mb-4 w-full bg-transparent font-serif text-3xl"
      value={field === "title" ? title : text(section, field, locale)}
      onChange={(event) => onText?.(section.id, field, event.target.value)}
      onClick={(event) => event.stopPropagation()}
    />
  ) : null;
  if (inline) return inline;
  if (section.type === "welcome") {
    return (
      <>
        <h2 className="mb-4 font-serif text-4xl">{title}</h2>
        <p className="text-lg leading-relaxed">{text(section, "body", locale)}</p>
      </>
    );
  }
  if (section.type === "countdown") {
    return (
      <>
        <h2 className="mb-6 font-serif text-4xl">{title}</h2>
        {mode === "editor" ? <p>Countdown appears on the published site.</p> : <Countdown date={wedding.weddingDate} labels={{ days: t(locale, "days"), hours: t(locale, "hours"), minutes: t(locale, "minutes"), seconds: t(locale, "seconds") }} />}
      </>
    );
  }
  if (section.type === "schedule") {
    return (
      <>
        <h2 className="mb-6 font-serif text-4xl">{title || t(locale, "events")}</h2>
        <div className="grid gap-4">
          {events.map((event) => (
            <article key={event.id} className="inv-card p-4 text-left" data-testid={`public-event-${event.type}`}>
              <p className="text-xs uppercase tracking-[0.16em] opacity-70">{event.type}</p>
              <h3 className="font-serif text-2xl">{event.name}</h3>
              <p>{event.date} · {event.startTime}{event.endTime ? `–${event.endTime}` : ""} IST</p>
              {event.muhurat ? <p>Muhurat {event.muhurat}</p> : null}
              {event.tithi ? <p>Tithi {event.tithi}</p> : null}
              {event.nakshatra ? <p>Nakshatra {event.nakshatra}</p> : null}
              {event.dressCode ? <p>Dress {event.dressCode}</p> : null}
              <p>{event.venueName}{event.address ? `, ${event.address}` : ""}</p>
              <div className="mt-3 flex gap-3 text-sm">
                {event.mapUrl ? <a href={event.mapUrl} target="_blank" rel="noreferrer">{t(locale, "openMap")}</a> : null}
                <a href={`/api/public/${wedding.slug}/ics?event=${event.id}`}>{t(locale, "addToCalendar")}</a>
              </div>
            </article>
          ))}
        </div>
      </>
    );
  }
  if (section.type === "venue") {
    const first = events[0];
    return (
      <>
        <h2 className="mb-4 font-serif text-4xl">{title}</h2>
        {events.map((event) => (
          <p key={event.id} className="mb-2">
            <strong>{event.name}.</strong> {event.venueName}, {event.address}, {event.city}
          </p>
        ))}
        {first?.mapUrl ? <a href={first.mapUrl}>{t(locale, "openMap")}</a> : null}
      </>
    );
  }
  if (section.type === "gallery") {
    const images = media.filter((m) => m.kind === "gallery" || m.kind === "couple");
    return (
      <>
        <h2 className="mb-6 font-serif text-4xl">{title || t(locale, "gallery")}</h2>
        {images.length ? <GalleryLightbox images={images} /> : <p className="opacity-70">Photos will appear here.</p>}
      </>
    );
  }
  if (section.type === "quote") {
    return (
      <blockquote>
        <p className="font-serif text-3xl italic">{text(section, "text", locale)}</p>
        {text(section, "by", locale) ? <footer className="mt-3 opacity-70">{text(section, "by", locale)}</footer> : null}
      </blockquote>
    );
  }
  if (section.type === "rsvp") {
    return (
      <>
        <h2 className="mb-3 font-serif text-4xl">{title || t(locale, "rsvp")}</h2>
        <p className="mb-5">{text(section, "note", locale)}</p>
        {mode === "public" ? (
          <RsvpForm slug={wedding.slug} token={token} guestName={guestName} locale={locale} labels={labels} />
        ) : (
          <p className="opacity-70">Guests reply on the published page.</p>
        )}
      </>
    );
  }
  if (section.type === "family") {
    const members = Array.isArray(section.content.members) ? (section.content.members as { name?: string; role?: string }[]) : [];
    return (
      <>
        <h2 className="mb-4 font-serif text-4xl">{title || "Family"}</h2>
        <ul className="grid gap-2">
          {members.map((member, index) => (
            <li key={index}>{member.role ? `${member.role}: ` : ""}{member.name}</li>
          ))}
        </ul>
      </>
    );
  }
  if (section.type === "video") {
    const embed = youtubeEmbed(String(section.content.url || ""));
    return (
      <>
        <h2 className="mb-4 font-serif text-4xl">{title || "Video"}</h2>
        <VideoBlock url={embed || ""} title={title || "Wedding video"} />
      </>
    );
  }
  if (section.type === "music") {
    return (
      <>
        <h2 className="mb-4 font-serif text-4xl">{title || "Music"}</h2>
        {section.content.src ? <MusicControl src={String(section.content.src)} play={t(locale, "playMusic")} pause={t(locale, "pauseMusic")} /> : <p>Add a music URL.</p>}
      </>
    );
  }
  if (section.type === "travel" || section.type === "gifts" || section.type === "faq") {
    return (
      <>
        <h2 className="mb-4 font-serif text-4xl">{title}</h2>
        <p className="whitespace-pre-wrap leading-relaxed">{text(section, "body", locale)}</p>
      </>
    );
  }
  if (section.type === "freeform") {
    return (
      <div className="freeform-board" data-testid="freeform-board">
        {(section.elements ?? []).map((el) => (
          <div key={el.id} style={{ position: "absolute", left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.rotation}deg)`, zIndex: el.z, color: el.color }}>
            {el.type === "text" ? <span style={{ fontSize: el.fontSize || 18 }}>{readLocale(el.text, locale)}</span> : null}
            {el.type === "shape" ? <div style={{ width: "100%", height: "100%", borderRadius: el.shape === "ellipse" ? "999px" : 8, background: el.color || "var(--inv-accent)", opacity: 0.8 }} /> : null}
            {el.type === "image" && el.src ? <img src={el.src} alt={el.alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
          </div>
        ))}
      </div>
    );
  }
  return <p className="font-serif text-2xl">{text(section, "text", locale) || title}</p>;
}

