// src/utils/styleUtils.js

export const getStatusColor = (status) => {
  switch (status) {
    case "learned":
      return "text-green-500";
    case "learning":
      return "text-blue-400";
    default:
      return "text-gray-500";
  }
};
