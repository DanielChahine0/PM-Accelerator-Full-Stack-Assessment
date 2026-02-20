import { useState } from "react";
import { Search, MapPin, Loader } from "lucide-react";

export default function SearchBar({ onSearch, loading = false, placeholder = "City, zip code, landmark, or GPS coords…" }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter a location.");
      return;
    }
    setError("");
    onSearch(trimmed);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
        setValue(coords);
        onSearch(coords);
      },
      () => setError("Unable to get your location. Please allow location access.")
    );
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputRow}>
        <div style={styles.inputWrapper}>
          <Search size={18} style={styles.icon} />
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); }}
            placeholder={placeholder}
            style={styles.input}
            disabled={loading}
          />
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleGeolocate} disabled={loading} title="Use my location">
          <MapPin size={16} />
          <span className="hide-mobile">My Location</span>
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading || !value.trim()}>
          {loading ? <Loader size={16} className="spin-anim" /> : <Search size={16} />}
          <span className="hide-mobile">Search</span>
        </button>
      </div>
      {error && <p style={styles.err}>{error}</p>}
    </form>
  );
}

const styles = {
  form: { width: "100%" },
  inputRow: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  inputWrapper: {
    flex: 1,
    minWidth: 200,
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  icon: {
    position: "absolute",
    left: "0.7rem",
    color: "var(--text-muted)",
    pointerEvents: "none",
  },
  input: {
    paddingLeft: "2.4rem",
    fontSize: "0.95rem",
  },
  err: {
    marginTop: "0.4rem",
    color: "var(--danger)",
    fontSize: "0.85rem",
  },
};
