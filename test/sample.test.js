const { add } = require('../src/index');

test('add() returns sum of two numbers', () => {
  expect(add(2, 3)).toBe(5);
});
