import Link from "next/link";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <div className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.badge}>
          <span>🏥</span> Plateforme médicale
        </div>
        <h1 className={styles.title}>
          Prenez rendez-vous avec votre{" "}
          <span className={styles.gradient}>médecin</span> en quelques clics
        </h1>
        <p className={styles.subtitle}>
          Trouvez le bon spécialiste, consultez ses disponibilités en temps réel
          et réservez votre créneau instantanément.
        </p>
        <div className={styles.actions}>
          <Link href="/doctors" className="btn btn-primary btn-lg">
            Trouver un médecin
          </Link>
          <Link href="/register" className="btn btn-secondary btn-lg">
            Créer un compte
          </Link>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>150+</span>
            <span className={styles.statLabel}>Médecins</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>25+</span>
            <span className={styles.statLabel}>Spécialités</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>10k+</span>
            <span className={styles.statLabel}>Rendez-vous</span>
          </div>
        </div>
      </div>

      <div className={styles.features}>
        <div className={`card card-hover ${styles.feature}`}>
          <div className={styles.featureIcon}>🔍</div>
          <h3>Recherche avancée</h3>
          <p>Filtrez par spécialité, hôpital ou ville pour trouver le médecin idéal.</p>
        </div>
        <div className={`card card-hover ${styles.feature}`}>
          <div className={styles.featureIcon}>📅</div>
          <h3>Disponibilité temps réel</h3>
          <p>Consultez les créneaux disponibles et réservez en un clic.</p>
        </div>
        <div className={`card card-hover ${styles.feature}`}>
          <div className={styles.featureIcon}>📧</div>
          <h3>Confirmation instantanée</h3>
          <p>Recevez un email de confirmation avec tous les détails de votre RDV.</p>
        </div>
      </div>
    </div>
  );
}
