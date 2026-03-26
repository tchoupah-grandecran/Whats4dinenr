export { default } from "next-auth/middleware";

export const config = {
  // Protéger toutes les routes sauf /login et l'API d'auth
  matcher: ["/((?!api/auth|login|textures).*)"],
};