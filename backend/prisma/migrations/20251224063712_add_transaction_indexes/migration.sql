-- CreateIndex
CREATE INDEX `Transaction_createdAt_idx` ON `Transaction`(`createdAt`);

-- RedefineIndex
CREATE INDEX `Transaction_fromUserId_idx` ON `Transaction`(`fromUserId`);

-- RedefineIndex
CREATE INDEX `Transaction_toUserId_idx` ON `Transaction`(`toUserId`);
