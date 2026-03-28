"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import styles from "./profile.module.css";

interface Doctor {
  id: string;
  bio: string;
  consultationFee: number;
  avatarUrl: string | null;
  languages: string[];
  user: { firstName: string; lastName: string; email: string };
  specialty: { name: string } | null;
  hospital: { name: string; city: string; address: string } | null;
}

interface Slot {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
}

export default function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Doctor>(`/doctors/${id}`),
      api.get<Slot[]>(`/slots/available/${id}`),
    ])
      .then(([doc, availableSlots]) => {
        setDoctor(doc);
        setSlots(availableSlots);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setBooking(true);
    setError("");

    try {
      await api.post(
        "/appointments",
        { slotId: selectedSlot, reason },
        { token: token! }
      );
      setSuccess(true);
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlot));
      setSelectedSlot(null);
      setReason("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Erreur lors de la réservation.");
      }
    } finally {
      setBooking(false);
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const dateKey = new Date(slot.startAt).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="page-container">
        <p>Médecin non trouvé.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {success && (
        <div className={styles.successBanner}>
          ✅ Rendez-vous confirmé ! Un email de confirmation vous a été envoyé.
        </div>
      )}

      <div className={styles.layout}>
        {/* Left: Doctor info */}
        <div className={styles.profileSection}>
          <div className={`card ${styles.profileCard}`}>
            <div className={styles.avatar}>
              {doctor.user.firstName[0]}
              {doctor.user.lastName[0]}
            </div>
            <h1>
              Dr. {doctor.user.firstName} {doctor.user.lastName}
            </h1>
            {doctor.specialty && (
              <span className="badge badge-primary">{doctor.specialty.name}</span>
            )}
            {doctor.hospital && (
              <div className={styles.location}>
                <p>📍 {doctor.hospital.name}</p>
                <p>{doctor.hospital.address}, {doctor.hospital.city}</p>
              </div>
            )}
            {doctor.bio && <p className={styles.bio}>{doctor.bio}</p>}
            {doctor.consultationFee && (
              <div className={styles.fee}>
                <span>Consultation</span>
                <strong>{doctor.consultationFee} €</strong>
              </div>
            )}
            {doctor.languages.length > 0 && (
              <div className={styles.languages}>
                {doctor.languages.map((lang) => (
                  <span key={lang} className="badge badge-primary">
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Available slots */}
        <div className={styles.slotsSection}>
          <h2>Créneaux disponibles</h2>

          {error && <div className={styles.alert}>{error}</div>}

          {Object.keys(slotsByDate).length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
              <p>Aucun créneau disponible pour le moment.</p>
            </div>
          ) : (
            Object.entries(slotsByDate).map(([date, dateSlots]) => (
              <div key={date} className={styles.dayGroup}>
                <h3 className={styles.dayLabel}>{date}</h3>
                <div className={styles.slotsGrid}>
                  {dateSlots.map((slot) => (
                    <button
                      key={slot.id}
                      className={`${styles.slotBtn} ${
                        selectedSlot === slot.id ? styles.slotSelected : ""
                      }`}
                      onClick={() => setSelectedSlot(slot.id)}
                    >
                      {new Date(slot.startAt).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Booking form */}
          {selectedSlot && (
            <div className={`card ${styles.bookingForm}`}>
              <h3>Confirmer votre rendez-vous</h3>
              <div className="input-group">
                <label htmlFor="reason">Motif de consultation (optionnel)</label>
                <textarea
                  id="reason"
                  className="input"
                  rows={3}
                  placeholder="Décrivez brièvement le motif de votre visite..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ resize: "vertical" }}
                />
              </div>
              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={handleBook}
                disabled={booking}
              >
                {booking ? <span className="spinner" /> : null}
                {booking ? "Réservation..." : "Confirmer le rendez-vous"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
