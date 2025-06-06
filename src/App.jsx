import React, { useState, useEffect } from "react";
import {
  Shuffle,
  RotateCcw,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  BarChart3,
  Clock,
  Target,
} from "lucide-react";

// Sample flashcard data - replace with your actual data
import flashcardsData from "./dataSample";

const STORAGE_KEY = "flashcards_state_.";

const saveState = (state) => {
  try {
    const stateToSave = {
      ...state,
      selectedCards: Array.from(state.selectedCards),
    };
    // Using in-memory storage instead of localStorage
    window.flashcardState = stateToSave;
  } catch (error) {
    console.error("Error saving state:", error);
  }
};

const loadState = () => {
  try {
    const saved = window.flashcardState;
    if (saved) {
      return {
        ...saved,
        selectedCards: new Set(saved.selectedCards),
      };
    }
    return null;
  } catch (error) {
    console.error("Error loading state:", error);
    return null;
  }
};

// Spaced repetition algorithm
const getNextReviewTime = (knowCount, difficulty = 1) => {
  const intervals = [1, 3, 7, 14, 30]; // days
  const index = Math.min(knowCount, intervals.length - 1);
  return Date.now() + intervals[index] * 24 * 60 * 60 * 1000 * difficulty;
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
      difficulty: 1.0,
      nextReview: Date.now(),
      lastReviewed: null,
      reviewCount: 0,
      consecutiveCorrect: 0,
    }));
  });

  const [currentCardIndex, setCurrentCardIndex] = useState(
    initialState?.currentCardIndex || 0
  );
  const [selectedCards, setSelectedCards] = useState(
    initialState?.selectedCards || new Set(flashcardsData.map((_, i) => i))
  );
  const [shuffledOrder, setShuffledOrder] = useState(
    initialState?.shuffledOrder || null
  );
  const [showStats, setShowStats] = useState(false);
  const [studyMode, setStudyMode] = useState(
    initialState?.studyMode || "review" // "review", "new", "all"
  );

  // Save state whenever key state changes
  useEffect(() => {
    saveState({
      cards,
      currentCardIndex,
      selectedCards,
      shuffledOrder,
      studyMode,
    });
  }, [cards, currentCardIndex, selectedCards, shuffledOrder, studyMode]);

  const getFilteredCards = () => {
    let filtered = cards.filter((card) => selectedCards.has(card.id));

    // Apply study mode filter
    const now = Date.now();
    switch (studyMode) {
      case "review":
        filtered = filtered.filter(
          (card) => card.nextReview <= now && card.status !== "new"
        );
        break;
      case "new":
        filtered = filtered.filter((card) => card.status === "new");
        break;
    }

    // FIXED: Shuffle the base cards BEFORE creating repetitions
    if (shuffledOrder) {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }

    // Create study deck with repetitions AFTER shuffling
    const studyDeck = [];
    filtered.forEach((card) => {
      let repetitions = 1;

      if (card.status === "new") {
        repetitions = 2;
      } else if (card.status === "learning") {
        repetitions = Math.max(1, Math.floor(3 - card.consecutiveCorrect));
      } else if (card.status === "learned") {
        repetitions = card.nextReview <= Date.now() ? 1 : 0;
      }

      for (let i = 0; i < repetitions; i++) {
        studyDeck.push(card);
      }
    });

    return studyDeck;
  };

  const filteredCards = getFilteredCards();
  const currentCard = filteredCards[currentCardIndex];

  const [flippedCards, setFlippedCards] = useState(new Set());

  const handleCardClick = () => {
    if (!currentCard) return;

    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentCardIndex)) {
        newSet.delete(currentCardIndex);
      } else {
        newSet.add(currentCardIndex);
      }
      return newSet;
    });
  };

  const isCurrentCardFlipped = flippedCards.has(currentCardIndex);

  const updateCardProgress = (cardId, isCorrect) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id === cardId) {
          const now = Date.now();
          let newKnowCount = card.knowCount;
          let newStatus = card.status;
          let newDifficulty = card.difficulty;
          let newConsecutiveCorrect = card.consecutiveCorrect;

          if (isCorrect) {
            newKnowCount += 1;
            newConsecutiveCorrect += 1;
            newDifficulty = Math.max(0.5, newDifficulty - 0.1);

            if (newKnowCount >= 5 && newConsecutiveCorrect >= 3) {
              newStatus = "learned";
            } else if (newKnowCount >= 1) {
              newStatus = "learning";
            }
          } else {
            newKnowCount = Math.max(0, newKnowCount - 1);
            newConsecutiveCorrect = 0;
            newDifficulty = Math.min(2.0, newDifficulty + 0.2);
            newStatus = newKnowCount === 0 ? "new" : "learning";
          }

          return {
            ...card,
            knowCount: newKnowCount,
            status: newStatus,
            difficulty: newDifficulty,
            consecutiveCorrect: newConsecutiveCorrect,
            nextReview: getNextReviewTime(newKnowCount, newDifficulty),
            lastReviewed: now,
            reviewCount: card.reviewCount + 1,
            isFlipped: false,
          };
        }
        return card;
      })
    );
  };

  const handleKnow = () => {
    if (!currentCard) return;
    updateCardProgress(currentCard.id, true);

    // Clear flip state for current position
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(currentCardIndex);
      return newSet;
    });

    nextCard();
  };

  const handleDontKnow = () => {
    if (!currentCard) return;
    updateCardProgress(currentCard.id, false);

    // Clear flip state for current position
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(currentCardIndex);
      return newSet;
    });

    nextCard();
  };

  const nextCard = () => {
    if (filteredCards.length > 1) {
      setCurrentCardIndex((prev) => (prev + 1) % filteredCards.length);
    }
  };

  const shuffleCards = () => {
    setShuffledOrder(true);
    setCurrentCardIndex(0);
    setFlippedCards(new Set()); // ADD THIS LINE - clear all flip states
  };

  const resetOrder = () => {
    setShuffledOrder(null);
    setCurrentCardIndex(0);
    setFlippedCards(new Set()); // ADD THIS LINE - clear all flip states
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
        return "text-green-400";
      case "learning":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty >= 1.5) return "text-red-400";
    if (difficulty >= 1.2) return "text-yellow-400";
    return "text-green-400";
  };

  const stats = {
    total: cards.length,
    learned: cards.filter((c) => c.status === "learned").length,
    learning: cards.filter((c) => c.status === "learning").length,
    new: cards.filter((c) => c.status === "new").length,
    dueReview: cards.filter((c) => c.nextReview <= Date.now()).length,
  };

  const resetProgress = () => {
    window.flashcardState = null;
    window.location.reload();
  };

  const formatTimeUntilReview = (nextReview) => {
    const now = Date.now();
    const diff = nextReview - now;

    if (diff <= 0) return "Готово к изучению";

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) return `${days}д ${hours}ч`;
    return `${hours}ч`;
  };

  return (
    <div className="min-h-screen w-screen flex justify-center items-center bg-neutral-900 text-neutral-100">
      <div className="w-full max-w-4xl p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">История Казахстана</h1>
          <p className="text-neutral-400">
            Изучайте историю с помощью карточек и интервальных повторений
          </p>
        </div>

        <div className="bg-neutral-800 rounded-xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 justify-center items-center mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setStudyMode("review")}
                className={`px-4 py-2 rounded-lg ${
                  studyMode === "review"
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-700 hover:bg-neutral-600 text-white"
                }`}
              >
                <Clock size={16} className="inline mr-2" />
                Повторение
              </button>
              <button
                onClick={() => setStudyMode("new")}
                className={`px-4 py-2 rounded-lg ${
                  studyMode === "new"
                    ? "bg-green-600 text-white"
                    : "bg-neutral-700 hover:bg-neutral-600 text-white"
                }`}
              >
                <Target size={16} className="inline mr-2" />
                Новые
              </button>
              <button
                onClick={() => setStudyMode("all")}
                className={`px-4 py-2 rounded-lg ${
                  studyMode === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-neutral-700 hover:bg-neutral-600 text-white"
                }`}
              >
                Все
              </button>
            </div>

            <button
              onClick={shuffleCards}
              className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white"
            >
              <Shuffle size={20} className="inline mr-2" />
              Перемешать
            </button>
            <button
              onClick={resetOrder}
              className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white"
            >
              <RotateCcw size={20} className="inline mr-2" />
              Сбросить
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white"
            >
              <BarChart3 size={20} className="inline mr-2" />
              Статистика
            </button>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={resetProgress}
              className="px-3 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm"
            >
              Сбросить прогресс
            </button>
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

          <div className="mt-4 text-center text-neutral-400">
            <div>
              Карточка {currentCardIndex + 1} из {filteredCards.length} в режиме
              "
              {studyMode === "review"
                ? "Повторение"
                : studyMode === "new"
                ? "Новые"
                : "Все"}
              "
            </div>
            {filteredCards.length < cards.length && (
              <div className="text-sm text-neutral-500">
                (всего карточек: {cards.length})
              </div>
            )}
            {shuffledOrder && (
              <span className="text-sm text-yellow-400">(перемешано)</span>
            )}
          </div>
        </div>

        {showStats && (
          <div className="bg-neutral-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Статистика изучения</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {["total", "learned", "learning", "new", "dueReview"].map(
                (key) => (
                  <div className="text-center" key={key}>
                    <div
                      className={`text-2xl font-bold ${
                        key === "dueReview"
                          ? "text-orange-400"
                          : getStatusColor(key)
                      }`}
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
                          dueReview: "К повторению",
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
                  {isCurrentCardFlipped ? "Ответ:" : "Вопрос:"}
                </div>
                <div className="text-xl text-white leading-relaxed text-balance">
                  {isCurrentCardFlipped
                    ? currentCard.answer
                    : currentCard.question}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
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
                  Сложность:{" "}
                  <span className={getDifficultyColor(currentCard.difficulty)}>
                    {currentCard.difficulty.toFixed(1)}
                  </span>
                </div>
                <div className="text-sm text-neutral-500">
                  Повторений: {currentCard.reviewCount}
                </div>
                <div className="text-sm text-neutral-500">
                  Следующее: {formatTimeUntilReview(currentCard.nextReview)}
                </div>
              </div>
              <div className="mt-2 text-sm text-neutral-500">
                {isCurrentCardFlipped
                  ? "Нажмите для вопроса"
                  : "Нажмите для ответа"}
              </div>
            </div>

            {isCurrentCardFlipped && (
              <div className="flex gap-4 justify-center mt-6">
                <button
                  onClick={handleKnow}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-semibold transition-colors"
                >
                  <CheckCircle size={24} /> Знаю
                </button>
                <button
                  onClick={handleDontKnow}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold transition-colors"
                >
                  <XCircle size={24} /> Не знаю
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-neutral-500 text-xl">
            {studyMode === "review"
              ? "Нет карточек для повторения"
              : studyMode === "new"
              ? "Нет новых карточек"
              : "Нет выбранных карточек для изучения"}
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
                  className={`flex items-center justify-between p-3 rounded transition-colors cursor-pointer ${
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
                    <div className="text-xs text-neutral-400 mt-1">
                      Повторений: {card.reviewCount} | Сложность:{" "}
                      <span className={getDifficultyColor(card.difficulty)}>
                        {card.difficulty.toFixed(1)}
                      </span>{" "}
                      | Следующее: {formatTimeUntilReview(card.nextReview)}
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
