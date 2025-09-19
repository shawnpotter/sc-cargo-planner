// src/lib/authOptions.ts
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'

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
