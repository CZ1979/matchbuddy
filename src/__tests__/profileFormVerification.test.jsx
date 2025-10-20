import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ProfileForm from "../components/forms/ProfileForm";

vi.mock("../../utils/ageGroups", () => ({
  generateAgeGroups: () => [
    { value: "U9", label: "U9" },
    { value: "U11", label: "U11" },
  ],
}));

describe("ProfileForm - Phone Verification Reset", () => {
  it("displays verification status when showVerificationStatus is true", () => {
    const values = {
      name: "Test User",
      club: "Test Club",
      city: "Test City",
      email: "test@example.com",
      phone: { countryCode: "+49", number: "1234567890" },
      phoneVerified: true,
      ageGroups: ["U9"],
    };

    render(
      <BrowserRouter>
        <ProfileForm values={values} onChange={vi.fn()} onSubmit={vi.fn()} showVerificationStatus={true} />
      </BrowserRouter>
    );

    expect(screen.getByText("Verifiziert")).toBeInTheDocument();
  });

  it("displays unverified status when phoneVerified is false", () => {
    const values = {
      name: "Test User",
      club: "Test Club",
      city: "Test City",
      email: "test@example.com",
      phone: { countryCode: "+49", number: "1234567890" },
      phoneVerified: false,
      ageGroups: ["U9"],
    };

    render(
      <BrowserRouter>
        <ProfileForm values={values} onChange={vi.fn()} onSubmit={vi.fn()} showVerificationStatus={true} />
      </BrowserRouter>
    );

    expect(screen.getByText("Nicht verifiziert")).toBeInTheDocument();
  });

  it("does not display verification status when showVerificationStatus is false", () => {
    const values = {
      name: "Test User",
      club: "Test Club",
      city: "Test City",
      email: "test@example.com",
      phone: { countryCode: "+49", number: "1234567890" },
      phoneVerified: true,
      ageGroups: ["U9"],
    };

    render(
      <BrowserRouter>
        <ProfileForm values={values} onChange={vi.fn()} onSubmit={vi.fn()} showVerificationStatus={false} />
      </BrowserRouter>
    );

    expect(screen.queryByText("Verifiziert")).not.toBeInTheDocument();
    expect(screen.queryByText("Nicht verifiziert")).not.toBeInTheDocument();
  });
});
