import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shell/providers";
import { SkipLink } from "@/components/shell/skip-link";
import { Navbar } from "@/components/shell/navbar";
import { Footer } from "@/components/shell/footer";
import { PaletteLazy } from "@/components/shell/palette-lazy";
import { siteConfig } from "@/content/site";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description:
    "Custom web apps, enterprise ERPs, AI tools, and turnkey office infrastructure from one team.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" className={`${GeistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-void text-text">
        <Providers>
          <SkipLink />
          <Navbar />
          <div id="main" className="flex flex-1 flex-col">
            {children}
          </div>
          <Footer />
          <PaletteLazy />
        </Providers>
      </body>
    </html>
  );
}
