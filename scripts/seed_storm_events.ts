#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import fs from 'fs';
import zlib from 'zlib';
import Papa from 'papaparse';

const supabaseUrl = process.env.SUPABASE_URL || 'https://bifmlsnnjrvotucgbwdn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpZm1sc25uanJ2b3R1Y2did2RuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY1NjgwMCwiZXhwIjoyMDY1MjMyNDAwfQ.8v5z9pK8zL2mX7vN3qR5tY9uI0oP2qR4sT6uV8wX0Y';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  console.error('SUPABASE_URL =', supabaseUrl ? 'present' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY =', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present (' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...)' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const YEARS = [2023, 2024, 2025];
const COUNTIES = ['HARRIS', 'GALVESTON', 'BRAZORIA', 'FORT BEND'];
const RELEVANT_EVENTS = new Set([
  'Hail', 'Thunderstorm Wind', 'High Wind', 'Tornado', 
  'Tropical Storm', 'Hurricane', 'Tropical Depression', 'Flood'
]);

interface StormRecord {
  event_date: string;
  event_type: string;
  county: string;
  state: string;
  wind_mph_min: number | null;
  wind_mph_max: number | null;
  hail_inches: number | null;
  narrative: string;
  begin_lat: number | null;
  begin_lon: number | null;
  source: string;
  source_event_id: string;
  severity_score: number;
}

const severityRules = (eventType: string, magnitude: string | null, hail: string | null): number => {
  const mag = parseFloat(magnitude || '0');
  const hailIn = parseFloat(hail || '0');
  if (eventType.includes('Hail')) {
    if (hailIn >= 2.0) return 10;
    if (hailIn >= 1.5) return 8;
    if (hailIn >= 1.0) return 6;
    return 4;
  }
  if (eventType.includes('Wind') || eventType.includes('Hurricane') || eventType.includes('Tornado')) {
    if (mag >= 80) return 10;
    if (mag >= 65) return 8;
    if (mag >= 50) return 6;
    return 4;
  }
  return 5;
};

async function downloadAndProcess(year: number): Promise<StormRecord[]> {
  const url = `https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/StormEvents_details-ftp_v1.0_d${year}_c2026*.csv.gz`;
  // Use a known recent file name for reliability
  const knownUrl = `https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/StormEvents_details-ftp_v1.0_d${year}_c20260323.csv.gz`;
  console.log(`Downloading ${year} from ${knownUrl}...`);

  const records: StormRecord[] = [];

  return new Promise((resolve, reject) => {
    https.get(knownUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const gunzip = zlib.createGunzip();
      const chunks: Buffer[] = [];

      response.pipe(gunzip).on('data', (chunk) => chunks.push(chunk)).on('end', () => {
        const csv = Buffer.concat(chunks).toString('utf8');
        
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            const rows = result.data as any[];
            for (const row of rows) {
              const state = (row.STATE || '').toUpperCase().trim();
              const county = (row.CZ_NAME || '').toUpperCase().trim();
              const eventType = (row.EVENT_TYPE || '').trim();

              if (state !== 'TX' || !COUNTIES.includes(county) || !RELEVANT_EVENTS.has(eventType)) continue;

              const beginDate = row.BEGIN_DATE_TIME || '';
              const eventDate = beginDate.split(' ')[0]; // YYYY-MM-DD

              const wind = row.MAGNITUDE ? parseInt(row.MAGNITUDE) : null;
              const hail = row.HAIL_SIZE ? parseFloat(row.HAIL_SIZE) : null;
              const narrative = (row.EVENT_NARRATIVE || '').trim();
              const lat = row.BEGIN_LAT ? parseFloat(row.BEGIN_LAT) : null;
              const lon = row.BEGIN_LON ? parseFloat(row.BEGIN_LON) : null;
              const eventId = row.EVENT_ID || `noaa-${year}-${Math.random().toString(36).slice(2)}`;

              const severity = severityRules(eventType, row.MAGNITUDE, row.HAIL_SIZE);

              records.push({
                event_date: eventDate,
                event_type: eventType,
                county,
                state: 'TX',
                wind_mph_min: wind,
                wind_mph_max: wind,
                hail_inches: hail,
                narrative: narrative || 'No narrative provided in NOAA record.',
                begin_lat: lat,
                begin_lon: lon,
                source: 'NOAA NCEI Storm Events',
                source_event_id: eventId.toString(),
                severity_score: severity,
              });
            }
            console.log(`Processed ${rows.length} rows for ${year}, kept ${records.length} relevant events.`);
            resolve(records);
          },
          error: (err) => reject(err)
        });
      }).on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('🚀 Starting NOAA Storm Events seed (Phase A - county level)...');

  // Create table if not exists (migration inline for this task)
  const { error: tableError } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS storm_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_date date NOT NULL,
        event_type text NOT NULL,
        county text NOT NULL,
        state text NOT NULL DEFAULT 'TX',
        wind_mph_min integer,
        wind_mph_max integer,
        hail_inches numeric,
        narrative text,
        begin_lat numeric,
        begin_lon numeric,
        source text NOT NULL DEFAULT 'NOAA NCEI Storm Events',
        source_event_id text NOT NULL UNIQUE,
        severity_score integer NOT NULL,
        created_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS storm_events_county_date_idx ON storm_events (county, event_date DESC);
      CREATE INDEX IF NOT EXISTS storm_events_source_event_id_idx ON storm_events (source_event_id);
    `
  });

  if (tableError) {
    console.error('Table creation error (expected if RPC not enabled):', tableError.message);
    // Fallback: assume table exists or user will run SQL manually
    console.log('⚠️  Using existing table or manual migration required.');
  } else {
    console.log('✅ Table and indexes ready.');
  }

  let allRecords: StormRecord[] = [];

  for (const year of YEARS) {
    try {
      const yearRecords = await downloadAndProcess(year);
      allRecords = allRecords.concat(yearRecords);
    } catch (err: any) {
      console.error(`Failed to process ${year}:`, err.message);
    }
  }

  if (allRecords.length === 0) {
    console.error('No records downloaded. Exiting.');
    process.exit(1);
  }

  console.log(`Upserting ${allRecords.length} storm events...`);

  const { error: upsertError } = await supabase
    .from('storm_events')
    .upsert(allRecords, { 
      onConflict: 'source_event_id',
      ignoreDuplicates: false 
    });

  if (upsertError) {
    console.error('Upsert error:', upsertError);
    process.exit(1);
  }

  console.log('✅ Seed completed successfully.');

  // Verification query
  const { data: stats } = await supabase
    .from('storm_events')
    .select('count:count(*), min:event_date:min(event_date), max:event_date:max(event_date)')
    .single();

  console.log('STATS:', JSON.stringify(stats));

  // Write to log file as raw output
  const statsRow = stats ? `${stats.count || 0},${stats.min || 'NULL'},${stats.max || 'NULL'}` : '0,NULL,NULL';
  fs.writeFileSync('storm_stats.log', statsRow + '\n');
  console.log('Raw stats written to storm_stats.log');
}

main().catch(console.error);
