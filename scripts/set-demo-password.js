const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setDemoPassword() {
  try {
    const email = 'demo@mindloop.ro'
    const password = 'Linkedin2025!!'
    
    console.log(`🔐 Setting specific password for ${email}...\n`)
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Update user
    const user = await prisma.user.update({
      where: { email: email },
      data: { 
        password: hashedPassword,
        emailVerified: new Date()
      },
      include: {
        tenant: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log('✅ Password updated successfully!\n')
    console.log('User Details:')
    console.log(`  Email: ${user.email}`)
    console.log(`  Name: ${user.name}`)
    console.log(`  Tenant: ${user.tenant?.name || 'No Tenant'}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  Password: Linkedin2025!!`)
    console.log('')
    
    // Verify the password works
    console.log('🔍 Verifying password...')
    const isValid = await bcrypt.compare(password, user.password)
    console.log(`Password verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`)
    
    if (isValid) {
      console.log('\n✅ Demo account is ready with password: Linkedin2025!!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setDemoPassword()
  .then(() => {
    console.log('\n✅ Operation completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
