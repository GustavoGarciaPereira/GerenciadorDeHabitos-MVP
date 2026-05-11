import { render, screen, fireEvent } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import Modal from "../components/ui/Modal";

describe("Modal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it("renders children when open", () => {
    render(() => (
      <Modal onClose={onClose}>
        <p>Modal body</p>
      </Modal>
    ));
    expect(screen.getByText("Modal body")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    render(() => (
      <Modal onClose={onClose}>
        <p>Content</p>
      </Modal>
    ));
    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape key", () => {
    render(() => (
      <Modal onClose={onClose}>
        <p>Content</p>
      </Modal>
    ));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay clicked", () => {
    render(() => (
      <Modal onClose={onClose}>
        <p>Content</p>
      </Modal>
    ));
    // Click the overlay (the modal-overlay div)
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when modal content clicked", () => {
    render(() => (
      <Modal onClose={onClose}>
        <button>Inner button</button>
      </Modal>
    ));
    fireEvent.click(screen.getByText("Inner button"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
