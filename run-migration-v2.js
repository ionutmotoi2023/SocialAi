// Run SQL migration directly on production database (Fixed - separate commands)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:HZlxTekzjERdCfxJSObKSiIOovpcfgSW@shortline.proxy.rlwy.net:38171/railway'
    }
  }
});

async function runMigration() {
  console.log('🚀 Running migration on production database...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Step 1: Add imageProvider column
    console.log('⚡ Step 1: Adding imageProvider column...');
    await prisma.$executeRaw`
      ALTER TABLE ai_configs 
      ADD COLUMN IF NOT EXISTS "imageProvider" TEXT NOT NULL DEFAULT 'dalle3';
    `;
    console.log('✅ Column added successfully\n');

    // Step 2: Create index
    console.log('⚡ Step 2: Creating index...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "ai_configs_imageProvider_idx" ON ai_configs("imageProvider");
    `;
    console.log('✅ Index created successfully\n');

    // Step 3: Verify column was added
    console.log('🔍 Step 3: Verifying imageProvider column...');
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'ai_configs' AND column_name = 'imageProvider';
    `;
    
    if (result.length > 0) {
      console.log('✅ Column verified:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Column not found - migration may have failed');
    }
    console.log('');

    // Step 4: Show all AIConfig records with new column
    console.log('📋 Step 4: Current AIConfig records:');
    const configs = await prisma.aIConfig.findMany({
      select: {
        id: true,
        tenantId: true,
        selectedModel: true,
        imageProvider: true,
        tonePreference: true,
        brandVoice: true,
      }
    });
    console.log(JSON.stringify(configs, null, 2));
    console.log('');

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📝 Summary:');
    console.log(`   ✅ imageProvider column added to ai_configs table`);
    console.log(`   ✅ Default value: 'dalle3'`);
    console.log(`   ✅ Index created for better performance`);
    console.log(`   ✅ ${configs.length} existing records updated`);
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Settings should now save imageProvider correctly');
    console.log('   2. Brand Voice and Tone Preference should also save');
    console.log('   3. Test by changing settings and clicking Save');
    console.log('   4. Generate an image with FLUX.1 Pro');

  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
