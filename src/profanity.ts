
const BANNED_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy',
  'merde', 'connard', 'salope', 'encule', 'putain', 'chiasse'
];


export function cleanContentFilter(text: string): string {
  let cleanedText = text;
  
  BANNED_WORDS.forEach(word => {
    // Case-insensitive regex matching whole words
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const censorPattern = '#'.repeat(word.length);
    cleanedText = cleanedText.replace(regex, censorPattern);
  });
  
  return cleanedText;
}
