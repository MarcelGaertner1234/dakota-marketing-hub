import type { Metadata } from "next"
import { Assistant, Calistoga, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import "./globals.css"

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

const calistoga = Calistoga({
  variable: "--font-calistoga",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Dakota Marketing Hub",
  description: "Marketing-Tool für Dakota Air Lounge",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="de"
      className={`${assistant.variable} ${calistoga.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[#F8F6F3] font-sans font-light dark:bg-gray-950">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
