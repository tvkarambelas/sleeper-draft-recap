var owners = [],
    ownersUpdated = 0,
    ownersReady = false;

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

function searchArr(nameKey, myArray){
  for (var i=0; i < myArray.length; i++) {
    if (myArray[i].name.replace(/[^a-zA-Z ]/g, '').toLowerCase() === nameKey.replace(/[^a-zA-Z ]/g, '').toLowerCase()) {
      return myArray[i];
    }
  }
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
        ownersReady = true;
        outputOwners();
        getPlayerNameLengths();
        getPlayerExperience();
      }
    });
  }
  else {
    // user not available
    owners[draftPosition] =
      {
        user_id: 'noUser'+draftPosition,
        picks: value,
        display_name: 'Unknown Owner',
        username: 'Unknown Owner',
        avatar: '',
        draftPosition: draftPosition
      }
    ;

    ownersUpdated++;

    if(ownersUpdated === map.size) {
      ownersReady = true;
      outputOwners();
      getPlayerNameLengths();
      getPlayerExperience();
    }
  } 
}

function outputOwners() {
  console.log('starting to output owners');
  console.log(owners);

  var picksCont = document.getElementById('picks'),
      ownerCount = owners.length;

  for (var i = 0; i < owners.length; i++) {
    var ownerCont = document.createElement('DIV');
    var ownerTitle = document.createElement('H3');
    var ownerPicksCont = document.createElement('UL');
    var owner = owners[i];
    var ownerPicks = owner['picks']; 
    var ownerADPGrade = 0;

    ownerTitle.appendChild(document.createTextNode(owner['display_name']))
    ownerCont.appendChild(ownerTitle);

    // loop over picks
    for (var i2 = 0; i2 < ownerPicks.length; i2++) {
      var pick = ownerPicks[i2];

      var pickADPGrade = getADPGrade(pick);

      if(pickADPGrade != null) {
        ownerADPGrade = ownerADPGrade + pickADPGrade;
      }

      var pickNumberInRound = pick['pick_no']-((ownerCount*pick['round'])-ownerCount);

      var pickCont = document.createElement('LI');
      pickCont.setAttribute('class','pick');
      pickCont.setAttribute('data-adp-grade',pickADPGrade);
      pickCont.appendChild(document.createTextNode(formatNumber(pick['round'])+'.'+formatNumber(pickNumberInRound)+ ' - '+pick['metadata']['first_name']+' '+pick['metadata']['last_name'] + ' ('+pickADPGrade+')'));
      ownerPicksCont.appendChild(pickCont);
    }

    ownerCont.appendChild(ownerPicksCont);
    ownerCont.appendChild(document.createTextNode('ADP Draft Grade: '+ownerADPGrade));
    picksCont.appendChild(ownerCont);
  }
}

function formatNumber(num) {
  // formats numbers less than 10 to have zero in front
  return num > 9 ? "" + num: "0" + num;
}

function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key]; var y = b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}

// get draft
var mainCont = document.getElementById('content'),
    errorsCont = document.getElementById('errors');

mainCont.style.display = 'none';
errorsCont.style.display = 'none';
errorsCont.appendChild(document.createTextNode('There was an error retrieving the supplied draft. Please check the ID and try again.'));

document.getElementById('draft-id-form').addEventListener('submit', function(ev){
  ev.preventDefault();
  var draftID = document.getElementById('draft-id').value;
    
  getDraft(draftID)
  .then(function(draftPicks) {
    console.log('draft picks');
    console.log(draftPicks);

    if (draftPicks) {
      const userPickMap = groupBy(draftPicks, draftPick => draftPick.picked_by).forEach(updateOwners);

      mainCont.style.display = 'block';
      errorsCont.style.display = 'none';
    }
    else {
      mainCont.style.display = 'none';
      errorsCont.style.display = 'block';
    } 
  });
});

// force run on load
document.getElementById('draft-submit').click();

function getPlayerNameLengths() {
  console.log('player name lengths');

  var ownerPlayerNameLengths = [];

  for (var i = 0; i < owners.length; i++) {
    var owner = owners[i],
        charCount = 0;

    for (var i2 = 0; i2 < owner['picks'].length; i2++) {
      var pick = owner['picks'][i2],
          fnLength = 0,
          lnLength = 0;

      fnLength = pick.metadata.first_name.length;
      lnLength = pick.metadata.last_name.length;

      charCount = charCount + fnLength + lnLength;
    }

    ownerPlayerNameLengths.push(
      {
        display_name: owner['display_name'],
        charCount: charCount
      }
    );
  }

  ownerPlayerNameLengths = sortByKey(ownerPlayerNameLengths,'charCount').reverse();

  console.log(ownerPlayerNameLengths);

  // output
  var cont = document.createElement('OL');

  for (var i = 0; i < ownerPlayerNameLengths.length; i++) {
    var owner = ownerPlayerNameLengths[i];
    
    var ownerCont = document.createElement('LI');
    ownerCont.appendChild(document.createTextNode(owner['charCount']+' total chars - '+owner['display_name']));
    cont.appendChild(ownerCont);
  }

  document.getElementById('player-name-length').appendChild(cont);
}

function getPlayerExperience() {
  console.log('player experience');

  var ownerPlayerExp = [];

  for (var i = 0; i < owners.length; i++) {
    var owner = owners[i],
        yearsExp = 0;

    for (var i2 = 0; i2 < owner['picks'].length; i2++) {
      var pick = owner['picks'][i2];

      var exp = parseInt(pick.metadata.years_exp);

      if (!isNaN(exp)) {
        yearsExp = yearsExp + exp;
      } 
    }

    ownerPlayerExp.push(
      {
        display_name: owner['display_name'],
        yearsExp: yearsExp
      }
    );
  }

  ownerPlayerExp = sortByKey(ownerPlayerExp,'yearsExp').reverse();

  console.log(ownerPlayerExp);

  // output
  var cont = document.createElement('OL');

  for (var i = 0; i < ownerPlayerExp.length; i++) {
    var owner = ownerPlayerExp[i];
    
    var ownerCont = document.createElement('LI');
    ownerCont.appendChild(document.createTextNode(owner['yearsExp']+' total years experience - '+owner['display_name']));
    cont.appendChild(ownerCont);
  }

  document.getElementById('player-exp').appendChild(cont);
}

function getADPGrades() {
  console.log('getting ADP grade');

  console.log(adpDynasty2018);

  for (var i = 0; i < 1; i++) {
    var owner = owners[i];

    for (var i2 = 0; i2 < owner['picks'].length; i2++) {
      var pick = owner['picks'][i2];

      var pickADP = pick.pick_no;
      var playerName = pick.metadata.first_name+' '+pick.metadata.last_name;

      // find pick in ADP
      var playerADPData = searchArr(playerName, adpDynasty2018.players);
      
      console.log('finding '+playerName);
      console.log(playerADPData);

      if(playerADPData) {
        // found player
        var playerADPHigh = playerADPData.high,
            playerADPLow = playerADPData.low,
            playerADPAvg = Math.round((playerADPHigh + playerADPLow) / 2);

        console.log('pick no: ' + pickADP);
        console.log('avg ADP: '+playerADPAvg);
        console.log('difference: '+(pickADP - playerADPAvg));
        console.log('----');
      }
    }
  }
}

function getADPGrade(pick) {
  var pickADP = pick.pick_no;
  var playerName = pick.metadata.first_name+' '+pick.metadata.last_name;

  // find pick in ADP
  var playerADPData = searchArr(playerName, adpDynasty2018.players);

  if(playerADPData) {
    // found player
    var playerADPHigh = playerADPData.high,
        playerADPLow = playerADPData.low,
        playerADPAvg = Math.round((playerADPHigh + playerADPLow) / 2);

    return pickADP - playerADPAvg;
  }
  else {
    return null;
  }
}





