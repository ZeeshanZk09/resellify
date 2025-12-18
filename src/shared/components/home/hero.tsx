import React from 'react'
import { Button } from '../ui/button'
import { Github } from 'lucide-react'
import CopyToClipboard from './copy-to-clipboard'
import Link from 'next/link'



const Hero = () => {

    return (
        <section>
            <div className="text-center mt-24 mb-10 space-y-4">
                <div className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground font-medium text-sm mb-4 animate-fade-in">
                    Next.js + Auth.js v5 + ShadCN UI
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Next.js <span className="underline">Auth</span> Starter
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mt-8">
                    A secure, modern authentication template with everything you need to
                    get started (password reset, email validation and oAuth, profile
                    update)
                </p>
                <CopyToClipboard />
                <div className="flex flex-wrap justify-center gap-4 mt-10">
                    <Button  size="lg" variant="outline">
                    <Link className='flex gap-2' href={"https://github.com/Bendada-abdelmajid/nextjs-authjs.git"} >
                        <Github /> Github
                        </Link>
                    </Button>
                    <Button size="lg" asChild>
                        <Link href={"#guides"} >Get started</Link></Button>
                </div>
            </div>
        </section>
    )
}

export default Hero