// Official photo, served through next/image so visitors never contact the
// Assemblée directly
export function deputyPhotoUrl(id: string, legislature: string | null) {
  if (!legislature) {
    return null;
  }
  return `https://www2.assemblee-nationale.fr/static/tribun/${legislature}/photos/${id.replace("PA", "")}.jpg`;
}
