import { children } from "solid-js";

export default function Modal(props) {
  const body = children(() => props.children);

  function handleOverlayClick(e) {
    // Close only when clicking the backdrop, not the modal itself
    if (e.target === e.currentTarget && props.onClose) {
      props.onClose();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Escape" && props.onClose) {
      props.onClose();
    }
  }

  return (
    <div
      class="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div class="modal-content">
        <button
          class="modal-close"
          onClick={props.onClose}
          aria-label="Fechar"
          type="button"
        >
          ×
        </button>
        {body()}
      </div>
    </div>
  );
}
