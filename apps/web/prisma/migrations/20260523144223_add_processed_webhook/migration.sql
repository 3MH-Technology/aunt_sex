-- CreateTable
CREATE TABLE "ProcessedWebhook" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedWebhook_eventId_key" ON "ProcessedWebhook"("eventId");

-- CreateIndex
CREATE INDEX "ProcessedWebhook_eventId_idx" ON "ProcessedWebhook"("eventId");

-- CreateIndex
CREATE INDEX "ProcessedWebhook_orderId_idx" ON "ProcessedWebhook"("orderId");
