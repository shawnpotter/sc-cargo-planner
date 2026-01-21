// vitest.setup.ts
import '@testing-library/jest-dom/vitest'
import { beforeAll, vi } from 'vitest'

// Mock canvas for OCR tests
beforeAll(() => {
	// Create canvas mock for Node environment
	if (typeof window !== 'undefined') {
		// Mock HTMLCanvasElement if needed
		HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => ({
			drawImage: vi.fn(),
			getImageData: vi.fn(() => ({
				data: new Uint8ClampedArray(4),
				width: 100,
				height: 100,
			})),
			putImageData: vi.fn(),
			createImageData: vi.fn(() => ({
				data: new Uint8ClampedArray(4),
				width: 100,
				height: 100,
			})),
		}))
	}
})
