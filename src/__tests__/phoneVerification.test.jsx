import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PhoneVerification from "../components/PhoneVerification";

// Mock Firebase Auth
vi.mock("../firebase", () => ({
  auth: {},
}));

vi.mock("firebase/auth", () => ({
  RecaptchaVerifier: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
}));

describe("PhoneVerification", () => {
  it("renders the phone verification component", () => {
    const phoneNumber = { countryCode: "+49", number: "1234567890" };
    render(<PhoneVerification phoneNumber={phoneNumber} />);
    
    expect(screen.getByText("Telefonnummer verifizieren")).toBeInTheDocument();
    expect(screen.getByText(/Um dein Profil zu vervollständigen/)).toBeInTheDocument();
  });

  it("displays the phone number", () => {
    const phoneNumber = { countryCode: "+49", number: "1234567890" };
    render(<PhoneVerification phoneNumber={phoneNumber} />);
    
    expect(screen.getByText(/\+49 1234567890/)).toBeInTheDocument();
  });

  it("shows send code button", () => {
    const phoneNumber = { countryCode: "+49", number: "1234567890" };
    render(<PhoneVerification phoneNumber={phoneNumber} />);
    
    expect(screen.getByText("Code per SMS senden")).toBeInTheDocument();
  });
});
