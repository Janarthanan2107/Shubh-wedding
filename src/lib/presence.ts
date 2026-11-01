type Presence = { userId: string; name: string; weddingId: string; at: number };

const presence = new Map<string, Presence>();

export function beat(entry: Omit<Presence, "at">) {
  presence.set(`${entry.weddingId}:${entry.userId}`, { ...entry, at: Date.now() });
  const cutoff = Date.now() - 20_000;
  for (const [key, value] of presence) {
    if (value.at < cutoff) presence.delete(key);
  }
}

export function readers(weddingId: string, exceptUserId?: string) {
  const cutoff = Date.now() - 20_000;
  return [...presence.values()].filter(
    (p) => p.weddingId === weddingId && p.at >= cutoff && p.userId !== exceptUserId,
  );
}
