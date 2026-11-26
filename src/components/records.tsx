'use client';
import { useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useDemo } from '@/demo/store';
import { blank, leadStatuses, stages, priorities, sources, roles, money, type RecordItem, type Collection } from '@/demo/model';
import { score } from '@/demo/logic';
import { Plus, Search, X } from 'lucide-react';
const titles: Record<Collection, string> = { leads: 'Leads', contacts: 'Contacts', companies: 'Companies', deals: 'Deals', tasks: 'Tasks', team: 'Team', events: 'Events', rules: 'Automations' };
const statusOptions: Partial<Record<Collection, readonly string[]>> = { leads: leadStatuses, deals: stages, tasks: ['Open', 'Completed'], team: roles };
export function newRecord(collection: Collection) { return { ...blank(), status: statusOptions[collection]?.[0] || '', source: collection === 'leads' ? sources[0] : '', priority: 'Medium' as const }; }
export function Editor({ collection, item, onClose }: {
    collection: Collection;
    item: RecordItem;
    onClose: () => void;
}) { const { data, allowed, save, convert } = useDemo(); const [row, setRow] = useState(item); const [error, setError] = useState(''); if (!data)
    return null; const change = <K extends keyof RecordItem>(k: K, v: RecordItem[K]) => setRow(r => ({ ...r, [k]: v })); const field = (k: keyof RecordItem, label: string, type = 'text') => <label>{label}<input type={type} value={String(row[k])} disabled={!allowed} required={k === 'name'} onChange={e => change(k, type === 'number' ? Number(e.target.value) : e.target.value)} {...(type === 'number' ? { min: 0 } : {})}/></label>; const select = (k: keyof RecordItem, label: string, options: readonly string[]) => <label>{label}<select disabled={!allowed} value={String(row[k])} onChange={e => change(k, e.target.value)}>{options.map(o => <option key={o}>{o}</option>)}</select></label>; const linked = (k: 'companyId' | 'ownerId' | 'relatedId', label: string, records: RecordItem[]) => <label>{label}<select disabled={!allowed} value={row[k]} onChange={e => change(k, e.target.value)}><option value="">Unassigned</option>{records.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>; const submit = (e: FormEvent) => { e.preventDefault(); try {
    save(collection, row);
    onClose();
}
catch (e) {
    setError(e instanceof Error ? e.message : 'Invalid record');
} }; return <Dialog.Root open onOpenChange={open => { if (!open)
    onClose(); }}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className="dialog"><motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><div className="row between"><Dialog.Title className="text-xl font-bold">{item.id ? 'Record details' : 'New record'}</Dialog.Title><Dialog.Close className="btn" aria-label="Close dialog"><X size={18}/></Dialog.Close></div><Dialog.Description className="muted mb-4">{titles[collection]} · fictional demo records only</Dialog.Description><form onSubmit={submit} className="stack"><div className="grid2">{field('name', 'Name')}{['leads', 'contacts', 'team'].includes(collection) && field('email', 'Email', 'email')}{['leads', 'contacts'].includes(collection) && field('phone', 'Phone')}{['leads', 'contacts', 'deals'].includes(collection) && linked('companyId', 'Company', data.companies)}{['leads', 'contacts', 'deals', 'tasks'].includes(collection) && linked('ownerId', 'Assigned agent', data.team)}{statusOptions[collection] && select('status', 'Status', statusOptions[collection]!)}{collection === 'leads' && select('source', 'Source', sources)}{['leads', 'deals', 'tasks'].includes(collection) && select('priority', 'Priority', priorities)}{['leads', 'deals'].includes(collection) && field('value', 'Value (INR)', 'number')}{['leads', 'deals', 'tasks', 'events'].includes(collection) && field('date', 'Follow-up / due / close date', 'date')}{collection === 'deals' && field('probability', 'Probability (0–100)', 'number')}{collection === 'companies' && <>{field('industry', 'Industry')}{field('website', 'Website')}{field('location', 'Location')}{field('size', 'Company size')}</>}{['leads', 'contacts'].includes(collection) && field('tags', 'Tags')}{collection === 'tasks' && linked('relatedId', 'Related lead or deal', [...data.leads, ...data.deals])}</div>{collection === 'leads' && <div className="card"><small>Simulated lead score: {score(row)}/100</small><progress className="w-full" value={score(row)} max={100}/><p className="muted">{row.priority === 'High' ? 'Prioritize a follow-up.' : 'Review and qualify the opportunity.'}</p></div>}{collection === 'companies' && item.id && <div className="card"><p>Linked contacts: {data.contacts.filter(c => c.companyId === item.id).length} · Linked deals: {data.deals.filter(d => d.companyId === item.id).length}</p></div>}<label>Notes<textarea value={row.notes} disabled={!allowed} onChange={e => change('notes', e.target.value)}/></label>{item.id && <div className="stack"><h3>Activity history</h3>{data.activities.filter(a => a.recordId === item.id).slice(0, 5).map(a => <small key={a.id}>{a.message}</small>)}</div>}{error && <p role="alert" className="text-red-400 break-words">{error}</p>}<div className="row">{allowed && <button className="btn primary" type="submit">Save record</button>}{allowed && collection === 'leads' && item.id && item.status !== 'Converted' && <button type="button" className="btn" onClick={() => { convert(item); onClose(); }}>Convert to contact & deal</button>}<Dialog.Close className="btn" type="button">Close</Dialog.Close></div></form></motion.div></Dialog.Content></Dialog.Portal></Dialog.Root>; }
function csvCell(s: string | number) { let v = String(s); if (/^[=+\-@\t\r]/.test(v))
    v = "'" + v; return '"' + v.replaceAll('"', '""') + '"'; }
export function downloadCSV(rows: RecordItem[], name: string) { const keys = ['name', 'email', 'phone', 'status', 'source', 'priority', 'value', 'date', 'tags', 'notes'] as const; const csv = [keys.join(','), ...rows.map(r => keys.map(k => csvCell(r[k])).join(','))].join('\r\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `${name}.csv`; a.click(); URL.revokeObjectURL(url); }
// Parse quoted CSV fields, including commas, escaped quotes, and newlines.
function parseCSV(text: string) { const rows: string[][] = []; let row: string[] = [], field = '', quoted = false; for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
        if (quoted && text[i + 1] === '"') {
            field += '"';
            i++;
        }
        else
            quoted = !quoted;
    }
    else if (c === ',' && !quoted) {
        row.push(field);
        field = '';
    }
    else if ((c === '\n' || c === '\r') && !quoted) {
        if (c === '\r' && text[i + 1] === '\n')
            i++;
        row.push(field);
        if (row.some(Boolean))
            rows.push(row);
        row = [];
        field = '';
    }
    else
        field += c;
} if (quoted)
    throw Error('Unclosed CSV quote'); row.push(field); if (row.some(Boolean))
    rows.push(row); return rows; }
export function Records({ collection }: {
    collection: Collection;
}) { const { data, allowed, save, remove, undo, restore } = useDemo(); const [query, setQuery] = useState(''); const [status, setStatus] = useState(''); const [source, setSource] = useState(''); const [priority, setPriority] = useState(''); const [owner, setOwner] = useState(''); const [sort, setSort] = useState('recent'); const [page, setPage] = useState(0); const [item, setItem] = useState<RecordItem | null>(null); if (!data)
    return null; const items = data[collection].filter(r => (!status || r.status === status) && (!source || r.source === source) && (!priority || r.priority === priority) && (!owner || r.ownerId === owner) && [r.name, r.email, r.tags, r.notes].join(' ').toLowerCase().includes(query.toLowerCase())); if (sort === 'name')
    items.sort((a, b) => a.name.localeCompare(b.name)); if (sort === 'value')
    items.sort((a, b) => b.value - a.value); if (sort === 'date')
    items.sort((a, b) => a.date.localeCompare(b.date)); const current = Math.min(page, Math.max(0, Math.ceil(items.length / 10) - 1)); const hasStatus = !!statusOptions[collection]; const importFile = async (file: File) => { try {
    const [header, ...rows] = parseCSV((await file.text()).replace(/^\uFEFF/, ''));
    if (!header?.includes('name') || !rows.length)
        throw Error('CSV requires a name column and at least one record');
    const prepared = rows.map((cols, i) => { const v = Object.fromEntries(header.map((h, j) => [h, cols[j] || ''])); const r = { ...newRecord('leads'), name: v.name, email: v.email || '', phone: v.phone || '', notes: v.notes || '', tags: v.tags || '', value: Number(v.value || 0) }; if (!r.name.trim() || !Number.isFinite(r.value) || r.value < 0 || (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)))
        throw Error(`Invalid name, email or value on row ${i + 2}`); return r; });
    prepared.forEach(r => save('leads', r));
    toast.success(`Imported ${prepared.length} leads`);
}
catch (e) {
    toast.error(e instanceof Error ? e.message : 'CSV failed');
} }; return <><div className="row between"><div><h1>{titles[collection]}</h1><p className="muted">{data[collection].length} fictional records · changes saved in this browser</p></div><div className="row">{collection === 'leads' && allowed && <label className="btn cursor-pointer">Import CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f)
    void importFile(f); e.target.value = ''; }}/></label>}<button className="btn" onClick={() => downloadCSV(items, collection)}>Export CSV</button>{allowed && <button className="btn primary" onClick={() => setItem(newRecord(collection))}><Plus size={17}/> Add record</button>}</div></div><div className="card stack"><div className="row"><Search size={17}/><input aria-label="Search records" placeholder={`Search ${titles[collection].toLowerCase()}`} value={query} onChange={e => { setQuery(e.target.value); setPage(0); }}/>{hasStatus && <select aria-label="Filter status" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}><option value="">All statuses</option>{statusOptions[collection]!.map(s => <option key={s}>{s}</option>)}</select>}{collection === 'leads' && <select aria-label="Filter source" value={source} onChange={e => { setSource(e.target.value); setPage(0); }}><option value="">All sources</option>{sources.map(s => <option key={s}>{s}</option>)}</select>}{['leads', 'deals', 'tasks'].includes(collection) && <select aria-label="Filter priority" value={priority} onChange={e => { setPriority(e.target.value); setPage(0); }}><option value="">All priorities</option>{priorities.map(s => <option key={s}>{s}</option>)}</select>}{['leads', 'contacts', 'deals', 'tasks'].includes(collection) && <select aria-label="Filter agent" value={owner} onChange={e => { setOwner(e.target.value); setPage(0); }}><option value="">All agents</option>{data.team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>}<select aria-label="Sort records" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Default order</option><option value="name">Name A–Z</option><option value="value">Highest value</option><option value="date">Earliest date</option></select></div>{undo?.collection === collection && allowed && <button className="btn self-start" onClick={restore}>Restore {undo.row.name}</button>}<div className="tablewrap"><table><thead><tr><th>Name</th><th>{collection === 'companies' ? 'Industry' : 'Email / company'}</th>{hasStatus && <th>Status</th>}{['leads', 'deals', 'tasks'].includes(collection) && <><th>Priority</th><th>Date</th></>}{['leads', 'deals'].includes(collection) && <th>Value</th>}{collection === 'leads' && <th>Score</th>}{collection === 'team' && <th>Assigned leads / deals</th>}<th>Actions</th></tr></thead><tbody>{items.slice(current * 10, current * 10 + 10).map(r => <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}><td><button className="font-semibold text-left" onClick={() => setItem(r)}>{r.name}</button></td><td className="muted">{collection === 'companies' ? r.industry : r.email || data.companies.find(c => c.id === r.companyId)?.name || '—'}</td>{hasStatus && <td><span className="pill">{r.status}</span></td>}{['leads', 'deals', 'tasks'].includes(collection) && <><td>{r.priority}</td><td>{r.date}</td></>}{['leads', 'deals'].includes(collection) && <td>{money(r.value)}</td>}{collection === 'leads' && <td>{score(r)}/100</td>}{collection === 'team' && <td>{data.leads.filter(l => l.ownerId === r.id).length} / {data.deals.filter(d => d.ownerId === r.id && !['Won', 'Lost'].includes(d.status)).length}</td>}<td><div className="row"><button className="btn" onClick={() => setItem(r)}>{allowed ? 'Edit' : 'View'}</button>{allowed && collection === 'tasks' && r.status !== 'Completed' && <button className="btn" onClick={() => save('tasks', { ...r, status: 'Completed' })}>Complete</button>}{allowed && <button className="btn text-red-400" onClick={() => { if (confirm(`Delete ${r.name}?`))
    remove(collection, r); }}>Delete</button>}</div></td></motion.tr>)}</tbody></table>{!items.length && <p className="p-8 text-center muted">No matching records. Try another filter.</p>}</div><div className="row between"><small>{items.length} matches · Page {current + 1} of {Math.max(1, Math.ceil(items.length / 10))}</small><div className="row"><button className="btn" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button><button className="btn" disabled={(current + 1) * 10 >= items.length} onClick={() => setPage(current + 1)}>Next</button></div></div></div>{item && <Editor collection={collection} item={item} onClose={() => setItem(null)}/>}</>; }
