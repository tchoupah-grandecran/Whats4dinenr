import { withAuth } from "next-auth/middleware";

// Déclaration explicite d'une fonction pour satisfaire Next.js 16+
export default withAuth(function middleware(req) {
  // Laisse vide, NextAuth gère la sécurité automatiquement
});

export const config = {
  // On protège tout sauf les pages publiques et les ressources statiques
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};