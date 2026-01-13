import { CircleCheckBig } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  success: string | null;
};

const SuccessAlert = ({ success }: Props) => {
  if (!success) return null;

  return (
    <div className="bg-background dark:text-white dark:bg-green-800 rounded-lg p-3 items-center mt-4 flex gap-4 ">
      <CircleCheckBig className="text-green-500 " />
      <div className="text-left">
        <h4 className="text-sm font-medium">Success</h4>
        <p className="text-xs opacity-80">{success}</p>
      </div>
    </div>
  );
};

export default SuccessAlert;
