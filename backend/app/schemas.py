from pydantic import BaseModel, EmailStr, Field


class LeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    company: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    message: str | None = Field(default=None, max_length=5000)


class ServiceCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    category: str | None = Field(default=None, max_length=100)
    description: str = Field(min_length=10, max_length=5000)


class IndustrySolutionCreate(BaseModel):
    industry: str = Field(min_length=2, max_length=150)
    title: str = Field(min_length=2, max_length=150)
    description: str = Field(min_length=10, max_length=5000)


class CaseStudyCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    industry: str = Field(min_length=2, max_length=150)
    challenge: str = Field(min_length=10, max_length=5000)
    solution: str = Field(min_length=10, max_length=5000)
    outcome: str | None = Field(default=None, max_length=5000)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

class KnowledgeEntryCreate(BaseModel):
    trigger: str = Field(min_length=2, max_length=150)
    response: str = Field(min_length=10, max_length=5000)
