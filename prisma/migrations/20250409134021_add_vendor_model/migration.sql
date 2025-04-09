-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "displayName" TEXT NOT NULL,
    "shopUsername" TEXT NOT NULL,
    "picture" TEXT,
    "description" TEXT NOT NULL,
    "walletPin" TEXT NOT NULL,
    "pgpKey" TEXT NOT NULL,
    "recoveryKey" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_shopUsername_key" ON "Vendor"("shopUsername");
