export function ErrorBanner({ children, onRetry }) {
  if (!children) return null;
  return <div className="feedback error-feedback" role="alert"><span className="feedback-symbol">!</span><span>{children}</span>{onRetry && <button className="text-button" onClick={onRetry}>Try again</button>}</div>;
}

export function EmptyState({ title, action }) {
  return <div className="empty-state"><h3>{title}</h3>{action}</div>;
}

export function LoadingState() {
  return <div className="loading-state"><span className="spinner" />Loading</div>;
}
