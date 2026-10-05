"""Load starter content into the database.

Usage (from the backend/ folder):
    python -m app.seed                  # uses seed_data.json
    python -m app.seed path/to/file.json

Works against whatever DATABASE_URL points to (local SQLite or hosted
PostgreSQL). Existing rows with the same title / trigger are skipped, so it
is safe to run more than once.
"""
import json
import sys
from pathlib import Path

from app.database import BACKEND_DIR, Base, SessionLocal, engine
from app.models import CaseStudy, IndustrySolution, KnowledgeEntry, Service
from app.schemas import (
    CaseStudyCreate,
    IndustrySolutionCreate,
    KnowledgeEntryCreate,
    ServiceCreate,
)

# section name -> (model, schema, unique field)
SECTIONS = {
    "services": (Service, ServiceCreate, "title"),
    "industry_solutions": (IndustrySolution, IndustrySolutionCreate, "title"),
    "case_studies": (CaseStudy, CaseStudyCreate, "title"),
    "knowledge_entries": (KnowledgeEntry, KnowledgeEntryCreate, "trigger"),
}


def seed(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        for section, (model, schema, key) in SECTIONS.items():
            added = skipped = 0
            for raw in data.get(section, []):
                item = schema(**raw).model_dump()
                exists = (
                    db.query(model)
                    .filter(getattr(model, key) == item[key])
                    .first()
                )
                if exists:
                    skipped += 1
                    continue
                db.add(model(**item))
                added += 1
            db.commit()
            print(f"{section}: {added} added, {skipped} skipped")


if __name__ == "__main__":
    file_arg = Path(sys.argv[1]) if len(sys.argv) > 1 else BACKEND_DIR / "seed_data.json"
    seed(file_arg)
