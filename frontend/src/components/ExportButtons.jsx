import { Download } from "lucide-react";
import { exportRecords } from "../services/api";
import toast from "react-hot-toast";

const FORMATS = [
  { label: "JSON", value: "json", mime: "application/json", ext: ".json" },
  { label: "CSV", value: "csv", mime: "text/csv", ext: ".csv" },
  { label: "XML", value: "xml", mime: "application/xml", ext: ".xml" },
  { label: "PDF", value: "pdf", mime: "application/pdf", ext: ".pdf" },
  { label: "Markdown", value: "markdown", mime: "text/markdown", ext: ".md" },
];

export default function ExportButtons({ recordIds = null }) {
  const handleExport = async (fmt) => {
    const toastId = toast.loading(`Exporting as ${fmt.label}…`);
    try {
      const res = await exportRecords(fmt.value, recordIds);
      const url = URL.createObjectURL(new Blob([res.data], { type: fmt.mime }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `weather_records${fmt.ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded weather_records${fmt.ext}`, { id: toastId });
    } catch (err) {
      toast.error("Export failed. Try again.", { id: toastId });
    }
  };

  return (
    <div style={styles.wrapper}>
      <span style={styles.label}>
        <Download size={14} />
        Export:
      </span>
      <div style={styles.buttons}>
        {FORMATS.map((fmt) => (
          <button
            key={fmt.value}
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport(fmt)}
            title={`Download as ${fmt.label}`}
          >
            {fmt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
  },
  buttons: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap",
  },
};
