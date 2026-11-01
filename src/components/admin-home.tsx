import { prisma } from "@/lib/db";
import { adminOverview } from "@/services/planner";
import { Card } from "@/components/ui";
import { DeleteDraftButton } from "@/components/delete-draft";
import { AdminTemplates } from "@/components/admin-templates";
import { AdminOrders } from "@/components/admin-orders";
import { formatInr } from "@/lib/utils";
import { humanize, planLabel, statusLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export async function AdminHome({ section = "stats" }: { section?: "stats" | "users" | "weddings" | "templates" | "plans" | "orders" }) {
  const stats = await adminOverview();
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-gold">Demo admin · counts come from the database</p>
      <h1 className="font-serif text-4xl text-maroon">{section}</h1>
      {section === "stats" ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Object.entries({ Users: stats.users, Weddings: stats.weddings, Published: stats.published, Orders: stats.orders, Templates: stats.templates, Guests: stats.guests, "Payments ok": stats.payments.success, "Payments failed": stats.payments.failed, "Payments pending": stats.payments.pending }).map(([label, value]) => (
            <Card key={label}><p className="text-xs uppercase text-muted">{label}</p><p className="font-serif text-3xl">{value}</p></Card>
          ))}
        </div>
      ) : null}
      {section === "users" ? <UserTable /> : null}
      {section === "weddings" ? <WeddingTable /> : null}
      {section === "templates" ? <AdminTemplates /> : null}
      {section === "plans" ? <PlanTable /> : null}
      {section === "orders" ? <AdminOrders /> : null}
    </div>
  );
}

async function UserTable() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div className="mt-4 overflow-auto rounded-2xl border border-line bg-surface">
      <table className="w-full text-sm"><tbody>{users.map((user) => <tr key={user.id} className="border-t"><td className="p-3">{user.name}</td><td>{user.email}</td><td>{humanize(user.role)}</td></tr>)}</tbody></table>
    </div>
  );
}

async function WeddingTable() {
  const weddings = await prisma.wedding.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="mt-4 grid gap-2">
      {weddings.map((wedding) => (
        <Card key={wedding.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>{wedding.groomName} & {wedding.brideName} · {wedding.slug} · {statusLabel(wedding.status)} · {planLabel(wedding.plan)}</p>
            {wedding.status === "draft" ? <DeleteDraftButton weddingId={wedding.id} label={`${wedding.groomName} & ${wedding.brideName}`} /> : null}
          </div>
        </Card>
      ))}
    </div>
  );
}

async function PlanTable() {
  const plans = await prisma.plan.findMany();
  return (
    <div className="mt-4 grid gap-2">
      {plans.map((plan) => <Card key={plan.id}><h2 className="font-serif text-2xl">{plan.name}</h2><p className="text-sm">{plan.audience} · {formatInr(plan.priceInr)} · {plan.blurb}</p></Card>)}
    </div>
  );
}
