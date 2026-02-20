"""
Weather router — CRUD for WeatherRecord + live weather endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.weather import WeatherRecord, SavedLocation
from app.schemas.weather import (
    WeatherRecordCreate,
    WeatherRecordUpdate,
    WeatherRecordOut,
    WeatherRecordWithLocation,
    CurrentWeatherResponse,
    ForecastResponse,
    GeocodingResult,
)
from app.services.geocoding import geocode_location
from app.services.weather_api import (
    get_current_weather,
    get_forecast,
    build_weather_snapshot,
    get_weather_for_date_range,
)

router = APIRouter(prefix="/weather", tags=["weather"])


# ---------------------------------------------------------------------------
# Live weather (no DB persistence)
# ---------------------------------------------------------------------------

@router.get("/current", response_model=CurrentWeatherResponse)
def current_weather(location: str = Query(..., description="City, zip code, landmark, or GPS coords")):
    """Get real-time current weather for a location."""
    try:
        geo = geocode_location(location)
        return get_current_weather(geo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather service error: {str(e)}")


@router.get("/forecast", response_model=ForecastResponse)
def weather_forecast(location: str = Query(..., description="City, zip code, landmark, or GPS coords")):
    """Get 5-day weather forecast for a location."""
    try:
        geo = geocode_location(location)
        return get_forecast(geo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Forecast service error: {str(e)}")


@router.get("/geocode")
def geocode(location: str = Query(...)):
    """Resolve a location query to coordinates."""
    try:
        return geocode_location(location)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ---------------------------------------------------------------------------
# CREATE — store a weather record for a date range
# ---------------------------------------------------------------------------

@router.post("/records", response_model=WeatherRecordWithLocation, status_code=201)
def create_weather_record(payload: WeatherRecordCreate, db: Session = Depends(get_db)):
    """
    Create a weather record: geocode the location, fetch weather data for the
    date range, and persist everything to the database.
    """
    try:
        geo = geocode_location(payload.location_query)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Reuse or create SavedLocation
    location = (
        db.query(SavedLocation)
        .filter(
            SavedLocation.latitude == round(geo.latitude, 4),
            SavedLocation.longitude == round(geo.longitude, 4),
        )
        .first()
    )
    if not location:
        location = SavedLocation(
            query=payload.location_query,
            display_name=geo.display_name,
            city=geo.city,
            country=geo.country,
            latitude=geo.latitude,
            longitude=geo.longitude,
        )
        db.add(location)
        db.flush()

    # Fetch weather data
    try:
        snapshot = build_weather_snapshot(geo, payload.date_from, payload.date_to)
        full_data = get_weather_for_date_range(geo, payload.date_from, payload.date_to)
    except Exception as e:
        snapshot = {}
        full_data = {"error": str(e)}

    forecast_list = full_data.get("forecast")

    record = WeatherRecord(
        location_id=location.id,
        date_from=payload.date_from,
        date_to=payload.date_to,
        notes=payload.notes,
        forecast_data=forecast_list,
        raw_data=full_data,
        **snapshot,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ---------------------------------------------------------------------------
# READ — list and get records
# ---------------------------------------------------------------------------

@router.get("/records", response_model=List[WeatherRecordWithLocation])
def list_weather_records(
    skip: int = 0,
    limit: int = 50,
    location_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """List all weather records (with location info). Supports pagination and filtering."""
    query = db.query(WeatherRecord)
    if location_id:
        query = query.filter(WeatherRecord.location_id == location_id)
    return query.order_by(WeatherRecord.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/records/{record_id}", response_model=WeatherRecordWithLocation)
def get_weather_record(record_id: int, db: Session = Depends(get_db)):
    """Get a single weather record by ID."""
    record = db.query(WeatherRecord).filter(WeatherRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Record #{record_id} not found")
    return record


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------

@router.patch("/records/{record_id}", response_model=WeatherRecordWithLocation)
def update_weather_record(
    record_id: int,
    payload: WeatherRecordUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a weather record. Updatable fields: date_from, date_to, notes,
    temperature_min/max/avg, humidity, wind_speed, description.
    """
    record = db.query(WeatherRecord).filter(WeatherRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Record #{record_id} not found")

    update_data = payload.model_dump(exclude_unset=True)

    # If either date is being updated, validate the resulting range
    new_from = update_data.get("date_from", record.date_from)
    new_to = update_data.get("date_to", record.date_to)
    if new_to < new_from:
        raise HTTPException(status_code=400, detail="date_to must be on or after date_from")

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

@router.delete("/records/{record_id}", status_code=204)
def delete_weather_record(record_id: int, db: Session = Depends(get_db)):
    """Delete a weather record."""
    record = db.query(WeatherRecord).filter(WeatherRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Record #{record_id} not found")
    db.delete(record)
    db.commit()
