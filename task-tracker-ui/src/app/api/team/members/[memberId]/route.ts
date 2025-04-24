import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is a manager
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: {
        teamMember: true
      }
    });

    if (!user?.teamMember?.isManager) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { role } = await request.json();

    // Update team member role
    await db.update(teamMembers)
      .set({ isManager: role === 'manager' })
      .where(eq(teamMembers.userId, params.memberId));

    return new NextResponse('Team member role updated successfully');
  } catch (error) {
    console.error('Error updating team member role:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is a manager
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: {
        teamMember: true
      }
    });

    if (!user?.teamMember?.isManager) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Delete team member
    await db.delete(teamMembers)
      .where(eq(teamMembers.userId, params.memberId));

    return new NextResponse('Team member removed successfully');
  } catch (error) {
    console.error('Error removing team member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 