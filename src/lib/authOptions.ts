// src/lib/authOptions.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'

/**
 * Configuration options for NextAuth authentication in the application.
 *
 * @remarks
 * - Uses PrismaAdapter for database integration with Prisma ORM.
 * - Implements a custom credentials provider for username and password authentication.
 * - Validates user credentials against stored hashed passwords using bcrypt.
 * - Utilizes JWT-based session strategy.
 * - Extends session callback to include user ID from JWT token.
 * - Customizes the sign-in page route.
 * - Requires a secret for NextAuth from environment variables.
 *
 * @property {Adapter} adapter - The Prisma adapter instance for NextAuth.
 * @property {Array<Provider>} providers - List of authentication providers, including custom credentials.
 * @property {SessionOptions} session - Session management configuration, using JWT strategy.
 * @property {Callbacks} callbacks - Custom callback functions for session handling.
 * @property {PagesOptions} pages - Custom page routes for authentication flows.
 * @property {string} secret - Secret key for securing NextAuth sessions.
 */
export const authOptions: NextAuthOptions = {
	adapter: PrismaAdapter(prisma),
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				name: { label: 'Username', type: 'name' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.name || !credentials?.password) {
					return null
				}

				const user = await prisma.user.findUnique({
					where: { name: credentials.name },
				})

				if (!user) {
					return null
				}

				const passwordMatch = await bcrypt.compare(
					credentials.password,
					user.password
				)

				if (!passwordMatch) {
					return null
				}

				return {
					id: user.id,
					email: user.email,
					name: user.name,
				}
			},
		}),
	],
	session: {
		strategy: 'jwt',
	},
	callbacks: {
		async session({ session, token }) {
			if (token && session.user) {
				session.user.id = token.sub as string
			}
			return session
		},
	},
	pages: {
		signIn: '/',
	},
	secret: process.env.NEXTAUTH_SECRET,
}
