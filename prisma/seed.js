import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password1 = await bcrypt.hash('password123', 10)
  const password2 = await bcrypt.hash('admin123', 10)

  const [u1, u2] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: { email: 'user@example.com', password: password1, name: 'Usuario Demo' }
    }),
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: { email: 'admin@example.com', password: password2, name: 'Admin Demo' }
    })
  ])

  await prisma.topic.createMany({
    data: [
      { title: 'Bienvenida', message: 'Hola a todos!', courseName: 'HTTP en la web', userId: u1.id },
      { title: 'Error validación HTTP', message: 'Error al ejecutar una requisición', courseName: 'HTTP en la web', userId: u2.id }
    ]
  })

  console.log('Seed listo: usuarios y tópicos creados.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
