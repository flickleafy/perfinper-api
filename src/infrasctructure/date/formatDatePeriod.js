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

  // Create a new Date object with year, month (0-indexed), and day
  const tempDate = new Date(year, month - 1, day);
  // Adjust the time for GMT-3 by subtracting 3 hours in milliseconds
  tempDate.setTime(tempDate.getTime() - 3 * 60 * 60 * 1000);

  return tempDate;
}
