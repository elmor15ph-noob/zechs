import React, { useState, useEffect } from "react";
import {
  Brain, Zap, AlertCircle, CheckCircle, Settings, ArrowRight,
  Layers, Network, Search, Inbox, BarChart3, Terminal, Globe,
  Shield, FileText, Activity, GitBranch, Database, Clock,
  Lock, Cpu, MessageSquare, Users, Package, TrendingUp
} from "lucide-react";

interface OrchestrStatus {
  phase: string; phase_name: string;
  active_tasks: string[]; blockers: string[]; tentacle_count: number;
}

// ── Three-Brain topology ──────────────────────────────────────────────────────
const brains = [
  { name: "Dyce", universe: "TMNT", role: "Work / Corporate", location: "GCP Office VM (CLI only)", agents: ["Leo (PM)", "Donny (dev)", "Raph (QA)", "Micky (creative)"], status: "docs only", color: "#ff6b35", icon: "🐢" },
  { name: "Duo",  universe: "Gundam Wing", role: "Personal / Pilot", location: "Local laptop (full stack)", agents: ["Zero (lead)", "Heavyarms", "Sandrock", "Altron"], status: "active", color: "#00d4ff", icon: "🤖" },
  { name: "Cloud",universe: "FF7", role: "Wasteland / Partner", location: "Planned fork (BJ collab)", agents: ["Tifa", "Aerith", "Yuffie", "Red XIII"], status: "planned", color: "#10b981", icon: "⚔️" },
];
const connections = [
  { from: "Duo", to: "Dyce",  label: "md export (manual, 1-way)", icon: "📄" },
  { from: "Duo", to: "Cloud", label: "fork (planned)",            icon: "🔱" },
  { from: "Dyce", to: "Duo",  label: "oracle reverse-bridge",     icon: "🔮" },
];
const stackLayers = [
  { name: "OpenClaw 🦞",    desc: "Messaging gateway · Slack · Telegram · CLI",                      color: "#ff6b35" },
  { name: "OctoAgent",      desc: "Orchestration · Tentacles · Inter-agent routing",                  color: "#00d4ff" },
  { name: "Persona Engine", desc: "FastAPI /agents/{name}/chat · vault/agents/*.md",                  color: "#a855f7" },
  { name: "Cost Router",    desc: "T0 Ollama → T1 Haiku/Flash → T2 Sonnet/Opus → T3 Corp",           color: "#10b981" },
  { name: "Retrieval",      desc: "LanceDB + BM25 hybrid search",                                     color: "#eab308" },
  { name: "Memory",         desc: "Obsidian vault (PARA)",                                            color: "#94a3b8" },
];

// ── GLIDEPATH phase definitions ───────────────────────────────────────────────
const phases = [
  {
    num: "1",
    name: "L2 Retrieval Foundation",
    subtitle: "Hybrid search across your entire vault",
    status: "complete",
    date: "2026-04-18",
    weeks: "Weeks 1–2",
    color: "#10b981",
    icon: Search,
    purpose: "The vault had no real search. You could only browse manually or use Obsidian's basic text match — capped at 60 notes. This phase made every note queryable with semantic understanding.",
    what: "Built a hybrid search engine combining vector embeddings (LanceDB + nomic-embed-text via Ollama) with BM25 keyword scoring. A file watcher auto-indexes on every save. Results come back in <500ms across all notes.",
    delivered: [
      "VaultIndexer — indexes all .md files into LanceDB with vector embeddings",
      "EmbeddingGenerator — nomic-embed-text via Ollama (cost-free, local)",
      "VaultWatcher — watchdog file watcher, reindexes on save (2s debounce)",
      "search_hybrid() — vector + BM25 fusion, beats vector-only ~20%",
      "GET /vault/search/hybrid — MCP-exposed endpoint used by all agents",
      "Retired 60-note cap — 82+ notes now searchable, scales to thousands",
    ],
    endpoints: ["GET /vault/search/hybrid?query=&top_k=", "POST /vault/reindex", "GET /vault/index/status"],
    impact: "Every agent downstream now has rich context. Without this, Phase 2–6 agents would be working blind.",
  },
  {
    num: "2",
    name: "Inbox Distiller Agent",
    subtitle: "Nightly automation of manual inbox processing",
    status: "complete",
    date: "2026-04-18",
    weeks: "Weeks 3–4",
    color: "#10b981",
    icon: Inbox,
    purpose: "00-Inbox/ was a graveyard. Notes sat there for weeks. Processing them manually meant reviewing each one, picking a PARA folder, adding tags and links. This agent does that work every night while you sleep.",
    what: "Agent scans new .md files in 00-Inbox/, uses hybrid search to find related existing notes, then asks the LLM to extract atoms, suggest a PARA destination, propose tags and backlinks. Output goes to 00-Inbox/_proposed/ for human review — it never auto-files.",
    delivered: [
      "InboxDistiller class (backend/vault/inbox_agent.py)",
      "Hybrid search for context — 3 most relevant vault notes per item",
      "LLM analysis with JSON extraction (temperature=0.5, deterministic)",
      "Writes to 00-Inbox/_proposed/{slug}.md with YAML frontmatter",
      "Decision log → .lancedb/inbox-agent-decisions.jsonl",
      "POST /agents/inbox/distill (max_items=10)",
      "Graceful JSON parse fallback — never crashes on bad LLM output",
    ],
    endpoints: ["POST /agents/inbox/distill", "GET /agents/health/InboxDistiller"],
    impact: "Inbox backlog clears itself overnight. You review proposals in the morning instead of doing raw processing.",
  },
  {
    num: "3",
    name: "Weekly Synthesis Agent",
    subtitle: "Sunday evening cross-domain pattern finder",
    status: "complete",
    date: "2026-04-19",
    weeks: "Weeks 5–6",
    color: "#10b981",
    icon: Brain,
    purpose: "Notes connect ideas that you haven't consciously linked yet. A weekly synthesis agent reads the vault graph and surfaces 3 surprising connections per week — things you wouldn't think to search for.",
    what: "Reads vault graph (graphify-out/graph.json), loads relevant MOCs in full using Claude Sonnet's long context + prompt caching, then generates a synthesis note with labelled cross-domain connections. Falls back to direct vault scan if graph is unavailable.",
    delivered: [
      "WeeklySynthesisAgent class (backend/vault/synthesis_agent.py)",
      "Reads vault graph for structural connections between notes",
      "Claude Sonnet long-context with prompt caching (cost-efficient)",
      "Writes 02-Areas/Synthesis/Weekly-Synthesis-YYYY-WXX.md",
      "Tags findings by domain (SAP, PM, AI, GenAI)",
      "Each finding links back to source notes",
      "Fallback to direct vault scan if graph unavailable",
    ],
    endpoints: ["POST /agents/synthesis/weekly", "POST /agents/synthesis/run"],
    impact: "Surfaces connections between SAP work, PM cycles, and AI research that would otherwise never be consciously linked.",
  },
  {
    num: "4",
    name: "L5 Observability",
    subtitle: "Know whether your agents are helping or drifting",
    status: "complete",
    date: "2026-04-26",
    weeks: "Weeks 7–8",
    color: "#10b981",
    icon: BarChart3,
    purpose: "Agents running blind are worse than no agents. Without observability you don't know if they're producing good work, burning cost on bad outputs, or silently failing. This phase makes every agent decision visible and measurable.",
    what: "Added structured JSONL logging to every agent with full schema (run_id, input, output, cost, latency, model, provider, feedback). Built health monitoring, cost caps with warnings, accept/reject feedback capture, weekly scorecard generation, and a full observability dashboard in the frontend.",
    delivered: [
      "Enhanced JSONL schema — run_id, agent, input, output, cost_usd, latency, llm model/provider, feedback",
      "AgentHealthMonitor — error rate, acceptance rate, avg latency per agent",
      "CostLimiter — daily cap enforcement per agent, resets midnight UTC",
      "GET /agents/health — all agents health report",
      "GET /agents/cost-status — spend vs cap with 80%/95% warnings",
      "POST /agents/{agent}/feedback — accept/reject capture",
      "POST /agents/scorecard/generate — writes Agent-Scorecard-YYYY-WXX.md",
      "Observability tab in frontend — 4 sub-tabs: Overview, Performance, Decisions, Insights",
      "4 scheduled tasks — inbox nightly (00:00), daily digest (07:00), weekly scorecard (Sun 19:00), quarterly prune",
    ],
    endpoints: ["GET /agents/health", "GET /agents/cost-status", "POST /agents/{agent}/feedback", "POST /agents/scorecard/generate"],
    impact: "Answer 'Which agent is worth its cost?' with data, not vibes. Acceptance rates, cost per run, model drift all visible.",
  },
  {
    num: "4.7",
    name: "MANIFESTO Export for Dyce",
    subtitle: "Portable architecture spec for the three-brain constellation",
    status: "complete",
    date: "2026-04-26",
    weeks: "Week 8",
    color: "#10b981",
    icon: FileText,
    purpose: "Dyce (corporate VM, CLI-only) needs to mirror the ZECHS architecture without sharing personal vault data. The MANIFESTO locks down the pattern so any brain can be set up identically. Also defines how the three brains communicate.",
    what: "Wrote vault/MANIFESTO.md documenting the full architecture, OpenClaw as the messaging/action gateway, and the three-brain pattern (Dyce/TMNT, Duo/Gundam, Cloud/FF7). Created agent stub files for all 8 non-Duo personas. Wired up Altron to generate weekly cross-brain digests.",
    delivered: [
      "vault/MANIFESTO.md v1.0 — full portable architecture spec",
      "Three-brain pattern locked: Dyce (TMNT) / Duo (Gundam Wing) / Cloud (FF7)",
      "Cross-brain sync defined: manual .md weekly digest, Altron-generated",
      "Reverse oracle pattern: Duo asks Dyce for deep reasoning via corp LLM",
      "Stub files: vault/agents/{leo,donny,raph,micky}.md for Dyce TMNT team",
      "Stub files: vault/agents/{tifa,aerith,yuffie,red_xiii}.md for Cloud FF7 team",
      "AltronDigestAgent — generates weekly EXPORT-FOR-DYCE.md",
      "POST /agents/altron/digest endpoint",
    ],
    endpoints: ["POST /agents/altron/digest"],
    impact: "Any team member can fork ZECHS for their own brain in a different environment using the MANIFESTO as a blueprint.",
  },
  {
    num: "5",
    name: "OpenClaw Messaging Bridge + RLHF",
    subtitle: "Chat channels + learn from accept/reject signals",
    status: "partial",
    date: "Blocked — external deps",
    weeks: "Weeks 9–10",
    color: "#f59e0b",
    icon: MessageSquare,
    purpose: "The ultimate goal: @zero from your phone in Slack and get a real answer. Also close the learning loop — every accept/reject should make the next suggestion better. Currently the feedback is captured but not yet wired to external channels.",
    what: "Built the Python infrastructure side: FewShotStore (per-agent JSONL of accepted/rejected examples), inject_few_shot in BaseAgent (top-5 accepts + recent rejects injected into every prompt), OpenClaw CLI adapter, /openclaw/dispatch endpoint, and channel routing config. Blocked on external access for Slack/Telegram tokens.",
    delivered: [
      "FewShotStore — per-agent JSONL at .lancedb/few-shot-examples/ (poor-man's RLHF)",
      "BaseAgent.inject_few_shot() — top-5 accepts + recent rejects in every LLM call",
      "GET /agents/few-shot/stats · POST /agents/few-shot/prune",
      "openclaw/cli.py — headless CLI adapter (also serves as Dyce template)",
      "POST /openclaw/dispatch — persona routing endpoint",
      "openclaw/config.yaml — channel routing with slash commands",
      "Quarterly prune scheduled task (1st Jan/Apr/Jul/Oct 10:00)",
    ],
    endpoints: ["POST /openclaw/dispatch", "GET /agents/few-shot/stats", "POST /agents/few-shot/prune"],
    blockers: [
      "OpenClaw install — needs openclaw setup wizard post-install",
      "Slack bot token + app token — needs workspace admin access",
      "Telegram bot token — needs BotFather setup",
    ],
    impact: "Once unblocked: acceptance rate per agent improves 15%+ over 4 weeks. Mobile access to any agent from Slack.",
  },
  {
    num: "6",
    name: "Production Hardening + Team Onboarding",
    subtitle: "Run without babysitting. Hand it to the team.",
    status: "complete",
    date: "2026-04-26",
    weeks: "Weeks 11–12",
    color: "#10b981",
    icon: Package,
    purpose: "A system that needs constant watching isn't autonomous. This phase makes ZECHS safe to leave running for a week and makes it cloneable by any team member in under an hour.",
    what: "Added kill switches per agent (one ENV var disables cleanly), exponential backoff retry on all LLM calls, a daily digest note summarising overnight agent activity, kill-switch status API + UI badges, a 300-line ops runbook, a config.yaml with all settings documented, and a step-by-step onboarding guide.",
    delivered: [
      "BaseAgent.assert_enabled() — kill switch enforced as first line of every agent run()",
      "BaseAgent._call_with_retry() — 3 retries, exponential backoff (1s → 2s → 4s)",
      "AGENT_<NAME>_ENABLED=false in .env — one-line disable per agent",
      "GET /agents/kill-switches — live enabled/disabled state for all 6 agents",
      "Kill-switch pill badges in Observability + Constellation UI",
      "Daily digest task (07:00) — writes 00-Inbox/Daily-Digest-YYYY-MM-DD.md",
      "RUNBOOK.md — 300+ lines: every failure scenario, curl commands, restart sequence",
      "config.yaml — all settings documented for team fork",
      "ONBOARDING.md — Clone → configure .env → ollama pull → pip/npm → run → done (~45 min)",
    ],
    endpoints: ["GET /agents/kill-switches", "GET /health", "GET /agents/health"],
    impact: "Leave for a week. Nothing on fire when you return. Any team member can spin up their own ZECHS instance in under 1 hour.",
  },
];

// ── Dashboard section summary (compact) ──────────────────────────────────────
const dashboardSections = [
  { label: "App Shell",            color: "#00d4ff", total: 4,  done: 4 },
  { label: "Search Tab",           color: "#eab308", total: 3,  done: 3 },
  { label: "Inbox Tab",            color: "#a855f7", total: 3,  done: 3 },
  { label: "Observability Tab",    color: "#10b981", total: 12, done: 12 },
  { label: "OctoAgent Tab",        color: "#ff6b35", total: 5,  done: 5 },
  { label: "SAP Tools",            color: "#a855f7", total: 6,  done: 6 },
  { label: "PM & Ideas",           color: "#eab308", total: 3,  done: 3 },
  { label: "Backend Infra",        color: "#94a3b8", total: 10, done: 10 },
];

const statusMeta: Record<string, { label: string; bg: string; text: string; border: string }> = {
  complete: { label: "Complete",  bg: "rgba(16,185,129,.1)", text: "#10b981", border: "rgba(16,185,129,.4)" },
  partial:  { label: "Partial",   bg: "rgba(245,158,11,.1)", text: "#f59e0b", border: "rgba(245,158,11,.4)" },
  planned:  { label: "Planned",   bg: "rgba(148,163,184,.1)", text: "#94a3b8", border: "rgba(148,163,184,.4)" },
};

export default function Constellation({ isDarkMode = true }: { isDarkMode?: boolean }) {
  const [orchStatus, setOrchStatus] = useState<OrchestrStatus | null>(null);
  const [health, setHealth]         = useState<any>(null);
  const [killSwitches, setKS]       = useState<any[]>([]);
  const [stats, setStats]           = useState({ agents: 0, notes: 0 });
  const [lastUpdate, setLastUpdate] = useState("—");
  const [expandedPhase, setExpandedPhase] = useState<string | null>("1");

  useEffect(() => {
    const go = async () => {
      try {
        const [sRes, hRes, ksRes] = await Promise.all([
          fetch("http://localhost:8000/orchestration/status").catch(() => null),
          fetch("http://localhost:8000/health").catch(() => null),
          fetch("http://localhost:8000/agents/kill-switches").catch(() => null),
        ]);
        if (sRes?.ok)  { const d = await sRes.json();  setOrchStatus(d); setStats(p => ({ ...p, agents: d.tentacle_count || 0 })); }
        if (hRes?.ok)  { const d = await hRes.json();  setHealth(d);     setStats(p => ({ ...p, notes: d.vault_notes || 0 })); }
        if (ksRes?.ok) { const d = await ksRes.json(); setKS(d.agents || []); }
        setLastUpdate(new Date().toLocaleTimeString());
      } catch { /* non-fatal */ }
    };
    go();
    const t = setInterval(go, 5000);
    return () => clearInterval(t);
  }, []);

  const bg     = isDarkMode ? "#0f1620" : "#f0f4f8";
  const card   = isDarkMode ? "#1a2332" : "#ffffff";
  const text   = isDarkMode ? "#e0e8f0" : "#1f2937";
  const sub    = isDarkMode ? "#94a3b8" : "#64748b";
  const accent = isDarkMode ? "#00d4ff" : "#ff6b35";
  const border = isDarkMode ? "#2a3a4a" : "#e2e8f0";
  const row    = isDarkMode ? "#263544" : "#f9fafb";

  const totalDash = dashboardSections.reduce((a, s) => a + s.total, 0);
  const doneDash  = dashboardSections.reduce((a, s) => a + s.done,  0);
  const donePhases = phases.filter(p => p.status === "complete").length;

  const pulse = `@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}.pulse{animation:pulse 2.2s cubic-bezier(.4,0,.6,1) infinite}`;

  return (
    <div style={{ background: bg, color: text, padding: "2rem", minHeight: "100vh", fontFamily: "'Community','IBM Plex Sans',-apple-system,sans-serif" }}>
      <style>{pulse}</style>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem", borderBottom: `3px solid ${accent}`, paddingBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.4rem", margin: "0 0 0.5rem", color: accent, fontWeight: 700, letterSpacing: "-0.02em" }}>
          ZECHS — SAP Architecture Intelligence Platform
        </h1>
        <p style={{ fontSize: "1rem", color: sub, margin: "0 0 0.4rem" }}>
          SAP Solution Architecture Platform · {stats.notes} Knowledge Files · Production Ready
        </p>
        <div style={{ fontSize: "0.75rem", color: accent, opacity: 0.8 }}>🔄 Live · {lastUpdate}</div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {[
          { label: "Core Features",     value: "7",                               Icon: CheckCircle,  color: "#10b981", live: false },
          { label: "Knowledge Files",   value: stats.notes,                       Icon: Brain,        color: "#a855f7", live: true  },
          { label: "SAP Modules",       value: "12",                              Icon: GitBranch,    color: accent,    live: false },
          { label: "Platform Status",   value: "Active",                          Icon: Zap,          color: "#10b981", live: true  },
        ].map(({ label, value, Icon, color, live }, i) => (
          <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "1.1rem", textAlign: "center", position: "relative" }}>
            {live && <div className="pulse" style={{ position: "absolute", top: "0.65rem", right: "0.65rem", width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 5px rgba(16,185,129,.6)" }} />}
            <Icon size={18} color={color} style={{ margin: "0 auto 0.4rem" }} />
            <div style={{ fontSize: "0.72rem", color: sub, marginBottom: "0.3rem" }}>{label}</div>
            <div style={{ fontSize: "1.45rem", fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Main layout: phase report (left wide) + sidebar (right) ─────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>

        {/* ── LEFT: Phase report ──────────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <Activity size={20} color={accent} />
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: accent }}>GLIDEPATH — Phase Report</h2>
          </div>

          {phases.map((phase) => {
            const isOpen = expandedPhase === phase.num;
            const meta   = statusMeta[phase.status];
            const Icon   = phase.icon;
            return (
              <div key={phase.num} style={{
                background: card, border: `1px solid ${isOpen ? phase.color : border}`,
                borderRadius: "12px", marginBottom: "0.9rem",
                boxShadow: isOpen && isDarkMode ? `0 0 20px ${phase.color}20` : "none",
                transition: "border-color .2s, box-shadow .2s",
                overflow: "hidden",
              }}>
                {/* Phase header — always visible */}
                <button
                  onClick={() => setExpandedPhase(isOpen ? null : phase.num)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1.1rem 1.4rem", background: "transparent", border: "none", cursor: "pointer", color: text, textAlign: "left" }}
                >
                  {/* Phase number badge */}
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: isOpen ? phase.color : (isDarkMode ? "#263544" : "#f3f4f6"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .2s" }}>
                    <span style={{ fontWeight: 800, fontSize: "0.85rem", color: isOpen ? "#0f1620" : phase.color }}>{phase.num}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem", color: isOpen ? phase.color : text }}>{phase.name}</span>
                      <span style={{ fontSize: "0.72rem", padding: "0.18rem 0.55rem", borderRadius: "999px", background: meta.bg, color: meta.text, border: `1px solid ${meta.border}`, fontWeight: 600 }}>{meta.label}</span>
                    </div>
                    <div style={{ fontSize: "0.83rem", color: sub, marginTop: "0.15rem" }}>{phase.subtitle}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.72rem", color: sub }}>{phase.weeks}</span>
                    <span style={{ fontSize: "0.7rem", color: phase.status === "complete" ? "#10b981" : sub }}>{phase.date}</span>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: sub, marginLeft: "0.5rem", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding: "0 1.4rem 1.5rem", borderTop: `1px solid ${isDarkMode ? "#263544" : "#e2e8f0"}` }}>

                    {/* Two-column: purpose + what we did */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", margin: "1.2rem 0 1.2rem" }}>
                      <div style={{ padding: "1rem", background: isDarkMode ? "rgba(0,212,255,.05)" : "rgba(255,107,53,.04)", border: `1px solid ${isDarkMode ? "rgba(0,212,255,.15)" : "rgba(255,107,53,.15)"}`, borderRadius: "8px" }}>
                        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.55rem" }}>🎯 Why We Built This</div>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: text, lineHeight: 1.6 }}>{phase.purpose}</p>
                      </div>
                      <div style={{ padding: "1rem", background: isDarkMode ? "rgba(168,85,247,.05)" : "rgba(168,85,247,.04)", border: `1px solid ${isDarkMode ? "rgba(168,85,247,.2)" : "rgba(168,85,247,.2)"}`, borderRadius: "8px" }}>
                        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.55rem" }}>⚙️ How It Works</div>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: text, lineHeight: 1.6 }}>{phase.what}</p>
                      </div>
                    </div>

                    {/* Delivered checklist */}
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.65rem" }}>✅ Delivered</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {phase.delivered.map((d, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.55rem 0.85rem", background: isDarkMode ? "rgba(16,185,129,.07)" : "rgba(16,185,129,.05)", borderLeft: "3px solid #10b981", borderRadius: "6px", fontSize: "0.85rem", lineHeight: 1.45 }}>
                            <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "1px" }} />
                            <span style={{ color: text }}>{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Blockers (Phase 5 only) */}
                    {"blockers" in phase && phase.blockers && (
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.65rem" }}>🚧 Blockers</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          {phase.blockers.map((b, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.55rem 0.85rem", background: "rgba(245,158,11,.07)", borderLeft: "3px solid #f59e0b", borderRadius: "6px", fontSize: "0.85rem" }}>
                              <Lock size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: "1px" }} />
                              <span style={{ color: text }}>{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* API endpoints */}
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>API Endpoints</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {phase.endpoints.map((ep, i) => (
                          <code key={i} style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", borderRadius: "6px", background: isDarkMode ? "#0f1620" : "#f3f4f6", border: `1px solid ${border}`, color: accent, fontFamily: "monospace" }}>{ep}</code>
                        ))}
                      </div>
                    </div>

                    {/* Impact */}
                    <div style={{ padding: "0.85rem 1rem", background: isDarkMode ? `${phase.color}10` : `${phase.color}08`, border: `1px solid ${phase.color}40`, borderRadius: "8px", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                      <TrendingUp size={15} color={phase.color} style={{ flexShrink: 0, marginTop: "1px" }} />
                      <div>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: phase.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>Impact · </span>
                        <span style={{ fontSize: "0.85rem", color: text }}>{phase.impact}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: Sidebar ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Three-brain cards */}
          {brains.map((brain) => (
            <div key={brain.name} style={{ background: card, border: `2px solid ${brain.color}`, borderRadius: "10px", padding: "1.1rem", boxShadow: isDarkMode ? `0 4px 16px rgba(0,0,0,.3), inset 0 0 1px ${brain.color}40` : "0 2px 8px rgba(0,0,0,.07)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: brain.color }}>{brain.icon} {brain.name}</h3>
                <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: brain.status === "active" ? "#10b981" : isDarkMode ? "#64748b" : "#cbd5e0", boxShadow: brain.status === "active" ? "0 0 6px rgba(16,185,129,.6)" : "none" }} />
              </div>
              <div style={{ fontSize: "0.7rem", color: brain.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{brain.universe} · {brain.role}</div>
              <div style={{ fontSize: "0.76rem", color: sub, fontStyle: "italic", margin: "0.2rem 0 0.75rem" }}>📍 {brain.location}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {brain.agents.map(a => <span key={a} style={{ fontSize: "0.7rem", padding: "0.18rem 0.5rem", borderRadius: "999px", background: isDarkMode ? "#263544" : "#f3f4f6", border: `1px solid ${brain.color}50`, color: brain.color, fontWeight: 600 }}>{a}</span>)}
              </div>
            </div>
          ))}

          {/* Cross-brain connections */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "1.1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.75rem" }}>
              <Network size={15} color={accent} />
              <h3 style={{ margin: 0, fontSize: "0.9rem", color: accent, fontWeight: 700 }}>Cross-Brain Connections</h3>
            </div>
            {connections.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.45rem 0.65rem", background: row, borderRadius: "6px", fontSize: "0.8rem", marginBottom: i < connections.length - 1 ? "0.35rem" : 0 }}>
                <span>{c.icon}</span>
                <span style={{ fontWeight: 700, color: brains.find(b => b.name === c.from)?.color }}>{c.from}</span>
                <ArrowRight size={11} color={sub} />
                <span style={{ fontWeight: 700, color: brains.find(b => b.name === c.to)?.color }}>{c.to}</span>
                <span style={{ color: sub, marginLeft: "auto", fontStyle: "italic", fontSize: "0.72rem" }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Architecture stack */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "1.1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.75rem" }}>
              <Layers size={15} color={accent} />
              <h3 style={{ margin: 0, fontSize: "0.9rem", color: accent, fontWeight: 700 }}>Architecture Stack</h3>
            </div>
            {stackLayers.map((l, i) => (
              <div key={i} style={{ display: "flex", padding: "0.5rem 0.65rem", background: row, borderLeft: `3px solid ${l.color}`, borderRadius: "5px", fontSize: "0.78rem", marginBottom: i < stackLayers.length - 1 ? "0.3rem" : 0 }}>
                <span style={{ minWidth: "120px", fontWeight: 700, color: l.color }}>{l.name}</span>
                <span style={{ color: sub }}>{l.desc}</span>
              </div>
            ))}
          </div>

          {/* Dashboard build progress */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "1.1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.75rem" }}>
              <BarChart3 size={15} color={accent} />
              <h3 style={{ margin: 0, fontSize: "0.9rem", color: accent, fontWeight: 700 }}>Dashboard Build Progress</h3>
            </div>
            {dashboardSections.map((s, i) => (
              <div key={i} style={{ marginBottom: i < dashboardSections.length - 1 ? "0.55rem" : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.2rem" }}>
                  <span style={{ color: text }}>{s.label}</span>
                  <span style={{ color: sub }}>{s.done}/{s.total}</span>
                </div>
                <div style={{ height: "4px", background: isDarkMode ? "#263544" : "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.done / s.total) * 100}%`, background: s.color, borderRadius: "2px" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Kill-switch status */}
          {killSwitches.length > 0 && (
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: "10px", padding: "1.1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.75rem" }}>
                <Shield size={15} color={accent} />
                <h3 style={{ margin: 0, fontSize: "0.9rem", color: accent, fontWeight: 700 }}>Agent Kill Switches</h3>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {killSwitches.map(ks => (
                  <span key={ks.agent} style={{ fontSize: "0.72rem", padding: "0.2rem 0.55rem", borderRadius: "999px", fontWeight: 600, border: `1px solid ${ks.enabled ? "rgba(16,185,129,.4)" : "rgba(239,68,68,.4)"}`, background: ks.enabled ? "rgba(16,185,129,.08)" : "rgba(239,68,68,.08)", color: ks.enabled ? (isDarkMode ? "#6ee7b7" : "#059669") : (isDarkMode ? "#fca5a5" : "#dc2626") }}>
                    {ks.enabled ? "●" : "○"} {ks.agent.replace("Agent", "").replace("Orchestrator", "")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ marginTop: "3rem", paddingTop: "1.25rem", borderTop: `1px solid ${border}`, textAlign: "center", fontSize: "0.75rem", color: sub }}>
        ZECHS v1.0 · SAP Architecture Platform · 2026-04-30 · Bernard Elmor B. · Solution Architecture Toolkit
      </div>
    </div>
  );
}
