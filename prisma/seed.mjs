
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.topic.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  const passUser = await bcrypt.hash("password123", 10);
  const passAdmin = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.create({
    data: {
      email: "user@example.com",
      name: "User Test",
      password: passUser,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin Test",
      password: passAdmin,
    },
  });

  await prisma.topic.createMany({
    data: [
      {
        title: "Bienvenidos al foro",
        message: "Primer tópico sembrado por el seed",
        courseName: "General",
        userId: user.id,
      },
      {
        title: "Anuncios",
        message: "Reglas y novedades",
        courseName: "General",
        userId: admin.id,
      },
    ],
  });

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
