"""
Data export router — export weather records to JSON, CSV, XML, PDF, Markdown.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.weather import WeatherRecord
from app.schemas.weather import WeatherRecordWithLocation
from app.services.export import export_json, export_csv, export_xml, export_pdf, export_markdown

router = APIRouter(prefix="/export", tags=["export"])

FORMATS = {"json", "csv", "xml", "pdf", "markdown"}


@router.get("/records")
def export_records(
    format: str = Query("json", description="json | csv | xml | pdf | markdown"),
    record_ids: Optional[str] = Query(None, description="Comma-separated record IDs, or omit for all"),
    db: Session = Depends(get_db),
):
    """Export weather records in the requested format."""
    fmt = format.lower()
    if fmt not in FORMATS:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{format}'. Choose from: {', '.join(FORMATS)}")

    query = db.query(WeatherRecord)
    if record_ids:
        try:
            ids = [int(i.strip()) for i in record_ids.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="record_ids must be comma-separated integers")
        query = query.filter(WeatherRecord.id.in_(ids))

    records = query.order_by(WeatherRecord.created_at.desc()).all()

    # Serialize to list of dicts using Pydantic
    data = [WeatherRecordWithLocation.model_validate(r).model_dump(mode="json") for r in records]

    if fmt == "json":
        content = export_json(data)
        media_type = "application/json"
        filename = "weather_records.json"
    elif fmt == "csv":
        content = export_csv(data)
        media_type = "text/csv"
        filename = "weather_records.csv"
    elif fmt == "xml":
        content = export_xml(data)
        media_type = "application/xml"
        filename = "weather_records.xml"
    elif fmt == "pdf":
        try:
            content = export_pdf(data)
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=str(e))
        media_type = "application/pdf"
        filename = "weather_records.pdf"
    else:  # markdown
        content = export_markdown(data)
        media_type = "text/markdown"
        filename = "weather_records.md"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
