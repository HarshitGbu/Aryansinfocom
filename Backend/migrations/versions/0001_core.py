"""initial core tables"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_core"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')
    op.create_table(
        "services",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("short_description", sa.Text, nullable=False),
        sa.Column("full_content", sa.Text, nullable=False),
        sa.Column("technologies_used", postgresql.JSONB, server_default=sa.text("'[]'::jsonb")),
        sa.Column("is_featured", sa.Boolean, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        "case_studies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("client_industry", sa.String(100), nullable=False),
        sa.Column("service_category", sa.String(50), nullable=False),
        sa.Column("problem_statement", sa.Text, nullable=False),
        sa.Column("solution_architecture", sa.Text, nullable=False),
        sa.Column("metrics", postgresql.JSONB, nullable=False),
        sa.Column("hardware_specs", postgresql.JSONB, server_default=sa.text("'{}'::jsonb")),
        sa.Column("software_stack", postgresql.JSONB, server_default=sa.text("'[]'::jsonb")),
        sa.Column("cover_image_url", sa.String(512)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        "lead_estimates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("client_name", sa.String(255), nullable=False),
        sa.Column("client_email", sa.String(255), nullable=False),
        sa.Column("company_name", sa.String(255)),
        sa.Column("phone_number", sa.String(50)),
        sa.Column("selected_services", postgresql.JSONB, nullable=False),
        sa.Column("office_size_sqft", sa.Integer, server_default=sa.text("0")),
        sa.Column("workstation_count", sa.Integer, server_default=sa.text("0")),
        sa.Column("ai_deployment_type", sa.String(50)),
        sa.Column("estimated_budget_min", sa.Integer, nullable=False),
        sa.Column("estimated_budget_max", sa.Integer, nullable=False),
        sa.Column("estimated_timeline_weeks", sa.Integer, nullable=False),
        sa.Column("lead_score", sa.Integer, server_default=sa.text("0")),
        sa.Column("status", sa.String(50), server_default=sa.text("'new'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_table(
        "hardware_blueprints",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("blueprint_code", sa.String(50), unique=True, nullable=False),
        sa.Column("tier_name", sa.String(100), nullable=False),
        sa.Column("network_architecture", postgresql.JSONB, nullable=False),
        sa.Column("hardware_bom", postgresql.JSONB, nullable=False),
        sa.Column("recommended_software_integrations", postgresql.JSONB, nullable=False),
        sa.Column("base_estimated_cost", sa.Numeric(12, 2), nullable=False),
    )
    op.create_table(
        "ai_lab_knowledge_base",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("document_title", sa.String(255), nullable=False),
        sa.Column("content_chunk", sa.Text, nullable=False),
        sa.Column("embedding", sa.String, nullable=True),
        sa.Column("metadata", postgresql.JSONB, server_default=sa.text("'{}'::jsonb")),
    )


def downgrade() -> None:
    op.drop_table("ai_lab_knowledge_base")
    op.drop_table("hardware_blueprints")
    op.drop_table("lead_estimates")
    op.drop_table("case_studies")
    op.drop_table("services")
