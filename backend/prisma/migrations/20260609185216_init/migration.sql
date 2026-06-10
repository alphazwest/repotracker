-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'ERROR', 'PENDING');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "handle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repo" (
    "id" UUID NOT NULL,
    "githubId" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "authorUrl" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "watchers" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "languages" JSONB NOT NULL DEFAULT '[]',
    "latestReleaseVersion" TEXT,
    "latestReleasePublishedAt" TIMESTAMP(3),
    "latestReleaseUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncStatus" "SyncStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRepo" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "repoId" UUID NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenReleaseVersion" TEXT,

    CONSTRAINT "UserRepo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Repo_githubId_key" ON "Repo"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "Repo_owner_name_key" ON "Repo"("owner", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserRepo_userId_repoId_key" ON "UserRepo"("userId", "repoId");

-- AddForeignKey
ALTER TABLE "UserRepo" ADD CONSTRAINT "UserRepo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRepo" ADD CONSTRAINT "UserRepo_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

