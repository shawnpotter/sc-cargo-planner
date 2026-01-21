// app/api/auth/[...nextauth]/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
	return NextResponse.json(
		{ error: 'Authentication is disabled in this beta build' },
		{ status: 503 },
	)
}

export async function POST() {
	return NextResponse.json(
		{ error: 'Authentication is disabled in this beta build' },
		{ status: 503 },
	)
}
