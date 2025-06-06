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

const STORAGE_KEY = "flashcards_state";

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
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

  const [currentCardIndex, setCurrentCardIndex] = useState(
    initialState?.currentCardIndex || 0
  );
  const [selectedCards, setSelectedCards] = useState(
    () => new Set(initialState?.selectedCards || cards.map((c) => c.id))
  );
  const [shuffledOrder, setShuffledOrder] = useState(
    initialState?.shuffledOrder || null
  );
  const [showStats, setShowStats] = useState(false);

  // Save to localStorage whenever key state changes
  useEffect(() => {
    saveState({
      cards,
      currentCardIndex,
      selectedCards: Array.from(selectedCards),
      shuffledOrder,
    });
  }, [cards, currentCardIndex, selectedCards, shuffledOrder]);

  const getFilteredCards = () => {
    const filtered = cards.filter((card) => selectedCards.has(card.id));

    if (shuffledOrder) {
      return shuffledOrder
        .map((id) => filtered.find((card) => card.id === id))
        .filter((card) => card !== undefined);
    }

    return filtered;
  };

  const filteredCards = getFilteredCards();
  const currentCard = filteredCards[currentCardIndex];

  const handleCardClick = () => {
    if (!currentCard) return;

    setCards((prev) =>
      prev.map((card) =>
        card.id === currentCard.id
          ? { ...card, isFlipped: !card.isFlipped }
          : card
      )
    );
  };

  const handleKnow = () => {
    if (!currentCard) return;

    setCards((prev) =>
      prev.map((card) => {
        if (card.id === currentCard.id) {
          const newKnowCount = card.knowCount + 1;
          const newStatus = newKnowCount >= 5 ? "learned" : "learning";
          return {
            ...card,
            knowCount: newKnowCount,
            status: newStatus,
            isFlipped: false,
          };
        }
        return card;
      })
    );

    nextCard();
  };

  const handleDontKnow = () => {
    if (!currentCard) return;

    setCards((prev) =>
      prev.map((card) =>
        card.id === currentCard.id
          ? {
              ...card,
              knowCount:
                currentCard.knowCount < 2 ? 0 : currentCard.knowCount - 2,
              status: "learning",
              isFlipped: false,
            }
          : card
      )
    );

    nextCard();
  };

  const nextCard = () => {
    if (filteredCards.length > 1) {
      setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length);
    }
  };

  const shuffleCards = () => {
    const currentFiltered = cards.filter((card) => selectedCards.has(card.id));
    const shuffled = [...currentFiltered].sort(() => Math.random() - 0.5);
    setShuffledOrder(shuffled.map((card) => card.id));
    setCurrentCardIndex(0);
  };

  const resetOrder = () => {
    setShuffledOrder(null);
    setCurrentCardIndex(0);
  };

  const toggleCardSelection = (cardId) => {
    setSelectedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
    setCurrentCardIndex(0);
    setShuffledOrder(null);
  };

  const selectAll = () => {
    setSelectedCards(new Set(cards.map((c) => c.id)));
    setCurrentCardIndex(0);
    setShuffledOrder(null);
  };

  const deselectAll = () => {
    setSelectedCards(new Set());
    setCurrentCardIndex(0);
    setShuffledOrder(null);
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

  const resetProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-screen flex justify-center items-center bg-neutral-900 text-neutral-100">
      <div className="w-full max-w-4xl p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">История Казахстана</h1>
          <p className="text-neutral-400">
            Изучайте историю с помощью карточек
          </p>
        </div>

        <div className="bg-neutral-800 rounded-xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <button
              onClick={shuffleCards}
              className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white"
            >
              <Shuffle size={20} /> Перемешать
            </button>
            <button
              onClick={resetOrder}
              className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white"
            >
              <RotateCcw size={20} /> Сбросить порядок
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white"
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
            Карточка {currentCardIndex + 1} из {filteredCards.length} выбранных
            {filteredCards.length < cards.length && (
              <span className="text-sm text-neutral-500 ml-2">
                (всего {cards.length})
              </span>
            )}
            {shuffledOrder && (
              <span className="text-sm text-yellow-400 ml-2">(перемешано)</span>
            )}
          </div>
        </div>

        {showStats && (
          <div className="bg-neutral-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Статистика изучения</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["total", "learned", "learning", "new"].map(
                (key) => (
                  <div className="text-center" key={key}>
                    <div
                      className={`text-2xl font-bold ${getStatusColor(key)}`}
                    >
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
                )
              )}
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
                    {currentCard.status === "new" && "Новое"}
                  </span>
                </div>
                <div className="text-sm text-neutral-500">
                  {currentCard.isFlipped
                    ? "Нажмите для вопроса"
                    : "Нажмите для ответа"}
                </div>
              </div>
            </div>

            {!currentCard.isFlipped && (
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={handleKnow}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-green-500 font-semibold"
                >
                  <CheckCircle size={24} /> Знаю
                </button>
                <button
                  onClick={handleDontKnow}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-red-500 font-semibold"
                >
                  <XCircle size={24} /> Не знаю
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-neutral-500 text-xl">
            Нет выбранных карточек для изучения
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
                      {card.status === "new" && "•"}
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
