import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import InvestmentRecord from '@/models/InvestmentRecord';
import User from '@/models/user';
import { getLatestNav, getNavHistory } from '@/lib/navHelper';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const userIdHeader = req.headers.get('x-user-id');
    const userEmail = req.headers.get('x-user-email');

    let userId = Number(userIdHeader);

    // If userId not in JWT, resolve from email
    if (!userId || isNaN(userId)) {
      if (!userEmail) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }
      const userDoc = await User.findOne({ email: userEmail }).select('user_id').lean() as any;
      if (!userDoc) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      if (!userDoc.user_id) {
        // Auto-assign user_id if still missing
        const Counter = (await import('@/models/Counter')).default;
        const counter = await Counter.findOneAndUpdate(
          { id: 'user_id' },
          { $inc: { seq: 1 } },
          { upsert: true, new: true }
        );
        userId = counter.seq;
        await User.updateOne({ email: userEmail }, { $set: { user_id: userId } });
      } else {
        userId = userDoc.user_id;
      }
    }

    // --- Fetch all investment records for this user ---
    const records = await InvestmentRecord.find({ userId }).sort({ purchaseDate: 1 }).lean() as any[];

    const totalInvested = records.reduce((sum: number, r: any) => sum + r.amountInvested, 0);
    const totalUnits = records.reduce((sum: number, r: any) => sum + r.unitsPurchased, 0);

    // Latest NAV directly from mfapi.in
    const latestNavDoc = await getLatestNav();
    const currentNav = latestNavDoc.nav;
    const currentValue = totalUnits * currentNav;
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    // NAV history for line chart from mfapi.in
    const chartData = await getNavHistory(12);

    // Per-month breakdown for table display
    const breakdown = records.map((r: any) => ({
      date: new Date(r.purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      amountInvested: r.amountInvested,
      navAtPurchase: r.navAtPurchase,
      unitsPurchased: parseFloat(r.unitsPurchased.toFixed(4)),
      currentValue: parseFloat((r.unitsPurchased * currentNav).toFixed(2)),
      profitLoss: parseFloat(((r.unitsPurchased * currentNav) - r.amountInvested).toFixed(2)),
    }));

    const pieData = [
      { name: 'Invested', value: totalInvested, color: '#0ea5e9' },
      { name: 'Profit', value: profitLoss > 0 ? parseFloat(profitLoss.toFixed(2)) : 0, color: '#22c55e' },
    ];

    return NextResponse.json({
      success: true,
      data: {
        totalInvested,
        totalUnits: parseFloat(totalUnits.toFixed(4)),
        currentNav,
        currentValue: parseFloat(currentValue.toFixed(2)),
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
        totalPayments: records.length,
        chartData,
        pieData,
        breakdown,
      },
    });
  } catch (error) {
    console.error('Investment fetch error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
