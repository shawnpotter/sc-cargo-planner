import { Suspense } from 'react';
import { RunWorkspace } from '@/components/cargo/RunWorkspace';
export default function CargoPage() { return <Suspense fallback={<p className='p-10 text-center'>Loading your run…</p>}><RunWorkspace /></Suspense>; }
