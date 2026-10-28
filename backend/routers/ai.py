from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from backend.database import get_db
from backend.services import gemini_service, openai_service
from backend.routers.stats import get_kpis
from backend.auth.dependencies import get_current_active_user
from backend.models.user import User

router = APIRouter(prefix="/api/ai", tags=["AI Insights"])


class QuestionRequest(BaseModel):
    question: str


@router.get("/insights")
async def get_ai_insights(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    kpis = await get_kpis(db=db, current_user=current_user)
    context = {
        "streets_covered": kpis.streets_covered_today,
        "streets_total": kpis.streets_total,
        "coverage_percent": kpis.coverage_percent,
        "active_vehicles": kpis.active_vehicles,
        "complaints_today": kpis.complaints_raised_today,
        "complaints_resolved": kpis.complaints_resolved,
        "cleanliness_score": kpis.cleanliness_score,
        "pending_areas": kpis.pending_areas,
    }
    insights = await gemini_service.generate_waste_insights(context)
    return {"insights": insights, "context": context}


@router.post("/ask")
async def ask_ai(
    request: QuestionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    kpis = await get_kpis(db=db, current_user=current_user)
    answer = await openai_service.answer_question(request.question, kpis.__dict__)
    return {"question": request.question, "answer": answer}


@router.get("/report")
async def get_cleanliness_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    kpis = await get_kpis(db=db, current_user=current_user)
    report = await openai_service.generate_cleanliness_report(kpis.__dict__)
    return {"report": report}
