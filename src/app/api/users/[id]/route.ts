import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    if (!response.ok) {
      console.error(`Backend API error: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error('Error response:', errorData);
      
      return NextResponse.json(
        { error: `Backend API error: ${response.status}` },
        { status: response.status }
      );
    }

    const userData = await response.json();
    
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}
