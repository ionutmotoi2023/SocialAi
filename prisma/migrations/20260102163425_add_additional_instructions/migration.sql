-- AlterTable
ALTER TABLE "ai_configs" ADD COLUMN "additionalInstructions" TEXT;

-- Add comment
COMMENT ON COLUMN "ai_configs"."additionalInstructions" IS 'Free-form custom instructions for AI to consider when generating content';
