export const destinations = [
  {
    id: 'colosseum',
    name: 'Colosseum',
    location: 'Rome, Italy',
    built: '70-80 AD',
    lat: 41.89091,
    lon: 12.49222,
    about:
      'Ancient Roman amphitheater, the largest ever built. Iconic symbol of Imperial Rome and Roman engineering.',
    significance: 'Imperial spectacle and Roman engineering',
  },
  {
    id: 'saint-peters-basilica',
    name: "Saint Peter's Basilica",
    location: 'Vatican City',
    built: '1506-1626',
    lat: 41.90305,
    lon: 12.45509,
    about:
      'Renaissance-era church, one of the holiest Catholic sites in the world. Designed by Michelangelo and Bernini.',
    significance: 'Renaissance sacred architecture',
  },
  {
    id: 'xian-city-wall',
    name: "Xi'an City Wall",
    location: "Xi'an, China",
    built: '1374-1378, Ming Dynasty',
    // Real-world South Gate (Yongning Gate / 永宁门). Mapbox's basemap renders
    // the actual gate complex slightly north-northwest of the central-avenue
    // intersection — these coords align the pin with the rendered gatehouse
    // and barbican, not with the road south of it.
    lat: 34.25378,
    lon: 108.94232,
    about:
      'Ming-era city wall enclosing the historic core of Xi\'an, one of the largest and best-preserved ancient city walls in China.',
    significance: 'Imperial Chinese defense and urban heritage',
  },
  {
    id: 'san-salvador-island',
    name: 'San Salvador Island',
    location: 'San Salvador, Bahamas',
    built: 'Natural island',
    lat: 24.02154,
    lon: -74.49661,
    about:
      "One of the Bahamas' most historically significant islands, widely believed to be the site of Columbus's first landfall in the New World in 1492. Known for world-class diving, pristine reefs, and the Dixon Hill Lighthouse.",
    significance: "Columbus's first New World landfall and Bahamian maritime heritage",
  },
  {
    id: 'magellan-landing-site',
    name: 'Cagusu-an Church and Plaza',
    location: 'Cagusu-an, Guiuan, Eastern Samar, Philippines',
    built: 'Historic coastal settlement',
    lat: 10.72253,
    lon: 125.81815,
    about:
      'Cagusu-an Church and Plaza area on Homonhon Island, Guiuan, Eastern Samar, near the historical Magellan landing narrative.',
    significance: 'Magellan-era maritime landing history in Eastern Samar',
  },
  {
    id: 'royal-palace-madrid',
    name: 'Royal Palace of Madrid',
    location: 'Madrid, Spain',
    built: '1738-1755',
    lat: 40.41673,
    lon: -3.71491,
    about:
      'Official residence of the Spanish royal family, one of the largest palaces in Europe with 3,418 rooms.',
    significance: 'Spanish monarchy and European palace architecture',
  },
  {
    id: 'neuschwanstein-castle',
    name: 'Neuschwanstein Castle',
    location: 'Schwangau, Germany',
    built: '1869-1886',
    lat: 47.55775,
    lon: 10.74852,
    about:
      "19th-century Romanesque Revival palace, the inspiration for Disney's Sleeping Beauty Castle.",
    significance: 'Romantic revival architecture',
  },
  {
    id: 'buckingham-palace',
    name: 'Buckingham Palace',
    location: 'London, England',
    built: '1703, original townhouse',
    lat: 51.50092,
    lon: -0.14282,
    about:
      'London residence and administrative headquarters of the British monarchy since 1837.',
    significance: 'British monarchy and state ceremony',
  },
  {
    id: 'big-ben',
    name: 'Big Ben',
    location: 'London, England',
    built: '1859',
    lat: 51.49883,
    lon: -0.12571,
    about:
      'The Great Bell of the clock at the north end of the Palace of Westminster, an iconic British landmark.',
    significance: 'Parliamentary London landmark',
  },
  {
    id: 'statue-of-liberty',
    name: 'Statue of Liberty',
    location: 'New York, USA',
    built: '1886',
    lat: 40.69142,
    lon: -74.04650,
    about:
      'Colossal neoclassical sculpture and a gift from France, symbolizing freedom and democracy worldwide.',
    significance: 'Freedom, migration, and democracy',
  },
  {
    id: 'white-house',
    name: 'The White House',
    location: 'Washington, D.C., USA',
    built: '1792-1800',
    lat: 38.89681,
    lon: -77.03643,
    about:
      'Official residence and workplace of the President of the United States since 1800.',
    significance: 'United States executive government',
  },
  {
    id: 'world-trade-center-nyc',
    name: 'World Trade Center NYC',
    location: 'New York, USA',
    built: 'Rebuilt 2014, One World Trade Center',
    lat: 40.71503,
    lon: -74.00881,
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

// Rome Intro removed from the nav — Colosseum (destinations[0]) is now the
// first journey stop, so the nav indices line up 1:1 with the destinations
// array.
export const journeyNavItems = destinations.map((destination) => ({
  id: destination.id,
  name: destination.name,
  location: destination.location,
  lat: destination.lat,
  lon: destination.lon,
}));
