import { useState, useEffect, useMemo, useCallback } from "react";
import flashcardsData from "../data.jsx";

const STORAGE_KEY = "flashcards_state_simple_repeat_v2";

// --- Utility Functions ---

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Failed to load state from localStorage", error);
    return null;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state to localStorage", error);
  }
};

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const LEARNED_THRESHOLD = 5;

// --- The Custom Hook ---

export const useFlashcards = () => {
  const initialState = loadState();

  const [cards, setCards] = useState(() => {
    if (initialState?.cards) {
      return initialState.cards;
    }
    return flashcardsData.map((card, index) => ({
      ...card,
      id: index,
      knowCount: 0,
      status: "new",
      isFlipped: false,
    }));
  });

  const [selectedCardIds, setSelectedCardIds] = useState(() => {
    return new Set(
      initialState?.selectedCardIds ||
        cards.filter((c) => c.status === "notLearned").map((c) => c.id)
    );
  });

  const [studyQueue, setStudyQueue] = useState(() => {
    return initialState?.studyQueue || [];
  });

  // Effect to save progress to localStorage whenever state changes
  useEffect(() => {
    saveState({
      cards,
      selectedCardIds: Array.from(selectedCardIds),
      studyQueue,
    });
  }, [cards, selectedCardIds, studyQueue]);

  // Effect to rebuild the study queue when the selection changes
  useEffect(() => {
    const filteredAndSorted = cards
      .filter((card) => selectedCardIds.has(card.id))
      .sort((a, b) => b.knowCount - a.knowCount);

    setStudyQueue(Array.from(filteredAndSorted.map((c) => c.id)));
  }, [selectedCardIds]); // Only rebuild when selection changes

  // Memoize derived state to avoid recalculations
  const currentCard = useMemo(() => {
    if (studyQueue.length === 0) return null;
    return cards.find((c) => c.id === studyQueue[0]);
  }, [studyQueue, cards]);

  const stats = useMemo(
    () => ({
      total: cards.length,
      learned: cards.filter((c) => c.status === "learned").length,
      learning: cards.filter((c) => c.status === "learning").length,
      new: cards.filter((c) => c.status === "new").length,
    }),
    [cards]
  );

  // --- Handler Functions (wrapped in useCallback for performance) ---

  const flipCard = useCallback(() => {
    if (!currentCard) return;
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === currentCard.id
          ? { ...card, isFlipped: !card.isFlipped }
          : card
      )
    );
  }, [currentCard]);

  const updateCurrentCard = useCallback(
    (updateFn) => {
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === currentCard.id ? updateFn(card) : card
        )
      );
    },
    [currentCard]
  );

  const handleKnow = useCallback(
    (e) => {
      e.stopPropagation();
      if (!currentCard) return;

      updateCurrentCard((card) => {
        const newKnowCount = card.knowCount + 1;
        return {
          ...card,
          knowCount: newKnowCount,
          status: newKnowCount >= LEARNED_THRESHOLD ? "learned" : "learning",
          isFlipped: false,
        };
      });

      setStudyQueue((prev) => {
        if (prev.length <= 1) return prev;
        const [successfulCardId, ...rest] = prev;
        if (currentCard.knowCount >= LEARNED_THRESHOLD) return rest;
        const reinsertPosition = Math.min(
          2 + currentCard.knowCount * 2 + Math.floor(Math.random() * 3),
          rest.length
        );
        rest.splice(reinsertPosition, 0, successfulCardId);
        return rest;
      });
    },
    [currentCard, updateCurrentCard]
  );

  const handleDontKnow = useCallback(
    (e) => {
      e.stopPropagation();

      if (!currentCard) return;

      updateCurrentCard((card) => ({
        ...card,
        knowCount: Math.max(0, card.knowCount - 1),
        status: "learning",
        isFlipped: false,
      }));

      setStudyQueue((prev) => {
        if (prev.length <= 1) return prev;
        const [failedCardId, ...rest] = prev;
        const reinsertPosition = Math.min(2, rest.length);
        rest.splice(reinsertPosition, 0, failedCardId);
        return rest;
      });
    },
    [currentCard, updateCurrentCard]
  );

  const resetProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const shuffleQueue = useCallback(() => {
    setStudyQueue((prev) => {
      return shuffleArray(prev);
    });
  }, []);

  const toggleCardSelection = useCallback((cardId) => {
    setSelectedCardIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) newSet.delete(cardId);
      else newSet.add(cardId);
      return newSet;
    });
  }, []);

  const selectAll = useCallback(
    () => setSelectedCardIds(new Set(cards.map((c) => c.id))),
    [cards]
  );
  const deselectAll = useCallback(() => setSelectedCardIds(new Set()), []);

  const showOnlyLearned = useCallback(() => {
    setSelectedCardIds(
      new Set(cards.filter((c) => c.status === "learned").map((c) => c.id))
    ),
      [];
  });

  const showOnlyNotLearned = useCallback(() => {
    setSelectedCardIds(
      new Set(
        cards
          .filter((c) => c.status === "new" || c.status === "learning")
          .map((c) => c.id)
      )
    ),
      [];
  });

  return {
    cards,
    studyQueue,
    currentCard,
    stats,
    selectedCardIds,
    flipCard,
    handleKnow,
    handleDontKnow,
    resetProgress,
    toggleCardSelection,
    selectAll,
    deselectAll,
    showOnlyLearned,
    shuffleQueue,
    showOnlyNotLearned,
  };
};
