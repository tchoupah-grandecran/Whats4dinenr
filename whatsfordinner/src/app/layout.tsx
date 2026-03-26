import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-dinner-cream text-dinner-green min-h-screen relative">
        <AuthProvider>
          <main className="relative z-10 max-w-lg mx-auto px-6 pt-8 pb-24">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}