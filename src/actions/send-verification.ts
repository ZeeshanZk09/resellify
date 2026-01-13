"use server";
import { headers } from "next/headers";
import nodemailer from "nodemailer";
import prisma from "@/shared/lib/prisma";
export const sendVerification = async (email: string) => {
  try {
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15-minute expiration
    const oldVerfication = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
      },
    });
    if (oldVerfication) {
      try {
        await prisma.verificationToken.delete({
          where: {
            identifier: oldVerfication.identifier,
          },
        });
      } catch (error) {
        console.log(error);
      }
    }
    // Store verification code in the database
    try {
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: verificationCode,
          expires,
        },
      });
    } catch (error) {
      console.log(error);
      return null;
    }
    // Send email with the verification code
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const headersInstance = await headers();
    const ip = headersInstance.get("x-forwarded-for");
    const country = headersInstance.get("x-vercel-ip-country") || "Unknown";
    const region =
      headersInstance.get("x-vercel-ip-country-region") || "Unknown";
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your Verification Code",
      html: `
     <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;">
        <tr>
          <td align="center" style="padding:48px 32px;">
            
            <!-- Logo -->
            <table cellpadding="0" cellspacing="0" border="0" width="600">
              <tr>
                <td align="left" style="padding:16px 32px;">
                 <img src="https://zebotix.com/Zebotix.png" width="180" alt="goshop" />

                </td>
              </tr>
            </table>

            <!-- Email Body -->
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background:#ffffff;">
              <tr>
                <td style="padding:32px 32px 48px;">
                  <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:32px;">
                    Verification Code
                  </h1>

                  <p style="margin:32px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
                    Enter the following verification code when prompted:
                  </p>

                  <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:40px;">
                    <b>${verificationCode}</b>
                  </p>

                  <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
                    To protect your account, do not share this code.
                  </p>

                  <p style="margin:64px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
                    <b>Didn't request this?</b>
                  </p>

                  <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
                    This code was requested from <b>${ip}, ${region}, ${country}</b>
                    at <b>${new Date().toUTCString()}</b>.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
      `,
    });

    return verificationCode;
  } catch (error) {
    console.log(error);
    return null;
  }
};
