import { Marketing } from '@/components/marketing';
import { notFound } from 'next/navigation';
export default async function Page({ params }: {
    params: Promise<{
        page: string;
    }>;
}) { const { page } = await params; if (!['features', 'pricing', 'about', 'contact'].includes(page))
    notFound(); return <Marketing page={page}/>; }
