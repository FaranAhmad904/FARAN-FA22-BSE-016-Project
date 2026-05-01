const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack); // Log the full error stack for debugging

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Customize messages for specific status codes
  switch (statusCode) {
    case 400:
      message = message || "Bad Request: Invalid input or request data";
      break;
    case 401:
      message = message || "Unauthorized: Authentication required";
      break;
    case 403:
      message = message || "Forbidden: You do not have access to this resource";
      break;
    case 404:
      message = message || "Not Found: Resource could not be located";
      break;
    case 500:
      message = message || "Internal Server Error: Something went wrong on the server";
      break;
    default:
      statusCode = 500;
      message = "Internal Server Error: An unexpected error occurred";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }) // Include stack trace in development
  });
};

export default errorMiddleware;