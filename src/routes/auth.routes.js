import { Router } from "express";

const router = Router();

router.get("/login", (req, res) => {
res.json({ message: "Ruta de login funcionando 🚀" });
});

export default router;
