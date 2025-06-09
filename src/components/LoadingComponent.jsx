// src/components/FullScreenLoader.jsx

import React from "react";
import { Loader2 } from "lucide-react"; // We'll use the 'Loader2' icon for a nice spin effect

const LoadingComponent = ({ text = "Loading..." }) => {
  return (
    // The main overlay div
    <div
      className="
        fixed inset-0 z-50          
        flex flex-col items-center justify-center 
        bg-black/70 backdrop-blur-sm 
      "
    >
      {/* The spinning icon */}
      <Loader2 className="h-16 w-16 animate-spin text-white" />

      {/* The optional text below the spinner */}
      <p className="mt-4 text-xl font-semibold text-white">{text}</p>
    </div>
  );
};

export default LoadingComponent;
