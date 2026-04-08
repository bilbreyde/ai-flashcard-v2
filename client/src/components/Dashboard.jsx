import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const CERT_GROUPS = [
  {
    group: "AI Certifications",
    certs: [
      { id: "google-ai-leadership", label: "AI Leadership Certification", exam: "Google Cloud", vendor: "google", accent: "#4285F4", bg: "#f0f4ff" },
      { id: "cisco-aitech", label: "AI Technical Practitioner", exam: "810-110 AITECH", vendor: "cisco", accent: "#1BA0D7", bg: "#f0f8ff" },
      { id: "hpe-ase-ai", label: "ASE – AI Solutions", exam: "HPE ASE", vendor: "hpe", accent: "#01A982", bg: "#f0fdf8" },
      { id: "aws-ai-practitioner", label: "Certified AI Practitioner", exam: "AWS", vendor: "aws", accent: "#FF9900", bg: "#fff8f0" },
    ],
  },
  {
    group: "Microsoft Certifications",
    certs: [
      { id: "sc-900", label: "Security, Compliance & Identity Fundamentals", exam: "SC-900", vendor: "microsoft", accent: "#0078D4", bg: "#f0f6ff" },
      { id: "az-900", label: "Azure Fundamentals", exam: "AZ-900", vendor: "microsoft", accent: "#0078D4", bg: "#f0f6ff" },
      { id: "az-500", label: "Azure Security Engineer Associate", exam: "AZ-500", vendor: "microsoft", accent: "#0078D4", bg: "#f0f6ff" },
      { id: "ms-500", label: "Microsoft 365 Security Administrator", exam: "MS-500", vendor: "microsoft", accent: "#0078D4", bg: "#f0f6ff" },
    ],
  },
];

export default function Dashboard({ onSelectCert }) {
  const { user, logout } = useAuth();
  const [allProgress, setAllProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allCertIds = CERT_GROUPS.flatMap(g => g.certs.map(c => c.id));
    Promise.all(
      allCertIds.map(id => api.getProgress(id).then(p => ({ id, p })).catch(() => ({ id, p: null })))
    ).then(results => {
      const map = {};
      results.forEach(({ id, p }) => { map[id] = p; });
      setAllProgress(map);
      setLoading(false);
    });
  }, []);

  const totalSessions = Object.values(allProgress).reduce((sum, p) => sum + (p?.totalSessions || 0), 0);
  const certsStudied = Object.values(allProgress).filter(p => p?.totalSessions > 0).length;
  const allScores = Object.values(allProgress)
    .filter(p => p?.latest)
    .map(p => Math.round((p.latest.score / p.latest.total) * 100));
  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1 className="title">Practice Flashcards</h1>
          <p className="app-meta">
            v1.0 · By Don Bilbrey ·{" "}
            <a href="mailto:don.bilbrey@zones.com" className="meta-link">don.bilbrey@zones.com</a>
          </p>
        </div>
        <div className="user-menu">
          <span className="user-email">{user?.email}</span>
          <button className="link-btn" onClick={logout}>Sign out</button>
        </div>
      </div>

      {totalSessions > 0 && (
        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat-num">{totalSessions}</span>
            <span className="dash-stat-lbl">Total sessions</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-num">{certsStudied}</span>
            <span className="dash-stat-lbl">Certs studied</span>
          </div>
          {avgScore !== null && (
            <div className="dash-stat">
              <span className="dash-stat-num">{avgScore}%</span>
              <span className="dash-stat-lbl">Avg score</span>
            </div>
          )}
        </div>
      )}

      {CERT_GROUPS.map(group => (
        <div key={group.group} className="cert-section">
          <h2 className="cert-section-title">{group.group}</h2>
          <div className="cert-card-grid">
            {group.certs.map(cert => {
              const progress = allProgress[cert.id];
              const hasProgress = progress?.totalSessions > 0;
              const lastScore = progress?.latest
                ? Math.round((progress.latest.score / progress.latest.total) * 100)
                : null;
              const weakCount = progress?.weakCategories?.length || 0;

              return (
                <div
                  key={cert.id}
                  className="cert-card"
                  style={{ "--card-accent": cert.accent, "--card-bg": cert.bg }}
                  onClick={() => onSelectCert(cert.id)}
                >
                  <div className="cert-card-logo">
                    <img src={`/logos/${cert.vendor}.png`} alt={cert.vendor} className="vendor-logo" />
                  </div>
                  <div className="cert-card-body">
                    <span className="cert-card-exam">{cert.exam}</span>
                    <p className="cert-card-name">{cert.label}</p>
                  </div>
                  <div className="cert-card-footer">
                    {hasProgress ? (
                      <>
                        <span className="cert-score" style={{ color: lastScore >= 75 ? "var(--correct)" : lastScore >= 60 ? "#b36a00" : "var(--wrong)" }}>
                          {lastScore}% last
                        </span>
                        <span className="cert-sessions">{progress.totalSessions} session{progress.totalSessions !== 1 ? "s" : ""}</span>
                        {weakCount > 0 && <span className="cert-weak">{weakCount} weak area{weakCount !== 1 ? "s" : ""}</span>}
                      </>
                    ) : (
                      <span className="cert-new-badge">Start studying</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
