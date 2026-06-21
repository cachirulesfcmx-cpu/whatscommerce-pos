import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validations/auth";

const providers = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (raw) => {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (!user || !user.passwordHash) return null;

      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        isSuperAdmin: user.isSuperAdmin,
      };
    },
  }),
];

// Optional social login (only registered if env present)
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }) as never
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id: string }).id;
        token.isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
      }
      return session;
    },
  },
});
