"""Persona Engine - Load and manage Duo brain personas (Zero, Heavyarms, Sandrock, Altron)."""

import json
from pathlib import Path
from typing import Optional, List, Dict, Tuple
from datetime import datetime


class PersonaEngine:
    """Load and manage specialized personas from vault/agents/ directory."""

    def __init__(self, vault_path: Path):
        """Initialize persona engine with vault path."""
        self.vault_path = Path(vault_path)
        # Personas are in vault/agents/ subdirectory
        self.agents_dir = self.vault_path / "vault" / "agents"
        # Fallback to agents/ if vault/ doesn't exist (for other setups)
        if not self.agents_dir.exists():
            self.agents_dir = self.vault_path / "agents"
        self._personas_cache = {}
        self._conversations = {}  # Track conversation history per persona

    def list_personas(self) -> List[str]:
        """List all available personas."""
        if not self.agents_dir.exists():
            return []

        personas = []
        for file in self.agents_dir.glob("*.md"):
            if file.name not in ["README.md"]:
                personas.append(file.stem)

        return sorted(personas)

    def get_persona(self, name: str) -> Optional[Dict]:
        """Load persona prompt and metadata from vault."""
        # Check cache first
        if name in self._personas_cache:
            return self._personas_cache[name]

        persona_file = self.agents_dir / f"{name}.md"
        if not persona_file.exists():
            return None

        try:
            content = persona_file.read_text(encoding="utf-8")

            # Parse frontmatter if present
            frontmatter = {}
            body = content

            if content.startswith("---"):
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    body = parts[2].strip()
                    # Simple YAML parser for frontmatter
                    for line in parts[1].split("\n"):
                        if ":" in line:
                            key, val = line.split(":", 1)
                            frontmatter[key.strip()] = val.strip()

            # Extract persona details from markdown
            persona_data = {
                "name": name,
                "file": str(persona_file),
                "system_prompt": body,  # Full markdown is the system prompt
                "archetype": self._extract_field(body, "Archetype"),
                "domain": self._extract_field(body, "Domain"),
                "expertise": self._extract_field(body, "Expertise"),
                "created_at": datetime.now().isoformat(),
            }

            # Cache it
            self._personas_cache[name] = persona_data

            return persona_data

        except Exception as e:
            print(f"[PersonaEngine] Failed to load {name}: {e}")
            return None

    def _extract_field(self, markdown: str, field_name: str) -> str:
        """Extract a field from markdown header (e.g., "Archetype: ...")."""
        for line in markdown.split("\n"):
            if field_name in line and ":" in line:
                value = line.split(":", 1)[1].strip()
                # Remove markdown formatting
                return value.replace("**", "").replace("*", "")
        return ""

    def get_persona_info(self, name: str) -> Optional[Dict]:
        """Get persona info (without system prompt for display)."""
        persona = self.get_persona(name)
        if not persona:
            return None

        return {
            "name": persona["name"],
            "archetype": persona["archetype"],
            "domain": persona["domain"],
            "expertise": persona["expertise"],
            "file": persona["file"],
        }

    def chat(self, persona_name: str, user_message: str, context: Optional[List[Dict]] = None) -> Tuple[str, Dict]:
        """
        Simulate chat with a persona.

        Args:
            persona_name: Name of persona (zero, heavyarms, sandrock, altron)
            user_message: User's message
            context: Optional conversation history for context-aware responses

        Returns:
            Tuple of (response_text, metadata)
        """
        persona = self.get_persona(persona_name)
        if not persona:
            raise ValueError(f"Persona '{persona_name}' not found")

        # Initialize conversation history for this persona if not exists
        if persona_name not in self._conversations:
            self._conversations[persona_name] = []

        # Add user message to history
        self._conversations[persona_name].append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat(),
        })

        # Prepare metadata
        metadata = {
            "persona": persona_name,
            "archetype": persona["archetype"],
            "timestamp": datetime.now().isoformat(),
            "conversation_length": len(self._conversations[persona_name]),
            "tokens_estimated": self._estimate_tokens(user_message),
        }

        return persona, metadata

    def _estimate_tokens(self, text: str) -> int:
        """Rough token estimation (4 chars ~= 1 token)."""
        return max(1, len(text) // 4)

    def get_conversation_history(self, persona_name: str) -> List[Dict]:
        """Get conversation history for a persona."""
        return self._conversations.get(persona_name, [])

    def clear_conversation(self, persona_name: str):
        """Clear conversation history for a persona."""
        if persona_name in self._conversations:
            del self._conversations[persona_name]

    def clear_all_conversations(self):
        """Clear all conversation histories."""
        self._conversations.clear()

    def build_system_message(self, persona_name: str) -> str:
        """Get the full system prompt for a persona."""
        persona = self.get_persona(persona_name)
        if not persona:
            raise ValueError(f"Persona '{persona_name}' not found")

        return persona["system_prompt"]


class PersonaTeam:
    """Manage all four personas as a coordinated team."""

    TEAM = {
        "zero": "Strategic Conductor",
        "heavyarms": "Data Analyst",
        "sandrock": "Executor",
        "altron": "Communicator",
    }

    def __init__(self, vault_path: Path):
        """Initialize persona team."""
        self.vault_path = Path(vault_path)
        self.engine = PersonaEngine(vault_path)
        self._team_state = {}

    def get_team(self) -> Dict[str, Dict]:
        """Get all team members with roles and status."""
        team = {}
        for persona_name, role in self.TEAM.items():
            info = self.engine.get_persona_info(persona_name)
            if info:
                team[persona_name] = {
                    **info,
                    "role": role,
                    "status": "ready",
                }
        return team

    def coordinate(self, task: str, personas: Optional[List[str]] = None) -> Dict:
        """
        Coordinate a task across team members.

        Args:
            task: Task description
            personas: Which personas to involve (default: all)

        Returns:
            Coordination plan with assigned personas
        """
        if personas is None:
            personas = list(self.TEAM.keys())

        return {
            "task": task,
            "assigned_personas": personas,
            "coordination_type": self._determine_coordination_type(task, personas),
            "suggested_order": self._suggest_execution_order(personas),
            "timestamp": datetime.now().isoformat(),
        }

    def _determine_coordination_type(self, task: str, personas: List[str]) -> str:
        """Determine coordination pattern based on task and personas."""
        keywords = task.lower()

        # Pattern matching for common coordination types
        if "strategy" in keywords or "plan" in keywords:
            return "zero_leads" if "zero" in personas else "hierarchical"
        elif "data" in keywords or "analyze" in keywords:
            return "heavyarms_leads" if "heavyarms" in personas else "analytical"
        elif "build" in keywords or "execute" in keywords:
            return "sandrock_leads" if "sandrock" in personas else "delivery"
        elif "communicate" in keywords or "explain" in keywords:
            return "altron_leads" if "altron" in personas else "narrative"
        else:
            return "parallel" if len(personas) > 1 else "solo"

    def _suggest_execution_order(self, personas: List[str]) -> List[str]:
        """Suggest execution order based on persona dependencies."""
        # Typical workflow: Zero → Heavyarms → Sandrock → Altron
        order = []
        priority = ["zero", "heavyarms", "sandrock", "altron"]

        for p in priority:
            if p in personas:
                order.append(p)

        return order


# Singleton instance
_persona_engine_instance = None

def get_persona_engine(vault_path: Path) -> PersonaEngine:
    """Get or create persona engine singleton."""
    global _persona_engine_instance
    if _persona_engine_instance is None:
        _persona_engine_instance = PersonaEngine(vault_path)
    return _persona_engine_instance


_persona_team_instance = None

def get_persona_team(vault_path: Path) -> PersonaTeam:
    """Get or create persona team singleton."""
    global _persona_team_instance
    if _persona_team_instance is None:
        _persona_team_instance = PersonaTeam(vault_path)
    return _persona_team_instance
