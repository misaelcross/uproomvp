import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "UpRoom - Plataforma de Comunicação Empresarial",
  description: "A plataforma de comunicação que diz quando falar, não apenas como. Acabe com as interrupções constantes e adivinhação digital.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`} cz-shortcut-listen="true">
        <AuthProvider>
          <CompanyProvider>
            <ChatProvider>
              {children}
              <Toaster />
            </ChatProvider>
          </CompanyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
