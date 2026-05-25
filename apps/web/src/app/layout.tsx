import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";
import SessionProvider from "@/components/layout/SessionProvider";

const cairo = Cairo({ 
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"]
});

export const metadata: Metadata = {
  title: "Aunt Sex — سكس عربي ومصري | نيك وشرموطات",
  description: "سكس عربي، نيك مصري، محارم، شرموطات، طيز وكس — بث مباشر ومجاني. ادخل يا وحش واتفرج على راحتك.",
  keywords: "سكس, سكس مصري, نيك, شرموطة, طيز, كس, زبر, محارم, سحاق, سكس عربي, بث مباشر",
  robots: "index, follow",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Aunt Sex — سكس عربي ومصري",
    description: "نيك، شرموطات، ومحارم — كل حاجة تفرك عليها في مكان واحد.",
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
      <body className={cairo.className}>
        <ThemeProvider attribute="class" forcedTheme="dark">
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
