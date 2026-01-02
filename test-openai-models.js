// Test OpenAI Models Available
// This helps verify which models are accessible with your API key

console.log('📋 OpenAI Models Info:');
console.log('');
console.log('For GPT-4 Vision capabilities, use one of:');
console.log('  ✅ gpt-4o (RECOMMENDED - latest, fastest, supports vision)');
console.log('  ✅ gpt-4o-mini (cheaper alternative with vision)');
console.log('  ✅ gpt-4-turbo (older, also supports vision)');
console.log('  ⚠️  gpt-4-vision-preview (deprecated, use gpt-4o instead)');
console.log('');
console.log('Current implementation uses:');
console.log('  - gpt-4o (when images present)');
console.log('  - gpt-4-turbo-preview (text only)');
console.log('');
console.log('To verify your API key has access to gpt-4o:');
console.log('1. Go to https://platform.openai.com/playground');
console.log('2. Try selecting "gpt-4o" model');
console.log('3. If available, your key has access ✅');
console.log('');
console.log('If you get errors:');
console.log('  - "model not found" → upgrade OpenAI plan');
console.log('  - "rate limit" → add credits to account');
console.log('  - "invalid api key" → check OPENAI_API_KEY env var');
