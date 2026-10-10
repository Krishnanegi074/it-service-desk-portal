import { NextResponse } from 'next/server';
import { requireApiStaff } from '@/lib/api-auth';
import { listAssignableStaff } from '@/lib/db';

export async function GET() {
  const auth = await requireApiStaff();
  if (auth.response) return auth.response;

  if (auth.principal.demo) {
    return NextResponse.json({
      success: true,
      data: [{
        id: auth.principal.id,
        email: auth.principal.email,
        fullName: auth.principal.fullName,
        role: auth.principal.role
      }]
    });
  }

  try {
    return NextResponse.json({ success: true, data: await listAssignableStaff() });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to load staff.' },
      { status: 500 }
    );
  }
}
