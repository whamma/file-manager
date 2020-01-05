export const is404 = error => isErrorWithResponseAndStatus(error) && 404 === error.response.status;

export const is422 = error => isErrorWithResponseAndStatus(error) && 422 === error.response.status;

export const isErrorWithResponseAndStatus = error => error.response && error.response.status;
