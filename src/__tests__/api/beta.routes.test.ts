import { describe, expect, it } from 'vitest'
import { POST as signup } from '@/app/api/auth/signup/route'
import { PUT as update } from '@/app/api/user/update/route'
import { GET as contracts, POST as saveContracts, DELETE as clearContracts } from '@/app/api/contracts/route'
import { PUT as updateContract, DELETE as deleteContract } from '@/app/api/contracts/[id]/route'
import { GET as readAuth, POST as signIn } from '@/app/api/auth/[...nextauth]/route'

describe('public beta server boundaries', () => {
	it.each([signup, update])('disables account writes at the server', async (handler) => {
		const response = await handler()
		expect(response.status).toBe(503)
		expect(await response.json()).toEqual({ error: 'Account features are disabled in this beta build' })
	})
	it.each([readAuth, signIn])('keeps authentication endpoints disabled without a database dependency', async (handler) => {
		const response = await handler()
		expect(response.status).toBe(503)
		expect(await response.json()).toEqual({ error: 'Authentication is disabled in this beta build' })
	})
	it.each([contracts, saveContracts, clearContracts, updateContract, deleteContract])('retires the shared contract store without reporting fake success', async (handler) => {
		const response = handler()
		expect(response.status).toBe(410)
		expect(await response.json()).toEqual({ error: 'Contract API retired. Runs are saved in this browser.' })
	})
})
