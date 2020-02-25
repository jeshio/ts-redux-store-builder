import getTypeName from '../index';

test('My Greeter', () => {
  expect(getTypeName({ name: 'Carl' })).toStrictEqual({ name: 'Carltest' });
});
