import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

/**
 * Reference font: Montserrat variable font, weight 100–900, loaded locally
 * (see home-reference.html's @font-face) rather than from Google Fonts.
 */
const montserrat = localFont({
  src: "./fonts/Montserrat-VariableFont_wght.ttf",
  variable: "--font-montserrat",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vexiom - Tecnologia projetada para acelerar negócios",
  description:
    "Vexiom - sites, sistemas, lojas online e automações com IA. Soluções digitais com direção clara.",
};

export const viewport: Viewport = {
  themeColor: "#0b0c0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
