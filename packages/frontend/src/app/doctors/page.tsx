"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import styles from "./doctors.module.css";

interface Doctor {
  id: string;
  bio: string;
  consultationFee: number;
  avatarUrl: string | null;
  languages: string[];
  user: {
    firstName: string;
    lastName: string;
  };
  specialty: {
    id: string;
    name: string;
  } | null;
  hospital: {
    id: string;
    name: string;
    city: string;
  } | null;
}

interface Specialty {
  id: string;
  name: string;
  slug: string;
}

interface Hospital {
  id: string;
  name: string;
  city: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    specialtyId: "",
    hospitalId: "",
    search: "",
  });

  useEffect(() => {
    Promise.all([
      api.get<Specialty[]>("/specialties"),
      api.get<Hospital[]>("/hospitals"),
    ]).then(([specs, hosps]) => {
      setSpecialties(specs);
      setHospitals(hosps);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.specialtyId) params.set("specialtyId", filters.specialtyId);
    if (filters.hospitalId) params.set("hospitalId", filters.hospitalId);
    if (filters.search) params.set("search", filters.search);

    api
      .get<{ data: Doctor[]; meta: any }>(`/doctors?${params}`)
      .then((res) => setDoctors(res.data))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Annuaire médical</h1>
        <p>Trouvez le médecin qu&apos;il vous faut</p>
      </div>

      {/* Filters bar */}
      <div className={styles.filters}>
        <input
          type="search"
          className="input"
          placeholder="🔍 Rechercher un médecin, une spécialité..."
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
        />
        <select
          className="input"
          value={filters.specialtyId}
          onChange={(e) =>
            setFilters((f) => ({ ...f, specialtyId: e.target.value }))
          }
        >
          <option value="">Toutes les spécialités</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filters.hospitalId}
          onChange={(e) =>
            setFilters((f) => ({ ...f, hospitalId: e.target.value }))
          }
        >
          <option value="">Tous les établissements</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} — {h.city}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`card ${styles.doctorCard}`}>
              <div className={`skeleton ${styles.avatarSkeleton}`} />
              <div className="skeleton" style={{ height: 20, width: "60%" }} />
              <div className="skeleton" style={{ height: 16, width: "40%", marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className={styles.empty}>
          <p>Aucun médecin trouvé pour ces critères.</p>
          <button
            className="btn btn-secondary"
            onClick={() => setFilters({ specialtyId: "", hospitalId: "", search: "" })}
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {doctors.map((doc) => (
            <Link
              key={doc.id}
              href={`/doctors/${doc.id}`}
              className={`card card-hover ${styles.doctorCard}`}
            >
              <div className={styles.avatar}>
                {doc.user.firstName[0]}
                {doc.user.lastName[0]}
              </div>
              <div className={styles.doctorInfo}>
                <h3>
                  Dr. {doc.user.firstName} {doc.user.lastName}
                </h3>
                {doc.specialty && (
                  <span className="badge badge-primary">
                    {doc.specialty.name}
                  </span>
                )}
                {doc.hospital && (
                  <p className={styles.hospital}>
                    📍 {doc.hospital.name} — {doc.hospital.city}
                  </p>
                )}
                {doc.consultationFee && (
                  <p className={styles.fee}>{doc.consultationFee} €</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
