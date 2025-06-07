// src/components/StatsDisplay.jsx

import React from "react";
import { getStatusColor } from "../utils/styleUtils";

const statLabels = {
  total: "Всего",
  learned: "Изучено",
  learning: "Изучаю",
  new: "Новые",
};

const StatsDisplay = ({ stats }) => {
  return (
    <div className="bg-neutral-800 rounded-xl p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Статистика изучения</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div className="text-center" key={key}>
            <div className={`text-2xl font-bold ${getStatusColor(key)}`}>
              {value}
            </div>
            <div className="text-sm text-neutral-400">{statLabels[key]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsDisplay;
