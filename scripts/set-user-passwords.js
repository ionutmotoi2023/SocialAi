const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Generate a secure random password
function generatePassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

async function setPasswordsForExistingUsers() {
  try {
    console.log('🔍 Fetching users without passwords...\n')
    
    // Get all users without password
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { password: null },
          { password: '' }
        ]
      },
      include: {
        tenant: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`Found ${users.length} users without passwords\n`)

    if (users.length === 0) {
      console.log('✅ All users already have passwords!')
      return []
    }

    const userPasswords = []

    for (const user of users) {
      // Generate secure password
      const plainPassword = generatePassword(12)
      const hashedPassword = await bcrypt.hash(plainPassword, 10)

      // Update user with hashed password
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          emailVerified: user.emailVerified || new Date() // Set emailVerified if not set
        }
      })

      userPasswords.push({
        email: user.email,
        name: user.name || 'N/A',
        tenant: user.tenant?.name || 'No Tenant',
        role: user.role,
        password: plainPassword
      })

      console.log(`✅ Password set for: ${user.email}`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('📋 USER CREDENTIALS - SAVE THIS INFORMATION SECURELY!')
    console.log('='.repeat(80) + '\n')

    userPasswords.forEach((user, index) => {
      console.log(`${index + 1}. User: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Tenant: ${user.tenant}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Password: ${user.password}`)
      console.log('')
    })

    console.log('='.repeat(80))
    console.log('⚠️  IMPORTANT: Save these passwords in a secure location!')
    console.log('='.repeat(80) + '\n')

    return userPasswords

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
setPasswordsForExistingUsers()
  .then((passwords) => {
    console.log('✅ Password setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed to set passwords:', error)
    process.exit(1)
  })
