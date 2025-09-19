// @/components/auth/UserButton.tsx
'use client'
import React, { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface UserButtonProps {
	readonly name: string
	readonly onEditAccount: () => void
}

function UserButton({ name, onEditAccount }: UserButtonProps) {
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const handleLogout = async () => {
		try {
			await signOut({ callbackUrl: '/' })
		} catch (error) {
			console.error('Logout error:', error)
		}
	}

	return (
		<div ref={dropdownRef}>
			<Button
				onClick={() => setIsOpen(!isOpen)}
				variant='secondary'
			>
				<span>{name}</span>
				<svg
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M19 9l-7 7-7-7'
					/>
				</svg>
			</Button>

			{isOpen && (
				<div>
					<div>
						<button
							onClick={() => {
								onEditAccount()
								setIsOpen(false)
							}}
						>
							Edit Account
						</button>
						<button
							onClick={() => {
								handleLogout()
								setIsOpen(false)
							}}
						>
							Logout
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

export { UserButton }
