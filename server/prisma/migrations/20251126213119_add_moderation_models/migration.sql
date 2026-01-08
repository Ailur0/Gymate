-- CreateTable
CREATE TABLE "ModerationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "keywordHits" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolvedById" TEXT,
    CONSTRAINT "ModerationItem_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "otpSecret" TEXT,
    "otpExpiry" DATETIME,
    "displayName" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "fitnessLevel" TEXT,
    "primaryGoal" TEXT,
    "workout_times_json" TEXT,
    "interests_json" TEXT,
    "bio" TEXT,
    "profilePhotoUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "isSnoozed" BOOLEAN NOT NULL DEFAULT false,
    "isModerator" BOOLEAN NOT NULL DEFAULT false,
    "locationLat" REAL,
    "locationLng" REAL,
    "locationName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("age", "bio", "countryCode", "createdAt", "displayName", "fitnessLevel", "gender", "id", "interests_json", "isSnoozed", "locationLat", "locationLng", "locationName", "otpExpiry", "otpSecret", "phone", "primaryGoal", "profilePhotoUrl", "updatedAt", "verified", "workout_times_json") SELECT "age", "bio", "countryCode", "createdAt", "displayName", "fitnessLevel", "gender", "id", "interests_json", "isSnoozed", "locationLat", "locationLng", "locationName", "otpExpiry", "otpSecret", "phone", "primaryGoal", "profilePhotoUrl", "updatedAt", "verified", "workout_times_json" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
