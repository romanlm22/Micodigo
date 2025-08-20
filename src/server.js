
import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "cambia_esto";


app.use(cors());
app.use(express.json());                         
app.use(express.urlencoded({ extended: true }));  
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "forum-api-jwt", port: PORT, now: new Date().toISOString() });
});

app.use("/auth", authRoutes);

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

app.get("/topicos", authMiddleware, async (_req, res) => {
  const topics = await prisma.topic.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(topics);
});

app.use((req, res) => res.status(404).json({ error: `No existe ${req.method} ${req.originalUrl}` }));
app.use((err, _req, res, _next) => {
  console.error("ERROR:", err);
  res.status(500).json({ error: "Error interno" });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
