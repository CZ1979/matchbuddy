import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { normalizePhoneNumber } from "../lib/whatsapp";

const PROFILE_STORAGE_KEY = "trainerProfile";
const PROFILE_ID_KEY = "trainerProfileId";
const PROFILE_COMPLETED_KEY = "profileCompleted";
const LEGACY_EMAIL_KEY = "trainerEmail";

const ProfileContext = createContext(null);

const parseJson = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Profil konnte nicht geladen werden:", error);
    return null;
  }
};

const ensureWindow = () => typeof window !== "undefined" && typeof document !== "undefined";

const geocodeCity = async (city) => {
  if (!city) return { lat: null, lng: null };
  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=de&q=" +
    encodeURIComponent(city);
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
};

const mapLegacyProfile = (profile, profileId) => {
  if (!profile) return null;
  const firstName = profile.firstName || profile.name?.split(" ")[0] || "";
  const remaining = profile.lastName || profile.name?.split(" ").slice(1).join(" ") || "";
  const nameParts = [firstName, remaining].filter(Boolean);
  const fullName = nameParts.length > 0 ? nameParts.join(" ") : profile.name || "";
  return {
    id: profile.id || profileId || "",
    firstName,
    lastName: remaining,
    fullName,
    club: profile.club || "",
    phone: profile.phone || "",
<<<<<<< HEAD
    email: profile.email || profile.contactEmail || profileId || "",
=======
    email: profile.email || "",
>>>>>>> relaunch-ux-cards
    ageGroup: profile.ageGroup || "",
    city: profile.city || profile.locationLabel || "",
    rememberData:
      typeof profile.rememberData === "boolean" ? profile.rememberData : profile.remember === true,
    location: profile.location || null,
    createdAt: profile.createdAt || null,
    updatedAt: profile.updatedAt || null,
  };
};

const readFromStorage = () => {
  if (!ensureWindow()) {
    return { profile: null, profileId: "", profileCompleted: false };
  }

  const storedProfile = parseJson(localStorage.getItem(PROFILE_STORAGE_KEY));
  const storedId =
    localStorage.getItem(PROFILE_ID_KEY) ||
    storedProfile?.id ||
    localStorage.getItem(LEGACY_EMAIL_KEY) ||
    "";

<<<<<<< HEAD
  const storedEmail = localStorage.getItem(LEGACY_EMAIL_KEY) || storedProfile?.email || "";

  const profile = mapLegacyProfile(storedProfile, storedId);
  if (profile && !profile.email && storedEmail) {
    profile.email = storedEmail;
  }
=======
  const profile = mapLegacyProfile(storedProfile, storedId);
>>>>>>> relaunch-ux-cards
  const completedFlag = localStorage.getItem(PROFILE_COMPLETED_KEY);
  const profileCompleted = completedFlag === "true" || Boolean(profile);

  if (profile && !profile.id && storedId) {
    profile.id = storedId;
  }

  return { profile, profileId: profile?.id || storedId || "", profileCompleted };
};

export function ProfileProvider({ children }) {
  const [{ profile, profileId, profileCompleted }, setProfileState] = useState(readFromStorage);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const lastCityRef = useRef(profile?.city || "");

  const persistProfile = useCallback((nextProfile) => {
    if (!ensureWindow()) return;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    if (nextProfile?.id) {
      localStorage.setItem(PROFILE_ID_KEY, nextProfile.id);
<<<<<<< HEAD
    }
    if (nextProfile?.email) {
      localStorage.setItem(LEGACY_EMAIL_KEY, nextProfile.email);
    } else if (nextProfile?.id) {
=======
>>>>>>> relaunch-ux-cards
      localStorage.setItem(LEGACY_EMAIL_KEY, nextProfile.id);
    }
    localStorage.setItem(PROFILE_COMPLETED_KEY, "true");
    setProfileState({
      profile: nextProfile,
      profileId: nextProfile?.id || "",
      profileCompleted: true,
    });
  }, []);

  const refreshFromFirestore = useCallback(
    async (targetId) => {
      if (!targetId) return null;
      setIsLoading(true);
      try {
        const ref = doc(db, "profiles", targetId);
        const snapshot = await getDoc(ref);
        if (!snapshot.exists()) return null;
        const data = snapshot.data();
        const nextProfile = {
          id: targetId,
          firstName: data.firstName || data.fullName?.split(" ")[0] || "",
          lastName: data.lastName || data.fullName?.split(" ").slice(1).join(" ") || "",
          fullName: data.fullName || [data.firstName, data.lastName].filter(Boolean).join(" "),
          club: data.club || "",
          phone: data.phone || "",
<<<<<<< HEAD
          email: data.email || data.contactEmail || data.trainerEmail || targetId || "",
=======
>>>>>>> relaunch-ux-cards
          ageGroup: data.ageGroup || "",
          city: data.city || "",
          rememberData: data.rememberData !== false,
          location: data.location || null,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
        };
        persistProfile(nextProfile);
        return nextProfile;
      } catch (error) {
        console.warn("Profil konnte nicht geladen werden:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [persistProfile]
  );

  const saveProfile = useCallback(
    async (input, { geocode = true } = {}) => {
<<<<<<< HEAD
      if (!input || !input.name || !input.club || !input.city || !input.email || !input.phone) {
=======
      if (!input || !input.name || !input.club || !input.city) {
>>>>>>> relaunch-ux-cards
        throw new Error("Profil unvollständig");
      }

      setIsSaving(true);
      try {
        const trimmedName = input.name.trim();
<<<<<<< HEAD
        const trimmedEmail = input.email.trim().toLowerCase();
=======
>>>>>>> relaunch-ux-cards
        const [firstName, ...rest] = trimmedName.split(/\s+/);
        const lastName = rest.join(" ");
        const normalizedPhone = normalizePhoneNumber(input.phone || "");
        const generatedId =
          typeof globalThis.crypto !== "undefined" &&
          typeof globalThis.crypto.randomUUID === "function"
            ? globalThis.crypto.randomUUID()
            : Math.random().toString(36).slice(2);
<<<<<<< HEAD
        const id = profile?.id || profileId || trimmedEmail || generatedId;
=======
        const id = profile?.id || profileId || generatedId;
>>>>>>> relaunch-ux-cards

        let lat = input.location?.lat ?? profile?.location?.lat ?? null;
        let lng = input.location?.lng ?? profile?.location?.lng ?? null;

        if (geocode && input.city && input.city !== lastCityRef.current) {
          const geo = await geocodeCity(input.city);
          lat = geo.lat;
          lng = geo.lng;
          lastCityRef.current = input.city;
        }

        const nextProfile = {
          id,
          firstName,
          lastName,
          fullName: trimmedName,
          club: input.club.trim(),
          phone: normalizedPhone,
<<<<<<< HEAD
          email: trimmedEmail,
=======
          email: profile?.email || "",
>>>>>>> relaunch-ux-cards
          ageGroup: profile?.ageGroup || "",
          city: input.city.trim(),
          rememberData: input.rememberData !== false,
          location:
            lat != null && lng != null
              ? {
                  lat,
                  lng,
                }
              : null,
        };

        const payload = {
          ...nextProfile,
          rememberData: nextProfile.rememberData,
          location: nextProfile.location,
          email: nextProfile.email,
          updatedAt: serverTimestamp(),
        };

        const ref = doc(db, "profiles", id);
        await setDoc(ref, payload, { merge: true });

        persistProfile(nextProfile);
        return nextProfile;
      } finally {
        setIsSaving(false);
      }
    },
    [
      persistProfile,
<<<<<<< HEAD
=======
      profile?.email,
>>>>>>> relaunch-ux-cards
      profile?.ageGroup,
      profile?.id,
      profile?.location?.lat,
      profile?.location?.lng,
      profileId,
    ]
  );

  useEffect(() => {
    if (!ensureWindow()) return undefined;
    const handleStorage = () => {
      setProfileState(readFromStorage());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      profileId,
      profileCompleted,
      isSaving,
      isLoading,
      saveProfile,
      refreshProfile: refreshFromFirestore,
    }),
    [profile, profileCompleted, profileId, isLoading, isSaving, refreshFromFirestore, saveProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile muss innerhalb eines ProfileProvider verwendet werden");
  }
  return context;
}
