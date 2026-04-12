import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authApi } from "../../lib/api";

interface FieldProps {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}

const Field = ({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
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
      className="w-full bg-white/[0.03] border border-white/8 rounded-2xl py-4 pl-12 pr-5 text-white placeholder:text-muted/50 focus:outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all duration-300 text-sm"
    />
  </div>
);

export default function ResetPasswordScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de recuperação inválido ou ausente.");
    }
  }, [token]);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) return;
    
    if (newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!token) {
      setError("Token inválido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(
        err.message === "Invalid or expired reset token"
          ? "Este link de recuperação expirou ou é inválido. Solicite um novo."
          : err.message || "Algo deu errado. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const isValid = newPassword && confirmPassword && newPassword.length >= 8 && newPassword === confirmPassword;

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        <div className="w-full max-w-sm relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[20px] bg-positive/10 border border-positive/20 mb-6"
          >
            <CheckCircle size={40} className="text-positive" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl font-headings font-semibold text-white mb-3"
          >
            Senha redefinida!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted text-sm mb-8"
          >
            Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes...
          </motion.p>

          <motion.button
            onClick={() => navigate("/login")}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-medium bg-primary text-background hover:brightness-110 transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
          >
            Ir para login agora
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: 0,
            y: 0,
            scale: 1,
          }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
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
            Redefina sua senha
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="space-y-3"
          onKeyDown={handleKeyDown}
        >
          {!token && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-3 bg-negative/10 border border-negative/20 rounded-xl text-negative text-sm"
            >
              {error || "Token de recuperação inválido ou ausente."}
            </motion.div>
          )}

          <Field
            icon={<Lock size={16} />}
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />

          <Field
            icon={<Lock size={16} />}
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          {error && token && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="px-4 py-3 bg-negative/10 border border-negative/20 rounded-xl text-negative text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            onClick={handleSubmit}
            disabled={!isValid || loading || !token}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-3 transition-all duration-300 mt-2
              ${
                isValid && !loading && token
                  ? "bg-primary text-background hover:brightness-110 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                  : "bg-white/5 text-muted cursor-not-allowed"
              }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <>
                <span>Redefinir senha</span>
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
          A senha deve ter pelo menos 8 caracteres.
        </motion.p>
      </div>
    </div>
  );
}
