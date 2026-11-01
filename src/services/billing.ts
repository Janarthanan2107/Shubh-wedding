import { prisma } from "@/lib/db";
import { getPaymentProvider, orderReference, paymentUnlocksPremium, quoteInr } from "@/lib/domain";
import type { SessionUser } from "@/lib/auth";
import { audit, can, weddingAccess } from "@/services/access";
import type { PaymentOutcome } from "@/lib/domain";

const PRICES: Record<string, number> = {
  premium: 999,
  "planner-starter": 1499,
  "planner-studio": 3999,
};

export async function createSimulatedOrder(user: SessionUser, input: { planId: string; weddingId?: string }) {
  const price = PRICES[input.planId];
  if (!price) throw new Error("Unknown paid plan.");
  if (input.weddingId) {
    const access = await weddingAccess(user, input.weddingId);
    if (!access || !can(access.level, "owner")) throw new Error("Only the couple can pay for this wedding.");
  }
  const quote = quoteInr(price);
  const reference = orderReference();
  const provider = getPaymentProvider();
  await provider.createOrder({ reference, amountInr: quote.total, currency: "INR" });
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      weddingId: input.weddingId,
      planId: input.planId,
      amountInr: quote.subtotal,
      gstInr: quote.gst,
      totalInr: quote.total,
      status: "created",
      reference,
      simulated: true,
    },
  });
  return {
    orderId: order.id,
    reference,
    simulated: true,
    quote,
    planId: input.planId,
  };
}

export async function settleSimulatedOrder(user: SessionUser, orderId: string, outcome: PaymentOutcome) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== user.id) throw new Error("Order not found.");
  if (order.status === "success") throw new Error("This simulated payment is already complete.");
  const provider = getPaymentProvider();
  const result = await provider.verify({ reference: order.reference, outcome });
  const unlock = paymentUnlocksPremium(result.status, result.verified);
  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: {
      status: result.status,
      verified: result.verified,
      verifiedAt: result.verified ? new Date() : null,
      reference: order.reference,
      gateway: result.gateway,
      rawJson: JSON.stringify({ simulated: true, outcome }),
    },
    create: {
      orderId: order.id,
      status: result.status,
      verified: result.verified,
      verifiedAt: result.verified ? new Date() : null,
      reference: order.reference,
      gateway: result.gateway,
      rawJson: JSON.stringify({ simulated: true, outcome }),
    },
  });
  await prisma.order.update({ where: { id: order.id }, data: { status: result.status } });
  if (unlock && order.planId === "premium" && order.weddingId) {
    await prisma.wedding.update({
      where: { id: order.weddingId },
      data: { plan: "premium", watermark: false },
    });
  }
  if (unlock && order.planId.startsWith("planner")) {
    const membership = await prisma.membership.findFirst({ where: { userId: user.id } });
    if (membership) {
      await prisma.workspace.update({ where: { id: membership.workspaceId }, data: { plan: order.planId } });
    }
  }
  await audit(user.id, "payment", "order", order.id, { status: result.status, verified: result.verified, simulated: true });
  const fresh = await prisma.order.findUnique({ where: { id: order.id }, include: { payment: true, plan: true } });
  return {
    simulated: true,
    unlocked: unlock,
    reference: order.reference,
    status: result.status,
    subtotal: order.amountInr,
    gst: order.gstInr,
    total: order.totalInr,
    plan: fresh?.plan.name ?? order.planId,
  };
}
