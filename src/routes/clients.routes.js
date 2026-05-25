import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Ruta de clientes funcionando" });
});

export default router;