import { useState, useEffect, useCallback } from "react";
import { Trash2, Edit2, X, Check, RefreshCw, MapPin, CalendarDays } from "lucide-react";
import { listRecords, deleteRecord, updateRecord } from "../services/api";
import ExportButtons from "../components/ExportButtons";
import StandardCard from "../components/StandardCard";
import CompactCard from "../components/CompactCard";
import toast from "react-hot-toast";

const OWM_ICON = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getRecordStatus(rec) {
  if (!rec.created_at) return undefined;
  const age = Date.now() - new Date(rec.created_at).getTime();
  const dayMs = 86400000;
  if (age < dayMs) return "active";
  if (age < dayMs * 7) return "stale";
  return undefined;
}

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

  // Group records: most recent first, then split featured vs rest
  const sorted = [...records].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const featured = sorted[0] || null;
  const rest = sorted.slice(1);

  return (
    <main className="page">
      <div className="container">
        {/* Header */}
        <div className="history-header mb-3">
          <div>
            <h1>History</h1>
            <p className="text-muted">Saved weather records. {records.length} total.</p>
          </div>
          <div className="history-header__actions">
            <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
              <RefreshCw size={14} />
              Refresh
            </button>
            <ExportButtons />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="history-grid">
            <StandardCard loading className="history-grid__featured" />
            <StandardCard loading />
            <StandardCard loading />
          </div>
        )}

        {/* Empty */}
        {!loading && records.length === 0 && (
          <StandardCard empty emptyText="No records yet. Search for a location and save it." />
        )}

        {/* Records — featured + list, not uniform */}
        {!loading && featured && (
          <div className="history-grid">
            {/* Featured record — larger */}
            <div className="history-grid__featured">
              <RecordRow
                rec={featured}
                isFeatured
                isEditing={editId === featured.id}
                editForm={editForm}
                setEditForm={setEditForm}
                onEdit={() => startEdit(featured)}
                onCancel={cancelEdit}
                onSave={() => handleSave(featured.id)}
                onDelete={() => handleDelete(featured.id)}
                saving={saving}
                deleting={deleting === featured.id}
              />
            </div>

            {/* Rest — compact list */}
            {rest.length > 0 && (
              <div className="history-grid__list">
                <h3 className="history-grid__list-heading">Older Records</h3>
                {rest.map((rec) => (
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
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function RecordRow({ rec, isFeatured, isEditing, editForm, setEditForm, onEdit, onCancel, onSave, onDelete, saving, deleting }) {
  const status = getRecordStatus(rec);
  const updated = relativeTime(rec.created_at);

  const headerRight = (
    <div className="record-actions">
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
  );

  const cityName = rec.location?.city || rec.location?.display_name?.split(",")[0] || "Unknown";

  return (
    <StandardCard
      title={
        <span className="record-title">
          <MapPin size={14} className="record-title__pin" />
          {cityName}
          {rec.location?.country && <span className="record-title__country">, {rec.location.country}</span>}
        </span>
      }
      status={status}
      updatedAt={updated}
      headerRight={headerRight}
      className={`mb-2 ${isFeatured ? "record--featured" : ""}`}
    >
      {!isEditing ? (
        <>
          <p className="record-dates">
            <CalendarDays size={12} />
            {rec.date_from} → {rec.date_to}
          </p>

          {/* Stats — compact list, not pills */}
          <div className="record-stats">
            {rec.temperature_avg != null && (
              <CompactCard label="Avg" value={`${rec.temperature_avg}°C`} />
            )}
            {rec.temperature_min != null && (
              <CompactCard label="Min" value={`${rec.temperature_min}°C`} />
            )}
            {rec.temperature_max != null && (
              <CompactCard label="Max" value={`${rec.temperature_max}°C`} />
            )}
            {rec.humidity != null && (
              <CompactCard label="Humidity" value={`${rec.humidity}%`} />
            )}
            {rec.wind_speed != null && (
              <CompactCard label="Wind" value={`${rec.wind_speed} m/s`} />
            )}
            {rec.description && (
              <CompactCard label="Conditions" value={rec.description} />
            )}
          </div>

          {rec.notes && (
            <p className="record-notes">{rec.notes}</p>
          )}

          <p className="record-meta">#{rec.id} · {new Date(rec.created_at).toLocaleString()}</p>
        </>
      ) : (
        <EditForm editForm={editForm} setEditForm={setEditForm} />
      )}
    </StandardCard>
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
