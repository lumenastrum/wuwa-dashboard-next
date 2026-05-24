import type { Metadata } from "next";
import {
  Geist,
  Cormorant_Garamond,
  Instrument_Serif,
  Space_Grotesk,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme-context";
import { DataProvider } from "@/lib/data-context";
import { EditProvider } from "@/lib/edit-context";
import { TopBar } from "@/components/top-bar";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Wuthering Waves · Roster Atelier",
  description: "Andres's resonator roster, audits, benchmarks, and endstate cycles.",
};

const fontClassNames = [
  geist.variable,
  cormorant.variable,
  instrument.variable,
  spaceGrotesk.variable,
  jetbrains.variable,
].join(" ");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontClassNames} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <DataProvider>
            <EditProvider>
              <TopBar />
              {children}
            </EditProvider>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
