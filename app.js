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

/// Data holders (too global?)
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
class Hero extends BaseEntity {

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

  }

  assignTarget(obj) {

    // As mentioned, this shouldn't really be this way.
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

  // App state fsm (runs on top of the actual game layer here)
  this.appFSM = new AppFSM([FieldState, ChatState], this, this.game);

  // Game systems
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.stage.backgroundColor = '#2d2d2d';

  // This risks getting messy, just ensure that stuff is separated out per thing it does.
  this.wallgroup = game.add.group();
  this.npcs = game.add.group();

  // Init some dialogue
  this.dialogueController = new QNodeController();

  // Make some entities
  this.hero = new Hero(game, 100, 100, 'hero');
  let npc = new NPC(game, 10, 10, 'some-npc');
  this.npcs.add(npc);

  // Whatever state is active, do its default thing
  this.interactionKey = this.game.input.keyboard.addKey(Phaser.Keyboard.E);
  this.interactionKey.onDown.add(this.appFSM.onInteract);

}

function update() {

  this.appFSM.update();

}

function onInteraction(targetType) {

  switch (targetType) {
    case ENTITY.NPC:
      this.appFSM.enter("chatState");
      break;
  }

}

function onEventFinished() {

  this.appFSM.enter("fieldState");

}

/// App state runner (avoids global state... sorta)
class AppFSM {

  constructor(states, owner, gameObject) {

    this.immutable = states.map(function (stateCLS) {
      return new stateCLS(owner, gameObject);
    });

    this.stack = [];
    this.stack.push(new BaseState());

  }

  onInteract() {

    this.top().onInteract();

  }

  enter(stateName, owner) {

    if (this.stack.length > 1)
      this.pop();

    let exists = this.stack.find(x => x.name === stateName),
      currentState;

    if (!exists) {

      currentState = this.immutable.find(x => x.name === stateName);
      currentState.enter(owner);

      this.stack.push(currentState);

    }

  }

  update() {

    if (this.top().isFinished)
      this.pop();

    this.top().update();

  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  pop() {
    this.top().exit();
    this.stack.splice(this.stack.length - 1, 1);
  }

}

class BaseState {
  enter() { }
  update() { }
  exit() { }
}

class FieldState extends mix({}).with(UserControlled) {

  constructor(owner, game) {

    this.name = "fieldState";
    this.owner = owner;
    this.game = game;
    this.isFinished = false;

    this.initCursors();
    this.initInteractions();

  }

  enter() {

    this.isFinished = false;

  }

  update() {

    // As pure as I can think of right now.
    let dir = this.inputDirection();

    this.hero.body.velocity.x = dir.x * this.config.movementSpeed;
    this.hero.body.velocity.y = dir.y * this.config.movementSpeed;

    this.game.physics.arcade.collide(this.hero, this.wallgroup);
    this.game.physics.arcade.overlap(this.hero, this.npcs, function (player, npc) {
      // This is also quite global state ish. It'd be better if it some how just got the current collider by
      // asking the physics system on demand, as opposed to assigning in the shadows.
      player.assignTarget(npc); // Please change, it's too tightly coupled.
    }, null, this);

  }

  exit() {
    this.isFinished = true;
  }

  onInteraction() {
    exit();
  }

}

class ChatState {

  constructor(owner, game) {

    this.name = "chatState";
    this.owner = owner;
    this.game = game;
    this.isFinished = false;

    this.dialogueController.ParseData(areaJSON, function (d) {
      console.log("A conversation finished:", d);
      this.exit();
    }, true);

  }

  enter(dialogueDep) {

    this.isFinished = false;

    if (!dialogueDep.started) {
      dialogueDep.Start();
      return;
    }

    // If you really feel daring, consider adding 'events' to the enter and
    // exit of the nodes. This will add for even more flexibility. 'If'.
    let result = dialogueDep.Next();

    if (result.length > 1) {
      console.info("Result was question:");
      console.log(result);
      // nodeController.Answer(1) - wait for input...
    } else {
      console.info("Result was speech");
      console.log(result[0]);
    }

  }

  update() {
    // ...
  }

  exit() {

    this.isFinished = true;

  }

}