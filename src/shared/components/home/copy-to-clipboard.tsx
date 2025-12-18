"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "../ui/button";


export const repo = "https://github.com/Bendada-abdelmajid/nextjs-authjs.git"
export default function CopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`git clone ${repo} `);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 sec
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <div className="flex items-center gap-4 justify-center">
      <div className=" max-w-full overflow-hidden text-nowrap bg-secondary h-10 flex items-center px-3 rounded-lg text-secondary-foreground border border-transparent hover:border-primary text-sm">
        <p className="text-ellipsis line-clamp-1">git clone {repo} </p>
      </div>
      <Button onClick={handleCopy} size={"icon"}>
        {copied ? <Check  size={20} /> : <Copy size={20} />}
      </Button>
    </div>
  );
}
//  {copied ? <Check className="text-green-500" size={20} /> : <Copy size={20} />}