import express from "express";
import cors from "cors";

import authRoutes from "./src/routes/auth.routes.js";
import clientsRoutes from "./src/routes/clients.routes.js";
import petsRoutes from "./src/routes/pets.routes.js";
import appointmentsRoutes from "./src/routes/appointments.routes.js";
import vaccinationsRoutes from "./src/routes/vaccinations.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Backend MVP San Patitas funcionando correctamente",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/pets", petsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/vaccinations", vaccinationsRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});