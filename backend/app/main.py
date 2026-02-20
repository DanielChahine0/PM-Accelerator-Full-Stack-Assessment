from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import weather, integrations, export

app = FastAPI(
    title="Weather App API",
    description=(
        "Full-stack weather application built for the PM Accelerator AI Engineer Intern Assessment. "
        "Provides real-time weather, 5-day forecasts, CRUD persistence, and data export. "
        "Built by Daniel Chahine."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router)
app.include_router(integrations.router)
app.include_router(export.router)


@app.get("/", tags=["root"])
def root():
    return {
        "name": "Weather App API",
        "author": "Daniel Chahine",
        "organization": "PM Accelerator",
        "description": (
            "Product Manager Accelerator is a global community that helps aspiring "
            "and current product managers accelerate their careers through mentorship, "
            "resources, and real-world projects."
        ),
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["root"])
def health():
    return {"status": "ok"}
