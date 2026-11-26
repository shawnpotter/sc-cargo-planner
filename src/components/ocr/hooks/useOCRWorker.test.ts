import { act, renderHook, waitFor } from '@testing-library/react'
import { createWorker, type Worker } from 'tesseract.js'
import { expect, it, vi } from 'vitest'
import { useOCRWorker } from './useOCRWorker'

vi.mock('tesseract.js', () => ({ createWorker: vi.fn() }))

it('allows retry after a worker reports an initialization error without settling', async () => {
	const terminate = vi.fn().mockResolvedValue(undefined)
	const worker = { terminate } as unknown as Worker
	vi.mocked(createWorker)
		.mockImplementationOnce((_lang, _mode, options) => {
			options?.errorHandler?.('Language data unavailable')
			return new Promise(() => {})
		})
		.mockResolvedValueOnce(worker)

	const { result, unmount } = renderHook(useOCRWorker)

	expect(result.current.isReady).toBe(false)
	expect(result.current.initializationError).toContain('could not start')

	act(() => result.current.retryInitialization())

	await waitFor(() => expect(result.current.isReady).toBe(true))
	expect(result.current.initializationError).toBeNull()

	unmount()
	expect(terminate).toHaveBeenCalledOnce()
})
