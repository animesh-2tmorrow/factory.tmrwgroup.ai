"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Mic } from "lucide-react";

interface VoiceProfile {
  id: string;
  provider: "BROWSER" | "AWS";
  voiceName: string | null;
  sttEnabled: boolean;
  ttsEnabled: boolean;
}

interface VoiceCapabilities {
  providers: Array<{ id: "BROWSER" | "AWS"; label: string; available: boolean }>;
  notes: string[];
}

export default function VoicePage() {
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [capabilities, setCapabilities] = useState<VoiceCapabilities | null>(null);
  const [provider, setProvider] = useState<"BROWSER" | "AWS">("BROWSER");
  const [voiceName, setVoiceName] = useState("");
  const [sttEnabled, setSttEnabled] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, capabilitiesRes] = await Promise.all([
        fetch("/api/voice/profile", { cache: "no-store" }),
        fetch("/api/voice/capabilities", { cache: "no-store" }),
      ]);
      const [profileBody, capabilitiesBody] = await Promise.all([profileRes.json(), capabilitiesRes.json()]);
      if (!profileBody.success) throw new Error(profileBody.error || "Failed to load voice profile");
      if (!capabilitiesBody.success) throw new Error(capabilitiesBody.error || "Failed to load voice capabilities");
      const savedProfile = (profileBody.data ?? null) as VoiceProfile | null;
      setProfile(savedProfile);
      setCapabilities(capabilitiesBody.data as VoiceCapabilities);
      if (savedProfile) {
        setProvider(savedProfile.provider);
        setVoiceName(savedProfile.voiceName ?? "");
        setSttEnabled(savedProfile.sttEnabled);
        setTtsEnabled(savedProfile.ttsEnabled);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load voice settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    setError(null);
    try {
      const response = await fetch("/api/voice/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider,
          voiceName: voiceName.trim() || undefined,
          sttEnabled,
          ttsEnabled,
        }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to save profile");
      setProfile(body.data as VoiceProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  return (
    <>
      <Header title="Voice" description="Speech-to-text and text-to-speech profile for runtime interactions" />
      <div className="page-container vf-section-stack">
        {error && <div className="vf-card vf-card-pad" style={{ borderColor: "var(--error)", color: "var(--error)" }}>{error}</div>}

        <div className="vf-card vf-card-pad">
          <div className="vf-title" style={{ marginBottom: "var(--space-3)" }}>Voice Profile</div>
          {loading ? (
            <div className="vf-muted">Loading profile...</div>
          ) : (
            <>
              <div className="vf-grid-2" style={{ marginBottom: "var(--space-3)" }}>
                <select className="vf-select" value={provider} onChange={(e) => setProvider(e.target.value as "BROWSER" | "AWS")}>
                  {(capabilities?.providers ?? []).map((item) => (
                    <option key={item.id} value={item.id} disabled={!item.available}>
                      {item.label} {!item.available ? "(Unavailable)" : ""}
                    </option>
                  ))}
                </select>
                <input className="vf-input" placeholder="Voice name (optional)" value={voiceName} onChange={(e) => setVoiceName(e.target.value)} />
              </div>
              <div className="vf-row" style={{ gap: "var(--space-5)", marginBottom: "var(--space-3)" }}>
                <label className="vf-row" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={sttEnabled} onChange={(e) => setSttEnabled(e.target.checked)} />
                  <span>Enable STT</span>
                </label>
                <label className="vf-row" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={ttsEnabled} onChange={(e) => setTtsEnabled(e.target.checked)} />
                  <span>Enable TTS</span>
                </label>
              </div>
              <div className="vf-row" style={{ justifyContent: "space-between" }}>
                <div className="vf-muted" style={{ fontSize: "var(--text-xs)" }}>
                  {profile ? `Last saved profile: ${profile.provider}` : "No saved profile yet"}
                </div>
                <button className="vf-button-primary" onClick={() => void save()}>
                  <Mic size={14} />
                  Save Voice Profile
                </button>
              </div>
            </>
          )}
        </div>

        {!!capabilities?.notes?.length && (
          <div className="vf-card vf-card-pad">
            <div className="vf-title" style={{ marginBottom: "var(--space-2)" }}>Notes</div>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              {capabilities.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
