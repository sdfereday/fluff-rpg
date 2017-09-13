/*
- Rock paper-scissors battle system
- Walk around, find the key to unlock the door
- Convert to es6

Will need:
1 Hero
1 Villain
1 Tiny inventory
1 Map

*/

// Some data (conversation)
/// You could quite easily re-engineer this 'thing' to use for scripted events also. With a couple of asyn and event callbacks. I'd suggest bolting on a module to the core however, as it should be left pristine.
// Data mockup (we'd likely auto-generate this on the fly). So for each new node made with text, it gets a guid. Then when we set a link to it, we plant that guid in the linked bit. Or an index, whatever works.
var areaJSON = [{
  "id": "0",
  "text": "Huh.",
  "linked": ["1"],
  "actions": []
}, {
  "id": "1",
  "text": "You don't look like you're from around here.",
  "linked": ["2", "3"],
  "actions": []
}, {
  "id": "2",
  "text": "I've lived here all my life!",
  "linked": ["4"],
  "actions": []
}, {
  "id": "3",
  "text": "I came here from Newton.",
  "linked": ["4"],
  "actions": []
}, {
  "id": "4",
  "text": "I don't care either way. This was fun.",
  "linked": [],
  "actions": []
}];

//...
const ENTITY = {
  NULLED: -1,
  NPC: 0,
  PLAYER: 1
};

const APPSTATES = {
  FIELD: 0,
  BUSY: 1
};

// Global app mode (viewable by all, to revise)
let appState = APPSTATES.FIELD;
class AppState {
  static getCurrentState() {
    return appState;
  }
  static setCurrentState(mode) {
    appState = mode;
  }
}

/// Helpers
let mix = (superclass) => new MixinBuilder(superclass);

class MixinBuilder {
  constructor(superclass) {
    this.superclass = superclass;
  }

  with(...mixins) {
    return mixins.reduce((c, mixin) => mixin(c), this.superclass);
  }
}

/// Components to implement if needed
let UserControlled = (superclass) => class extends superclass {

  initCursors() {

    this.cursors = this.game.input.keyboard.createCursorKeys();

  }

  inputDirection() {

    return {
      x: this.cursors.left.isDown || this.cursors.right.isDown ? (this.cursors.left.isDown ? -1 : 1) : 0,
      y: this.cursors.up.isDown || this.cursors.down.isDown ? (this.cursors.up.isDown ? -1 : 1) : 0
    }

  }

};

let UserInteraction = (superclass) => class extends superclass {

  initInteractions() {

    this.interactionKey = this.game.input.keyboard.addKey(Phaser.Keyboard.E);

  }

  onInteractionEvent(cb, ctx) {

    ctx = ctx ? ctx : this;
    this.interactionKey.onDown.add(cb.bind(ctx));

  }

};

/// Data holders
class PlayerInventory {

  constructor() {
    this.inventory = [];
  }

}

/// Base Entity
class BaseEntity extends Phaser.Sprite {

  constructor(game, x, y, name) {

    // Phaser requires all of these to happen
    super(game, x, y, name);
    game.add.existing(this);
    game.physics.arcade.enable(this);

    this.id = "???";
    this.name = name;
    this.typeIs = ENTITY.NULLED;

  }

}

/// Entities
class Hero extends mix(BaseEntity).with(UserControlled, UserInteraction) {

  constructor(game, x, y, name) {

    // Phaser requires all of these to happen
    super(game, x, y, name);

    // Custom stats and things
    this.stats = {
      hp: 4,
      maxHp: 4
    }

    this.config = {
      movementSpeed: 200
    }

    this.typeIs = ENTITY.PLAYER;

    // Component initializers
    this.initCursors();
    this.initInteractions();

  }

  update() {

    // As pure as I can think of right now.
    let dir = this.inputDirection();

    this.body.velocity.x = dir.x * this.config.movementSpeed;
    this.body.velocity.y = dir.y * this.config.movementSpeed;

  }

  assignTarget(obj) {

    this.currentTarget = obj;

  }

  getTargetType() {

    return this.currentTarget ? this.currentTarget.typeIs : ENTITY.NULLED;

  }

}

class NPC extends BaseEntity {

  constructor(game, x, y, name) {

    // Phaser requires all of these to happen
    super(game, x, y, name);

    // Custom stats and things
    this.stats = {
      hp: 4,
      maxHp: 4
    }

    this.config = {
      movementSpeed: 200
    }

    this.typeIs = ENTITY.NPC

    // Component initializers
    // ...

  }

  use() {

    return this.typeIs;

  }

}

/// Game world
const game = new Phaser.Game(256, 256, Phaser.CANVAS, 'phaser-example', {
  preload: preload,
  create: create,
  update: update
});

function preload() {

  game.load.image('hero', 'https://raw.githubusercontent.com/Josh-Miller/public-images/master/plane.png');
  game.load.image('some-npc', 'https://raw.githubusercontent.com/Josh-Miller/public-images/master/plane.png');
  // game.load.spritesheet('veggies', 'assets/sprites/fruitnveg32wh37.png', 32, 32);

}

function create() {

  // Game systems
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.stage.backgroundColor = '#2d2d2d';

  // This risks getting messy, just ensure that stuff is separated out per thing it does.
  this.wallgroup = game.add.group();
  this.npcs = game.add.group();

  // Init some dialogue
  this.dialogueController = new QNodeController();
  this.dialogueController.ParseData(areaJSON, function (d) {
    console.log("A conversation finished:", d);
    onEventFinished();
  }, true);

  // Make some entities
  this.hero = new Hero(game, 100, 100, 'hero');
  this.hero.onInteractionEvent(function () {
    console.log("An interaction started:", this.hero.getTargetType());
    onInteraction.call(this, this.hero.getTargetType());
  }, this);

  let npc = new NPC(game, 10, 10, 'some-npc');
  this.npcs.add(npc);

}

function update() {

  // Global state is a bit of a no no, and must be avoided if at all possible. TODO.
  if (appState === APPSTATES.BUSY)
    return;

  game.physics.arcade.collide(this.hero, this.wallgroup);

  this.game.physics.arcade.overlap(this.hero, this.npcs, function (player, npc) {
    // This is also quite global state ish. It'd be better if it some how just got the current collider by
    // asking the physics system on demand, as opposed to assigning in the shadows.
    player.assignTarget(npc);
  }, null, this);

}

function runDialogue() {

  if(!this.dialogueController.started) {
    this.dialogueController.Start();
    return;
  }

  // If you really feel daring, consider adding 'events' to the enter and
  // exit of the nodes. This will add for even more flexibility. 'If'.
  let result = this.dialogueController.Next();

  if (result.length > 1) {
    console.info("Result was question:");
    console.log(result);
    // nodeController.Answer(1) - wait for input...
  } else {
    console.info("Result was speech");
    console.log(result[0]);
  }

}

function onInteraction(targetType) {

  switch (targetType) {
    case ENTITY.NPC:
      AppState.setCurrentState(APPSTATES.BUSY);
      runDialogue.call(this);
      break;
  }

}

function onEventFinished() {

  AppState.setCurrentState(APPSTATES.FIELD);

}