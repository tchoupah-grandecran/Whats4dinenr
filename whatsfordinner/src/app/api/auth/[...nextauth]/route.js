import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { sheetsService } from "@/lib/google-sheets";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // On vérifie si l'utilisateur existe dans le Sheets
      const existingUser = await sheetsService.getUserByEmail(user.email);
      if (existingUser) return true;
      
      // Optionnel: Rediriger vers une page de création de foyer s'il n'existe pas
      return "/register-household"; 
    },
    async session({ session }) {
      const dbUser = await sheetsService.getUserByEmail(session.user.email);
      if (dbUser) {
        session.user.householdId = dbUser.householdId;
        session.user.firstName = dbUser.firstName;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  }
});

export { handler as GET, handler as POST };