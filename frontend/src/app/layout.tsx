import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prodent Stomatologiya | Современная Стоматология в Ташкенте",
  description: "Профессиональное лечение зубов, имплантация, виниры и ортодонтия в Ташкенте. Современное оборудование и опытные врачи. Запишитесь на прием онлайн!",
  keywords: ["стоматология ташкент", "лечение зубов", "имплантация зубов", "виниры ташкент", "детская стоматология"],
  openGraph: {
    title: "Prodent Stomatologiya - Ваша идеальная улыбка",
    description: "Современная стоматологическая клиника с индивидуальным подходом.",
    url: "https://prodent.uz",
    siteName: "Prodent Stomatologiya",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
};

import { LanguageProvider } from "@/context/LanguageContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
