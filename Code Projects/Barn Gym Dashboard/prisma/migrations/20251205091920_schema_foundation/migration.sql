-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('LEAD', 'CLIENT');

-- CreateTable
CREATE TABLE "ConnectionSecret" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "secret" JSONB,
    "webhookSecret" TEXT,
    "status" TEXT,
    "accountId" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "glofoxMemberId" TEXT,
    "stripeCustomerId" TEXT,
    "ghlContactId" TEXT,
    "fullName" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "goal" TEXT,
    "status" "LeadStatus",
    "source" TEXT,
    "isClient" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "zipCode" TEXT,
    "primaryMembershipPlan" TEXT,
    "tags" JSONB,
    "channel" TEXT,
    "stage" TEXT DEFAULT 'New',
    "owner" TEXT,
    "nextStep" TEXT,
    "valueMinor" INTEGER,
    "membershipName" TEXT,
    "metadata" JSONB,
    "ltvAllCents" INTEGER NOT NULL DEFAULT 0,
    "ltvAdsCents" INTEGER NOT NULL DEFAULT 0,
    "ltvPTCents" INTEGER NOT NULL DEFAULT 0,
    "ltvClassesCents" INTEGER NOT NULL DEFAULT 0,
    "ltvSixWeekCents" INTEGER NOT NULL DEFAULT 0,
    "ltvOnlineCoachingCents" INTEGER NOT NULL DEFAULT 0,
    "ltvCommunityCents" INTEGER NOT NULL DEFAULT 0,
    "ltvCorporateCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "externalPaymentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "productName" TEXT,
    "productType" TEXT,
    "sourceSystem" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdsRevenue" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdsRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdsSpend" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdsSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaAdAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "currency" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaAdAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaCampaign" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT,
    "objective" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaAdSet" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "campaignId" TEXT,
    "name" TEXT,
    "status" TEXT,
    "optimizationGoal" TEXT,
    "billingEvent" TEXT,
    "dailyBudget" INTEGER,
    "lifetimeBudget" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaAdSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaAd" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "campaignId" TEXT,
    "adsetId" TEXT,
    "name" TEXT,
    "status" TEXT,
    "creativeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaAd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaDailyInsight" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "campaignId" TEXT,
    "adsetId" TEXT,
    "adId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "cpm" DOUBLE PRECISION,
    "cpc" DOUBLE PRECISION,
    "results" INTEGER NOT NULL DEFAULT 0,
    "resultType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetaDailyInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnmatchedPayment" (
    "id" TEXT NOT NULL,
    "externalPaymentId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "reason" TEXT,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnmatchedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'lead',
    "sourceTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "segmentTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "firstSeenAt" TIMESTAMP(3),
    "lastPaymentAt" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "membershipType" TEXT,
    "membershipEndDate" TIMESTAMP(3),
    "trainerizeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "transactionUid" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "description" TEXT,
    "reference" TEXT,
    "category" TEXT,
    "status" TEXT,
    "confidence" TEXT,
    "raw" JSONB,
    "metadata" JSONB,
    "provider" TEXT,
    "personName" TEXT,
    "productType" TEXT,
    "leadId" TEXT,
    "paymentMethod" TEXT,
    "membershipPlan" TEXT,
    "notes" TEXT,
    "sourceFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnmatchedTransaction" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "description" TEXT,
    "reference" TEXT,
    "referenceHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnmatchedTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "externalSystem" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priceMinor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueGoal" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "records" TEXT,
    "errors" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualMatchQueue" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "suggestedMemberIds" JSONB,
    "referencePattern" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "ManualMatchQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTracking" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "fbclid" TEXT,
    "gclid" TEXT,
    "formId" TEXT,
    "adId" TEXT,
    "campaignId" TEXT,
    "adsetId" TEXT,
    "platform" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CounterpartyMapping" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CounterpartyMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionSecret_provider_key" ON "ConnectionSecret"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_externalId_key" ON "Lead"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_glofoxMemberId_key" ON "Lead"("glofoxMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_ghlContactId_key" ON "Lead"("ghlContactId");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_ghlContactId_idx" ON "Lead"("ghlContactId");

-- CreateIndex
CREATE INDEX "Payment_externalPaymentId_sourceSystem_idx" ON "Payment"("externalPaymentId", "sourceSystem");

-- CreateIndex
CREATE INDEX "AdsRevenue_leadId_idx" ON "AdsRevenue"("leadId");

-- CreateIndex
CREATE INDEX "AdsRevenue_paymentId_idx" ON "AdsRevenue"("paymentId");

-- CreateIndex
CREATE INDEX "AdsSpend_periodStart_periodEnd_idx" ON "AdsSpend"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "MetaDailyInsight_accountId_date_idx" ON "MetaDailyInsight"("accountId", "date");

-- CreateIndex
CREATE INDEX "MetaDailyInsight_campaignId_date_idx" ON "MetaDailyInsight"("campaignId", "date");

-- CreateIndex
CREATE INDEX "MetaDailyInsight_adsetId_date_idx" ON "MetaDailyInsight"("adsetId", "date");

-- CreateIndex
CREATE INDEX "MetaDailyInsight_adId_date_idx" ON "MetaDailyInsight"("adId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MetaDailyInsight_accountId_campaignId_adsetId_adId_date_key" ON "MetaDailyInsight"("accountId", "campaignId", "adsetId", "adId", "date");

-- CreateIndex
CREATE INDEX "UnmatchedPayment_externalPaymentId_sourceSystem_idx" ON "UnmatchedPayment"("externalPaymentId", "sourceSystem");

-- CreateIndex
CREATE INDEX "Contact_phone_idx" ON "Contact"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionUid_key" ON "Transaction"("transactionUid");

-- CreateIndex
CREATE INDEX "Transaction_contactId_idx" ON "Transaction"("contactId");

-- CreateIndex
CREATE INDEX "Transaction_reference_idx" ON "Transaction"("reference");

-- CreateIndex
CREATE INDEX "Transaction_occurredAt_idx" ON "Transaction"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_externalId_source_key" ON "Transaction"("externalId", "source");

-- CreateIndex
CREATE INDEX "UnmatchedTransaction_reference_idx" ON "UnmatchedTransaction"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Product_externalSystem_externalId_key" ON "Product"("externalSystem", "externalId");

-- CreateIndex
CREATE INDEX "LeadTracking_leadId_idx" ON "LeadTracking"("leadId");

-- CreateIndex
CREATE INDEX "LeadEvent_leadId_idx" ON "LeadEvent"("leadId");

-- CreateIndex
CREATE INDEX "LeadEvent_eventType_idx" ON "LeadEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "CounterpartyMapping_provider_key_key" ON "CounterpartyMapping"("provider", "key");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdsRevenue" ADD CONSTRAINT "AdsRevenue_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdsRevenue" ADD CONSTRAINT "AdsRevenue_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaCampaign" ADD CONSTRAINT "MetaCampaign_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MetaAdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaAdSet" ADD CONSTRAINT "MetaAdSet_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MetaAdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaAdSet" ADD CONSTRAINT "MetaAdSet_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MetaCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaAd" ADD CONSTRAINT "MetaAd_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MetaAdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaAd" ADD CONSTRAINT "MetaAd_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MetaCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaAd" ADD CONSTRAINT "MetaAd_adsetId_fkey" FOREIGN KEY ("adsetId") REFERENCES "MetaAdSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaDailyInsight" ADD CONSTRAINT "MetaDailyInsight_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MetaAdAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaDailyInsight" ADD CONSTRAINT "MetaDailyInsight_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MetaCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaDailyInsight" ADD CONSTRAINT "MetaDailyInsight_adsetId_fkey" FOREIGN KEY ("adsetId") REFERENCES "MetaAdSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaDailyInsight" ADD CONSTRAINT "MetaDailyInsight_adId_fkey" FOREIGN KEY ("adId") REFERENCES "MetaAd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualMatchQueue" ADD CONSTRAINT "ManualMatchQueue_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTracking" ADD CONSTRAINT "LeadTracking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEvent" ADD CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CounterpartyMapping" ADD CONSTRAINT "CounterpartyMapping_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
