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
import { geocodePlace } from "../lib/geocode";
import { normalizeAgeGroup } from "../utils/ageGroups";
import { toPhoneObject } from "../utils/phone";

const PROFILE_STORAGE_KEY = "trainerProfile";
const PROFILE_ID_KEY = "trainerProfileId";
const PROFILE_EMAIL_KEY = "trainerProfileEmail";
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

const normalizeEmail = (value = "") => value.trim().toLowerCase();

const mapLegacyProfile = (profile, profileId, storedEmail = "") => {
  if (!profile) return null;
  const firstName = profile.firstName || profile.name?.split(" ")[0] || "";
  const remaining = profile.lastName || profile.name?.split(" ").slice(1).join(" ") || "";
  const nameParts = [firstName, remaining].filter(Boolean);
  const fullName = nameParts.length > 0 ? nameParts.join(" ") : profile.name || "";
  const resolvedEmail = (profile.email || storedEmail || profileId || "").trim();
  const normalizedEmail = profile.emailNormalized || normalizeEmail(resolvedEmail || profileId);
  const resolvedId = profile.id || profileId || resolvedEmail || "";
  const legacyAgeGroups = Array.isArray(profile.ageGroups)
    ? profile.ageGroups
    : profile.ageGroup
    ? [profile.ageGroup]
    : [];
  const normalizedAgeGroups = Array.from(
    new Set(
      legacyAgeGroups
        .map((value) => normalizeAgeGroup(value))
        .filter((value) => typeof value === "string" && value.trim() !== "")
    )
  );
  const phoneObject = profile.phone ? toPhoneObject(profile.phone) : toPhoneObject(null);
  const normalizedPhone = normalizePhoneNumber(phoneObject);
  return {
    id: resolvedId,
    firstName,
    lastName: remaining,
    fullName,
    club: profile.club || "",
    phone: phoneObject,
    phoneNormalized: normalizedPhone,
    phoneVerified: profile.phoneVerified || false,
    email: resolvedEmail,
    emailNormalized: normalizedEmail,
    city: profile.city || profile.locationLabel || "",
    location: profile.location || null,
    createdAt: profile.createdAt || null,
    updatedAt: profile.updatedAt || null,
    ageGroups: normalizedAgeGroups,
  };
};

const readFromStorage = () => {
  if (!ensureWindow()) {
    return { profile: null, profileId: "", profileCompleted: false };
  }

  const storedProfile = parseJson(localStorage.getItem(PROFILE_STORAGE_KEY));
  const storedEmail =
    localStorage.getItem(PROFILE_EMAIL_KEY) ||
    storedProfile?.email ||
    localStorage.getItem(LEGACY_EMAIL_KEY) ||
    "";
  const storedId =
    localStorage.getItem(PROFILE_ID_KEY) ||
    storedProfile?.id ||
    storedEmail ||
    localStorage.getItem(LEGACY_EMAIL_KEY) ||
    "";

  const profile = mapLegacyProfile(storedProfile, storedId, storedEmail);
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
    }
    if (nextProfile?.email) {
      localStorage.setItem(PROFILE_EMAIL_KEY, nextProfile.email);
      localStorage.setItem(LEGACY_EMAIL_KEY, nextProfile.email);
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
        const normalizedAgeGroups = Array.isArray(data.ageGroups)
          ? Array.from(
              new Set(
                data.ageGroups
                  .map((value) => normalizeAgeGroup(value))
                  .filter((value) => typeof value === "string" && value.trim() !== "")
              )
            )
          : [];
        const phoneValue =
          data.phone ||
          (data.phoneCountryCode || data.phoneNumber
            ? { countryCode: data.phoneCountryCode, number: data.phoneNumber }
            : null);
        const phoneObject = toPhoneObject(phoneValue);
        const normalizedPhone = normalizePhoneNumber(phoneObject);
        const nextProfile = {
          id: targetId,
          firstName: data.firstName || data.fullName?.split(" ")[0] || "",
          lastName: data.lastName || data.fullName?.split(" ").slice(1).join(" ") || "",
          fullName: data.fullName || [data.firstName, data.lastName].filter(Boolean).join(" "),
          club: data.club || "",
          phone: phoneObject,
          phoneNormalized: normalizedPhone,
          phoneVerified: data.phoneVerified || false,
          email: data.email || "",
          emailNormalized: data.emailNormalized || normalizeEmail(data.email || targetId),
          city: data.city || "",
          location: data.location || null,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          ageGroups: normalizedAgeGroups,
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
      if (!input || !input.name || !input.club || !input.city || !input.phone || !input.email) {
        throw new Error("Profil unvollständig");
      }

      const incomingAgeGroups = Array.isArray(input.ageGroups) ? input.ageGroups : [];
      const normalizedAgeGroups = Array.from(
        new Set(
          incomingAgeGroups
            .map((value) => normalizeAgeGroup(value))
            .filter((value) => typeof value === "string" && value.trim() !== "")
        )
      );

      if (normalizedAgeGroups.length === 0) {
        throw new Error("Bitte wähle mindestens einen Jahrgang aus.");
      }

      setIsSaving(true);
      try {
        const trimmedName = input.name.trim();
        const [firstName, ...rest] = trimmedName.split(/\s+/);
        const lastName = rest.join(" ");
        const trimmedEmail = (input.email || "").trim();
        if (!trimmedEmail) {
          throw new Error("Profil unvollständig");
        }
        const normalizedEmail = normalizeEmail(trimmedEmail);
        const generatedId =
          typeof globalThis.crypto !== "undefined" &&
          typeof globalThis.crypto.randomUUID === "function"
            ? globalThis.crypto.randomUUID()
            : Math.random().toString(36).slice(2);
        const id = profile?.id || profileId || normalizedEmail || generatedId;

        let lat = input.location?.lat ?? profile?.location?.lat ?? null;
        let lng = input.location?.lng ?? profile?.location?.lng ?? null;

        if (geocode && input.city && input.city !== lastCityRef.current) {
          const geo = await geocodePlace(input.city);
          lat = geo.lat;
          lng = geo.lng;
          lastCityRef.current = input.city;
        }

        const phoneObject = toPhoneObject(input.phone);
        if (!phoneObject.number) {
          throw new Error("Telefonnummer fehlt");
        }

        const nextProfile = {
          id,
          firstName,
          lastName,
          fullName: trimmedName,
          club: input.club.trim(),
          phone: phoneObject,
          phoneVerified: input.phoneVerified !== undefined ? input.phoneVerified : (profile?.phoneVerified || false),
          email: trimmedEmail,
          emailNormalized: normalizedEmail,
          city: input.city.trim(),
          location:
            lat != null && lng != null
              ? {
                  lat,
                  lng,
                }
              : null,
          ageGroups: normalizedAgeGroups,
        };

        const normalizedPhone = normalizePhoneNumber(phoneObject);
        const payload = {
          ...nextProfile,
          location: nextProfile.location,
          phone: phoneObject,
          phoneNormalized: normalizedPhone,
          phoneVerified: nextProfile.phoneVerified,
          phoneCountryCode: phoneObject.countryCode,
          phoneNumber: phoneObject.number,
          email: nextProfile.email || null,
          emailNormalized: nextProfile.emailNormalized || null,
          updatedAt: serverTimestamp(),
        };

        const ref = doc(db, "profiles", id);
        await setDoc(ref, payload, { merge: true });

        persistProfile({
          ...nextProfile,
          phone: phoneObject,
          phoneNormalized: normalizedPhone,
          phoneVerified: nextProfile.phoneVerified,
        });
        return nextProfile;
      } finally {
        setIsSaving(false);
      }
    },
    [persistProfile, profile?.id, profile?.location?.lat, profile?.location?.lng, profile?.phoneVerified, profileId]
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
