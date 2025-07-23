import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest, context: { params: { roomId?: string } }) {
  const { params } = context;
  try {
    console.log('API DELETE /api/chat/rooms/[roomId] called with params:', params);
    if (!params || !params.roomId) {
      console.error('No roomId provided in params:', params);
      return NextResponse.json({ error: 'No roomId provided' }, { status: 400 });
    }
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/chat/rooms/${params.roomId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to delete chat room' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting chat room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 