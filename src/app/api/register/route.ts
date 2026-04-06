import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateUserSalt } from '@/lib/encryption';
import { sendVerificationEmail } from '@/lib/mailer';
import crypto from 'crypto';

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'temp-mail.org', '10minutemail.com', 'guerrillamail.com',
  'yopmail.com', 'tempmail.com', 'throwawaymail.com', 'temp-email.org'
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: 'Disposable email addresses are not allowed' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['SHOPKEEPER', 'CUSTOMER'];
    const userRole = validRoles.includes(role) ? role : 'CUSTOMER';

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If user was a placeholder created by a shopkeeper, update their password so they can log in
      if (existingUser.role === 'CUSTOMER' && userRole === 'CUSTOMER') {
        const hashedPassword = await hash(password, 12);
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashedPassword,
            name: name || existingUser.name,
            emailVerified: new Date(), // Auto-verify since shopkeeper initiated it
          },
        });
        return NextResponse.json(
          {
            message: 'Account activated successfully. You can now log in.',
            user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and generate encryption salt
    const hashedPassword = await hash(password, 12);
    const encryptionKeySalt = generateUserSalt();

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        role: userRole,
        encryptionKeySalt,
        verificationToken,
        verificationExpires,
      },
    });

    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      {
        message: 'Account created successfully. Please check your email to verify your account.',
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
