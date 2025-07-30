import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Lấy ngày hiện tại từ server theo múi giờ Việt Nam
    const now = new Date();
    
    // Chuyển đổi sang múi giờ Việt Nam (UTC+7)
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    
    // Format ngày theo YYYY-MM-DD
    const year = vietnamTime.getUTCFullYear();
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
    const currentDate = `${year}-${month}-${day}`;
    
    return NextResponse.json({
      date: currentDate,
      timestamp: vietnamTime.toISOString(),
      timezone: 'Asia/Ho_Chi_Minh',
      originalTime: now.toISOString(),
      vietnamTime: vietnamTime.toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get current date' },
      { status: 500 }
    );
  }
} 