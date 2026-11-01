import { prisma } from "@/lib/db";
import { sanitizeText } from "@/lib/sanitize";
import type { SessionUser } from "@/lib/auth";

const RANK: Record<string, number> = { viewer: 1, commenter: 2, editor: 3, owner: 4 };

export async function audit(
  actorId: string | null | undefined,
  action: string,
  entityType: string,
  entityId: string,
  meta: Record<string, unknown> = {},
) {
  await prisma.auditLog.create({
    data: {
      actorId: actorId || null,
      action,
      entityType,
      entityId,
      metaJson: JSON.stringify(meta),
    },
  });
}

export async function weddingAccess(user: SessionUser, weddingId: string) {
  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    include: {
      collaborators: true,
      workspace: { include: { memberships: true } },
    },
  });
  if (!wedding) return null;
  if (user.role === "admin" || wedding.ownerId === user.id) return { wedding, level: "owner" };
  const collab = wedding.collaborators.find((c) => c.userId === user.id);
  if (collab) return { wedding, level: collab.role };
  const member = wedding.workspace?.memberships.find((m) => m.userId === user.id);
  if (member) {
    const level = member.role === "viewer" ? "viewer" : member.role === "commenter" ? "commenter" : "editor";
    return { wedding, level };
  }
  return null;
}

export function can(level: string, need: "viewer" | "commenter" | "editor" | "owner") {
  return (RANK[level] ?? 0) >= RANK[need];
}
