const validatePrice = (price) => {
  return price > 0 && price < 100000;
};
const isOutlier = (price, avg30day) => {
  return price > avg30day * 3;
};

describe('Price Validation', () => {
  test('valid price passes', () => {
    expect(validatePrice(22.50)).toBe(true);
  });

  test('zero price fails', () => {
    expect(validatePrice(0)).toBe(false);
  });

  test('negative price fails', () => {
    expect(validatePrice(-5)).toBe(false);
  });

  test('price over 100000 fails', () => {
    expect(validatePrice(100001)).toBe(false);
  });

  test('outlier detection works', () => {
    expect(isOutlier(100, 20)).toBe(true);
  });

  test('normal price is not outlier', () => {
    expect(isOutlier(25, 20)).toBe(false);
  });
});