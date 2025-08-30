from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.alert import AlertCreate, Alert
from app.models.alert import Alert as AlertModel
from app.database import get_db

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.post("/", response_model=Alert)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    db_alert = AlertModel(**alert.dict())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.get("/", response_model=list[Alert])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(AlertModel).all()

@router.put("/{alert_id}/resolve", response_model=Alert)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_resolved = True
    db.commit()
    db.refresh(alert)
    return alert
