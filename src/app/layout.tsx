import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Familjen_Grotesk, Martian_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import { DataProvider } from "@/lib/data-context";
import { TopBar } from "@/components/top-bar";

// Emberline faces — the "Resonance Instrument" stack (2026-07-15):
// Chakra Petch (display) + Familjen Grotesk (body) + Martian Mono (HUD).
const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const familjenGrotesk = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wuthering Waves · Roster Atelier",
  description: "A.'s resonator roster, audits, benchmarks, and endstate cycles.",
};

// viewport-fit=cover so env(safe-area-inset-*) resolves on notched devices.
export const viewport: Viewport = {
  viewportFit: "cover",
};

const fontClassNames = [
  chakraPetch.variable,
  familjenGrotesk.variable,
  martianMono.variable,
].join(" ");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontClassNames} antialiased`}>
      <body>
        <ThemeProvider>
          <DataProvider>
            <TopBar />
            {children}
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
