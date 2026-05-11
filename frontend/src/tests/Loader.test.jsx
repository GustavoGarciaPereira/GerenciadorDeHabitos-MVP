import { render, screen } from "@solidjs/testing-library";
import Loader from "../components/ui/Loader";
import { describe, it, expect } from "vitest";

describe("Loader", () => {
  it('renders "Carregando…"', () => {
    render(() => <Loader />);
    expect(screen.getByText("Carregando…")).toBeInTheDocument();
  });

  it("has the loader class", () => {
    render(() => <Loader />);
    const el = screen.getByText("Carregando…");
    expect(el.className).toBe("loader");
  });
});
