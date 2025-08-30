from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.intrusion import IntrusionCreate, Intrusion
from app.models.intrusion import Intrusion as IntrusionModel
from app.database import get_db

router = APIRouter(prefix="/intrusions", tags=["intrusions"])

@router.post("/detect", response_model=Intrusion)
def detect_intrusion(intrusion: IntrusionCreate, db: Session = Depends(get_db)):
    db_intrusion = IntrusionModel(**intrusion.dict())
    db.add(db_intrusion)
    db.commit()
    db.refresh(db_intrusion)
    return db_intrusion

@router.get("/", response_model=list[Intrusion])
def list_intrusions(db: Session = Depends(get_db)):
    return db.query(IntrusionModel).all()

@router.get("/{intrusion_id}", response_model=Intrusion)
def get_intrusion(intrusion_id: int, db: Session = Depends(get_db)):
    intrusion = db.query(IntrusionModel).filter(IntrusionModel.id == intrusion_id).first()
    if not intrusion:
        raise HTTPException(status_code=404, detail="Intrusion not found")
    return intrusion
