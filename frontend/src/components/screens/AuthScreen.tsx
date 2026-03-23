import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

type Mode = "login" | "register";

interface FieldProps {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  rightSlot?: React.ReactNode;
}

const Field = ({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  rightSlot,
}: FieldProps) => (
  <div className="relative group">
    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors duration-300">
      {icon}
    </div>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      className="w-full bg-white/[0.03] border border-white/8 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-muted/50 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all duration-300 text-sm"
    />
    {rightSlot && (
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        {rightSlot}
      </div>
    )}
  </div>
);

const Orbs = ({ mode }: { mode: Mode }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{
        x: mode === "login" ? 0 : 40,
        y: mode === "login" ? 0 : -20,
        scale: mode === "login" ? 1 : 1.1,
      }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
        filter: "blur(40px)",
      }}
    />
    <motion.div
      animate={{
        x: mode === "login" ? 0 : -30,
        y: mode === "login" ? 0 : 30,
        scale: mode === "login" ? 1 : 1.15,
      }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute -bottom-48 -right-24 w-80 h-80 rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
        filter: "blur(50px)",
      }}
    />
    <div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }}
    />
  </div>
);

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) return;
    if (mode === "register" && !name) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, name, password);
      }
    } catch (err: any) {
      setError(
        err.message === "Email already registered"
          ? "Este e-mail já está cadastrado."
          : err.message === "Invalid credentials"
            ? "E-mail ou senha incorretos."
            : "Algo deu errado. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const isValid = email && password && (mode === "login" || name);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative px-6">
      <Orbs mode={mode} />

      <div className="w-full max-w-sm relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-primary/10 border border-primary/20 mb-6 mx-auto">
            <Sparkles size={28} className="text-primary" />
          </div>
          <h1 className="text-3xl font-headings font-semibold tracking-tight text-white">
            FinCouple
          </h1>
          <p className="text-muted text-sm mt-2">
            Finanças para dois, com privacidade para cada um.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex p-1 bg-white/[0.03] border border-white/8 rounded-2xl mb-8"
        >
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className="relative flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors duration-300"
            >
              {mode === m && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute inset-0 bg-white/8 rounded-xl border border-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span
                className={`relative transition-colors duration-300 ${mode === m ? "text-white" : "text-muted"}`}
              >
                {m === "login" ? "Entrar" : "Cadastrar"}
              </span>
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="space-y-3"
          onKeyDown={handleKeyDown}
        >
          <AnimatePresence>
            {mode === "register" && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="pb-3">
                  <Field
                    icon={<User size={16} />}
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Field
            icon={<Mail size={16} />}
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />

          <Field
            icon={<Lock size={16} />}
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            value={password}
            onChange={setPassword}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-muted hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="px-4 py-3 bg-negative/10 border border-negative/20 rounded-xl text-negative text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-3 transition-all duration-300 mt-2
              ${
                isValid && !loading
                  ? "bg-primary text-background hover:brightness-110 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                  : "bg-white/5 text-muted cursor-not-allowed"
              }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === "login" ? "Entrar" : "Criar conta"}</span>
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-muted/50 text-xs mt-8 leading-relaxed"
        >
          {mode === "login"
            ? "Não tem conta? Clique em Cadastrar acima."
            : "Ao criar conta, você concorda com os termos de uso."}
        </motion.p>
      </div>
    </div>
  );
}
