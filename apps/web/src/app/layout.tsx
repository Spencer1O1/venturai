import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Venturai – Inspection Intelligence",
  description: "AI-powered inspection intelligence for industrial equipment",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Used for theme purposes
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var s = localStorage.getItem('venturai-theme');
                var dark = s !== 'light';
                if (dark) document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              })();
            `,
          }}
        />
      </head>
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
