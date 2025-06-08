// src/components/FlashcardView.jsx

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import CardStatus from "./CardStatus";

const FlashcardView = ({ card, onFlip, onKnow, onDontKnow, activeButton }) => {
  return (
    <div className="mb-6 select-none">
      {/* The card itself */}
      <div
        className="relative bg-neutral-800 rounded-xl p-8 min-h-[300px] flex flex-col justify-center items-center cursor-pointer hover:bg-neutral-700/50 transition-colors"
        onClick={onFlip}
      >
        <div className="text-center">
          <div className="text-lg font-semibold text-neutral-400 mb-4">
            {card.isFlipped ? "Ответ:" : "Вопрос:"}
          </div>
          <div className="text-xl text-white leading-relaxed text-balance">
            {card.isFlipped ? card.answer : card.question}
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <CardStatus status={card.status} knowCount={card.knowCount} />
          <div className="text-sm text-neutral-500">
            {card.isFlipped ? "Нажмите для вопроса" : "Нажмите для ответа"}
          </div>
        </div>

        {card.isFlipped && (
          <div className="flex gap-4 justify-center mt-6 absolute bottom-6 z-10">
            <button
              onClick={onKnow}
              className={`flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-lg text-white font-semibold`}
            >
              <CheckCircle size={24} /> Знаю
            </button>
            <button
              onClick={onDontKnow}
              className={`flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 transition-colors rounded-lg text-white font-semibold`}
            >
              <XCircle size={24} /> Не знаю
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardView;
