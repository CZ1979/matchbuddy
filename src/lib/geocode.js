export async function geocodePlace(query) {
  if (!query) {
    return { lat: null, lng: null };
  }

  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=de&q=" +
    encodeURIComponent(query);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "de",
      },
    });
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const { lat, lon } = data[0];
      const latNum = Number.parseFloat(lat);
      const lngNum = Number.parseFloat(lon);
      if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
        return { lat: latNum, lng: lngNum };
      }
    }
  } catch (error) {
    console.warn("Geocoding fehlgeschlagen:", error);
  }

  return { lat: null, lng: null };
}
