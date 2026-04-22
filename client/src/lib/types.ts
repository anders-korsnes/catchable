// Wire-format types. Kept in sync with the server by hand to avoid bundling Prisma.

export interface User {
  id: string;
  username: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export interface Preferences {
  regions: string[];
  types: string[];
  /** Empty array means "all difficulties". */
  difficulties: Difficulty[];
}

export interface NamedRef {
  name: string;
}

export interface PokemonSummary {
  id: number;
  name: string;
  displayName: string;
  types: string[];
  height: number;
  weight: number;
  baseExperience: number | null;
  hp: number | null;
  moves: string[];
  imageUrl: string | null;
}

export interface Joke {
  id: string;
  value: string;
  category: string | null;
}

export interface DeckResponse {
  pokemon: PokemonSummary | null;
  joke?: Joke;
  remaining: number;
}

export interface LikedItem {
  pokemon: PokemonSummary;
  joke?: Joke | null;
  regions: string[];
  likedAt: string;
}

export type AchievementCategory =
  | 'progression'
  | 'difficulty'
  | 'completion'
  | 'special';

export interface AchievementListItem {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  hidden: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  order: number;
}

export interface AchievementsResponse {
  total: number;
  unlocked: number;
  items: AchievementListItem[];
}

export interface UnlockedAchievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  hidden: boolean;
}

export interface ChoiceResponse {
  ok: true;
  newAchievements: UnlockedAchievement[];
}
