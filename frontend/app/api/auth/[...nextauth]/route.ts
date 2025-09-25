import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) {
          console.error('No email provided');
          return false;
        }
        

        // Use Prisma directly to create/update user
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
            updatedAt: new Date()
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log('User created/updated in database:', dbUser.id);
        return true;
      } catch (error) {
        console.error('Database error during sign in:', error);
        return false;
      }
    },
    async session({ session, token }) {
      // Add user ID to session if needed
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email }
        });
        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };