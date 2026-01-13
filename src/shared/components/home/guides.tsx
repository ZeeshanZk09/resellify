"use client";
import { Check, Copy } from "lucide-react";
import React, { useState } from "react";
import {
  clone,
  copy_variables,
  install,
  prisma,
  run,
  variables,
} from "@/shared/lib/guides";

const Guides = () => {
  return (
    <section id="guides" className="pt-20">
      <h2 className="text-xl font-medium">Get Started</h2>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        To get started with this project, follow the steps below:
      </p>
      <ol className="list-decimal list-inside   space-y-5 mt-6">
        <li>
          <h4 className="inline-block">Clone the repository</h4>
          <Code code={clone} />
        </li>
        <li>
          <h4 className="inline-block">Install dependencies</h4>
          <Code code={install} />
        </li>
        <li>
          <h4 className="inline-block">Set up environment variables</h4>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            To configure the environment variables, create a `.env` file in the
            root of the project and set the following variables:
          </p>
          <Code code={variables} copyCode={copy_variables} />
        </li>
        <li className="">
          <h4 className="inline-block">Generate Prisma client</h4>
          <Code code={prisma} />
        </li>
        <li className="">
          <h4 className="inline-block">run and enjoy</h4>
          <Code code={run} />
        </li>
      </ol>
    </section>
  );
};

const Code = ({
  code,
  copyCode = undefined,
}: {
  code: string;
  copyCode?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyCode ? copyCode : code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 sec
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };
  return (
    <pre className="relative">
      <code className="inline-block">{code}</code>
      <button
        className="absolute top-1 right-1 transition-opacity cursor-pointer p-2 opacity-75 hover:opacity-100"
        onClick={handleCopy}
      >
        {copied ? <Check size={16} /> : <Copy size={18} />}
      </button>
    </pre>
  );
};

export default Guides;
