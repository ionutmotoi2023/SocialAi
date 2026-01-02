#!/usr/bin/env node

/**
 * Verify Database Users Script
 * 
 * This script checks if users exist in the database and displays their details.
 * Useful for debugging 401 authentication errors.
 * 
 * Usage:
 *   node scripts/verify-users.js
 *   railway run node scripts/verify-users.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying database users...\n')

  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { email: 'asc' },
      ],
    })

    if (users.length === 0) {
      console.log('❌ NO USERS FOUND IN DATABASE!\n')
      console.log('⚠️  This is why you\'re getting 401 authentication errors.\n')
      console.log('📝 To fix this, run the seed script:\n')
      console.log('   npx prisma db seed')
      console.log('   OR')
      console.log('   railway run npx prisma db seed\n')
      process.exit(1)
    }

    console.log(`✅ Found ${users.length} user(s) in database:\n`)
    console.log('=' .repeat(80))

    users.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   📝 Name: ${user.name}`)
      console.log(`   🔐 Role: ${user.role}`)
      
      if (user.tenantId) {
        console.log(`   🏢 Tenant ID: ${user.tenantId}`)
        if (user.tenant) {
          console.log(`   🏢 Tenant Name: ${user.tenant.name}`)
          console.log(`   🌐 Domain: ${user.tenant.domain}`)
        }
      } else {
        console.log(`   🏢 Tenant: None (SUPER_ADMIN - can access all tenants)`)
      }
    })

    console.log('\n' + '='.repeat(80))

    // Check for expected demo users
    console.log('\n✅ Expected Demo Users Check:\n')

    const expectedUsers = [
      { email: 'superadmin@mindloop.ro', role: 'SUPER_ADMIN' },
      { email: 'admin@mindloop.ro', role: 'TENANT_ADMIN' },
      { email: 'editor@mindloop.ro', role: 'EDITOR' },
    ]

    for (const expected of expectedUsers) {
      const exists = users.find(u => u.email === expected.email && u.role === expected.role)
      if (exists) {
        console.log(`   ✅ ${expected.role.padEnd(15)} - ${expected.email}`)
      } else {
        console.log(`   ❌ ${expected.role.padEnd(15)} - ${expected.email} (MISSING!)`)
      }
    }

    console.log('\n📝 Login Instructions:')
    console.log('   - Email: Use any email from the list above')
    console.log('   - Password: ANY password (demo mode - see src/lib/auth.ts line 73)')
    console.log('\n💡 Try logging in with:')
    console.log('   superadmin@mindloop.ro (SUPER_ADMIN - full platform access)')
    console.log('   admin@mindloop.ro (TENANT_ADMIN - tenant management)')
    console.log('\n')

  } catch (error) {
    console.error('❌ Database Error:', error.message)
    console.error('\n⚠️  Make sure DATABASE_URL environment variable is set correctly.')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
