import { CreatorProfile } from '../types';

export const POPULAR_CREATORS: CreatorProfile[] = [
  {
    username: '@khaby.lame',
    displayName: 'Khabane Lame',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    followers: '162.8M',
    verified: true,
    bio: 'Se vuoi ridere sei nel posto giusto 😎 Se non ridi ti rimborsiamo',
  },
  {
    username: '@mrbeast',
    displayName: 'MrBeast',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    followers: '104.2M',
    verified: true,
    bio: 'I want to make the world a better place before I die.',
  },
  {
    username: '@luvadepedreiro',
    displayName: 'Iran Ferreira (Luva)',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    followers: '21.5M',
    verified: true,
    bio: 'RECEBA! O melhor do mundo, graças a Deus Pai! SIUUU',
  },
  {
    username: '@anitta',
    displayName: 'Anitta',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    followers: '23.1M',
    verified: true,
    bio: 'Funk Generation. New album out now!',
  },
  {
    username: '@virginiafonseca',
    displayName: 'Virginia',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    followers: '37.8M',
    verified: true,
    bio: 'Mãe da Maria Alice, Maria Flor e José Leonardo 💖 WePink',
  },
  {
    username: '@neymarjr',
    displayName: 'Neymar Jr',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    followers: '32.4M',
    verified: true,
    bio: 'Filho de Deus, Pai e Atleta ⚽',
  },
  {
    username: '@charlidamelio',
    displayName: 'charli d’amelio',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    followers: '154.6M',
    verified: true,
    bio: 'i am a megan thee stallion stan for life',
  },
];

export function getCreatorByUsername(username: string): CreatorProfile {
  const clean = username.trim().toLowerCase();
  const found = POPULAR_CREATORS.find(c => c.username.toLowerCase() === clean);
  if (found) return found;

  const rawName = clean.replace('@', '') || 'usuario';
  // Deterministic avatar based on username
  const seed = encodeURIComponent(rawName);
  return {
    username: clean.startsWith('@') ? clean : `@${clean}`,
    displayName: rawName.charAt(0).toUpperCase() + rawName.slice(1),
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
    followers: `${(Math.floor(Math.random() * 850) + 50) / 10}K`,
    verified: clean.includes('oficial') || clean.includes('vip'),
    bio: `Perfil de criador TikTok @${rawName}`,
  };
}
