import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import { ThemeSwitchButton } from '@/components/home/ThemeSwitchButton'

const theme = vi.hoisted(() => ({ value: 'light', set: vi.fn() }))
vi.mock('next-themes', () => ({ useTheme: () => ({ theme: theme.value, resolvedTheme: theme.value, setTheme: theme.set }) }))

it('hydrates without mismatched icon attributes when client theme differs from the server', async () => {
	vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
	const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
	const container = document.createElement('div')
	theme.value = 'light'
	container.innerHTML = renderToString(<ThemeSwitchButton />)
	document.body.appendChild(container)
	theme.value = 'dark'
	let root: ReturnType<typeof hydrateRoot> | undefined
	try {
		await act(async () => { root = hydrateRoot(container, <ThemeSwitchButton />) })
		expect(errors).not.toHaveBeenCalled()
		expect(container.querySelector('button')?.disabled).toBe(false)
		expect(container.querySelector('svg')?.classList.contains('text-yellow-400')).toBe(true)
	} finally {
		await act(async () => root?.unmount())
		container.remove()
		errors.mockRestore()
		vi.unstubAllGlobals()
	}
})
