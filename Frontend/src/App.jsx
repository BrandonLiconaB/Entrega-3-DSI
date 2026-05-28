import React, { useEffect, useMemo, useState } from "react";
import {
  PawPrint,
  UserRound,
  Dog,
  CalendarDays,
  Syringe,
  Clock3,
  ShieldCheck,
  Search,
  LogOut,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * San Patitas MVP Frontend
 * Compatible con CodeSandbox o local usando Vite + React
 *
 * Arquitectura limpia aplicada en un solo archivo para fines académicos:
 * - Dominio: entidades y reglas puras
 * - Servicios: lógica de negocio reutilizable
 * - UI: componentes React desacoplados de la lógica
 *
 * Evidencia SOLID:
 * - SRP: helpers, servicios y componentes con una responsabilidad clara.
 * - OCP: funciones y mapeos extensibles sin romper consumidores.
 * - LSP: componentes reutilizables reciben props simples y consistentes.
 * - ISP: componentes reciben solo lo que necesitan.
 * - DIP: la UI depende de funciones de servicio, no de detalles directos.
 */

const ROLES = {
  ADMIN: "administrador",
  VET: "veterinario",
};

const STATUS = {
  SCHEDULED: "Programada",
  APPLIED: "Aplicada",
  CANCELED: "Cancelada",
};

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Ocurrió un error al comunicarse con el backend.");
  }

  return data;
}

const initialState = {
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
    {
      id: "c-2",
      name: "Carlos Vélez",
      phone: "3019876543",
      email: "carlos@gmail.com",
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
    {
      id: "p-2",
      clientId: "c-2",
      name: "Milo",
      species: "Felino",
      breed: "Criollo",
      age: 2,
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
      date: "2026-04-25",
      time: "09:00",
      status: STATUS.SCHEDULED,
    },
  ],
  records: [],
};

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusColor(status) {
  if (status === STATUS.APPLIED) return "#dcfce7";
  if (status === STATUS.CANCELED) return "#fee2e2";
  return "#e2e8f0";
}

/** Dominio / Servicios */
const AuthService = {
  login(users, credentials) {
    return (
      users.find(
        (user) =>
          user.email === credentials.email &&
          user.password === credentials.password
      ) || null
    );
  },
};

const ValidationService = {
  required(values) {
    return values.every(
      (value) =>
        value !== undefined && value !== null && String(value).trim() !== ""
    );
  },
  appointmentAvailability(appointments, input) {
    const vetConflict = appointments.some(
      (appointment) =>
        appointment.veterinarianId === input.veterinarianId &&
        appointment.date === input.date &&
        appointment.time === input.time &&
        appointment.status !== STATUS.CANCELED
    );

    const petConflict = appointments.some(
      (appointment) =>
        appointment.petId === input.petId &&
        appointment.date === input.date &&
        appointment.time === input.time &&
        appointment.status !== STATUS.CANCELED
    );

    return { ok: !vetConflict && !petConflict, vetConflict, petConflict };
  },
};

const VaccinationService = {
  validateInterval(records, vaccines, appointment) {
    const vaccine = vaccines.find((item) => item.id === appointment.vaccineId);
    if (!vaccine) {
      return {
        ok: false,
        message: "La vacuna no está registrada en el sistema.",
      };
    }

    const previousSameVaccine = records
      .filter(
        (record) =>
          record.petId === appointment.petId &&
          record.vaccineId === appointment.vaccineId
      )
      .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate))[0];

    if (!previousSameVaccine) {
      return { ok: true, vaccine };
    }

    const nextAllowedDate = addDays(
      previousSameVaccine.applicationDate,
      vaccine.intervalDays
    );
    if (appointment.date < nextAllowedDate) {
      return {
        ok: false,
        vaccine,
        message: `No se puede aplicar nuevamente esta vacuna antes de ${formatDate(
          nextAllowedDate
        )}.`,
      };
    }

    return { ok: true, vaccine };
  },
  buildRecord(appointment, notes, vaccine) {
    return {
      id: generateId("r"),
      appointmentId: appointment.id,
      petId: appointment.petId,
      veterinarianId: appointment.veterinarianId,
      vaccineId: appointment.vaccineId,
      applicationDate: appointment.date,
      notes,
      nextDoseDate: addDays(appointment.date, vaccine.intervalDays),
    };
  },
};

const LookupService = {
  clientName(clients, id) {
    return clients.find((item) => item.id === id)?.name || "-";
  },
  petName(pets, id) {
    return pets.find((item) => item.id === id)?.name || "-";
  },
  vetName(users, id) {
    return users.find((item) => item.id === id)?.fullName || "-";
  },
  vaccineName(vaccines, id) {
    return vaccines.find((item) => item.id === id)?.name || "-";
  },
};

export default function App() {
  const [users] = useState(initialState.users);
  const [clients, setClients] = useState([]);
  const [pets, setPets] = useState([]);
  const [vaccines] = useState(initialState.vaccines);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [session, setSession] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "admin@sanpatitas.com",
    password: "1234",
  });
  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [petForm, setPetForm] = useState({
    clientId: "",
    name: "",
    species: "Canino",
    breed: "",
    age: "",
  });
  const [appointmentForm, setAppointmentForm] = useState({
    clientId: "",
    petId: "",
    veterinarianId: "u-2",
    vaccineId: "",
    date: "",
    time: "",
  });
  const [recordForm, setRecordForm] = useState({
    appointmentId: "",
    notes: "",
  });
  const [historyPetId, setHistoryPetId] = useState("");

  const veterinarians = useMemo(
    () => users.filter((user) => user.role === ROLES.VET),
    [users]
  );

  const petsByClient = useMemo(
    () => pets.filter((pet) => pet.clientId === appointmentForm.clientId),
    [pets, appointmentForm.clientId]
  );

  const vetAgenda = useMemo(() => {
    if (!session || session.role !== ROLES.VET) return [];
    return appointments
      .filter((appointment) => appointment.veterinarianId === session.id)
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [appointments, session]);

  const historyRecords = useMemo(
    () => records.filter((record) => record.petId === historyPetId),
    [records, historyPetId]
  );

  const selectedPet = pets.find((pet) => pet.id === historyPetId) || null;

  async function loadMainData() {
    const [clientsData, petsData, appointmentsData] = await Promise.all([
      apiRequest("/api/clients"),
      apiRequest("/api/pets"),
      apiRequest("/api/appointments"),
    ]);

    setClients(clientsData);
    setPets(petsData);
    setAppointments(appointmentsData);
  }

  useEffect(() => {
    if (!session) return;

    loadMainData().catch((error) => {
      showNotice("warning", "Error cargando datos", error.message);
    });
  }, [session]);

  useEffect(() => {
    if (!historyPetId) {
      setRecords([]);
      return;
    }

    apiRequest(`/api/vaccinations/history/${historyPetId}`)
      .then(setRecords)
      .catch((error) => {
        setRecords([]);
        showNotice("warning", "Error consultando historial", error.message);
      });
  }, [historyPetId]);

  function showNotice(type, title, message) {
    setNotice({ type, title, message });
    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => setNotice(null), 3200);
  }
  showNotice.timer = showNotice.timer || null;

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });

      setSession(data.user);
      setPage("dashboard");
      showNotice("success", "Sesión iniciada", `Bienvenido, ${data.user.fullName}.`);
    } catch (error) {
      setLoginError(
        `${error.message} Usa admin@sanpatitas.com o vet@sanpatitas.com con la clave 1234.`
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setSession(null);
    setPage("dashboard");
    setLoginForm({ email: "admin@sanpatitas.com", password: "1234" });
  }

  async function handleCreateClient(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await apiRequest("/api/clients", {
        method: "POST",
        body: JSON.stringify(clientForm),
      });

      setClients((prev) => [...prev, data.client]);
      setClientForm({ name: "", phone: "", email: "" });
      showNotice(
        "success",
        "Cliente registrado",
        `${data.client.name} fue creado correctamente.`
      );
    } catch (error) {
      showNotice("warning", "No se pudo registrar el cliente", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePet(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await apiRequest("/api/pets", {
        method: "POST",
        body: JSON.stringify(petForm),
      });

      setPets((prev) => [...prev, data.pet]);
      setPetForm({
        clientId: "",
        name: "",
        species: "Canino",
        breed: "",
        age: "",
      });
      showNotice(
        "success",
        "Mascota registrada",
        `${data.pet.name} quedó asociada al cliente.`
      );
    } catch (error) {
      showNotice("warning", "No se pudo registrar la mascota", error.message);
    } finally {
      setLoading(false);
    }
  }

  function validateCurrentAvailability() {
    return ValidationService.appointmentAvailability(
      appointments,
      appointmentForm
    );
  }

  async function handleCreateAppointment(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await apiRequest("/api/appointments", {
        method: "POST",
        body: JSON.stringify(appointmentForm),
      });

      setAppointments((prev) => [...prev, data.appointment]);
      setAppointmentForm({
        clientId: "",
        petId: "",
        veterinarianId: "u-2",
        vaccineId: "",
        date: "",
        time: "",
      });
      showNotice(
        "success",
        "Cita registrada",
        "La cita fue creada con estado Programada."
      );
    } catch (error) {
      showNotice("warning", "No se pudo registrar la cita", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyVaccine(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await apiRequest("/api/vaccinations/apply", {
        method: "POST",
        body: JSON.stringify(recordForm),
      });

      setRecords((prev) => [...prev, data.record]);
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === data.record.appointmentId
            ? { ...item, status: STATUS.APPLIED }
            : item
        )
      );
      setRecordForm({ appointmentId: "", notes: "" });
      showNotice(
        "success",
        "Vacuna registrada",
        "La cita cambió a Aplicada y se actualizó el historial."
      );
    } catch (error) {
      showNotice("warning", "No se pudo aplicar la vacuna", error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <div style={styles.appShell}>
        <style>{globalCss}</style>
        <div style={styles.loginLayout}>
          <section style={styles.heroPanel}>
            <div style={styles.brandRow}>
              <div style={styles.brandIcon}>
                <PawPrint size={30} />
              </div>
              <div>
                <h1 style={styles.heroTitle}>San Patitas MVP</h1>
                <p style={styles.heroSubtitle}>
                  Frontend listo para tu peludito
                </p>
              </div>
            </div>
            <p style={styles.heroText}>
              Sistema interno para gestionar el proceso de vacunación: clientes,
              mascotas, citas, agenda veterinaria, aplicación de vacunas,
              historial y próxima dosis.
            </p>
            <div style={styles.featureGrid}>
              <FeatureChip
                icon={<UserRound size={16} />}
                title="Administrador"
                text="Registra clientes, mascotas y citas."
              />
              <FeatureChip
                icon={<Syringe size={16} />}
                title="Veterinario"
                text="Consulta agenda y aplica vacunas."
              />
              <FeatureChip
                icon={<ShieldCheck size={16} />}
                title="SOLID"
                text="Servicios separados de la UI."
              />
              <FeatureChip
                icon={<Clock3 size={16} />}
                title="MVP"
                text="Flujos principales del negocio."
              />
            </div>
          </section>

          <section style={styles.formPanel}>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Iniciar sesión</h2>
              <p style={styles.mutedText}>
                Usa uno de los accesos de demostración.
              </p>
              <form onSubmit={handleLogin} style={styles.formStack}>
                <FormField label="Correo">
                  <input
                    style={styles.input}
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="admin@sanpatitas.com"
                  />
                </FormField>
                <FormField label="Contraseña">
                  <input
                    style={styles.input}
                    type="password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="1234"
                  />
                </FormField>
                {loginError ? (
                  <Notice
                    type="warning"
                    title="Error de autenticación"
                    message={loginError}
                  />
                ) : null}
                <div style={styles.twoColButtons}>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() =>
                      setLoginForm({
                        email: "admin@sanpatitas.com",
                        password: "1234",
                      })
                    }
                  >
                    Cargar admin
                  </button>
                  <button
                    type="button"
                    style={styles.secondaryButton}
                    onClick={() =>
                      setLoginForm({
                        email: "vet@sanpatitas.com",
                        password: "1234",
                      })
                    }
                  >
                    Cargar veterinario
                  </button>
                </div>
                <button type="submit" style={styles.primaryButton} disabled={loading}>
                  {loading ? "Procesando..." : "Entrar"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appShell}>
      <style>{globalCss}</style>
      <header style={styles.topbar}>
        <div style={styles.topbarInner}>
          <div style={styles.brandRow}>
            <div style={{ ...styles.brandIcon, background: "#0f172a" }}>
              <PawPrint size={20} />
            </div>
            <div>
              <div style={styles.topbarTitle}>
                Clínica Veterinaria San Patitas
              </div>
              <div style={styles.topbarSubtitle}>MVP de vacunación</div>
            </div>
          </div>
          <div style={styles.sessionBox}>
            <span style={styles.roleBadge}>{session.role}</span>
            <span style={styles.sessionName}>{session.fullName}</span>
            <button style={styles.secondaryButtonSmall} onClick={handleLogout}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {notice ? (
          <Notice
            type={notice.type}
            title={notice.title}
            message={notice.message}
          />
        ) : null}

        <div style={styles.statsGrid}>
          <StatCard
            icon={<UserRound size={20} />}
            title="Clientes"
            value={clients.length}
          />
          <StatCard
            icon={<Dog size={20} />}
            title="Mascotas"
            value={pets.length}
          />
          <StatCard
            icon={<CalendarDays size={20} />}
            title="Citas"
            value={appointments.length}
          />
          <StatCard
            icon={<Syringe size={20} />}
            title="Vacunas aplicadas"
            value={records.length}
          />
        </div>

        <div style={styles.contentLayout}>
          <aside style={styles.sidebarCard}>
            <h3 style={styles.sectionTitle}>Navegación</h3>
            <p style={styles.mutedText}>Flujos principales del MVP</p>
            <div style={styles.navStack}>
              <NavButton
                label="Dashboard"
                active={page === "dashboard"}
                onClick={() => setPage("dashboard")}
              />
              {session.role === ROLES.ADMIN ? (
                <>
                  <NavButton
                    label="Clientes"
                    active={page === "clients"}
                    onClick={() => setPage("clients")}
                  />
                  <NavButton
                    label="Mascotas"
                    active={page === "pets"}
                    onClick={() => setPage("pets")}
                  />
                  <NavButton
                    label="Citas"
                    active={page === "appointments"}
                    onClick={() => setPage("appointments")}
                  />
                </>
              ) : null}
              {session.role === ROLES.VET ? (
                <>
                  <NavButton
                    label="Agenda"
                    active={page === "agenda"}
                    onClick={() => setPage("agenda")}
                  />
                  <NavButton
                    label="Aplicar vacuna"
                    active={page === "apply"}
                    onClick={() => setPage("apply")}
                  />
                  <NavButton
                    label="Historial"
                    active={page === "history"}
                    onClick={() => setPage("history")}
                  />
                </>
              ) : null}
            </div>
          </aside>

          <section style={styles.pageColumn}>
            {page === "dashboard" ? (
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Resumen del MVP</h2>
                <p style={styles.mutedText}>
                  Frontend React conectado al backend Express: la interfaz consume
                  servicios REST para registrar clientes, mascotas, citas,
                  vacunaciones e historial.
                </p>
                <div style={styles.summaryGrid}>
                  <StepCard
                    icon={<UserRound size={20} />}
                    title="Registrar cliente"
                    text="HU-01"
                  />
                  <StepCard
                    icon={<Dog size={20} />}
                    title="Registrar mascota"
                    text="HU-02"
                  />
                  <StepCard
                    icon={<CalendarDays size={20} />}
                    title="Agendar cita"
                    text="HU-03 y HU-04"
                  />
                  <StepCard
                    icon={<Clock3 size={20} />}
                    title="Consultar agenda"
                    text="HU-05"
                  />
                  <StepCard
                    icon={<Syringe size={20} />}
                    title="Aplicar vacuna"
                    text="HU-06"
                  />
                  <StepCard
                    icon={<Search size={20} />}
                    title="Historial y próxima dosis"
                    text="HU-07 y HU-08"
                  />
                </div>
                <div style={{ ...styles.cardInset, marginTop: 18 }}>
                  <strong>Integración frontend/backend:</strong>
                  <ul style={styles.list}>
                    <li>
                      El frontend consume endpoints REST del backend para las operaciones principales.
                    </li>
                    <li>
                      Componentes reutilizables: NavButton, StatCard, FormField,
                      TableSimple, Notice.
                    </li>
                    <li>
                      Las reglas críticas se validan en el backend y el frontend muestra las respuestas.
                    </li>
                  </ul>
                </div>
              </div>
            ) : null}

            {session.role === ROLES.ADMIN && page === "clients" ? (
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Registro de clientes</h2>
                <p style={styles.mutedText}>
                  HU-01 — Como administrador, quiero registrar un cliente.
                </p>
                <div style={styles.splitLayout}>
                  <form onSubmit={handleCreateClient} style={styles.formStack}>
                    <FormField label="Nombre completo">
                      <input
                        style={styles.input}
                        value={clientForm.name}
                        onChange={(e) =>
                          setClientForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Teléfono">
                      <input
                        style={styles.input}
                        value={clientForm.phone}
                        onChange={(e) =>
                          setClientForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Correo">
                      <input
                        style={styles.input}
                        type="email"
                        value={clientForm.email}
                        onChange={(e) =>
                          setClientForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </FormField>
                    <div style={styles.inlineButtons}>
                      <button style={styles.primaryButton} type="submit">
                        Guardar cliente
                      </button>
                      <button
                        style={styles.secondaryButton}
                        type="button"
                        onClick={() =>
                          setClientForm({ name: "", phone: "", email: "" })
                        }
                      >
                        Limpiar
                      </button>
                    </div>
                  </form>
                  <div style={styles.cardInset}>
                    <h3 style={styles.subTitle}>Clientes registrados</h3>
                    <TableSimple
                      columns={["Nombre", "Teléfono", "Correo"]}
                      rows={clients.map((client) => [
                        client.name,
                        client.phone,
                        client.email,
                      ])}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {session.role === ROLES.ADMIN && page === "pets" ? (
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Registro de mascotas</h2>
                <p style={styles.mutedText}>
                  HU-02 — Registrar una mascota asociada a un cliente.
                </p>
                <div style={styles.splitLayout}>
                  <form onSubmit={handleCreatePet} style={styles.formStack}>
                    <FormField label="Cliente">
                      <select
                        style={styles.input}
                        value={petForm.clientId}
                        onChange={(e) =>
                          setPetForm((prev) => ({
                            ...prev,
                            clientId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Selecciona cliente</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Nombre de la mascota">
                      <input
                        style={styles.input}
                        value={petForm.name}
                        onChange={(e) =>
                          setPetForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Especie">
                      <select
                        style={styles.input}
                        value={petForm.species}
                        onChange={(e) =>
                          setPetForm((prev) => ({
                            ...prev,
                            species: e.target.value,
                          }))
                        }
                      >
                        <option value="Canino">Canino</option>
                        <option value="Felino">Felino</option>
                      </select>
                    </FormField>
                    <FormField label="Raza">
                      <input
                        style={styles.input}
                        value={petForm.breed}
                        onChange={(e) =>
                          setPetForm((prev) => ({
                            ...prev,
                            breed: e.target.value,
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Edad">
                      <input
                        style={styles.input}
                        type="number"
                        min="0"
                        value={petForm.age}
                        onChange={(e) =>
                          setPetForm((prev) => ({
                            ...prev,
                            age: e.target.value,
                          }))
                        }
                      />
                    </FormField>
                    <div style={styles.inlineButtons}>
                      <button style={styles.primaryButton} type="submit">
                        Guardar mascota
                      </button>
                      <button
                        style={styles.secondaryButton}
                        type="button"
                        onClick={() =>
                          setPetForm({
                            clientId: "",
                            name: "",
                            species: "Canino",
                            breed: "",
                            age: "",
                          })
                        }
                      >
                        Limpiar
                      </button>
                    </div>
                  </form>
                  <div style={styles.cardInset}>
                    <h3 style={styles.subTitle}>Mascotas registradas</h3>
                    <TableSimple
                      columns={[
                        "Mascota",
                        "Cliente",
                        "Especie",
                        "Raza",
                        "Edad",
                      ]}
                      rows={pets.map((pet) => [
                        pet.name,
                        LookupService.clientName(clients, pet.clientId),
                        pet.species,
                        pet.breed,
                        `${pet.age} años`,
                      ])}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {session.role === ROLES.ADMIN && page === "appointments" ? (
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Gestión de citas</h2>
                <p style={styles.mutedText}>
                  HU-03 y HU-04 — Agendar cita y validar disponibilidad.
                </p>
                <div style={styles.splitLayout}>
                  <form
                    onSubmit={handleCreateAppointment}
                    style={styles.formStack}
                  >
                    <FormField label="Cliente">
                      <select
                        style={styles.input}
                        value={appointmentForm.clientId}
                        onChange={(e) =>
                          setAppointmentForm((prev) => ({
                            ...prev,
                            clientId: e.target.value,
                            petId: "",
                          }))
                        }
                      >
                        <option value="">Selecciona cliente</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Mascota">
                      <select
                        style={styles.input}
                        value={appointmentForm.petId}
                        onChange={(e) =>
                          setAppointmentForm((prev) => ({
                            ...prev,
                            petId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Selecciona mascota</option>
                        {petsByClient.map((pet) => (
                          <option key={pet.id} value={pet.id}>
                            {pet.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Veterinario">
                      <select
                        style={styles.input}
                        value={appointmentForm.veterinarianId}
                        onChange={(e) =>
                          setAppointmentForm((prev) => ({
                            ...prev,
                            veterinarianId: e.target.value,
                          }))
                        }
                      >
                        {veterinarians.map((vet) => (
                          <option key={vet.id} value={vet.id}>
                            {vet.fullName}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Vacuna">
                      <select
                        style={styles.input}
                        value={appointmentForm.vaccineId}
                        onChange={(e) =>
                          setAppointmentForm((prev) => ({
                            ...prev,
                            vaccineId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Selecciona vacuna</option>
                        {vaccines.map((vaccine) => (
                          <option key={vaccine.id} value={vaccine.id}>
                            {vaccine.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <div style={styles.twoColButtons}>
                      <FormField label="Fecha">
                        <input
                          style={styles.input}
                          type="date"
                          value={appointmentForm.date}
                          onChange={(e) =>
                            setAppointmentForm((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }))
                          }
                        />
                      </FormField>
                      <FormField label="Hora">
                        <input
                          style={styles.input}
                          type="time"
                          value={appointmentForm.time}
                          onChange={(e) =>
                            setAppointmentForm((prev) => ({
                              ...prev,
                              time: e.target.value,
                            }))
                          }
                        />
                      </FormField>
                    </div>
                    <div style={styles.inlineButtons}>
                      <button
                        style={styles.secondaryButton}
                        type="button"
                        onClick={() => {
                          if (
                            !ValidationService.required([
                              appointmentForm.clientId,
                              appointmentForm.petId,
                              appointmentForm.veterinarianId,
                              appointmentForm.date,
                              appointmentForm.time,
                            ])
                          ) {
                            showNotice(
                              "warning",
                              "Información incompleta",
                              "Primero completa los datos necesarios para validar disponibilidad."
                            );
                            return;
                          }
                          const result = validateCurrentAvailability();
                          if (result.ok) {
                            showNotice(
                              "success",
                              "Disponibilidad válida",
                              "No hay conflictos para esta cita."
                            );
                          } else {
                            showNotice(
                              "warning",
                              "Conflicto detectado",
                              "El veterinario o la mascota ya tienen una cita en ese horario."
                            );
                          }
                        }}
                      >
                        Validar disponibilidad
                      </button>
                      <button style={styles.primaryButton} type="submit">
                        Guardar cita
                      </button>
                    </div>
                  </form>
                  <div style={styles.cardInset}>
                    <h3 style={styles.subTitle}>Citas registradas</h3>
                    <TableSimple
                      columns={[
                        "Fecha",
                        "Hora",
                        "Cliente",
                        "Mascota",
                        "Veterinario",
                        "Vacuna",
                        "Estado",
                      ]}
                      rows={appointments.map((item) => [
                        formatDate(item.date),
                        item.time,
                        LookupService.clientName(clients, item.clientId),
                        LookupService.petName(pets, item.petId),
                        LookupService.vetName(users, item.veterinarianId),
                        LookupService.vaccineName(vaccines, item.vaccineId),
                        <span style={styles.statusPill(item.status)}>
                          {item.status}
                        </span>,
                      ])}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {session.role === ROLES.VET && page === "agenda" ? (
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Agenda veterinaria</h2>
                <p style={styles.mutedText}>
                  HU-05 — Consultar citas programadas.
                </p>
                <TableSimple
                  columns={[
                    "Fecha",
                    "Hora",
                    "Cliente",
                    "Mascota",
                    "Vacuna",
                    "Estado",
                  ]}
                  rows={vetAgenda.map((item) => [
                    formatDate(item.date),
                    item.time,
                    LookupService.clientName(clients, item.clientId),
                    LookupService.petName(pets, item.petId),
                    LookupService.vaccineName(vaccines, item.vaccineId),
                    <span style={styles.statusPill(item.status)}>
                      {item.status}
                    </span>,
                  ])}
                  emptyText="No hay citas registradas para este veterinario."
                />
              </div>
            ) : null}

            {session.role === ROLES.VET && page === "apply" ? (
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>
                  Registrar aplicación de vacuna
                </h2>
                <p style={styles.mutedText}>
                  HU-06 — Se aplica solo sobre citas Programadas.
                </p>
                <div style={styles.splitLayout}>
                  <form onSubmit={handleApplyVaccine} style={styles.formStack}>
                    <FormField label="Cita programada">
                      <select
                        style={styles.input}
                        value={recordForm.appointmentId}
                        onChange={(e) =>
                          setRecordForm((prev) => ({
                            ...prev,
                            appointmentId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Selecciona una cita</option>
                        {vetAgenda
                          .filter((item) => item.status === STATUS.SCHEDULED)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {`${item.date} ${
                                item.time
                              } · ${LookupService.petName(
                                pets,
                                item.petId
                              )} · ${LookupService.vaccineName(
                                vaccines,
                                item.vaccineId
                              )}`}
                            </option>
                          ))}
                      </select>
                    </FormField>
                    <FormField label="Observaciones">
                      <input
                        style={styles.input}
                        value={recordForm.notes}
                        onChange={(e) =>
                          setRecordForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Aplicación sin novedades"
                      />
                    </FormField>
                    <button style={styles.primaryButton} type="submit">
                      Registrar aplicación
                    </button>
                  </form>
                  <div style={styles.cardInset}>
                    <h3 style={styles.subTitle}>Reglas del proceso</h3>
                    <ul style={styles.list}>
                      <li>
                        Solo se pueden aplicar vacunas sobre citas en estado
                        Programada.
                      </li>
                      <li>
                        La aplicación actualiza automáticamente el estado a
                        Aplicada.
                      </li>
                      <li>
                        Se calcula la próxima dosis según el intervalo de la
                        vacuna.
                      </li>
                      <li>
                        Se bloquea una aplicación si no se cumple el intervalo
                        mínimo.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            {session.role === ROLES.VET && page === "history" ? (
              <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Historial de vacunación</h2>
                <p style={styles.mutedText}>
                  HU-07 y HU-08 — Consultar historial y próxima dosis.
                </p>
                <div style={styles.formStack}>
                  <FormField label="Mascota">
                    <select
                      style={styles.input}
                      value={historyPetId}
                      onChange={(e) => setHistoryPetId(e.target.value)}
                    >
                      <option value="">Selecciona una mascota</option>
                      {pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <div style={styles.cardInset}>
                    {selectedPet ? (
                      <div style={styles.petMetaGrid}>
                        <div>
                          <strong>Mascota:</strong> {selectedPet.name}
                        </div>
                        <div>
                          <strong>Especie:</strong> {selectedPet.species}
                        </div>
                        <div>
                          <strong>Raza:</strong> {selectedPet.breed}
                        </div>
                        <div>
                          <strong>Edad:</strong> {selectedPet.age} años
                        </div>
                      </div>
                    ) : (
                      <span style={styles.mutedText}>
                        Selecciona una mascota para consultar su historial.
                      </span>
                    )}
                  </div>
                  {historyPetId ? (
                    historyRecords.length > 0 ? (
                      <TableSimple
                        columns={[
                          "Vacuna",
                          "Fecha aplicación",
                          "Veterinario",
                          "Próxima dosis",
                          "Notas",
                        ]}
                        rows={historyRecords.map((record) => [
                          LookupService.vaccineName(vaccines, record.vaccineId),
                          formatDate(record.applicationDate),
                          LookupService.vetName(users, record.veterinarianId),
                          formatDate(record.nextDoseDate),
                          record.notes || "Sin observaciones",
                        ])}
                      />
                    ) : (
                      <Notice
                        type="warning"
                        title="Sin historial"
                        message="La mascota seleccionada aún no tiene vacunas registradas."
                      />
                    )
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function FeatureChip({ icon, title, text }) {
  return (
    <div style={styles.featureChip}>
      <div style={styles.featureIcon}>{icon}</div>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#cbd5e1" }}>{text}</div>
    </div>
  );
}

function NavButton({ label, active, onClick }) {
  return (
    <button
      style={active ? styles.navButtonActive : styles.navButton}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div style={styles.statCard}>
      <div>
        <div style={styles.statLabel}>{title}</div>
        <div style={styles.statValue}>{value}</div>
      </div>
      <div style={styles.statIcon}>{icon}</div>
    </div>
  );
}

function StepCard({ icon, title, text }) {
  return (
    <div style={styles.stepCard}>
      <div style={styles.stepIcon}>{icon}</div>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={styles.mutedTextSmall}>{text}</div>
    </div>
  );
}

function Notice({ type, title, message }) {
  const isWarning = type === "warning";
  return (
    <div
      style={{
        ...styles.notice,
        ...(isWarning ? styles.noticeWarning : styles.noticeSuccess),
      }}
    >
      <div style={{ marginTop: 2 }}>
        {isWarning ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
      </div>
      <div>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div style={styles.noticeText}>{message}</div>
      </div>
    </div>
  );
}

function TableSimple({
  columns,
  rows,
  emptyText = "No hay datos disponibles.",
}) {
  if (!rows.length) {
    return <div style={styles.emptyBox}>{emptyText}</div>;
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={styles.th}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={styles.td}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  appShell: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  loginLayout: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: 24,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24,
    alignItems: "stretch",
  },
  heroPanel: {
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "white",
    padding: 32,
    borderRadius: 28,
    boxShadow: "0 20px 45px rgba(15,23,42,.18)",
  },
  formPanel: { display: "flex", alignItems: "center" },
  card: {
    background: "white",
    borderRadius: 28,
    boxShadow: "0 10px 25px rgba(15,23,42,.08)",
    padding: 24,
    width: "100%",
  },
  cardInset: {
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: 20,
    padding: 16,
  },
  brandRow: { display: "flex", alignItems: "center", gap: 14 },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    background: "rgba(255,255,255,.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  heroTitle: { margin: 0, fontSize: 36, fontWeight: 800 },
  heroSubtitle: { margin: "6px 0 0", color: "#cbd5e1" },
  heroText: { marginTop: 22, lineHeight: 1.7, color: "#e2e8f0" },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginTop: 24,
  },
  featureChip: {
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,255,255,.05)",
  },
  featureIcon: {
    display: "inline-flex",
    padding: 8,
    borderRadius: 12,
    background: "rgba(255,255,255,.08)",
    marginBottom: 10,
  },
  sectionTitle: { margin: 0, fontSize: 24, fontWeight: 800 },
  subTitle: { marginTop: 0, fontSize: 18, fontWeight: 700 },
  mutedText: { color: "#64748b", lineHeight: 1.6 },
  mutedTextSmall: { color: "#64748b", fontSize: 13, marginTop: 8 },
  formStack: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginTop: 16,
  },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontWeight: 700, fontSize: 14 },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "white",
    fontSize: 14,
    boxSizing: "border-box",
  },
  inlineButtons: { display: "flex", gap: 10, flexWrap: "wrap" },
  twoColButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
  },
  primaryButton: {
    border: "none",
    borderRadius: 14,
    background: "#0f172a",
    color: "white",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 14,
    background: "white",
    color: "#0f172a",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButtonSmall: {
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    background: "white",
    color: "#0f172a",
    padding: "8px 12px",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(255,255,255,.92)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid #e2e8f0",
  },
  topbarInner: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "14px 18px",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  topbarTitle: { fontWeight: 800 },
  topbarSubtitle: { color: "#64748b", fontSize: 13 },
  sessionBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  sessionName: { color: "#475569", fontSize: 14 },
  roleBadge: {
    background: "#e2e8f0",
    color: "#0f172a",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  main: { maxWidth: 1280, margin: "0 auto", padding: 18 },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  statCard: {
    background: "white",
    borderRadius: 24,
    boxShadow: "0 8px 20px rgba(15,23,42,.06)",
    padding: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: { color: "#64748b", fontSize: 14 },
  statValue: { fontSize: 30, fontWeight: 800 },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#334155",
  },
  contentLayout: {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: 18,
  },
  sidebarCard: {
    background: "white",
    borderRadius: 24,
    boxShadow: "0 8px 20px rgba(15,23,42,.06)",
    padding: 18,
    height: "fit-content",
  },
  navStack: { display: "flex", flexDirection: "column", gap: 8, marginTop: 14 },
  navButton: {
    border: "none",
    borderRadius: 14,
    background: "transparent",
    padding: "12px 14px",
    textAlign: "left",
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
  },
  navButtonActive: {
    border: "none",
    borderRadius: 14,
    background: "#0f172a",
    color: "white",
    padding: "12px 14px",
    textAlign: "left",
    fontWeight: 700,
    cursor: "pointer",
  },
  pageColumn: { display: "flex", flexDirection: "column", gap: 18 },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginTop: 18,
  },
  stepCard: {
    borderRadius: 22,
    border: "1px solid #e2e8f0",
    padding: 18,
    background: "white",
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#334155",
    marginBottom: 12,
  },
  splitLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 380px) 1fr",
    gap: 18,
    alignItems: "start",
    marginTop: 16,
  },
  notice: {
    display: "flex",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  noticeSuccess: {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
  },
  noticeWarning: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    color: "#92400e",
  },
  noticeText: { fontSize: 14, lineHeight: 1.5 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 620 },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid #cbd5e1",
    fontSize: 13,
    color: "#475569",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 14,
    verticalAlign: "top",
  },
  statusPill: (status) => ({
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: statusColor(status),
    fontSize: 12,
    fontWeight: 700,
  }),
  emptyBox: {
    border: "1px dashed #cbd5e1",
    borderRadius: 18,
    padding: 18,
    color: "#64748b",
    background: "#f8fafc",
  },
  petMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
  },
  list: {
    margin: "10px 0 0",
    paddingLeft: 18,
    lineHeight: 1.8,
  },
};

const globalCss = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #f8fafc; }
  button:hover { filter: brightness(.98); }
  input, select, button { font: inherit; }
  @media (max-width: 980px) {
    .responsive-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 900px) {
    div[style*="grid-template-columns: 240px 1fr"] { grid-template-columns: 1fr !important; }
    div[style*="grid-template-columns: minmax(280px, 380px) 1fr"] { grid-template-columns: 1fr !important; }
  }
`;
