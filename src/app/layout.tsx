import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthGuard } from "@/components/AuthGuard";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard | RCC",
  description: "Área privada da RCC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-[var(--background)]" style={{ colorScheme: "light" }}>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
