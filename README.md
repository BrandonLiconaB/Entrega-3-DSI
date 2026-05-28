# 🐾 San Patitas — MVP Full Stack

Aplicación web full stack desarrollada como MVP académico para la gestión del proceso de vacunación de la Clínica Veterinaria San Patitas.

El sistema permite administrar clientes, mascotas, citas veterinarias, aplicación de vacunas, historial médico y próxima dosis, integrando frontend y backend desplegados en la nube.

---

🌍 Demo en línea

[San Patitas MVP Live Demo](https://trabajo3dsi-git-main-brandon-lb-s-projects.vercel.app)

---

# 🚀 Tecnologías utilizadas

## Frontend

* React
* TypeScript
* React Scripts (Create React App)
* Lucide React
* CSS inline styling

## Backend

* Node.js
* Express
* CORS
* JavaScript ES Modules

## DevOps / Deploy

* Git & GitHub
* Vercel (Frontend)
* Render (Backend)

---

# 🧩 Arquitectura del proyecto

```txt
san-patitas/
├── frontend/   → React App
└── backend/    → API REST Express
```

La aplicación implementa una arquitectura cliente-servidor donde el frontend consume una API REST desarrollada en Express.

---

# ✨ Funcionalidades principales

## 🔐 Autenticación

* Inicio de sesión por roles
* Administrador
* Veterinario

## 👤 Gestión de clientes

* Registro de clientes
* Validación de datos obligatorios
* Prevención de duplicados

## 🐶 Gestión de mascotas

* Asociación de mascotas a clientes
* Registro de especie, raza y edad

## 📅 Gestión de citas

* Agendamiento de citas veterinarias
* Validación de disponibilidad
* Prevención de conflictos de horario
* Restricción de fechas inválidas

## 💉 Aplicación de vacunas

* Aplicación únicamente sobre citas programadas
* Cambio automático de estado
* Registro de observaciones

## 📖 Historial de vacunación

* Consulta de vacunas aplicadas
* Consulta de próxima dosis
* Validación de intervalos mínimos

---

# ⚙️ Flujos alternativos implementados

El sistema contempla múltiples escenarios de validación y manejo de errores:

* Credenciales inválidas
* Datos obligatorios incompletos
* Cliente inexistente
* Mascota inexistente
* Veterinario inexistente
* Vacuna inexistente
* Fecha pasada
* Conflicto de horario
* Aplicación sobre cita inválida
* Restricción por intervalo mínimo de vacunación

---

# 🧠 Principios SOLID aplicados

El frontend fue construido utilizando separación de responsabilidades y servicios desacoplados:

* `AuthService`
* `ValidationService`
* `VaccinationService`
* `LookupService`

También se implementaron componentes reutilizables y separación entre lógica de negocio y UI.

---


# 🖥️ Frontend

## Instalación

```bash
cd frontend
npm install
```

## Ejecución local

```bash
npm start
```

Frontend disponible en:

```txt
http://localhost:3000
```

---

# ⚙️ Backend

## Instalación

```bash
cd backend
npm install
```

## Ejecución local

```bash
npm run dev
```

Backend disponible en:

```txt
http://localhost:3001
```

---

# 🌐 Variables de entorno

## Frontend (.env)

```env
REACT_APP_API_URL=https://TU-BACKEND.onrender.com
```

---

# 📡 Endpoints principales

## Auth

```http
POST /api/auth/login
```

---

## Clientes

```http
GET /api/clients
POST /api/clients
```

---

## Mascotas

```http
GET /api/pets
POST /api/pets
```

---

## Citas

```http
GET /api/appointments
POST /api/appointments
```

---

## Vacunación

```http
POST /api/vaccinations/apply
GET /api/vaccinations/history/:petId
```

---

# 👨‍⚕️ Usuarios de prueba

## Administrador

```txt
Correo:
admin@sanpatitas.com

Contraseña:
1234
```

---

## Veterinario

```txt
Correo:
vet@sanpatitas.com

Contraseña:
1234
```

---

# ☁️ Despliegue

## Frontend

Desplegado en Vercel.

## Backend

Desplegado en Render.

---

# 📚 Objetivo académico

Este proyecto fue desarrollado como MVP funcional para evidenciar:

* integración frontend/backend,
* arquitectura cliente-servidor,
* validaciones de negocio,
* despliegue en la nube,
* uso de GitHub,
* y aplicación de buenas prácticas de desarrollo.

---

🔄 Integración continua básica (CI/CD)

Cada cambio realizado sobre la rama principal (main) genera automáticamente un nuevo despliegue del frontend mediante integración continua con GitHub y Vercel.

---

# 🐾 Proyecto casual volviendo a las andanzas

Porque todo desarrollador vuelve tarde o temprano a pelear con:

* npm,
* deploys,
* bugs,
* y localhost.

Y honestamente… valió totalmente la pena.
