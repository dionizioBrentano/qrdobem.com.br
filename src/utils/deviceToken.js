export const getDeviceToken = () => {
  return localStorage.getItem('qrdobem_device_token');
};

export const setDeviceToken = (token) => {
  if (token) {
    localStorage.setItem('qrdobem_device_token', token);
  }
};

export const clearDeviceToken = () => {
  localStorage.removeItem('qrdobem_device_token');
};
