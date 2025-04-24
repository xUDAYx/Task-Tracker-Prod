import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
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

    // Get all team members
    const members = await db.query.teamMembers.findMany({
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(members.map(member => ({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
      role: member.isManager ? 'manager' : 'employee'
    })));
  } catch (error) {
    console.error('Error fetching team members:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const { email, role } = await request.json();

    // Check if user exists
    const newUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!newUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if user is already a team member
    const existingMember = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, newUser.id)
    });

    if (existingMember) {
      return new NextResponse('User is already a team member', { status: 400 });
    }

    // Add user as team member
    await db.insert(teamMembers).values({
      userId: newUser.id,
      isManager: role === 'manager'
    });

    return new NextResponse('Team member added successfully', { status: 201 });
  } catch (error) {
    console.error('Error adding team member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 