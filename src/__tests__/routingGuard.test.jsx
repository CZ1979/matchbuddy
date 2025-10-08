import { describe, expect, it, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { ProfileProvider } from "../hooks/useProfile";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  getDocs: vi.fn(async () => ({ docs: [] })),
  serverTimestamp: vi.fn(() => new Date()),
  setDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => () => {}),
}));

vi.mock("../firebase", () => ({ db: {} }));

describe("Routing guard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderApp = (initialPath = "/feed") =>
    render(
      <ProfileProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <App />
        </MemoryRouter>
      </ProfileProvider>
    );

  it("redirects to onboarding when no profile is stored", async () => {
    renderApp("/feed");
    expect(await screen.findByText("Erstell dein Trainerprofil")).toBeInTheDocument();
  });

  it("shows feed when profileCompleted flag is set", async () => {
    localStorage.setItem(
      "trainerProfile",
      JSON.stringify({
        id: "test-profile",
        fullName: "Test Trainer",
        club: "FC Test",
        ageGroup: "U12",
        city: "Berlin",
        phone: "+4912345",
        rememberData: true,
      })
    );
    localStorage.setItem("trainerProfileId", "test-profile");
    localStorage.setItem("profileCompleted", "true");

    renderApp("/feed");

    await waitFor(async () => {
      expect(await screen.findByText("Spiele in deiner Nähe")).toBeInTheDocument();
    });
  });
});
