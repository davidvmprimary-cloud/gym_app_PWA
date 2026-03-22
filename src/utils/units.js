/**
 * Weight and length conversion helpers
 */

export const kgToLb = (kg) => {
  return kg * 2.20462;
};

export const lbToKg = (lb) => {
  return lb / 2.20462;
};

export const cmToIn = (cm) => {
  return cm / 2.54;
};

export const inToCm = (inch) => {
  return inch * 2.54;
};

export const formatWeight = (value, unit) => {
  if (value === undefined || value === null) return '-';
  return `${value} ${unit}`;
};
