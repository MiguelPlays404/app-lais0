/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { Transaction } from './types';
import { 
  subscribeTransactions, 
  createTransaction, 
  updateTransactionStatus, 
  deleteTransaction,
  clearAllTransactions,
  getCachedTransactions
} from './services/transactionService';
import { Header } from './components/Header';
import { RechargeView } from './components/RechargeView';
import { AdminPanel } from './components/AdminPanel';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ReceiptModal } from './components/ReceiptModal';
import { TikTokLogo } from './components/TikTokLogo';
import { UserSelectScreen } from './components/UserSelectScreen';
import { initAntiInspection } from './utils/security';
import { ShieldAlert } from 'lucide-react';

const WALLET_STORAGE_KEY = 'tiktok_wallet_balance_v3';
const INITIAL_WALLET_BALANCE = 8000000; // 8 milhões de moedas
const USER_SESSION_KEY = 'tiktok_active_user';

export default function App() {
  // Current logged in user ('lais' | 'livia' | null)
  const [currentUser, setCurrentUser] = useState<'lais' | 'livia' | null>(() => {
    try {
      const saved = localStorage.getItem(USER_SESSION_KEY);
      if (saved === 'lais' || saved === 'livia') return saved;
    } catch (e) {
      console.warn('Could not read saved user:', e);
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<'recharge' | 'admin'>('recharge');
  const [transactions, setTransactions] = useState<Transaction[]>(getCachedTransactions());
  
  // Rate: each coin is 0.12 dollars
  const [coinRateUsd, setCoinRateUsd] = useState<number>(0.12);

  // Security toast notification
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  // Wallet balance: initialized to 8 million and persisted across usage
  const [userSimulatedBalance, setUserSimulatedBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(WALLET_STORAGE_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved wallet balance:', e);
    }
    return INITIAL_WALLET_BALANCE;
  });

  // Eye toggle state (show/hide balance)
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Data to repeat transaction
  const [repeatData, setRepeatData] = useState<{ targetUsername: string; coins: number; note?: string } | null>(null);

  // Modals state
  const [confirmationTx, setConfirmationTx] = useState<Transaction | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Initialize anti-inspection guards (disables right-click, F12, DevTools shortcuts)
  useEffect(() => {
    const cleanup = initAntiInspection((reason) => {
      setSecurityAlert(reason);
      setTimeout(() => setSecurityAlert(null), 3000);
    });
    return cleanup;
  }, []);

  // Validate connection to Firestore on initial boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setIsFirebaseConnected(true);
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn('Firebase client offline, running in cached mode.');
          setIsFirebaseConnected(false);
        } else {
          setIsFirebaseConnected(true);
        }
      }
    }
    testConnection();
  }, []);

  // Real-time subscription to transactions
  useEffect(() => {
    const unsubscribe = subscribeTransactions(
      (data) => {
        setTransactions(data);
      },
      (err) => {
        console.warn('Subscription error:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Update wallet balance in storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, String(userSimulatedBalance));
    } catch (e) {
      console.warn('Could not save wallet balance:', e);
    }
  }, [userSimulatedBalance]);

  // Handle user select
  const handleSelectUser = (user: 'lais' | 'livia') => {
    setCurrentUser(user);
    try {
      localStorage.setItem(USER_SESSION_KEY, user);
    } catch (e) {
      console.warn('Could not save active user:', e);
    }
  };

  const handleSwitchUser = () => {
    setCurrentUser(null);
  };

  // Secret code MMM reload handler
  const handleSecretReloadWallet = () => {
    setUserSimulatedBalance(8000000);
    localStorage.setItem(WALLET_STORAGE_KEY, '8000000');
  };

  // Handle Recharge Confirmation
  const handleConfirmRecharge = async (targetUsername: string, coins: number, note?: string) => {
    setIsLoading(true);
    try {
      const totalUsd = coins * coinRateUsd;
      const cleanUsername = targetUsername.startsWith('@') ? targetUsername.trim() : `@${targetUsername.trim()}`;
      
      const newTx = await createTransaction({
        targetUsername: cleanUsername,
        coins,
        usdRate: coinRateUsd,
        totalUsd,
        senderName: currentUser === 'livia' ? 'Lívia' : 'Laís',
        status: 'completed',
        note: note || '',
        createdAt: new Date().toISOString(),
      });

      // Optimistically update transactions in memory immediately
      setTransactions((prev) => [newTx, ...prev.filter(t => t.id !== newTx.id)]);

      // Decrement wallet balance according to transactions
      setUserSimulatedBalance((prev) => Math.max(0, prev - coins));

      // Reset repeatData if consumed
      setRepeatData(null);

      // Open confirmation modal
      setConfirmationTx(newTx);
      setIsConfirmationOpen(true);
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('Houve um erro ao registrar a recarga.');
    } finally {
      setIsLoading(false);
    }
  };

  // Status update
  const handleUpdateStatus = async (id: string, status: Transaction['status']) => {
    setTransactions((prev) => prev.map(t => t.id === id ? { ...t, status } : t));
    try {
      await updateTransactionStatus(id, status);
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter(t => t.id !== id));
    try {
      await deleteTransaction(id);
    } catch (e) {
      console.error('Error deleting transaction:', e);
    }
  };

  // Clear all transactions from admin panel
  const handleClearAll = async () => {
    setTransactions([]);
    try {
      await clearAllTransactions();
    } catch (e) {
      console.error('Error clearing transactions:', e);
    }
  };

  // Open receipt modal
  const handleOpenReceipt = (tx: Transaction) => {
    setReceiptTx(tx);
    setIsReceiptOpen(true);
  };

  // Repeat transaction: fills data and opens recharge view
  const handleRepeatTransaction = (tx: Transaction) => {
    setRepeatData({
      targetUsername: tx.targetUsername,
      coins: tx.coins,
      note: tx.note,
    });
    setCurrentTab('recharge');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If no user selected yet, show the Login / User Select Screen with Password Verification
  if (!currentUser) {
    return <UserSelectScreen onSelectUser={handleSelectUser} />;
  }

  return (
    <div className="min-h-screen bg-[#0e0f14] text-neutral-100 flex flex-col font-sans selection:bg-[#FE2C55] selection:text-white relative">
      
      {/* Security alert toast when dev tools or right click is attempted */}
      {securityAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-neutral-900/95 border-2 border-amber-500/80 text-amber-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>{securityAlert}</span>
        </div>
      )}

      {/* Header with User Switcher, Eye toggle and 8 million balance */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        totalTransactionsCount={transactions.length}
        coinRateUsd={coinRateUsd}
        userSimulatedBalance={userSimulatedBalance}
        isBalanceVisible={isBalanceVisible}
        onToggleBalanceVisibility={() => setIsBalanceVisible(!isBalanceVisible)}
        isFirebaseConnected={isFirebaseConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {currentTab === 'recharge' ? (
          <RechargeView
            currentUser={currentUser}
            coinRateUsd={coinRateUsd}
            onConfirmRecharge={handleConfirmRecharge}
            isLoading={isLoading}
            initialRepeatData={repeatData}
            onSecretReloadWallet={handleSecretReloadWallet}
          />
        ) : (
          <AdminPanel
            currentUser={currentUser}
            transactions={transactions}
            coinRateUsd={coinRateUsd}
            onUpdateRate={(newRate) => setCoinRateUsd(newRate)}
            onUpdateStatus={handleUpdateStatus}
            onDeleteTransaction={handleDeleteTransaction}
            onClearAll={handleClearAll}
            onOpenReceipt={handleOpenReceipt}
            onRepeatTransaction={handleRepeatTransaction}
            onNewRecharge={() => setCurrentTab('recharge')}
          />
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        transaction={confirmationTx}
        onGoToAdmin={() => setCurrentTab('admin')}
        onViewReceipt={handleOpenReceipt}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={receiptTx}
      />

      {/* Simple Minimal Footer with Rights Reserved */}
      <footer className="bg-[#121212] border-t border-neutral-800/80 py-6 px-4 sm:px-6 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          
          <div className="flex items-center gap-3">
            <TikTokLogo size={22} />
            <span className="text-neutral-500 font-medium">
              © {new Date().getFullYear()} tiktokrecargapro • Todos os direitos reservados • Painel de {currentUser === 'livia' ? 'Lívia' : 'Laís'}
            </span>
          </div>

          <div className="flex items-center gap-6 text-neutral-500 text-xs">
            <button 
              onClick={() => setCurrentTab('recharge')}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentTab === 'recharge' 
                  ? (currentUser === 'livia' ? 'text-[#25F4EE] font-semibold' : 'text-[#FE2C55] font-semibold')
                  : ''
              }`}
            >
              Recarregar
            </button>
            <button 
              onClick={() => setCurrentTab('admin')}
              className={`hover:text-white transition-colors cursor-pointer ${
                currentTab === 'admin' 
                  ? (currentUser === 'livia' ? 'text-[#FE2C55] font-semibold' : 'text-[#25F4EE] font-semibold')
                  : ''
              }`}
            >
              Painel Administrativo
            </button>
            <button
              onClick={handleSwitchUser}
              className="hover:text-neutral-300 text-neutral-400 underline cursor-pointer"
            >
              Trocar de Usuário
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
}
