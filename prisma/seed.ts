import { prisma } from "../src/lib/db";
import { resetDemo } from "../src/services/seed-demo";

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
