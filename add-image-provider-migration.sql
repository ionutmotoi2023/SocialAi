-- Migration: Add imageProvider column to ai_configs table
-- Date: 2026-01-04
-- Description: Add support for selecting image generation provider (FLUX.1 Pro, FLUX Schnell, DALL-E 3)

-- Add imageProvider column with default value 'dalle3'
ALTER TABLE ai_configs 
ADD COLUMN IF NOT EXISTS "imageProvider" TEXT NOT NULL DEFAULT 'dalle3';

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS "ai_configs_imageProvider_idx" ON ai_configs("imageProvider");

-- Show result
SELECT 'Migration completed successfully!' as status;
