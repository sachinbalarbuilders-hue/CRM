import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const members = await prisma.organizationMember.findMany({
    include: { user: true, organization: true }
  });

  for (const m of members) {
    if (m.organization.name.toLowerCase().includes('bala') || m.user.email.toLowerCase().includes('bala')) {
      console.log(`Found member: ${m.user.email} in org ${m.organization.name} with role ${m.role}`);
      if (m.role === 'EXECUTIVE' && !m.customRoleId) {
        console.log(`Upgrading ${m.user.email} to ORG_ADMIN in org ${m.organization.name}`);
        await prisma.organizationMember.update({
          where: { id: m.id },
          data: { role: 'ORG_ADMIN' }
        });
      }
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
