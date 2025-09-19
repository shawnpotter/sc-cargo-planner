'use client'
// app/page.tsx
import { WelcomeScreen } from '@/components/home/WelcomeScreen'
import { useRouter } from 'next/navigation'

export default function Home() {
	const router = useRouter()

	const handleContinue = () => {
		router.push('/cargo')
	}

	return (
		<main>
			<WelcomeScreen onContinue={handleContinue} />
		</main>
	)
}
