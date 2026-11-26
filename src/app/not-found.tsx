import Link from 'next/link';
export default function NotFound() { return <main className="section stack"><h1>Page not found</h1><p className="muted">This demo route does not exist.</p><Link href="/demo/dashboard" className="btn primary self-start">Open dashboard</Link></main>; }
