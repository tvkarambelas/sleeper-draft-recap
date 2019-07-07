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

var owners = [],
    ownersUpdated = 0;

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

function updateOwners(value, key, map) {
  var draftPosition = value[0].pick_no - 1; // -1 because arrays are zero-based

  if (key) {
    getOwnerData(key)
    .then(function(ownerData) {
      owners[draftPosition] = 
        {
          user_id: key,
          picks: value,
          display_name: ownerData['display_name'],
          username: ownerData['username'],
          avatar: ownerData['avatar'],
          draftPosition: draftPosition
        }
      ;

      ownersUpdated++;

      if(ownersUpdated === map.size) {
        outputOwners();
      }
    });
  }
  else {
    // user not available, need to adjust logic to support more than one
    owners[draftPosition] =
      {
        user_id: 'noUser',
        picks: value,
        display_name: 'No User',
        username: 'No User',
        avatar: '',
        draftPosition: draftPosition
      }
    ;

    ownersUpdated++;

    if(ownersUpdated === map.size) {
      outputOwners();
    }
  } 
}

function outputOwners() {
  console.log('starting to output owners');
  console.log(owners);

  var picksCont = document.getElementById('picks');
  
  for (var i = 0; i < owners.length; i++) {
    var ownerCont = document.createElement("DIV");
    var ownerTitle = document.createElement("H2");
    var ownerPicksCont = document.createElement("UL");
    var owner = owners[i];
    var ownerPicks = owner['picks'];

    console.log('outputting owner '+owner['display_name']);    

    ownerTitle.appendChild(document.createTextNode(owner['display_name']))
    ownerCont.appendChild(ownerTitle);

    // loop over picks
    for (var i2 = 0; i2 < ownerPicks.length; i2++) {
      var pick = ownerPicks[i2];

      var pickCont = document.createElement("LI");
      pickCont.appendChild(document.createTextNode(pick['pick_no']+ ' - '+pick['metadata']['first_name']+' '+pick['metadata']['last_name']))
      ownerPicksCont.appendChild(pickCont);
    }

    ownerCont.appendChild(ownerPicksCont);
    picksCont.appendChild(ownerCont);
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
});



