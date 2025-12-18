'use server';
import prisma from '@/shared/lib/prisma';
import { headers } from 'next/headers';
import nodemailer from 'nodemailer';
export const sendVerification = async (email: string) => {
  try {
    // Generate a 6-digit verification code

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15-minute expiration
    const oldVerfication = await prisma.verificationToken?.findFirst({
      where: {
        identifier: email,
      },
    });
    console.log(oldVerfication);
    if (oldVerfication) {
      await prisma.verificationToken.delete({
        where: {
          identifier: oldVerfication.identifier,
        },
      });
    }
    // Store verification code in the database
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationCode,
        expires,
      },
    });

    // Send email with the verification code
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const headersInstance = await headers();
    const ip = headersInstance.get('x-forwarded-for');
    const country = headersInstance.get('x-vercel-ip-country') || 'Unknown';
    const region = headersInstance.get('x-vercel-ip-country-region') || 'Unknown';
    const imageLogo = 'https://wovely.vercel.app/icon-512x512.png';
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%;">
          <tbody>
            <tr>
              <td align="center" valign="top" style="vertical-align: top; line-height: 1; padding: 48px 32px;">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="width: 600px;">
                  <tbody>
                    <tr>
                      <td align="left" valign="top" style="vertical-align: top; line-height: 1; padding: 16px 32px;">
                        <p style="padding: 0px; margin: 0px; font-family: Helvetica, Arial, sans-serif; color: rgb(0, 0, 0); font-size: 24px; line-height: 36px;">
                          <img src="${imageLogo}" width="128" alt="Wovely Logo" style="max-width: 128px; width: 128px;">
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="width: 600px; border-collapse: separate;">
                  <tbody>
                    <tr>
                      <td align="left" valign="top" bgcolor="#fff" style="vertical-align: top; line-height: 1; background-color: rgb(255, 255, 255); border-radius: 0px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; border-collapse: separate;">
                          <tbody>
                            <tr>
                              <td align="left" valign="top" bgcolor="#ffffff" style="vertical-align: top; line-height: 1; padding: 32px 32px 48px; background-color: rgb(255, 255, 255); border-radius: 0px;">
                                <h1 align="left" style="padding: 0px; margin: 0px; font-style: normal; font-family: Helvetica, Arial, sans-serif; font-size: 32px; line-height: 39px; color: rgb(0, 0, 0); font-weight: bold;">Verification Code</h1>
                                <p align="left" style="padding: 0px; margin: 32px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: rgb(0, 0, 0); font-size: 14px; line-height: 21px;">Enter the following verification code when prompted:</p>
                                <p style="padding: 0px; margin: 16px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: rgb(0, 0, 0); font-size: 40px; line-height: 60px;">
                                  <b>${verificationCode}</b>
                                </p>
                                <p style="padding: 0px; margin: 16px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: rgb(0, 0, 0); font-size: 14px; line-height: 21px;">To protect your account, do not share this code.</p>
                                <p style="padding: 0px; margin: 64px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: rgb(0, 0, 0); font-size: 14px; line-height: 21px;">
                                  <b>Didn't request this?</b>
                                </p>
                                <p style="padding: 0px; margin: 4px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: rgb(0, 0, 0); font-size: 14px; line-height: 21px;">This code was requested from <b>${ip}, ${region},${country}</b> at <b>${new Date().toUTCString()}</b>. If you didn't make this request, you can safely ignore this email.</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      `,
    });

    return verificationCode;
  } catch (error) {
    console.log(error);
  }
};
