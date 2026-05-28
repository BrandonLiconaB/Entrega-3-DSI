import express from "express";
import { store, STATUS, ROLES } from "../data/store.js";
import {
  generateId,
  required,
  isPastDate,
} from "../utils/helpers.js";

const router = express.Router();

/**
 * Obtener todas las citas
 */
router.get("/", (req, res) => {
  res.json(store.appointments);
});

/**
 * Crear cita
 */
router.post("/", (req, res) => {
  const {
    clientId,
    petId,
    veterinarianId,
    vaccineId,
    date,
    time,
  } = req.body;

  if (
    !required([
      clientId,
      petId,
      veterinarianId,
      vaccineId,
      date,
      time,
    ])
  ) {
    return res.status(400).json({
      error: "Todos los campos de la cita son obligatorios.",
    });
  }

  const clientExists = store.clients.some(
    (client) => client.id === clientId
  );

  if (!clientExists) {
    return res.status(404).json({
      error: "El cliente no existe.",
    });
  }

  const petExists = store.pets.some(
    (pet) => pet.id === petId && pet.clientId === clientId
  );

  if (!petExists) {
    return res.status(404).json({
      error: "La mascota no existe o no pertenece al cliente.",
    });
  }

  const vetExists = store.users.some(
    (user) =>
      user.id === veterinarianId &&
      user.role === ROLES.VET
  );

  if (!vetExists) {
    return res.status(404).json({
      error: "El veterinario no existe.",
    });
  }

  const vaccineExists = store.vaccines.some(
    (vaccine) => vaccine.id === vaccineId
  );

  if (!vaccineExists) {
    return res.status(404).json({
      error: "La vacuna no existe.",
    });
  }

  if (isPastDate(date)) {
    return res.status(400).json({
      error: "No se pueden registrar citas en fechas pasadas.",
    });
  }

  const vetConflict = store.appointments.some(
    (appointment) =>
      appointment.veterinarianId === veterinarianId &&
      appointment.date === date &&
      appointment.time === time &&
      appointment.status !== STATUS.CANCELED
  );

  if (vetConflict) {
    return res.status(409).json({
      error: "El veterinario ya tiene una cita en ese horario.",
    });
  }

  const petConflict = store.appointments.some(
    (appointment) =>
      appointment.petId === petId &&
      appointment.date === date &&
      appointment.time === time &&
      appointment.status !== STATUS.CANCELED
  );

  if (petConflict) {
    return res.status(409).json({
      error: "La mascota ya tiene una cita en ese horario.",
    });
  }

  const newAppointment = {
    id: generateId("a"),
    clientId,
    petId,
    veterinarianId,
    vaccineId,
    date,
    time,
    status: STATUS.SCHEDULED,
  };

  store.appointments.push(newAppointment);

  return res.status(201).json({
    message: "Cita registrada correctamente.",
    appointment: newAppointment,
  });
});

export default router;