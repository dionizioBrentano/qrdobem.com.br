export function getDeviceId() {
  let deviceId = localStorage.getItem('qrdobem_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('qrdobem_device_id', deviceId);
  }
  return deviceId;
}
