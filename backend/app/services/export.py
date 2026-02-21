"""
Data export service: JSON, CSV, XML, PDF, Markdown.
"""
import csv
import io
import json
from typing import List, Dict, Any
from datetime import datetime


# ---------------------------------------------------------------------------
# JSON
# ---------------------------------------------------------------------------

def export_json(records: List[Dict[str, Any]]) -> bytes:
    return json.dumps(records, indent=2, default=str).encode("utf-8")


# ---------------------------------------------------------------------------
# CSV
# ---------------------------------------------------------------------------

def export_csv(records: List[Dict[str, Any]]) -> bytes:
    if not records:
        return b""
    output = io.StringIO()
    # Flatten nested location dict
    flat_records = [_flatten(r) for r in records]
    writer = csv.DictWriter(output, fieldnames=flat_records[0].keys(), extrasaction="ignore")
    writer.writeheader()
    writer.writerows(flat_records)
    return output.getvalue().encode("utf-8")


# ---------------------------------------------------------------------------
# XML
# ---------------------------------------------------------------------------

def export_xml(records: List[Dict[str, Any]]) -> bytes:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', "<weather_records>"]
    for rec in records:
        lines.append("  <record>")
        for k, v in _flatten(rec).items():
            tag = k.replace(" ", "_")
            lines.append(f"    <{tag}>{_escape_xml(str(v) if v is not None else '')}</{tag}>")
        lines.append("  </record>")
    lines.append("</weather_records>")
    return "\n".join(lines).encode("utf-8")


# ---------------------------------------------------------------------------
# Markdown
# ---------------------------------------------------------------------------

def export_markdown(records: List[Dict[str, Any]]) -> bytes:
    lines = ["# Weather Records Export", f"_Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}_", ""]
    for rec in records:
        flat = _flatten(rec)
        loc = rec.get("location", {})
        lines.append(f"## Record #{rec.get('id', '?')} — {loc.get('display_name', 'Unknown Location')}")
        lines.append("")
        lines.append(f"| Field | Value |")
        lines.append(f"|-------|-------|")
        for k, v in flat.items():
            lines.append(f"| {k} | {v if v is not None else '-'} |")
        lines.append("")
    return "\n".join(lines).encode("utf-8")


# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------

def export_pdf(records: List[Dict[str, Any]]) -> bytes:
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("Weather Records Export", styles["Title"]))
        elements.append(Paragraph(
            f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
            styles["Normal"]
        ))
        elements.append(Spacer(1, 12))

        for rec in records:
            loc = rec.get("location", {})
            elements.append(Paragraph(
                f"Record #{rec.get('id', '?')} — {loc.get('display_name', 'Unknown')}",
                styles["Heading2"]
            ))
            flat = _flatten(rec)
            table_data = [["Field", "Value"]] + [[k, str(v) if v is not None else "-"] for k, v in flat.items()]
            t = Table(table_data, colWidths=[200, 300])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a73e8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 16))

        doc.build(elements)
        return buffer.getvalue()
    except ImportError:
        raise RuntimeError("reportlab is required for PDF export. Install it: pip install reportlab")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _flatten(rec: Dict[str, Any], prefix: str = "") -> Dict[str, Any]:
    """Flatten nested dicts (e.g., location sub-object) into top-level keys."""
    flat: Dict[str, Any] = {}
    for k, v in rec.items():
        if k in ("raw_data", "forecast_data"):
            continue  # skip large blobs in export
        full_key = f"{prefix}{k}" if not prefix else f"{prefix}.{k}"
        if isinstance(v, dict):
            flat.update(_flatten(v, prefix=k))
        else:
            flat[k if not prefix else full_key] = v
    return flat


def _escape_xml(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )
