import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import VerificationBanner from "../components/VerificationBanner";

describe("VerificationBanner", () => {
  it("does not render when phone is verified", () => {
    const { container } = render(
      <BrowserRouter>
        <VerificationBanner phoneVerified={true} />
      </BrowserRouter>
    );
    
    expect(container.firstChild).toBeNull();
  });

  it("renders when phone is not verified", () => {
    render(
      <BrowserRouter>
        <VerificationBanner phoneVerified={false} />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Deine Telefonnummer ist noch nicht verifiziert/)).toBeInTheDocument();
    expect(screen.getByText("Jetzt verifizieren")).toBeInTheDocument();
  });

  it("can be dismissed", () => {
    render(
      <BrowserRouter>
        <VerificationBanner phoneVerified={false} />
      </BrowserRouter>
    );
    
    const closeButton = screen.getByLabelText("Banner schließen");
    fireEvent.click(closeButton);
    
    expect(screen.queryByText(/Deine Telefonnummer ist noch nicht verifiziert/)).not.toBeInTheDocument();
  });

  it("has link to verification page", () => {
    render(
      <BrowserRouter>
        <VerificationBanner phoneVerified={false} />
      </BrowserRouter>
    );
    
    const link = screen.getByText("Jetzt verifizieren");
    expect(link).toHaveAttribute("href", "/onboarding?edit=1&verify=1");
  });
});
