import './globals.css';
import { Providers } from '@/providers/Providers';
import HeaderBar from '@/components/home/HeaderBar';
export const metadata = { title: 'SC Cargo Planner', description: 'Plan cargo, organize contracts, and follow your Star Citizen hauling run.' };
export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) { return <html lang='en' suppressHydrationWarning><body className='antialiased bg-background'><Providers><HeaderBar />{children}</Providers></body></html>; }
