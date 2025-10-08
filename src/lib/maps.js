export const buildGoogleMapsRouteUrl = ({ address = "", zip = "", city = "" } = {}) => {
  const parts = [address, zip, city].map((part) => part?.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  const destination = encodeURIComponent(parts.join(", "));
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
};

export default {
  buildGoogleMapsRouteUrl,
};
