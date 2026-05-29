export const destinations = [
  {
    id: 'colosseum',
    name: 'Colosseum',
    location: 'Rome, Italy',
    built: '70-80 AD',
    eraRange: '264 BC - 476 AD',
    lat: 41.89191,
    lon: 12.49143,
    camera: {
      zoom: 17.79,
      pitch: 59.5,
      bearing: 336.8,
      altitude: 0,
    },
    about:
      'Ancient Roman amphitheater, the largest ever built. Iconic symbol of Imperial Rome and Roman engineering.',
    significance: 'Imperial spectacle and Roman engineering',
  },
  {
    id: 'saint-peters-basilica',
    name: "Saint Peter's Basilica",
    location: 'Vatican City',
    built: '1506-1626',
    eraRange: '3rd Century BC - 15th Century AD',
    lat: 41.90484,
    lon: 12.45344,
    camera: {
      zoom: 17.57,
      pitch: 72.7,
      bearing: 313.7,
      altitude: 0,
    },
    about:
      'Renaissance-era church, one of the holiest Catholic sites in the world. Designed by Michelangelo and Bernini.',
    significance: 'Renaissance sacred architecture',
  },
  {
    id: 'xian-city-wall',
    name: "Xi'an City Wall",
    location: "Xi'an, China",
    built: '1374-1378, Ming Dynasty',
    eraRange: '1206 AD - 1242 AD',
    // "Fortifications of Xi'an" - the Google Maps entry, Xincheng District,
    // postal 710003. Coordinates from OpenStreetMap's "永宁门" tourism
    // attraction node, which sits dead-center on the South Gate (Yongning
    // Gate) gatehouse + barbican complex on the south wall.
    lat: 34.2531039,
    lon: 108.9423179,
    about:
      'Ming-era city wall enclosing the historic core of Xi\'an, one of the largest and best-preserved ancient city walls in China.',
    significance: 'Imperial Chinese defense and urban heritage',
  },
  {
    id: 'san-salvador-island',
    name: 'San Salvador Island',
    location: 'San Salvador, Bahamas',
    built: 'Natural island',
    eraRange: 'August 3, 1492 - November 7, 1504',
    lat: 24.02798,
    lon: -74.47961,
    camera: {
      zoom: 11.38,
      pitch: 46.6,
      bearing: 334.8,
      altitude: 0,
    },
    about:
      "One of the Bahamas' most historically significant islands, widely believed to be the site of Columbus's first landfall in the New World in 1492. Known for world-class diving, pristine reefs, and the Dixon Hill Lighthouse.",
    significance: "Columbus's first New World landfall and Bahamian maritime heritage",
  },
  {
    id: 'magellan-landing-site',
    name: 'Cagusu-an Church and Plaza',
    location: 'Cagusu-an, Guiuan, Eastern Samar, Philippines',
    built: 'Historic coastal settlement',
    eraRange: 'September 20, 1519 - September 6, 1522',
    // Google Maps plus code PRC8+VWJ Guiuan = global OLC 7Q27PRC8+VWJ, which
    // decodes to a ~0.6m x 0.9m cell at (10.7222025°N, 125.8172539°E) - the
    // Cagusuan Church & Plaza pin on Homonhon Island.
    lat: 10.72131,
    lon: 125.81604,
    camera: {
      zoom: 17.25,
      pitch: 67.6,
      bearing: 260.9,
      altitude: 0,
    },
    about:
      'Cagusu-an Church and Plaza area on Homonhon Island, Guiuan, Eastern Samar, near the historical Magellan landing narrative.',
    significance: 'Magellan-era maritime landing history in Eastern Samar',
  },
  {
    id: 'royal-palace-madrid',
    name: 'Royal Palace of Madrid',
    location: 'Madrid, Spain',
    built: '1738-1755',
    eraRange: '1492 - 1900',
    lat: 40.43698,
    lon: -3.72667,
    camera: {
      zoom: 15.87,
      pitch: 73.9,
      bearing: 334.6,
      altitude: 0,
    },
    about:
      'Official residence of the Spanish royal family, one of the largest palaces in Europe with 3,418 rooms.',
    significance: 'Spanish monarchy and European palace architecture',
  },
  {
    id: 'neuschwanstein-castle',
    name: 'Neuschwanstein Castle',
    location: 'Schwangau, Germany',
    built: '1869-1886',
    eraRange: '1618 - 1945',
    lat: 47.56202,
    lon: 10.70776,
    camera: {
      zoom: 15.57,
      pitch: 72.3,
      bearing: 278.7,
      altitude: 0,
    },
    about:
      "19th-century Romanesque Revival palace, the inspiration for Disney's Sleeping Beauty Castle.",
    significance: 'Romantic revival architecture',
  },
  {
    id: 'buckingham-palace',
    name: 'Buckingham Palace',
    location: 'London, England',
    built: '1703, original townhouse',
    eraRange: '1870 - 1914',
    lat: 51.50102,
    lon: -0.14405,
    camera: {
      zoom: 18.12,
      pitch: 70.4,
      bearing: 261.1,
      altitude: 0,
    },
    about:
      'London residence and administrative headquarters of the British monarchy since 1837.',
    significance: 'British monarchy and state ceremony',
  },
  {
    id: 'big-ben',
    name: 'Big Ben',
    location: 'London, England',
    built: '1859',
    eraRange: 'November 2, 1936 - 1939',
    lat: 51.49708,
    lon: -0.12738,
    camera: {
      zoom: 17.59,
      pitch: 76.5,
      bearing: 213.6,
      altitude: 0,
    },
    about:
      'The Great Bell of the clock at the north end of the Palace of Westminster, an iconic British landmark.',
    significance: 'Parliamentary London landmark',
  },
  {
    id: 'statue-of-liberty',
    name: 'Statue of Liberty',
    location: 'New York, USA',
    built: '1886',
    eraRange: 'September 2, 1945 - December 25, 1991',
    lat: 40.68939,
    lon: -74.04469,
    camera: {
      zoom: 18.59,
      pitch: 66.6,
      bearing: 354.0,
      altitude: 0,
    },
    about:
      'Colossal neoclassical sculpture and a gift from France, symbolizing freedom and democracy worldwide.',
    significance: 'Freedom, migration, and democracy',
  },
  {
    id: 'white-house',
    name: 'The White House',
    location: 'Washington, D.C., USA',
    built: '1792-1800',
    eraRange: 'December 26, 1991 - Present',
    lat: 38.89724,
    lon: -77.03687,
    camera: {
      zoom: 17.73,
      pitch: 73.2,
      bearing: 180.1,
      altitude: 0,
    },
    about:
      'Official residence and workplace of the President of the United States since 1800.',
    significance: 'United States executive government',
  },
  {
    id: 'world-trade-center-nyc',
    name: 'World Trade Center NYC',
    location: 'New York, USA',
    built: 'Rebuilt 2014, One World Trade Center',
    eraRange: 'September 11, 2001',
    lat: 40.70992,
    lon: -74.00685,
    camera: {
      zoom: 16.37,
      pitch: 61.6,
      bearing: 54.7,
      altitude: 0,
    },
    about:
      'Iconic skyscraper complex in Lower Manhattan, standing as a tribute to resilience and renewal.',
    significance: 'Resilience and contemporary urban renewal',
  },
];

export const romeIntro = {
  id: 'rome',
  name: 'Rome Intro',
  location: 'Rome, Italy',
  lat: 41.9028,
  lon: 12.4964,
};

// Rome Intro removed from the nav - Colosseum (destinations[0]) is now the
// first journey stop, so the nav indices line up 1:1 with the destinations
// array.
export const journeyNavItems = destinations.map((destination) => ({
  id: destination.id,
  name: destination.name,
  location: destination.location,
  lat: destination.lat,
  lon: destination.lon,
}));
