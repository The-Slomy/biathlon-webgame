const initialState = {
  shootingItemList: [],
  intermediateItemList: [],
};

export default class State extends EventTarget {
  constructor(skierList, result, startList, raceRules) {
    super();

    this.state = initialState;

    this.skierList = skierList;
    this.result = result;
    this.startList = startList;
    this.raceRules = raceRules;
    this.intermediateList = [];
  }
  checkIfAddItem(ms) {
    this.intermediateList.forEach((item) => {
      const index = this.startList
        .map((arr) => arr.skierId)
        .indexOf(item.skierId);
      const startInterval = this.raceRules.startInterval;
      const startingPosition = this.startList[index].position;
      const skierInterval = startInterval * startingPosition * 1000;
      //If the stopwatch has reached a time record
      if (
        item.timeBeforeShooting * 1000 + skierInterval <= ms &&
        item.timeBeforeShooting !== null &&
        !item.isShootingDisplayed
      ) {
        const shootingDetail = this.#getShootingStats(
          item.skierId,
          item.intermediate
        );
        this.#addShootingRecord(
          item.intermediate,
          shootingDetail,
          item.skierId
        );
        item.isShootingDisplayed = true;
      }

      if (
        item.intermediateTime * 1000 + skierInterval <= ms &&
        !item.isIntermediateDisplayed
      ) {
        this.#addIntermediateRecord(
          item.intermediate,
          item.intermediateTime,
          item.skierId
        );
        item.isIntermediateDisplayed = true;
      }
    });
  }

  resetState() {
    const state = {};

    this.#saveState(state);
  }

  //Helper methods
  getIntermediates() {
    const intermediateList = [];

    this.result.forEach((item) => {
      const skierId = item.skierId;
      let totalTime = 0;
      let shootingTime = 0;
      let skiingTime = 0;
      let timeBeforeShooting = 0;
      item.turnResultsArr.forEach((result, index) => {
        // There isn't any shooting round on the last round
        skiingTime += result.time;
        if (index < item.turnResultsArr.length - 1) {
          timeBeforeShooting = skiingTime + shootingTime;
          shootingTime +=
            item.shootingResultsArr[index].shootingTime +
            item.shootingResultsArr[index].penaltyTime;
        } else timeBeforeShooting = null;
        totalTime = skiingTime + shootingTime;
        intermediateList.push({
          skierId: skierId,
          timeBeforeShooting: timeBeforeShooting,
          intermediateTime: totalTime,
          intermediate: index,
        });
      });
      //And order it
      const orderedArr = intermediateList.sort((time1, time2) => {
        if (time1.time < time2.time) {
          return -1;
        } else if (time1.time > time2.time) {
          return 1;
        } else return 0;
      });

      this.intermediateList = orderedArr;
    });
  }

  updateShootingIsRendered() {
    const state = this.#getState();

    if (state.shootingItemList)
      state.shootingItemList.forEach((item) => {
        item.shootingDetail.alreadyRendered = true;
      });

    this.#saveState(state, false);
  }

  #getShootingStats(skierId, currentTurn) {
    const skierRaceDetail = this.result.filter(
      (item) => item.skierId === skierId
    );

    const shootingDetail =
      skierRaceDetail[0].shootingResultsArr[currentTurn].shootingDetail;
    return shootingDetail;
  }

  #getFullName(skierId) {
    const skier = this.skierList.find((skier) => skier.id === skierId);
    const fullName = `${skier.firstName} ${skier.lastName}`;

    return fullName;
  }

  //Public getters
  get intermediatesState() {
    return this.#getState().intermediateItemList;
  }

  get shootingsState() {
    return this.#getState().shootingItemList;
  }

  //Save & get state
  #addShootingRecord(currentTurn, shootingDetailIn, skierId) {
    const state = this.#getState();

    const fullName = this.#getFullName(skierId);
    const shootingDetail = shootingDetailIn;
    shootingDetail.alreadyRendered = false;

    state.shootingItemList.push({
      currentTurn,
      shootingDetail,
      fullName,
      skierId,
    });

    this.#saveState(state);
  }

  #addIntermediateRecord(currentTurn, time, skierId) {
    const state = this.#getState();

    const fullName = this.#getFullName(skierId);
    state.intermediateItemList.push({ currentTurn, time, fullName, skierId });

    this.#saveState(state);
  }

  #getState() {
    return this.state;
  }

  #saveState(state, isRender = true) {
    this.state = state;

    if (isRender) this.dispatchEvent(new Event("statechange"));
  }
}
