import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@admin.com";
  const password = "admin";
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("Admin user already exists!");
    return;
  }

  // Create organization for admin
  const org = await prisma.organization.create({
    data: {
      name: "Default Organization",
    },
  });

  // Create admin user
  const user = await prisma.user.create({
    data: {
      email,
      name: "Admin User",
      hashedPassword,
      role: "SUPER_ADMIN",
      organizationId: org.id,
    },
  });

  console.log(`Admin user created: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
