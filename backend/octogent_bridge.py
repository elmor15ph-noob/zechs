"""
OctoGent Bridge - Adapter for existing agents to OctoGent tentacles

Maps existing agents (Inbox, SAP, Synthesis, etc.) to OctoGent tentacle format.
Each agent becomes a tentacle with CONTEXT.md (task description) and todo.md (work items).

Architecture:
- OctoGent API (port 8787): manages tentacles, PTY sessions, dashboard
- FastAPI (port 8000): orchestrates agent spawning and decision logic
- Bridge: translates between agent execution and tentacle format
"""

import json
import requests
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime


class OctoGentBridge:
    """Adapter for existing agents → OctoGent tentacles"""

    def __init__(self, octogent_api_url: str = "http://localhost:8787", project_root: Optional[Path] = None):
        """
        Initialize the bridge.

        Args:
            octogent_api_url: URL of OctoGent API (default: http://localhost:8787)
            project_root: Project root (default: .octogent/ in current dir)
        """
        self.api_url = octogent_api_url.rstrip('/')
        self.project_root = project_root or Path('.octogent')
        self.tentacles_dir = self.project_root / 'tentacles'
        self.tentacles_dir.mkdir(parents=True, exist_ok=True)

    def register_agent(self, agent_name: str, agent_type: str, description: str = "") -> Dict[str, Any]:
        """
        Register an agent as an OctoAgent tentacle.

        Creates tentacle directory structure:
        .octogent/tentacles/{agent_name}/
        ├── CONTEXT.md (agent task description)
        ├── todo.md (work items)
        └── transcript.log (execution transcript)

        Args:
            agent_name: Unique agent identifier (e.g., "inbox", "sap", "synthesis")
            agent_type: Agent type (e.g., "inbox_distiller", "sap_crawler")
            description: Human-readable description of the agent's task

        Returns:
            Dictionary with tentacle metadata
        """
        tentacle_dir = self.tentacles_dir / agent_name
        tentacle_dir.mkdir(exist_ok=True)

        # Initialize CONTEXT.md (task description)
        context_path = tentacle_dir / "CONTEXT.md"
        if not context_path.exists():
            context_path.write_text(f"""# {agent_name.upper()} - {agent_type}

## Task
{description}

## Status
- Status: idle
- Last Run: Never
- Success Rate: 0%

## Notes
Task context will be updated here before spawning agent.
""", encoding='utf-8')

        # Initialize todo.md (work items)
        todo_path = tentacle_dir / "todo.md"
        if not todo_path.exists():
            todo_path.write_text(f"""# TODO - {agent_name}

- [ ] Initialize tentacle
- [ ] Load context from CONTEXT.md
- [ ] Execute primary task
- [ ] Write results
- [ ] Update status

## Results
(Results will be appended here)
""", encoding='utf-8')

        # Initialize transcript.log
        log_path = tentacle_dir / "transcript.log"
        if not log_path.exists():
            log_path.write_text(f"[{datetime.now().isoformat()}] Tentacle initialized\n")

        return {
            "name": agent_name,
            "type": agent_type,
            "directory": str(tentacle_dir),
            "context_file": str(context_path),
            "todo_file": str(todo_path),
            "log_file": str(log_path),
        }

    def write_context(self, tentacle_name: str, context: Dict[str, Any]) -> bool:
        """
        Write task context to CONTEXT.md.

        Agents read this file to understand their task, input data, and constraints.

        Args:
            tentacle_name: Tentacle identifier
            context: Dictionary with context data (will be formatted as markdown)

        Returns:
            True if successful, False otherwise
        """
        context_path = self.tentacles_dir / tentacle_name / "CONTEXT.md"

        try:
            # Format context as markdown
            lines = [f"# {tentacle_name.upper()} Context\n"]

            for key, value in context.items():
                if key == "task":
                    lines.append(f"## Task\n{value}\n")
                elif key == "input":
                    lines.append(f"## Input Data\n```json\n{json.dumps(value, indent=2)}\n```\n")
                elif key == "constraints":
                    lines.append("## Constraints\n")
                    if isinstance(value, list):
                        for constraint in value:
                            lines.append(f"- {constraint}\n")
                    else:
                        lines.append(f"{value}\n")
                elif key == "notes":
                    lines.append(f"## Notes\n{value}\n")
                else:
                    lines.append(f"## {key.capitalize()}\n{str(value)}\n")

            context_path.write_text("".join(lines), encoding='utf-8')
            return True
        except Exception as e:
            print(f"Error writing context for {tentacle_name}: {e}")
            return False

    def read_todo(self, tentacle_name: str) -> List[Dict[str, Any]]:
        """
        Read todo.md from tentacle and parse todo items.

        Format:
        - [ ] Incomplete item
        - [x] Completed item

        Returns:
            List of todo items with {text, done} structure
        """
        todo_path = self.tentacles_dir / tentacle_name / "todo.md"

        if not todo_path.exists():
            return []

        todos = []
        for line in todo_path.read_text().split('\n'):
            if line.strip().startswith('- ['):
                done = 'x' in line[4]
                text = line.split('] ', 1)[1] if '] ' in line else ""
                if text:
                    todos.append({"text": text, "done": done})

        return todos

    def update_todo(self, tentacle_name: str, item_index: int, done: bool) -> bool:
        """
        Mark a todo item as done or incomplete.

        Args:
            tentacle_name: Tentacle identifier
            item_index: Index of todo item to update
            done: True to mark done, False to mark incomplete

        Returns:
            True if successful
        """
        todo_path = self.tentacles_dir / tentacle_name / "todo.md"

        if not todo_path.exists():
            return False

        try:
            lines = todo_path.read_text().split('\n')
            todo_items = []

            # Extract only todo items
            for line in lines:
                if line.strip().startswith('- ['):
                    todo_items.append(line)

            if item_index >= len(todo_items):
                return False

            # Update the checkbox
            old_item = todo_items[item_index]
            checkbox_status = 'x' if done else ' '
            new_item = old_item.replace(f"- [ ", f"- [{checkbox_status} ", 1).replace(f"- [x ", f"- [{checkbox_status} ", 1)

            # Replace in full content
            content = todo_path.read_text()
            content = content.replace(old_item, new_item)
            todo_path.write_text(content)

            return True
        except Exception as e:
            print(f"Error updating todo {item_index} for {tentacle_name}: {e}")
            return False

    def append_transcript(self, tentacle_name: str, message: str) -> bool:
        """
        Append message to agent transcript log.

        Args:
            tentacle_name: Tentacle identifier
            message: Message to append

        Returns:
            True if successful
        """
        log_path = self.tentacles_dir / tentacle_name / "transcript.log"

        try:
            timestamp = datetime.now().isoformat()
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(f"[{timestamp}] {message}\n")
            return True
        except Exception as e:
            print(f"Error writing transcript for {tentacle_name}: {e}")
            return False

    def spawn_agent(self, tentacle_name: str, command: str = "claude code",
                    workspace_mode: str = "shared", initial_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Spawn Claude Code agent in OctoAgent terminal.

        Calls OctoAgent API POST /api/terminals to create a new PTY session.

        Args:
            tentacle_name: Tentacle identifier (becomes terminal name)
            command: Ignored — OctoAgent manages the CLI; kept for API compat
            workspace_mode: "shared" (same worktree) or "worktree" (isolated branch)
            initial_prompt: Optional initial prompt to send to the agent

        Returns:
            Dictionary with spawn result metadata
        """
        try:
            # Register tentacle directory (context + todos)
            tentacle_dir = self.tentacles_dir / tentacle_name
            if not tentacle_dir.exists():
                self.register_agent(tentacle_name, "spawned_agent", f"Agent {tentacle_name}")

            # Read context to use as initial prompt if not provided
            if initial_prompt is None:
                context_path = tentacle_dir / "CONTEXT.md"
                if context_path.exists():
                    initial_prompt = context_path.read_text()

            # POST /api/terminals — actual OctoAgent API
            payload: Dict[str, Any] = {
                "name": tentacle_name,
                "workspaceMode": workspace_mode,
                "agentProvider": "claude-code",
                "nameOrigin": "user",
            }
            if initial_prompt:
                payload["initialPrompt"] = initial_prompt

            response = requests.post(
                f"{self.api_url}/api/terminals",
                json=payload,
                timeout=5
            )

            if response.status_code in (200, 201):
                data = response.json()
                self.append_transcript(tentacle_name, f"Agent spawned: terminalId={data.get('terminalId')}")
                return {"success": True, "data": data, "terminal_id": data.get("terminalId")}
            else:
                self.append_transcript(tentacle_name, f"Failed to spawn agent: {response.text}")
                return {"success": False, "error": response.text}
        except requests.exceptions.ConnectionError:
            self.append_transcript(tentacle_name, "OctoAgent API unavailable - spawn logged locally")
            return {"success": False, "error": "OctoAgent API not running on port 8787"}
        except Exception as e:
            self.append_transcript(tentacle_name, f"Error spawning agent: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_tentacle_status(self, tentacle_name: str) -> Dict[str, Any]:
        """
        Get current status of a tentacle.

        Merges OctoAgent live snapshot (lifecycleState, terminalId) with
        local context (CONTEXT.md, todo.md, transcript.log).

        Returns:
            Dict with name, terminal_id, lifecycle_state, context, todos, transcript
        """
        # Try to get live status from OctoAgent API
        live_status: Dict[str, Any] = {}
        try:
            snapshots = self.list_terminal_snapshots()
            for snap in snapshots:
                if snap.get("tentacleName") == tentacle_name or snap.get("label") == tentacle_name:
                    live_status = {
                        "terminal_id": snap.get("terminalId"),
                        "lifecycle_state": snap.get("lifecycleState", "unknown"),
                        "workspace_mode": snap.get("workspaceMode", "shared"),
                        "created_at": snap.get("createdAt"),
                        "state": snap.get("state", "unknown"),
                    }
                    break
        except Exception:
            pass

        # Merge with local file state
        tentacle_dir = self.tentacles_dir / tentacle_name
        context_path = tentacle_dir / "CONTEXT.md"
        log_path = tentacle_dir / "transcript.log"

        return {
            "name": tentacle_name,
            "directory": str(tentacle_dir) if tentacle_dir.exists() else None,
            **live_status,
            "context": context_path.read_text() if context_path.exists() else "",
            "todos": self.read_todo(tentacle_name),
            "transcript": log_path.read_text() if log_path.exists() else "",
        }

    def list_tentacles(self) -> List[str]:
        """
        List all active tentacles.

        Queries OctoAgent /api/terminal-snapshots first (live data).
        Falls back to local .octogent/tentacles/ directory scan.
        """
        try:
            response = requests.get(f"{self.api_url}/api/terminal-snapshots", timeout=3)
            if response.status_code == 200:
                snapshots = response.json()
                return [s.get("tentacleName") or s.get("label") or s.get("terminalId")
                        for s in snapshots if isinstance(s, dict)]
        except Exception:
            pass  # Fall back to directory scan

        if not self.tentacles_dir.exists():
            return []
        return [d.name for d in self.tentacles_dir.iterdir() if d.is_dir()]

    def list_terminal_snapshots(self) -> List[Dict[str, Any]]:
        """
        Get full terminal snapshot data from OctoAgent API.

        Returns:
            List of terminal snapshot dicts with terminalId, tentacleName,
            lifecycleState, workspaceMode, createdAt, etc.
        """
        try:
            response = requests.get(f"{self.api_url}/api/terminal-snapshots", timeout=3)
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
        return []


# Existing agent mappings (for Phase 2 integration)
AGENT_REGISTRY = {
    "inbox": {
        "type": "inbox_distiller",
        "description": "Route inbox items to vault folders with priority scoring"
    },
    "sap": {
        "type": "sap_crawler",
        "description": "Crawl SAP documentation and extract fit/gap analysis"
    },
    "synthesis": {
        "type": "weekly_synthesis",
        "description": "Generate weekly summaries from vault graph patterns"
    },
    "llm_kpi": {
        "type": "llm_kpi_scorer",
        "description": "Score LLM performance across providers with KPI reporting"
    },
    "o2c": {
        "type": "o2c_orchestrator",
        "description": "Orchestrate Order-to-Cash process (orders → GL → AR)"
    }
}


def init_agents(octogent_api_url: str = "http://localhost:8787") -> OctoGentBridge:
    """Initialize all standard agents as tentacles."""
    bridge = OctoGentBridge(octogent_api_url)

    for agent_name, config in AGENT_REGISTRY.items():
        bridge.register_agent(
            agent_name=agent_name,
            agent_type=config["type"],
            description=config["description"]
        )

    return bridge
