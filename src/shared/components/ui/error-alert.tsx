import { TriangleAlert } from "lucide-react";
import React from "react";

type Props = {
  error: string | null;
};

const ErrorAlert = ({ error }: Props) => {
  if (!error) return null;
  console.log(error);
  return (
    <div className="bg-destructive/5 rounded-lg p-3 items-center mt-4 flex gap-4 ">
      <TriangleAlert className="text-destructive/70" />
      <div className="text-left">
        <h4 className="text-sm font-medium">Error</h4>
        <p className="text-xs opacity-80">
          {typeof error !== "string" ? "Something went wrong" : error}
        </p>
      </div>
    </div>
  );
};

export default ErrorAlert;
