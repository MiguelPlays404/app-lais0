import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TikTokCoin } from './TikTokCoin';
import { formatNumber, formatUSD } from '../utils/formatters';
import { 
  Search, 
  CheckCircle2, 
  Sparkles, 
  SlidersHorizontal, 
  ShieldCheck, 
  ArrowRight, 
  Info,
  X,
  AtSign,
  Repeat2,
  Zap
} from 'lucide-react';

interface RechargeViewProps {
  coinRateUsd: number;
  onConfirmRecharge: (targetUsername: string, coins: number, note?: string) => Promise<void>;
  isLoading: boolean;
  initialRepeatData?: { targetUsername: string; coins: number; note?: string } | null;
  onSecretReloadWallet: () => void;
}

export const RechargeView: React.FC<RechargeViewProps> = ({
  coinRateUsd,
  onConfirmRecharge,
  isLoading,
  initialRepeatData,
  onSecretReloadWallet,
}) => {
  // Target username state starts empty
  const [searchInput, setSearchInput] = useState<string>('');
  const [confirmedUsername, setConfirmedUsername] = useState<string>('');
  
  // Exact 6 preset squares: 500, 1000, 1500, 2000, 2500, 5000
  const presets = [500, 1000, 1500, 2000, 2500, 5000];
  const [selectedCoins, setSelectedCoins] = useState<number>(1000);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customInputValue, setCustomInputValue] = useState<string>('3000');
  const [transactionNote, setTransactionNote] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [specialNotice, setSpecialNotice] = useState<string | null>(null);

  // Load repeated transaction data if coming from Admin Panel "Refazer transação"
  useEffect(() => {
    if (initialRepeatData) {
      setSearchInput(initialRepeatData.targetUsername);
      setConfirmedUsername(initialRepeatData.targetUsername);
      
      if (presets.includes(initialRepeatData.coins)) {
        setSelectedCoins(initialRepeatData.coins);
        setIsCustomMode(false);
      } else {
        setIsCustomMode(true);
        setCustomInputValue(String(initialRepeatData.coins));
      }

      setTransactionNote(initialRepeatData.note || '');
      setSpecialNotice(`🔄 Transação carregada para repetição: ${initialRepeatData.targetUsername} com ${formatNumber(initialRepeatData.coins)} moedas.`);
      setTimeout(() => setSpecialNotice(null), 6000);
    }
  }, [initialRepeatData]);

  // Check for the secret 'MMM' search command
  const checkSecretReload = (value: string): boolean => {
    const clean = value.trim().toUpperCase();
    if (clean === 'MMM' || clean === '@MMM') {
      onSecretReloadWallet();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#25F4EE', '#FE2C55', '#FFD700', '#FFFFFF'],
        });
      } catch (e) {
        // Safe fallback
      }
      setSpecialNotice('⚡ Código MMM reconhecido! Saldo recarregado para 8.000.000 de moedas com sucesso.');
      setSearchInput('');
      setConfirmedUsername('');
      setInputError(null);
      setTimeout(() => setSpecialNotice(null), 5000);
      return true;
    }
    return false;
  };

  const handleApplyUsername = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchInput.trim();

    // Check secret code MMM
    if (checkSecretReload(trimmed)) {
      return;
    }

    if (!trimmed) {
      setInputError('Por favor, digite o @ do destinatário.');
      return;
    }
    const clean = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
    setConfirmedUsername(clean);
    setInputError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    setInputError(null);

    // Instant trigger if typed MMM exactly
    if (val.trim().toUpperCase() === 'MMM' || val.trim().toUpperCase() === '@MMM') {
      checkSecretReload(val);
    }
  };

  const handleClearUsername = () => {
    setSearchInput('');
    setConfirmedUsername('');
    setInputError(null);
    setSpecialNotice(null);
  };

  const currentCoins = isCustomMode 
    ? (parseInt(customInputValue.replace(/\D/g, ''), 10) || 0)
    : selectedCoins;

  const currentTotalUsd = currentCoins * coinRateUsd;

  const handleSubmit = async () => {
    const activeUser = confirmedUsername.trim() || (searchInput.trim() ? (searchInput.trim().startsWith('@') ? searchInput.trim() : `@${searchInput.trim()}`) : '');
    
    // Check if user accidentally put MMM as submit
    if (checkSecretReload(activeUser)) {
      return;
    }

    if (!activeUser || activeUser.length < 2) {
      setInputError('Digite e confirme o @ do destinatário para enviar as moedas.');
      return;
    }

    if (currentCoins <= 0) {
      setInputError('Selecione uma quantidade válida de moedas.');
      return;
    }

    setInputError(null);
    await onConfirmRecharge(activeUser, currentCoins, transactionNote);
  };

  const activeTarget = confirmedUsername || (searchInput.trim() ? (searchInput.trim().startsWith('@') ? searchInput.trim() : `@${searchInput.trim()}`) : '');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Secret reload or repeat banner notice */}
      {specialNotice && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-neutral-900 border-2 border-emerald-500/80 text-white shadow-xl flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-emerald-300">{specialNotice}</span>
          </div>
          <button 
            onClick={() => setSpecialNotice(null)} 
            className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Notice */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-700/60 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#FE2C55]/10 border border-[#FE2C55]/20 text-[#FE2C55]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Recarregar: Poupe cerca de 25% com uma taxa de serviços de terceiros mais baixa</span>
              <Info className="w-4 h-4 text-neutral-400 cursor-pointer" />
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Centro Oficial de Moedas TikTok • Cotação: {formatUSD(coinRateUsd)} por TikTok Coin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Transação Segura</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-[#181818] rounded-2xl border border-neutral-800 p-6 md:p-8 shadow-2xl space-y-8">
        
        {/* STEP 1: Search Bar for Recipient @ with Clear X button */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FE2C55] text-white flex items-center justify-center text-xs font-black">1</span>
              Destinatário da Recarga (@)
            </label>
            <span className="text-xs text-neutral-400">
              Digite a conta que receberá as moedas
            </span>
          </div>

          <form onSubmit={handleApplyUsername} className="relative flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Search className="w-5 h-5" />
              </div>

              <input
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                placeholder="Digite o @ do destinatário (ex: @usuario)"
                className="w-full pl-11 pr-10 py-3.5 bg-neutral-900/90 border border-neutral-700 rounded-xl text-white font-medium placeholder-neutral-500 focus:outline-none focus:border-[#FE2C55] focus:ring-2 focus:ring-[#FE2C55]/20 transition-all text-base"
              />

              {/* Clear 'X' inside input */}
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearUsername}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Limpar pesquisa"
                >
                  <X className="w-5 h-5 bg-neutral-800 rounded-full p-0.5" />
                </button>
              )}
            </div>
            
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm border border-neutral-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 text-[#25F4EE]" />
              <span>Confirmar @</span>
            </button>
          </form>

          {inputError && (
            <p className="mt-2 text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <span>⚠️</span> {inputError}
            </p>
          )}

          {/* Prominent @ Display Card with 'X' in the corner */}
          {activeTarget ? (
            <div className="mt-4 p-5 rounded-2xl bg-neutral-900/90 border-2 border-[#FE2C55]/60 shadow-lg flex items-center justify-between relative overflow-hidden animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#FE2C55]/15 text-[#FE2C55] border border-[#FE2C55]/30">
                  <AtSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                    Destinatário Selecionado
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    <span className="text-[#25F4EE]">{activeTarget}</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Pronto para envio" />
                  </div>
                </div>
              </div>

              {/* 'X' in the corner to remove recipient and leave it empty */}
              <button
                type="button"
                onClick={handleClearUsername}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-700 hover:border-rose-500/40 transition-colors cursor-pointer"
                title="Remover destinatário"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="mt-4 p-4 rounded-xl bg-neutral-900/40 border border-dashed border-neutral-800 text-center text-neutral-500 text-xs">
              Nenhum destinatário selecionado. Digite o @ da conta acima para transferir as moedas.
            </div>
          )}
        </div>

        {/* STEP 2: The 6 Exact Preset Squares (500, 1000, 1500, 2000, 2500, 5000) + Personalizar */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <label className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FE2C55] text-white flex items-center justify-center text-xs font-black">2</span>
              Selecione a Quantidade de Moedas
            </label>
            <span className="text-xs font-semibold text-neutral-400">
              1 Moeda TikTok = <strong className="text-amber-400">{formatUSD(coinRateUsd)}</strong>
            </span>
          </div>

          {/* Grid of the 6 requested squares + Personalizar */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-4">
            
            {presets.map((amount) => {
              const isSelected = !isCustomMode && selectedCoins === amount;
              const usdVal = amount * coinRateUsd;

              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setSelectedCoins(amount);
                    setIsCustomMode(false);
                  }}
                  className={`relative p-5 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between group min-h-[115px] ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#FE2C55]/15 via-neutral-900 to-neutral-900 border-[#FE2C55] shadow-lg shadow-[#FE2C55]/15 scale-[1.02]'
                      : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                  }`}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#FE2C55] shadow-sm animate-pulse" />
                  )}

                  {/* Top: TikTok Coin icon + Coin Amount */}
                  <div className="flex items-center gap-2.5">
                    <TikTokCoin size={26} animated={isSelected} />
                    <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {formatNumber(amount)}
                    </span>
                    <span className="text-xs font-bold text-neutral-400">moedas</span>
                  </div>

                  {/* Bottom: Dollar conversion in smaller text */}
                  <div className="mt-3 pt-2 border-t border-neutral-800/80">
                    <span className="text-xs sm:text-sm font-bold text-neutral-300 group-hover:text-white">
                      {formatUSD(usdVal)}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Custom Square */}
            <button
              type="button"
              onClick={() => setIsCustomMode(true)}
              className={`relative p-5 rounded-2xl text-left border-2 transition-all cursor-pointer flex flex-col justify-between group min-h-[115px] col-span-2 md:col-span-3 lg:col-span-3 ${
                isCustomMode
                  ? 'bg-gradient-to-br from-[#25F4EE]/15 via-neutral-900 to-neutral-900 border-[#25F4EE] shadow-lg shadow-[#25F4EE]/15 scale-[1.01]'
                  : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <TikTokCoin size={26} animated={isCustomMode} />
                  <span className="text-xl sm:text-2xl font-black text-white">
                    Personalizar
                  </span>
                  <span className="text-xs text-neutral-400 font-semibold">(digite qualquer quantia)</span>
                </div>
                <SlidersHorizontal className={`w-5 h-5 ${isCustomMode ? 'text-[#25F4EE]' : 'text-neutral-400'}`} />
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-neutral-400">
                  {isCustomMode ? `${formatNumber(currentCoins)} moedas selecionadas` : 'Insira quantia especial'}
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-400">
                  {isCustomMode ? formatUSD(currentTotalUsd) : 'Calcular valor'}
                </span>
              </div>
            </button>

          </div>

          {/* Custom Amount Input Bar if Custom Mode is Active */}
          {isCustomMode && (
            <div className="mt-4 p-4 rounded-xl bg-neutral-900/90 border border-[#25F4EE]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#25F4EE] uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Quantidade Personalizada de Moedas:
                </span>
                <span className="text-xs text-neutral-400">Cada moeda = {formatUSD(coinRateUsd)}</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <TikTokCoin size={20} />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="8000000"
                    step="100"
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    placeholder="Ex: 10000"
                    className="w-full pl-11 pr-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-white font-extrabold text-lg focus:outline-none focus:border-[#25F4EE]"
                  />
                </div>

                <div className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-center sm:text-right">
                  <div className="text-[10px] text-neutral-400 uppercase">Conversão em Dólar</div>
                  <div className="text-base font-black text-amber-400">
                    {formatUSD(currentTotalUsd)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: Summary, Note and Action Button */}
        <div className="pt-6 border-t border-neutral-800 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800">
            <div>
              <div className="text-xs text-neutral-400 uppercase font-semibold">Resumo do Envio</div>
              <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                <span>{formatNumber(currentCoins)} Moedas</span>
                <span className="text-neutral-500 font-normal">→</span>
                <span className="text-[#25F4EE] font-extrabold">
                  {activeTarget || '(Nenhum @ digitado)'}
                </span>
              </div>
              <div className="text-sm text-neutral-400 mt-1 font-medium">
                Total em Dólar: <strong className="text-white font-bold">{formatUSD(currentTotalUsd)}</strong>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xs text-neutral-400 uppercase font-semibold">Valor Total</div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {formatUSD(currentTotalUsd)}
              </div>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
              Observação / Mensagem do Envio (Opcional):
            </label>
            <input
              type="text"
              value={transactionNote}
              onChange={(e) => setTransactionNote(e.target.value)}
              placeholder="Ex: Presente em live, suporte ao criador..."
              maxLength={120}
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-neutral-200 text-sm focus:outline-none focus:border-neutral-500"
            />
          </div>

          {/* Recarregar Action Button */}
          <button
            type="button"
            disabled={isLoading || currentCoins <= 0 || !activeTarget}
            onClick={handleSubmit}
            className={`w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-xl font-black text-base uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-xl active:scale-[0.98] ${
              isLoading || currentCoins <= 0 || !activeTarget
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                : 'bg-gradient-to-r from-[#FE2C55] to-[#E01740] hover:from-[#FF3B65] hover:to-[#F51846] text-white shadow-[#FE2C55]/25 hover:shadow-2xl hover:shadow-[#FE2C55]/30'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando Recarga...
              </span>
            ) : (
              <>
                <TikTokCoin size={22} />
                <span>Recarregar e Enviar ({formatUSD(currentTotalUsd)})</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>

          <p className="text-xs text-neutral-500 text-center sm:text-left">
            Ao confirmar, as moedas serão transferidas para o @ <strong className="text-neutral-400">{activeTarget || '...'}</strong>, debitando do seu saldo em carteira e registrando no painel administrativo.
          </p>

        </div>

      </div>

    </div>
  );
};
