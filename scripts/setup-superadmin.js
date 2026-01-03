const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupSuperAdmin() {
  try {
    console.log('🔍 Checking tenants and superadmin...\n')
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
      }
    })
    
    console.log(`Found ${tenants.length} tenants:`)
    tenants.forEach(t => console.log(`  - ${t.name} (${t.id})`))
    console.log('')
    
    // Get superadmin
    const superadmin = await prisma.user.findUnique({
      where: { email: 'superadmin@mindloop.ro' },
      include: {
        tenant: true
      }
    })
    
    if (!superadmin) {
      console.log('❌ Superadmin not found!')
      return
    }
    
    console.log(`Superadmin status:`)
    console.log(`  Email: ${superadmin.email}`)
    console.log(`  Name: ${superadmin.name}`)
    console.log(`  Role: ${superadmin.role}`)
    console.log(`  TenantId: ${superadmin.tenantId || 'NULL'}`)
    console.log(`  Tenant: ${superadmin.tenant?.name || 'None'}`)
    console.log('')
    
    if (!superadmin.tenantId && tenants.length > 0) {
      console.log(`🔧 Assigning superadmin to first tenant: ${tenants[0].name}...`)
      
      await prisma.user.update({
        where: { email: 'superadmin@mindloop.ro' },
        data: {
          tenantId: tenants[0].id
        }
      })
      
      console.log('✅ Superadmin now associated with tenant!')
    } else if (superadmin.tenantId) {
      console.log('✅ Superadmin already has a tenant assigned')
    } else {
      console.log('⚠️  No tenants available to assign')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupSuperAdmin()
  .then(() => {
    console.log('\n✅ Setup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
