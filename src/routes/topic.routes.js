import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "cambia_esto";

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token requerido" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

router.get("/", authMiddleware, async (_req, res) => {
  const topics = await prisma.topic.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(topics);
});

router.post("/", authMiddleware, async (req, res) => {
  const { titulo, mensaje, nombreCurso } = req.body;
  if (!titulo || !mensaje || !nombreCurso) {
    return res.status(400).json({ error: "titulo, mensaje y nombreCurso son requeridos" });
  }
  const topic = await prisma.topic.create({
    data: {
      title: titulo,
      message: mensaje,
      courseName: nombreCurso,
      userId: req.user.sub,
    },
  });
  res.status(201).json(topic);
});

router.put("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { titulo, mensaje, nombreCurso } = req.body;
  const existing = await prisma.topic.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Tópico no encontrado" });
  if (existing.userId !== req.user.sub) {
    return res.status(403).json({ error: "No puedes editar este tópico" });
  }
  const updated = await prisma.topic.update({
    where: { id },
    data: {
      title: titulo ?? existing.title,
      message: mensaje ?? existing.message,
      courseName: nombreCurso ?? existing.courseName,
    },
  });
  res.json(updated);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.topic.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Tópico no encontrado" });
  if (existing.userId !== req.user.sub) {
    return res.status(403).json({ error: "No puedes eliminar este tópico" });
  }
  await prisma.topic.delete({ where: { id } });
  res.status(204).send();
});

export default router;
