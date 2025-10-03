const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function setAndresPassword() {
  try {
    // Check if agent exists
    const agent = await prisma.agent.findUnique({
      where: { email: "andres@luxvt.com" },
    });

    if (!agent) {
      console.log("❌ Agent with email andres@luxvt.com not found");
      return;
    }

    console.log("✅ Found agent:", {
      id: agent.id,
      email: agent.email,
      fullName: agent.fullName,
      subdomain: agent.subdomain,
      hasPassword: !!agent.password,
    });

    // Set password to "password123" (same as other test agents)
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update agent with password
    const updatedAgent = await prisma.agent.update({
      where: { email: "andres@luxvt.com" },
      data: { password: hashedPassword },
    });

    console.log("🔐 Password set successfully for andres@luxvt.com");
    console.log("📝 Password: password123");
    console.log("✅ Agent can now login using email/password authentication");
  } catch (error) {
    console.error("❌ Error setting password:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setAndresPassword();
