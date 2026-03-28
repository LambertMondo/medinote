"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import styles from "./appointments.module.css";

interface Appointment {
  id: string;
  status: "confirmed" | "cancelled" | "completed";
  reason: string;
  createdAt: string;
  slot: {
    startAt: string;
    endAt: string;
  };
  doctor: {
    user: { firstName: string; lastName: string };
    specialty: { name: string } | null;
  };
}

export default function AppointmentsPage() {
  const { token, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    api
      .get<{ data: Appointment[] }>("/appointments/me", { token })
      .then((res) => setAppointments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, token]);

  const handleCancel = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) return;

    setCancellingId(id);
    try {
      await api.patch(`/appointments/${id}/cancel`, {}, { token: token! });
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "cancelled" as const } : a
        )
      );
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      }
    } finally {
      setCancellingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem" }}>
        <h2>Connectez-vous pour voir vos rendez-vous</h2>
      </div>
    );
  }

  const statusLabels: Record<string, { label: string; class: string }> = {
    confirmed: { label: "Confirmé", class: "badge-success" },
    cancelled: { label: "Annulé", class: "badge-error" },
    completed: { label: "Terminé", class: "badge-primary" },
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Mes rendez-vous</h1>
        <p>Gérez vos rendez-vous médicaux</p>
      </div>

      {loading ? (
        <div className={styles.list}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: 24, width: "40%" }} />
              <div className="skeleton" style={{ height: 16, width: "60%", marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className={styles.empty}>
          <p>Aucun rendez-vous pour le moment.</p>
          <a href="/doctors" className="btn btn-primary">
            Trouver un médecin
          </a>
        </div>
      ) : (
        <div className={styles.list}>
          {appointments.map((apt) => {
            const dateStr = new Date(apt.slot.startAt).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const timeStr = new Date(apt.slot.startAt).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const status = statusLabels[apt.status];

            return (
              <div key={apt.id} className={`card ${styles.appointmentCard}`}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3>
                      Dr. {apt.doctor.user.firstName} {apt.doctor.user.lastName}
                    </h3>
                    {apt.doctor.specialty && (
                      <span className="badge badge-primary">
                        {apt.doctor.specialty.name}
                      </span>
                    )}
                  </div>
                  <span className={`badge ${status.class}`}>{status.label}</span>
                </div>

                <div className={styles.cardDetails}>
                  <div className={styles.detail}>
                    <span>📅</span>
                    <span className={styles.capitalize}>{dateStr}</span>
                  </div>
                  <div className={styles.detail}>
                    <span>🕐</span>
                    <span>{timeStr}</span>
                  </div>
                </div>

                {apt.status === "confirmed" && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancel(apt.id)}
                    disabled={cancellingId === apt.id}
                  >
                    {cancellingId === apt.id ? "Annulation..." : "Annuler"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
