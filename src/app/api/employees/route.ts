// import { NextRequest, NextResponse } from "next/server";
// import { connectToDatabase } from "@/lib/db";
// import { generateRandomPassword } from "@/lib/utils";

// export async function POST(req: NextRequest) {
//   const data = await req.json();

//   const db = await connectToDatabase();

//   const {
//     firstName,
//     lastName,
//     phone,
//     email,
//     dateOfJoining,
//     dateOfBirth
//   } = data;

//   const password = generateRandomPassword(6);
//   const roleId = 2;

//   try {
//     await db.execute(
//       `INSERT INTO users (email, password, role_id, first_name, last_name, phone, join_fund, dob, status, created_at)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
//       [
//         email,
//         password,
//         roleId,
//         firstName,
//         lastName,
//         phone,
//         dateOfJoining,
//         dateOfBirth
//       ]
//     );

//     return NextResponse.json({ message: "Employee added", password });
//   } catch (error) {
//     console.error("Insert error:", error);
//     return NextResponse.json({ message: "Insert failed" }, { status: 500 });
//   }
// }



import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/user';
import bcrypt from 'bcryptjs';
import { generateRandomHexPassword } from '@/lib/generatePassword';
import { sendAccountEmail } from '@/lib/mailer';
import { ApiResponse } from '@/lib/ApiResponse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      dateOfJoining,
      dateOfResigning,
    } = body;

    if (!email || !firstName || !lastName || !phone || !dob || !dateOfJoining) {
      return Response.json(new ApiResponse(false, 'Missing required fields', {}), { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json(new ApiResponse(false, 'User already exists', {}), { status: 409 });
    }

    const plainPassword = generateRandomHexPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone,
      dob,
      dateOfJoining,
      dateOfResigning,
      password: plainPassword,
      role: 'employee',
      isActive: true
    });

    let emailSent = false;
    try {
      await sendAccountEmail(email, plainPassword);
      emailSent = true;
    } catch (mailErr: any) {
      console.error('Mail send failed:', mailErr.message);
    }

    return Response.json(
      new ApiResponse(true, emailSent ? 'Employee created and email sent' : 'Employee created (email failed)', { userId: newUser._id }),
      { status: 201 }
    );
  } catch (err: any) {
    console.error(err);
    return Response.json(new ApiResponse(false, 'Internal Server Error', {}), { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('filter');
    const limit = parseInt(searchParams.get('limit') || '10');

    await dbConnect();

    let query:any = { role: 'employee' };
    if (status !== "all") {
      const isActive = status == "active"
      query.isActive = isActive
    }

    if (limit === -1) {
      const allEmployees = await User.find(query).lean();
      return Response.json(
        new ApiResponse(true, 'All employees fetched', allEmployees, null),
        { status: 200 }
      );
    }

    const totalRecords = await User.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);
    const skip = (page - 1) * limit;

    const employees = await User.find(query)
      .skip(skip)
      .limit(limit)
      .lean();

    return Response.json(
      new ApiResponse(true, 'Paginated employees fetched', employees, {
        totalRecords,
        totalPages,
        currentPage: page,
      }),
      { status: 200 }
    );
    //mute rkhna
  } catch (err: any) {
    console.error(err);
    return Response.json(new ApiResponse(false, 'Failed to fetch employees', []), { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, ...updateFields } = body;

    if (!_id) {
      return Response.json(new ApiResponse(false, 'Missing _id or updatedBy', {}), { status: 400 });
    }

    await dbConnect();

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { ...updateFields },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return Response.json(new ApiResponse(false, 'User not found', {}), { status: 404 });
    }

    return Response.json(
      new ApiResponse(true, 'Employee updated successfully', updatedUser),
      { status: 200 }
    );
  } catch (err: any) {
    console.error(err);
    return Response.json(new ApiResponse(false, 'Failed to update employee', {}), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { _id, updatedBy } = body;

    if (!_id || !updatedBy) {
      return Response.json(new ApiResponse(false, 'Missing _id or updatedBy', {}), { status: 400 });
    }

    await dbConnect();

    const deletedUser = await User.findByIdAndUpdate(
      _id,
      { isActive: false, updatedBy },
      { new: true }
    ).lean();

    if (!deletedUser) {
      return Response.json(new ApiResponse(false, 'User not found', {}), { status: 404 });
    }

    return Response.json(
      new ApiResponse(true, 'Employee marked as inactive', deletedUser),
      { status: 200 }
    );
  } catch (err: any) {
    console.error(err);
    return Response.json(new ApiResponse(false, 'Failed to delete employee', {}), { status: 500 });
  }
}
