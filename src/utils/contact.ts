export function onlyDigits(value?: string | null) {
  return (value ?? '').replace(/\D/g, '');
}

export function formatPhone(value?: string | null) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);

  if (number.length <= 4) {
    return `(${areaCode}) ${number}`;
  }

  if (number.length <= 8) {
    return `(${areaCode}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }

  return `(${areaCode}) ${number.slice(0, 5)}-${number.slice(5, 9)}`;
}

export function normalizeEmail(value?: string | null) {
  return (value ?? '').trim().toLowerCase();
}
