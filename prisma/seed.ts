import { PrismaClient, PostStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant-id' },
    update: {},
    create: {
      id: 'demo-tenant-id',
      name: 'AI MINDLOOP SRL',
      domain: 'mindloop.ro',
      website: 'https://mindloop.ro',
      industry: 'Technology',
      description: 'AI-powered social media automation platform',
    },
  })

  console.log('✅ Created tenant:', tenant.name)

  // Create demo admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mindloop.ro' },
    update: {},
    create: {
      email: 'admin@mindloop.ro',
      name: 'Admin User',
      role: 'TENANT_ADMIN',
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create demo editor user
  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@mindloop.ro' },
    update: {},
    create: {
      email: 'editor@mindloop.ro',
      name: 'Editor User',
      role: 'EDITOR',
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created editor user:', editorUser.email)

  // Create AI configuration
  const aiConfig = await prisma.aIConfig.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      selectedModel: 'gpt-4-turbo',
      brandVoice: 'Professional yet approachable, innovative and forward-thinking',
      tonePreference: 'professional',
      postLength: 'medium',
      hashtagStrategy: 'moderate',
      includeEmojis: true,
      includeCTA: true,
    },
  })

  console.log('✅ Created AI configuration')

  // Create demo posts
  const posts = [
    {
      title: 'Welcome to AI-Powered Social Media',
      content: 'Excited to announce the launch of our new AI-powered social media automation platform! 🚀 Transform your content strategy with intelligent automation. #AI #SocialMedia #Innovation',
      status: PostStatus.PUBLISHED,
      platform: 'linkedin',
      aiGenerated: true,
      aiModel: 'gpt-4-turbo',
      aiConfidence: 0.92,
      publishedAt: new Date(),
    },
    {
      title: 'The Future of Content Creation',
      content: 'AI is revolutionizing how we create and manage social media content. Our platform learns from your preferences to deliver personalized, high-quality posts. #ContentCreation #AIAutomation',
      status: PostStatus.SCHEDULED,
      platform: 'linkedin',
      aiGenerated: true,
      aiModel: 'gpt-4-turbo',
      aiConfidence: 0.88,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      title: 'Boost Your Productivity',
      content: 'Save 80% of your time on social media management. Let AI handle the heavy lifting while you focus on strategy. #Productivity #TimeManagement #Business',
      status: PostStatus.DRAFT,
      platform: 'linkedin',
      aiGenerated: true,
      aiModel: 'gpt-4-turbo',
      aiConfidence: 0.85,
    },
  ]

  for (const postData of posts) {
    await prisma.post.create({
      data: {
        ...postData,
        tenantId: tenant.id,
        userId: adminUser.id,
        mediaUrls: [],
      },
    })
  }

  console.log(`✅ Created ${posts.length} demo posts`)

  console.log('🎉 Database seed completed successfully!')
  console.log('')
  console.log('📧 Demo Login Credentials:')
  console.log('   Email: admin@mindloop.ro')
  console.log('   Password: (any password works in demo mode)')
  console.log('')
  console.log('🚀 Run: npm run dev')
  console.log('   Then visit: http://localhost:3000')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
