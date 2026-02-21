import StandardCard from "./StandardCard";

export default function YouTubeVideos({ data }) {
  if (!data || !data.videos || data.videos.length === 0) return null;

  return (
    <StandardCard
      title={`Videos — ${data.location?.city || "this location"}`}
      className="mt-3"
    >
      <div className="video-grid">
        {data.videos.map((v) => (
          <VideoTile key={v.video_id} video={v} />
        ))}
      </div>
    </StandardCard>
  );
}

function VideoTile({ video }) {
  return (
    <a
      href={video.watch_url}
      target="_blank"
      rel="noopener noreferrer"
      className="video-tile"
    >
      <img src={video.thumbnail} alt={video.title} className="video-tile__thumb" />
      <div className="video-tile__info">
        <p className="video-tile__title">{video.title}</p>
        <p className="video-tile__channel">{video.channel}</p>
      </div>
    </a>
  );
}


