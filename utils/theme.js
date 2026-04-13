export const getPercentColor = (percent) => {
  if (percent === 0) return "#808080";
  if (percent > 0) {
    if (percent > 50) return "#00a53c";
    if (percent > 20) return "#2cb357";
    if (percent > 5) return "#48c172";
    return "#7ad69c";
  }
  const absPercent = Math.abs(percent);
  if (absPercent > 50) return "#e50000";
  if (absPercent > 20) return "#ff3333";
  if (absPercent > 5) return "#ff6666";
  return "#ff9999";
};
