import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Payment from '@/models/paymentModel';
import User from '@/models/user';

// POST = Save payment
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const utr = formData.get('utr') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const amount = formData.get('amount') as string;
    const file = formData.get('screenshot') as File;
    const userId = req.headers.get('x-user-id');

    if (!utr || !name || !email || !amount || !file) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    await connectDB();

    //  Find the user by email
    // const user = await User.findOne({ email: email.trim().toLowerCase() });

    // if (!user) {
    //   return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // }

    //  Save payment with user_id from User schema
    const newPayment = new Payment({
      userId, // <-- Save numeric user_id from user schema
      utr,
      name,
      email,
      amount: Number(amount),
      screenshotUrl: base64Image,
      status: 'paid',
    });

    await newPayment.save();

    return NextResponse.json({ message: 'Payment saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('❌ Payment Save Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
