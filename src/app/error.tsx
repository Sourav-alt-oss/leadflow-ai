'use client';
export default function ErrorPage({ reset }: {
    error: Error;
    reset: () => void;
}) { return <main className="section stack"><h1>Something went wrong</h1><p className="muted">Try loading the page again.</p><button className="btn primary" onClick={reset}>Try again</button></main>; }
