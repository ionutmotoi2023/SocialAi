const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setIonutPassword() {
  console.log('🔐 Setting password for ionut.motoi@siteq.ro...\n')

  try {
    // Generate a secure password: Mindloop2026!
    const password = 'Mindloop2026!'
    const hashedPassword = await bcrypt.hash(password, 10)

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'ionut.motoi@siteq.ro' },
      include: { tenant: true },
    })

    if (!user) {
      console.log('❌ User not found: ionut.motoi@siteq.ro')
      return
    }

    console.log('Found user:')
    console.log(`  Email: ${user.email}`)
    console.log(`  Name: ${user.name}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  Tenant: ${user.tenant?.name || 'No Tenant'}`)
    console.log()

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: new Date(), // Mark email as verified
      },
    })

    console.log('✅ Password updated successfully!')
    console.log()
    console.log('═══════════════════════════════════════════')
    console.log('  LOGIN CREDENTIALS')
    console.log('═══════════════════════════════════════════')
    console.log(`  Email:    ${user.email}`)
    console.log(`  Password: ${password}`)
    console.log(`  Tenant:   ${user.tenant?.name || 'No Tenant'}`)
    console.log(`  Role:     ${user.role}`)
    console.log('═══════════════════════════════════════════')
    console.log()

    // Verify the password works
    const isValid = await bcrypt.compare(password, hashedPassword)
    console.log(`✅ Password verification: ${isValid ? 'VALID' : 'INVALID'}`)
    console.log()
    console.log('⚠️  IMPORTANT: Save this password securely!')
    console.log('    Login URL: https://socialai.mindloop.ro/login')
  } catch (error) {
    console.error('❌ Error setting password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setIonutPassword()
