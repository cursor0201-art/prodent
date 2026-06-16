import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { About } from "@/components/home/About";
import { Doctors } from "@/components/home/Doctors";
import { Prices } from "@/components/home/Prices";
import { Reviews } from "@/components/home/Reviews";
import { FAQ } from "@/components/home/FAQ";
import { Contact } from "@/components/home/Contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SharkDENTA | Лечение зубов в Ташкенте",
  description: "Современная стоматология в Ташкенте. Безболезненное лечение, имплантация, отбеливание и протезирование зубов. Запишитесь на прием прямо сейчас!",
  keywords: ["Стоматология Ташкент", "Лечение зубов Ташкент", "Имплантация зубов", "SharkDENTA", "Шаркдента", "Стоматолог", "Отбеливание зубов"],
  openGraph: {
    title: "SharkDENTA - Современная стоматологическая клиника",
    description: "Передовые технологии, опытные врачи и безболезненное лечение зубов в Ташкенте.",
    url: "https://sharkdenta.uz",
    siteName: "SharkDENTA",
    images: [
      {
        url: "/og-image.jpg", 
        width: 1200,
        height: 630,
        alt: "SharkDENTA",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
};
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      <Hero />
      <Services />
      <About />
      <Doctors />
      <Prices />
      <Reviews />
      <FAQ />
      <Contact />
      
      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-2xl font-bold text-blue-600 tracking-tight mb-4">
            SHARK<span className="text-slate-800">DENTA</span>
          </p>
          <p className="text-slate-400 text-sm font-semibold">
            © 2026 SharkDENTA. Все права защищены.
          </p>
        </div>
      </footer>
    </main>
  );
}
