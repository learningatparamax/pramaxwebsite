from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import text
from app.database import Base, SessionLocal, engine
from app.models import CaseStudy, IndustrySolution, Lead, Service
from sqlalchemy.orm import Session
from app.database import Base, SessionLocal, engine
from app.schemas import CaseStudyCreate, ChatRequest, IndustrySolutionCreate, LeadCreate, ServiceCreate
from app.grok_service import ask_grok
from app.security import require_admin

app = FastAPI(
    title="Pramax Backend API",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

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

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


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
