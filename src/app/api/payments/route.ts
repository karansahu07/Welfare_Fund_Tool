import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Payment from '@/models/paymentModel';
import User from '@/models/user';
import InvestmentRecord from '@/models/InvestmentRecord';
import Counter from '@/models/Counter';
import { getNavOnOrBefore } from '@/lib/navHelper';

// POST = Save payment
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const utr = formData.get('utr') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const amount = formData.get('amount') as string;
    const file = formData.get('screenshot') as File;
    const userIdHeader = req.headers.get('x-user-id');
    const paymentDateStr = formData.get('paymentDate') as string; // "YYYY-MM-DD"

    if (!utr || !name || !email || !amount || !file) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectDB();

    // Resolve numeric userId — from header (middleware JWT) or fallback to DB lookup by email
    let userId: number | undefined;
    const parsedFromHeader = Number(userIdHeader);
    if (userIdHeader && userIdHeader !== 'undefined' && !isNaN(parsedFromHeader)) {
      userId = parsedFromHeader;
    } else {
      // Fallback: look up user_id from DB using email
      const user = await User.findOne({ email: email.trim().toLowerCase() }).select('user_id').lean() as any;
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (user.user_id) {
        userId = user.user_id;
      } else {
        // user_id not set — auto-assign one via Counter and persist it
        const counter = await Counter.findOneAndUpdate(
          { id: 'user_id' },
          { $inc: { seq: 1 } },
          { upsert: true, new: true }
        );
        userId = counter.seq;
        await User.updateOne({ email: email.trim().toLowerCase() }, { $set: { user_id: userId } });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Could not resolve userId.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    //  Save payment with user_id from User schema
    const paymentDate = paymentDateStr ? new Date(paymentDateStr) : new Date();
    const newPayment = new Payment({
      userId,
      utr,
      name,
      amount: Number(amount),
      screenshotUrl: base64Image,
      status: 'paid',
      paymentDate,
    });

    await newPayment.save();

    // --- NAV lookup and unit allocation via mfapi.in (no cron needed) ---
    const SCHEME_CODE = '122639';
    const navRecord = await getNavOnOrBefore(paymentDate);

    if (navRecord) {
      // Guard: don't create duplicate InvestmentRecord for the same userId + month
      const startOfMonth = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1);
      const endOfMonth = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      const existingRecord = await InvestmentRecord.findOne({
        userId,
        purchaseDate: { $gte: startOfMonth, $lte: endOfMonth },
      });

      if (!existingRecord) {
        const units = Number(amount) / navRecord.nav;
        await InvestmentRecord.create({
          userId,
          schemeCode: SCHEME_CODE,
          unitsPurchased: units,
          amountInvested: Number(amount),
          navAtPurchase: navRecord.nav,
          purchaseDate: paymentDate,
        });
        return NextResponse.json({
          message: 'Payment saved and units allocated successfully',
          navStatus: 'allocated',
          unitsAllocated: units,
          navUsed: navRecord.nav,
          navDate: navRecord.date,
        }, { status: 201 });
      }
      // Investment record already exists for this month
      return NextResponse.json({
        message: 'Payment saved. Investment record already exists for this month.',
        navStatus: 'duplicate',
      }, { status: 201 });
    }

    return NextResponse.json({
      message: `Payment saved. No NAV available on or before the selected date.`,
      navStatus: 'pending',
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Payment Save Error:', error?.message ?? error);
    return NextResponse.json({ error: error?.message ?? 'Internal Server Error' }, { status: 500 });
  }
}
//  GET = Fetch all payments
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    const now = new Date();
    const month = monthParam ? parseInt(monthParam)-1 : now.getMonth(); // 0-indexed
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const result = [];
    const users = await User.find({ isActive: true, role : 'employee' }).select("firstName lastName user_id").lean();
    for (const user of users) {
      const payment = await Payment.findOne({
        userId: user.user_id,
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      });
      const data : any = {
        username : `${user.firstName} ${user.lastName}`,
        utr : "",
        status : "pending",
        amount : 1000,
        date : "",
        screenshotUrl : "",
      }
      if(payment){
        data.utr = payment?.utr
        data.status = payment?.status
        data.amount = payment?.amount
        data.date = payment.createdAt
        data.screenshotUrl = payment.screenshotUrl
      }
      result.push(data);
    }
    // const payments = await Payment.find().sort({ createdAt: -1 });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('❌ GET /api/payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
