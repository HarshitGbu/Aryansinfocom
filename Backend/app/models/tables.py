from __future__ import annotations

import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Service(Base):
    __tablename__ = "services"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    full_content: Mapped[str] = mapped_column(Text, nullable=False)
    technologies_used: Mapped[list] = mapped_column(JSONB, default=list)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class CaseStudy(Base):
    __tablename__ = "case_studies"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    client_industry: Mapped[str] = mapped_column(String(100), nullable=False)
    service_category: Mapped[str] = mapped_column(String(50), nullable=False)
    domains: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    is_placeholder: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    problem_statement: Mapped[str] = mapped_column(Text, nullable=False)
    solution_architecture: Mapped[str] = mapped_column(Text, nullable=False)
    metrics: Mapped[dict] = mapped_column(JSONB, nullable=False)
    hardware_specs: Mapped[dict] = mapped_column(JSONB, default=dict)
    software_stack: Mapped[list] = mapped_column(JSONB, default=list)
    cover_image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LeadEstimate(Base):
    __tablename__ = "lead_estimates"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_email: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255))
    phone_number: Mapped[str | None] = mapped_column(String(50))
    selected_services: Mapped[list] = mapped_column(JSONB, nullable=False)
    office_size_sqft: Mapped[int] = mapped_column(Integer, default=0)
    workstation_count: Mapped[int] = mapped_column(Integer, default=0)
    ai_deployment_type: Mapped[str | None] = mapped_column(String(50))
    estimated_budget_min: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_budget_max: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_timeline_weeks: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_timeline_weeks_min: Mapped[int | None] = mapped_column(Integer)
    estimate_input: Mapped[dict | None] = mapped_column(JSONB)
    estimate_result: Mapped[dict | None] = mapped_column(JSONB)
    pricing_version: Mapped[str | None] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text)
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ip_hash: Mapped[str | None] = mapped_column(String(64))
    lead_score: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), default="new")
    booked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class HardwareBlueprint(Base):
    __tablename__ = "hardware_blueprints"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    blueprint_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    tier_name: Mapped[str] = mapped_column(String(100), nullable=False)
    network_architecture: Mapped[dict] = mapped_column(JSONB, nullable=False)
    hardware_bom: Mapped[list] = mapped_column(JSONB, nullable=False)
    recommended_software_integrations: Mapped[list] = mapped_column(JSONB, nullable=False)
    base_estimated_cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)


class KnowledgeChunk(Base):
    __tablename__ = "ai_lab_knowledge_base"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_chunk: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list | None] = mapped_column(Vector(1536))
    chunk_metadata: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)


class ContactSubmission(Base):
    __tablename__ = "contact_submissions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str | None] = mapped_column(String(255))
    topic: Mapped[str | None] = mapped_column(String(50))
    message: Mapped[str] = mapped_column(Text, nullable=False)
    consent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    ip_hash: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(50), default="new", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
