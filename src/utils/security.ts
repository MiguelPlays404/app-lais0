// Security, lockout management and anti-inspection utilities

const LOCKOUT_STORAGE_KEY = 'tiktokrecargapro_auth_lockout_v2';

export interface LockoutState {
  failedAttempts: number;
  totalFailed: number;
  lockoutUntil: number; // Unix timestamp in ms
  tier: number; // 0: normal, 1: 15s, 2: 30s, 3: 45min
  emergencyAttemptsLeft: number; // Max 3 attempts for emergency code 5656
}

export function getLockoutState(): LockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.lockoutUntil === 'number') {
        return {
          failedAttempts: parsed.failedAttempts ?? 0,
          totalFailed: parsed.totalFailed ?? 0,
          lockoutUntil: parsed.lockoutUntil ?? 0,
          tier: parsed.tier ?? 0,
          emergencyAttemptsLeft: typeof parsed.emergencyAttemptsLeft === 'number' ? parsed.emergencyAttemptsLeft : 3,
        };
      }
    }
  } catch (e) {
    console.warn('Error reading lockout state:', e);
  }
  return {
    failedAttempts: 0,
    totalFailed: 0,
    lockoutUntil: 0,
    tier: 0,
    emergencyAttemptsLeft: 3,
  };
}

export function saveLockoutState(state: LockoutState) {
  try {
    localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Error saving lockout state:', e);
  }
}

export function resetLockout(): LockoutState {
  const fresh: LockoutState = {
    failedAttempts: 0,
    totalFailed: 0,
    lockoutUntil: 0,
    tier: 0,
    emergencyAttemptsLeft: 3,
  };
  saveLockoutState(fresh);
  return fresh;
}

export function recordFailedEmergencyCode(): { state: LockoutState; attemptsLeft: number } {
  const current = getLockoutState();
  const left = Math.max(0, current.emergencyAttemptsLeft - 1);
  const updated: LockoutState = {
    ...current,
    emergencyAttemptsLeft: left,
  };
  saveLockoutState(updated);
  return { state: updated, attemptsLeft: left };
}

export function recordFailedAttempt(): { state: LockoutState; isLocked: boolean; remainingSeconds: number } {
  const current = getLockoutState();
  const newFailed = current.failedAttempts + 1;
  const newTotal = current.totalFailed + 1;
  let newTier = current.tier;
  let lockoutUntil = current.lockoutUntil;
  let emergencyAttempts = current.emergencyAttemptsLeft;

  // Escalating lockout schedule:
  // Tier 1 (5 fails): 15 seconds
  // Tier 2 (10 fails): 30 seconds
  // Tier 3 (15+ fails): 45 minutes
  if (newFailed >= 5) {
    if (newTier === 0) {
      newTier = 1;
      lockoutUntil = Date.now() + 15 * 1000; // 15 seconds
    } else if (newTier === 1) {
      newTier = 2;
      lockoutUntil = Date.now() + 30 * 1000; // 30 seconds
    } else {
      newTier = 3;
      lockoutUntil = Date.now() + 45 * 60 * 1000; // 45 minutes
      emergencyAttempts = 3; // Reset to 3 attempts when entering 45 minutes lockout
    }
  }

  const updated: LockoutState = {
    failedAttempts: newFailed >= 5 ? 0 : newFailed,
    totalFailed: newTotal,
    lockoutUntil,
    tier: newTier,
    emergencyAttemptsLeft: emergencyAttempts,
  };

  saveLockoutState(updated);
  const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
  return {
    state: updated,
    isLocked: remaining > 0,
    remainingSeconds: remaining,
  };
}

/**
 * Validates password ('190103') or master unlock code ('5656')
 */
export async function verifyPassword(input: string): Promise<{ success: boolean; isEmergencyUnlock: boolean }> {
  const trimmed = input.trim();
  
  // Emergency unlock code 5656
  if (trimmed === '5656') {
    resetLockout();
    return { success: true, isEmergencyUnlock: true };
  }

  // Official Password 190103
  if (trimmed === '190103') {
    resetLockout();
    return { success: true, isEmergencyUnlock: false };
  }

  // Also support SHA-256 match for encrypted verification
  try {
    const msgBuffer = new TextEncoder().encode(trimmed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Hash of 190103: c30f4a8697669d2f2d9e60ea9141029ba879101c4566c72e4726e6d11f7c5eec
    // Hash of 5656: 836d5ba59218d6c701f5c6adfae654eb6a0b9432653835f8c37107db3adcdfd2
    if (hashHex === 'c30f4a8697669d2f2d9e60ea9141029ba879101c4566c72e4726e6d11f7c5eec') {
      resetLockout();
      return { success: true, isEmergencyUnlock: false };
    }
    if (hashHex === '836d5ba59218d6c701f5c6adfae654eb6a0b9432653835f8c37107db3adcdfd2') {
      resetLockout();
      return { success: true, isEmergencyUnlock: true };
    }
  } catch (e) {
    // Fallback
  }

  return { success: false, isEmergencyUnlock: false };
}

/**
 * Initializes anti-inspection, right-click, and shortcut guards
 */
export function initAntiInspection(onBlocked?: (action: string) => void) {
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    if (onBlocked) onBlocked('Clique com botão direito desabilitado por segurança.');
    return false;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F12') {
      e.preventDefault();
      if (onBlocked) onBlocked('Atalho F12 desabilitado por segurança.');
      return false;
    }

    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === 'u' || e.key === 'U' ||
       ((e.shiftKey || e.altKey) && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J' || e.key === 'c' || e.key === 'C')))
    ) {
      e.preventDefault();
      if (onBlocked) onBlocked('Atalho de inspeção bloqueado por segurança.');
      return false;
    }
  };

  window.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('contextmenu', handleContextMenu);
    window.removeEventListener('keydown', handleKeyDown);
  };
}
