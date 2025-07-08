import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.agent.findMany({
    where: {
      instagramUrl: {
        not: null,
      },
    },
  });

  for (const agent of agents) {
    const username = agent.instagramUrl?.trim();
    if (
      username &&
      !username.startsWith("http://") &&
      !username.startsWith("https://")
    ) {
      const newUrl = `https://instagram.com/${username.replace(/^@/, "")}`;
      await prisma.agent.update({
        where: { id: agent.id },
        data: { instagramUrl: newUrl },
      });
      console.log(`Updated agent ${agent.id}: '${username}' -> '${newUrl}'`);
    }
  }

  console.log("Instagram usernames updated to URLs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
