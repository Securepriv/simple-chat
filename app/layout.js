import './globals.css'

export const metadata = {
  title: 'Messenger - Chat 2 personnes',
  description: 'Application de chat pour 2 personnes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
