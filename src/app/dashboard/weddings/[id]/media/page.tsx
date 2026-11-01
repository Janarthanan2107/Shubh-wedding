import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOwnedWedding } from "@/services/weddings";
import { WeddingNav } from "@/components/wedding-nav";

export const dynamic = "force-dynamic";

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");
  const wedding = await getOwnedWedding(user, id, "viewer");
  if (!wedding) notFound();
  return (
    <div>
      <WeddingNav id={id} />
      <h1 className="font-serif text-4xl text-maroon">Media</h1>
      <p className="mt-2 text-sm">Upload, crop focus, rotation and arch frames live in the editor’s image tools.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {wedding.media.map((item) => (
          <figure key={item.id}>
            <img src={item.url} alt={item.alt} className={item.mask === "arch" ? "mask-arch h-48 w-full" : "h-48 w-full rounded-xl object-cover"} style={{ objectPosition: `${item.focalX * 100}% ${item.focalY * 100}%` }} />
            <figcaption className="mt-1 text-xs">{item.alt}</figcaption>
          </figure>
        ))}
      </div>
      {wedding.media.length === 0 ? <p className="mt-4 text-sm">No photos yet.</p> : null}
      <Link href={`/dashboard/weddings/${id}/editor`} className="mt-4 inline-block text-sm text-maroon">Open editor</Link>
    </div>
  );
}
