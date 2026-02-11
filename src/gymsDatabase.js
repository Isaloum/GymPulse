/**
 * Gym Locations Database
 * Real gym brands and locations in Quebec, Canada
 * Expandable to full Canada
 */

export const GYM_BRANDS = {
  ANYTIME_FITNESS: 'Anytime Fitness',
  GOODLIFE_FITNESS: 'GoodLife Fitness',
  YMCA: 'YMCA',
  CLUB_SIX: 'Club SIX',
  ELITE_GYMS: 'Elite Gyms',
  CROSS_FIT: 'CrossFit Gym',
  ORANGETHEORY: 'Orangetheory',
  F45: 'F45',
};

export const PROVINCES = {
  QC: 'Quebec',
  ON: 'Ontario',
  BC: 'British Columbia',
  AB: 'Alberta',
  MB: 'Manitoba',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  PE: 'Prince Edward Island',
  NL: 'Newfoundland & Labrador',
  SK: 'Saskatchewan',
};

/**
 * Quebec Gyms Database
 * Format: { id, name, brand, city, address, province, coordinates }
 */
export const QUEBEC_GYMS = [
  // Montreal
  {
    id: 'mtl-anytime-1',
    name: 'Anytime Fitness Downtown',
    brand: GYM_BRANDS.ANYTIME_FITNESS,
    city: 'Montreal',
    address: '1500 Rue St-Catherine O',
    province: PROVINCES.QC,
    coordinates: { lat: 45.5017, lng: -73.5673 },
  },
  {
    id: 'mtl-goodlife-1',
    name: 'GoodLife Fitness Plateau',
    brand: GYM_BRANDS.GOODLIFE_FITNESS,
    city: 'Montreal',
    address: '4300 Rue de Bullion',
    province: PROVINCES.QC,
    coordinates: { lat: 45.5255, lng: -73.5948 },
  },
  {
    id: 'mtl-ymca-1',
    name: 'YMCA Montreal Downtown',
    brand: GYM_BRANDS.YMCA,
    city: 'Montreal',
    address: '1425 Boulevard de Maisonneuve O',
    province: PROVINCES.QC,
    coordinates: { lat: 45.5047, lng: -73.5788 },
  },
  {
    id: 'mtl-elite-1',
    name: 'Elite Gyms Westmount',
    brand: GYM_BRANDS.ELITE_GYMS,
    city: 'Montreal',
    address: '4900 Rue Sherbrooke O',
    province: PROVINCES.QC,
    coordinates: { lat: 45.4898, lng: -73.6059 },
  },
  {
    id: 'mtl-orangetheory-1',
    name: 'Orangetheory Fitness Old Montreal',
    brand: GYM_BRANDS.ORANGETHEORY,
    city: 'Montreal',
    address: '350 Rue St-Paul O',
    province: PROVINCES.QC,
    coordinates: { lat: 45.5028, lng: -73.5611 },
  },

  // Quebec City
  {
    id: 'qc-anytime-1',
    name: 'Anytime Fitness Vieux-Quebec',
    brand: GYM_BRANDS.ANYTIME_FITNESS,
    city: 'Quebec City',
    address: '580 Rue de la Reine',
    province: PROVINCES.QC,
    coordinates: { lat: 46.8139, lng: -71.2080 },
  },
  {
    id: 'qc-goodlife-1',
    name: 'GoodLife Fitness Sainte-Foy',
    brand: GYM_BRANDS.GOODLIFE_FITNESS,
    city: 'Quebec City',
    address: '2600 Boulevard Laurier',
    province: PROVINCES.QC,
    coordinates: { lat: 46.7909, lng: -71.2265 },
  },
  {
    id: 'qc-ymca-1',
    name: 'YMCA Quebec City',
    brand: GYM_BRANDS.YMCA,
    city: 'Quebec City',
    address: '855 Avenue Holland',
    province: PROVINCES.QC,
    coordinates: { lat: 46.8172, lng: -71.1968 },
  },

  // Gatineau
  {
    id: 'gatineau-anytime-1',
    name: 'Anytime Fitness Gatineau',
    brand: GYM_BRANDS.ANYTIME_FITNESS,
    city: 'Gatineau',
    address: '275 Boulevard de la Gappe',
    province: PROVINCES.QC,
    coordinates: { lat: 45.5017, lng: -75.7447 },
  },
  {
    id: 'gatineau-goodlife-1',
    name: 'GoodLife Fitness Buckingham',
    brand: GYM_BRANDS.GOODLIFE_FITNESS,
    city: 'Gatineau',
    address: '580 Boulevard de la Gappe',
    province: PROVINCES.QC,
    coordinates: { lat: 45.5030, lng: -75.7522 },
  },

  // Sherbrooke
  {
    id: 'sherbrooke-anytime-1',
    name: 'Anytime Fitness Downtown',
    brand: GYM_BRANDS.ANYTIME_FITNESS,
    city: 'Sherbrooke',
    address: '105 Rue King O',
    province: PROVINCES.QC,
    coordinates: { lat: 45.4015, lng: -71.8947 },
  },
  {
    id: 'sherbrooke-club-six-1',
    name: 'Club SIX Sherbrooke',
    brand: GYM_BRANDS.CLUB_SIX,
    city: 'Sherbrooke',
    address: '365 Boulevard Industriel',
    province: PROVINCES.QC,
    coordinates: { lat: 45.4088, lng: -71.8750 },
  },

  // Laval
  {
    id: 'laval-goodlife-1',
    name: 'GoodLife Fitness Laval',
    brand: GYM_BRANDS.GOODLIFE_FITNESS,
    city: 'Laval',
    address: '2180 Boulevard des Laurentides',
    province: PROVINCES.QC,
    coordinates: { lat: 45.5605, lng: -73.7454 },
  },
  {
    id: 'laval-anytime-1',
    name: 'Anytime Fitness Vimont',
    brand: GYM_BRANDS.ANYTIME_FITNESS,
    city: 'Laval',
    address: '440 Boulevard de la Concorde O',
    province: PROVINCES.QC,
    coordinates: { lat: 45.5733, lng: -73.7547 },
  },
];

/**
 * Placeholder for future expansion
 * Ontario, BC, Alberta, etc.
 */
export const ONTARIO_GYMS = [
  // Coming soon - structure same as QUEBEC_GYMS
];

/**
 * Get all gyms for a specific province
 */
export const getGymsByProvince = (province) => {
  const provinceKey = Object.keys(PROVINCES).find(
    (key) => PROVINCES[key] === province
  );

  switch (provinceKey) {
    case 'QC':
      return QUEBEC_GYMS;
    case 'ON':
      return ONTARIO_GYMS;
    // Add more provinces as needed
    default:
      return QUEBEC_GYMS; // Default to Quebec
  }
};

/**
 * Get all cities in a province
 */
export const getCitiesByProvince = (province) => {
  const gyms = getGymsByProvince(province);
  const cities = [...new Set(gyms.map((gym) => gym.city))];
  return cities.sort();
};

/**
 * Get gyms filtered by province and city
 */
export const getGymsByProvinceAndCity = (province, city = null) => {
  let gyms = getGymsByProvince(province);
  if (city) {
    gyms = gyms.filter((gym) => gym.city === city);
  }
  return gyms;
};

/**
 * Get gym by ID
 */
export const getGymById = (gymId) => {
  const allGyms = [...QUEBEC_GYMS, ...ONTARIO_GYMS];
  return allGyms.find((gym) => gym.id === gymId);
};

/**
 * Search gyms by name or brand
 */
export const searchGyms = (query, province = null) => {
  const gyms = province ? getGymsByProvince(province) : [...QUEBEC_GYMS, ...ONTARIO_GYMS];
  const lowerQuery = query.toLowerCase();
  return gyms.filter(
    (gym) =>
      gym.name.toLowerCase().includes(lowerQuery) ||
      gym.brand.toLowerCase().includes(lowerQuery) ||
      gym.city.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Get all unique gym brands
 */
export const getAllBrands = (province = null) => {
  const gyms = province ? getGymsByProvince(province) : [...QUEBEC_GYMS, ...ONTARIO_GYMS];
  const brands = [...new Set(gyms.map((gym) => gym.brand))];
  return brands.sort();
};
