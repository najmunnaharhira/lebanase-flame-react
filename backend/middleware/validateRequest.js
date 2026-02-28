export const validateBody = (validator) => (req, res, next) => {
  const error = validator(req.body || {});
  if (!error) return next();
  return res.status(400).json({ message: error });
};

export const validateParams = (validator) => (req, res, next) => {
  const error = validator(req.params || {});
  if (!error) return next();
  return res.status(400).json({ message: error });
};
