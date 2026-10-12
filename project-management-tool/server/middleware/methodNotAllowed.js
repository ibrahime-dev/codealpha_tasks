const methodNotAllowed = (routeMethods) => (req, res) => {
  const allowedMethods = new Set(routeMethods);
  if (allowedMethods.has("GET")) {
    allowedMethods.add("HEAD");
  }
  allowedMethods.add("OPTIONS");

  const allowHeader = [...allowedMethods].join(", ");
  res.set("Allow", allowHeader);
  return res.status(405).json({
    message: `Method ${req.method} is not allowed for this endpoint.`,
    allowedMethods: [...allowedMethods]
  });
};

export default methodNotAllowed;
