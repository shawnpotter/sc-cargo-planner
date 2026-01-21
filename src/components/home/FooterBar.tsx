import React from 'react'
/**
 * Renders the footer bar for the home page, featuring a CRT overlay effect and system status indicators.
 *
 * @returns {JSX.Element}
 *
 * @remarks
 * - Uses Tailwind CSS for styling and layout.
 * - Includes animated and colored status icons for visual feedback.
 * - The CRT overlay effect is achieved with a radial gradient and border.
 */
function Footer() {
	return (
		<footer className='w-full bg-background border-t border-dashed border-[#FF8A00] py-3 px-4 flex items-center justify-center relative text-xs md:text-sm font-mono tracking-wider text-foreground shadow-[0_4px_6px_rgba(0,0,0,0.1)]'>
			{/* CRT overlay effect */}
			<div className='pointer-events-none absolute inset-0 rounded border border-[rgba(255,138,0,0.2)] bg-gradient-radial from-white/5 via-transparent to-transparent' />
			<span className='text-[#FF8A00] mr-1 animate-pulse'>{'>'}</span>
			<span className='text-[#e74c3c] mr-1'>_</span>
			<span className='text-[#2ecc71] font-semibold'>UEE APPROVED</span>
			<span className='mx-2 text-[#FF8A00]'>•</span>
			<span className='text-[#3498db]'>SYSTEM READY</span>
		</footer>
	)
}

export { Footer }
