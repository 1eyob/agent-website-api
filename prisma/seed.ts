import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to generate a random string
function generateRandomString(length: number) {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Function to generate a unique subdomain
async function generateUniqueSubdomain(baseSubdomain: string): Promise<string> {
  let subdomain = baseSubdomain;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      // Try to find an existing agent with this subdomain
      const existingAgent = await prisma.agent.findUnique({
        where: { subdomain },
      });

      if (!existingAgent) {
        return subdomain;
      }

      // If subdomain exists, append a random string
      subdomain = `${baseSubdomain}-${generateRandomString(4)}`;
      attempts++;
    } catch (error) {
      console.error("Error checking subdomain uniqueness:", error);
      throw error;
    }
  }

  throw new Error(
    "Could not generate a unique subdomain after multiple attempts"
  );
}

async function main() {
  // Generate a unique subdomain
  const baseSubdomain = "eyobbirhanu";
  const uniqueSubdomain = await generateUniqueSubdomain(baseSubdomain);

  // Create a test agent with your email
  const agent = await prisma.agent.upsert({
    where: { email: process.env.EMAIL_USER || "eyobbirhanu28@gmail.com" },
    update: {
      subdomain: uniqueSubdomain, // Update subdomain if it's a new unique one
    },
    create: {
      email: process.env.EMAIL_USER || "eyobbirhanu28@gmail.com",
      fullName: "Eyob Birhanu",
      subdomain: uniqueSubdomain,
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
