const _firstName = new WeakMap();
const _lastName = new WeakMap();
const _age = new WeakMap();
const _nationality = new WeakMap();
const _teamId = new WeakMap();
const _abilities = new WeakMap();
const _fatigue = new WeakMap();
const _personId = new WeakMap();

class Person {
  constructor(id, firstName, lastName, age, nationality) {
    //Private properties
    _personId.set(this, id);
    _firstName.set(this, firstName);
    _lastName.set(this, lastName);
    _age.set(this, age);
    _nationality.set(this, nationality);
    _teamId.set(this, undefined);
  }
  //Getters
  get id() {
    return _personId.get(this);
  }

  get fullName() {
    return `${_firstName.get(this)} ${_lastName.get(this)}`;
  }
  //Setters
  set team(teamId) {
    //Later will need to check if the team we try to link the person to exists in the database
    _teamId.set(this, teamId);
  }
}

export class Skier extends Person {
  constructor(id, firstName, lastName, age, nationality) {
    super(id, firstName, lastName, age, nationality);

    //Private properties
    _abilities.set(this, {
      skiingSpeed: undefined,
      shootingSpeed: undefined,
      shootingAccuracy: undefined,
      shootingPreparationTime: undefined,
    });
    _fatigue.set(this, 0);
  }
  //Getters
  get raceObject() {
    return {
      id: _personId.get(this),
      nationality: _nationality.get(this),
      firstName: _firstName.get(this),
      lastName: _lastName.get(this),
      skiingSpeed: _abilities.get(this).skiingSpeed,
      shootingSpeed: _abilities.get(this).shootingSpeed,
      shootingAccuracy: _abilities.get(this).shootingAccuracy,
      shootingPreparationTime: _abilities.get(this).shootingPreparationTime,
      fatigue: _fatigue.get(this),
    };
  }

  //Setters
  //For now we manually set the abilities (so no controle etc.) - later this setter will not exist
  set abilities({
    skiingSpeed,
    shootingSpeed,
    shootingAccuracy,
    shootingPreparationTime,
  }) {
    _abilities.set(this, {
      skiingSpeed,
      shootingSpeed,
      shootingAccuracy,
      shootingPreparationTime,
    });
  }

  set fatigue(fatigue) {
    if (fatigue >= 0) {
      _fatigue.set(this, fatigue);
    } else throw new Error("The fatigue argument must be a positive number");
  }
  //Later we will have a private method computing the abilities of the skier when creating the object
  //And setters to update those abilities (throught trainings etc.)
}
