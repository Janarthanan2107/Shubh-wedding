import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createDefaultDesign } from "@/lib/design";
import { ENTITLEMENTS } from "@/lib/domain";
import { guestToken } from "@/lib/utils";

const DEMO_PASSWORD = "Demo@123";

async function wipe() {
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.task.deleteMany();
  await prisma.rsvp.deleteMany();
  await prisma.guestEvent.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.media.deleteMany();
  await prisma.designVersion.deleteMany();
  await prisma.event.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.weddingCollaborator.deleteMany();
  await prisma.wedding.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.template.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();
}

async function loadThemes() {
  const root = path.join(process.cwd(), "public", "templates");
  const dirs = await fs.readdir(root);
  const themes = [];
  for (const dir of dirs) {
    const file = path.join(root, dir, "theme.json");
    try {
      const json = JSON.parse(await fs.readFile(file, "utf8"));
      themes.push(json);
    } catch {
      continue;
    }
  }
  if (themes.length < 6) throw new Error("Template assets missing. Run npm run assets:generate first.");
  return themes;
}

function noon(date: string) {
  return new Date(`${date}T12:00:00+05:30`);
}

export async function resetDemo() {
  await wipe();
  const passwordHash = hashPassword(DEMO_PASSWORD);
  const [couple, planner, admin] = await Promise.all([
    prisma.user.create({ data: { email: "couple@demo.com", name: "Raja Iyer", passwordHash, role: "couple", phone: "+919840011122" } }),
    prisma.user.create({ data: { email: "planner@demo.com", name: "Meera Planner", passwordHash, role: "planner", phone: "+919840011133" } }),
    prisma.user.create({ data: { email: "admin@demo.com", name: "Shubh Admin", passwordHash, role: "admin", phone: "+919840011144" } }),
  ]);
  const themes = await loadThemes();
  for (const theme of themes) {
    await prisma.template.create({
      data: {
        id: theme.id,
        name: theme.name,
        tier: theme.tier,
        active: true,
        category: theme.category,
        tags: JSON.stringify(theme.tags),
        descriptionEn: theme.description.en,
        descriptionTa: theme.description.ta,
        themeJson: JSON.stringify(theme),
      },
    });
  }
  await prisma.plan.createMany({
    data: [
      { id: "free", name: "Free", audience: "couple", priceInr: 0, limitsJson: JSON.stringify(ENTITLEMENTS.free), blurb: "One published site, free templates, basic RSVP." },
      { id: "premium", name: "Premium", audience: "couple", priceInr: 999, limitsJson: JSON.stringify(ENTITLEMENTS.premium), blurb: "Premium templates, exports, and a larger gallery. Simulated checkout." },
      { id: "planner-starter", name: "Planner Starter", audience: "planner", priceInr: 1499, limitsJson: JSON.stringify({ maxWeddings: 3 }), blurb: "Demo monthly tier for up to 3 weddings." },
      { id: "planner-studio", name: "Planner Studio", audience: "planner", priceInr: 3999, limitsJson: JSON.stringify({ maxWeddings: 15 }), blurb: "Demo monthly tier for growing studios." },
    ],
  });
  const workspace = await prisma.workspace.create({
    data: { name: "Demo Atelier", ownerId: planner.id, plan: "planner-starter" },
  });
  await prisma.membership.createMany({
    data: [
      { userId: planner.id, workspaceId: workspace.id, role: "owner" },
      { userId: admin.id, workspaceId: workspace.id, role: "viewer" },
    ],
  });

  const design = createDefaultDesign({
    templateId: "royal-maroon-gold",
    paletteId: "classic",
    motifPack: "hindu",
    groom: "Raja",
    bride: "Rani",
    groomTa: "ராஜா",
    brideTa: "ராணி",
    groomHi: "राजा",
    brideHi: "रानी",
    dateLabel: "20 December 2026",
    city: "Chennai, Tamil Nadu",
    welcome: "Our families are delighted to invite you to a few days of music, food and promises in Chennai.",
  });
  const designJson = JSON.stringify(design);
  const raja = await prisma.wedding.create({
    data: {
      slug: "raja-weds-rani",
      ownerId: couple.id,
      workspaceId: workspace.id,
      groomName: "Raja",
      brideName: "Rani",
      groomNameTa: "ராஜா",
      brideNameTa: "ராணி",
      groomNameHi: "राजा",
      brideNameHi: "रानी",
      tagline: "A Chennai wedding",
      story: design.sections.find((s) => s.type === "welcome")?.content ? "Our families are delighted to invite you." : "",
      weddingDate: noon("2026-12-20"),
      city: "Chennai",
      state: "Tamil Nadu",
      language: "en",
      templateId: "royal-maroon-gold",
      paletteId: "classic",
      motifPack: "hindu",
      plan: "free",
      status: "published",
      publishedAt: new Date(),
      designJson,
      publishedDesignJson: designJson,
      watermark: true,
      invitation: { create: { slug: "raja-weds-rani", status: "published" } },
    },
  });
  const venue = await prisma.venue.create({
    data: {
      weddingId: raja.id,
      name: "Demo Mahal",
      address: "12 Cathedral Road",
      city: "Chennai",
      state: "Tamil Nadu",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Cathedral%20Road%20Chennai",
    },
  });
  const eventDefs = [
    { name: "Mehendi", type: "Mehendi", date: "2026-12-18", startTime: "16:00", endTime: "19:00", dressCode: "Yellow and green" },
    { name: "Haldi", type: "Haldi", date: "2026-12-19", startTime: "09:00", endTime: "11:00", dressCode: "Yellow" },
    { name: "Muhurtham", type: "Wedding", date: "2026-12-20", startTime: "09:30", endTime: "11:30", dressCode: "Silk", muhurat: "09:12–10:05", tithi: "Demo tithi", nakshatra: "Demo nakshatra" },
    { name: "Reception", type: "Reception", date: "2026-12-20", startTime: "19:00", endTime: "22:00", dressCode: "Formal" },
  ];
  const events = [];
  for (let i = 0; i < eventDefs.length; i += 1) {
    const item = eventDefs[i];
    events.push(
      await prisma.event.create({
        data: {
          weddingId: raja.id,
          venueId: venue.id,
          name: item.name,
          type: item.type,
          date: noon(item.date),
          startTime: item.startTime,
          endTime: item.endTime,
          dressCode: item.dressCode,
          muhurat: item.muhurat ?? "",
          tithi: item.tithi ?? "",
          nakshatra: item.nakshatra ?? "",
          sortOrder: i,
        },
      }),
    );
  }
  await prisma.weddingCollaborator.create({ data: { weddingId: raja.id, userId: planner.id, role: "editor" } });
  await prisma.comment.create({
    data: { weddingId: raja.id, userId: planner.id, sectionId: "hero", body: "Demo comment: the gold arch looks right for the evening print." },
  });
  const media = [
    ["couple", "/demo/groom.webp", "Illustrated portrait of Raja, fictional"],
    ["couple", "/demo/bride.webp", "Illustrated portrait of Rani, fictional"],
    ["gallery", "/demo/gallery-1.webp", "Illustrated turmeric still life"],
    ["gallery", "/demo/gallery-2.webp", "Illustrated sage still life"],
    ["gallery", "/demo/gallery-3.webp", "Illustrated floral still life"],
  ] as const;
  for (let i = 0; i < media.length; i += 1) {
    await prisma.media.create({
      data: { weddingId: raja.id, kind: media[i][0], url: media[i][1], alt: media[i][2], mask: i < 2 ? "arch" : "rounded", sortOrder: i },
    });
  }

  const first = ["Aarav", "Ananya", "Divya", "Karthik", "Meera", "Arjun", "Lakshmi", "Vikram", "Harini", "Rahul", "Sneha", "Arun", "Kavya", "Nikhil", "Deepa", "Suresh", "Revathi", "Hari", "Nithya", "Gopal"];
  const last = ["Iyer", "Subramanian", "Krishnan", "Natarajan", "Reddy", "Sharma", "Menon", "Pillai", "Joshi", "Das"];
  const sides = ["bride", "groom", "family", "friends", "work"];
  const diets = ["veg", "non-veg", "jain"];
  for (let i = 0; i < 120; i += 1) {
    const name = `${first[i % first.length]} ${last[i % last.length]} ${i >= 20 ? i : ""}`.trim();
    let status = "pending";
    let headcount = 0;
    if (i < 65) {
      status = "attending";
      headcount = i % 3 === 0 ? 2 : 1;
    } else if (i < 80) status = "not_attending";
    else if (i < 90) {
      status = "maybe";
      headcount = 1;
    }
    const invited = [events[2].id];
    if (i % 2 === 0) invited.push(events[3].id);
    if (i % 3 === 0) invited.push(events[0].id);
    if (i % 4 === 0) invited.push(events[1].id);
    const guest = await prisma.guest.create({
      data: {
        weddingId: raja.id,
        name,
        phone: `+9198${String(10000000 + i).slice(0, 8)}`,
        email: i % 5 === 0 ? `guest${i}@example.com` : "",
        side: sides[i % sides.length],
        dietary: diets[i % diets.length],
        plusOnes: i % 7 === 0 ? 1 : 0,
        token: guestToken(),
        events: { create: invited.map((eventId) => ({ eventId })) },
        rsvp: { create: { weddingId: raja.id, status, headcount, dietary: diets[i % diets.length] } },
      },
    });
    void guest;
  }

  async function sideWedding(slug: string, groom: string, bride: string, templateId: string, date: string, plan: string) {
    const local = createDefaultDesign({
      templateId,
      motifPack: "neutral",
      groom,
      bride,
      dateLabel: date,
      city: "Chennai, Tamil Nadu",
      welcome: "A fictional demo wedding used by the planner workspace.",
    });
    const row = await prisma.wedding.create({
      data: {
        slug,
        ownerId: planner.id,
        workspaceId: workspace.id,
        groomName: groom,
        brideName: bride,
        weddingDate: noon(date.slice(0, 10) === date ? date : "2026-11-02"),
        city: "Chennai",
        state: "Tamil Nadu",
        templateId,
        motifPack: "neutral",
        plan,
        status: "draft",
        watermark: plan !== "premium",
        designJson: JSON.stringify(local),
        invitation: { create: { slug, status: "draft" } },
      },
    });
    const v = await prisma.venue.create({
      data: { weddingId: row.id, name: "Demo Hall", address: "Anna Salai", city: "Chennai", state: "Tamil Nadu", mapUrl: "https://www.google.com/maps/search/?api=1&query=Anna%20Salai%20Chennai" },
    });
    await prisma.event.create({
      data: { weddingId: row.id, venueId: v.id, name: "Wedding", type: "Wedding", date: row.weddingDate, startTime: "10:00", endTime: "12:00", sortOrder: 0 },
    });
    await prisma.event.create({
      data: { weddingId: row.id, venueId: v.id, name: "Reception", type: "Reception", date: row.weddingDate, startTime: "19:00", endTime: "22:00", sortOrder: 1 },
    });
    return row;
  }

  const ananya = await sideWedding("ananya-weds-karthik", "Karthik", "Ananya", "floral-pastel", "2026-11-08", "free");
  const meera = await sideWedding("meera-weds-arjun", "Arjun", "Meera", "modern-sage", "2027-01-16", "premium");

  const failed = await prisma.order.create({
    data: {
      userId: couple.id,
      weddingId: raja.id,
      planId: "premium",
      amountInr: 999,
      gstInr: 179.82,
      totalInr: 1178.82,
      status: "failed",
      reference: "SHB-DEMO-FAIL",
      simulated: true,
      payment: { create: { status: "failed", gateway: "mock-razorpay", reference: "SHB-DEMO-FAIL", verified: false, rawJson: "{\"simulated\":true}" } },
    },
  });
  const pending = await prisma.order.create({
    data: {
      userId: planner.id,
      weddingId: ananya.id,
      planId: "premium",
      amountInr: 999,
      gstInr: 179.82,
      totalInr: 1178.82,
      status: "pending",
      reference: "SHB-DEMO-PEND",
      simulated: true,
      payment: { create: { status: "pending", gateway: "mock-razorpay", reference: "SHB-DEMO-PEND", verified: false, rawJson: "{\"simulated\":true}" } },
    },
  });
  const success = await prisma.order.create({
    data: {
      userId: planner.id,
      weddingId: meera.id,
      planId: "premium",
      amountInr: 999,
      gstInr: 179.82,
      totalInr: 1178.82,
      status: "success",
      reference: "SHB-DEMO-OK",
      simulated: true,
      payment: { create: { status: "success", gateway: "mock-razorpay", reference: "SHB-DEMO-OK", verified: true, verifiedAt: new Date(), rawJson: "{\"simulated\":true}" } },
    },
  });
  void failed;
  void pending;
  void success;

  const florals = await prisma.vendor.create({ data: { workspaceId: workspace.id, name: "Demo Florals", category: "Flowers", phone: "+919800000001", city: "Chennai", notes: "Fictional vendor" } });
  const catering = await prisma.vendor.create({ data: { workspaceId: workspace.id, name: "Demo Catering", category: "Food", phone: "+919800000002", city: "Chennai", notes: "Fictional vendor" } });
  await prisma.vendor.create({ data: { workspaceId: workspace.id, name: "Demo Music", category: "Music", phone: "+919800000003", city: "Chennai", notes: "Fictional vendor" } });
  await prisma.booking.create({ data: { weddingId: raja.id, vendorId: florals.id, title: "Muhurtham garlands", status: "confirmed", amountInr: 45000, eventDate: noon("2026-12-20") } });
  await prisma.booking.create({ data: { weddingId: raja.id, vendorId: catering.id, title: "Reception dinner", status: "pending", amountInr: 180000, eventDate: noon("2026-12-20") } });
  await prisma.task.createMany({
    data: [
      { workspaceId: workspace.id, weddingId: raja.id, title: "Confirm Demo Mahal menu", status: "doing", priority: "high", dueDate: noon("2026-11-20"), assigneeId: planner.id },
      { workspaceId: workspace.id, weddingId: raja.id, title: "Print invitation QR cards", status: "todo", priority: "medium", dueDate: noon("2026-12-01"), assigneeId: planner.id },
      { workspaceId: workspace.id, weddingId: ananya.id, title: "Collect pending RSVPs", status: "todo", priority: "high", dueDate: noon("2026-10-28") },
    ],
  });
  await prisma.budgetItem.createMany({
    data: [
      { weddingId: raja.id, label: "Venue", category: "Venue", estimate: 250000, paid: 100000, status: "partial" },
      { weddingId: raja.id, label: "Catering", category: "Food", estimate: 180000, paid: 0, status: "pending" },
      { weddingId: raja.id, label: "Photography", category: "Photo", estimate: 90000, paid: 90000, status: "paid" },
    ],
  });
  await prisma.auditLog.create({
    data: { actorId: couple.id, action: "publish", entityType: "wedding", entityId: raja.id, metaJson: "{\"seed\":true}" },
  });
  return { couple: couple.email, planner: planner.email, admin: admin.email };
}

const isDirect = process.argv[1]?.replace(/\\/g, "/").includes("seed-demo");
if (isDirect) {
  resetDemo()
    .then((info) => {
      console.log("Demo data ready", info);
      return prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
