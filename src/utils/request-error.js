export const getErrorResponse = error => {
  const res = {
    message: '',
  };
  if (error.response && error.response.data) {
    res.message = error.response.data.msg;
  } else {
    res.message = error.message;
  }
  return res;
};
