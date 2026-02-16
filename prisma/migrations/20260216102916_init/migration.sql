-- CreateTable
CREATE TABLE "Camera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "protocol" TEXT NOT NULL DEFAULT 'rtsp',
    "streams" TEXT NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "tags" TEXT,
    "location" TEXT,
    "model" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "streamKey" TEXT NOT NULL DEFAULT 'main',
    "action" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL DEFAULT 'continuous',
    "cron" TEXT NOT NULL,
    "cronStop" TEXT,
    "duration" INTEGER,
    "periodStart" TEXT,
    "periodEnd" TEXT,
    "periodRecurrent" BOOLEAN NOT NULL DEFAULT false,
    "outputDir" TEXT NOT NULL,
    "filePattern" TEXT NOT NULL DEFAULT '{cameraName}_{timestamp}',
    "outputFormat" TEXT NOT NULL DEFAULT 'mp4',
    "segmentDuration" INTEGER,
    "codec" TEXT DEFAULT 'copy',
    "resolution" TEXT,
    "quality" INTEGER,
    "extraArgs" TEXT,
    "customCommand" TEXT,
    "commandTimeout" INTEGER,
    "retentionDays" INTEGER,
    "retentionMaxGB" REAL,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" DATETIME,
    "status" TEXT NOT NULL,
    "exitCode" INTEGER,
    "error" TEXT,
    "filesProduced" INTEGER NOT NULL DEFAULT 0,
    "bytesProduced" BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT "JobExecution_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);
