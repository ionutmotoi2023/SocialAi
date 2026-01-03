const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function verifyAllPasswords() {
  try {
    console.log('🔐 FINAL PASSWORD VERIFICATION\n')
    console.log('='.repeat(80) + '\n')
    
    const testPasswords = {
      'admin@mindloop.ro': 'TtHMHQdGXj8b',
      'editor@mindloop.ro': 'AIeasAUh*Lo6',
      'superadmin@mindloop.ro': 'yKKDT85uYu1R',
      'demo@mindloop.ro': 'Linkedin2025!!'
    }

    for (const [email, password] of Object.entries(testPasswords)) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          email: true,
          name: true,
          password: true,
          role: true,
          tenant: {
            select: { name: true }
          }
        }
      })

      if (!user) {
        console.log(`❌ ${email}: USER NOT FOUND`)
        continue
      }

      if (!user.password) {
        console.log(`❌ ${email}: NO PASSWORD SET`)
        continue
      }

      const isValid = await bcrypt.compare(password, user.password)
      const status = isValid ? '✅ VALID' : '❌ INVALID'
      
      console.log(`${status} ${email}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Tenant: ${user.tenant?.name || 'No Tenant'}`)
      console.log(`   Password: ${password}`)
      console.log('')
    }

    console.log('='.repeat(80))
    console.log('✅ Verification completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyAllPasswords()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
