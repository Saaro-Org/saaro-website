export default function Wordmark({ className = '' }) {
  return (
    <span className={`fx-wordmark ${className}`} aria-hidden="true">
      fluxgo<span className="fx-wordmark-dot">.</span>
    </span>
  );
}
