-- Adds a `difficulties` column to user_preferences. Comma-separated subset of
-- 'easy' | 'medium' | 'hard' | 'legendary'; empty string means "all difficulties".
ALTER TABLE "user_preferences" ADD COLUMN "difficulties" TEXT NOT NULL DEFAULT '';
