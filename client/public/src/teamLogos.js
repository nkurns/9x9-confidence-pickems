// NFL Team logo mappings
// Uses ESPN CDN for reliable, high-quality logos
// Falls back to local files in /images/teams/ if needed

// Team abbreviations for ESPN CDN URL pattern
export const teamAbbreviationsForLogos = {
  // AFC East
  "Buffalo Bills": "buf",
  "Miami Dolphins": "mia",
  "New England Patriots": "ne",
  "New York Jets": "nyj",

  // AFC North
  "Baltimore Ravens": "bal",
  "Cincinnati Bengals": "cin",
  "Cleveland Browns": "cle",
  "Pittsburgh Steelers": "pit",

  // AFC South
  "Houston Texans": "hou",
  "Indianapolis Colts": "ind",
  "Jacksonville Jaguars": "jax",
  "Tennessee Titans": "ten",

  // AFC West
  "Denver Broncos": "den",
  "Kansas City Chiefs": "kc",
  "Las Vegas Raiders": "lv",
  "Los Angeles Chargers": "lac",

  // NFC East
  "Dallas Cowboys": "dal",
  "New York Giants": "nyg",
  "Philadelphia Eagles": "phi",
  "Washington Commanders": "wsh",

  // NFC North
  "Chicago Bears": "chi",
  "Detroit Lions": "det",
  "Green Bay Packers": "gb",
  "Minnesota Vikings": "min",

  // NFC South
  "Atlanta Falcons": "atl",
  "Carolina Panthers": "car",
  "New Orleans Saints": "no",
  "Tampa Bay Buccaneers": "tb",

  // NFC West
  "Arizona Cardinals": "ari",
  "Los Angeles Rams": "lar",
  "San Francisco 49ers": "sf",
  "Seattle Seahawks": "sea",
};

// Helper function to get logo URL for a team (uses ESPN CDN)
export function getTeamLogoUrl(teamName, size = 100) {
  const abbrev = teamAbbreviationsForLogos[teamName];
  if (abbrev) {
    // ESPN CDN URL pattern - sizes: 100, 500
    return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbrev}.png`;
  }
  // Return a placeholder if team not found
  return `/images/teams/placeholder.svg`;
}

// Alternative: Use local files if you prefer to host logos yourself
export function getTeamLogoUrlLocal(teamName) {
  const abbrev = teamAbbreviationsForLogos[teamName];
  if (abbrev) {
    return `/images/teams/${abbrev}.png`;
  }
  return `/images/teams/placeholder.svg`;
}

// Helper function to get team abbreviation (for fallback display)
export const teamAbbreviations = {
  "Arizona Cardinals": "ARI",
  "Atlanta Falcons": "ATL",
  "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR",
  "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN",
  "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN",
  "Detroit Lions": "DET",
  "Green Bay Packers": "GB",
  "Houston Texans": "HOU",
  "Indianapolis Colts": "IND",
  "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV",
  "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LAR",
  "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN",
  "New England Patriots": "NE",
  "New Orleans Saints": "NO",
  "New York Giants": "NYG",
  "New York Jets": "NYJ",
  "Philadelphia Eagles": "PHI",
  "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA",
  "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN",
  "Washington Commanders": "WAS",
};

export function getTeamAbbreviation(teamName) {
  return teamAbbreviations[teamName] || teamName.substring(0, 3).toUpperCase();
}
