import { ExternalLink } from "lucide-react";

export default function MapEmbed({ data }) {
  if (!data || !data.embed_url) return null;

  const { embed_url, osm_link } = data;

  return (
    <div className="card mt-2">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h3>Map</h3>
        {osm_link && (
          <a href={osm_link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} />
            Open in OpenStreetMap
          </a>
        )}
      </div>
      <iframe
        src={embed_url}
        width="100%"
        height="300"
        style={{ borderRadius: 10, border: "1px solid var(--border)" }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Location map"
      />
    </div>
  );
}
