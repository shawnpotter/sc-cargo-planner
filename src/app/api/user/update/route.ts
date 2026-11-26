import { NextResponse } from 'next/server'
export async function PUT() { return NextResponse.json({error:'Account features are disabled in this beta build'}, {status:503}) }
