from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import admin, blueprints, case_studies, estimate, health, playground, search, webhooks
from app.api.v1 import services as services_mod

router = APIRouter()
router.include_router(health.router)
router.include_router(services_mod.router, prefix="/api/v1")
router.include_router(case_studies.router, prefix="/api/v1")
router.include_router(blueprints.router, prefix="/api/v1")
router.include_router(estimate.router, prefix="/api/v1")
router.include_router(search.router, prefix="/api/v1")
router.include_router(playground.router, prefix="/api/v1")
router.include_router(webhooks.router, prefix="/api/v1")
router.include_router(admin.router, prefix="/api/v1")
