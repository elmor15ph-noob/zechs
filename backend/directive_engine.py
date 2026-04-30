"""
Directive Engine - Spawns agent teams based on GLIDEPATH directives

Reads the GLIDEPATH-Autonomous-Knowledge-System.md file from the vault and
spawns coordinated agent teams for:
- Phase 3: L1 Retrieval + Agent Parallelization
- Phase 4: Multi-Agent Orchestration + Feedback Loops

Each team is a set of agents running in parallel OctoGent tentacles.
"""

import re
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

from octogent_bridge import OctoGentBridge


class Phase(Enum):
    """GLIDEPATH phases"""
    PHASE_1 = 1
    PHASE_2 = 2
    PHASE_3 = 3
    PHASE_4 = 4
    PHASE_5 = 5


@dataclass
class GlidepathInfo:
    """Parsed GLIDEPATH information"""
    current_phase: Phase
    phase_name: str
    active_tasks: List[str]
    blockers: List[str]
    focus_areas: List[str]


class DirectiveEngine:
    """Spawns agent teams based on GLIDEPATH directives"""

    def __init__(self, vault_path: Optional[Path] = None, bridge: Optional[OctoGentBridge] = None):
        """
        Initialize directive engine.

        Args:
            vault_path: Path to vault (default: ~/Documents/SecondBrain)
            bridge: OctoGent bridge instance (default: new instance)
        """
        self.vault_path = vault_path or Path.home() / "Documents" / "SecondBrain"
        self.bridge = bridge or OctoGentBridge()
        self.glidepath_path = self.vault_path / "02-Areas" / "GLIDEPATH-Autonomous-Knowledge-System.md"

    def parse_glidepath(self) -> Optional[GlidepathInfo]:
        """
        Read and parse GLIDEPATH-Autonomous-Knowledge-System.md.

        Extracts:
        - Current phase
        - Phase name
        - Active tasks
        - Blockers
        - Focus areas

        Returns:
            GlidepathInfo object or None if file not found
        """
        if not self.glidepath_path.exists():
            print(f"GLIDEPATH not found at {self.glidepath_path}")
            return None

        content = self.glidepath_path.read_text(encoding="utf-8")

        # Parse phase from "Current Status" table (most authoritative)
        # Format: | Current phase | Phase N — Description | date |
        status_match = re.search(
            r'\|\s*[Cc]urrent\s+phase\s*\|\s*Phase\s+(\d+)\s*—?\s*([^|]+)\|',
            content
        )
        if status_match:
            phase_num = int(status_match.group(1))
            phase_name = f"Phase {phase_num} — {status_match.group(2).strip()}"
        else:
            # Fallback: search for "### Phase N" section headers (older format)
            phase_match = re.search(r'###\s+Phase\s+(\d+)[:\s]+([^\n]+)', content, re.IGNORECASE)
            if phase_match:
                phase_num = int(phase_match.group(1))
                phase_name = phase_match.group(2).strip()
            else:
                print("Could not determine current phase from GLIDEPATH")
                return None

        # Parse active tasks
        active_tasks = []
        tasks_section = re.search(r'## Active Tasks[^\n]*\n(.*?)(?=##|\Z)', content, re.DOTALL | re.IGNORECASE)
        if tasks_section:
            for line in tasks_section.group(1).split('\n'):
                line = line.strip()
                if line.startswith('- '):
                    active_tasks.append(line[2:].strip())

        # Parse blockers
        blockers = []
        blockers_section = re.search(r'## Blockers[^\n]*\n(.*?)(?=##|\Z)', content, re.DOTALL | re.IGNORECASE)
        if blockers_section:
            for line in blockers_section.group(1).split('\n'):
                line = line.strip()
                if line.startswith('- '):
                    blockers.append(line[2:].strip())

        # Parse focus areas
        focus_areas = []
        focus_section = re.search(r'## Focus[^\n]*\n(.*?)(?=##|\Z)', content, re.DOTALL | re.IGNORECASE)
        if focus_section:
            for line in focus_section.group(1).split('\n'):
                line = line.strip()
                if line.startswith('- '):
                    focus_areas.append(line[2:].strip())

        try:
            phase = Phase(phase_num)
        except ValueError:
            phase = Phase.PHASE_3  # Default to Phase 3

        return GlidepathInfo(
            current_phase=phase,
            phase_name=phase_name,
            active_tasks=active_tasks,
            blockers=blockers,
            focus_areas=focus_areas
        )

    def spawn_team(self, phase: Optional[Phase] = None) -> List[str]:
        """
        Spawn appropriate agent team for current phase.

        Args:
            phase: Specific phase to spawn for (default: read from GLIDEPATH)

        Returns:
            List of spawned agent names
        """
        if phase is None:
            glidepath = self.parse_glidepath()
            if not glidepath:
                print("Cannot determine phase from GLIDEPATH")
                return []
            phase = glidepath.current_phase

        if phase == Phase.PHASE_3:
            return self.spawn_team_l1_retrieval()
        elif phase == Phase.PHASE_4:
            return self.spawn_team_multi_agent()
        else:
            print(f"No team spawning configured for {phase.name}")
            return []

    def spawn_team_l1_retrieval(self) -> List[str]:
        """
        Spawn Phase 3 team: L1 Retrieval + Agent Parallelization.

        Agents:
        - Vault Indexer: Re-index vault with LanceDB
        - Retrieval Validator: Test L1 retrieval quality
        - Performance Monitor: Track retrieval latency + accuracy

        Returns:
            List of spawned agent names
        """
        agents = [
            "vault_indexer",
            "retrieval_validator",
            "perf_monitor"
        ]

        for agent in agents:
            # Register agent first to create directory structure
            self.bridge.register_agent(agent, f"phase3_{agent}", f"Phase 3: {agent}")

            context = {
                "task": f"Execute Phase 3 task: {agent}",
                "phase": "Phase 3: L1 Retrieval + Agent Parallelization",
                "input": {
                    "vault_path": str(self.vault_path),
                    "index_type": "hybrid",  # BM25 + vector
                    "test_queries": 50
                },
                "constraints": [
                    "No modifications to production vault",
                    "Report results to vault/logs/",
                    "Latency target: <500ms per query"
                ],
            }

            self.bridge.write_context(agent, context)
            result = self.bridge.spawn_agent(agent, "claude code")

            if result["success"]:
                print(f"[OK] Spawned {agent}")
            else:
                print(f"[FAIL] Failed to spawn {agent}: {result.get('error')}")

        return agents

    def spawn_team_multi_agent(self) -> List[str]:
        """
        Spawn Phase 4 team: Multi-Agent Orchestration + Feedback Loops.

        Agents:
        - Status Collector: Gather Jira + Excel data
        - Trend Analyzer: Detect patterns, anomalies
        - Recommender: Suggest actions
        - Report Writer: Format findings

        Returns:
            List of spawned agent names
        """
        agents = [
            "status_collector",
            "trend_analyzer",
            "recommender",
            "report_writer"
        ]

        for agent in agents:
            descriptions = {
                "status_collector": "Gather project status from Jira + Excel. Extract: in-progress, blockers, metrics.",
                "trend_analyzer": "Analyze status data for trends. Detect: scope creep, velocity changes, risk patterns.",
                "recommender": "Generate recommendations based on trends. Prioritize: high-impact actions, risk mitigation.",
                "report_writer": "Format all findings into weekly status report. Structure: status, trends, recommendations."
            }

            context = {
                "task": descriptions.get(agent, f"Execute Phase 4 task: {agent}"),
                "phase": "Phase 4: Multi-Agent Orchestration + Feedback Loops",
                "cycle": "Weekly PM Cycle",
                "input": {
                    "vault_path": str(self.vault_path),
                    "glidepath": str(self.glidepath_path),
                    "week": datetime.now().isocalendar()[1]
                },
                "constraints": [
                    "Coordinate with other agents (A→B→C→D pipeline)",
                    "Each agent reads from predecessor's output",
                    "All results written to vault/01-Projects/RAG-Reports/",
                    "Total time budget: 15 minutes"
                ],
            }

            # Register agent first to create directory structure
            self.bridge.register_agent(agent, f"phase4_{agent}", descriptions.get(agent, f"Phase 4: {agent}"))
            self.bridge.write_context(agent, context)
            result = self.bridge.spawn_agent(agent, "claude code")

            if result["success"]:
                print(f"[OK] Spawned {agent}")
            else:
                print(f"[FAIL] Failed to spawn {agent}: {result.get('error')}")

        return agents

    def spawn_team_pm_cycle(self) -> List[str]:
        """
        Spawn weekly PM cycle team (Phase 4 variant).

        Same as spawn_team_multi_agent() but named explicitly for PM use case.
        """
        return self.spawn_team_multi_agent()

    def spawn_team_feature(self, feature_name: str) -> List[str]:
        """
        Spawn feature development team.

        Agents:
        - Frontend Dev: Build React components
        - Backend Dev: Implement FastAPI endpoints
        - Test Dev: Write unit + integration tests
        - Docs Dev: Update README, API docs

        Each gets isolated worktree + tentacle.

        Args:
            feature_name: Feature identifier (e.g., "fiori-design", "multi-agent-spawn")

        Returns:
            List of spawned agent names
        """
        agents = [
            f"frontend_{feature_name}",
            f"backend_{feature_name}",
            f"test_{feature_name}",
            f"docs_{feature_name}"
        ]

        descriptions = {
            "frontend": "Build React components for the feature. Follow design system. Add unit tests.",
            "backend": "Implement FastAPI endpoints. Add validation, error handling, tests.",
            "test": "Write comprehensive unit + integration tests. Aim for 80%+ coverage.",
            "docs": "Update README, API docs, ARCHITECTURE.md. Add examples."
        }

        for agent in agents:
            agent_type = agent.split('_')[0]
            # Register agent first to create directory structure
            self.bridge.register_agent(agent, f"feature_{agent_type}", f"Feature development: {agent}")

            context = {
                "task": descriptions.get(agent_type, f"Develop {feature_name} - {agent_type}"),
                "feature": feature_name,
                "branch": f"feature/{feature_name}/{agent_type}",
                "input": {
                    "vault_path": str(self.vault_path),
                    "feature_spec": f"See 01-Projects/FEATURE-{feature_name}.md"
                },
                "constraints": [
                    f"Work on branch: feature/{feature_name}/{agent_type}",
                    "Coordinate with other agents (parallel work)",
                    "All PRs against main feature branch: feature/{feature_name}",
                    "Code review required before merge"
                ],
            }

            self.bridge.write_context(agent, context)
            result = self.bridge.spawn_agent(agent, f"claude code --branch feature/{feature_name}/{agent_type}")

            if result["success"]:
                print(f"[OK] Spawned {agent}")
            else:
                print(f"[FAIL] Failed to spawn {agent}: {result.get('error')}")

        return agents

    def spawn_team_domain_analysis(self, domains: List[str]) -> List[str]:
        """
        Spawn domain specialist agents in parallel.

        For complex design decisions that need multiple expert perspectives.

        Args:
            domains: List of domains (e.g., ["SAP", "Workday", "DBG"])

        Returns:
            List of spawned agent names
        """
        agents = [f"{domain.lower()}_specialist" for domain in domains]

        domain_tasks = {
            "sap": "SAP configuration, FI/CO, O2C process design",
            "workday": "Workday HCM, payroll, compliance",
            "dbg": "Database design, performance, indexing",
            "aws": "Cloud architecture, scalability, cost optimization"
        }

        for agent in agents:
            domain = agent.split('_')[0].upper()
            # Register agent first to create directory structure
            self.bridge.register_agent(agent, f"domain_{domain}", f"Domain specialist: {domain}")

            context = {
                "task": f"Domain analysis: {domain} specialist",
                "domain": domain,
                "focus": domain_tasks.get(domain.lower(), f"{domain} expertise"),
                "input": {
                    "vault_path": str(self.vault_path),
                    "design_question": "See decision document in 00-Inbox/"
                },
                "constraints": [
                    f"Specialize in: {domain_tasks.get(domain.lower(), domain)}",
                    "Provide expert perspective on current design decision",
                    "Highlight trade-offs and risks specific to your domain",
                    "Coordinate with other domain specialists for holistic view"
                ],
            }

            self.bridge.write_context(agent, context)
            result = self.bridge.spawn_agent(agent, "claude code")

            if result["success"]:
                print(f"[OK] Spawned {agent}")
            else:
                print(f"[FAIL] Failed to spawn {agent}: {result.get('error')}")

        return agents

    def get_status(self) -> Dict[str, Any]:
        """Get current status of directive engine."""
        glidepath = self.parse_glidepath()
        tentacles = self.bridge.list_tentacles()

        return {
            "glidepath": {
                "phase": glidepath.current_phase.name if glidepath else "unknown",
                "phase_name": glidepath.phase_name if glidepath else "unknown",
                "active_tasks": glidepath.active_tasks if glidepath else [],
                "blockers": glidepath.blockers if glidepath else [],
            },
            "tentacles": tentacles,
            "tentacle_count": len(tentacles),
        }
