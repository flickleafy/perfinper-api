export function formatDatePeriod(dateObj) {
  const transactionDate = dateObj.getTime();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  const transactionPeriod = `${year}-${checkSingleDigit(month)}`;
  return { transactionDate, transactionPeriod };
}

export function checkSingleDigit(number) {
  if (/^\d$/.test(number)) {
    return `0${number}`;
  }
  return number;
}

export function convertDateToJsDate(dateString) {
  // Split the date string into day, month, and year components
  const [day, month, year] = dateString.split('/');
  // Set specific timezone and define mid day hour to avoid edge cases
  const date = new Date(`${year}-${month}-${day}T12:00:00-04:00`);
  return date;
}
