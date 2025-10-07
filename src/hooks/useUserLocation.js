// src/hooks/useUserLocation.js
import { useState, useEffect } from "react";

export function useUserLocation(autoStart = false) {
  const [location, setLocation] = useState(() => {
    try {
      const cached = localStorage.getItem("userLocation");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateLocation = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation wird nicht unterstützt.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
        };
        localStorage.setItem("userLocation", JSON.stringify(coords));
        setLocation(coords);
        setIsLoading(false);
      },
      (err) => {
        console.warn("Fehler bei Standortabfrage:", err);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false, // schneller
        timeout: 5000,             // max 5 Sek.
        maximumAge: 60000,         // bis 1 Min. alte Position akzeptieren
      }
    );
  };

  useEffect(() => {
    if (autoStart && !location) updateLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { location, isLoading, updateLocation };
}
