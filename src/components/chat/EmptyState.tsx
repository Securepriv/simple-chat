'use client'

export function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35]">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-48 h-48 rounded-full bg-[#2a3942] flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-32 h-32">
            {/* Bulle gauche */}
            <rect x="20" y="80" width="90" height="50" rx="12" fill="#2a3942" />
            <rect x="20" y="80" width="90" height="50" rx="12" fill="#374048" />
            <rect x="30" y="92" width="50" height="8" rx="4" fill="#4a5568" />
            <rect x="30" y="106" width="35" height="8" rx="4" fill="#4a5568" />
            {/* Bulle droite */}
            <rect x="90" y="115" width="90" height="50" rx="12" fill="#25d366" opacity="0.9" />
            <rect x="100" y="127" width="55" height="8" rx="4" fill="white" opacity="0.6" />
            <rect x="100" y="141" width="40" height="8" rx="4" fill="white" opacity="0.6" />
            {/* Double ticks */}
            <path d="M163 157 L167 161 L175 153" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
            <path d="M158 157 L162 161 L170 153" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
          </svg>
        </div>
        {/* Cercle décoratif animé */}
        <div className="absolute inset-0 rounded-full border-2 border-[#25d366]/20 animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      <h2 className="text-white text-2xl font-light mb-3">
        MessageApp Web
      </h2>
      <p className="text-[#aebac1] text-sm text-center max-w-xs leading-relaxed">
        Commencez une discussion en recherchant un utilisateur dans la barre de gauche.
      </p>

      {/* Features pills */}
      <div className="flex flex-wrap gap-2 mt-8 justify-center max-w-sm">
        {[
          '🔒 Chiffré',
          '⚡ Temps réel',
          '📎 Fichiers',
          '😊 Emojis',
          '✓✓ Messages vus',
        ].map((feat) => (
          <span
            key={feat}
            className="bg-[#2a3942] text-[#aebac1] text-xs px-3 py-1.5 rounded-full"
          >
            {feat}
          </span>
        ))}
      </div>
    </div>
  )
}
