import { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { CERT_CONFIGS } from "../data/questions";

const CERTS = [
  { id: "google-ai-leadership", label: "Google AI Leadership Certification" },
  { id: "cisco-aitech", label: "Cisco AI Technical Practitioner (810-110 AITECH)" },
  { id: "hpe-ase-ai", label: "HPE ASE - AI Solutions" },
  { id: "aws-ai-practitioner", label: "AWS Certified AI Practitioner" },
];

export default function Setup({ onStart }) {
  const { user, logout } = useAuth();
  const [certId, setCertId] = useState("google-ai-leadership");
  const [count, setCount] = useState(10);
  const [selectedCats, setSelectedCats] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cert = CERTS.find((c) => c.id === certId);
  const categories = CERT_CONFIGS[certId] || CERT_CONFIGS["google-ai-leadership"];

  useEffect(() => {
    setSelectedCats([]);
    setProgress(null);
    api.getProgress(certId).then(setProgress).catch(() => {});
  }, [certId]);

  const weakCategories = progress?.weakCategories || [];

  const toggleCat = (cat) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const loadingMsg = count <= 10
    ? "~60 seconds"
    : count <= 20 ? "~2 minutes" : "~3 minutes";

  const handleStart = async () => {
    setError("");
    setLoading(true);
    try {
      const focusCategories = selectedCats.length > 0
        ? weakCategories.filter((w) => selectedCats.includes(w.category))
        : weakCategories;
      const data = await api.generateQuestions(count, focusCategories, certId);
      onStart({ questions: data.questions, count, categories: selectedCats, certId });
    } catch (err) {
      setError("Could not generate questions. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen setup-screen">
      <div className="setup-topbar">
        <div>
          <h1 className="title">Practice Flashcards</h1>
          <p className="app-meta">v1.0 · By Don Bilbrey · <a href="mailto:don.bilbrey@zones.com" className="meta-link">don.bilbrey@zones.com</a></p>
        </div>
        <div className="user-menu">
          <span className="user-email">{user?.email}</span>
          <button className="link-btn" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="setup-card">
        <div className="field">
          <label className="field-label">Certification</label>
          <div className="cert-grid">
            {CERTS.map((c) => (
              <button
                key={c.id}
                className={`cert-chip ${certId === c.id ? "active" : ""}`}
                onClick={() => setCertId(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {progress && progress.totalSessions > 0 && (
          <div className="progress-banner">
            <div className="progress-banner-stats">
              <div className="pb-stat">
                <span className="pb-num">{progress.totalSessions}</span>
                <span className="pb-lbl">Sessions</span>
              </div>
              <div className="pb-stat">
                <span className="pb-num">
                  {progress.latest
                    ? Math.round((progress.latest.score / progress.latest.total) * 100) + "%"
                    : "—"}
                </span>
                <span className="pb-lbl">Last score</span>
              </div>
              <div className="pb-stat">
                <span className="pb-num" style={{ color: weakCategories.length > 0 ? "var(--wrong)" : "var(--correct)" }}>
                  {weakCategories.length}
                </span>
                <span className="pb-lbl">Weak areas</span>
              </div>
            </div>
            {weakCategories.length > 0 && (
              <p className="focus-note">
                AI will focus on: <strong>{weakCategories.map((w) => w.category).join(", ")}</strong>
              </p>
            )}
          </div>
        )}

        <div className="field">
          <div className="field-header">
            <label className="field-label">Number of questions</label>
            <span className="field-value">{count}</span>
          </div>
          <input
            type="range" min={5} max={25} step={5} value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="slider"
          />
          <div className="slider-labels"><span>5</span><span>25</span></div>
        </div>

        <div className="field">
          <label className="field-label">Focus on specific categories</label>
          <p className="field-hint">Leave all unselected to let the AI decide based on your weak areas.</p>
          <div className="category-grid">
            {categories.map((cat) => {
              const weak = weakCategories.find((w) => w.category === cat);
              return (
                <button
                  key={cat}
                  className={`cat-chip ${selectedCats.includes(cat) ? "active" : ""}`}
                  onClick={() => toggleCat(cat)}
                >
                  {cat}
                  {weak && <span className="weak-badge">{weak.accuracy}%</span>}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="auth-error" style={{ marginBottom: "1rem" }}>{error}</p>}

        <div className="setup-footer">
          <span className="pool-info">
            {loading ? (
              <span>
                Generating {count} adaptive questions…<br />
                <span style={{ fontSize: "12px", opacity: 0.75 }}>
                  o4-mini takes {loadingMsg} to reason through your weak areas
                </span>
              </span>
            ) : (
              "Questions generated by AI · Adapts to your weak areas"
            )}
          </span>
          <button className="primary-btn" onClick={handleStart} disabled={loading}>
            {loading ? "Generating…" : "Start quiz →"}
          </button>
        </div>
      </div>
    </div>
  );
}
