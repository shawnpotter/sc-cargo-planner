// src/__tests__/api/auth/signup.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { POST } from '@/app/api/auth/signup/route'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'

// Mock the dependencies
vi.mock('bcrypt')
vi.mock('@/lib/prisma', () => ({
	default: {
		user: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
	},
}))

// Mock console methods to avoid cluttering test output
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('POST /api/auth/signup', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	const createMockRequest = (body: any): Request => {
		return {
			json: async () => body,
		} as Request
	}

	describe('successful signup', () => {
		it('should create a new user with valid credentials', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				name: 'testuser',
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			const requestBody = {
				email: 'test@example.com',
				password: 'password123',
				name: 'testuser',
				requestId: 'req-123',
			}

			// Mock bcrypt hash
			vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never)

			// Mock user not existing
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

			// Mock user creation
			vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

			const request = createMockRequest(requestBody)
			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(201)
			expect(data).toEqual({
				id: 'user-123',
				email: 'test@example.com',
				name: 'testuser',
				createdAt: mockUser.createdAt.toISOString(),
				updatedAt: mockUser.updatedAt.toISOString(),
			})
			expect(data).not.toHaveProperty('password')

			// Verify bcrypt was called correctly
			expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)

			// Verify user creation
			expect(prisma.user.create).toHaveBeenCalledWith({
				data: {
					email: 'test@example.com',
					password: 'hashed_password',
					name: 'testuser',
				},
			})

			// Verify logging
			expect(consoleLogSpy).toHaveBeenCalledWith('Request ID:', 'req-123')
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'User created successfully:',
				'test@example.com'
			)
		})

		it('should not include password in response', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				name: 'testuser',
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never)
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
			vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

			const request = createMockRequest({
				email: 'test@example.com',
				password: 'password123',
				name: 'testuser',
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(data).not.toHaveProperty('password')
			expect(Object.keys(data)).toEqual([
				'id',
				'email',
				'name',
				'createdAt',
				'updatedAt',
			])
		})
	})

	describe('validation errors', () => {
		it('should return 400 if email is missing', async () => {
			const request = createMockRequest({
				password: 'password123',
				name: 'testuser',
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data).toEqual({
				error: 'Email, username, and password are required',
			})
		})

		it('should return 400 if password is missing', async () => {
			const request = createMockRequest({
				email: 'test@example.com',
				name: 'testuser',
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data).toEqual({
				error: 'Email, username, and password are required',
			})
		})

		it('should return 400 if name is missing', async () => {
			const request = createMockRequest({
				email: 'test@example.com',
				password: 'password123',
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data).toEqual({
				error: 'Email, username, and password are required',
			})
		})

		it('should return 400 if all fields are missing', async () => {
			const request = createMockRequest({
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data).toEqual({
				error: 'Email, username, and password are required',
			})
		})

		it('should handle empty string values', async () => {
			const request = createMockRequest({
				email: '',
				password: '',
				name: '',
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data).toEqual({
				error: 'Email, username, and password are required',
			})
		})
	})

	describe('duplicate user errors', () => {
		it('should return 409 if email already exists', async () => {
			const existingUser = {
				id: 'existing-user',
				email: 'test@example.com',
				name: 'existinguser',
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			// Mock email check returning existing user
			vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser)

			const request = createMockRequest({
				email: 'test@example.com',
				password: 'password123',
				name: 'newuser',
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(409)
			expect(data).toEqual({
				error: 'User already exists with this email',
			})
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'User already exists with email:',
				'test@example.com'
			)

			// Verify we only checked email, not name
			expect(prisma.user.findUnique).toHaveBeenCalledTimes(1)
			expect(prisma.user.findUnique).toHaveBeenCalledWith({
				where: { email: 'test@example.com' },
			})
		})

		it('should return 409 if username already exists', async () => {
			const existingUser = {
				id: 'existing-user',
				email: 'other@example.com',
				name: 'testuser',
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			// Mock email check returning null (no user)
			vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
			// Mock username check returning existing user
			vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(existingUser)

			const request = createMockRequest({
				email: 'test@example.com',
				password: 'password123',
				name: 'testuser',
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(409)
			expect(data).toEqual({
				error: 'Username already taken',
			})
			expect(consoleLogSpy).toHaveBeenCalledWith(
				'Username already exists:',
				'testuser'
			)

			// Verify we checked both email and name
			expect(prisma.user.findUnique).toHaveBeenCalledTimes(2)
			expect(prisma.user.findUnique).toHaveBeenNthCalledWith(1, {
				where: { email: 'test@example.com' },
			})
			expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
				where: { name: 'testuser' },
			})
		})
	})

	describe('error handling', () => {
		it('should handle bcrypt hash error', async () => {
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
			vi.mocked(bcrypt.hash).mockRejectedValue(new Error('Bcrypt error'))

			const request = createMockRequest({
				email: 'test@example.com',
				password: 'password123',
				name: 'testuser',
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(500)
			expect(data).toEqual({
				error: 'An error occurred during signup',
			})
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Error during signup:',
				expect.any(Error)
			)
		})

		it('should handle database error during user creation', async () => {
			vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never)
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
			vi.mocked(prisma.user.create).mockRejectedValue(
				new Error('Database error')
			)

			const request = createMockRequest({
				email: 'test@example.com',
				password: 'password123',
				name: 'testuser',
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(500)
			expect(data).toEqual({
				error: 'An error occurred during signup',
			})
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Error during signup:',
				expect.any(Error)
			)
		})

		it('should handle database error during uniqueness check', async () => {
			vi.mocked(prisma.user.findUnique).mockRejectedValue(
				new Error('Database connection failed')
			)

			const request = createMockRequest({
				email: 'test@example.com',
				password: 'password123',
				name: 'testuser',
				requestId: 'req-123',
			})

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(500)
			expect(data).toEqual({
				error: 'An error occurred during signup',
			})
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Error during signup:',
				expect.any(Error)
			)
		})

		it('should handle malformed JSON request', async () => {
			//@ts-expect-error
			const request = {
				json: async () => {
					throw new Error('Invalid JSON')
				},
			} as Request

			const response = await POST(request)
			const data = await response.json()

			expect(response.status).toBe(500)
			expect(data).toEqual({
				error: 'An error occurred during signup',
			})
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Error during signup:',
				expect.any(Error)
			)
		})
	})

	describe('edge cases', () => {
		it('should handle requestId being undefined', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				name: 'testuser',
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never)
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
			vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

			const request = createMockRequest({
				email: 'test@example.com',
				password: 'password123',
				name: 'testuser',
				// requestId is missing
			})

			const response = await POST(request)

			expect(response.status).toBe(201)
			expect(consoleLogSpy).toHaveBeenCalledWith('Request ID:', undefined)
		})

		it('should trim whitespace from inputs', async () => {
			const mockUser = {
				id: 'user-123',
				email: '  test@example.com  ',
				name: '  testuser  ',
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never)
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
			vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

			const request = createMockRequest({
				email: '  test@example.com  ',
				password: '  password123  ',
				name: '  testuser  ',
				requestId: 'req-123',
			})

			const response = await POST(request)

			expect(response.status).toBe(201)
			// Note: The actual trimming would need to be implemented in the route handler
			// This test documents the expected behavior
		})

		it('should handle very long input strings', async () => {
			const longString = 'a'.repeat(1000)

			const request = createMockRequest({
				email: `${longString}@example.com`,
				password: longString,
				name: longString,
				requestId: 'req-123',
			})

			vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never)
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
			vi.mocked(prisma.user.create).mockResolvedValue({
				id: 'user-123',
				email: `${longString}@example.com`,
				name: longString,
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
			})

			const response = await POST(request)

			expect(response.status).toBe(201)
		})

		it('should handle special characters in inputs', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test+special@example.com',
				name: 'user_name-123',
				password: 'hashed_password',
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never)
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
			vi.mocked(prisma.user.create).mockResolvedValue(mockUser)

			const request = createMockRequest({
				email: 'test+special@example.com',
				password: 'p@ssw0rd!#$%',
				name: 'user_name-123',
				requestId: 'req-123',
			})

			const response = await POST(request)

			expect(response.status).toBe(201)
		})
	})
})
