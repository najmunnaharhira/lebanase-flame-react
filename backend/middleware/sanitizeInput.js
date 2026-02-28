const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return value.replace(/[<>]/g, "").trim();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        sanitizeValue(nested),
      ]),
    );
  }

  return value;
};

export const sanitizeInput = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
};
