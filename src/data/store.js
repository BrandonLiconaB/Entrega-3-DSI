export const ROLES = {
  ADMIN: "administrador",
  VET: "veterinario",
};

export const STATUS = {
  SCHEDULED: "Programada",
  APPLIED: "Aplicada",
  CANCELED: "Cancelada",
};

export const store = {
  users: [
    {
      id: "u-1",
      fullName: "Laura Ramírez",
      email: "admin@sanpatitas.com",
      password: "1234",
      role: ROLES.ADMIN,
    },
    {
      id: "u-2",
      fullName: "Dr. Mateo Salazar",
      email: "vet@sanpatitas.com",
      password: "1234",
      role: ROLES.VET,
    },
  ],

  clients: [
    {
      id: "c-1",
      name: "Ana Gómez",
      phone: "3001234567",
      email: "ana@gmail.com",
    },
  ],

  pets: [
    {
      id: "p-1",
      clientId: "c-1",
      name: "Luna",
      species: "Canino",
      breed: "Labrador",
      age: 3,
    },
  ],

  vaccines: [
    { id: "v-1", name: "Rabia", intervalDays: 365 },
    { id: "v-2", name: "Triple Felina", intervalDays: 365 },
    { id: "v-3", name: "Parvovirus", intervalDays: 365 },
  ],

  appointments: [
    {
      id: "a-1",
      clientId: "c-1",
      petId: "p-1",
      veterinarianId: "u-2",
      vaccineId: "v-1",
      date: "2026-06-10",
      time: "09:00",
      status: STATUS.SCHEDULED,
    },
  ],

  records: [],
};