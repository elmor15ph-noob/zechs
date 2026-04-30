"""
Dyce Brain — TMNT Team CLI
Corporate VM interface. No UI. No Discord. Just the terminal.

Personas:
  !leo       → Leonardo  — PM / Team Lead
  !donny     → Donatello — Dev / Architecture
  !raph      → Raphael   — QA / Risk
  !micky     → Michelangelo — Creative / Synthesizer
  (no prefix) → Leo (default lead)

Usage:
  python dyce_cli.py
  python dyce_cli.py --url http://localhost:8000
  python dyce_cli.py --one-shot "!donny how should I structure this API?"

Env vars:
  DUO_API_URL   — default: http://localhost:8000
  DYCE_USER     — your name (shown in logs), default: dyce
"""

import argparse
import os
import sys
import textwrap
from typing import Optional

try:
    import requests
except ImportError:
    print("Missing dependency: pip install requests")
    sys.exit(1)

# ─── Config ──────────────────────────────────────────────────────────────────

DUO_API_URL: str = os.environ.get("DUO_API_URL", "http://localhost:8000").rstrip("/")
DISPATCH_ENDPOINT: str = f"{DUO_API_URL}/openclaw/dispatch"
DYCE_USER: str = os.environ.get("DYCE_USER", "dyce")

PERSONA_PREFIXES: dict[str, str] = {
    "!leo":   "leo",
    "!donny": "donny",
    "!raph":  "raph",
    "!micky": "micky",
}

# TMNT colour codes (ANSI) — works in most corporate terminals
COLORS = {
    "leo":   "\033[34m",   # blue  — Leonardo
    "donny": "\033[35m",   # purple — Donatello
    "raph":  "\033[31m",   # red   — Raphael
    "micky": "\033[33m",   # orange — Michelangelo
    "reset": "\033[0m",
    "dim":   "\033[2m",
    "bold":  "\033[1m",
}

PERSONA_LABELS = {
    "leo":   "Leonardo  [PM]",
    "donny": "Donatello [DEV]",
    "raph":  "Raphael   [QA]",
    "micky": "Micky     [CREATIVE]",
}

BANNER = """\
╔══════════════════════════════════════════════════╗
║         DYCE BRAIN  ·  TMNT TEAM  CLI            ║
║  !leo  !donny  !raph  !micky  ·  /help  /quit    ║
╚══════════════════════════════════════════════════╝
"""

HELP_TEXT = """\
Commands:
  !leo    <message>   — Leonardo  (PM / planning / coordination)
  !donny  <message>   — Donatello (dev / architecture / code)
  !raph   <message>   — Raphael   (QA / risk / hard truths)
  !micky  <message>   — Michelangelo (creative / docs / comms)
  <message>           — Leo answers (default)

  /team               — show team roster
  /health             — check DUO backend status
  /help               — this message
  /quit               — exit

Tip: prefix with !leo etc. to route directly to a specialist.
"""

# ─── Helpers ──────────────────────────────────────────────────────────────────

def parse_persona(text: str) -> tuple[str, str]:
    lower = text.lower()
    for prefix, persona in PERSONA_PREFIXES.items():
        if lower.startswith(prefix):
            return persona, text[len(prefix):].strip()
    return "leo", text.strip()


def colorize(persona: str, text: str) -> str:
    color = COLORS.get(persona, "")
    reset = COLORS["reset"]
    return f"{color}{text}{reset}"


def wrap_response(text: str, width: int = 80) -> str:
    lines = []
    for paragraph in text.split("\n"):
        if paragraph.strip() == "":
            lines.append("")
        elif paragraph.startswith(("  ", "\t", "```", "- ", "* ", "#")):
            lines.append(paragraph)  # preserve code blocks / bullets / headings
        else:
            lines.extend(textwrap.wrap(paragraph, width=width) or [""])
    return "\n".join(lines)


def dispatch(message: str, persona: str) -> dict:
    payload = {
        "channel": "cli",
        "persona": persona,
        "message": message,
        "user": DYCE_USER,
        "metadata": {"brain": "dyce", "team": "tmnt"},
    }
    resp = requests.post(DISPATCH_ENDPOINT, json=payload, timeout=90)
    resp.raise_for_status()
    return resp.json()


def show_team() -> None:
    try:
        resp = requests.get(f"{DUO_API_URL}/agents/list", timeout=5)
        data = resp.json() if resp.ok else {}
        agents = data.get("agents", [])
        tmnt = [a for a in agents if a.get("brain") == "dyce" or a.get("name") in PERSONA_PREFIXES.values()]
    except Exception:
        tmnt = []

    print(f"\n{COLORS['bold']}DYCE TEAM — TMNT{COLORS['reset']}")
    roster = [
        ("leo",   "Leonardo",     "PM / Team Lead",          "Strategy, coordination, blockers"),
        ("donny", "Donatello",    "Dev / Architecture",      "Implementation, design, code review"),
        ("raph",  "Raphael",      "QA / Risk",               "Testing, edge cases, hard truths"),
        ("micky", "Michelangelo", "Creative / Synthesizer",  "Docs, comms, UX, morale"),
    ]
    for key, name, role, domain in roster:
        print(f"  {colorize(key, f'!{key:<7}')}  {name:<14}  {COLORS['dim']}{role:<25}  {domain}{COLORS['reset']}")
    print()


def check_health() -> None:
    try:
        resp = requests.get(f"{DUO_API_URL}/health", timeout=5)
        if resp.ok:
            data = resp.json()
            print(f"  ✅  DUO backend  {COLORS['dim']}{DUO_API_URL}{COLORS['reset']}  —  {data.get('status', 'ok')}")
        else:
            print(f"  ⚠️   DUO backend returned HTTP {resp.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"  ❌  DUO backend unreachable at {DUO_API_URL}")
        print(f"      Start it: cd BrainApp/backend && python main.py")
    print()


# ─── One-shot mode ────────────────────────────────────────────────────────────

def one_shot(message: str) -> int:
    persona, clean = parse_persona(message)
    try:
        data = dispatch(clean, persona)
        response = data.get("response", "(no response)")
        print(wrap_response(response))
        cost = float(data.get("cost_usd", 0))
        if cost > 0:
            print(f"\n{COLORS['dim']}${cost:.4f}{COLORS['reset']}")
        return 0
    except requests.exceptions.ConnectionError:
        print(f"ERROR: DUO backend unreachable at {DUO_API_URL}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1


# ─── Interactive REPL ─────────────────────────────────────────────────────────

def repl() -> None:
    print(BANNER)
    check_health()

    while True:
        try:
            raw = input(f"{COLORS['dim']}dyce>{COLORS['reset']} ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nCowabunga. 🐢")
            break

        if not raw:
            continue

        # Built-in commands
        if raw.lower() in ("/quit", "/exit", "/q"):
            print("Cowabunga. 🐢")
            break
        if raw.lower() in ("/help", "/?"):
            print(HELP_TEXT)
            continue
        if raw.lower() == "/team":
            show_team()
            continue
        if raw.lower() == "/health":
            check_health()
            continue

        persona, message = parse_persona(raw)

        if not message:
            print(f"  {COLORS['dim']}(empty message — type something after the prefix){COLORS['reset']}\n")
            continue

        label = PERSONA_LABELS.get(persona, persona)
        print(f"\n{colorize(persona, f'▸ {label}')}\n")

        try:
            data = dispatch(message, persona)
            response = data.get("response", "(no response)")
            returned_persona = data.get("persona", persona)
            cost_usd = float(data.get("cost_usd", 0))

            print(wrap_response(response))

            footer_parts = []
            if returned_persona != persona:
                footer_parts.append(f"routed → {returned_persona}")
            if cost_usd > 0:
                footer_parts.append(f"${cost_usd:.4f}")
            if footer_parts:
                print(f"\n{COLORS['dim']}[{' · '.join(footer_parts)}]{COLORS['reset']}")
            print()

        except requests.exceptions.ConnectionError:
            print(f"  ❌  DUO backend unreachable at {DUO_API_URL}\n")
        except requests.exceptions.Timeout:
            print("  ⏱  Request timed out — the model is thinking. Try again.\n")
        except requests.exceptions.HTTPError as e:
            print(f"  ⚠️  Backend error {e.response.status_code}: {e.response.text[:200]}\n")
        except Exception as e:
            print(f"  ⚠️  Unexpected error: {e}\n")


# ─── Entry point ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Dyce Brain CLI — TMNT team interface",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""
        Examples:
          python dyce_cli.py
          python dyce_cli.py --one-shot "!donny design a caching layer for the vault"
          python dyce_cli.py --url http://192.168.1.50:8000
        """),
    )
    parser.add_argument("--url", default=None, help="DUO backend URL (overrides DUO_API_URL env)")
    parser.add_argument("--one-shot", "-s", metavar="MESSAGE", help="Single query, print response, exit")
    args = parser.parse_args()

    global DUO_API_URL, DISPATCH_ENDPOINT
    if args.url:
        DUO_API_URL = args.url.rstrip("/")
        DISPATCH_ENDPOINT = f"{DUO_API_URL}/openclaw/dispatch"

    if args.one_shot:
        sys.exit(one_shot(args.one_shot))
    else:
        repl()


if __name__ == "__main__":
    main()
