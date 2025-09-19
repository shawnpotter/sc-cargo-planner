import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

export function ThemeSwitchButton() {
	const { theme, setTheme, resolvedTheme } = useTheme()
	const isDark = (resolvedTheme ?? theme) === 'dark'

	return (
		<Button
			variant='ghost'
			size='icon'
			aria-label='Toggle theme'
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			className='transition-colors duration-200'
		>
			{isDark ? (
				<SunIcon className='w-5 h-5 text-yellow-400' />
			) : (
				<MoonIcon className='w-5 h-5 text-blue-500' />
			)}
		</Button>
	)
}
