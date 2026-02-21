import { ExternalLink } from "lucide-react";
import StandardCard from "./StandardCard";

export default function MapEmbed({ data }) {
  if (!data || !data.embed_url) return null;

  const { embed_url, osm_link } = data;

  return (
    <StandardCard
      title="Map"
      className="mt-2"
      headerRight={
        osm_link ? (
          <a href={osm_link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} />
            OpenStreetMap
          </a>
        ) : null
      }
    >
      <iframe
        src={embed_url}
        width="100%"
        height="260"
        style={{ borderRadius: 10, border: "1px solid var(--border)", display: "block" }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Location map"
      />
    </StandardCard>
  );
}
