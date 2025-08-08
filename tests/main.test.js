/**
 * Pruebas unitarias para el chatbot
 */

// Mock del DOM
document.body.innerHTML = `
  <div id="chatMessages"></div>
  <input id="messageInput" type="text" />
  <button id="sendButton"></button>
`;

// Importar funciones a probar
const { validateUserInput, sanitizeText, generateId } = require('../src/utils/helpers.js');

describe('Chatbot Tests', () => {
  
  describe('validateUserInput', () => {
    test('should validate empty input', () => {
      const result = validateUserInput('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('El mensaje no puede estar vacío');
    });

    test('should validate null input', () => {
      const result = validateUserInput(null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Entrada inválida');
    });

    test('should validate valid input', () => {
      const result = validateUserInput('Hola mundo');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe('Hola mundo');
    });

    test('should validate long input', () => {
      const longInput = 'a'.repeat(501);
      const result = validateUserInput(longInput);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('El mensaje es demasiado largo (máximo 500 caracteres)');
    });
  });

  describe('sanitizeText', () => {
    test('should sanitize HTML tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeText(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('should handle normal text', () => {
      const input = 'Hola mundo';
      const result = sanitizeText(input);
      expect(result).toBe('Hola mundo');
    });
  });

  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    test('should generate string IDs', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });
  });

  describe('Chatbot UI', () => {
    test('should have required elements', () => {
      expect(document.getElementById('chatMessages')).toBeTruthy();
      expect(document.getElementById('messageInput')).toBeTruthy();
      expect(document.getElementById('sendButton')).toBeTruthy();
    });
  });
}); 