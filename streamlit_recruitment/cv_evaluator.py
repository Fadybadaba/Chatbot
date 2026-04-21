"""CV extraction and strict candidate evaluation for Streamlit recruitment app."""
from __future__ import annotations

import io
import re
from dataclasses import dataclass
from typing import Literal

JobTitle = Literal[
    "Senior Full-Stack Developer",
    "Talent Acquisition Lead (HR)",
    "Senior Financial Analyst",
]


@dataclass
class EvaluationResult:
    approved: bool
    years_detected: float | None
    mandatory_failures: list[str]
    bonus_points: int
    bonus_hits: list[str]


def extract_text_from_pdf_bytes(data: bytes) -> str:
    """Extract text with pdfplumber first; fallback to PyPDF2 if needed."""
    try:
        import pdfplumber

        pages: list[str] = []
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
        if pages:
            return "\n".join(pages)
    except Exception:
        pass

    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(io.BytesIO(data))
        parts: list[str] = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
        return "\n".join(parts) if parts else ""
    except Exception:
        return ""


def _normalize(text: str) -> str:
    return text.lower()


def extract_years_of_experience(text: str) -> float | None:
    """
    Regex-based detection of years (case-insensitive), e.g.:
    "6 years experience", "8+ years", "exp: 5 years", "3 yrs exp"
    """
    normalized = text.lower()
    found: list[float] = []

    for m in re.finditer(
        r"(\d{1,2})\s*\+?\s*(?:years?|yrs?)(?:\s+experience|\s+exp)?",
        normalized,
        re.IGNORECASE,
    ):
        found.append(float(m.group(1)))

    for m in re.finditer(
        r"(?:experience|exp\.?)\s*[:\-]?\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)",
        normalized,
        re.IGNORECASE,
    ):
        found.append(float(m.group(1)))

    return max(found) if found else None


def evaluate_candidate(extracted_text: str, job_title: JobTitle) -> EvaluationResult:
    """Return approved/rejected based only on mandatory conditions."""
    text = _normalize(extracted_text)
    years = extract_years_of_experience(extracted_text)

    mandatory_failures: list[str] = []
    bonus_hits: list[str] = []
    bonus_points = 0

    if job_title == "Senior Full-Stack Developer":
        if years is None:
            mandatory_failures.append('Missing experience: not detected (need "X years" with X >= 5).')
        elif years < 5:
            mandatory_failures.append(f"Experience too low: detected ~{years:g} years (need >= 5).")
        if "python" not in text:
            mandatory_failures.append('Missing mandatory keyword: "Python".')
        if "react" not in text:
            mandatory_failures.append('Missing mandatory keyword: "React".')

        if "aws" in text:
            bonus_points += 10
            bonus_hits.append("AWS (+10)")
        if "docker" in text:
            bonus_points += 10
            bonus_hits.append("Docker (+10)")

    elif job_title == "Talent Acquisition Lead (HR)":
        if years is None:
            mandatory_failures.append('Missing experience: not detected (need "X years" with X >= 4).')
        elif years < 4:
            mandatory_failures.append(f"Experience too low: detected ~{years:g} years (need >= 4).")

        has_shrm = bool(re.search(r"\bshrm\b", text))
        has_phri = bool(re.search(r"\bphri\b", text))
        if not (has_shrm or has_phri):
            mandatory_failures.append('Missing mandatory credential: "SHRM" or "PHRi".')

        if "payroll" in text:
            bonus_points += 10
            bonus_hits.append("Payroll (+10)")

    elif job_title == "Senior Financial Analyst":
        if years is None:
            mandatory_failures.append('Missing experience: not detected (need "X years" with X >= 8).')
        elif years < 8:
            mandatory_failures.append(f"Experience too low: detected ~{years:g} years (need >= 8).")

        has_cma = bool(re.search(r"\bcma\b", text))
        has_cfa = bool(re.search(r"\bcfa\b", text))
        if not (has_cma or has_cfa):
            mandatory_failures.append('Missing mandatory credential: "CMA" or "CFA".')

        if "oracle" in text or "sap" in text:
            bonus_points += 15
            bonus_hits.append("Oracle or SAP (+15)")

    return EvaluationResult(
        approved=len(mandatory_failures) == 0,
        years_detected=years,
        mandatory_failures=mandatory_failures,
        bonus_points=bonus_points,
        bonus_hits=bonus_hits,
    )
