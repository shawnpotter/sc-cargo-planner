// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
	try {
		const { email, password, name, requestId } = await request.json()
		console.log('Request ID:', requestId) // Debugging log

		// Validate email, password, and name
		if (!email || !password || !name) {
			return NextResponse.json(
				{ error: 'Email, username, and password are required' },
				{ status: 400 }
			)
		}

		// Check if user already exists by email
		const existingUserByEmail = await prisma.user.findUnique({
			where: { email },
		})

		if (existingUserByEmail) {
			console.log('User already exists with email:', email)
			return NextResponse.json(
				{ error: 'User already exists with this email' },
				{ status: 409 }
			)
		}

		// Check if username (name) already exists
		const existingUserByName = await prisma.user.findUnique({
			where: { name },
		})

		if (existingUserByName) {
			console.log('Username already exists:', name)
			return NextResponse.json(
				{ error: 'Username already taken' },
				{ status: 409 }
			)
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10)

		// Create the new user
		const user = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				name, // This will serve as the username for login
			},
		})

		console.log('User created successfully:', user.email)

		// Return user without password
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password: _, ...userWithoutPassword } = user

		return NextResponse.json(userWithoutPassword, { status: 201 })
	} catch (error) {
		console.error('Error during signup:', error)
		return NextResponse.json(
			{ error: 'An error occurred during signup' },
			{ status: 500 }
		)
	}
}
