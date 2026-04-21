-- Rename `region` to `regions` (still a comma-separated string, now treated as multi-valued).
-- Existing single-region values become a one-element list automatically.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_user_preferences" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "regions" TEXT NOT NULL,
    "types" TEXT NOT NULL,
    CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_user_preferences" ("user_id", "regions", "types")
SELECT "user_id", "region", "types" FROM "user_preferences";

DROP TABLE "user_preferences";
ALTER TABLE "new_user_preferences" RENAME TO "user_preferences";

PRAGMA foreign_keys=ON;
