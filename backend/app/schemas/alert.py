from pydantic import BaseModel

class AlertBase(BaseModel):
    intrusion_id: int
    message: str
    is_resolved: bool | None = False

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: int
    timestamp: str

    class Config:
        orm_mode = True
