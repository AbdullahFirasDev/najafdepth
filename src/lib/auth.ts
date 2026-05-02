import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { signInSchema } from "@/lib/validations";

const env = getServerEnv();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.trim().toLowerCase();
        const rate = checkRateLimit(`sign-in:${email}`, 8, 60_000);
        if (!rate.allowed) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isPasswordValid = await compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!isPasswordValid || user.status !== "ACTIVE" || !user.isActive) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role.name,
          status: user.status,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { role: true },
        });

        if (dbUser) {
          token.role = dbUser.role.name;
          token.status = dbUser.status;
          token.isActive = dbUser.isActive;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role =
          (token.role as typeof session.user.role) ?? "READER";
        session.user.status = token.status ?? "ACTIVE";
        session.user.isActive = token.isActive ?? true;
      }

      return session;
    },
  },
  events: {
    async signIn(message) {
      if (message.user?.email) {
        try {
          await prisma.user.update({
            where: { email: message.user.email.trim().toLowerCase() },
            data: { lastLoginAt: new Date() },
          });
        } catch (error) {
          console.error("Failed to update last login timestamp", {
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    },
  },
  secret: env.NEXTAUTH_SECRET,
};

export function auth() {
  return getServerSession(authOptions);
}
