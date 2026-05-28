import express from "express";
import { store, STATUS } from "../data/store.js";
import { addDays } from "../utils/helpers.js";

const router = express.Router();

/**
 * Aplicar vacuna
 */
router.post("/apply", (req, res) => {
  const { appointmentId, notes } = req.body;

  const appointment = store.appointments.find(
    (item) => item.id === appointmentId
  );

  if (!appointment) {
    return res.status(404).json({
      error: "La cita no existe.",
    });
  }

  if (appointment.status !== STATUS.SCHEDULED) {
    return res.status(400).json({
      error: "Solo se pueden aplicar vacunas a citas programadas.",
    });
  }

  const vaccine = store.vaccines.find(
    (item) => item.id === appointment.vaccineId
  );

  if (!vaccine) {
    return res.status(404).json({
      error: "La vacuna no existe.",
    });
  }

  const previousRecord = store.records
    .filter(
      (record) =>
        record.petId === appointment.petId &&
        record.vaccineId === appointment.vaccineId
    )
    .sort((a, b) =>
      b.applicationDate.localeCompare(a.applicationDate)
    )[0];

  if (previousRecord) {
    const nextAllowedDate = addDays(
      previousRecord.applicationDate,
      vaccine.intervalDays
    );

    if (appointment.date < nextAllowedDate) {
      return res.status(400).json({
        error: `No se puede aplicar esta vacuna antes de ${nextAllowedDate}.`,
      });
    }
  }

  const newRecord = {
    id: `r-${Math.random().toString(36).slice(2, 8)}`,
    appointmentId: appointment.id,
    petId: appointment.petId,
    veterinarianId: appointment.veterinarianId,
    vaccineId: appointment.vaccineId,
    applicationDate: appointment.date,
    notes: notes || "",
    nextDoseDate: addDays(
      appointment.date,
      vaccine.intervalDays
    ),
  };

  store.records.push(newRecord);

  appointment.status = STATUS.APPLIED;

  return res.json({
    message: "Vacuna aplicada correctamente.",
    record: newRecord,
  });
});

/**
 * Historial por mascota
 */
router.get("/history/:petId", (req, res) => {
  const { petId } = req.params;

  const petExists = store.pets.some((pet) => pet.id === petId);

  if (!petExists) {
    return res.status(404).json({
      error: "La mascota no existe.",
    });
  }

  const history = store.records.filter(
    (record) => record.petId === petId
  );

  return res.json(history);
});

export default router;