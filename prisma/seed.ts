import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
  // Hash a default password for all test agents
  // Default password: "password123" - use this for testing password login
  const defaultPassword = "password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  // Generate a unique subdomain
  const baseSubdomain = "eyobbirhanu";
  const uniqueSubdomain = await generateUniqueSubdomain(baseSubdomain);

  // Create a test agent with your email
  const agent = await prisma.agent.upsert({
    where: { email: process.env.EMAIL_USER || "eyobbirhanu28@gmail.com" },
    update: {
      subdomain: uniqueSubdomain, // Update subdomain if it's a new unique one
      password: hashedPassword, // Add password to existing agent
    },
    create: {
      email: process.env.EMAIL_USER || "eyobbirhanu28@gmail.com",
      fullName: "Eyob Birhanu",
      subdomain: uniqueSubdomain,
      phone: "1234567890",
      bio: "I am a real estate agent",
      password: hashedPassword,
    },
  });

  // Generate a unique subdomain for Eric
  const ericBaseSubdomain = "ericengert";
  const ericUniqueSubdomain = await generateUniqueSubdomain(ericBaseSubdomain);

  // Create Eric's agent profile
  const ericAgent = await prisma.agent.upsert({
    where: { email: "eric@luxvt.com" },
    update: {
      subdomain: ericUniqueSubdomain,
      password: hashedPassword,
    },
    create: {
      email: "eric@luxvt.com",
      fullName: "Eric Engert",
      subdomain: ericUniqueSubdomain,
      phone: "+1345678896",
      bio: "I am a legal luxvt agent",
      password: hashedPassword,
    },
  });

  // Generate a unique subdomain for Charles
  const charlesBaseSubdomain = "charlesbornheimer";
  const charlesUniqueSubdomain = await generateUniqueSubdomain(
    charlesBaseSubdomain
  );

  // Create Charles's agent profile
  const charlesAgent = await prisma.agent.upsert({
    where: { email: "charles@airdomo.com" },
    update: {
      subdomain: charlesUniqueSubdomain,
      password: hashedPassword,
    },
    create: {
      email: "charles@airdomo.com",
      fullName: "Charles Bornheimer",
      subdomain: charlesUniqueSubdomain,
      phone: "+1234567890",
      bio: "I am a real estate agent",
      password: hashedPassword,
    },
  });

  // Generate a unique subdomain for Charles (luxvt)
  const charlesLuxvtBaseSubdomain = "charlesbornheimerluxvt";
  const charlesLuxvtUniqueSubdomain = await generateUniqueSubdomain(
    charlesLuxvtBaseSubdomain
  );

  // Create Charles's luxvt agent profile
  const charlesLuxvtAgent = await prisma.agent.upsert({
    where: { email: "charles@luxvt.com" },
    update: {
      subdomain: charlesLuxvtUniqueSubdomain,
      password: hashedPassword,
    },
    create: {
      email: "charles@luxvt.com",
      fullName: "Charles Bornheimer",
      subdomain: charlesLuxvtUniqueSubdomain,
      phone: "+1234567890",
      bio: "I am a real estate agent",
      password: hashedPassword,
    },
  });

  // Generate a unique subdomain for Eyob Tadesse
  const eyobTadesseBaseSubdomain = "eyobtadesse";
  const eyobTadesseUniqueSubdomain = await generateUniqueSubdomain(
    eyobTadesseBaseSubdomain
  );

  // Create Eyob Tadesse's agent profile
  const eyobTadesseAgent = await prisma.agent.upsert({
    where: { email: "eyobtadesse1997@gmail.com" },
    update: {
      subdomain: eyobTadesseUniqueSubdomain,
      password: hashedPassword,
    },
    create: {
      email: "eyobtadesse1997@gmail.com",
      fullName: "Eyob B. Tadesse",
      subdomain: eyobTadesseUniqueSubdomain,
      phone: "+1234567890",
      bio: "I am a real estate agent",
      password: hashedPassword,
    },
  });

  // Generate a unique subdomain for Jijo Mavila
  const jijoMavilaBaseSubdomain = "jijomavila";
  const jijoMavilaUniqueSubdomain = await generateUniqueSubdomain(
    jijoMavilaBaseSubdomain
  );

  // Create Jijo Mavila's agent profile
  const jijoMavilaAgent = await prisma.agent.upsert({
    where: { email: "jijo.mavila@zyxware.com" },
    update: {
      subdomain: jijoMavilaUniqueSubdomain,
      password: hashedPassword,
    },
    create: {
      email: "jijo.mavila@zyxware.com",
      fullName: "Jijo Mavila",
      subdomain: jijoMavilaUniqueSubdomain,
      phone: "+1234567890",
      bio: "I am a real estate agent",
      password: hashedPassword,
    },
  });

  // Generate a unique subdomain for Morgan
  const morganBaseSubdomain = "morgan";
  const morganUniqueSubdomain = await generateUniqueSubdomain(
    morganBaseSubdomain
  );

  // Create Morgan's agent profile
  const morganAgent = await prisma.agent.upsert({
    where: { email: "morgan@luxvt.com" },
    update: {
      subdomain: morganUniqueSubdomain,
      password: hashedPassword,
    },
    create: {
      email: "morgan@luxvt.com",
      fullName: "Morgan",
      subdomain: morganUniqueSubdomain,
      phone: "+1234567890",
      bio: "Admin",
      password: hashedPassword,
    },
  });

  console.log({
    agent,
    ericAgent,
    charlesAgent,
    charlesLuxvtAgent,
    eyobTadesseAgent,
    jijoMavilaAgent,
    morganAgent,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
