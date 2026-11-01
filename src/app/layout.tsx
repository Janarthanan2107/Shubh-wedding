import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit, Noto_Serif_Tamil, Noto_Sans_Tamil, Noto_Serif_Devanagari, Noto_Sans_Gurmukhi } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
const tamilSerif = Noto_Serif_Tamil({ subsets: ["tamil"], weight: ["500", "600", "700"], variable: "--font-tamil-serif", display: "swap", preload: false });
const tamilSans = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["400", "600"], variable: "--font-tamil-sans", display: "swap", preload: false });
const devanagari = Noto_Serif_Devanagari({ subsets: ["devanagari"], weight: ["500", "600", "700"], variable: "--font-devanagari", display: "swap", preload: false });
const gurmukhi = Noto_Sans_Gurmukhi({ subsets: ["gurmukhi"], weight: ["500", "600"], variable: "--font-gurmukhi", display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "Shubh", template: "%s · Shubh" },
  description: "Indian wedding invitations, RSVPs and wedding management for families and planners.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${cormorant.variable} ${tamilSerif.variable} ${tamilSans.variable} ${devanagari.variable} ${gurmukhi.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("shubh-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
