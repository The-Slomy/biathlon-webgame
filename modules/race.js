//Race weakmaps
const _length = new WeakMap();
const _nbrShooting = new WeakMap();
const _skierList = new WeakMap();
const _setRaceRules = new WeakMap();
const _computeSkiingTime = new WeakMap();
const _computeShooting = new WeakMap();
const _computePenalty = new WeakMap();
const _computeShootingRound = new WeakMap();
const _startInterval = new WeakMap();
const _startingPositionList = new WeakMap();

class Race {
  constructor(length, nbrShooting, startInterval = 0) {
    //Private properties
    _length.set(this, length);
    _nbrShooting.set(this, nbrShooting);
    _skierList.set(this, []);
    _startInterval.set(this, startInterval);
    _startingPositionList.set(this, []);

    //Private methods
    _setRaceRules.set(this, () => {
      const nbrShooting = _nbrShooting.get(this);
      const length = _length.get(this);
      const nbrTurn = nbrShooting + 1;
      const lengthPerTurn = length / nbrTurn;
      const startInterval = _startInterval.get(this);

      return {
        nbrShooting: nbrShooting,
        length: length,
        nbrTurn: nbrTurn,
        lengthPerTurn: lengthPerTurn,
        startInterval: startInterval,
      };
    });

    _computeSkiingTime.set(this, (skiingSpeed, fatigue, length) => {
      let skiingTime;

      if (length < 1000) {
        skiingTime =
          //1.7 multiplicator to the skiingSpeed for short distances
          length / ((skiingSpeed * 1.7 * (1 - fatigue / 3 / 100)) / 1.5);
      } else {
        // 1.5 is the best speed possible, this calculation is based on (1.5second per meter = 1500s/25mins for 10km)
        skiingTime = length / ((skiingSpeed * (1 - fatigue / 3 / 100)) / 1.5);
      }

      const skiingObj = {
        time: skiingTime,
        updatedRaceFatigue: fatigue + (length / 1000) * 0.4,
      };

      return skiingObj;
    });

    _computeShootingRound.set(this, (skier, raceFatigue) => {
      let foulsNumber = 0;
      let shootingTime = skier.shootingPreparationTime;
      let penaltyTime = 0;
      let shootingDetail = {
        shotsInterval: [],
        shotsSuccess: [],
        preparationTime: skier.shootingPreparationTime,
      };
      for (let i = 0; i < 5; i++) {
        const currentTargetResult = _computeShooting.get(this)(
          skier.shootingSpeed,
          skier.shootingAccuracy,
          raceFatigue,
          skier.skiingSpeed
        );
        if (!currentTargetResult.isSuccess) {
          shootingDetail.shotsSuccess.push(false);
          foulsNumber++;
          penaltyTime += currentTargetResult.penaltyTime;
          raceFatigue = currentTargetResult.updatedRaceFatigue;
        } else {
          shootingDetail.shotsSuccess.push(true);
        }

        shootingDetail.shotsInterval.push(currentTargetResult.shootingSpeed);
        shootingTime += currentTargetResult.shootingSpeed;
      }

      return {
        shootingDetail: shootingDetail,
        foulsNumber: foulsNumber,
        shootingTime: shootingTime,
        penaltyTime: penaltyTime,
      };
    });

    _computeShooting.set(
      this,
      (shootingSpeed, shootingAccuracy, fatigue, skiingSpeed) => {
        //Test calculation to change later
        const shotObj = {
          isSuccess:
            shootingAccuracy *
              (1 - fatigue / 100) *
              (Math.random() * 0.45 + 0.55) >
            5.5,
          shootingSpeed:
            //Multiply the shootingSpeed and the total by 8 to increase the impact of the shootingSpeed on the result (more realistic results)
            (1 - ((shootingSpeed * 8) / 100) * (1 - fatigue / 100)) * 8,
          penaltyTime: 0,
          updatedRaceFatigue: fatigue,
        };

        const penaltyResult = _computePenalty.get(this)(
          skiingSpeed,
          fatigue,
          250
        );

        if (!shotObj.isSuccess) {
          shotObj.penaltyTime = penaltyResult.time;
          shotObj.updatedRaceFatigue = penaltyResult.updatedRaceFatigue;
        }

        return shotObj;
      }
    );

    _computePenalty.set(this, (skiingSpeed, fatigue, length) => {
      return _computeSkiingTime.get(this)(skiingSpeed, fatigue, length);
      //Use the skiing time method to compute the time lost during a penalty - 250m = length of a penalty turn
      //Here we use a different method to be able to change how a penalty is computed according to the type of race
    });
  }

  //Methods
  addskierListItem(item) {
    if (
      typeof item !== "object" ||
      !item.id ||
      !item.nationality ||
      !item.firstName ||
      !item.lastName ||
      !item.skiingSpeed ||
      !item.shootingSpeed ||
      !item.shootingAccuracy ||
      !item.shootingPreparationTime ||
      item.fatigue === undefined
    )
      throw new Error("The item is not in the correct format");

    _skierList.get(this).push(item);
  }

  setStartingPosition(position, skierId) {
    if (position < 0 || skierId <= 0)
      throw new Error("The starting position must be a positive number");

    _startingPositionList
      .get(this)
      .push({ position: position, skierId: skierId });
  }

  runRace() {
    const rules = _setRaceRules.get(this)();
    const skierList = _skierList.get(this);
    const result = [];
    //This function will need to be refactored to account for draft in race
    //Solution :
    //-First loop to compute time for each skier for each turn
    //-Second loop to compute and adjust this time if the skier is in draft of another one
    //Iterate through each skiers
    skierList.forEach((skier) => {
      let raceFatigue = skier.fatigue;
      const turnResultsArr = [];
      const shootingResultsArr = [];
      //Initialize result array with skier id
      result.push({
        skierId: skier.id,
        turnResultsArr: turnResultsArr,
        shootingResultsArr: shootingResultsArr,
      });

      //Iterate each turn of the race
      for (let i = 0; i < rules.nbrTurn; i++) {
        //If first iteration, push the current record into result array
        turnResultsArr.push(
          _computeSkiingTime.get(this)(
            skier.skiingSpeed,
            raceFatigue,
            rules.lengthPerTurn
          )
        );
        //Update the race fatigue after each turn
        raceFatigue = turnResultsArr[i].updatedRaceFatigue;
        //If we did not get to the last turn yet
        if (i + 1 < rules.nbrTurn) {
          shootingResultsArr.push(
            _computeShootingRound.get(this)(skier, raceFatigue)
          );
        }
      }
    });
    //Return the result object
    return result;
  }

  //Getters
  get startlist() {
    return _skierList.get(this);
  }
  get raceRules() {
    return _setRaceRules.get(this)();
  }

  get startingPositionList() {
    return _startingPositionList.get(this);
  }
  //Setters
}

export class Sprint extends Race {
  constructor(length) {
    super(length, 2, 30);
  }
}

export class Individual extends Race {
  constructor(length) {
    super(length, 4, 30);

    _computePenalty.set(this, (fatigue) => {
      return { time: 60, updatedRaceFatigue: fatigue };
    });
  }
}

export class Pursuit extends Race {
  constructor(length) {
    super(length, 4);
  }
}

export class MassStart extends Race {
  constructor(length) {
    super(length, 4);
  }
}
