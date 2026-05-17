'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'login'|'register'|'reset'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, resetPassword } = useAuth()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else if (mode === 'register') {
        if (!username.trim()) throw new Error("Nom d'utilisateur requis")
        await register(email, password, username)
        setSuccess('Compte créé ! Vérifiez votre email.')
      } else { await resetPassword(email); setSuccess('Email envoyé !') }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      if (msg.includes('Invalid login credentials')) setError('Email ou mot de passe incorrect')
      else if (msg.includes('User already registered')) setError('Email déjà utilisé')
      else setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="animated-gradient min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#25d366] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white"><path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345z"/></svg>
          </div>
          <h1 className="text-white text-2xl font-bold">{mode==='login'?'Bon retour !':mode==='register'?'Créer un compte':'Mot de passe oublié'}</h1>
        </div>
        {error && <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4"><p className="text-red-200 text-sm">{error}</p></div>}
        {success && <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4"><p className="text-green-200 text-sm">{success}</p></div>}
        <form onSubmit={handle} className="space-y-4">
          {mode==='register' && (
            <div>
              <label className="text-white/80 text-sm block mb-1.5">Nom d&apos;utilisateur</label>
              <input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="votre_pseudo" required className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#25d366] transition-all"/>
            </div>
          )}
          <div>
            <label className="text-white/80 text-sm block mb-1.5">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com" required className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#25d366] transition-all"/>
          </div>
          {mode!=='reset' && (
            <div>
              <label className="text-white/80 text-sm block mb-1.5">Mot de passe</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#25d366] transition-all"/>
            </div>
          )}
          {mode==='login' && <div className="text-right"><button type="button" onClick={()=>setMode('reset')} className="text-[#25d366] text-sm hover:underline">Mot de passe oublié ?</button></div>}
          <button type="submit" disabled={loading} className="w-full bg-[#25d366] hover:bg-[#1ebe58] disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-all">
            {loading ? 'Chargement...' : mode==='login'?'Se connecter':mode==='register'?'Créer le compte':'Envoyer le lien'}
          </button>
        </form>
        <div className="mt-6 text-center">
          {mode==='login' ? (
            <p className="text-white/60 text-sm">Pas encore de compte ? <button onClick={()=>{setMode('register');setError('')}} className="text-[#25d366] hover:underline font-medium">S&apos;inscrire</button></p>
          ) : (
            <button onClick={()=>{setMode('login');setError('');setSuccess('')}} className="text-white/60 text-sm hover:text-white">← Retour à la connexion</button>
          )}
        </div>
      </div>
    </div>
  )
}
