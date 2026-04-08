import { useState, useEffect } from "react";
import { api } from "../api";
import { CERT_CONFIGS } from "../data/questions";

const CERT_NAMES = {
  "google-ai-leadership": "Google AI Leadership Certification",
  "cisco-aitech": "Cisco AI Technical Practitioner (810-110 AITECH)",
  "hpe-ase-ai": "HPE ASE – AI Solutions",
  "aws-ai-practitioner": "AWS Certified AI Practitioner",
  "sc-900": "SC-900: Security, Compliance & Identity Fundamentals",
  "az-900": "AZ-900: Azure Fundamentals",
  "az-500": "AZ-500: Azure Security Engineer Associate",
  "ms-500": "MS-500: Microsoft 365 Security Administrator",
};

export default function Setup({ certId, onStart, onBack }) {
  const [count, setCount] = useState(10);
  const [selectedCats, setSelectedCats] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = CERT_CONFIGS[certId] || CERT_CONFIGS["google-ai-leadership"];
  const certName = CERT_NAMES[certId] || certId;

  useEffect(() => {
    api.getProgress(certId).then(setProgress).catch(() => {});
  }, [certId]);

  const weakCategories = progress?.weakCategories || [];

  const toggleCat = (cat) =>
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const loadingTime = count <= 10 ? "~60 seconds" : count <= 20 ? "~2 minutes" : "~3 minutes";

  const handleStart = async () => {
    setError("");
    setLoading(true);
    try {
      const focusCategories = selectedCats.length > 0
        ? weakCategories.filter((w) => selectedCats.includes(w.category))
        : weakCategories;
      const data = await api.generateQuestions(count, focusCategories, certId);
      onStart({ questions: data.questions, count, certId });
    } catch (err) {
      setError("Could not generate questions. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen setup-screen">
      <button className="back-btn" onClick={onBack}>← Back to dashboard</button>

      <div className="setup-cert-header">
        <p className="setup-cert-name">{certName}</p>
        <h2 className="setup-title">Configure your quiz</h2>
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
                {progress.latest ? Math.round((progress.latest.score / progress.latest.total) * 100) + "%" : "—"}
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
            <p className="focus-note">AI will focus on: <strong>{weakCategories.map((w) => w.category).join(", ")}</strong></p>
          )}
        </div>
      )}

      <div className="setup-card">
        <div className="field">
          <div className="field-header">
            <label className="field-label">Number of questions</label>
            <span className="field-value">{count}</span>
          </div>
          <input type="range" min={5} max={25} step={5} value={count}
            onChange={(e) => setCount(Number(e.target.value))} className="slider" />
          <div className="slider-labels"><span>5 (quick)</span><span>25 (full)</span></div>
        </div>

        <div className="field">
          <label className="field-label">Focus on specific categories</label>
          <p className="field-hint">Leave all unselected to let AI focus on your weak areas automatically.</p>
          <div className="category-grid">
            {categories.map((cat) => {
              const weak = weakCategories.find((w) => w.category === cat);
              return (
                <button key={cat}
                  className={`cat-chip ${selectedCats.includes(cat) ? "active" : ""}`}
                  onClick={() => toggleCat(cat)}>
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
              <span>Generating {count} questions…<br />
                <span style={{ fontSize: "12px", opacity: 0.75 }}>This takes {loadingTime} for AI to reason through your weak areas</span>
              </span>
            ) : "AI-generated · Adapts to your weak areas each session"}
          </span>
          <button className="primary-btn" onClick={handleStart} disabled={loading}>
            {loading ? "Generating…" : "Start quiz →"}
          </button>
        </div>
      </div>
    </div>
  );
}
