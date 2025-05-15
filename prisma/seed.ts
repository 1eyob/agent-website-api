import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create a test agent with your email
  const agent = await prisma.agent.upsert({
    where: { email: process.env.EMAIL_USER || "eyobbirhanu28@gmail.com" },
    update: {},
    create: {
      email: process.env.EMAIL_USER || "eyobbirhanu28@gmail.com",
      fullName: "Eyob Birhanu",
      subdomain: "eyobbirhanu",
      phone: "1234567890",
      bio: "I am a real estate agent",
    },
  });

  console.log({ agent });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
