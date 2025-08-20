import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "cambia_esto";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "2h";

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

router.post("/__echo", (req, res) => {
  res.json({
    method: req.method,
    url: req.originalUrl,
    contentType: req.headers["content-type"] || null,
    bodyType: typeof req.body,
    body: req.body,
    query: req.query,
    headersEmail: req.headers["x-email"] || null,
    headersPassword: req.headers["x-password"] || null,
  });
});

router.post("/login", async (req, res) => {
  console.log("LOGIN content-type:", req.headers["content-type"] || null);
  console.log("LOGIN req.body:", req.body);

  const email =
    req.body?.email ??
    req.body?.correo ??
    req.body?.user ??
    req.body?.username ??
    req.query?.email ??
    req.headers["x-email"];

  const password =
    req.body?.password ??
    req.body?.pass ??
    req.body?.contrasena ??
    req.body?.["contraseña"] ??
    req.query?.password ??
    req.headers["x-password"];

  if (!email || !password) {
    return res.status(400).json({
      error: "email y password son requeridos",
      seenByServer: {
        body: req.body,
        query: req.query,
        headers: { "x-email": req.headers["x-email"] || null, "x-password": req.headers["x-password"] || null }
      }
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ error: "Error interno en login" });
  }
});

export default router;
