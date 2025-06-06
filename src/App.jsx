import React, { useState, useEffect } from "react";
import {
  Shuffle,
  RotateCcw,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react";
import flashcardsData from "./data.jsx";

const STORAGE_KEY = "flashcards_state_simple_repeat_v2";

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
};

// Function to shuffle an array
const shuffleArray = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

const App = () => {
  const initialState = loadState();

  const [cards, setCards] = useState(() => {
    if (initialState?.cards) return initialState.cards;
    return flashcardsData.map((card, index) => ({
      ...card,
      id: index,
      knowCount: 0,
      status: "new",
      isFlipped: false,
    }));
  });

  const [selectedCards, setSelectedCards] = useState(
    () => new Set(initialState?.selectedCards || cards.map((c) => c.id))
  );

  const [studyQueue, setStudyQueue] = useState([]);
  const [showStats, setShowStats] = useState(false);

  // THIS IS THE CORRECTED EFFECT
  // It now ONLY runs when the card selection changes, NOT every time a card flips.
  useEffect(() => {
    // Find all the cards the user has selected
    const filteredById = flashcardsData.filter((card) =>
      selectedCards.has(card.id)
    );

    // Get the full, up-to-date card objects from the main `cards` state
    const filteredCardsFromState = cards.filter((card) =>
      selectedCards.has(card.id)
    );

    // Sort them by how well they are known
    const sorted = filteredCardsFromState.sort(
      (a, b) => a.knowCount - b.knowCount
    );

    // Shuffle the queue and set it
    setStudyQueue(shuffleArray(sorted.map((c) => c.id)));
  }, [selectedCards]);

  useEffect(() => {
    // This effect saves progress to localStorage
    saveState({
      cards,
      selectedCards: Array.from(selectedCards),
    });
  }, [cards, selectedCards]);

  const currentCardId = studyQueue.length > 0 ? studyQueue[0] : null;
  const currentCard =
    currentCardId !== null ? cards.find((c) => c.id === currentCardId) : null;

  const handleCardClick = () => {
    if (!currentCard) return;

    // This function now ONLY handles flipping the card. It doesn't cause a reshuffle.
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === currentCard.id
          ? { ...card, isFlipped: !card.isFlipped }
          : card
      )
    );
  };

  const handleKnow = () => {
    if (!currentCard) return;

    // Update the master card's state
    setCards((prev) =>
      prev.map((card) => {
        if (card.id === currentCard.id) {
          const newKnowCount = card.knowCount + 1;
          return {
            ...card,
            knowCount: newKnowCount,
            status: newKnowCount >= 5 ? "learned" : "learning",
            isFlipped: false, // Reset flip state for next time
          };
        }
        return card;
      })
    );

    // Advance the queue by removing the card from the front
    setStudyQueue((prev) => prev.slice(1));
  };

  const handleDontKnow = () => {
    if (!currentCard) return;

    // Update the master card's state
    setCards((prev) =>
      prev.map((card) =>
        card.id === currentCard.id
          ? {
              ...card,
              knowCount: Math.max(0, card.knowCount - 2),
              status: "learning",
              isFlipped: false, // Reset flip state for next time
            }
          : card
      )
    );

    // Move the failed card to a few places back in the queue
    setStudyQueue((prev) => {
      if (prev.length <= 1) return prev;

      const newQueue = [...prev];
      const failedCardId = newQueue.shift();
      const reinsertPosition = Math.min(2, newQueue.length);
      newQueue.splice(reinsertPosition, 0, failedCardId);

      return newQueue;
    });
  };

  const resetProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const toggleCardSelection = (cardId) => {
    setSelectedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) newSet.delete(cardId);
      else newSet.add(cardId);
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedCards(new Set(cards.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedCards(new Set());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "learned":
        return "text-green-600";
      case "learning":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const stats = {
    total: cards.length,
    learned: cards.filter((c) => c.status === "learned").length,
    learning: cards.filter((c) => c.status === "learning").length,
    new: cards.filter((c) => c.status === "new").length,
  };

  return (
    <div className="min-h-screen w-screen flex justify-center items-center bg-neutral-900 text-neutral-100">
      <div className="w-full max-w-4xl p-6">
        {/* ... The rest of your JSX remains the same ... */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">История Казахстана</h1>
          <p className="text-neutral-400">
            Изучайте историю с помощью карточек
          </p>
        </div>

        <div className="bg-neutral-800 rounded-xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white flex items-center gap-2"
            >
              <BarChart3 size={20} /> Статистика
            </button>
            <button
              onClick={resetProgress}
              className="px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm"
            >
              Сбросить прогресс
            </button>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm"
              >
                Выбрать все
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm"
              >
                Снять все
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-neutral-400">
            Осталось карточек в этой сессии: {studyQueue.length}
          </div>
        </div>

        {showStats && (
          <div className="bg-neutral-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Статистика изучения</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(stats).map((key) => (
                <div className="text-center" key={key}>
                  <div className={`text-2xl font-bold ${getStatusColor(key)}`}>
                    {stats[key]}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {
                      {
                        total: "Всего",
                        learned: "Изучено",
                        learning: "Изучаю",
                        new: "Новые",
                      }[key]
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentCard ? (
          <div className="mb-6">
            <div
              className="bg-neutral-800 rounded-xl p-8 min-h-[300px] flex flex-col justify-center items-center cursor-pointer hover:bg-neutral-700 transition-colors"
              onClick={handleCardClick}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-neutral-400 mb-4">
                  {currentCard.isFlipped ? "Ответ:" : "Вопрос:"}
                </div>
                <div className="text-xl text-white leading-relaxed text-balance">
                  {currentCard.isFlipped
                    ? currentCard.answer
                    : currentCard.question}
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div
                  className={`flex items-center gap-2 ${getStatusColor(
                    currentCard.status
                  )}`}
                >
                  {currentCard.status === "learned" && (
                    <CheckCircle size={20} />
                  )}
                  <span className="text-sm font-medium">
                    {currentCard.status === "learned" && "Изучено"}
                    {currentCard.status === "learning" &&
                      `Изучаю (${currentCard.knowCount}/5)`}
                    {currentCard.status === "new" && `Новое (0/5)`}
                  </span>
                </div>
                <div className="text-sm text-neutral-500">
                  {currentCard.isFlipped
                    ? "Нажмите для вопроса"
                    : "Нажмите для ответа"}
                </div>
              </div>
            </div>

            {currentCard.isFlipped && (
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={handleKnow}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-semibold"
                >
                  <CheckCircle size={24} /> Знаю
                </button>
                <button
                  onClick={handleDontKnow}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold"
                >
                  <XCircle size={24} /> Не знаю
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-neutral-500 text-xl bg-neutral-800 rounded-xl p-8">
            {selectedCards.size > 0
              ? "Все карточки в этой сессии изучены!"
              : "Выберите карточки для изучения."}
          </div>
        )}

        <div className="bg-neutral-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">
            Выбор карточек для изучения
          </h3>
          <div className="max-h-60 overflow-y-auto">
            <div className="grid gap-2">
              {cards.map((card, index) => (
                <div
                  key={card.id}
                  className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer ${
                    selectedCards.has(card.id)
                      ? "bg-neutral-700 border border-neutral-500"
                      : "hover:bg-neutral-700"
                  }`}
                  onClick={() => toggleCardSelection(card.id)}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white truncate">
                      {index + 1}. {card.question}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className={`text-xs px-2 py-1 rounded ${getStatusColor(
                        card.status
                      )} bg-opacity-20`}
                    >
                      {card.status === "learned" && "✓"}
                      {card.status === "learning" && `${card.knowCount}/5`}
                      {card.status === "new" && "0/5"}
                    </span>
                    {selectedCards.has(card.id) ? (
                      <Eye size={16} className="text-white" />
                    ) : (
                      <EyeOff size={16} className="text-neutral-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
