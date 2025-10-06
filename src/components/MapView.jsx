import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapView({ games, center = [50.11, 8.68], zoom = 9 }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current).setView(center, zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
      detectRetina: true,
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    return () => {
      layer.clearLayers();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom());
    }
  }, [center]);

  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    const pts = [];

    games.forEach((g) => {
      if (typeof g.lat === "number" && typeof g.lng === "number") {
        const m = L.marker([g.lat, g.lng], { icon: defaultIcon }).addTo(layer);
        const email = g.contactEmail ? `<div><a href="mailto:${g.contactEmail}">${g.contactEmail}</a></div>` : "";
        const phone = g.contactPhone ? `<div>📞 ${escapeHtml(g.contactPhone)}</div>` : "";
        const clubName = (g.ownerClub ? `${g.ownerClub} – ` : "") + (g.ownerName || "");
        m.bindPopup(
          `<div style="font-size:12px;line-height:1.3">
            <div><b>${escapeHtml(g.ageGroup || "")}</b> • ${escapeHtml(g.date || "")} ${escapeHtml(g.time || "")}</div>
            <div>${escapeHtml(g.address || "")}</div>
            <div>${escapeHtml(clubName)}</div>
            ${email}${phone}
          </div>`
        );
        pts.push([g.lat, g.lng]);
      }
    });

    if (pts.length) {
      map.fitBounds(L.latLngBounds(pts).pad(0.2));
    }
  }, [games]);

  return <div ref={elRef} className="h-[420px] w-full rounded-xl" />;
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
