import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

/**
 * A button component that toggles between light and dark themes.
 *
 * Uses the `useTheme` hook to access and update the current theme.
 * Displays a sun icon when in dark mode and a moon icon when in light mode.
 *
 * @returns {JSX.Element} The theme switch button element.
 */
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
