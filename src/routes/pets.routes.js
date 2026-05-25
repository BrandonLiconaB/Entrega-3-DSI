import express from "express";
import { store } from "../data/store.js";
import { generateId, required } from "../utils/helpers.js";

const router = express.Router();

/**
 * Obtener todas las mascotas
 */
router.get("/", (req, res) => {
  res.json(store.pets);
});

/**
 * Registrar mascota
 */
router.post("/", (req, res) => {
  const { clientId, name, species, breed, age } = req.body;

  if (!required([clientId, name, species, breed, age])) {
    return res.status(400).json({
      error: "Cliente, nombre, especie, raza y edad son obligatorios.",
    });
  }

  const clientExists = store.clients.some((client) => client.id === clientId);

  if (!clientExists) {
    return res.status(404).json({
      error: "El cliente asociado no existe.",
    });
  }

  const newPet = {
    id: generateId("p"),
    clientId,
    name,
    species,
    breed,
    age: Number(age),
  };

  store.pets.push(newPet);

  return res.status(201).json({
    message: "Mascota registrada correctamente.",
    pet: newPet,
  });
});

export default router;