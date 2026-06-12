import 'react-native-url-polyfill/auto';

// TextEncoder polyfill guard for Anthropic SDK
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('text-encoding');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
