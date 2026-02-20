import { ExternalLink } from "lucide-react";

export default function MapEmbed({ data }) {
  if (!data) return null;

  const { google_maps_embed_url, openstreetmap_embed_url, google_maps_link } = data;
  const embedUrl = google_maps_embed_url || openstreetmap_embed_url;

  if (!embedUrl) return null;

  return (
    <div className="card mt-2">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h3>Map</h3>
        {google_maps_link && (
          <a href={google_maps_link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} />
            Open in Google Maps
          </a>
        )}
      </div>
      <iframe
        src={embedUrl}
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
