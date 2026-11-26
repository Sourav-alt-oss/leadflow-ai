import { notFound } from 'next/navigation';
import { Login, Workspace } from '@/components/workspace';
const sections = ['login', 'dashboard', 'leads', 'contacts', 'companies', 'deals', 'pipeline', 'tasks', 'calendar', 'activities', 'analytics', 'ai-assistant', 'notifications', 'team', 'automations', 'settings'];
export default async function DemoPage({ params }: {
    params: Promise<{
        section: string;
    }>;
}) { const { section } = await params; if (!sections.includes(section))
    notFound(); return section === 'login' ? <Login /> : <Workspace key={section} section={section}/>; }
