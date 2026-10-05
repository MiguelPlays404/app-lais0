import React from 'react';
import { TikTokLogo } from './TikTokLogo';
import { TikTokCoin } from './TikTokCoin';
import { formatNumber, formatUSD } from '../utils/formatters';
import { LayoutDashboard, Send, Eye, EyeOff, User, ArrowLeftRight } from 'lucide-react';

interface HeaderProps {
  currentUser: 'lais' | 'livia';
  onSwitchUser: () => void;
  currentTab: 'recharge' | 'admin';
  onTabChange: (tab: 'recharge' | 'admin') => void;
  totalTransactionsCount: number;
  coinRateUsd: number;
  userSimulatedBalance: number;
  isBalanceVisible: boolean;
  onToggleBalanceVisibility: () => void;
  isFirebaseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  currentTab,
  onTabChange,
  totalTransactionsCount,
  coinRateUsd,
  userSimulatedBalance,
  isBalanceVisible,
  onToggleBalanceVisibility,
  isFirebaseConnected,
}) => {
  const isLivia = currentUser === 'livia';

  return (
    <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-neutral-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => onTabChange('recharge')}
            className="flex items-center gap-2 cursor-pointer transition-transform hover:opacity-95"
            title="Recarregar Moedas"
          >
            <TikTokLogo size={36} />
          </button>

          {/* User Profile Badge with Quick Switch */}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
            <div className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border shadow-sm ${
              isLivia
                ? 'bg-[#25F4EE]/15 border-[#25F4EE]/40 text-[#25F4EE]'
                : 'bg-[#FE2C55]/15 border-[#FE2C55]/40 text-[#FE2C55]'
            }`}>
              <User className="w-3.5 h-3.5" />
              <span>{isLivia ? 'Lívia' : 'Laís'}</span>
            </div>

            <button
              type="button"
              onClick={onSwitchUser}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Trocar de Usuário (Laís / Lívia)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => onTabChange('recharge')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'recharge'
                  ? isLivia
                    ? 'bg-gradient-to-r from-[#25F4EE] to-[#00C8C8] text-neutral-950 font-bold shadow-md'
                    : 'bg-gradient-to-r from-[#FE2C55] to-[#E01740] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Recarregar Moedas</span>
            </button>

            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? isLivia
                    ? 'bg-gradient-to-r from-[#FE2C55] to-[#E01740] text-white font-bold shadow-md'
                    : 'bg-gradient-to-r from-[#25F4EE] to-[#00C8C8] text-neutral-950 font-bold shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel Administrativo</span>
              <span className="ml-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full bg-neutral-800 text-neutral-300">
                {totalTransactionsCount}
              </span>
            </button>
          </nav>
        </div>

        {/* Right Info and Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Rate indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            <span className="text-neutral-400">Cotação:</span>
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              1 <TikTokCoin size={14} /> = {formatUSD(coinRateUsd)}
            </span>
          </div>

          {/* Wallet Balance Box with Eye Toggle */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800/90 border border-neutral-700/80 shadow-inner">
            <TikTokCoin size={22} animated={true} />
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-end gap-1.5">
                <span>Saldo em Carteira</span>
                <button
                  type="button"
                  onClick={onToggleBalanceVisibility}
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={isBalanceVisible ? "Ocultar saldo" : "Mostrar saldo"}
                >
                  {isBalanceVisible ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="text-sm font-extrabold text-amber-400 tracking-tight leading-none mt-0.5">
                {isBalanceVisible ? (
                  <>
                    {formatNumber(userSimulatedBalance)}
                    <span className="text-[10px] text-neutral-400 font-normal ml-1">
                      ({formatUSD(userSimulatedBalance * coinRateUsd)})
                    </span>
                  </>
                ) : (
                  <span className="tracking-widest text-neutral-300 font-mono text-xs">••••••••</span>
                )}
              </div>
            </div>
          </div>

          {/* Database / Sync Status */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-neutral-900/90 border border-neutral-800"
            title={isFirebaseConnected ? "Conexão Segura Ativa" : "Modo Offline"}
          >
            <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline text-neutral-300 font-medium text-[11px]">
              {isFirebaseConnected ? 'Conectado' : 'Offline'}
            </span>
          </div>

        </div>

      </div>
    </header>
  );
};
