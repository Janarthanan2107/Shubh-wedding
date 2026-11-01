import { z } from "zod";
import { prisma } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import type { SessionUser } from "@/lib/auth";
import { PLANNER_LIMITS } from "@/lib/domain";

async function workspaceFor(user: SessionUser) {
  if (user.role === "admin") {
    const first = await prisma.workspace.findFirst();
    return first;
  }
  const membership = await prisma.membership.findFirst({ where: { userId: user.id }, include: { workspace: true } });
  return membership?.workspace ?? null;
}

export async function plannerHome(user: SessionUser) {
  const workspace = await workspaceFor(user);
  if (!workspace) return null;
  const weddings = await prisma.wedding.findMany({
    where: { workspaceId: workspace.id },
    include: { events: true, _count: { select: { guests: true, rsvps: true } }, owner: true },
    orderBy: { weddingDate: "asc" },
  });
  const tasks = await prisma.task.findMany({ where: { workspaceId: workspace.id }, orderBy: { dueDate: "asc" } });
  const vendors = await prisma.vendor.findMany({ where: { workspaceId: workspace.id }, include: { bookings: true } });
  const budget = await prisma.budgetItem.findMany({ where: { wedding: { workspaceId: workspace.id } } });
  const team = await prisma.membership.findMany({ where: { workspaceId: workspace.id }, include: { user: true } });
  return {
    workspace: { id: workspace.id, name: workspace.name, plan: workspace.plan, limit: PLANNER_LIMITS[workspace.plan] ?? 3 },
    weddings: weddings.map((w) => ({
      id: w.id,
      slug: w.slug,
      groomName: w.groomName,
      brideName: w.brideName,
      city: w.city,
      state: w.state,
      status: w.status,
      weddingDate: w.weddingDate.toISOString(),
      guests: w._count.guests,
      client: w.owner.name,
      canDelete: w.status === "draft" && w.ownerId === user.id,
      events: w.events.length,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? "",
      weddingId: t.weddingId,
    })),
    vendors: vendors.map((v) => ({
      id: v.id,
      name: v.name,
      category: v.category,
      phone: v.phone,
      city: v.city,
      notes: v.notes,
      bookings: v.bookings.length,
    })),
    budget: budget.map((b) => ({
      id: b.id,
      weddingId: b.weddingId,
      label: b.label,
      category: b.category,
      estimate: b.estimate,
      paid: b.paid,
      status: b.status,
    })),
    team: team.map((m) => ({ id: m.id, name: m.user.name, email: m.user.email, role: m.role })),
  };
}

const taskSchema = z.object({
  title: z.string().min(1).max(140),
  status: z.enum(["todo", "doing", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional().default(""),
  weddingId: z.string().optional().default(""),
});

export async function saveTask(user: SessionUser, input: unknown, id?: string) {
  const workspace = await workspaceFor(user);
  if (!workspace) throw new Error("No planner workspace.");
  const data = taskSchema.parse(input);
  const payload = {
    workspaceId: workspace.id,
    title: sanitizeText(data.title, 140),
    status: data.status,
    priority: data.priority,
    dueDate: data.dueDate ? new Date(`${data.dueDate}T12:00:00+05:30`) : null,
    weddingId: data.weddingId || null,
  };
  if (id) {
    const existing = await prisma.task.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!existing) throw new Error("Task not found.");
    await prisma.task.update({ where: { id }, data: payload });
    return id;
  }
  const count = await prisma.wedding.count({ where: { workspaceId: workspace.id } });
  void count;
  const created = await prisma.task.create({ data: payload });
  return created.id;
}

export async function deleteTask(user: SessionUser, id: string) {
  const workspace = await workspaceFor(user);
  if (!workspace) throw new Error("No planner workspace.");
  await prisma.task.deleteMany({ where: { id, workspaceId: workspace.id } });
}

const vendorSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  phone: z.string().max(20).optional().default(""),
  city: z.string().max(80).optional().default(""),
  notes: z.string().max(400).optional().default(""),
});

export async function saveVendor(user: SessionUser, input: unknown, id?: string) {
  const workspace = await workspaceFor(user);
  if (!workspace) throw new Error("No planner workspace.");
  const data = vendorSchema.parse(input);
  const payload = {
    name: sanitizeText(data.name, 120),
    category: sanitizeText(data.category, 60),
    phone: sanitizeText(data.phone, 20),
    city: sanitizeText(data.city, 80),
    notes: sanitizeText(data.notes, 400),
  };
  if (id) {
    await prisma.vendor.updateMany({ where: { id, workspaceId: workspace.id }, data: payload });
    return id;
  }
  const created = await prisma.vendor.create({ data: { ...payload, workspaceId: workspace.id } });
  return created.id;
}

export async function deleteVendor(user: SessionUser, id: string) {
  const workspace = await workspaceFor(user);
  if (!workspace) throw new Error("No planner workspace.");
  await prisma.vendor.deleteMany({ where: { id, workspaceId: workspace.id } });
}

const budgetSchema = z.object({
  weddingId: z.string().min(1),
  label: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  estimate: z.number().min(0),
  paid: z.number().min(0),
  status: z.enum(["pending", "partial", "paid"]).default("pending"),
});

export async function saveBudget(user: SessionUser, input: unknown, id?: string) {
  const workspace = await workspaceFor(user);
  if (!workspace) throw new Error("No planner workspace.");
  const data = budgetSchema.parse(input);
  const wedding = await prisma.wedding.findFirst({ where: { id: data.weddingId, workspaceId: workspace.id } });
  if (!wedding) throw new Error("Wedding not in this workspace.");
  const payload = {
    weddingId: wedding.id,
    label: sanitizeText(data.label, 120),
    category: sanitizeText(data.category, 60),
    estimate: data.estimate,
    paid: data.paid,
    status: data.status,
  };
  if (id) {
    await prisma.budgetItem.updateMany({ where: { id, weddingId: wedding.id }, data: payload });
    return id;
  }
  const created = await prisma.budgetItem.create({ data: payload });
  return created.id;
}

export async function adminOverview() {
  const [users, weddings, orders, templates, guests, payments] = await Promise.all([
    prisma.user.count(),
    prisma.wedding.count(),
    prisma.order.count(),
    prisma.template.count(),
    prisma.guest.count(),
    prisma.payment.findMany({ select: { status: true } }),
  ]);
  const published = await prisma.wedding.count({ where: { status: "published" } });
  return {
    users,
    weddings,
    published,
    orders,
    templates,
    guests,
    payments: {
      success: payments.filter((p) => p.status === "success").length,
      failed: payments.filter((p) => p.status === "failed").length,
      pending: payments.filter((p) => p.status === "pending").length,
    },
  };
}
