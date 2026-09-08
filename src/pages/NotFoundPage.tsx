interface NotFoundPageProps {
  onGoHome: () => void;
}

export function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <section className="page not-found-page">
      <div className="panel not-found-panel">
        <p className="eyebrow">ERROR 404 · PAGE NOT FOUND</p>
        <h2>The requested view does not exist.</h2>
        <p>The link or path you followed is invalid or has been moved.</p>
        <button type="button" className="primary-button" onClick={onGoHome}>
          Return to Today Agenda
        </button>
      </div>
    </section>
  );
}
