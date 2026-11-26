import { useState } from 'react';
import { Contract } from '@/constants/types';
import { useCargo } from '@/providers/CargoProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HaulingMode } from '@/utils/calculateContainers';
export function CrewPaymentDistribution({ contracts, haulingMode }: Readonly<{
    contracts: Contract[];
    haulingMode: HaulingMode;
}>) {
    const { crewMembers, setCrewMembers, manualPayout, setManualPayout } = useCargo();
    const [name, setName] = useState('');
    const [share, setShare] = useState(0);
    const totalPayout = haulingMode === HaulingMode.CONTRACT ? contracts.reduce((sum, item) => sum + (item.payout ?? 0), 0) : manualPayout;
    const totalShares = crewMembers.reduce((sum, item) => sum + item.share, 0);
    const amount = (weight: number) => totalShares > 0 ? totalPayout * weight / totalShares : 0;
    const nonnegative = (value: string) => { const number = Number(value); return Number.isFinite(number) ? Math.max(0, number) : 0; };
    return <section className='space-y-6'>
		<div><h2 className='text-xl font-semibold'>Crew payments</h2><p className='mt-1 text-sm text-muted-foreground'>Distribute the payout proportionally by share. Crew settings are saved with this run.</p></div>
		<div className='rounded-xl border bg-muted/30 p-4'>{haulingMode === HaulingMode.CONTRACT ? <><p className='text-sm text-muted-foreground'>Total contract payout</p><p className='mt-1 text-2xl font-semibold'>{totalPayout.toLocaleString()} aUEC</p></> : <label className='grid gap-2 text-sm font-medium'>Commodity payout (aUEC)<Input type='number' min={0} value={manualPayout || ''} onChange={(event) => setManualPayout(nonnegative(event.target.value))} placeholder='Total payout'/></label>}</div>
		<div className='space-y-3'>{crewMembers.map((member) => <div key={member.id} className='grid items-end gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_100px_minmax(100px,1fr)_auto]'><label className='grid gap-2 text-xs text-muted-foreground'>Crew member<Input aria-label={`Name for ${member.name}`} value={member.name} onChange={(event) => setCrewMembers(crewMembers.map((item) => item.id === member.id ? { ...item, name: event.target.value } : item))}/></label><label className='grid gap-2 text-xs text-muted-foreground'>Share weight<Input aria-label={`Share for ${member.name}`} type='number' min={0} value={member.share} onChange={(event) => setCrewMembers(crewMembers.map((item) => item.id === member.id ? { ...item, share: nonnegative(event.target.value) } : item))}/></label><p className='pb-2 text-sm font-medium'>{amount(member.share).toLocaleString(undefined, { maximumFractionDigits: 2 })} aUEC</p><Button variant='outline' onClick={() => setCrewMembers(crewMembers.filter((item) => item.id !== member.id))} aria-label={`Remove ${member.name}`}>Remove</Button></div>)}</div>
		{totalShares === 0 && <p role='status' className='text-sm text-muted-foreground'>Add a positive share to calculate payments.</p>}
		<form className='grid items-end gap-3 rounded-xl bg-muted/30 p-4 sm:grid-cols-[minmax(0,1fr)_120px_auto]' onSubmit={(event) => { event.preventDefault(); if (!name.trim() || share <= 0)
        return; setCrewMembers([...crewMembers, { id: crypto.randomUUID(), name: name.trim(), share }]); setName(''); setShare(0); }}><label className='grid gap-2 text-sm'>Crew member name<Input value={name} onChange={(event) => setName(event.target.value)} placeholder='Crew member name' required/></label><label className='grid gap-2 text-sm'>Share weight<Input type='number' min={0.01} step='any' value={share || ''} onChange={(event) => setShare(nonnegative(event.target.value))} required/></label><Button type='submit'>Add crew member</Button></form>
	</section>;
}
