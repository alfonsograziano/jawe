import { useState } from "react";

export function useUndoRedo<T>() {
  const [history, setHistory] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const set = (newValue: T) => {
    const updatedHistory = [...history.slice(0, currentIndex + 1), newValue];
    setHistory(updatedHistory);
    setCurrentIndex(updatedHistory.length - 1);
  };

  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return {
    value: history[currentIndex] || null,
    set,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
  };
}
