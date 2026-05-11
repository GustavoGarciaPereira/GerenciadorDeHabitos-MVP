import { render, screen } from "@solidjs/testing-library";
import ErrorMessage from "../components/ui/ErrorMessage";
import { describe, it, expect } from "vitest";

describe("ErrorMessage", () => {
  it("renders the message", () => {
    render(() => <ErrorMessage message="Algo deu errado" />);
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
  });

  it("renders the warning icon", () => {
    render(() => <ErrorMessage message="Erro" />);
    expect(screen.getByText("⚠")).toBeInTheDocument();
  });

  it("has role alert", () => {
    render(() => <ErrorMessage message="Teste" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
