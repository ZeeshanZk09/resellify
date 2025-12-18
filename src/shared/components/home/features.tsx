import React from 'react'

import { User, Mail, Key, Database, Code, Server } from "lucide-react";
const features = [
    {
      Icon: User,
      title: "Credential Authentication",
      description:
        "Secure user authentication with credentials, ensuring strong validation and encryption for login security.",
    },
    {
      Icon: Mail,
      title: "Email Verification",
      description:
        "Verify user email addresses to prevent spam and unauthorized account creation, improving platform security.",
    },
    {
      Icon: Key,
      title: "Password Reset",
      description:
        "Allow users to securely reset passwords using token-based authentication, reducing the risk of account lockout.",
    },
    {
      Icon: Database,
      title: "S3 Storage for Profiles",
      description:
        "Integrate Amazon S3 for scalable and reliable user profile storage, ensuring quick and secure access to files.",
    },
    {
      Icon: Code,
      title: "ShadCN UI Components",
      description:
        "Utilize modern and accessible UI components from ShadCN for a seamless and responsive user experience.",
    },
  
    {
      Icon: Server,
      title: "MongoDB Database",
      description:
        "Leverage MongoDB for a scalable and flexible NoSQL database solution, ensuring high availability and performance.",
    },
  ];
function Features() {
    return (
        <section id="features" className="pt-20">
            <h2 className="text-xl font-medium">Features</h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                This starter template is a guide to help you get started with Next.js
                for large scale applications. Feel free to add or remove features to
                suit your needs.
            </p>
            <div className="grid md:grid-cols-2 gap-x-5 gap-y-10 mt-10">
                {features.map(({ Icon, title, description }, i) => (
                    <div key={"card" + i}>
                        <Icon />
                        <h4 className="font-medium mt-4">{title}</h4>
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                            {description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Features