import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Heart, Copy, Check, ArrowRight, Users, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

type Step = 'choose' | 'create' | 'join' | 'done'

export default function OnboardingCouple() {
  const { createCouple, joinCouple, user } = useAuth()
  const [step, setStep] = useState<Step>('choose')
  const [inviteCode, setInviteCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const code = await createCouple()
      setInviteCode(code)
      setStep('create')
    } catch {
      setError('Não foi possível criar o casal. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!inputCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      await joinCouple(inputCode.trim())
      setStep('done')
    } catch (err: any) {
      setError(
        err.message === 'Invalid invite code'
          ? 'Código inválido. Verifique com seu parceiro(a).'
          : err.message === 'Couple is full'
          ? 'Este casal já está completo.'
          : 'Algo deu errado.'
      )
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        <AnimatePresence mode="wait">

          {step === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-primary/10 border border-primary/20 mb-2">
                  <Heart size={26} className="text-primary" />
                </div>
                <h2 className="text-3xl font-headings font-semibold">
                  Olá, {user?.name?.split(' ')[0]} 👋
                </h2>
                <p className="text-muted text-sm leading-relaxed">
                  Conecte-se ao seu parceiro(a) para começar a gerenciar as finanças juntos.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full p-5 bg-primary/10 border border-primary/20 rounded-2xl text-left group hover:bg-primary/15 transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-white">Criar novo casal</p>
                      <p className="text-xs text-muted">Gere um código e convide seu parceiro(a)</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <Sparkles size={18} />
                      )}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setStep('join')}
                  className="w-full p-5 bg-white/[0.03] border border-white/8 rounded-2xl text-left group hover:bg-white/[0.06] transition-all duration-300 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-white">Entrar em um casal</p>
                      <p className="text-xs text-muted">Tenho um código do meu parceiro(a)</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted group-hover:text-white group-hover:scale-110 transition-all">
                      <Users size={18} />
                    </div>
                  </div>
                </button>
              </div>

              <button className="w-full text-center text-muted/50 text-xs py-2">
                Pular por agora — configurar depois
              </button>
            </motion.div>
          )}

          {step === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-positive/10 border border-positive/20 mb-2">
                  <Heart size={26} className="text-positive" />
                </div>
                <h2 className="text-2xl font-headings font-semibold">Casal criado!</h2>
                <p className="text-muted text-sm leading-relaxed">
                  Compartilhe o código abaixo com seu parceiro(a).
                  Ele(a) vai precisar dele para entrar.
                </p>
              </div>

              <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl space-y-4 text-center">
                <p className="text-muted text-[10px] uppercase tracking-[0.2em]">Código de convite</p>
                <p className="text-3xl font-headings font-semibold tracking-widest text-primary">
                  {inviteCode}
                </p>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all active:scale-95"
                >
                  {copied ? (
                    <><Check size={14} className="text-positive" /><span className="text-positive">Copiado!</span></>
                  ) : (
                    <><Copy size={14} className="text-muted" /><span className="text-muted">Copiar código</span></>
                  )}
                </button>
              </div>

              <button
                onClick={() => setStep('done')}
                className="w-full py-4 bg-primary rounded-2xl font-medium text-background flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                Continuar <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-headings font-semibold">Entrar no casal</h2>
                <p className="text-muted text-sm">
                  Cole o código que seu parceiro(a) gerou.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Ex: aB3xY7kLmN"
                  value={inputCode}
                  onChange={e => { setInputCode(e.target.value); setError(null) }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  className="w-full bg-white/[0.03] border border-white/8 rounded-2xl py-4 px-5 text-white placeholder:text-muted/40 focus:outline-none focus:border-primary/40 transition-all text-center text-lg font-headings tracking-widest"
                  autoFocus
                />

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-negative text-sm text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleJoin}
                  disabled={!inputCode.trim() || loading}
                  className={`w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                    ${inputCode.trim() && !loading
                      ? 'bg-primary text-background'
                      : 'bg-white/5 text-muted cursor-not-allowed'
                    }`}
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    : <><span>Entrar</span><ArrowRight size={18} /></>
                  }
                </button>

                <button
                  onClick={() => { setStep('choose'); setError(null) }}
                  className="w-full text-center text-muted/50 text-sm py-2"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-positive/10 border border-positive/20 mx-auto"
              >
                <Heart size={36} className="text-positive fill-positive" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-2xl font-headings font-semibold">Conectados! 🎉</h2>
                <p className="text-muted text-sm">
                  Agora vocês compartilham o espaço financeiro conjunto.<br />
                  Cada um mantém sua privacidade individual.
                </p>
              </div>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-primary rounded-2xl font-medium text-background flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                Começar <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
