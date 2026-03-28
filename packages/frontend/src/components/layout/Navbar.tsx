"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import styles from "./Navbar.module.css";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🏥</span>
          <span className={styles.logoText}>MediNote</span>
        </Link>

        <div className={styles.links}>
          <Link href="/doctors" className={styles.link}>
            Annuaire
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/appointments" className={styles.link}>
                Mes RDV
              </Link>
              {(user?.role === "doctor" || user?.role === "admin") && (
                <Link href="/dashboard" className={styles.link}>
                  Dashboard
                </Link>
              )}
              <div className={styles.userMenu}>
                <span className={styles.userName}>
                  {user?.firstName} {user?.lastName}
                </span>
                <button onClick={logout} className={`btn btn-ghost btn-sm`}>
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Connexion
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                S&apos;inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
