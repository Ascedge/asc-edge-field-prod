export type PassportSource = {
  id: string
  claim: string
  publisher: string
  title: string
  url: string
  published: string
  accessed: string
  sections: string[]
}

export const PASSPORT_SOURCES: PassportSource[] = [
  {
    id: 'tdi-roof-policy',
    claim: 'Roof coverage may use replacement cost or actual cash value; deductibles and renewal changes should be reviewed with the insurer or agent.',
    publisher: 'Texas Department of Insurance',
    title: 'Insurance and your roof: What to know when buying a policy or filing a claim',
    url: 'https://www.tdi.texas.gov/tips/replacing-your-roof.html',
    published: '2026-04-01', accessed: '2026-08-21', sections: ['Policy vault', 'Maintenance', 'Next actions'],
  },
  {
    id: 'tdi-deductibles',
    claim: 'A deductible is the amount paid before an insurer pays; percentage deductibles should be converted to dollars for comparison.',
    publisher: 'Texas Department of Insurance', title: 'What to know about deductibles',
    url: 'https://www.tdi.texas.gov/tips/deductibles.html', published: '2024-10-14', accessed: '2026-08-21', sections: ['Maintenance economics', 'Policy vault'],
  },
  {
    id: 'tdi-windstorm',
    claim: 'TDI provides an official search for WPI-8 and WPI-8E certificates of compliance for qualifying coastal construction.',
    publisher: 'Texas Department of Insurance', title: 'Windstorm inspections',
    url: 'https://www.tdi.texas.gov/wind/index.html', published: '2026-08-07', accessed: '2026-08-21', sections: ['Certificates', 'Building-code protocol'],
  },
  {
    id: 'nws-storm-data',
    claim: 'NOAA/NCEI Storm Data and the Storm Events Database contain quality-controlled reports, with a publication delay that can be roughly 90–120 days.',
    publisher: 'National Weather Service / NOAA', title: 'Storm Report Records',
    url: 'https://www.weather.gov/unr/storm_reports', published: 'Not stated', accessed: '2026-08-21', sections: ['Storm history', 'Sources'],
  },
  {
    id: 'nws-hail',
    claim: 'The NWS severe-thunderstorm threshold includes hail at least one inch in diameter or wind gusts above 58 mph; such conditions can damage property.',
    publisher: 'National Weather Service / NOAA', title: 'Severe Thunderstorm Safety',
    url: 'https://www.weather.gov/safety/thunderstorm', published: 'Not stated', accessed: '2026-08-21', sections: ['Storm history'],
  },
  {
    id: 'ibhs-maintenance',
    claim: 'Routine visual review and professional assessment can identify deterioration, loose flashing, debris, penetrations, and possible leaks requiring attention.',
    publisher: 'Insurance Institute for Business & Home Safety — FORTIFIED', title: 'Extend the Life of Your Roof',
    url: 'https://fortifiedhome.org/article/extend-the-life-of-your-roof/', published: '2021-12-03', accessed: '2026-08-21', sections: ['Maintenance', 'Next actions'],
  },
]
