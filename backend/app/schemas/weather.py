from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List, Any, Dict
from datetime import date, datetime


class GeocodingResult(BaseModel):
    display_name: str
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: float
    longitude: float


class LocationCreate(BaseModel):
    query: str

    @field_validator("query")
    @classmethod
    def query_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Location query cannot be empty")
        return v


class LocationOut(BaseModel):
    id: int
    query: str
    display_name: str
    city: Optional[str]
    country: Optional[str]
    latitude: float
    longitude: float
    created_at: datetime

    model_config = {"from_attributes": True}


class WeatherRecordCreate(BaseModel):
    location_query: str
    date_from: date
    date_to: date
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_date_range(self) -> "WeatherRecordCreate":
        if self.date_to < self.date_from:
            raise ValueError("date_to must be on or after date_from")
        diff = (self.date_to - self.date_from).days
        if diff > 365:
            raise ValueError("Date range cannot exceed 365 days")
        return self


class WeatherRecordUpdate(BaseModel):
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    notes: Optional[str] = None
    temperature_min: Optional[float] = None
    temperature_max: Optional[float] = None
    temperature_avg: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    description: Optional[str] = None

    @model_validator(mode="after")
    def validate_dates_if_both_provided(self) -> "WeatherRecordUpdate":
        if self.date_from and self.date_to:
            if self.date_to < self.date_from:
                raise ValueError("date_to must be on or after date_from")
        return self


class WeatherRecordOut(BaseModel):
    id: int
    location_id: int
    date_from: date
    date_to: date
    temperature_min: Optional[float]
    temperature_max: Optional[float]
    temperature_avg: Optional[float]
    humidity: Optional[float]
    wind_speed: Optional[float]
    description: Optional[str]
    weather_icon: Optional[str]
    feels_like: Optional[float]
    pressure: Optional[float]
    visibility: Optional[float]
    uv_index: Optional[float]
    forecast_data: Optional[List[Dict[str, Any]]]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WeatherRecordWithLocation(WeatherRecordOut):
    location: LocationOut


class CurrentWeatherResponse(BaseModel):
    location: GeocodingResult
    temperature: float
    feels_like: float
    temp_min: float
    temp_max: float
    humidity: float
    pressure: float
    wind_speed: float
    visibility: float
    description: str
    icon: str
    dt: int  # Unix timestamp


class ForecastDay(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    description: str
    icon: str
    humidity: float
    wind_speed: float
    pop: float  # probability of precipitation


class ForecastResponse(BaseModel):
    location: GeocodingResult
    forecast: List[ForecastDay]
