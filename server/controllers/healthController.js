export const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lost2Found API is running'
  });
};
