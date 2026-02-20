from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class SavedLocation(Base):
    __tablename__ = "saved_locations"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String(255), nullable=False)          # raw user input
    display_name = Column(String(500), nullable=False)   # resolved full name
    city = Column(String(255))
    country = Column(String(100))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    weather_records = relationship("WeatherRecord", back_populates="location", cascade="all, delete-orphan")


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("saved_locations.id", ondelete="CASCADE"), nullable=False)

    # Date range for the query
    date_from = Column(Date, nullable=False)
    date_to = Column(Date, nullable=False)

    # Weather snapshot at time of query
    temperature_min = Column(Float)          # Celsius
    temperature_max = Column(Float)          # Celsius
    temperature_avg = Column(Float)          # Celsius
    humidity = Column(Float)                 # %
    wind_speed = Column(Float)               # m/s
    description = Column(String(255))
    weather_icon = Column(String(50))
    feels_like = Column(Float)
    pressure = Column(Float)                 # hPa
    visibility = Column(Float)               # meters
    uv_index = Column(Float)

    # Full raw API response stored as JSON for flexibility
    raw_data = Column(JSON)

    # Forecast data (5-day) stored as JSON list
    forecast_data = Column(JSON)

    # User notes
    notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    location = relationship("SavedLocation", back_populates="weather_records")
