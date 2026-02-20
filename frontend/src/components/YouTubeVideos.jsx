import { Youtube } from "lucide-react";

export default function YouTubeVideos({ data }) {
  if (!data || !data.videos || data.videos.length === 0) return null;

  return (
    <div className="card mt-2">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <Youtube size={20} color="#ff0000" />
        <h3>Videos about {data.location?.city || "this location"}</h3>
      </div>
      <div className="grid-2">
        {data.videos.map((v) => (
          <VideoTile key={v.video_id} video={v} />
        ))}
      </div>
    </div>
  );
}

function VideoTile({ video }) {
  return (
    <a
      href={video.watch_url}
      target="_blank"
      rel="noopener noreferrer"
      style={styles.tile}
    >
      <img src={video.thumbnail} alt={video.title} style={styles.thumb} />
      <div style={styles.info}>
        <p style={styles.title}>{video.title}</p>
        <p style={styles.channel}>{video.channel}</p>
      </div>
    </a>
  );
}

const styles = {
  tile: {
    display: "flex",
    flexDirection: "column",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid var(--border)",
    textDecoration: "none",
    color: "inherit",
    transition: "box-shadow 0.2s",
    background: "var(--surface-alt)",
  },
  thumb: {
    width: "100%",
    aspectRatio: "16/9",
    objectFit: "cover",
  },
  info: {
    padding: "0.6rem 0.75rem",
  },
  title: {
    fontWeight: 600,
    fontSize: "0.85rem",
    color: "var(--text)",
    lineHeight: 1.35,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  channel: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    marginTop: "0.25rem",
  },
};
