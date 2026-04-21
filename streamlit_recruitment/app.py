"""Streamlit Recruitment Chatbot (chat UI + step workflow)."""

from __future__ import annotations

import io
import re

import streamlit as st


st.set_page_config(page_title="AI Recruitment Portal", page_icon="briefcase", layout="centered")


JOBS_DATA = {
    "Senior Full-Stack Developer": {
        "Needs": "5+ years exp, Python, React, AWS.",
        "Mandatory": {"years_min": 5, "keywords_all": ["python", "react"]},
        "Bonus": ["aws", "docker"],
    },
    "Talent Acquisition Lead (HR)": {
        "Needs": "4+ years exp, SHRM or PHRi certificate.",
        "Mandatory": {"years_min": 4, "keywords_any": ["shrm", "phri"]},
        "Bonus": ["payroll", "linkedin recruiter"],
    },
    "Senior Financial Analyst": {
        "Needs": "8+ years exp, CMA or CFA certificate.",
        "Mandatory": {"years_min": 8, "keywords_any": ["cma", "cfa"]},
        "Bonus": ["oracle", "sap"],
    },
}

JOB_BUTTONS = [
    "Senior Full-Stack Developer",
    "Talent Acquisition Lead (HR)",
    "Senior Financial Analyst",
]

WELCOME = "Hi howa can i help you ?"


def _init_state() -> None:
    if "stage" not in st.session_state:
        st.session_state.stage = 0  # 0=chat, 1=job buttons, 2=requirements, 3=upload, 4=done
    if "selected_job" not in st.session_state:
        st.session_state.selected_job = None
    if "approved" not in st.session_state:
        st.session_state.approved = None
    if "chat_messages" not in st.session_state:
        st.session_state.chat_messages = [{"role": "assistant", "content": WELCOME}]
    else:
        # If the user already has a session open, ensure the first assistant message
        # matches the latest greeting text.
        if (
            isinstance(st.session_state.chat_messages, list)
            and st.session_state.chat_messages
            and st.session_state.chat_messages[0].get("role") == "assistant"
        ):
            st.session_state.chat_messages[0]["content"] = WELCOME


def _reset() -> None:
    st.session_state.stage = 0
    st.session_state.selected_job = None
    st.session_state.approved = None
    st.session_state.chat_messages = [{"role": "assistant", "content": WELCOME}]


def _extract_text_pdfplumber(file_bytes: bytes) -> str:
    import pdfplumber

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            parts: list[str] = []
            for page in pdf.pages:
                t = page.extract_text() or ""
                parts.append(t)
            return "\n".join(parts).strip()
    except Exception:
        return ""


def _largest_number(text: str) -> int:
    digits = re.findall(r"\d+", text or "")
    if not digits:
        return 0
    return int(max(digits, key=int))


def _keyword_match(text: str, *, keywords_all: list[str] | None, keywords_any: list[str] | None) -> bool:
    t = (text or "").lower()
    if keywords_all:
        return all(k.lower() in t for k in keywords_all)
    if keywords_any:
        return any(k.lower() in t for k in keywords_any)
    return False


def _evaluate_candidate(extracted_text: str, job_title: str) -> bool:
    job = JOBS_DATA[job_title]
    mandatory = job["Mandatory"]

    years = _largest_number(extracted_text)
    years_ok = years >= int(mandatory["years_min"])

    kw_all = mandatory.get("keywords_all")
    kw_any = mandatory.get("keywords_any")
    keywords_ok = _keyword_match(extracted_text, keywords_all=kw_all, keywords_any=kw_any)

    return years_ok and keywords_ok


def _append_message(role: str, content: str) -> None:
    st.session_state.chat_messages.append({"role": role, "content": content})


def main() -> None:
    _init_state()

    st.title("AI Recruitment Portal")

    # Render chat history
    for msg in st.session_state.chat_messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    stage_ui = st.empty()

    # Stage 1: show job buttons (after user says they need a job)
    if st.session_state.stage == 1:
        with stage_ui.container():
            with st.chat_message("assistant"):
                st.markdown("Here are the available jobs. Please select one:")

            c1, c2, c3 = st.columns(3)
            for col, job_title in zip([c1, c2, c3], JOB_BUTTONS, strict=True):
                with col:
                    if st.button(job_title, key=f"job_pick_{job_title}"):
                        st.session_state.selected_job = job_title
                        st.session_state.stage = 2
                        _append_message("assistant", f"Requirements for: {job_title}")
                        _append_message("assistant", JOBS_DATA[job_title]["Needs"])
                        st.rerun()

    # Stage 2: show requirements (and upload button)
    if st.session_state.stage == 2:
        selected = st.session_state.selected_job
        assert selected is not None
        with stage_ui.container():
            with st.chat_message("assistant"):
                st.markdown("Click the toolbar button below to upload your CV (PDF).")
            if st.button("Upload CV", key="upload_cv_btn", use_container_width=True):
                st.session_state.stage = 3
                st.rerun()

    # Stage 3: file uploader + screening
    if st.session_state.stage == 3:
        selected = st.session_state.selected_job
        assert selected is not None
        with stage_ui.container():
            uploaded = st.file_uploader("Upload your CV (PDF)", type=["pdf"], accept_multiple_files=False)
            if uploaded is not None:
                file_bytes = uploaded.getvalue()
                extracted = _extract_text_pdfplumber(file_bytes)

                if not extracted.strip():
                    _append_message("assistant", "❌ REJECTED. You do not meet the mandatory criteria (Check Experience/Certifications).")
                    if "Mandatory" in JOBS_DATA[selected]:
                        _append_message("assistant", "Reason: Could not extract readable text from the PDF.")
                    st.session_state.approved = False
                    st.session_state.stage = 4
                    st.rerun()

                approved = _evaluate_candidate(extracted, selected)
                st.session_state.approved = approved
                if approved:
                    _append_message("assistant", "✅ APPROVED! Your qualifications match our needs. [Button: Schedule Interview]")
                    st.session_state.stage = 4
                    st.rerun()
                else:
                    _append_message("assistant", "❌ REJECTED. You do not meet the mandatory criteria (Check Experience/Certifications).")
                    st.session_state.stage = 4
                    st.rerun()

    # Stage 4: result + Start Over
    if st.session_state.stage == 4:
        with stage_ui.container():
            approved = bool(st.session_state.approved)
            if approved:
                if st.button("Schedule Interview", type="primary", use_container_width=True):
                    st.markdown("[Schedule Interview](https://calendly.com/)")
                else:
                    st.link_button("Schedule Interview", "https://calendly.com/", use_container_width=True)
            else:
                st.caption("You can start over and upload another CV.")

            if st.button("Start Over", type="secondary", use_container_width=True):
                _reset()
                st.rerun()

    # Chat input always available at stage 0, and also when stage < 4.
    if st.session_state.stage in {0, 1}:
        user_text = st.chat_input("Message")
        if user_text:
            _append_message("user", user_text)
            lowered = user_text.strip().lower()
            if "need" in lowered and "job" in lowered or "find a job" in lowered or "find job" in lowered:
                st.session_state.stage = 1
                _append_message("assistant", "Okay. I will show you the 3 jobs you can apply for.")
                st.rerun()
            elif "job" in lowered or "position" in lowered or "role" in lowered:
                st.session_state.stage = 1
                _append_message("assistant", "Sure. Here are the jobs we have available right now.")
                st.rerun()
            else:
                _append_message("assistant", "Please type: 'i need to find a job'.")
                st.rerun()


if __name__ == "__main__":
    main()

