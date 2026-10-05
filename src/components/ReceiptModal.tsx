import React, { useState } from 'react';
import { TikTokLogo } from './TikTokLogo';
import { TikTokCoin } from './TikTokCoin';
import { Transaction } from '../types';
import { formatNumber, formatUSD, formatDate } from '../utils/formatters';
import { X, CheckCircle2, Copy, Check, Printer } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopy = () => {
    const text = `COMPROVANTE DE RECARGA TIKTOK
ID: ${transaction.id}
Destinatário: ${transaction.targetUsername}
Moedas TikTok: ${formatNumber(transaction.coins)}
Valor Dólar: ${formatUSD(transaction.totalUsd)} (Cotação: ${formatUSD(transaction.usdRate)}/moeda)
Status: ${transaction.status.toUpperCase()}
Data: ${formatDate(transaction.createdAt)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#161823] text-white rounded-3xl border border-neutral-700/80 shadow-2xl p-6 sm:p-7 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <TikTokLogo size={28} />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="my-5 text-center">
          <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-extrabold text-white">Comprovante de Recarga</h4>
          <p className="text-xs text-neutral-400 mt-0.5">Transação TikTok Coins</p>
        </div>

        <div className="space-y-3 p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-sm">
          <div className="flex justify-between items-center text-xs text-neutral-400">
            <span>ID da Transação</span>
            <span className="font-mono text-neutral-300">{transaction.id}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Destinatário:</span>
            <span className="font-black text-base text-[#25F4EE]">{transaction.targetUsername}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Moedas TikTok:</span>
            <span className="font-extrabold text-amber-400 flex items-center gap-1">
              <TikTokCoin size={16} />
              {formatNumber(transaction.coins)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-neutral-400">Cotação da Moeda:</span>
            <span className="font-medium text-neutral-300">{formatUSD(transaction.usdRate)} / moeda</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-neutral-800 text-base">
            <span className="font-bold text-white">Valor em Dólar:</span>
            <span className="font-black text-white">{formatUSD(transaction.totalUsd)}</span>
          </div>

          <div className="flex justify-between items-center text-xs text-neutral-400 pt-1">
            <span>Status</span>
            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
              transaction.status === 'completed' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : transaction.status === 'pending'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}>
              {transaction.status === 'completed' ? 'Concluída' : transaction.status === 'pending' ? 'Pendente' : 'Cancelada'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-neutral-400">
            <span>Data e Hora</span>
            <span className="text-neutral-300">{formatDate(transaction.createdAt)}</span>
          </div>

          {transaction.note && (
            <div className="pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
              <span className="block font-semibold text-neutral-300 mb-0.5">Observação:</span>
              <p className="italic text-neutral-400">"{transaction.note}"</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs border border-neutral-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs border border-neutral-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>

      </div>
    </div>
  );
};
