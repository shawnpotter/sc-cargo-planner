import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mocks for NextResponse, next-auth, and prisma before importing the route modules.
const mockGetServerSession = vi.fn()
const mockPrisma = {
	user: {
		findUnique: vi.fn(),
		update: vi.fn(),
	},
}

vi.mock('next/server', () => ({
	NextResponse: {
		json: (body: any, init?: any) => ({ body, status: init?.status ?? 200 }),
	},
}))

vi.mock('next-auth', () => ({
	getServerSession: mockGetServerSession,
}))

// Route files import prisma from '@/lib/prisma' (tsconfig path). Mock that path.
vi.mock('@/lib/prisma', () => ({ default: mockPrisma }))

describe('API route handlers', () => {
	beforeEach(() => {
		// Reset module cache so each test gets a fresh module-level state when needed.
		vi.resetModules()
		mockGetServerSession.mockReset()
		mockPrisma.user.findUnique.mockReset()
		mockPrisma.user.update.mockReset()
	})

	describe('contracts route (GET/POST/DELETE)', () => {
		it('GET returns empty list initially and POST/DELETE behave correctly', async () => {
			const { GET, POST, DELETE } = await import('../app/api/contracts/route')

			// Initially empty
			const res1 = await GET()
			expect(res1.status).toBe(200)
			// route handlers return a shape { body, status }
			expect(res1.body).toEqual({ contracts: [] })

			// POST invalid payload
			const badReq = { json: async () => ({ notContracts: true }) }
			const badRes = await POST(badReq as any)
			expect(badRes.status).toBe(400)
			expect(badRes.body).toHaveProperty('error')

			// POST valid payload - should add ids when missing
			const payload = {
				contracts: [{ title: 'Load A' }, { id: 'my-id', title: 'Load B' }],
			}
			const goodReq = { json: async () => payload }
			const goodRes = await POST(goodReq as any)
			expect(goodRes.status).toBe(200)
			expect(goodRes.body).toHaveProperty('success', true)
			// body is returned from our mocked NextResponse wrapper; cast to any for test assertions
			const added = (goodRes.body as any).contracts
			expect(added).toHaveLength(2)
			expect(added[0].id).toBeDefined()
			expect(added[1].id).toBe('my-id')

			// GET now returns stored contracts
			const res2 = await GET()
			expect((res2.body as any).contracts.length).toBeGreaterThanOrEqual(2)

			// DELETE clears store
			const delRes = await DELETE()
			expect(delRes.status).toBe(200)
			expect(delRes.body).toHaveProperty('success', true)

			const res3 = await GET()
			expect(res3.body).toEqual({ contracts: [] })
		})
	})

	describe('contracts/[id] route (PUT/DELETE)', () => {
		it('PUT returns success and echoes id, DELETE returns success', async () => {
			const { PUT, DELETE } = await import('../app/api/contracts/[id]/route')

			const req = { json: async () => ({ foo: 'bar' }) }
			const putRes = await PUT(
				req as any,
				{ params: Promise.resolve({ id: 'abc-123' }) } as any
			)
			expect(putRes.status).toBe(200)
			expect(putRes.body).toEqual({ success: true, id: 'abc-123' })

			const delRes = await DELETE(
				req as any,
				{ params: Promise.resolve({ id: 'abc-123' }) } as any
			)
			expect(delRes.status).toBe(200)
			expect(delRes.body).toHaveProperty('success', true)
		})
	})

	describe('user update route (PUT)', () => {
		it('returns 401 when not authenticated', async () => {
			mockGetServerSession.mockResolvedValue(null)
			const { PUT } = await import('../app/api/user/update/route')

			const req = { json: async () => ({ name: 'new', email: 'e@x.com' }) }
			const res = await PUT(req as any)
			expect(res.status).toBe(401)
			expect(res.body).toHaveProperty('error')
		})

		it('returns 400 when missing name or email', async () => {
			mockGetServerSession.mockResolvedValue({
				user: { id: 'u1', name: 'old', email: 'old@x.com' },
			})
			const { PUT } = await import('../app/api/user/update/route')

			const req = { json: async () => ({ name: '', email: '' }) }
			const res = await PUT(req as any)
			expect(res.status).toBe(400)
			expect(res.body).toHaveProperty('error')
		})

		it('returns 409 when username or email already taken', async () => {
			mockGetServerSession.mockResolvedValue({
				user: { id: 'u1', name: 'old', email: 'old@x.com' },
			})
			// Simulate existing user with same name but different id
			mockPrisma.user.findUnique.mockResolvedValueOnce({
				id: 'u2',
				name: 'new',
			})
			const { PUT } = await import('../app/api/user/update/route')

			const req = { json: async () => ({ name: 'new', email: 'old@x.com' }) }
			const res = await PUT(req as any)
			expect(res.status).toBe(409)
			expect(res.body).toHaveProperty('error')
		})

		it('updates user when valid and returns updated user', async () => {
			mockGetServerSession.mockResolvedValue({
				user: { id: 'u1', name: 'old', email: 'old@x.com' },
			})
			// No conflicts
			mockPrisma.user.findUnique.mockResolvedValue(null)
			mockPrisma.user.update.mockResolvedValue({
				id: 'u1',
				name: 'new',
				email: 'new@x.com',
				createdAt: 't',
				updatedAt: 't',
			})

			const { PUT } = await import('../app/api/user/update/route')
			const req = { json: async () => ({ name: 'new', email: 'new@x.com' }) }
			const res = await PUT(req as any)
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('id', 'u1')
			expect(res.body).toHaveProperty('name', 'new')
			expect(res.body).toHaveProperty('email', 'new@x.com')
		})
	})
})
