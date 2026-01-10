import {
  formatDatePeriod,
  checkSingleDigit,
  convertDateToJsDate,
  monthsYearThreeLetterAcronymToNumber,
  monthsYearThreeLetterAcronymToExtense,
} from './index.js';

describe('date helpers', () => {
  test('checkSingleDigit prefixes single digit and leaves others unchanged', () => {
    expect(checkSingleDigit(9)).toBe('09');
    expect(checkSingleDigit(10)).toBe(10);
  });

  test('formatDatePeriod returns date millis and YYYY-MM period', () => {
    const date = new Date(2024, 2, 5);
    const result = formatDatePeriod(date);

    expect(result.transactionDate).toBe(date.getTime());
    expect(result.transactionPeriod).toBe('2024-03');
  });

  test('formatDatePeriod supports double-digit months', () => {
    const date = new Date(2024, 10, 5);
    const result = formatDatePeriod(date);

    expect(result.transactionPeriod).toBe('2024-11');
  });

  test('convertDateToJsDate parses DD/MM/YYYY with timezone', () => {
    const date = convertDateToJsDate('31/12/2024', '08:30:00');

    expect(date).toBeInstanceOf(Date);
    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(11);
    expect(date.getUTCDate()).toBe(31);
    expect(date.getUTCHours()).toBe(12);
    expect(date.getUTCMinutes()).toBe(30);
  });

  test('month maps expose expected entries', () => {
    expect(monthsYearThreeLetterAcronymToNumber.jan).toBe('01');
    expect(monthsYearThreeLetterAcronymToNumber.dez).toBe('12');
    expect(monthsYearThreeLetterAcronymToExtense.jan).toBe('Janeiro');
    expect(monthsYearThreeLetterAcronymToExtense.out).toBe('Outubro');
  });
});
