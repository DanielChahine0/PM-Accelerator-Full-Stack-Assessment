import { useState, useEffect, useCallback } from "react";
import { Trash2, Edit2, X, Check, RefreshCw, MapPin, CalendarDays } from "lucide-react";
import { listRecords, deleteRecord, updateRecord } from "../services/api";
import ExportButtons from "../components/ExportButtons";
import toast from "react-hot-toast";

const OWM_ICON = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRecords();
      setRecords(data);
    } catch {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete record #${id}?`)) return;
    setDeleting(id);
    try {
      await deleteRecord(id);
      setRecords((r) => r.filter((rec) => rec.id !== id));
      toast.success(`Record #${id} deleted`);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (rec) => {
    setEditId(rec.id);
    setEditForm({
      date_from: rec.date_from,
      date_to: rec.date_to,
      notes: rec.notes || "",
      temperature_min: rec.temperature_min ?? "",
      temperature_max: rec.temperature_max ?? "",
      temperature_avg: rec.temperature_avg ?? "",
      humidity: rec.humidity ?? "",
      wind_speed: rec.wind_speed ?? "",
      description: rec.description || "",
    });
  };

  const cancelEdit = () => { setEditId(null); setEditForm({}); };

  const handleSave = async (id) => {
    if (editForm.date_from && editForm.date_to && editForm.date_to < editForm.date_from) {
      toast.error("End date must be on or after start date");
      return;
    }
    setSaving(true);
    try {
      const payload = {};
      Object.entries(editForm).forEach(([k, v]) => {
        if (v !== "" && v != null) payload[k] = v;
      });
      const updated = await updateRecord(id, payload);
      setRecords((r) => r.map((rec) => (rec.id === id ? updated : rec)));
      toast.success("Record updated");
      setEditId(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-3" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h1>Weather History</h1>
            <p className="text-muted">All saved weather records — read, update, or delete.</p>
          </div>
          <div className="flex gap-1 items-center" style={{ flexWrap: "wrap" }}>
            <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
              <RefreshCw size={14} />
              Refresh
            </button>
            <ExportButtons />
          </div>
        </div>

        {loading && <div className="loading-center"><div className="spinner" /></div>}

        {!loading && records.length === 0 && (
          <div className="empty-state">
            <p style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📂</p>
            <p>No records yet. Search for a location on the Weather page and save it.</p>
          </div>
        )}

        {!loading && records.map((rec) => (
          <RecordRow
            key={rec.id}
            rec={rec}
            isEditing={editId === rec.id}
            editForm={editForm}
            setEditForm={setEditForm}
            onEdit={() => startEdit(rec)}
            onCancel={cancelEdit}
            onSave={() => handleSave(rec.id)}
            onDelete={() => handleDelete(rec.id)}
            saving={saving}
            deleting={deleting === rec.id}
          />
        ))}
      </div>
    </main>
  );
}

function RecordRow({ rec, isEditing, editForm, setEditForm, onEdit, onCancel, onSave, onDelete, saving, deleting }) {
  return (
    <div className="card mb-2" style={{ position: "relative" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {rec.weather_icon && (
              <img src={OWM_ICON(rec.weather_icon)} alt="" style={{ width: 40, height: 40 }} />
            )}
            <div>
              <p style={{ fontWeight: 700, fontSize: "1rem" }}>
                <MapPin size={14} style={{ verticalAlign: "middle", marginRight: 4, color: "var(--primary)" }} />
                {rec.location?.city || rec.location?.display_name?.split(",")[0]}
                {rec.location?.country && `, ${rec.location.country}`}
              </p>
              <p className="text-muted text-sm">
                <CalendarDays size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                {rec.date_from} → {rec.date_to}
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {!isEditing ? (
            <>
              <button className="btn btn-secondary btn-sm btn-icon" onClick={onEdit} title="Edit">
                <Edit2 size={14} />
              </button>
              <button className="btn btn-danger btn-sm btn-icon" onClick={onDelete} disabled={deleting} title="Delete">
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-success btn-sm" onClick={onSave} disabled={saving}>
                <Check size={14} />
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={onCancel}>
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      {!isEditing ? (
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.875rem" }}>
          {rec.temperature_avg != null && <StatPill label="Avg Temp" value={`${rec.temperature_avg}°C`} />}
          {rec.temperature_min != null && <StatPill label="Min" value={`${rec.temperature_min}°C`} />}
          {rec.temperature_max != null && <StatPill label="Max" value={`${rec.temperature_max}°C`} />}
          {rec.humidity != null && <StatPill label="Humidity" value={`${rec.humidity}%`} />}
          {rec.wind_speed != null && <StatPill label="Wind" value={`${rec.wind_speed} m/s`} />}
          {rec.description && <StatPill label="Conditions" value={rec.description} />}
        </div>
      ) : (
        <EditForm editForm={editForm} setEditForm={setEditForm} />
      )}

      {rec.notes && !isEditing && (
        <p style={{ marginTop: "0.6rem", fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          📝 {rec.notes}
        </p>
      )}

      <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
        Record #{rec.id} · Saved {new Date(rec.created_at).toLocaleString()}
      </p>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div>
      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{label}: </span>
      <strong>{value}</strong>
    </div>
  );
}

function EditForm({ editForm, setEditForm }) {
  const f = (k, v) => setEditForm((prev) => ({ ...prev, [k]: v }));
  return (
    <div style={{ marginTop: "0.75rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.6rem" }}>
      <Field label="From date" type="date" value={editForm.date_from} onChange={(v) => f("date_from", v)} />
      <Field label="To date" type="date" value={editForm.date_to} onChange={(v) => f("date_to", v)} />
      <Field label="Min temp (°C)" type="number" value={editForm.temperature_min} onChange={(v) => f("temperature_min", v)} />
      <Field label="Max temp (°C)" type="number" value={editForm.temperature_max} onChange={(v) => f("temperature_max", v)} />
      <Field label="Avg temp (°C)" type="number" value={editForm.temperature_avg} onChange={(v) => f("temperature_avg", v)} />
      <Field label="Humidity (%)" type="number" value={editForm.humidity} onChange={(v) => f("humidity", v)} />
      <Field label="Wind (m/s)" type="number" value={editForm.wind_speed} onChange={(v) => f("wind_speed", v)} />
      <Field label="Description" type="text" value={editForm.description} onChange={(v) => f("description", v)} />
      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
        <label>Notes</label>
        <textarea value={editForm.notes} onChange={(e) => f("notes", e.target.value)} rows={2} />
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} step={type === "number" ? "0.1" : undefined} />
    </div>
  );
}
