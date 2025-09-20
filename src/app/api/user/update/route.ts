// @/app/api/user/update/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/authOptions'

export async function PUT(request: Request) {
	try {
		const session = await getServerSession(authOptions)

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { name, email } = await request.json()

		// Validate input
		if (!name || !email) {
			return NextResponse.json(
				{ error: 'Name and email are required' },
				{ status: 400 }
			)
		}

		// Check if the new name is already taken by another user
		if (name !== session.user.name) {
			const existingUserByName = await prisma.user.findUnique({
				where: { name },
			})

			if (existingUserByName && existingUserByName.id !== session.user.id) {
				return NextResponse.json(
					{ error: 'Username already taken' },
					{ status: 409 }
				)
			}
		}

		// Check if the new email is already taken by another user
		if (email !== session.user.email) {
			const existingUserByEmail = await prisma.user.findUnique({
				where: { email },
			})

			if (existingUserByEmail && existingUserByEmail.id !== session.user.id) {
				return NextResponse.json(
					{ error: 'Email already taken' },
					{ status: 409 }
				)
			}
		}

		// Update the user
		const updatedUser = await prisma.user.update({
			where: { id: session.user.id },
			data: { name, email },
			select: {
				id: true,
				name: true,
				email: true,
				createdAt: true,
				updatedAt: true,
			},
		})

		return NextResponse.json(updatedUser, { status: 200 })
	} catch (error) {
		console.error('Error updating user:', error)
		return NextResponse.json(
			{ error: 'An error occurred while updating user' },
			{ status: 500 }
		)
	}
}
