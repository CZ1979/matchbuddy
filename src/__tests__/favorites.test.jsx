import { describe, expect, it, beforeEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import { ProfileProvider } from "../hooks/useProfile";

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => null })),
  getDocs: vi.fn(async () => ({ docs: [] })),
  serverTimestamp: vi.fn(() => new Date()),
  setDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve({ id: "test-doc-id" })),
  deleteDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => () => {}),
}));

vi.mock("../firebase", () => ({ db: {} }));

describe("Favorites page", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const renderApp = (initialPath = "/favoriten") => {
    localStorage.setItem(
      "trainerProfile",
      JSON.stringify({
        id: "test-profile",
        fullName: "Test Trainer",
        club: "FC Test",
        city: "Berlin",
        phone: "+4912345",
      })
    );
    localStorage.setItem("trainerProfileId", "test-profile");
    localStorage.setItem("profileCompleted", "true");

    return render(
      <ProfileProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <App />
        </MemoryRouter>
      </ProfileProvider>
    );
  };

  it("renders favorites page with title", async () => {
    renderApp("/favoriten");

    await waitFor(async () => {
      expect(await screen.findByText("Meine Favoriten")).toBeInTheDocument();
    });
  });

  it("shows empty state when no favorites exist", async () => {
    renderApp("/favoriten");

    await waitFor(async () => {
      expect(await screen.findByText(/Noch keine Favoriten gespeichert/i)).toBeInTheDocument();
    });
  });
});
