import { NextRequest, NextResponse } from 'next/server';
import { billsAPI } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    let bills = [];
    try {
      bills = await billsAPI.getAll();
    } catch (billsError) {
      return NextResponse.json({
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingBills: 0,
        paidBills: 0,
        cancelledBills: 0,
        pendingAmount: 0,
        growthPercentage: 0,
        totalBills: 0
      });
    }

    if (!bills || bills.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingBills: 0,
        paidBills: 0,
        cancelledBills: 0,
        pendingAmount: 0,
        growthPercentage: 0,
        totalBills: 0
      });
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const paidBills = bills.filter((bill: any) => bill.status === 'paid');
    const pendingBills = bills.filter((bill: any) => bill.status === 'pending');
    const cancelledBills = bills.filter((bill: any) => bill.status === 'cancelled' || bill.status === 'failed');


    const totalRevenue = paidBills.reduce((sum: number, bill: any) => sum + (bill.amount || 0), 0);

    const currentMonthBills = paidBills.filter((bill: any) => {
      if (!bill.paid_date) return false;
      const paidDate = new Date(bill.paid_date);
      return paidDate.getFullYear() === currentYear && paidDate.getMonth() === currentMonth;
    });
    const monthlyRevenue = currentMonthBills.reduce((sum: number, bill: any) => sum + (bill.amount || 0), 0);

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthBills = paidBills.filter((bill: any) => {
      if (!bill.paid_date) return false;
      const paidDate = new Date(bill.paid_date);
      return paidDate.getFullYear() === previousYear && paidDate.getMonth() === previousMonth;
    });
    const previousMonthRevenue = previousMonthBills.reduce((sum: number, bill: any) => sum + (bill.amount || 0), 0);

    let growthPercentage = 0;
    if (previousMonthRevenue > 0) {
      growthPercentage = ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    } else if (monthlyRevenue > 0) {
      growthPercentage = 100;
    }

    const pendingAmount = pendingBills.reduce((sum: number, bill: any) => sum + (bill.amount || 0), 0);

    const stats = {
      totalRevenue,
      monthlyRevenue,
      pendingBills: pendingBills.length,
      paidBills: paidBills.length,
      cancelledBills: cancelledBills.length,
      pendingAmount,
      growthPercentage: Math.round(growthPercentage * 100) / 100,
      totalBills: bills.length
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to calculate payment statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
