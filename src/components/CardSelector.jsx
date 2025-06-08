// src/components/CardSelector.jsx

import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { getStatusColor } from "../utils/styleUtils";

const LEARNED_THRESHOLD = 5;

const CardSelector = ({ cards, selectedIds, onToggle }) => {
  return (
    <div className="bg-neutral-800 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">Выбор карточек для изучения</h3>
      <div className="max-h-60 overflow-y-auto overflow-x-hidden">
        <div className="grid gap-2">
          {cards.map((card, index) => {
            const isSelected = selectedIds.has(card.id);
            return (
              <div
                key={card.id}
                className={`flex items-center justify-between w-full p-2 rounded transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-neutral-700 border border-neutral-500"
                    : "hover:bg-neutral-700"
                }`}
                onClick={() => onToggle(card.id)}
              >
                <div className="flex-1 w-0 overflow-hidden">
                  <div className="text-sm font-medium text-white truncate">
                    {index + 1}. {card.question}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-mono ${getStatusColor(
                      card.status
                    )} bg-neutral-900/50`}
                  >
                    {card.status === "learned" && "✓"}
                    {card.status === "learning" &&
                      `${card.knowCount}/${LEARNED_THRESHOLD}`}
                    {card.status === "new" && `0/${LEARNED_THRESHOLD}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CardSelector;
