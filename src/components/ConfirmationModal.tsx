import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TikTokCoin } from './TikTokCoin';
import { Transaction } from '../types';
import { formatNumber, formatUSD, formatDate } from '../utils/formatters';
import { CheckCircle2, ArrowRight, Receipt, X, AtSign } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onGoToAdmin: () => void;
  onViewReceipt: (tx: Transaction) => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onGoToAdmin,
  onViewReceipt,
}) => {
  useEffect(() => {
    if (isOpen && transaction) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FE2C55', '#25F4EE', '#FFFFFF', '#FFD700', '#FF0050'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#161823] text-white rounded-3xl border border-neutral-700/80 shadow-2xl p-6 sm:p-8 text-center overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-[#FE2C55]/25 via-[#25F4EE]/10 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon & 3D TikTok Coin */}
        <div className="relative mx-auto w-20 h-20 mb-3 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FE2C55]/30 to-[#25F4EE]/30 animate-pulse blur-sm" />
          <div className="relative flex items-center justify-center">
            <TikTokCoin size={64} animated={false} />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 shadow-lg border-2 border-[#161823]">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Main Status Title */}
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Moedas enviadas com sucesso!
        </h3>
        
        <p className="text-xs text-neutral-400 mt-1">
          A recarga foi creditada com sucesso na conta informada.
        </p>

        {/* Highlight Box with ONLY @, Coins and smaller Dollar amount */}
        <div className="mt-6 p-5 rounded-2xl bg-neutral-900/90 border border-neutral-700/80 space-y-3 text-center shadow-inner">
          
          {/* Destinatário (@ em evidência) */}
          <div className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 flex items-center justify-center gap-1">
            <AtSign className="w-3.5 h-3.5 text-[#FE2C55]" />
            <span>Destinatário</span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-[#25F4EE] tracking-tight">
            {transaction.targetUsername}
          </div>

          <div className="w-full border-t border-neutral-800 my-2" />

          {/* Quantia de Moedas do TikTok */}
          <div className="flex items-center justify-center gap-2">
            <TikTokCoin size={26} />
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {formatNumber(transaction.coins)} Moedas TikTok
            </span>
          </div>

          {/* Valor em Dólar abaixo com escrita menor */}
          <div className="text-xs sm:text-sm font-semibold text-neutral-300">
            Valor em Dólar: <span className="font-extrabold text-white text-sm sm:text-base">{formatUSD(transaction.totalUsd)}</span>
          </div>

          <div className="text-[11px] text-neutral-500">
            Cotação: {formatUSD(transaction.usdRate)} / moeda • ID da Transação: {transaction.id.slice(-8)}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm border border-neutral-700 transition-all cursor-pointer"
          >
            Fazer Nova Recarga
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToAdmin();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FE2C55] to-[#E01740] hover:from-[#FF3B65] hover:to-[#F51846] text-white font-bold text-sm shadow-lg shadow-[#FE2C55]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Ver no Painel Admin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Detailed Receipt link */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-center gap-4 text-xs text-neutral-400">
          <button 
            type="button"
            onClick={() => onViewReceipt(transaction)}
            className="hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Visualizar Comprovante da Transação</span>
          </button>
        </div>

      </div>
    </div>
  );
};
