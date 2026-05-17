'use client'

export function TypingIndicator() {
  return (
    <div className="flex justify-start msg-animate">
      <div className="msg-bubble-in px-4 py-3 rounded-lg flex items-center gap-1">
        <span className="text-[#aebac1] text-xs mr-1">en train d&apos;écrire</span>
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#aebac1] inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#aebac1] inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#aebac1] inline-block" />
      </div>
    </div>
  )
}
