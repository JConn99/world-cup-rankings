// Maps various API/source representations of team names to our canonical names.
// Canonical names must match keys in lib/players.ts and lib/players.ts FIFA_RANKINGS.

const TEAM_NAME_MAP: Record<string, string> = {
  // Netherlands
  'Netherlands':                'Netherlands',
  'Holland':                    'Netherlands',
  'The Netherlands':            'Netherlands',

  // Iran
  'Iran':                       'Iran',
  'IR Iran':                    'Iran',
  'Islamic Republic of Iran':   'Iran',

  // Scotland
  'Scotland':                   'Scotland',

  // Germany
  'Germany':                    'Germany',

  // Uruguay
  'Uruguay':                    'Uruguay',

  // Canada
  'Canada':                     'Canada',

  // Portugal
  'Portugal':                   'Portugal',

  // South Korea
  'South Korea':                'South Korea',
  'Korea Republic':             'South Korea',
  'Republic of Korea':          'South Korea',
  'Korea, Republic of':         'South Korea',
  'Korea DPR':                  'South Korea', // shouldn't match but just in case

  // Panama
  'Panama':                     'Panama',

  // England
  'England':                    'England',

  // USA
  'USA':                        'USA',
  'United States':              'USA',
  'United States of America':   'USA',
  'US':                         'USA',

  // Iraq
  'Iraq':                       'Iraq',

  // Morocco
  'Morocco':                    'Morocco',

  // Egypt
  'Egypt':                      'Egypt',

  // Tunisia
  'Tunisia':                    'Tunisia',

  // France
  'France':                     'France',

  // Ecuador
  'Ecuador':                    'Ecuador',

  // Sweden
  'Sweden':                     'Sweden',

  // Argentina
  'Argentina':                  'Argentina',

  // Australia
  'Australia':                  'Australia',

  // Norway
  'Norway':                     'Norway',

  // Brazil
  'Brazil':                     'Brazil',

  // Japan
  'Japan':                      'Japan',

  // Ivory Coast
  'Ivory Coast':                'Ivory Coast',
  "Côte d'Ivoire":              'Ivory Coast',
  "Cote d'Ivoire":              'Ivory Coast',
  "Cote D'Ivoire":              'Ivory Coast',
  'Côte D\'Ivoire':             'Ivory Coast',

  // Colombia
  'Colombia':                   'Colombia',

  // Mexico
  'Mexico':                     'Mexico',

  // Qatar
  'Qatar':                      'Qatar',

  // Croatia
  'Croatia':                    'Croatia',

  // Algeria
  'Algeria':                    'Algeria',

  // Uzbekistan
  'Uzbekistan':                 'Uzbekistan',

  // Senegal
  'Senegal':                    'Senegal',

  // Austria
  'Austria':                    'Austria',

  // DR Congo
  'DR Congo':                               'DR Congo',
  'Democratic Republic of the Congo':       'DR Congo',
  'Congo DR':                               'DR Congo',
  'Congo, DR':                              'DR Congo',
  'Congo, the Democratic Republic of the':  'DR Congo',
  'DRC':                                    'DR Congo',

  // Spain
  'Spain':                      'Spain',

  // Turkey
  'Turkey':                     'Turkey',
  'Türkiye':                    'Turkey',
  'Turkiye':                    'Turkey',

  // Czechia
  'Czechia':                    'Czechia',
  'Czech Republic':             'Czechia',

  // Belgium
  'Belgium':                    'Belgium',

  // Switzerland
  'Switzerland':                'Switzerland',

  // Paraguay
  'Paraguay':                   'Paraguay',
};

export function normalizeTeamName(rawName: string): string | null {
  if (!rawName) return null;
  const trimmed = rawName.trim();
  return TEAM_NAME_MAP[trimmed] ?? null;
}
