import express from "express";
import { store } from "../data/store.js";
import { generateId, required } from "../utils/helpers.js";

const router = express.Router();

/**
 * Obtener todos los clientes
 */
router.get("/", (req, res) => {
  res.json(store.clients);
});

/**
 * Crear cliente
 */
router.post("/", (req, res) => {
  const { name, phone, email } = req.body;

  if (!required([name, phone, email])) {
    return res.status(400).json({
      error: "Nombre, teléfono y correo son obligatorios.",
    });
  }

  const existingClient = store.clients.find(
    (client) => client.email === email
  );

  if (existingClient) {
    return res.status(409).json({
      error: "Ya existe un cliente con ese correo.",
    });
  }

  const newClient = {
    id: generateId("c"),
    name,
    phone,
    email,
  };

  store.clients.push(newClient);

  return res.status(201).json({
    message: "Cliente registrado correctamente.",
    client: newClient,
  });
});

export default router;