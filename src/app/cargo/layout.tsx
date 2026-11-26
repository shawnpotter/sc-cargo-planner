export default function CargoLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) { return <main className='min-h-[calc(100dvh-var(--header-h))] p-3 pb-10 sm:p-6'>{children}</main>; }
