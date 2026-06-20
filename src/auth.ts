import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// In a real app you'd want a singleton pattern for PrismaClient
// to avoid exhausting DB connections during hot reloads...
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Next.js edge runtime / build might evaluate this file without DATABASE_URL
const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost/dummy";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      
      // Allow updating the active organization ID in the session
      if (trigger === "update" && session?.organizationId) {
        console.log("JWT Update Triggered! Old Org:", token.organizationId, "New Org:", session.organizationId);
        token.organizationId = session.organizationId;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        
        // Dynamically override organizationId if the cookie is present
        try {
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          const activeOrg = cookieStore.get("activeOrganizationId");
          if (activeOrg) {
            session.user.organizationId = activeOrg.value;
          }
        } catch (e) {
          // Ignore if cookies are not available in this context
        }
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt"
  }
});

export { prisma };
