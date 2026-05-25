# Veterinaria San Patitas - Backend MVP

## Descripción
Backend del MVP para la gestión del proceso de vacunación de la Clínica Veterinaria San Patitas.

## Tecnologías
- Node.js
- Express
- CORS
- JavaScript ES Modules

## Funcionalidades
- Inicio de sesión
- Registro de clientes
- Registro de mascotas
- Agendamiento de citas
- Validación de disponibilidad
- Aplicación de vacunas
- Consulta de historial
- Cálculo de próxima dosis

## Flujos alternativos implementados
- Credenciales inválidas
- Datos obligatorios incompletos
- Cliente inexistente
- Mascota inexistente o no asociada al cliente
- Veterinario inexistente
- Vacuna inexistente
- Fecha pasada
- Conflicto de horario
- Aplicación sobre cita no programada
- Restricción por intervalo mínimo de vacuna

## Instalación

npm install

## Ejecución

npm run dev

## URL local

http://localhost:3001

## Endpoints principales

POST /api/auth/login  
GET /api/clients  
POST /api/clients  
GET /api/pets  
POST /api/pets  
GET /api/appointments  
POST /api/appointments  
POST /api/vaccinations/apply  
GET /api/vaccinations/history/:petId

## Usuarios de prueba

Administrador:
admin@sanpatitas.com
1234

Veterinario:
vet@sanpatitas.com
1234