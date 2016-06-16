

// ENTITY DETAILS TOOLS //////////////////////////////////////////////
// hand any of these functions the details-hash of an entity (i.e.
// portal, link, field) and they will return useful data.


// given the entity detail data, returns the team the entity belongs
// to. Uses TEAM_* enum values.
window.getTeam = function(details) {
  return teamStringToId(details.team);
}

window.teamStringToId = function(teamStr) {
  var team = iitc.constants.TEAM_NONE;
  if(teamStr === 'ENLIGHTENED') team = iitc.constants.TEAM_ENL;
  if(teamStr === 'RESISTANCE') team = iitc.constants.TEAM_RES;
  if(teamStr === 'E') team = iitc.constants.TEAM_ENL;
  if(teamStr === 'R') team = iitc.constants.TEAM_RES;
  return team;
}


