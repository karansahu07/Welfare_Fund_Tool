// import { NextResponse } from "next/server";
// import { connectToDatabase } from "@/lib/db";

// export async function POST(req: Request) {
//   try {
//     const { email, password } = await req.json();

//      // Get referer URL
//      const referer = req.headers.get("referer") || "";

//      const role = referer.includes("/sign-in/admin")? "Admin":"Employee";

//     const db = await connectToDatabase();

//     const [rows]: any = await db.execute(
//       `SELECT users.id, users.email, roles.role
//        FROM users
//        JOIN roles ON users.role_id = roles.id
//        WHERE users.email = ? AND users.password = ? AND roles.role = ?`,
//       [email, password, role]
//     );
    

//     if (rows.length === 0) {
//       return NextResponse.json(
//         { success: false, message: "Invalid credentials" },
//         { status: 401 }
//       );
//     }

//     const user = rows[0];

//     return NextResponse.json({
//       success: true,
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     return NextResponse.json(
//       { success: false, message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Load your secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const referer = req.headers.get("referer") || "";
    const role = referer.includes("/sign-in/admin") ? "admin" : "employee";

    await dbConnect();

    // Find user by email and role
    const user = await User.findOne({ email, role });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}


