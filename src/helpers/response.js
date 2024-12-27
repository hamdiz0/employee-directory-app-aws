exports.getSuccessResponse = (data) => {
  return {
    success: true,
    data: data,
  };
};

exports.getErrorResponse = (err) => {
  return {
    success: false,
    data: JSON.stringify(err),
  };
};
