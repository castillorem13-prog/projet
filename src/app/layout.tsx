import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/atkinson-hyperlegible-next/index.css";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/shell.css";
import "@/styles/screens.css";
import "@/styles/player.css";
import "@/styles/activities.css";
import "@/styles/programme.css";
import "@/styles/wallet.css";
import "@/styles/coach.css";
import "@/styles/v7.css";
import { DemoBridge } from "@/components/shell/demo-bridge";
import { THEME_BOOT, ThemeSync } from "@/components/shell/theme-sync";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "LearnWard",
  description: "Tes devoirs deviennent des séances de révision courtes, variées et écrites autour de tes passions.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
  applicationName: "LearnWard",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "LearnWard" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#12101d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <StoreProvider>
          <ThemeSync />
          <DemoBridge />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
