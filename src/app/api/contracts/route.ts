// @/app/api/contracts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Contract } from '@/constants/types'

// In-memory storage for now (you can replace with database later)
let contractStore: Contract[] = []

export async function GET() {
	return NextResponse.json({ contracts: contractStore })
}

export async function POST(request: NextRequest) {
	try {
		const { contracts } = await request.json()

		if (!Array.isArray(contracts)) {
			return NextResponse.json(
				{ error: 'Invalid data format' },
				{ status: 400 }
			)
		}

		// Add IDs if missing
		const contractsWithIds = contracts.map((c) => ({
			...c,
			id:
				c.id ||
				`id-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
		}))

		contractStore = [...contractStore, ...contractsWithIds]

		return NextResponse.json({
			success: true,
			contracts: contractsWithIds,
		})
	} catch (error) {
		return NextResponse.json(
			{ error: 'Failed to process contracts' },
			{ status: 500 }
		)
	}
}

export async function DELETE() {
	contractStore = []
	return NextResponse.json({ success: true })
}
