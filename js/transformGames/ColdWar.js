export default function transformColdWarData(game) {
    const statsSummary = {
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
      totalHeadshots: 0,
      totalMultikills: 0,
      totalDamage: 0,
      lifetimeStats: {
        lifetimeDeaths: 0,
        lifetimeHits: 0,
        lifetimeKills: 0,
        lifetimeLosses: 0,
        lifetimeScore: 0,
        lifetimeTimePlayed: 0,
        lifetimeWins: 0
      },
      detailedMatches: []
    };
  
    game.stats.forEach((category) => {
      category.data.forEach((row, index) => {
        // Skip header row
        if (index === 0) return;
  
        // Map fields by their position in the row
        const [
          timestamp,
          deviceType,
          gameType,
          map,
          operator,
          kills,
          assists,
          headshots,
          hits,
          shots,
          multikills,
          damageDealt,
          deaths,
          highestMultikill,
          highestStreak,
          rankStart,
          rankEnd,
          score,
          suicides,
          lifetimeDeaths,
          lifetimeHits,
          lifetimeKills,
          lifetimeLosses,
          lifetimeMisses,
          lifetimeScore,
          lifetimeTies,
          lifetimeTimePlayed,
          lifetimeWins,
          xpStart,
          xpEnd
        ] = row;
  
        // Increment stats for the current match
        statsSummary.totalKills += parseInt(kills) || 0;
        statsSummary.totalDeaths += parseInt(deaths) || 0;
        statsSummary.totalAssists += parseInt(assists) || 0;
        statsSummary.totalHeadshots += parseInt(headshots) || 0;
        statsSummary.totalMultikills += parseInt(multikills) || 0;
        statsSummary.totalDamage += parseInt(damageDealt) || 0;
  
        // Aggregate lifetime stats
        statsSummary.lifetimeStats.lifetimeDeaths = parseInt(lifetimeDeaths) || statsSummary.lifetimeStats.lifetimeDeaths;
        statsSummary.lifetimeStats.lifetimeHits = parseInt(lifetimeHits) || statsSummary.lifetimeStats.lifetimeHits;
        statsSummary.lifetimeStats.lifetimeKills = parseInt(lifetimeKills) || statsSummary.lifetimeStats.lifetimeKills;
        statsSummary.lifetimeStats.lifetimeLosses = parseInt(lifetimeLosses) || statsSummary.lifetimeStats.lifetimeLosses;
        statsSummary.lifetimeStats.lifetimeScore = parseInt(lifetimeScore) || statsSummary.lifetimeStats.lifetimeScore;
        statsSummary.lifetimeStats.lifetimeTimePlayed = parseInt(lifetimeTimePlayed) || statsSummary.lifetimeStats.lifetimeTimePlayed;
        statsSummary.lifetimeStats.lifetimeWins = parseInt(lifetimeWins) || statsSummary.lifetimeStats.lifetimeWins;
  
        // Save detailed match data
        statsSummary.detailedMatches.push({
          timestamp,
          deviceType,
          gameType,
          map,
          operator,
          kills: parseInt(kills) || 0,
          assists: parseInt(assists) || 0,
          headshots: parseInt(headshots) || 0,
          deaths: parseInt(deaths) || 0,
          score: parseInt(score) || 0,
          highestMultikill: parseInt(highestMultikill) || 0,
          highestStreak: parseInt(highestStreak) || 0,
          damageDealt: parseInt(damageDealt) || 0
        });
      });
    });
  
    return statsSummary;
  }  