from fastapi import FastAPI
from app.routers import device, intrusion, alert, monitor
from app.database import engine, Base
from sqlalchemy import text
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware


# Create tables if not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IPS Backend")

app.include_router(device.router)
app.include_router(intrusion.router)
app.include_router(alert.router)
app.include_router(monitor.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connected successfully!")
    except Exception as e:
        print("❌ Database connection failed:", e)
        raise e  # stop app if DB connection fails

    yield  # Application runs here

    # Shutdown
    engine.dispose()
    print("🛑 Database connection closed.")


