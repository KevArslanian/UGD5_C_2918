const LOWERCASE_CHARACTERS = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBER_CHARACTERS = "0123456789";
const CAPTCHA_CHARACTERS =
  `${LOWERCASE_CHARACTERS}${UPPERCASE_CHARACTERS}${NUMBER_CHARACTERS}`;

function getRandomCharacter(characters: string) {
  const randomIndex = Math.floor(Math.random() * characters.length);
  return characters[randomIndex];
}

function shuffleCharacters(characters: string[]) {
  const shuffledCharacters = [...characters];

  for (let index = shuffledCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const currentCharacter = shuffledCharacters[index];

    shuffledCharacters[index] = shuffledCharacters[swapIndex];
    shuffledCharacters[swapIndex] = currentCharacter;
  }

  return shuffledCharacters;
}

export function generateCaptcha(length = 6) {
  const normalizedLength = Math.max(length, 2);
  const characters = [
    getRandomCharacter(LOWERCASE_CHARACTERS),
    getRandomCharacter(UPPERCASE_CHARACTERS),
  ];

  while (characters.length < normalizedLength) {
    characters.push(getRandomCharacter(CAPTCHA_CHARACTERS));
  }

  return shuffleCharacters(characters).join("");
}
