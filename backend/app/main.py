import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.grok_service import ask_grok
from app.models import CaseStudy, IndustrySolution, KnowledgeEntry, Lead, Service
from app.schemas import (
    CaseStudyCreate,
    ChatRequest,
    IndustrySolutionCreate,
    KnowledgeEntryCreate,
    LeadCreate,
    ServiceCreate,
)
from app.security import require_admin


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Create any missing tables on startup (works for SQLite and PostgreSQL).
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Pramax Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# Comma-separated list of origins allowed to call the API from a browser,
# e.g. "https://www.pramax.com,https://pramax.com". Defaults to local dev.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)

@app.get("/")
def home():
    return {"message": "Pramax backend is running"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/database-health")
def database_health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"database": "connected"}


@app.post("/api/leads", status_code=201)
def create_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**lead_data.model_dump())

    db.add(lead)
    db.commit()
    db.refresh(lead)

    return {
        "message": "Lead created successfully",
        "lead_id": lead.id
    }

@app.get("/api/leads", dependencies=[Depends(require_admin)])
def get_all_leads(db: Session = Depends(get_db)):
    leads = db.query(Lead).order_by(Lead.created_at.desc()).all()

    return [
        {
            "id": lead.id,
            "name": lead.name,
            "email": lead.email,
            "company": lead.company,
            "phone": lead.phone,
            "message": lead.message,
            "status": lead.status,
            "created_at": lead.created_at
        }
        for lead in leads
    ]
@app.post("/api/services", status_code=201, dependencies=[Depends(require_admin)])
def create_service(
    service_data: ServiceCreate,
    db: Session = Depends(get_db)
):
    service = Service(**service_data.model_dump())

    db.add(service)
    db.commit()
    db.refresh(service)

    return {
        "message": "Service created successfully",
        "service_id": service.id
    }
@app.get("/api/services")
def get_all_services(db: Session = Depends(get_db)):
    services = db.query(Service).order_by(Service.created_at.desc()).all()

    return [
        {
            "id": service.id,
            "title": service.title,
            "category": service.category,
            "description": service.description,
            "created_at": service.created_at
        }
        for service in services
    ]

@app.post("/api/industry-solutions", status_code=201, dependencies=[Depends(require_admin)])
def create_industry_solution(
    solution_data: IndustrySolutionCreate,
    db: Session = Depends(get_db)
):
    solution = IndustrySolution(**solution_data.model_dump())

    db.add(solution)
    db.commit()
    db.refresh(solution)

    return {
        "message": "Industry solution created successfully",
        "industry_solution_id": solution.id
    }


@app.get("/api/industry-solutions")
def get_all_industry_solutions(db: Session = Depends(get_db)):
    solutions = (
        db.query(IndustrySolution)
        .order_by(IndustrySolution.created_at.desc())
        .all()
    )

    return [
        {
            "id": solution.id,
            "industry": solution.industry,
            "title": solution.title,
            "description": solution.description,
            "created_at": solution.created_at
        }
        for solution in solutions
    ]

@app.post("/api/case-studies", status_code=201, dependencies=[Depends(require_admin)])
def create_case_study(
    case_study_data: CaseStudyCreate,
    db: Session = Depends(get_db)
):
    case_study = CaseStudy(**case_study_data.model_dump())

    db.add(case_study)
    db.commit()
    db.refresh(case_study)

    return {
        "message": "Case study created successfully",
        "case_study_id": case_study.id
    }


@app.get("/api/case-studies")
def get_all_case_studies(db: Session = Depends(get_db)):
    case_studies = (
        db.query(CaseStudy)
        .order_by(CaseStudy.created_at.desc())
        .all()
    )

    return [
        {
            "id": case_study.id,
            "title": case_study.title,
            "industry": case_study.industry,
            "challenge": case_study.challenge,
            "solution": case_study.solution,
            "outcome": case_study.outcome,
            "created_at": case_study.created_at
        }
        for case_study in case_studies
    ]
@app.post("/api/chat")
def chat_with_pramax(
    chat_request: ChatRequest,
    db: Session = Depends(get_db)
):
    try:
        response = ask_grok(chat_request.message, db)

        return {
            "response": response
        }
    except Exception as error:
        print(f"Grok request error: {type(error).__name__}: {error}")

        raise HTTPException(
    status_code=502,
    detail=f"Grok error: {type(error).__name__}: {error}"
)

@app.put("/api/services/{service_id}", dependencies=[Depends(require_admin)])
def update_service(
    service_id: int,
    service_data: ServiceCreate,
    db: Session = Depends(get_db)
):
    service = db.get(Service, service_id)

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    service.title = service_data.title
    service.category = service_data.category
    service.description = service_data.description

    db.commit()
    db.refresh(service)

    return {
        "message": "Service updated successfully",
        "service_id": service.id
    }


@app.delete("/api/services/{service_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    service = db.get(Service, service_id)

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    db.delete(service)
    db.commit()

@app.put("/api/industry-solutions/{solution_id}", dependencies=[Depends(require_admin)])
def update_industry_solution(
    solution_id: int,
    solution_data: IndustrySolutionCreate,
    db: Session = Depends(get_db)
):
    solution = db.get(IndustrySolution, solution_id)

    if not solution:
        raise HTTPException(
            status_code=404,
            detail="Industry solution not found"
        )

    solution.industry = solution_data.industry
    solution.title = solution_data.title
    solution.description = solution_data.description

    db.commit()
    db.refresh(solution)

    return {
        "message": "Industry solution updated successfully",
        "industry_solution_id": solution.id
    }


@app.delete("/api/industry-solutions/{solution_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_industry_solution(
    solution_id: int,
    db: Session = Depends(get_db)
):
    solution = db.get(IndustrySolution, solution_id)

    if not solution:
        raise HTTPException(
            status_code=404,
            detail="Industry solution not found"
        )

    db.delete(solution)
    db.commit()

@app.put("/api/case-studies/{case_study_id}", dependencies=[Depends(require_admin)])
def update_case_study(
    case_study_id: int,
    case_study_data: CaseStudyCreate,
    db: Session = Depends(get_db)
):
    case_study = db.get(CaseStudy, case_study_id)

    if not case_study:
        raise HTTPException(
            status_code=404,
            detail="Case study not found"
        )

    case_study.title = case_study_data.title
    case_study.industry = case_study_data.industry
    case_study.challenge = case_study_data.challenge
    case_study.solution = case_study_data.solution
    case_study.outcome = case_study_data.outcome

    db.commit()
    db.refresh(case_study)

    return {
        "message": "Case study updated successfully",
        "case_study_id": case_study.id
    }


@app.delete("/api/case-studies/{case_study_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_case_study(
    case_study_id: int,
    db: Session = Depends(get_db)
):
    case_study = db.get(CaseStudy, case_study_id)

    if not case_study:
        raise HTTPException(
            status_code=404,
            detail="Case study not found"
        )

    db.delete(case_study)
    db.commit()


@app.get("/api/knowledge", dependencies=[Depends(require_admin)])
def get_all_knowledge_entries(db: Session = Depends(get_db)):
    entries = (
        db.query(KnowledgeEntry)
        .order_by(KnowledgeEntry.created_at.desc())
        .all()
    )

    return [
        {
            "id": entry.id,
            "trigger": entry.trigger,
            "response": entry.response,
            "created_at": entry.created_at
        }
        for entry in entries
    ]


@app.post("/api/knowledge", status_code=201, dependencies=[Depends(require_admin)])
def create_knowledge_entry(
    entry_data: KnowledgeEntryCreate,
    db: Session = Depends(get_db)
):
    entry = KnowledgeEntry(**entry_data.model_dump())

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {
        "message": "Knowledge entry created successfully",
        "knowledge_entry_id": entry.id
    }


@app.delete("/api/knowledge/{entry_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_knowledge_entry(
    entry_id: int,
    db: Session = Depends(get_db)
):
    entry = db.get(KnowledgeEntry, entry_id)

    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Knowledge entry not found"
        )

    db.delete(entry)
    db.commit()
