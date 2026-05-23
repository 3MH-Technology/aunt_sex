export async function searchVideos(query: string) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}
