/*
  ideas:
  - most experienced roster
  - least experienced roster
  - average player number
  - most from the same team
  - by position
  - longest names
  - shortest names
*/

var owners = [];

function searchOwners(idVal) {
  for (var i=0; i < owners.length; i++) {
    if (owners[i].user_id === idVal) {
      return i;
    }
  }
}

function groupBy(list, keyGetter) {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } 
    else {
      collection.push(item);
    }
  });
  return map;
}

async function getDraft(draftID) {
  let response = await fetch('https://api.sleeper.app/v1/draft/'+draftID+'/picks');
  let data = await response.json();
  return data;
}

async function getOwnerData(userID) {
  let response = await fetch('https://api.sleeper.app/v1/user/'+userID);
  let data = await response.json();
  return data;
}

async function updateOwners(value, key, map) {
  if (key) {
    getOwnerData(key)
    .then(function(ownerData) {
      owners.push(
        {
          user_id: key,
          picks: value,
          display_name: ownerData['display_name'],
          username: ownerData['username'],
          avatar: ownerData['avatar']
        }
      );
    });
  }
  else {
    // user not available, need to adjust logic to support more than one
    owners.push(
      {
        user_id: 'noUser',
        picks: value,
        display_name: 'No User',
        username: 'No User',
        avatar: ''
      }
    );
  }
}

// get draft

// 2018 start-up: 334144315779461120
// rookie: 387312461386117120

getDraft('334144315779461120')
.then(function(draftPicks) {
  console.log('draft picks');
  console.log(draftPicks);

  const userPickMap = groupBy(draftPicks, draftPick => draftPick.picked_by).forEach(updateOwners);

  console.log('owners');
  console.log(owners);
});

