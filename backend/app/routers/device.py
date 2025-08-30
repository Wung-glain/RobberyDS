from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.device import DeviceCreate, Device
from app.models.device import Device as DeviceModel
from app.database import get_db

router = APIRouter(prefix="/devices", tags=["devices"])

@router.post("/", response_model=Device)
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    db_device = DeviceModel(**device.dict())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@router.get("/", response_model=list[Device])
def list_devices(db: Session = Depends(get_db)):
    return db.query(DeviceModel).all()

@router.get("/{device_id}", response_model=Device)
def get_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(DeviceModel).filter(DeviceModel.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device
