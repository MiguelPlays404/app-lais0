import React, { useState, useEffect } from 'react';
import { TikTokLogo } from './TikTokLogo';
import { 
  getLockoutState, 
  recordFailedAttempt, 
  recordFailedEmergencyCode,
  verifyPassword, 
  resetLockout, 
  LockoutState 
} from '../utils/security';
import { 
  Shield, 
  Lock, 
  KeyRound, 
  AlertTriangle, 
  Clock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  ShieldAlert,
  Ban
} from 'lucide-react';

interface UserSelectScreenProps {
  onSelectUser: (user: 'lais' | 'livia') => void;
}

export const UserSelectScreen: React.FC<UserSelectScreenProps> = ({ onSelectUser }) => {
  const [selectedUserCandidate, setSelectedUserCandidate] = useState<'lais' | 'livia' | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [lockoutState, setLockoutState] = useState<LockoutState>(getLockoutState());
  const [remainingCooldown, setRemainingCooldown] = useState<number>(0);

  // Check lockout on mount and tick countdown
  useEffect(() => {
    const updateCooldown = () => {
      const state = getLockoutState();
      setLockoutState(state);
      const diff = Math.max(0, Math.ceil((state.lockoutUntil - Date.now()) / 1000));
      setRemainingCooldown(diff);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCardClick = (user: 'lais' | 'livia') => {
    setSelectedUserCandidate(user);
    setPasswordInput('');
    setErrorMessage(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserCandidate) return;

    // Check if currently locked
    if (remainingCooldown > 0) {
      // Check if emergency code attempts are completely exhausted
      if (lockoutState.emergencyAttemptsLeft <= 0) {
        setErrorMessage('Suas 3 tentativas do código foram esgotadas! É obrigatório aguardar o término do tempo de bloqueio.');
        return;
      }

      // Check if user entered emergency master code 5656 to unlock
      if (passwordInput.trim() === '5656') {
        const fresh = resetLockout();
        setLockoutState(fresh);
        setRemainingCooldown(0);
        setSuccessNotice('🔓 Código mestre 5656 aceito! Bloqueio removido com sucesso.');
        setTimeout(() => {
          onSelectUser(selectedUserCandidate);
        }, 800);
        return;
      }

      // Wrong emergency code entered: record failure and decrement the 3 attempts limit!
      const { state, attemptsLeft } = recordFailedEmergencyCode();
      setLockoutState(state);
      
      if (attemptsLeft <= 0) {
        setErrorMessage('Você esgotou as 3 tentativas do código! Agora é obrigatório aguardar os 45 minutos até o fim do cronômetro.');
      } else {
        setErrorMessage(`Código de emergência incorreto! Você tem mais ${attemptsLeft} ${attemptsLeft === 1 ? 'tentativa' : 'tentativas'}. Se esgotar, terá que aguardar o tempo.`);
      }
      return;
    }

    // Normal password attempt
    if (!passwordInput.trim()) {
      setErrorMessage('Por favor, digite a senha de acesso.');
      return;
    }

    const { success, isEmergencyUnlock } = await verifyPassword(passwordInput);

    if (success) {
      setErrorMessage(null);
      setSuccessNotice(isEmergencyUnlock ? '🔓 Código mestre aceito! Entrando...' : '✓ Senha correta! Acessando painel...');
      setTimeout(() => {
        onSelectUser(selectedUserCandidate);
      }, 600);
    } else {
      const { state, isLocked, remainingSeconds } = recordFailedAttempt();
      setLockoutState(state);
      setRemainingCooldown(remainingSeconds);

      if (isLocked) {
        setErrorMessage(`Limite de tentativas excedido! Bloqueado por ${formatSeconds(remainingSeconds)}.`);
      } else {
        const left = 5 - state.failedAttempts;
        setErrorMessage(`Senha incorreta! Você tem mais ${left} ${left === 1 ? 'tentativa' : 'tentativas'} antes do bloqueio.`);
      }
    }
  };

  const formatSeconds = (sec: number): string => {
    if (sec >= 60) {
      const mins = Math.floor(sec / 60);
      const remainingSecs = sec % 60;
      return `${mins}m ${remainingSecs < 10 ? '0' : ''}${remainingSecs}s`;
    }
    return `${sec} segundos`;
  };

  const isEmergencyCodeDisabled = remainingCooldown > 0 && lockoutState.emergencyAttemptsLeft <= 0;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FE2C55]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#25F4EE]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl text-center space-y-8 animate-in fade-in duration-300">
        
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <TikTokLogo size={48} />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 font-semibold mt-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>tiktokrecargapro • Acesso Restrito</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Quem está acessando?
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Selecione o seu usuário e confirme sua senha de segurança para continuar.
          </p>
        </div>

        {/* Cards for Laís and Lívia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          
          {/* Card 1: Laís (Pink theme) */}
          <button
            type="button"
            onClick={() => handleCardClick('lais')}
            className="group relative p-6 sm:p-7 rounded-3xl bg-neutral-900/90 border-2 border-neutral-800 hover:border-[#FE2C55] transition-all duration-300 text-left flex flex-col justify-between hover:bg-neutral-850 hover:shadow-2xl hover:shadow-[#FE2C55]/20 hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FE2C55] to-[#FF0050] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-[#FE2C55]/30">
                L
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#FE2C55]/15 border border-[#FE2C55]/30 text-[#FE2C55] flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Protegido
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-white group-hover:text-[#FE2C55] transition-colors">
                Laís
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                Painel com tema oficial Rosa e Ciano
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs font-bold text-neutral-300 group-hover:text-white">
              <span>Digitar Senha</span>
              <ArrowRight className="w-4 h-4 text-[#FE2C55] group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card 2: Lívia (Inverted Cyan theme) */}
          <button
            type="button"
            onClick={() => handleCardClick('livia')}
            className="group relative p-6 sm:p-7 rounded-3xl bg-neutral-900/90 border-2 border-neutral-800 hover:border-[#25F4EE] transition-all duration-300 text-left flex flex-col justify-between hover:bg-neutral-850 hover:shadow-2xl hover:shadow-[#25F4EE]/20 hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#25F4EE] to-[#00C8C8] text-neutral-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-[#25F4EE]/30">
                L
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#25F4EE]/15 border border-[#25F4EE]/30 text-[#25F4EE] flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Protegido
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-white group-hover:text-[#25F4EE] transition-colors">
                Lívia
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                Painel com tema invertido Ciano e Rosa
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs font-bold text-neutral-300 group-hover:text-white">
              <span>Digitar Senha</span>
              <ArrowRight className="w-4 h-4 text-[#25F4EE] group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

        </div>

        {/* Legal & Security Notice */}
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-[11px] text-neutral-500 space-y-1">
          <div className="font-semibold text-neutral-400">
            tiktokrecargapro • Todos os direitos reservados
          </div>
          <p>
            Sistema blindado contra inspeção e atalhos de depuração. Dados protegidos por chave de criptografia.
          </p>
        </div>

      </div>

      {/* PASSWORD PROMPT MODAL */}
      {selectedUserCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#161823] border-2 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200"
            style={{
              borderColor: selectedUserCandidate === 'livia' ? '#25F4EE' : '#FE2C55'
            }}
          >
            {/* Top Close */}
            <button
              type="button"
              onClick={() => setSelectedUserCandidate(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div 
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg"
                style={{
                  background: selectedUserCandidate === 'livia' 
                    ? 'linear-gradient(135deg, #25F4EE, #00C8C8)'
                    : 'linear-gradient(135deg, #FE2C55, #FF0050)',
                  color: selectedUserCandidate === 'livia' ? '#000' : '#fff'
                }}
              >
                <KeyRound className="w-7 h-7" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Acesso de {selectedUserCandidate === 'livia' ? 'Lívia' : 'Laís'}
              </h3>
              <p className="text-xs text-neutral-400">
                {remainingCooldown > 0 ? "Sistema bloqueado temporariamente" : "Digite a senha de 6 dígitos para entrar no painel"}
              </p>
            </div>

            {/* Lockout Warning Banner if Locked */}
            {remainingCooldown > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
                  <Clock className="w-4 h-4 shrink-0 animate-pulse" />
                  <span>Bloqueio Ativo: {formatSeconds(remainingCooldown)}</span>
                </div>

                {isEmergencyCodeDisabled ? (
                  <div className="p-2.5 rounded-lg bg-neutral-900 border border-rose-500/50 text-rose-300 font-semibold flex items-center gap-2">
                    <Ban className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Tentativas do código esgotadas (0 de 3). Aguarde o término do cronômetro.</span>
                  </div>
                ) : (
                  <div className="text-neutral-300">
                    Você pode desbloquear digitando o código mestre.
                    <div className="mt-1 font-bold text-amber-400">
                      Tentativas restantes para o código: {lockoutState.emergencyAttemptsLeft} de 3
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Success Notification */}
            {successNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && !successNotice && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Password / Emergency Code Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  disabled={isEmergencyCodeDisabled}
                  maxLength={10}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder={
                    isEmergencyCodeDisabled
                      ? "Aguarde o cronômetro zerar..."
                      : remainingCooldown > 0 
                      ? `Digite o código (${lockoutState.emergencyAttemptsLeft} tentativas)` 
                      : "Digite a senha (6 dígitos)"
                  }
                  className={`w-full px-4 py-3.5 bg-neutral-900 border rounded-xl text-white font-mono text-center tracking-widest text-xl focus:outline-none transition-all ${
                    isEmergencyCodeDisabled 
                      ? 'opacity-40 cursor-not-allowed border-neutral-800' 
                      : 'border-neutral-700 focus:border-white'
                  }`}
                />

                {!isEmergencyCodeDisabled && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {/* Remaining attempts indicator */}
              {remainingCooldown === 0 && (
                <div className="flex justify-between items-center text-[11px] text-neutral-500 px-1">
                  <span>Tentativas da senha restantes:</span>
                  <span className="font-bold text-neutral-300">
                    {5 - lockoutState.failedAttempts} de 5
                  </span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={isEmergencyCodeDisabled}
                className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 ${
                  isEmergencyCodeDisabled
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                    : ''
                }`}
                style={!isEmergencyCodeDisabled ? {
                  background: selectedUserCandidate === 'livia'
                    ? 'linear-gradient(90deg, #25F4EE, #00C8C8)'
                    : 'linear-gradient(90deg, #FE2C55, #E01740)',
                  color: selectedUserCandidate === 'livia' ? '#000' : '#fff',
                  boxShadow: selectedUserCandidate === 'livia'
                    ? '0 10px 25px -5px rgba(37, 244, 238, 0.25)'
                    : '0 10px 25px -5px rgba(254, 44, 85, 0.25)'
                } : undefined}
              >
                {isEmergencyCodeDisabled
                  ? 'Aguarde o Tempo de Bloqueio'
                  : remainingCooldown > 0 
                  ? `Desbloquear com Código (${lockoutState.emergencyAttemptsLeft} restam)` 
                  : 'Confirmar e Acessar'}
              </button>
            </form>

            {/* Emergency Unlock Hint Footer */}
            <div className="pt-2 text-center text-[10px] text-neutral-500">
              tiktokrecargapro • Se errar as 3 tentativas do código mestre, o tempo deve ser aguardado obrigatoriamente.
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
