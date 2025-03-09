import type React from "react"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <head>
        <title>Consensus Learning Agents</title>
        <meta name="description" content="A platform for consensus learning agents" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap" />
      </head>
      <body className="bg-background text-foreground">{children}</body>
    </html>
  )
}

