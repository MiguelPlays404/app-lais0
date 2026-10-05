import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { TikTokCoin } from './TikTokCoin';
import { formatNumber, formatUSD, formatDate } from '../utils/formatters';
import { 
  LayoutDashboard, 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ReceiptText, 
  DollarSign, 
  Repeat2, 
  Sliders, 
  Plus, 
  FileSpreadsheet,
  ArrowUpDown,
  AtSign,
  Eraser,
  AlertTriangle,
  X
} from 'lucide-react';

interface AdminPanelProps {
  currentUser?: 'lais' | 'livia';
  transactions: Transaction[];
  coinRateUsd: number;
  onUpdateRate: (newRate: number) => void;
  onUpdateStatus: (id: string, status: Transaction['status']) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onOpenReceipt: (tx: Transaction) => void;
  onRepeatTransaction: (tx: Transaction) => void;
  onNewRecharge: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser = 'lais',
  transactions,
  coinRateUsd,
  onUpdateRate,
  onUpdateStatus,
  onDeleteTransaction,
  onClearAll,
  onOpenReceipt,
  onRepeatTransaction,
  onNewRecharge,
}) => {
  const isLivia = currentUser === 'livia';

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'coins_desc'>('date_desc');
  const [editingRate, setEditingRate] = useState(false);
  const [newRateInput, setNewRateInput] = useState(String(coinRateUsd));
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // In-DOM modal states (replacing window.confirm)
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCoins = transactions.reduce((acc, t) => acc + (t.status !== 'cancelled' ? t.coins : 0), 0);
    const totalUsd = transactions.reduce((acc, t) => acc + (t.status !== 'cancelled' ? t.totalUsd : 0), 0);
    const completedCount = transactions.filter(t => t.status === 'completed').length;
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const cancelledCount = transactions.filter(t => t.status === 'cancelled').length;

    return {
      totalCoins,
      totalUsd,
      completedCount,
      pendingCount,
      cancelledCount,
      totalCount: transactions.length,
    };
  }, [transactions]);

  // Filtered & sorted list
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch = 
          t.targetUsername.toLowerCase().includes(searchFilter.toLowerCase()) ||
          t.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (t.note && t.note.toLowerCase().includes(searchFilter.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'coins_desc') return b.coins - a.coins;
        if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [transactions, searchFilter, statusFilter, sortBy]);

  const handleStatusChange = async (id: string, newStatus: Transaction['status']) => {
    setActionLoadingId(id);
    try {
      await onUpdateStatus(id, newStatus);
      showToast(`Status atualizado para ${newStatus.toUpperCase()}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    const id = txToDelete.id;
    const username = txToDelete.targetUsername;
    setTxToDelete(null);
    setActionLoadingId(id);
    try {
      await onDeleteTransaction(id);
      showToast(`Transação de ${username} excluída com sucesso!`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmClearAll = async () => {
    setShowClearAllModal(false);
    try {
      await onClearAll();
      showToast('Todas as transações foram apagadas do painel!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRate = () => {
    const val = parseFloat(newRateInput);
    if (!isNaN(val) && val > 0) {
      onUpdateRate(val);
      setEditingRate(false);
      showToast(`Cotação atualizada para US$ ${val.toFixed(2)} / moeda`);
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID,Destinatario,Moedas,CotacaoUSD,TotalUSD,Status,Data,Observacao\n'];
    const rows = filteredTransactions.map((t) => 
      `"${t.id}","${t.targetUsername}",${t.coins},${t.usdRate},${t.totalUsd},"${t.status}","${t.createdAt}","${(t.note || '').replace(/"/g, '""')}"`
    );
    const blob = new Blob([headers.join('') + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tiktok_recargas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha CSV exportada com sucesso!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl bg-neutral-900 border-2 text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          isLivia ? 'border-[#FE2C55]' : 'border-[#25F4EE]'
        }`}>
          <CheckCircle className={`w-5 h-5 shrink-0 ${isLivia ? 'text-[#FE2C55]' : 'text-[#25F4EE]'}`} />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-xl border ${
              isLivia 
                ? 'bg-[#FE2C55]/10 border-[#FE2C55]/30 text-[#FE2C55]' 
                : 'bg-[#25F4EE]/10 border-[#25F4EE]/30 text-[#25F4EE]'
            }`}>
              <LayoutDashboard className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Painel Administrativo</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                isLivia ? 'bg-[#25F4EE]/20 text-[#25F4EE]' : 'bg-[#FE2C55]/20 text-[#FE2C55]'
              }`}>
                {isLivia ? 'Lívia' : 'Laís'}
              </span>
            </h1>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Gestão de transações e movimentações da conta em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {transactions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearAllModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 font-semibold text-xs border border-neutral-800 hover:border-rose-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Zerar todos os registros do painel"
            >
              <Eraser className="w-4 h-4 text-rose-400" />
              <span>Zerar Painel</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={transactions.length === 0}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-neutral-200 font-semibold text-xs border border-neutral-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          {/* Action button: Inverted color for Lívia */}
          <button
            type="button"
            onClick={onNewRecharge}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
              isLivia
                ? 'bg-gradient-to-r from-[#25F4EE] to-[#00C8C8] hover:from-[#40FFFF] hover:to-[#12E5E5] text-neutral-950 shadow-[#25F4EE]/20'
                : 'bg-gradient-to-r from-[#FE2C55] to-[#E01740] hover:from-[#FF3B65] hover:to-[#F51846] text-white shadow-[#FE2C55]/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nova Recarga</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Moedas */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Moedas Transacionadas</span>
            <TikTokCoin size={20} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {formatNumber(stats.totalCoins)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Total debitado e enviado
          </div>
        </div>

        {/* Total USD */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Volume em Dólar</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
            {formatUSD(stats.totalUsd)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Valor em USD (US$ {coinRateUsd.toFixed(2)}/moeda)
          </div>
        </div>

        {/* Total Transações */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Transações</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-semibold">
              {stats.totalCount} total
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm font-bold">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> {stats.completedCount}
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <Clock className="w-4 h-4" /> {stats.pendingCount}
            </span>
            <span className="text-rose-400 flex items-center gap-1">
              <XCircle className="w-4 h-4" /> {stats.cancelledCount}
            </span>
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            Concluídas / Pendentes / Canceladas
          </div>
        </div>

        {/* Cotação do Dólar por Moeda */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Cotação Unitária</span>
            <button
              onClick={() => setEditingRate(!editingRate)}
              className={`hover:underline text-xs flex items-center gap-1 cursor-pointer ${
                isLivia ? 'text-[#FE2C55]' : 'text-[#25F4EE]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{editingRate ? 'Fechar' : 'Ajustar'}</span>
            </button>
          </div>

          {!editingRate ? (
            <>
              <div className={`text-2xl sm:text-3xl font-black mt-2 ${
                isLivia ? 'text-[#25F4EE]' : 'text-[#25F4EE]'
              }`}>
                {formatUSD(coinRateUsd)}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                1 moeda = {formatUSD(coinRateUsd)}
              </div>
            </>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newRateInput}
                onChange={(e) => setNewRateInput(e.target.value)}
                className="w-24 px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-white text-sm font-bold"
              />
              <button
                type="button"
                onClick={handleSaveRate}
                className={`px-2.5 py-1 font-bold rounded text-xs cursor-pointer ${
                  isLivia ? 'bg-[#FE2C55] text-white' : 'bg-[#25F4EE] text-neutral-950'
                }`}
              >
                Salvar
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar por @destinatário ou ID..."
            className={`w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-700/80 rounded-xl text-white text-sm placeholder-neutral-500 focus:outline-none ${
              isLivia ? 'focus:border-[#25F4EE]' : 'focus:border-[#FE2C55]'
            }`}
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-neutral-950'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Todas ({transactions.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-500 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-emerald-400'
            }`}
          >
            Concluídas
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-neutral-950 font-black'
                : 'bg-neutral-800 text-neutral-400 hover:text-amber-400'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'cancelled'
                ? 'bg-rose-500 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-rose-400'
            }`}
          >
            Canceladas
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-neutral-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-neutral-950 border border-neutral-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-300 focus:outline-none focus:border-neutral-500"
          >
            <option value="date_desc">Mais recentes primeiro</option>
            <option value="date_asc">Mais antigas primeiro</option>
            <option value="coins_desc">Maior valor de moedas</option>
          </select>
        </div>

      </div>

      {/* Main Table */}
      <div className="bg-[#181818] rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-900/90 border-b border-neutral-800 text-neutral-400 text-xs uppercase font-bold tracking-wider">
                <th className="py-4 px-4 sm:px-6">Destinatário (@)</th>
                <th className="py-4 px-4">Moedas TikTok</th>
                <th className="py-4 px-4">Valor em Dólar</th>
                <th className="py-4 px-4">Status & Gestão</th>
                <th className="py-4 px-4">Data / ID</th>
                <th className="py-4 px-4 sm:px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AtSign className="w-8 h-8 text-neutral-600" />
                      <span className="font-semibold text-neutral-400">Nenhuma transação registrada</span>
                      <span className="text-xs text-neutral-500">
                        As operações de recarga realizadas aparecerão aqui.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isActionLoading = actionLoadingId === tx.id;

                  return (
                    <tr 
                      key={tx.id}
                      className="hover:bg-neutral-850/60 transition-colors group"
                    >
                      {/* Destinatário with inverted color on Lívia */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2.5">
                          <span className={`p-1.5 rounded-lg border ${
                            isLivia
                              ? 'bg-[#25F4EE]/10 text-[#25F4EE] border-[#25F4EE]/30'
                              : 'bg-[#FE2C55]/10 text-[#FE2C55] border-[#FE2C55]/30'
                          }`}>
                            <AtSign className="w-4 h-4" />
                          </span>
                          <span className={`font-black text-base tracking-tight ${
                            isLivia ? 'text-[#FE2C55]' : 'text-[#25F4EE]'
                          }`}>
                            {tx.targetUsername}
                          </span>
                        </div>
                      </td>

                      {/* Moedas */}
                      <td className="py-4 px-4 font-black text-amber-400">
                        <div className="flex items-center gap-1.5">
                          <TikTokCoin size={18} />
                          <span>{formatNumber(tx.coins)}</span>
                        </div>
                        {tx.note && (
                          <div className="text-[11px] text-neutral-500 font-normal italic truncate max-w-[160px]">
                            {tx.note}
                          </div>
                        )}
                      </td>

                      {/* Valor em Dólar */}
                      <td className="py-4 px-4 font-bold text-white">
                        <div>{formatUSD(tx.totalUsd)}</div>
                        <div className="text-[10px] text-neutral-400 font-medium">
                          {formatUSD(tx.usdRate)} / moeda
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-4">
                        <select
                          disabled={isActionLoading}
                          value={tx.status}
                          onChange={(e) => handleStatusChange(tx.id, e.target.value as any)}
                          className={`text-xs font-extrabold uppercase rounded-lg px-2.5 py-1.5 border transition-all cursor-pointer ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          }`}
                        >
                          <option value="completed" className="bg-neutral-900 text-emerald-400 font-bold">Concluída</option>
                          <option value="pending" className="bg-neutral-900 text-amber-400 font-bold">Pendente</option>
                          <option value="cancelled" className="bg-neutral-900 text-rose-400 font-bold">Cancelada</option>
                        </select>
                      </td>

                      {/* Data & ID */}
                      <td className="py-4 px-4 text-xs text-neutral-400">
                        <div className="text-neutral-200 font-medium">{formatDate(tx.createdAt)}</div>
                        <div className="font-mono text-[10px] text-neutral-500">{tx.id}</div>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* 1. Receipt Icon Button */}
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(tx)}
                            title="Ver Comprovante Oficial"
                            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            <ReceiptText className="w-4 h-4 text-neutral-200" />
                          </button>

                          {/* 2. Repeat Icon Button */}
                          <button
                            type="button"
                            onClick={() => onRepeatTransaction(tx)}
                            title="Refazer esta transação de moedas"
                            className={`p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 transition-all cursor-pointer shadow-sm active:scale-95 ${
                              isLivia
                                ? 'hover:bg-[#25F4EE]/20 text-neutral-300 hover:text-[#25F4EE] hover:border-[#25F4EE]/40'
                                : 'hover:bg-[#FE2C55]/20 text-neutral-300 hover:text-[#FE2C55] hover:border-[#FE2C55]/40'
                            }`}
                          >
                            <Repeat2 className="w-4 h-4" />
                          </button>

                          {/* 3. Delete Icon Button */}
                          <button
                            type="button"
                            onClick={() => setTxToDelete(tx)}
                            title="Excluir esta transação"
                            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/40 transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IN-DOM MODAL: Confirm Delete Transaction */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#181818] border border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-400 font-black text-lg">
                <Trash2 className="w-5 h-5" />
                <span>Excluir Transação?</span>
              </div>
              <button
                onClick={() => setTxToDelete(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-neutral-300">
              Tem certeza que deseja apagar a transação de <strong className={isLivia ? 'text-[#FE2C55]' : 'text-[#25F4EE]'}>{txToDelete.targetUsername}</strong> no valor de <strong className="text-amber-400">{formatNumber(txToDelete.coins)} moedas</strong> ({formatUSD(txToDelete.totalUsd)})?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-semibold cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-DOM MODAL: Confirm Clear All Transactions */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#181818] border border-rose-500/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-400 font-black text-lg">
                <AlertTriangle className="w-5 h-5" />
                <span>Zerar Todo o Painel?</span>
              </div>
              <button
                onClick={() => setShowClearAllModal(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-neutral-300">
              Esta ação removerá todas as {transactions.length} transações salvas. O histórico começará vazio novamente.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-semibold cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Sim, Zerar Painel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
