import os

from openai import OpenAI
from sqlalchemy.orm import Session

from app.models import CaseStudy, IndustrySolution, KnowledgeEntry, Service


def build_pramax_context(db: Session) -> str:
    services = db.query(Service).all()
    industry_solutions = db.query(IndustrySolution).all()
    case_studies = db.query(CaseStudy).all()
    knowledge_entries = db.query(KnowledgeEntry).all()

    service_text = "\n".join(
        f"- {service.title}: {service.description}"
        for service in services
    ) or "No approved services are available."

    industry_solution_text = "\n".join(
        f"- {item.industry} | {item.title}: {item.description}"
        for item in industry_solutions
    ) or "No approved industry solutions are available."

    case_study_text = "\n".join(
        f"- {item.title} ({item.industry}): "
        f"Challenge: {item.challenge} "
        f"Solution: {item.solution} "
        f"Outcome: {item.outcome or 'Not specified'}"
        for item in case_studies
    ) or "No approved case studies are available."

    knowledge_text = "\n".join(
        f"- {item.trigger}: {item.response}"
        for item in knowledge_entries
    ) or "No approved knowledge entries are available."

    return f"""
Approved Pramax services:
{service_text}

Approved Pramax industry solutions:
{industry_solution_text}

Approved Pramax case studies:
{case_study_text}

Approved Pramax knowledge base:
{knowledge_text}
"""


def ask_grok(message: str, db: Session) -> str:
    api_key = os.getenv("XAI_API_KEY")

    if not api_key:
        raise RuntimeError("XAI_API_KEY is missing from .env")

    model = os.getenv("GROK_MODEL", "grok-4.5")
    context = build_pramax_context(db)

    instructions = f"""
You are the Pramax website assistant.

Use only the approved Pramax context below for company-specific claims.
Never invent services, clients, prices, results, guarantees, or technical claims.
If the answer is not available in the context, say so clearly and offer to
connect the visitor with a Pramax consultant.

Keep answers helpful, professional, and concise.

{context}
"""

    client = OpenAI(
        api_key=api_key,
        base_url="https://api.x.ai/v1"
    )

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": message}
        ]
    )

    return response.choices[0].message.content