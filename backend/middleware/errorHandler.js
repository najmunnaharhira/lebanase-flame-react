export const notFoundHandler = (req, res, next) => {
  if (res.headersSent) return next();
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (error, _req, res, _next) => {
  const status = Number(error?.status || error?.statusCode || 500);
  const message =
    typeof error?.message === "string"
      ? error.message
      : "Internal server error";
  if (res.headersSent) return;
  res.status(status).json({ message });
};
