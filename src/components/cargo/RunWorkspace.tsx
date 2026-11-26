'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Boxes, ClipboardList, CreditCard, Rocket, RotateCcw, CheckCircle2, AlertCircle, Map as MapIcon } from 'lucide-react';
import { useCargo } from '@/providers/CargoProvider';
import { useContracts } from '@/providers/ContractProvider';
import { useMapData } from '@/providers/MapDataProvider';
import { useVisibleContainers } from '@/hooks/useVisibleContainers';
import { Contract, Container, RouteAlgorithm } from '@/constants/types';
import { buildCargoPlan } from '@/utils/handleLoadCargo';
import { HaulingMode } from '@/utils/calculateContainers';
import { CargoHold } from '@/components/canvas/CargoHold';
import { ContainerInfo } from '@/components/canvas/ContainerInfo';
import { RouteChecklist } from './RouteChecklist';
import { RouteMap } from './RouteMap';
import { ContractForm } from './ContractForm';
import ShipSelector from './ShipSelector';
import { CrewPaymentDistribution } from './CrewPaymentDistribution';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
const views = [
    { id: 'cargo', label: 'Cargo', icon: Boxes },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'contracts', label: 'Contracts', icon: ClipboardList },
    { id: 'ships', label: 'Ship', icon: Rocket },
    { id: 'payments', label: 'Crew payments', icon: CreditCard },
] as const;
export function RunWorkspace() {
    const router = useRouter();
    const params = useSearchParams();
    const cargo = useCargo();
    const { contracts } = useContracts();
    const map = useMapData();
    const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
    const [selection, setSelection] = useState<Container | null>(null);
    const [interactive, setInteractive] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const view = views.find((item) => item.id === params.get('view'))?.id ?? (cargo.selectedShip ? 'cargo' : 'ships');
    const navigate = (next: string) => router.replace(`/cargo?view=${next}`, { scroll: false });
    const visible = useVisibleContainers(cargo.planStatus === 'outdated' ? [] : cargo.containers, cargo.stopStatuses, cargo.optimizedRoute?.stops ?? []);
    const selected = selection && visible.find((item) => item === selection || (item.id && item.id === selection.id)) || null;
    const completed = Object.values(cargo.stopStatuses).filter((status) => status === 'completed').length;
    const generatePlan = (newContracts: Contract[], startLocation?: string, endLocation?: string) => {
        if (!cargo.selectedShip)
            throw new Error('Select a ship before generating your plan.');
        if (map.loading)
            throw new Error('Locations are still loading. Try again when they are ready.');
        if (!map.locations.length)
            throw new Error('Locations are unavailable. Retry the location connection.');
        const result = buildCargoPlan({ contracts: newContracts, selectedShip: cargo.selectedShip, routeAlgorithm: RouteAlgorithm.A_STAR, haulingMode: cargo.haulingMode, startLocation, endLocation, locations: map.locations });
        if (!result.success)
            throw new Error(result.error);
        cargo.commitPlan(result.containers, result.optimizedRoute);
        setSelection(null);
        navigate('cargo');
    };
    if (cargo.saveStatus === 'loading')
        return <p className='p-10 text-center text-muted-foreground' role='status'>Restoring your run…</p>;
    return <div className='mx-auto w-full max-w-[1600px] space-y-5'>
		<section className='rounded-2xl border bg-card p-5 sm:p-6'>
			<div className='flex flex-wrap items-start justify-between gap-4'>
				<div><p className='mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary'>Hauling operations</p><h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>Your active run</h1><p className='mt-2 text-sm text-muted-foreground'>{cargo.selectedShip ? `${cargo.selectedShip.name} · ${cargo.selectedShip.totalCapacity} SCU` : 'Select a ship to start planning'}<span className='mx-2'>/</span>{contracts.length} contracts{cargo.optimizedRoute && <><span className='mx-2'>/</span>{completed} of {cargo.optimizedRoute.stops.length} stops complete</>}</p></div>
				<div className='flex flex-wrap items-center gap-3'><span className='flex items-center gap-1.5 text-xs text-muted-foreground' role='status'>{cargo.saveStatus === 'saved' ? <><CheckCircle2 className='size-4 text-primary'/> Saved in this browser</> : <><AlertCircle className='size-4 text-destructive'/> Not saved</>}</span><Button variant='outline' onClick={() => setConfirmReset(true)}><RotateCcw className='size-4'/> New run</Button></div>
			</div>
			<div className='mt-5 flex flex-wrap items-center gap-2 border-t pt-4'><span className='mr-2 text-xs font-medium text-muted-foreground'>Hauling mode</span><Button size='sm' variant={cargo.haulingMode === HaulingMode.CONTRACT ? 'default' : 'outline'} onClick={() => cargo.setHaulingMode(HaulingMode.CONTRACT)}>Contracts</Button><Button size='sm' variant={cargo.haulingMode === HaulingMode.COMMODITY ? 'default' : 'outline'} onClick={() => cargo.setHaulingMode(HaulingMode.COMMODITY)}>Commodities</Button></div>
		</section>
		{cargo.storageError && <div role='alert' className='rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm'><p className='font-medium'>Browser recovery needs attention</p><p className='mt-1'>{cargo.storageError}</p><p className='mt-1'>You can keep working. Use New run to explicitly discard unreadable saved data.</p></div>}
		{cargo.planStatus === 'outdated' && <div role='alert' className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm'><div><p className='font-semibold'>Your plan needs an update</p><p>Ship, cargo, or journey details changed. Generate a new plan before continuing the route.</p></div><Button variant='outline' onClick={() => navigate('contracts')}>Update plan</Button></div>}
		{(map.cached || map.error) && <div className='flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground'><span>{map.locations.length ? 'Some location data is cached or unavailable.' : 'Locations are unavailable.'}</span><Button size='sm' variant='ghost' disabled={map.loading} onClick={() => void map.refresh()}>Retry connection</Button></div>}
		<div className='grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]'>
			<section className='min-w-0 space-y-4'>
				<nav className='flex gap-1 overflow-x-auto rounded-xl border bg-card p-1.5' aria-label='Run workspace'>{views.map(({ id, label, icon: Icon }) => <Button key={id} variant={view === id ? 'default' : 'ghost'} onClick={() => navigate(id)} aria-current={view === id ? 'page' : undefined} className='min-h-11 flex-1 gap-2 whitespace-nowrap'><Icon className='size-4'/>{label}</Button>)}</nav>
				{view === 'ships' && <div className='rounded-2xl border bg-card p-5 sm:p-6'><h2 className='text-lg font-semibold'>Choose your ship</h2><p className='mb-5 mt-1 text-sm text-muted-foreground'>Changing ships keeps your contracts and requires a fresh cargo plan.</p><ShipSelector onSelect={(ship) => { cargo.setSelectedShip(ship); setSelection(null); navigate('contracts'); }}/></div>}
				{view === 'contracts' && <div className='rounded-2xl border bg-card p-4 sm:p-6'><h2 className='mb-2 text-lg font-semibold'>Contracts &amp; journey</h2><p className='mb-5 text-sm text-muted-foreground'>Enter your cargo or scan a contract screenshot. Review the details, then generate your plan.</p>{!cargo.selectedShip && <Button className='mb-4' variant='outline' onClick={() => navigate('ships')}>Choose a ship</Button>}<ContractForm haulingMode={cargo.haulingMode} onSubmit={generatePlan} onReset={() => setConfirmReset(true)}/></div>}
				{view === 'map' && <RouteMap locations={map.locations} route={cargo.optimizedRoute?.route ?? []} stops={cargo.optimizedRoute?.stops ?? []} stopStatuses={cargo.stopStatuses} selectedStopId={selectedStopId} onSelectStop={setSelectedStopId} cached={map.cached} error={map.error} onRetry={() => void map.refresh()}/>}
				{view === 'payments' && <div className='rounded-2xl border bg-card p-5 sm:p-6'><CrewPaymentDistribution contracts={contracts} haulingMode={cargo.haulingMode}/></div>}
				{view === 'cargo' && (cargo.selectedShip ? <div className='space-y-4'><div className='rounded-2xl border bg-card p-3 sm:p-4'><div className='mb-3 flex items-center justify-between gap-3'><h2 className='font-semibold'>Cargo hold</h2><Button size='sm' variant='outline' onClick={() => setInteractive(!interactive)} aria-pressed={interactive}>{interactive ? 'Lock 3D view' : 'Interact with 3D view'}</Button></div><div className='h-[480px] sm:h-[550px]'><CargoHold ship={cargo.selectedShip} containers={visible} contracts={contracts} isInteractive={interactive} selectedContainer={selected} onContainerSelect={setSelection}/></div>{!cargo.optimizedRoute && <div className='mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 p-3 text-sm'><p>Add contracts to plan loading and your route.</p><Button size='sm' onClick={() => navigate('contracts')}>Add contracts</Button></div>}</div><div className='rounded-2xl border bg-card p-4'><ContainerInfo container={selected} contracts={contracts}/></div></div> : <div className='rounded-2xl border bg-card p-10 text-center'><Rocket className='mx-auto mb-4 size-10 text-primary'/><h2 className='text-xl font-semibold'>Start with your ship</h2><p className='mb-5 mt-2 text-sm text-muted-foreground'>Choose a cargo hold, add your contracts, and plan your run.</p><Button onClick={() => navigate('ships')}>Select ship</Button></div>)}
			</section>
			<aside className='min-w-0 xl:sticky xl:top-4' aria-label='Run route'>{cargo.optimizedRoute ? <div className={cargo.planStatus === 'outdated' ? 'opacity-60' : ''}><RouteChecklist stops={cargo.optimizedRoute.stops} route={cargo.optimizedRoute.route} startLocation={cargo.startLocation} endLocation={cargo.endLocation} isClosedLoop={cargo.routeType === 'loop'} stopStatuses={cargo.stopStatuses} onStopStatusChange={cargo.cycleStopStatus} selectedStopId={selectedStopId} onSelectStop={(id) => { setSelectedStopId(id); navigate('map'); }} executionDisabled={cargo.planStatus !== 'ready'} className='max-h-[75vh] min-h-[320px]'/></div> : <div className='rounded-2xl border bg-card p-6'><p className='text-xs font-semibold uppercase tracking-[0.16em] text-primary'>Route checklist</p><h2 className='mt-3 text-lg font-semibold'>A clear next stop</h2><p className='mt-2 text-sm leading-relaxed text-muted-foreground'>Your pickups and deliveries will appear here after you generate a plan.</p><ol className='mt-5 space-y-3 text-sm text-muted-foreground'><li>1. Choose your ship</li><li>2. Add or scan contracts</li><li>3. Generate a fitting plan</li></ol></div>}</aside>
		</div>
		<AlertDialog open={confirmReset} onOpenChange={setConfirmReset}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Start a new run?</AlertDialogTitle><AlertDialogDescription>This discards the saved run, contracts, route progress, and crew settings in this browser.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep current run</AlertDialogCancel><AlertDialogAction onClick={() => { cargo.resetRun(); setSelection(null); navigate('ships'); }}>Start new run</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
	</div>;
}
