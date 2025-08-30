from pydantic import BaseModel

class IntrusionBase(BaseModel):
    device_id: int
    type: str
    severity: str
    details: str | None = None

class IntrusionCreate(IntrusionBase):
    pass

class Intrusion(IntrusionBase):
    id: int
    timestamp: str

    class Config:
        orm_mode = True
