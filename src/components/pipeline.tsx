'use client';
import { useState } from 'react';
import { DndContext, useDraggable, useDroppable, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { motion } from 'motion/react';
import { useDemo } from '@/demo/store';
import { stages, money, type RecordItem } from '@/demo/model';
import { Editor, newRecord } from './records';
import { GripVertical } from 'lucide-react';
import Link from 'next/link';
function Deal({ item, open }: {
    item: RecordItem;
    open: () => void;
}) { const { allowed, save, data } = useDemo(); const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id, disabled: !allowed }); return <motion.div layout className="deal" ref={setNodeRef} style={{ transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined, zIndex: isDragging ? 9 : undefined, position: 'relative', opacity: isDragging ? .8 : 1 }}><div className="row between"><button className="font-semibold text-left" onClick={open}>{item.name}</button>{allowed && <button className="btn" style={{ touchAction: 'none' }} aria-label={`Drag ${item.name}`} {...attributes} {...listeners}><GripVertical size={16}/></button>}</div><small>{data?.companies.find(c => c.id === item.companyId)?.name || 'Unassigned company'}</small><strong>{money(item.value)}</strong><small>{item.priority} · {item.probability}% · {item.date}</small><select aria-label={`Stage for ${item.name}`} disabled={!allowed} value={item.status} onChange={e => save('deals', { ...item, status: e.target.value })}>{stages.map(s => <option key={s}>{s}</option>)}</select></motion.div>; }
function Lane({ stage, items, open }: {
    stage: string;
    items: RecordItem[];
    open: (r: RecordItem) => void;
}) { const { setNodeRef, isOver } = useDroppable({ id: stage }); return <section ref={setNodeRef} className={`lane ${isOver ? 'over' : ''}`}><div className="row between"><h3>{stage}</h3><span className="pill">{items.length}</span></div><small>{money(items.reduce((n, r) => n + r.value, 0))}</small>{items.map(r => <Deal key={r.id} item={r} open={() => open(r)}/>)}</section>; }
export function Pipeline() { const { data, allowed, save } = useDemo(); const [q, setQ] = useState(''); const [owner, setOwner] = useState(''); const [item, setItem] = useState<RecordItem | null>(null); const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor)); if (!data)
    return null; const end = ({ active, over }: DragEndEvent) => { const r = data.deals.find(d => d.id === active.id); if (r && over && allowed && stages.some(s => s === over.id) && r.status !== over.id)
    save('deals', { ...r, status: String(over.id) }); }; return <><div className="row between"><div><h1>Sales pipeline</h1><p className="muted">Drag a deal or use its stage selector. Changes update analytics.</p></div><div className="row"><Link className="btn" href="/demo/deals">List view</Link>{allowed && <button className="btn primary" onClick={() => setItem(newRecord('deals'))}>Add deal</button>}</div></div><div className="row"><input aria-label="Search deals" placeholder="Search deals" value={q} onChange={e => setQ(e.target.value)}/><select aria-label="Filter owner" value={owner} onChange={e => setOwner(e.target.value)}><option value="">All owners</option>{data.team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div><DndContext sensors={sensors} onDragEnd={end}><div className="kanban">{stages.map(s => <Lane key={s} stage={s} items={data.deals.filter(d => d.status === s && d.name.toLowerCase().includes(q.toLowerCase()) && (!owner || d.ownerId === owner))} open={setItem}/>)}</div></DndContext>{item && <Editor collection="deals" item={item} onClose={() => setItem(null)}/>}</>; }
