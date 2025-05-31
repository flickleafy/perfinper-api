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

export function convertDateToJsDate(dateString, timeString = '12:00:00') {
  // Split the date string into day, month, and year components
  const [day, month, year] = dateString.split('/');
  // Set specific timezone and define mid day hour to avoid edge cases
  const date = new Date(`${year}-${month}-${day}T${timeString}-04:00`);
  return date;
}

export const monthsYearThreeLetterAcronymToNumber = {
  jan: '01',
  fev: '02',
  mar: '03',
  abr: '04',
  mai: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  set: '09',
  out: '10',
  nov: '11',
  dez: '12',
};

export const monthsYearThreeLetterAcronymToExtense = {
  jan: 'Janeiro',
  fev: 'Fevereiro',
  mar: 'Março',
  abr: 'Abril',
  mai: 'Maio',
  jun: 'Junho',
  jul: 'Julho',
  ago: 'Agosto',
  set: 'Setembro',
  out: 'Outubro',
  nov: 'Novembro',
  dez: 'Dezembro',
};
