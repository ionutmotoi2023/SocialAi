const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixSuperadminTenant() {
  console.log('🔧 Fixing superadmin tenant association...\n')

  try {
    // Find the superadmin user
    const superadmin = await prisma.user.findUnique({
      where: { email: 'superadmin@mindloop.ro' },
      include: { tenant: true },
    })

    if (!superadmin) {
      console.log('❌ Superadmin user not found!')
      return
    }

    console.log('Found superadmin:')
    console.log(`  Email: ${superadmin.email}`)
    console.log(`  Name: ${superadmin.name}`)
    console.log(`  Role: ${superadmin.role}`)
    console.log(`  Current Tenant ID: ${superadmin.tenantId}`)
    console.log(`  Current Tenant Name: ${superadmin.tenant?.name || 'None'}\n`)

    // Remove tenantId from superadmin
    const updated = await prisma.user.update({
      where: { id: superadmin.id },
      data: { tenantId: null },
    })

    console.log('✅ Superadmin tenant association removed!')
    console.log(`  Email: ${updated.email}`)
    console.log(`  Role: ${updated.role}`)
    console.log(`  Tenant ID: ${updated.tenantId || 'None (correct for SUPER_ADMIN)'}`)
    console.log('\n⚠️  WARNING: SUPER_ADMIN should NOT modify tenant settings directly!')
    console.log('   Use the Super Admin dashboard to manage tenants instead.')
  } catch (error) {
    console.error('❌ Error fixing superadmin tenant:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSuperadminTenant()
