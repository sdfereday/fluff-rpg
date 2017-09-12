const Values = {
  DMG: -1
}

const Outcomes = {
  WIN: 0,
  TIE: 1,
  LOSE: 2
}

const Types = {
  ROCK: 0,
  PAPER: 1,
  SCISSORS: 2
}

const Helpers = {
  rps: function(a, b) {
    return (a - b + 4) % 3;
  },
  judgeAgainst(outcome, e, type, dmg) {
    return outcome === type ? dmg : 0;
  }
}

class Opponent {

  constructor(name, stats) {
    
    this.name = name;
    this.maxHP = stats.maxHP;
    this.HP = stats.HP;

  }

  changeHealth(n) {

    this.HP += n;
    this.HP = this.HP < 0 ? 0 : this.HP;
    this.HP = this.HP > this.maxHP ? this.maxHP : this.HP;

    if (this.HP <= 0) {
      console.info(this.name + " has perished.");
      return;
    }

    if (n >= 0) {
      console.info(this.name + " loses no health.");
    } else {
      console.info(this.name + " just lost " + Math.abs(n) + " health and has " + this.HP + " remaining.");
    }

  }

  isDead() {
    return this.HP <= 0;
  }

}

class BattleManager {

  // This is a very naive random method, this can easily be improved
  getRandomIntInclusive(min, max) {

		// This parts for AI really
    min = Math.ceil(min);
    max = Math.floor(max);

    //The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;

  }

  decide(a, b) {

    // We need to flip to get the positive for player 'a' (this just fits our context, it may be needed differently depending on the setup)
    return Helpers.rps(b.choice, a.choice);

  }

}

// Set up (should these be consts?)
// let user = new Opponent("User");
// let computer = new Opponent("Computer");
// let bm = new BattleManager();

// Some tests
// let result = bm.decide({
//   opponent: user.name,
//   choice: Types.ROCK
// }, {
//   opponent: computer.name,
//   choice: Types.SCISSORS
// });

// Decide who gets hit (if it's a tie, you might want to do some other fun stuff like weapon clashes)
// user.changeHealth(Helpers.judgeAgainst(result, user, Outcomes.LOSE, Values.DMG));
// computer.changeHealth(Helpers.judgeAgainst(result, computer, Outcomes.WIN, Values.DMG));

// if (result === Outcomes.TIE)
//   console.info("There was a tie.");
