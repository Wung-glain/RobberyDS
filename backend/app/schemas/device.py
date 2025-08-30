from pydantic import BaseModel

class DeviceBase(BaseModel):
    ip_address: str
    hostname: str | None = None
    mac_address: str | None = None
    status: str | None = "offline"

class DeviceCreate(DeviceBase):
    pass

class Device(DeviceBase):
    id: int
    last_seen: str

    class Config:
        orm_mode = True
