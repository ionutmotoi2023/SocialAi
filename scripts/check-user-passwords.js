const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkUserPasswords() {
  try {
    console.log('🔍 Checking user passwords in database...\n')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        tenant: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`Found ${users.length} users:\n`)

    for (const user of users) {
      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.name}`)
      console.log(`Role: ${user.role}`)
      console.log(`Tenant: ${user.tenant?.name || 'No Tenant'}`)
      console.log(`Password set: ${user.password ? 'YES' : 'NO'}`)
      if (user.password) {
        console.log(`Password hash: ${user.password.substring(0, 20)}...`)
      }
      console.log('')
    }

    // Test password verification for each user
    console.log('='.repeat(80))
    console.log('🔐 Testing password verification:')
    console.log('='.repeat(80) + '\n')

    const testPasswords = {
      'admin@mindloop.ro': 'X@TeXC1H*^1C',
      'editor@mindloop.ro': 'k@$KE6MFFChK',
      'superadmin@mindloop.ro': 'k*k8yhJL#Sq3'
    }

    for (const user of users) {
      const testPassword = testPasswords[user.email]
      if (testPassword && user.password) {
        const isValid = await bcrypt.compare(testPassword, user.password)
        console.log(`${user.email}: Password "${testPassword}" is ${isValid ? '✅ VALID' : '❌ INVALID'}`)
      } else if (!user.password) {
        console.log(`${user.email}: ⚠️  NO PASSWORD SET`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkUserPasswords()
  .then(() => {
    console.log('\n✅ Check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
