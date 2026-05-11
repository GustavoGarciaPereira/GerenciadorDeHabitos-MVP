export default function ErrorMessage(props) {
  return (
    <div class="error-message" role="alert">
      <span class="error-icon">⚠</span>
      <p>{props.message}</p>
    </div>
  );
}
