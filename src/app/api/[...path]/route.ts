import { z } from "zod";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertSameOrigin, clientIp, fail, ok } from "@/lib/http";
import { clearSessionCookie, getSessionUser, hashPassword, requireUser, setSessionCookie, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { beat, readers } from "@/lib/presence";
import { createFileStore, sniffImage } from "@/lib/storage";
import { icsForEvent } from "@/lib/domain";
import { guestSchema, rsvpSchema, submitPublicRsvp, listGuests, createGuest, updateGuest, deleteGuest, deleteAllGuests, importGuests, exportGuestsCsv, rsvpSummary } from "@/services/guests";
import { weddingInputSchema, eventInputSchema, createWedding, getOwnedWedding, saveDesign, syncEvents, publishWedding, unpublishWedding, rollbackPublished, snapshotDesign, restoreVersion, listVersions, toEventDTO, parseDesign, deleteDraftWedding } from "@/services/weddings";
import { createSimulatedOrder, settleSimulatedOrder } from "@/services/billing";
import { plannerHome, saveTask, deleteTask, saveVendor, deleteVendor, saveBudget, adminOverview } from "@/services/planner";
import { audit, can, weddingAccess } from "@/services/access";
import { loadThemes, loadTheme, clearThemeCache } from "@/lib/templates";
import { gateToken } from "@/services/public";
import { kolkataDateInput } from "@/lib/utils";
import { sanitizeText } from "@/lib/sanitize";
import { resetDemo } from "@/services/seed-demo";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readJson(req: Request) {
  return req.json().catch(() => ({}));
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  const status = error && typeof error === "object" && "status" in error ? Number((error as { status: number }).status) : 400;
  return fail(message, Number.isFinite(status) ? status : 400);
}

async function handle(req: Request, parts: string[]) {
  const [a, b, c, d] = parts;
  const method = req.method;
  try {
    if (method !== "GET" && method !== "HEAD") assertSameOrigin(req);

    if (a === "auth" && b === "login" && method === "POST") {
      if (!rateLimit(`login:${clientIp(req)}`, 12, 60_000).ok) return fail("Too many attempts. Wait a minute.", 429);
      const body = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(await readJson(req));
      const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
      if (!user || !verifyPassword(body.password, user.passwordHash)) return fail("Email or password is incorrect.", 401);
      if (user.role !== "couple" && user.role !== "planner" && user.role !== "admin") return fail("Unknown role.", 403);
      await setSessionCookie({ id: user.id, role: user.role });
      return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, demo: true });
    }
    if (a === "auth" && b === "register" && method === "POST") {
      const body = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(8).max(80) }).parse(await readJson(req));
      const email = body.email.toLowerCase();
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) return fail("An account with that email already exists.", 409);
      const user = await prisma.user.create({ data: { email, name: sanitizeText(body.name, 80), passwordHash: hashPassword(body.password), role: "couple" } });
      await setSessionCookie({ id: user.id, role: "couple" });
      return ok({ user: { id: user.id, email, name: user.name, role: "couple" }, demo: true });
    }
    if (a === "auth" && b === "logout" && method === "POST") {
      await clearSessionCookie();
      return ok({ ok: true });
    }
    if (a === "auth" && b === "me" && method === "GET") {
      const user = await getSessionUser();
      return ok({ user, demo: true });
    }
    if (a === "demo" && b === "reset" && method === "POST") {
      const body = await readJson(req);
      if (body.confirm !== "RESET DEMO") return fail("Type RESET DEMO to confirm.");
      if (!rateLimit("demo-reset", 3, 60_000).ok) return fail("Please wait before resetting again.", 429);
      const info = await resetDemo();
      await clearSessionCookie();
      return ok({ ok: true, demo: true, ...info });
    }
    if (a === "openapi" && method === "GET") {
      return ok({ openapi: "3.0.3", info: { title: "Shubh API", version: "0.1.0" }, paths: { "/api/auth/login": { post: { summary: "Demo login" } }, "/api/weddings": { get: {}, post: {} }, "/api/public/{slug}/rsvp": { post: { summary: "Public RSVP" } } } });
    }
    if (a === "templates" && method === "GET" && !b) {
      const [themes, rows] = await Promise.all([loadThemes(), prisma.template.findMany()]);
      return ok({
        templates: themes.map(({ svg, ...theme }) => {
          void svg;
          const row = rows.find((item) => item.id === theme.id);
          return {
            id: theme.id,
            name: theme.name,
            tier: row?.tier ?? theme.tier,
            category: theme.category,
            tags: theme.tags,
            description: theme.description,
            active: row?.active ?? true,
            thumb: `/templates/${theme.id}/thumb.webp`,
          };
        }),
      });
    }
    if (a === "templates" && b && method === "GET") {
      const theme = await loadTheme(b);
      if (!theme) return fail("Template not found", 404);
      const row = await prisma.template.findUnique({ where: { id: b } });
      return ok({ template: theme, active: row?.active ?? true, tier: row?.tier ?? theme.tier });
    }
    if (a === "public" && b && c === "rsvp" && method === "POST") {
      if (!rateLimit(`rsvp:${clientIp(req)}:${b}`, 8, 60 * 60_000).ok) return fail("Too many replies from this network. Try again later.", 429);
      const wedding = await prisma.wedding.findUnique({ where: { slug: b } });
      if (!wedding) return fail("Invitation not found", 404);
      const input = rsvpSchema.parse(await readJson(req));
      const result = await submitPublicRsvp(wedding.id, input);
      return ok(result);
    }
    if (a === "public" && b && c === "gate" && method === "POST") {
      const body = z.object({ password: z.string().min(1).max(80) }).parse(await readJson(req));
      const wedding = await prisma.wedding.findUnique({ where: { slug: b } });
      if (!wedding || wedding.gatePassword !== body.password) return fail("Incorrect password.", 401);
      const jar = await cookies();
      jar.set(`shubh_gate_${b}`, gateToken(b), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
      return ok({ ok: true });
    }
    if (a === "public" && b && c === "ics" && method === "GET") {
      const url = new URL(req.url);
      const eventId = url.searchParams.get("event");
      const wedding = await prisma.wedding.findUnique({ where: { slug: b }, include: { events: { include: { venue: true } } } });
      if (!wedding || wedding.status !== "published") return fail("Not found", 404);
      const event = wedding.events.find((item) => item.id === eventId) ?? wedding.events[0];
      if (!event) return fail("No event", 404);
      const date = kolkataDateInput(event.date);
      const ics = icsForEvent({
        title: `${wedding.groomName} & ${wedding.brideName} · ${event.name}`,
        description: "Invitation from Shubh",
        location: `${event.venue?.name ?? ""}, ${event.venue?.address ?? ""}`,
        date,
        startTime: event.startTime,
        endTime: event.endTime,
      });
      return new NextResponse(ics, { headers: { "content-type": "text/calendar; charset=utf-8" } });
    }
    if (a === "media" && b && method === "GET") {
      const media = await prisma.media.findFirst({ where: { url: { endsWith: b } }, include: { wedding: true } });
      if (!media) return fail("Not found", 404);
      const user = await getSessionUser();
      const allowed = media.wedding.status === "published" || (user && (await weddingAccess(user, media.weddingId)));
      if (!allowed) return fail("Not found", 404);
      const file = await createFileStore().read(b);
      if (!file) return fail("Not found", 404);
      return new NextResponse(new Uint8Array(file.body), { headers: { "content-type": file.contentType, "cache-control": "private, max-age=3600" } });
    }

    const user = await requireUser();
    if (!user) return fail("Sign in required.", 401);

    if (a === "planner" && user.role !== "planner" && user.role !== "admin") return fail("Planner access only.", 403);
    if (a === "planner" && method === "GET" && !b) return ok({ home: await plannerHome(user) });
    if (a === "planner" && b === "tasks" && method === "POST") return ok({ id: await saveTask(user, await readJson(req)) });
    if (a === "planner" && b === "tasks" && c && method === "PATCH") return ok({ id: await saveTask(user, await readJson(req), c) });
    if (a === "planner" && b === "tasks" && c && method === "DELETE") {
      await deleteTask(user, c);
      return ok({ ok: true });
    }
    if (a === "planner" && b === "vendors" && method === "POST") return ok({ id: await saveVendor(user, await readJson(req)) });
    if (a === "planner" && b === "vendors" && c && method === "DELETE") {
      await deleteVendor(user, c);
      return ok({ ok: true });
    }
    if (a === "planner" && b === "budget" && method === "POST") return ok({ id: await saveBudget(user, await readJson(req)) });

    if (a === "admin" && user.role !== "admin") return fail("Admin only.", 403);
    if (a === "admin" && method === "GET" && !b) return ok({ stats: await adminOverview(), demo: true });
    if (a === "admin" && b === "users" && method === "GET") {
      const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } });
      return ok({ users, demo: true });
    }
    if (a === "admin" && b === "weddings" && method === "GET") {
      const weddings = await prisma.wedding.findMany({ select: { id: true, slug: true, groomName: true, brideName: true, status: true, plan: true, city: true }, orderBy: { createdAt: "desc" } });
      return ok({ weddings, demo: true });
    }
    if (a === "admin" && b === "orders" && method === "GET") {
      const status = new URL(req.url).searchParams.get("status");
      const orders = await prisma.order.findMany({ where: status ? { status } : {}, include: { payment: true, plan: true, user: { select: { email: true, name: true } } }, orderBy: { createdAt: "desc" } });
      return ok({
        orders: orders.map((order) => ({
          id: order.id,
          reference: order.reference,
          status: order.status,
          total: order.totalInr,
          plan: order.plan.name,
          simulated: order.simulated,
          verified: order.payment?.verified ?? false,
          by: order.user.email,
        })),
        demo: true,
      });
    }
    if (a === "admin" && b === "templates" && c && method === "PATCH") {
      const body = z.object({ active: z.boolean().optional(), tier: z.enum(["free", "premium"]).optional() }).parse(await readJson(req));
      await prisma.template.update({ where: { id: c }, data: body });
      clearThemeCache();
      await audit(user.id, "template", "template", c, body);
      return ok({ ok: true });
    }
    if (a === "admin" && b === "plans" && method === "GET") return ok({ plans: await prisma.plan.findMany() });

    if (a === "orders" && b && c === "settle" && method === "POST") {
      const body = z.object({ outcome: z.enum(["success", "failed", "pending"]) }).parse(await readJson(req));
      return ok(await settleSimulatedOrder(user, b, body.outcome));
    }

    if (a === "weddings" && method === "GET" && !b) {
      const weddings = await prisma.wedding.findMany({
        where: user.role === "admin" ? {} : { OR: [{ ownerId: user.id }, { collaborators: { some: { userId: user.id } } }, { workspace: { memberships: { some: { userId: user.id } } } }] },
        include: { _count: { select: { guests: true } } },
        orderBy: { weddingDate: "asc" },
      });
      return ok({
        weddings: weddings.map((item) => ({
          id: item.id,
          slug: item.slug,
          groomName: item.groomName,
          brideName: item.brideName,
          city: item.city,
          status: item.status,
          plan: item.plan,
          templateId: item.templateId,
          weddingDate: item.weddingDate.toISOString(),
          guests: item._count.guests,
        })),
      });
    }
    if (a === "weddings" && method === "POST" && !b) {
      const input = weddingInputSchema.parse(await readJson(req));
      const id = await createWedding(user, input);
      return ok({ id });
    }
    if (a === "weddings" && b && method === "GET" && !c) {
      const row = await getOwnedWedding(user, b, "viewer");
      if (!row) return fail("Not found", 404);
      return ok({
        wedding: {
          id: row.id,
          slug: row.slug,
          groomName: row.groomName,
          brideName: row.brideName,
          city: row.city,
          state: row.state,
          status: row.status,
          plan: row.plan,
          templateId: row.templateId,
          watermark: row.watermark,
          weddingDate: kolkataDateInput(row.weddingDate),
          level: row.level,
          revision: row.designRevision,
          design: parseDesign(row.designJson),
          events: row.events.map(toEventDTO),
          noindex: row.noindex,
          gatePassword: row.level === "owner" ? row.gatePassword : "",
        },
      });
    }
    if (a === "weddings" && b && method === "DELETE" && !c) {
      await deleteDraftWedding(user, b);
      return ok({ ok: true });
    }
    if (a === "weddings" && b && method === "PATCH" && !c) {
      const access = await weddingAccess(user, b);
      if (!access || !can(access.level, "editor")) return fail("Not allowed", 403);
      const body = z.object({ gatePassword: z.string().max(80).optional(), noindex: z.boolean().optional(), story: z.string().max(2000).optional() }).parse(await readJson(req));
      await prisma.wedding.update({
        where: { id: b },
        data: {
          gatePassword: body.gatePassword !== undefined ? sanitizeText(body.gatePassword, 80) : undefined,
          noindex: body.noindex,
          story: body.story !== undefined ? sanitizeText(body.story, 2000) : undefined,
        },
      });
      return ok({ ok: true });
    }
    if (a === "weddings" && b && c === "events" && method === "PUT") {
      const access = await weddingAccess(user, b);
      if (!access || !can(access.level, "editor")) return fail("Not allowed", 403);
      const body = z.object({ events: z.array(eventInputSchema).min(1) }).parse(await readJson(req));
      await syncEvents(b, body.events);
      return ok({ ok: true });
    }
    if (a === "weddings" && b && c === "design" && method === "PUT") {
      const body = z.object({ design: z.unknown(), revision: z.number().int() }).parse(await readJson(req));
      const saved = await saveDesign(user, b, body.design, body.revision);
      return ok(saved);
    }
    if (a === "weddings" && b && c === "versions" && method === "GET") {
      const access = await weddingAccess(user, b);
      if (!access) return fail("Not found", 404);
      const versions = await listVersions(b);
      return ok({ versions });
    }
    if (a === "weddings" && b && c === "versions" && method === "POST" && !d) {
      const body = z.object({ label: z.string().optional() }).parse(await readJson(req));
      const version = await snapshotDesign(user, b, body.label || "Snapshot");
      return ok({ id: version.id });
    }
    if (a === "weddings" && b && c === "versions" && d && method === "POST") {
      const restored = await restoreVersion(user, b, d);
      return ok(restored);
    }
    if (a === "weddings" && b && c === "publish" && method === "POST") {
      const body = await readJson(req);
      if (body.versionId) {
        await rollbackPublished(user, b, String(body.versionId));
        return ok({ ok: true });
      }
      const slug = await publishWedding(user, b);
      return ok({ slug });
    }
    if (a === "weddings" && b && c === "publish" && method === "DELETE") {
      await unpublishWedding(user, b);
      return ok({ ok: true });
    }
    if (a === "weddings" && b && c === "stats" && method === "GET") {
      const access = await weddingAccess(user, b);
      if (!access) return fail("Not found", 404);
      return ok(await rsvpSummary(b));
    }
    if (a === "weddings" && b && c === "orders" && method === "POST") {
      const body = z.object({ planId: z.string() }).parse(await readJson(req));
      return ok(await createSimulatedOrder(user, { planId: body.planId, weddingId: b }));
    }
    if (a === "weddings" && b && c === "guests" && method === "GET" && !d) return ok({ guests: await listGuests(user, b) });
    if (a === "weddings" && b && c === "guests" && method === "POST" && !d) return ok({ id: await createGuest(user, b, guestSchema.parse(await readJson(req))) });
    if (a === "weddings" && b && c === "guests" && d === "import" && method === "POST") {
      const body = z.object({ csv: z.string(), mapping: z.record(z.string(), z.string()) }).parse(await readJson(req));
      return ok(await importGuests(user, b, body.csv, body.mapping));
    }
    if (a === "weddings" && b && c === "guests" && d === "export" && method === "GET") {
      const csv = await exportGuestsCsv(user, b);
      return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=guests.csv" } });
    }
    if (a === "weddings" && b && c === "guests" && d === "purge" && method === "DELETE") {
      const count = await deleteAllGuests(user, b);
      return ok({ count });
    }
    if (a === "weddings" && b && c === "guests" && d && method === "PATCH") return ok({ id: await updateGuest(user, b, d, guestSchema.parse(await readJson(req))) });
    if (a === "weddings" && b && c === "guests" && d && method === "DELETE") {
      await deleteGuest(user, b, d);
      return ok({ ok: true });
    }
    if (a === "weddings" && b && c === "presence" && method === "POST") {
      const access = await weddingAccess(user, b);
      if (!access) return fail("Not found", 404);
      beat({ userId: user.id, name: user.name, weddingId: b });
      return ok({ others: readers(b, user.id) });
    }
    if (a === "weddings" && b && c === "comments" && method === "GET") {
      const access = await weddingAccess(user, b);
      if (!access || !can(access.level, "commenter")) return fail("Not found", 404);
      const comments = await prisma.comment.findMany({ where: { weddingId: b }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
      return ok({ comments: comments.map((item) => ({ id: item.id, body: item.body, sectionId: item.sectionId, by: item.user.name, createdAt: item.createdAt })) });
    }
    if (a === "weddings" && b && c === "comments" && method === "POST") {
      const access = await weddingAccess(user, b);
      if (!access || !can(access.level, "commenter")) return fail("Not allowed", 403);
      const body = z.object({ body: z.string().min(1).max(500), sectionId: z.string().optional() }).parse(await readJson(req));
      const comment = await prisma.comment.create({ data: { weddingId: b, userId: user.id, body: sanitizeText(body.body, 500), sectionId: body.sectionId || "" } });
      return ok({ id: comment.id });
    }
    if (a === "weddings" && b && c === "media" && method === "POST") {
      const access = await weddingAccess(user, b);
      if (!access || !can(access.level, "editor")) return fail("Not allowed", 403);
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return fail("Choose an image.");
      if (file.size > 8_000_000) return fail("Image must be under 8MB.");
      const input = Buffer.from(await file.arrayBuffer());
      if (!sniffImage(input)) return fail("Upload a JPEG, PNG or WebP image.");
      const wedding = await prisma.wedding.findUnique({ where: { id: b }, include: { _count: { select: { media: true } } } });
      if (!wedding) return fail("Not found", 404);
      const limit = wedding.plan === "premium" ? 50 : 6;
      if (wedding._count.media >= limit) return fail(`This plan allows ${limit} photos.`);
      const encoded = await sharp(input).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      const key = `${b}-${Date.now()}.webp`;
      const stored = await createFileStore().put(key, encoded, "image/webp");
      const media = await prisma.media.create({
        data: {
          weddingId: b,
          kind: sanitizeText(String(form.get("kind") || "gallery"), 20) || "gallery",
          url: stored.url,
          alt: sanitizeText(String(form.get("alt") || "Wedding photo"), 160),
          mask: "rounded",
        },
      });
      return ok({ media: { id: media.id, url: media.url, alt: media.alt, focalX: media.focalX, focalY: media.focalY, mask: media.mask, kind: media.kind } });
    }
    if (a === "weddings" && b && c === "media" && d && method === "PATCH") {
      const access = await weddingAccess(user, b);
      if (!access || !can(access.level, "editor")) return fail("Not allowed", 403);
      const body = z.object({ alt: z.string().max(160).optional(), focalX: z.number().min(0).max(1).optional(), focalY: z.number().min(0).max(1).optional(), mask: z.enum(["rounded", "circle", "arch"]).optional(), rotation: z.number().int().optional() }).parse(await readJson(req));
      await prisma.media.updateMany({ where: { id: d, weddingId: b }, data: body });
      return ok({ ok: true });
    }
    return fail("Not found", 404);
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message || "Invalid input", 422);
    return errorResponse(error);
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return handle(req, path);
}
export async function POST(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return handle(req, path);
}
export async function PUT(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return handle(req, path);
}
export async function PATCH(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return handle(req, path);
}
export async function DELETE(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  return handle(req, path);
}
