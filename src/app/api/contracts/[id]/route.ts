import { NextResponse } from 'next/server'
function retired() { return NextResponse.json({error:'Contract API retired. Runs are saved in this browser.'}, {status:410}) }
export { retired as PUT, retired as DELETE }
