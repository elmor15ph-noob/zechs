import React, { useEffect, useRef, useState, useCallback } from "react";
import { RefreshCw, Download, Filter, Terminal } from "lucide-react";

interface LogLine {
  line: string;
  level: "ERROR" | "WARNING" | "WARN" | "INFO" | "DEBUG";
}

interface LogsResponse {
  lines: LogLine[];
  total: number;
  file: string;
  exists: boolean;
}

interface LogsPanelProps {
  isDarkMode?: boolean;
}

const LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_COLOR: Record<string, string> = {
  ERROR: "#ef4444",
  WARNING: "#f59e0b",
  WARN: "#f59e0b",
  INFO: "#00d4ff",
  DEBUG: "#64748b",
};

const LEVEL_BG: Record<string, string> = {
  ERROR: "rgba(239,68,68,0.08)",
  WARNING: "rgba(245,158,11,0.07)",
  WARN: "rgba(245,158,11,0.07)",
  INFO: "transparent",
  DEBUG: "transparent",
};

export default function LogsPanel({ isDarkMode = true }: LogsPanelProps) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<Level>("INFO");
  const [paused, setPaused] = useState(false);
  const [logFile, setLogFile] = useState("");
  const [logExists, setLogExists] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const bg = isDarkMode ? "#0f1620" : "#f0f4f8";
  const cardBg = isDarkMode ? "#1a2332" : "#ffffff";
  const text = isDarkMode ? "#e0e8f0" : "#1f2937";
  const dim = isDarkMode ? "#94a3b8" : "#64748b";
  const accent = isDarkMode ? "#00d4ff" : "#ff6b35";
  const border = isDarkMode ? "#2a3a4a" : "#e2e8f0";
  const codeBg = isDarkMode ? "#0a1018" : "#f8fafc";

  const fetch_logs = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/logs?limit=300&level=DEBUG`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LogsResponse = await res.json();
      setLines(data.lines);
      setLogFile(data.file);
      setLogExists(data.exists);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_logs();
    if (!paused) {
      const id = setInterval(fetch_logs, 3000);
      return () => clearInterval(id);
    }
  }, [fetch_logs, paused]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoScroll(nearBottom);
  };

  const minOrder = LEVELS.indexOf(filterLevel);
  const visible = lines.filter((l) => {
    const lvl = (l.level === "WARN" ? "WARNING" : l.level) as Level;
    return LEVELS.indexOf(lvl) <= minOrder;
  });

  const download = () => {
    const blob = new Blob([visible.map((l) => l.line).join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brain_app.log";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: bg, color: text, minHeight: "100vh", padding: "1.25rem", fontFamily: "'Community', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Terminal size={24} color={accent} style={{ filter: `drop-shadow(0 0 8px ${accent}66)` }} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: accent }}>System Logs</h1>
            <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: dim, fontFamily: "monospace" }}>
              {logFile || "brain_app.log"}
              {!logExists && " — not found (start the backend to generate)"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Level filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Filter size={14} color={dim} />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as Level)}
              style={{
                background: cardBg,
                color: text,
                border: `1px solid ${border}`,
                borderRadius: "6px",
                padding: "0.35rem 0.6rem",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}+</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setPaused((p) => !p)}
            style={{
              background: paused ? "rgba(245,158,11,0.12)" : cardBg,
              border: `1px solid ${paused ? "#f59e0b" : border}`,
              color: paused ? "#f59e0b" : text,
              padding: "0.35rem 0.75rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>

          <button
            onClick={fetch_logs}
            style={{ background: cardBg, border: `1px solid ${border}`, color: text, padding: "0.35rem 0.6rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>

          <button
            onClick={download}
            style={{ background: cardBg, border: `1px solid ${border}`, color: text, padding: "0.35rem 0.6rem", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem" }}
          >
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {(["ERROR", "WARNING", "INFO", "DEBUG"] as const).map((lvl) => {
          const count = lines.filter((l) => (l.level === "WARN" ? "WARNING" : l.level) === lvl).length;
          return (
            <div key={lvl} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: LEVEL_COLOR[lvl], display: "inline-block" }} />
              <span style={{ color: dim }}>{lvl}</span>
              <span style={{ color: LEVEL_COLOR[lvl], fontWeight: 700 }}>{count}</span>
            </div>
          );
        })}
        <span style={{ color: dim, fontSize: "0.8rem", marginLeft: "auto" }}>
          {visible.length} of {lines.length} lines · {paused ? "⏸ paused" : "● live"}
        </span>
      </div>

      {/* Log output */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: dim }}>Loading logs…</div>
      ) : error ? (
        <div style={{ padding: "1rem", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: "8px", color: "#fca5a5", fontSize: "0.875rem" }}>
          {error}
        </div>
      ) : !logExists ? (
        <div style={{ padding: "2rem", background: cardBg, border: `1px solid ${border}`, borderRadius: "10px", textAlign: "center", color: dim }}>
          <Terminal size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
          <p style={{ margin: 0 }}>Log file not found. Restart the backend to generate <code>brain_app.log</code>.</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            background: codeBg,
            border: `1px solid ${border}`,
            borderRadius: "10px",
            padding: "0.75rem",
            height: "calc(100vh - 200px)",
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "0.78rem",
          }}
        >
          {visible.length === 0 ? (
            <div style={{ color: dim, padding: "1rem", textAlign: "center" }}>No log lines at this level.</div>
          ) : (
            [...visible].reverse().map((entry, i) => (
              <div
                key={i}
                style={{
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  background: LEVEL_BG[entry.level] || "transparent",
                  borderLeft: entry.level === "ERROR" || entry.level === "WARNING" ? `3px solid ${LEVEL_COLOR[entry.level]}` : "3px solid transparent",
                  marginBottom: "1px",
                  lineHeight: 1.5,
                  wordBreak: "break-all",
                }}
              >
                <span style={{ color: LEVEL_COLOR[entry.level] || dim, fontWeight: entry.level === "ERROR" ? 700 : 400 }}>
                  {entry.line}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
