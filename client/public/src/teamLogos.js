// NBA Team logo mappings
// Uses ESPN CDN for reliable, high-quality logos
// Falls back to local files in /images/teams/ if needed

// Team abbreviations for ESPN CDN URL pattern
export const teamAbbreviationsForLogos = {
  // Eastern Conference
  "Atlanta Hawks":        "atl",
  "Boston Celtics":       "bos",
  "Brooklyn Nets":        "bkn",
  "Charlotte Hornets":    "cha",
  "Chicago Bulls":        "chi",
  "Cleveland Cavaliers":  "cle",
  "Detroit Pistons":      "det",
  "Indiana Pacers":       "ind",
  "Miami Heat":           "mia",
  "Milwaukee Bucks":      "mil",
  "New York Knicks":      "ny",
  "Orlando Magic":        "orl",
  "Philadelphia 76ers":   "phi",
  "Toronto Raptors":      "tor",
  "Washington Wizards":   "wsh",

  // Western Conference
  "Dallas Mavericks":         "dal",
  "Denver Nuggets":           "den",
  "Golden State Warriors":    "gs",
  "Houston Rockets":          "hou",
  "Los Angeles Clippers":     "lac",
  "Los Angeles Lakers":       "lal",
  "Memphis Grizzlies":        "mem",
  "Minnesota Timberwolves":   "min",
  "New Orleans Pelicans":     "no",
  "Oklahoma City Thunder":    "okc",
  "Phoenix Suns":             "phx",
  "Portland Trail Blazers":   "por",
  "Sacramento Kings":         "sac",
  "San Antonio Spurs":        "sa",
  "Utah Jazz":                "utah",
};

// Helper function to get logo URL for a team (uses ESPN CDN)
export function getTeamLogoUrl(teamName, size = 100) {
  const abbrev = teamAbbreviationsForLogos[teamName];
  if (abbrev) {
    return `https://a.espncdn.com/i/teamlogos/nba/500/${abbrev}.png`;
  }
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
  "Atlanta Hawks":        "ATL",
  "Boston Celtics":       "BOS",
  "Brooklyn Nets":        "BKN",
  "Charlotte Hornets":    "CHA",
  "Chicago Bulls":        "CHI",
  "Cleveland Cavaliers":  "CLE",
  "Detroit Pistons":      "DET",
  "Indiana Pacers":       "IND",
  "Miami Heat":           "MIA",
  "Milwaukee Bucks":      "MIL",
  "New York Knicks":      "NYK",
  "Orlando Magic":        "ORL",
  "Philadelphia 76ers":   "PHI",
  "Toronto Raptors":      "TOR",
  "Washington Wizards":   "WAS",
  "Dallas Mavericks":     "DAL",
  "Denver Nuggets":       "DEN",
  "Golden State Warriors":"GSW",
  "Houston Rockets":      "HOU",
  "Los Angeles Clippers": "LAC",
  "Los Angeles Lakers":   "LAL",
  "Memphis Grizzlies":    "MEM",
  "Minnesota Timberwolves":"MIN",
  "New Orleans Pelicans": "NOP",
  "Oklahoma City Thunder":"OKC",
  "Phoenix Suns":         "PHX",
  "Portland Trail Blazers":"POR",
  "Sacramento Kings":     "SAC",
  "San Antonio Spurs":    "SAS",
  "Utah Jazz":            "UTA",
};

export function getTeamAbbreviation(teamName) {
  return teamAbbreviations[teamName] || teamName.substring(0, 3).toUpperCase();
}
