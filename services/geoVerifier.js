const axios = require('axios');

const toRad = (deg) => (deg * Math.PI) / 180;

const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const verifyGPS = (lat, lng) => {
  // Default geofence: The British University in Egypt (BUE)
  const officeLat = parseFloat(process.env.OFFICE_LAT) || 30.1177753;
  const officeLng = parseFloat(process.env.OFFICE_LNG) || 31.605976;
  const radiusKm = parseFloat(process.env.OFFICE_RADIUS_KM) || 2;
  const distance = haversineDistanceKm(lat, lng, officeLat, officeLng);
  return { verified: distance <= radiusKm, distanceKm: distance };
};

const verifyIP = async (ip) => {
  try {
    const key = process.env.IPAPI_KEY;
    const url = key
      ? `https://ipapi.co/${ip}/json/?key=${key}`
      : `https://ipapi.co/${ip}/json/`;
    const { data } = await axios.get(url, { timeout: 4000 });
    return {
      verified: true,
      city: data.city,
      country: data.country_name,
      region: data.region,
    };
  } catch {
    return { verified: false, city: null, country: null };
  }
};

const getClientIP = (req) => {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '0.0.0.0'
  );
};

module.exports = { verifyGPS, verifyIP, getClientIP };
