-- AlterTable: Add RSS source tracking fields to Post model
ALTER TABLE "posts" ADD COLUMN "contentSourceId" TEXT;
ALTER TABLE "posts" ADD COLUMN "rssItemTitle" TEXT;
ALTER TABLE "posts" ADD COLUMN "rssItemUrl" TEXT;
ALTER TABLE "posts" ADD COLUMN "rssItemDate" TIMESTAMP(3);

-- AlterTable: Add RSS tracking fields to AILearningData
ALTER TABLE "ai_learning_data" ADD COLUMN "contentSourceId" TEXT;
ALTER TABLE "ai_learning_data" ADD COLUMN "rssItemUrl" TEXT;

-- AddForeignKey: Add relation from Post to ContentSource
ALTER TABLE "posts" ADD CONSTRAINT "posts_contentSourceId_fkey" FOREIGN KEY ("contentSourceId") REFERENCES "content_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
