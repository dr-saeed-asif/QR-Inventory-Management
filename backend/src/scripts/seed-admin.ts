import 'dotenv/config'
import bcrypt from 'bcrypt'
import { prisma } from '../config/prisma'

const run = async () => {
  const adminName = process.env.ADMIN_NAME ?? 'System Admin'
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in .env')
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: 'ADMIN',
      passwordHash,
    },
    create: {
      name: adminName,
      email: adminEmail,
      role: 'ADMIN',
      passwordHash,
    },
  })

  console.log(`Admin ready: ${admin.email} (role: ${admin.role})`)
}

run()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
