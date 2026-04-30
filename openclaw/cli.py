#!/usr/bin/env python3
"""OpenClaw CLI adapter — headless mode for Dyce corporate VM.

Usage:
    python cli.py                          # interactive REPL, default persona (zero)
    python cli.py --persona altron         # talk to a specific persona
    python cli.py --once "question here"   # single query, print response, exit
    python cli.py --digest                 # trigger Altron weekly digest and exit
    python cli.py --status                 # print orchestration status and exit

Environment:
    DUO_BACKEND  — backend URL (default: http://localhost:8000)
"""

import argparse
import json
import sys
import os
import readline  # enables up-arrow history on Unix
from pathlib import Path
from typing import Optional

BACKEND = os.getenv("DUO_BACKEND", "http://localhost:8000")
DEFAULT_PERSONA = "zero"
HISTORY_FILE = Path.home() / ".openclaw_history"

try:
    import urllib.request
    import urllib.error
except ImportError:
    pass


def _post(path: str, payload: dict) -> dict:
    url = f"{BACKEND}{path}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        return {"error": f"HTTP {e.code}: {body[:300]}"}
    except Exception as e:
        return {"error": str(e)}


def _get(path: str) -> dict:
    url = f"{BACKEND}{path}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        return {"error": str(e)}


def _chat(persona: str, message: str, history: list) -> str:
    payload = {"message": message, "conversation_history": history}
    result = _post(f"/agents/{persona}/chat", payload)
    if "error" in result:
        return f"[error] {result['error']}"
    return result.get("response") or result.get("content") or str(result)


def _print_header(persona: str) -> None:
    personas = {
        "zero": "⚔️  Zero — Strategic Conductor",
        "heavyarms": "📊 Heavyarms — Data Analyst",
        "sandrock": "🔧 Sandrock — Executor",
        "altron": "📡 Altron — Communicator",
    }
    label = personas.get(persona, f"🤖 {persona.title()}")
    print(f"\n{'─' * 50}")
    print(f"  DUO CLI  │  {label}")
    print(f"  Backend  │  {BACKEND}")
    print(f"{'─' * 50}")
    print("  /exit  /digest  /health  /cost  /switch <persona>")
    print(f"{'─' * 50}\n")


def repl(persona: str) -> None:
    _print_header(persona)
    history: list = []

    if HISTORY_FILE.exists():
        try:
            readline.read_history_file(str(HISTORY_FILE))
        except Exception:
            pass

    current_persona = persona
    while True:
        try:
            user_input = input(f"[{current_persona}]> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n[exit]")
            break

        if not user_input:
            continue

        # Slash commands
        if user_input == "/exit" or user_input == "/quit":
            break
        elif user_input == "/digest":
            print("⏳ Generating Altron digest...")
            result = _post("/agents/altron/digest", {})
            if "error" in result:
                print(f"[error] {result['error']}")
            else:
                print(f"✅ Digest written → {result.get('file', '?')} ({result.get('words', 0)} words)")
            continue
        elif user_input == "/health":
            result = _get("/health")
            print(json.dumps(result, indent=2))
            continue
        elif user_input == "/cost":
            result = _get("/agents/cost-status")
            print(json.dumps(result, indent=2))
            continue
        elif user_input == "/status":
            result = _get("/orchestration/status")
            print(json.dumps(result, indent=2))
            continue
        elif user_input.startswith("/switch "):
            new_persona = user_input.split(" ", 1)[1].strip()
            current_persona = new_persona
            print(f"→ Switched to {current_persona}")
            continue
        elif user_input == "/clear":
            history = []
            print("→ Conversation cleared")
            continue

        # Chat
        response = _chat(current_persona, user_input, history)
        history.append({"role": "user", "content": user_input})
        history.append({"role": "assistant", "content": response})
        print(f"\n{response}\n")

    try:
        readline.write_history_file(str(HISTORY_FILE))
    except Exception:
        pass


def main() -> None:
    parser = argparse.ArgumentParser(description="DUO CLI — OpenClaw headless adapter for Dyce")
    parser.add_argument("--persona", "-p", default=DEFAULT_PERSONA, help="Persona to chat with (zero, heavyarms, sandrock, altron)")
    parser.add_argument("--once", "-q", metavar="MESSAGE", help="Send one message, print response, exit")
    parser.add_argument("--digest", action="store_true", help="Trigger Altron weekly digest and exit")
    parser.add_argument("--status", action="store_true", help="Print orchestration status and exit")
    parser.add_argument("--backend", default=None, help="Backend URL override (default: http://localhost:8000)")
    args = parser.parse_args()

    global BACKEND
    if args.backend:
        BACKEND = args.backend

    if args.digest:
        result = _post("/agents/altron/digest", {})
        if "error" in result:
            print(f"Error: {result['error']}", file=sys.stderr)
            sys.exit(1)
        print(f"Digest written → {result.get('file')} ({result.get('words')} words, {result.get('latency_s')}s)")
        sys.exit(0)

    if args.status:
        result = _get("/orchestration/status")
        print(json.dumps(result, indent=2))
        sys.exit(0)

    if args.once:
        response = _chat(args.persona, args.once, [])
        print(response)
        sys.exit(0)

    repl(args.persona)


if __name__ == "__main__":
    main()
