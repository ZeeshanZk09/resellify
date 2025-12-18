export const variables = `DATABASE_URL=
NEXTAUTH_URL= # Your NextAuth URL (e.g., http://localhost:3000)
NEXTAUTH_SECRET= # A secret key for NextAuth encryption

AUTH_GOOGLE_ID= # Google OAuth Client ID (create it in Google Developer Console: https://console.developers.google.com/)
AUTH_GOOGLE_SECRET= # Google OAuth Secret (generated in the same place as the Client ID)

AUTH_LINKEDIN_ID= # LinkedIn OAuth Client ID (create it in LinkedIn Developer Portal: https://www.linkedin.com/developers/)
AUTH_LINKEDIN_SECRET= # LinkedIn OAuth Secret (generated in the same place as the Client ID)

EMAIL_FROM= # The email address you'll use to send verification and reset emails
EMAIL_PASSWORD= # Password or application-specific password for your email account

AWS_S3_SECRET_ACCESS_KEY= # AWS S3 Secret Access Key (generate it in the AWS IAM Console: https://console.aws.amazon.com/iam/)
AWS_S3_ACCESS_KEY_ID= # AWS S3 Access Key ID (also in IAM Console)
AWS_S3_REGION= # AWS S3 Region (e.g., us-east-1)
AWS_S3_BUCKET_NAME= # Your S3 Bucket Name (create it in the AWS S3 Console: https://console.aws.amazon.com/s3/)`;
export const copy_variables = `DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=

AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

AUTH_LINKEDIN_ID=
AUTH_LINKEDIN_SECRET=

EMAIL_FROM=
EMAIL_PASSWORD=

AWS_S3_SECRET_ACCESS_KEY=
AWS_S3_ACCESS_KEY_ID=
AWS_S3_REGION= 
AWS_S3_BUCKET_NAME=`;

export const clone = `git clone https://github.com/Bendada-abdelmajid/nextjs-authjs.git
cd clreck-clone`;
export const install = `npm install`;
export const prisma = `npx prisma generate`;
export const run = `npm run dev`;
