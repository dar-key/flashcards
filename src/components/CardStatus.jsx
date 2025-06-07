// src/components/CardStatus.jsx

import React from "react";
import { CheckCircle } from "lucide-react";
import { getStatusColor } from "../utils/styleUtils";

const LEARNED_THRESHOLD = 5;

const CardStatus = ({ status, knowCount, className = "" }) => {
  const statusColor = getStatusColor(status);

  const renderStatus = () => {
    if (status === "learned") {
      return (
        <>
          <CheckCircle size={20} />
          <span>Изучено</span>
        </>
      );
    }
    if (status === "learning") {
      return `Изучаю (${knowCount}/${LEARNED_THRESHOLD})`;
    }
    return `Новое (0/${LEARNED_THRESHOLD})`;
  };

  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium ${statusColor} ${className}`}
    >
      {renderStatus()}
    </div>
  );
};

export default CardStatus;
