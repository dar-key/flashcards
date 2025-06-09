import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

import flashcardsData from "../data.jsx";

import { LEARNED_THRESHOLD, STORAGE_KEY } from "../constants";

// --- Utility Functions ---

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- The Custom Hook ---

export const useFlashcards = () => {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(true); // To show a loading message while we fetch data

  const [cards, setCards] = useState([]);
  const [selectedCardIds, setSelectedCardIds] = useState(() => new Set());
  const [studyQueue, setStudyQueue] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      // If there's no logged-in user, load the default data for guest usage
      if (!user) {
        const defaultCards = flashcardsData.map((card, index) => ({
          ...card,
          id: index,
          knowCount: 0,
          status: "new",
          isFlipped: false,
        }));
        setCards(defaultCards);
        setSelectedCardIds(new Set(defaultCards.map((c) => c.id)));
        setIsLoading(false);
        return;
      }

      // If a user is logged in, try to fetch their data
      const docRef = doc(db, "users", user.uid); // Document is named after the user's unique ID
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
        // If the user has saved data, load it
        const userData = docSnap.data();
        setCards(userData.cards);
        setSelectedCardIds(new Set(userData.selectedCardIds));
        setStudyQueue(userData.studyQueue);
      } else {
        // If it's a new user, create their initial data set
        const defaultCards = flashcardsData.map((card, index) => ({
          ...card,
          id: index,
          knowCount: 0,
          status: "new",
          isFlipped: false,
        }));
        setCards(defaultCards);
        const initialIds = new Set(defaultCards.map((c) => c.id));
        setSelectedCardIds(initialIds);
        // Save this initial state to their new document in Firestore
        await setDoc(docRef, {
          cards: defaultCards,
          selectedCardIds: Array.from(initialIds),
          studyQueue: [], // Start with an empty queue
        });
      }
      setIsLoading(false); // We're done loading
    };

    loadData();
  }, [user]); // This effect runs ONLY when the user logs in or out.

  useEffect(() => {
    // Don't save if there's no user, or if we are still in the initial loading state
    if (!user || isLoading) {
      return;
    }

    // Debounce the save function to avoid writing to Firestore on every single change.
    // This saves after 2 seconds of inactivity, which is much more efficient.
    const debouncedSave = setTimeout(() => {
      const docRef = doc(db, "users", user.uid);
      const payload = {
        cards,
        selectedCardIds: Array.from(selectedCardIds),
        studyQueue,
      };
      setDoc(docRef, payload, { merge: true }); // { merge: true } prevents overwriting other fields
    }, 2000);

    // Cleanup function to cancel the timeout if the component unmounts or state changes again
    return () => clearTimeout(debouncedSave);
  }, [cards, selectedCardIds, studyQueue, user, isLoading]);

  // Effect to update the study queue when selection changes - PRESERVING ORDER
  useEffect(() => {
    if (isLoading) return;

    setStudyQueue((prevQueue) => {
      // Remove deselected cards from the queue
      const filteredQueue = prevQueue.filter((cardId) =>
        selectedCardIds.has(cardId)
      );

      // Find newly selected cards that aren't in the queue yet
      const existingInQueue = new Set(filteredQueue);
      const newlySelectedCards = cards
        .filter(
          (card) =>
            selectedCardIds.has(card.id) && !existingInQueue.has(card.id)
        )
        .sort((a, b) => b.knowCount - a.knowCount); // Sort new cards by knowCount

      // Add newly selected cards to the end of the queue (or you could add them at the beginning)
      return [...filteredQueue, ...newlySelectedCards.map((c) => c.id)];
    });
  }, [selectedCardIds, cards]);

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
          3 + currentCard.knowCount * 2 + Math.floor(Math.random() * 3),
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
    const shouldReset = confirm(
      "Вы уверены, что хотите сбросить весь прогресс?"
    );
    if (!shouldReset) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const shuffleQueue = useCallback(() => {
    setStudyQueue((prev) => {
      return shuffleArray(prev);
    });
  }, []);

  // Effect to handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input field
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      switch (e.code) {
        case "Space":
        case "ArrowUp":
        case "ArrowDown":
          e.preventDefault();
          flipCard();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      // Ignore if user is typing in an input field
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [flipCard, handleKnow, handleDontKnow]); // Dependencies for the keyboard handler

  // Function to rebuild queue with fresh order (if you want to provide this option)
  const rebuildQueue = useCallback(() => {
    const filteredAndSorted = cards
      .filter((card) => selectedCardIds.has(card.id))
      .sort((a, b) => b.knowCount - a.knowCount);

    setStudyQueue(filteredAndSorted.map((c) => c.id));
  }, [cards, selectedCardIds]);

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

  const showOnlyLearned = useCallback(() => {
    setSelectedCardIds(
      new Set(cards.filter((c) => c.status === "learned").map((c) => c.id))
    );
  }, [cards]);

  const continueLearning = useCallback(() => {
    setSelectedCardIds(
      new Set(
        cards
          .filter((c) => c.status === "new" || c.status === "learning")
          .map((c) => c.id)
      )
    );
  }, [cards]);

  return {
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
    rebuildQueue, // New function to rebuild queue if needed
  };
};
