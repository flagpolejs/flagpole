export const runAsync = (callback: Function, delay: number = 1) => {
  setTimeout(callback, delay);
};
