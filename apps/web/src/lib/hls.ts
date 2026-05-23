export function generateHLSManifest(videoId: string, qualities: Record<string, string>) {
  const m3u8 = `#EXTM3U\n#EXT-X-VERSION:3\n${Object.entries(qualities)
    .map(([label, url]) => `#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=1280x720\n${url}`)
    .join("\n")}`;
  return m3u8;
}
