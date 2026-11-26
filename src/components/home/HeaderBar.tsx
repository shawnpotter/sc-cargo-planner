'use client';
import Link from 'next/link';
import { Boxes } from 'lucide-react';
import { ThemeSwitchButton } from './ThemeSwitchButton';
import { InfoMenu } from './InfoMenu';
export default function HeaderBar() { return <header className='flex h-[var(--header-h)] items-center justify-between border-b bg-card/80 px-4 sm:px-6'><Link href='/cargo' className='flex items-center gap-3'><div className='rounded-lg bg-primary/10 p-2 text-primary'><Boxes className='size-5'/></div><span className='font-semibold tracking-tight'>SC Cargo Planner</span><span className='rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground'>Beta</span></Link><div className='flex items-center gap-2'><ThemeSwitchButton /><InfoMenu /></div></header>; }
