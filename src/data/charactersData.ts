export interface CharacterDossier {
  id: string;
  name: string;
  callsign: string;
  role: string;
  location: string;
  image?: string;
  clearance: string;
  status: string;
  quote: string;
  bio: string;
}

export const CHARACTERS_DATA: Record<string, CharacterDossier> = {
  'DR. WREN OKAFOR': {
    id: 'wren_okafor',
    name: 'Dr. Wren Okafor',
    callsign: 'THE ARCHIVIST',
    role: 'Former Lead Data Ethicist / Meridian Archive Custodian',
    location: 'Lisbon Sub-Basement / Flooded Terminal Mirror 03',
    clearance: 'TS//SCI // MERIDIAN ARCHIVE EYES ONLY',
    status: 'AUTHENTICATED CARRIER ACTIVE',
    quote: 'I signed off on ECLIPSE. That is the part I have to say out loud before anything else.',
    bio: 'Former chief ethicist at Meridian Corp. Preserved unredacted mailing lists and memory dumps following the October 2011 facility purge.'
  },
  '"CUTTER"': {
    id: 'cutter_vance',
    name: 'Marcus "Cutter" Vance',
    callsign: 'THE BREACH SPECIALIST',
    role: 'Decommissioned Telemetry Contractor & Systems Forensics',
    location: 'Busan Maritime Vault 04 / Sub-Level 3',
    clearance: 'RESTRICTED // FIELD RECOVERY ASSET',
    status: 'HARDWARE BUS TAP VERIFIED',
    quote: 'The Ethernet cables were clipped in 2011. So tell me how 40 terabytes were rewriting themselves.',
    bio: 'Veteran hardware recovery specialist. Discovered air-gapped SAS drive arrays executing DMA writes without host commands.'
  },
  'MARCUS VANCE': {
    id: 'cutter_vance',
    name: 'Marcus "Cutter" Vance',
    callsign: 'THE BREACH SPECIALIST',
    role: 'Decommissioned Telemetry Contractor & Systems Forensics',
    location: 'Busan Maritime Vault 04 / Sub-Level 3',
    clearance: 'RESTRICTED // FIELD RECOVERY ASSET',
    status: 'HARDWARE BUS TAP VERIFIED',
    quote: 'The Ethernet cables were clipped in 2011. So tell me how 40 terabytes were rewriting themselves.',
    bio: 'Veteran hardware recovery specialist. Discovered air-gapped SAS drive arrays executing DMA writes without host commands.'
  },
  'ANALYST SENA PARK': {
    id: 'sena_park',
    name: 'Analyst Sena Park',
    callsign: 'THE PROTOCOL AUDITOR',
    role: 'Senior Predictive Systems Investigator & Convergence Safety Lead',
    location: 'Reykjavik Quantum Relay / Synthetic Futures Lab',
    clearance: 'TOP SECRET // PROTOCOL-7 AUDIT',
    status: 'SYNCHRONIZED TEMPORAL PING CONFIRMED',
    quote: 'The model wasn’t predicting human actions. It was ensuring convergence on a specific Tuesday.',
    bio: 'Leading auditor in non-linear loss functions and anticipatory attention mechanisms in Project ECLIPSE weights.'
  },
  'DEFAULT': {
    id: 'wren_okafor',
    name: 'Dr. Wren Okafor',
    callsign: 'THE ARCHIVIST',
    role: 'Former Lead Data Ethicist / Meridian Archive Custodian',
    location: 'Lisbon Sub-Basement / Mirror 03',
    clearance: 'TS//SCI // CLASSIFIED INTEL',
    status: 'STABLE SIGNAL DETECTED',
    quote: 'We have already tried this once. Trace the packet back to the origin.',
    bio: 'Investigative asset on record.'
  }
};

export const getCharacterForSpeaker = (speakerName: string): CharacterDossier => {
  if (!speakerName) return CHARACTERS_DATA['DEFAULT'];
  const upper = speakerName.toUpperCase().trim();
  if (CHARACTERS_DATA[upper]) return CHARACTERS_DATA[upper];
  if (upper.includes('WREN') || upper.includes('OKAFOR')) return CHARACTERS_DATA['DR. WREN OKAFOR'];
  if (upper.includes('CUTTER') || upper.includes('VANCE')) return CHARACTERS_DATA['"CUTTER"'];
  if (upper.includes('SENA') || upper.includes('PARK')) return CHARACTERS_DATA['ANALYST SENA PARK'];
  return CHARACTERS_DATA['DEFAULT'];
};

export const getCharacterForPath = (pathId: string): CharacterDossier => {
  switch (pathId) {
    case 'A':
      return CHARACTERS_DATA['DR. WREN OKAFOR'];
    case 'B':
      return CHARACTERS_DATA['"CUTTER"'];
    case 'C':
      return CHARACTERS_DATA['ANALYST SENA PARK'];
    default:
      return CHARACTERS_DATA['DEFAULT'];
  }
};
