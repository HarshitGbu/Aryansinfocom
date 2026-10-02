"""additions indexes"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

revision = "0002_additions"
down_revision = "0001_core"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("case_studies", sa.Column("domains", postgresql.JSONB, nullable=False, server_default=sa.text("'[]'::jsonb")))
    op.add_column("case_studies", sa.Column("is_placeholder", sa.Boolean, nullable=False, server_default=sa.text("true")))
    op.add_column("case_studies", sa.Column("sort_order", sa.Integer, nullable=False, server_default=sa.text("0")))
    op.add_column("services", sa.Column("sort_order", sa.Integer, nullable=False, server_default=sa.text("0")))
    op.add_column("lead_estimates", sa.Column("estimated_timeline_weeks_min", sa.Integer))
    op.add_column("lead_estimates", sa.Column("estimate_input", postgresql.JSONB))
    op.add_column("lead_estimates", sa.Column("estimate_result", postgresql.JSONB))
    op.add_column("lead_estimates", sa.Column("pricing_version", sa.String(50)))
    op.add_column("lead_estimates", sa.Column("notes", sa.Text))
    op.add_column("lead_estimates", sa.Column("consent_at", sa.DateTime(timezone=True)))
    op.add_column("lead_estimates", sa.Column("ip_hash", sa.String(64)))
    op.add_column("lead_estimates", sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")))
    op.add_column("lead_estimates", sa.Column("booked_at", sa.DateTime(timezone=True)))
    op.create_table(
        "contact_submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("company", sa.String(255)),
        sa.Column("topic", sa.String(50)),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("consent_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("ip_hash", sa.String(64)),
        sa.Column("status", sa.String(50), nullable=False, server_default=sa.text("'new'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    # vector type change: recreate via raw sql
    op.execute("ALTER TABLE ai_lab_knowledge_base ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector")
    op.execute("ALTER TABLE ai_lab_knowledge_base ADD COLUMN IF NOT EXISTS tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', document_title || ' ' || content_chunk)) STORED")
    op.execute("CREATE INDEX IF NOT EXISTS ix_kb_tsv ON ai_lab_knowledge_base USING GIN (tsv)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_kb_embedding ON ai_lab_knowledge_base USING hnsw (embedding vector_cosine_ops)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_services_category ON services (category, sort_order)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_case_studies_category ON case_studies (service_category, sort_order)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_case_studies_domains ON case_studies USING GIN (domains)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_leads_status_created ON lead_estimates (status, created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_leads_email ON lead_estimates (lower(client_email))")
    op.execute("CREATE INDEX IF NOT EXISTS ix_services_title_trgm ON services USING GIN (title gin_trgm_ops)")
    # updated_at trigger
    op.execute(
        """
        CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
        BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql;
        DROP TRIGGER IF EXISTS trg_services_updated ON services;
        CREATE TRIGGER trg_services_updated BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        DROP TRIGGER IF EXISTS trg_leads_updated ON lead_estimates;
        CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON lead_estimates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_leads_updated ON lead_estimates")
    op.execute("DROP TRIGGER IF EXISTS trg_services_updated ON services")
    op.execute("DROP FUNCTION IF EXISTS set_updated_at()")
    op.execute("DROP INDEX IF EXISTS ix_services_title_trgm")
    op.execute("DROP INDEX IF EXISTS ix_leads_email")
    op.execute("DROP INDEX IF EXISTS ix_leads_status_created")
    op.execute("DROP INDEX IF EXISTS ix_case_studies_domains")
    op.execute("DROP INDEX IF EXISTS ix_case_studies_category")
    op.execute("DROP INDEX IF EXISTS ix_services_category")
    op.execute("DROP INDEX IF EXISTS ix_kb_embedding")
    op.execute("DROP INDEX IF EXISTS ix_kb_tsv")
    op.drop_table("contact_submissions")
    op.drop_column("lead_estimates", "booked_at")
    op.drop_column("lead_estimates", "updated_at")
    op.drop_column("lead_estimates", "ip_hash")
    op.drop_column("lead_estimates", "consent_at")
    op.drop_column("lead_estimates", "notes")
    op.drop_column("lead_estimates", "pricing_version")
    op.drop_column("lead_estimates", "estimate_result")
    op.drop_column("lead_estimates", "estimate_input")
    op.drop_column("lead_estimates", "estimated_timeline_weeks_min")
    op.drop_column("services", "sort_order")
    op.drop_column("case_studies", "sort_order")
    op.drop_column("case_studies", "is_placeholder")
    op.drop_column("case_studies", "domains")
