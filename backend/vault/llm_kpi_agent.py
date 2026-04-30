"""LLM KPI Observability Agent — Automated rating and scoring of LLM performance."""

import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Any, Optional
import statistics

logger = logging.getLogger(__name__)


class LLMKPIScorer:
    """Scores LLM performance by reading decision logs and generating KPI metrics."""

    def __init__(self, vault_path: Path):
        self.vault_path = Path(vault_path)
        self.log_dir = self.vault_path / ".lancedb"
        self.synthesis_dir = self.vault_path / "02-Areas" / "Synthesis"
        self.synthesis_dir.mkdir(parents=True, exist_ok=True)

    def score(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        models: Optional[List[str]] = None,
        alert_thresholds: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """
        Score LLM performance over a date range.

        Args:
            start_date: ISO format date (default: 7 days ago)
            end_date: ISO format date (default: today)
            models: List of models to score (default: all found in logs)
            alert_thresholds: Quality/cost/latency limits for alerts

        Returns:
            Dict with scorecard, alerts, KPIs, and ratings
        """
        # Set defaults
        if end_date is None:
            end_date = datetime.now().date().isoformat()
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=7)).date().isoformat()

        if alert_thresholds is None:
            alert_thresholds = {
                "quality_min": 0.70,
                "cost_daily_max": 2.50,
                "latency_p95_max": 3000,
            }

        logger.info(f"[LLMKPIScorer] Scoring from {start_date} to {end_date}")

        # 1. Read decision logs
        logs = self._read_decision_logs(start_date, end_date)
        logger.info(f"[LLMKPIScorer] Read {len(logs)} decision log entries")

        if not logs:
            logger.warning("[LLMKPIScorer] No decision logs found for period")
            return {"error": "No decision logs found", "period": f"{start_date} to {end_date}"}

        # 2. Group by model
        grouped = self._group_by_model(logs)
        if models:
            grouped = {m: grouped.get(m, []) for m in models if m in grouped or models}

        logger.info(f"[LLMKPIScorer] Found {len(grouped)} models: {list(grouped.keys())}")

        # 3. Calculate KPIs for each model
        kpis = {}
        for model, calls in grouped.items():
            if calls:
                kpis[model] = self._calculate_kpis(model, calls, start_date, end_date)

        # 4. Generate ratings
        ratings = {model: self._rate_model(kpi) for model, kpi in kpis.items()}

        # 5. Generate markdown scorecard
        scorecard_md = self._generate_markdown(kpis, ratings, start_date, end_date)

        # 6. Write scorecard to vault
        scorecard_file = self._write_scorecard_note(scorecard_md, start_date)
        logger.info(f"[LLMKPIScorer] Scorecard written to {scorecard_file}")

        # 7. Check alerts
        alerts = self._check_alerts(kpis, alert_thresholds)

        return {
            "period": f"{start_date} to {end_date}",
            "generated_at": datetime.now().isoformat(),
            "scorecard_file": str(scorecard_file.relative_to(self.vault_path)),
            "summary": self._generate_summary(kpis, ratings),
            "models": kpis,
            "ratings": ratings,
            "alerts": alerts,
            "forecast": self._forecast_costs(kpis, start_date, end_date),
        }

    def _read_decision_logs(self, start_date: str, end_date: str) -> List[Dict]:
        """Read all decision log files within date range."""
        logs = []
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()

        # Find all decision log files (e.g., sap-simulator-decisions.jsonl)
        log_files = list(self.log_dir.glob("*-decisions.jsonl"))
        logger.info(f"[LLMKPIScorer] Found {len(log_files)} log files")

        for log_file in log_files:
            try:
                with open(log_file) as f:
                    for line in f:
                        if not line.strip():
                            continue
                        try:
                            entry = json.loads(line)
                            ts = datetime.fromisoformat(entry["timestamp"]).date()
                            if start <= ts <= end:
                                logs.append(entry)
                        except json.JSONDecodeError:
                            logger.warning(f"Skipping malformed JSON in {log_file}: {line[:100]}")
            except Exception as e:
                logger.error(f"Error reading {log_file}: {e}")

        return logs

    def _group_by_model(self, logs: List[Dict]) -> Dict[str, List[Dict]]:
        """Group logs by LLM model."""
        grouped = defaultdict(list)
        for log in logs:
            model = log.get("llm_provider", "unknown")
            grouped[model].append(log)
        return dict(grouped)

    def _calculate_kpis(
        self, model: str, calls: List[Dict], start_date: str, end_date: str
    ) -> Dict[str, Any]:
        """Calculate KPIs for a single model."""
        start = datetime.fromisoformat(start_date).date()
        end = datetime.fromisoformat(end_date).date()
        num_days = (end - start).days + 1

        # Extract metrics
        costs = [call.get("cost_usd", 0) for call in calls]
        latencies = [call.get("latency_seconds", 0) * 1000 for call in calls]  # Convert to ms
        feedbacks = [call.get("quality_feedback", "neutral") for call in calls]
        fallback_used = [call.get("fallback_used", False) for call in calls]

        # Count feedback
        good_count = sum(1 for f in feedbacks if f == "good")
        bad_count = sum(1 for f in feedbacks if f == "bad")
        neutral_count = sum(1 for f in feedbacks if f == "neutral")

        # Calculate percentiles
        def percentile(data, p):
            if not data:
                return 0
            return statistics.quantiles(data, n=100)[p - 1] if len(data) > 1 else data[0]

        total_cost = sum(costs)
        daily_cost = total_cost / num_days if num_days > 0 else 0
        monthly_projection = daily_cost * 30

        quality_rate = good_count / len(feedbacks) if feedbacks else 0
        cost_per_quality = total_cost / good_count if good_count > 0 else 0
        error_rate = sum(1 for f in fallback_used if f) / len(fallback_used) if fallback_used else 0

        kpi = {
            "model": model,
            "daily_cost": round(daily_cost, 4),
            "weekly_cost": round(daily_cost * 7, 4),
            "monthly_projection": round(monthly_projection, 2),
            "latency_p50": round(percentile(latencies, 50), 0) if latencies else 0,
            "latency_p95": round(percentile(latencies, 95), 0) if latencies else 0,
            "latency_p99": round(percentile(latencies, 99), 0) if latencies else 0,
            "quality_acceptance_rate": round(quality_rate, 3),
            "calls_total": len(calls),
            "calls_good": good_count,
            "calls_bad": bad_count,
            "calls_neutral": neutral_count,
            "cost_per_quality": round(cost_per_quality, 4),
            "error_rate": round(error_rate, 3),
            "total_cost": round(total_cost, 4),
        }

        return kpi

    def _rate_model(self, kpi: Dict[str, Any]) -> float:
        """
        Rate a model 0-10 based on cost, quality, and latency.

        Scoring:
        - Start at 7.0 (baseline)
        - Quality >80%: +1.5 (cap 10)
        - Quality <60%: -2.0
        - Cost >$2.50/day: -1.0
        - Latency p95 >3000ms: -0.5
        """
        score = 7.0

        quality = kpi["quality_acceptance_rate"]
        if quality > 0.80:
            score += 1.5
        elif quality < 0.60:
            score -= 2.0
        elif quality < 0.70:
            score -= 0.5

        cost = kpi["daily_cost"]
        if cost > 2.50:
            score -= 1.0
        elif cost > 1.50:
            score -= 0.3

        latency = kpi["latency_p95"]
        if latency > 3000:
            score -= 0.5
        elif latency > 2000:
            score -= 0.2

        return round(max(0, min(10, score)), 1)

    def _check_alerts(self, kpis: Dict[str, Dict], thresholds: Dict) -> List[Dict]:
        """Check if KPIs violate alert thresholds."""
        alerts = []

        for model, kpi in kpis.items():
            # Quality alert
            if kpi["quality_acceptance_rate"] < thresholds.get("quality_min", 0.70):
                alerts.append(
                    {
                        "severity": "warning",
                        "model": model,
                        "metric": "quality",
                        "value": round(kpi["quality_acceptance_rate"], 3),
                        "threshold": thresholds.get("quality_min", 0.70),
                        "message": f"{model} acceptance rate {round(kpi['quality_acceptance_rate']*100, 1)}% below target {thresholds.get('quality_min', 0.70)*100}%. Consider fine-tuning or routing.",
                    }
                )

            # Cost alert
            if kpi["daily_cost"] > thresholds.get("cost_daily_max", 2.50):
                alerts.append(
                    {
                        "severity": "warning",
                        "model": model,
                        "metric": "cost",
                        "value": round(kpi["daily_cost"], 2),
                        "threshold": thresholds.get("cost_daily_max", 2.50),
                        "message": f"{model} daily cost ${round(kpi['daily_cost'], 2)} exceeds budget ${thresholds.get('cost_daily_max', 2.50)}.",
                    }
                )

            # Latency alert
            if kpi["latency_p95"] > thresholds.get("latency_p95_max", 3000):
                alerts.append(
                    {
                        "severity": "info",
                        "model": model,
                        "metric": "latency",
                        "value": round(kpi["latency_p95"], 0),
                        "threshold": thresholds.get("latency_p95_max", 3000),
                        "message": f"{model} p95 latency {round(kpi['latency_p95'], 0)}ms above target {thresholds.get('latency_p95_max', 3000)}ms.",
                    }
                )

        return alerts

    def _forecast_costs(self, kpis: Dict[str, Dict], start_date: str, end_date: str) -> Dict:
        """Forecast costs and runway to next tier."""
        total_monthly = sum(kpi["monthly_projection"] for kpi in kpis.values())
        tier_cap = 100.0  # Phase 5 cap

        runway_days = (tier_cap - total_monthly) / (total_monthly / 30) if total_monthly > 0 else 999
        runway_weeks = runway_days / 7

        return {
            "total_monthly_projection": round(total_monthly, 2),
            "tier_cap": tier_cap,
            "runway_to_escalation_weeks": round(max(0, runway_weeks), 1),
            "recommendation": (
                f"Stay current path. Escalate at week {int(12 - runway_weeks)} if usage stays same."
                if runway_weeks > 2
                else "Cost approaching tier cap. Plan optimization."
            ),
        }

    def _generate_summary(self, kpis: Dict[str, Dict], ratings: Dict[str, float]) -> Dict:
        """Generate summary statistics."""
        if not kpis:
            return {}

        return {
            "best_value": max((m for m in kpis if m), key=lambda m: ratings.get(m, 0), default=None),
            "fastest": min((m for m in kpis if m), key=lambda m: kpis[m].get("latency_p50", 999), default=None),
            "cheapest": min((m for m in kpis if m), key=lambda m: kpis[m].get("daily_cost", 999), default=None),
            "highest_quality": max(
                (m for m in kpis if m),
                key=lambda m: kpis[m].get("quality_acceptance_rate", 0),
                default=None,
            ),
        }

    def _generate_markdown(
        self, kpis: Dict[str, Dict], ratings: Dict[str, float], start_date: str, end_date: str
    ) -> str:
        """Generate markdown scorecard."""
        md = f"""# LLM KPI Scorecard — {start_date} to {end_date}

**Generated:** {datetime.now().isoformat()}

## Summary

| Model | Daily Cost | Latency (p50) | Quality | Rating | Verdict |
|-------|-----------|---------------|---------|--------|---------|
"""

        for model in sorted(kpis.keys()):
            kpi = kpis[model]
            rating = ratings.get(model, 0)
            quality_pct = round(kpi["quality_acceptance_rate"] * 100, 1)
            latency = round(kpi["latency_p50"], 0)
            cost = round(kpi["daily_cost"], 2)

            # Determine verdict
            if rating > 8:
                verdict = "✅ Excellent"
            elif rating > 7:
                verdict = "🟢 Good"
            elif rating > 6:
                verdict = "🟡 Acceptable"
            else:
                verdict = "🔴 Poor"

            md += f"| **{model}** | ${cost} | {latency}ms | {quality_pct}% | {rating}/10 | {verdict} |\n"

        md += "\n## Detailed Metrics\n"

        for model in sorted(kpis.keys()):
            kpi = kpis[model]
            rating = ratings.get(model, 0)

            md += f"\n### {model.upper()}\n"
            md += f"- **Rating:** {rating}/10\n"
            md += f"- **Daily Cost:** ${kpi['daily_cost']}\n"
            md += f"- **Weekly Cost:** ${kpi['weekly_cost']}\n"
            md += f"- **Monthly Projection:** ${kpi['monthly_projection']}\n"
            md += f"- **Latency (p50/p95/p99):** {round(kpi['latency_p50'], 0)}ms / {round(kpi['latency_p95'], 0)}ms / {round(kpi['latency_p99'], 0)}ms\n"
            md += f"- **Quality Acceptance:** {round(kpi['quality_acceptance_rate']*100, 1)}% ({kpi['calls_good']}/{kpi['calls_total']} good)\n"
            md += f"- **Cost per Good Call:** ${kpi['cost_per_quality']}\n"
            md += f"- **Error Rate:** {round(kpi['error_rate']*100, 1)}%\n"
            md += f"- **Total Calls:** {kpi['calls_total']}\n"

        md += "\n## Alerts\n\n"
        md += "None yet. Thresholds: Quality >70%, Cost <$2.50/day, Latency p95 <3000ms.\n"

        md += "\n## Recommendation\n\n"
        md += "Monitor quality metrics. Continue Phase 5 data collection through week 4.\n"

        return md

    def _write_scorecard_note(self, content: str, start_date: str) -> Path:
        """Write scorecard markdown to vault."""
        # Generate filename: LLM-KPI-Scorecard-YYYY-WXX.md
        date_obj = datetime.fromisoformat(start_date)
        week_num = date_obj.isocalendar()[1]
        year = date_obj.year
        filename = f"LLM-KPI-Scorecard-{year}-W{week_num:02d}.md"

        scorecard_path = self.synthesis_dir / filename

        try:
            with open(scorecard_path, "w") as f:
                f.write(content)
            logger.info(f"[LLMKPIScorer] Scorecard written to {scorecard_path}")
            return scorecard_path
        except Exception as e:
            logger.error(f"Failed to write scorecard: {e}")
            raise
