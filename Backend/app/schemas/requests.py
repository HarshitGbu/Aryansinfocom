from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.common import EstimateRequest


class LeadSubmitRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    client_name: str = Field(min_length=2, max_length=120)
    client_email: EmailStr
    company_name: str | None = Field(default=None, max_length=255)
    phone_number: str | None = Field(default=None, max_length=50)
    notes: str | None = Field(default=None, max_length=2000)
    estimate_input: EstimateRequest
    consent: bool
    website: str | None = None


class ContactRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    company: str | None = Field(default=None, max_length=255)
    topic: str | None = Field(default=None)
    message: str = Field(min_length=10, max_length=2000)
    consent: bool
    website: str | None = None


class RagRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    query: str = Field(min_length=1, max_length=300)
    top_k: int = Field(default=2, ge=1, le=5)


class PromptParseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    prompt: str = Field(min_length=3, max_length=500)


LeadStatus = Literal["new", "contacted", "discovery_booked", "closed"]


class AdminPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: LeadStatus
