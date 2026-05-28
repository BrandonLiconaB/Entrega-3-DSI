import express from "express";
import { store } from "../data/store.js";
import { required } from "../utils/helpers.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!required([email, password])) {
    return res.status(400).json({
      error: "El correo y la contraseña son obligatorios.",
    });
  }

  const user = store.users.find(
    (item) => item.email === email && item.password === password
  );

  if (!user) {
    return res.status(401).json({
      error: "Credenciales inválidas.",
    });
  }

  const { password: _, ...userWithoutPassword } = user;

  return res.json({
    message: "Inicio de sesión exitoso.",
    user: userWithoutPassword,
  });
});

export default router;