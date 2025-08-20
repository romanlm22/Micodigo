import express from "express";
import authRoutes from "./routes/auth.routes.js";
import topicRoutes from "./routes/topic.routes.js";
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

dotenv.config()
const prisma = new PrismaClient()
const app = express()

app.use("/auth", authRoutes);
app.use("/topicos", topicRoutes);

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

const PORT = 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'cambia_esto'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '2h'

// Helpers
function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Token requerido' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

// Salud
app.get('/', (_, res) => res.json({ ok: true, service: 'forum-api-jwt' }))

// Auth (usuarios ya existen en BD)
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email y password son requeridos' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' })
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' })
  const token = signToken(user)
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

// CRUD de tópicos (protegido)
app.get('/topicos', authMiddleware, async (req, res) => {
  const topics = await prisma.topic.findMany({ include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: 'desc' } })
  res.json(topics)
})

app.post('/topicos', authMiddleware, async (req, res) => {
  const { titulo, mensaje, nombreCurso } = req.body
  if (!titulo || !mensaje || !nombreCurso) return res.status(400).json({ error: 'titulo, mensaje y nombreCurso son requeridos' })
  const topic = await prisma.topic.create({
    data: { title: titulo, message: mensaje, courseName: nombreCurso, userId: req.user.sub }
  })
  res.status(201).json(topic)
})

app.put('/topicos/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id)
  const { titulo, mensaje, nombreCurso } = req.body
  try {
    const existing = await prisma.topic.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Tópico no encontrado' })
    // (opcional) validar que el autor sea el que edita
    if (existing.userId !== req.user.sub) return res.status(403).json({ error: 'No puedes editar este tópico' })
    const updated = await prisma.topic.update({
      where: { id },
      data: { title: titulo ?? existing.title, message: mensaje ?? existing.message, courseName: nombreCurso ?? existing.courseName }
    })
    res.json(updated)
  } catch (e) {
    res.status(400).json({ error: 'Error actualizando tópico' })
  }
})

app.delete('/topicos/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id)
  try {
    const existing = await prisma.topic.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Tópico no encontrado' })
    if (existing.userId !== req.user.sub) return res.status(403).json({ error: 'No puedes eliminar este tópico' })
    await prisma.topic.delete({ where: { id } })
    res.status(204).send()
  } catch (e) {
    res.status(400).json({ error: 'Error eliminando tópico' })
  }
})

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`)
})
