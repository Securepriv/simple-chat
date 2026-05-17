import './globals.css'

export const metadata = {
  title: 'Simple Chat',
  description: 'Application de chat simple',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
