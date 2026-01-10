export function extractNumberFromString(inputString) {
  // Regular expression to find digits
  const numberRegex = /\d+/;

  // Extract number
  const foundNumber = inputString.match(numberRegex);

  // Check if a number was found and parse it
  const number = foundNumber ? parseInt(foundNumber[0], 10) : null;

  return number;
}
