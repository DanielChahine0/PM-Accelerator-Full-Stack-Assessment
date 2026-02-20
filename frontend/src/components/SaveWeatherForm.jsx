import { useState } from "react";
import { Save, ChevronDown, ChevronUp } from "lucide-react";
import { createRecord } from "../services/api";
import toast from "react-hot-toast";

export default function SaveWeatherForm({ locationQuery, onSaved }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date_from: new Date().toISOString().split("T")[0],
    date_to: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.date_from) errs.date_from = "Required";
    if (!form.date_to) errs.date_to = "Required";
    if (form.date_from && form.date_to && form.date_to < form.date_from) {
      errs.date_to = "End date must be on or after start date";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const record = await createRecord({
        location_query: locationQuery,
        date_from: form.date_from,
        date_to: form.date_to,
        notes: form.notes || null,
      });
      toast.success(`Saved weather record #${record.id}`);
      setOpen(false);
      onSaved?.(record);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to save record";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-2" style={{ padding: "1rem 1.5rem" }}>
      <button
        className="btn btn-secondary w-full"
        onClick={() => setOpen((o) => !o)}
        style={{ justifyContent: "space-between" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Save size={16} />
          Save to History
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="grid-2">
            <div className="form-group">
              <label>From date</label>
              <input
                type="date"
                value={form.date_from}
                onChange={(e) => setForm({ ...form, date_from: e.target.value })}
              />
              {errors.date_from && <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{errors.date_from}</span>}
            </div>
            <div className="form-group">
              <label>To date</label>
              <input
                type="date"
                value={form.date_to}
                onChange={(e) => setForm({ ...form, date_to: e.target.value })}
              />
              {errors.date_to && <span style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{errors.date_to}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any personal notes about this location or trip…"
              rows={2}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Save Record"}
          </button>
        </form>
      )}
    </div>
  );
}
