// Quick script to view contact messages
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('\n📧 CONTACT MESSAGES (Latest 5):\n')
  console.log('='.repeat(80))
  
  const messages = await prisma.contactMessage.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  if (messages.length === 0) {
    console.log('\n❌ No messages found in database.\n')
  } else {
    messages.forEach((msg, index) => {
      console.log(`\n📩 Message #${index + 1}:`)
      console.log(`   Name:    ${msg.name}`)
      console.log(`   Email:   ${msg.email}`)
      console.log(`   Company: ${msg.company || 'N/A'}`)
      console.log(`   Subject: ${msg.subject}`)
      console.log(`   Message: ${msg.message.substring(0, 100)}${msg.message.length > 100 ? '...' : ''}`)
      console.log(`   Status:  ${msg.status}`)
      console.log(`   IP:      ${msg.ipAddress || 'N/A'}`)
      console.log(`   Created: ${msg.createdAt.toISOString()}`)
      console.log('   ' + '-'.repeat(76))
    })
    console.log(`\n✅ Total messages found: ${messages.length}\n`)
  }
  
  console.log('='.repeat(80))
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
