import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";
import SessionProvider from "@/components/layout/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aunt sex - موقع سكس عربي | أفلام إباحية عربية حصرية",
  description: "Aunt sex - أكبر موقع سكس عربي مجاني. شاهد أفضل أفلام الإباحة العربية والعالمية حصرياً. سكس عربي, نيك, طيز, كس, بزاز - كل ما تبحث عنه في مكان واحد.",
  keywords: "سكس, سكس عربي, أفلام إباحية, نيك, طيز, كس, بزاز, سكس مصري, سكس خليجي, سكس عربي مجاني, porn arabic, adult, xxx",
  robots: "index, follow",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Aunt sex - موقع سكس عربي | أفلام إباحية عربية حصرية",
    description: "أكبر موقع سكس عربي مجاني. شاهد أفضل أفلام الإباحة العربية والعالمية.",
    images: ["/logo.png"],
    type: "website",
    locale: "ar_AR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0A0A0B" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" forcedTheme="dark">
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
