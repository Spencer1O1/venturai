import "./globals.css";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "Venturai – Inspection Intelligence",
  description: "AI-powered inspection intelligence for industrial equipment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var s = localStorage.getItem('venturai-theme');
                var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var dark = s === 'dark' || (!s && d);
                if (dark) document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              })();
            `,
          }}
        />
      </head>
      <body>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
