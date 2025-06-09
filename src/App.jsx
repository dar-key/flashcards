// src/App.jsx

import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import { useFlashcards } from "./hooks/useFlashcards";

import StatsDisplay from "./components/StatsDisplay";
import FlashcardView from "./components/FlashcardView";
import CardSelector from "./components/CardSelector";
import Auth from "./components/AuthComponent";

const App = () => {
  const [showStats, setShowStats] = useState(false);
  const {
    cards,
    studyQueue,
    currentCard,
    stats,
    selectedCardIds,
    isLoading,
    flipCard,
    handleKnow,
    handleDontKnow,
    resetProgress,
    toggleCardSelection,
    selectAll,
    showOnlyLearned,
    shuffleQueue,
    continueLearning,
  } = useFlashcards();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex justify-center items-center bg-neutral-900 text-neutral-100">
        <h2 className="text-2xl font-bold">Loading Your Progress...</h2>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-screen flex justify-center items-center bg-neutral-900 text-neutral-100 font-sans">
      <div className="w-full max-w-4xl p-6">
        <Auth />

        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">История Казахстана</h1>
          <p className="text-neutral-400">
            Изучайте историю с помощью карточек
          </p>
        </header>

        <main>
          {/* Controls */}
          <div className="bg-neutral-800 rounded-xl p-6 mb-6">
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white flex items-center gap-2"
              >
                <BarChart3 size={20} /> Статистика
              </button>
              <button
                onClick={shuffleQueue}
                className="px-3 py-2 rounded-lg text-white text-sm"
              >
                Перемешать
              </button>
              <button
                onClick={showOnlyLearned}
                className="px-3 py-2 rounded-lg text-white text-sm"
              >
                Повторить изученное
              </button>
              <button
                onClick={continueLearning}
                className="px-3 py-2 rounded-lg text-white text-sm"
              >
                Учить
              </button>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-2 rounded-lg text-white text-sm"
                >
                  Выбрать все
                </button>
                <button
                  onClick={resetProgress}
                  className="px-3 py-2 rounded-lg hover text-white text-sm"
                >
                  Сбросить прогресс
                </button>
              </div>
            </div>
            <div className="mt-4 text-center text-neutral-400">
              Осталось карточек в этой сессии: {studyQueue.length}
            </div>
          </div>

          {showStats && <StatsDisplay stats={stats} />}

          {currentCard ? (
            <FlashcardView
              card={currentCard}
              onFlip={flipCard}
              onKnow={handleKnow}
              onDontKnow={handleDontKnow}
            />
          ) : (
            <div className="text-center text-neutral-500 text-xl bg-neutral-800 rounded-xl p-8 mb-6">
              {selectedCardIds.size > 0
                ? "Все карточки в этой сессии изучены!"
                : "Выберите карточки для изучения."}
            </div>
          )}

          <CardSelector
            cards={cards}
            selectedIds={selectedCardIds}
            onToggle={toggleCardSelection}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
