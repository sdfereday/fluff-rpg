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
var json = [{
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

//
const ENTITY = {
  NPC: 0,
  PLAYER: 1
};

const APPMODES = {
  FIELD: 0,
  CHAT: 1
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

/// Components (class-likes)
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

/// Data holders
class PlayerInventory {

  constructor() {
    this.inventory = [];
  }

}

/// Entities
class Hero extends mix(Phaser.Sprite).with(UserControlled) {

  constructor(game, x, y, name) {

    // Phaser requires all of these to happen
    super(game, x, y, name);

    game.add.existing(this);
    game.physics.arcade.enable(this);

    // Custom stats and things
    this.id = "???";
    this.name = name;

    this.stats = {
      hp: 4,
      maxHp: 4
    }

    this.config = {
      movementSpeed: 200,
      typeIs: ENTITY.PLAYER
    }

    // Component initializers
    this.initCursors(game);

  }

  typeIs() {
    return this.config.typeIs;
  }

  update() {

    // As pure as I can think of right now.
    let dir = this.inputDirection();

    this.body.velocity.x = dir.x * this.config.movementSpeed;
    this.body.velocity.y = dir.y * this.config.movementSpeed;

  }

  assignTarget(obj) {

    if (!this.busy)
      this.currentTarget = obj;

  }

  interactWithTarget() {

    if (this.busy)
      return;

    if (this.currentTarget) {
      this.currentTarget.use();
      this.busy = true;
    }

  }

}

class NPC extends mix(Phaser.Sprite).with() {

  constructor(game, x, y, name) {

    // Phaser requires all of these to happen
    super(game, x, y, name);

    game.add.existing(this);
    game.physics.arcade.enable(this);

    // Custom stats and things
    this.id = "???";
    this.name = name;

    this.stats = {
      hp: 4,
      maxHp: 4
    }

    this.config = {
      movementSpeed: 200,
      typeIs: ENTITY.NPC
    }

    // Component initializers
    // ...

    // Callbacks (consider revising callbacks TODO)
    this.onUsed = null;

  }

  typeIs() {
    return this.config.typeIs;
  }

  onUsedEvent(cb) {

    if (typeof cb === 'function')
      this.onUsed = cb;

  }

  use() {

    // Do default action, and if a callback has been defined, run that also (great for exterior needs)
    // ...

    if (this.onUsed)
      this.onUsed.call(this, this.id, this.name);

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

  // Init dialogue:
  let dialogue = new QNodeController();
  this.dialogueController = dialogue;

  // The question: Should json be prepared for each, or shall it just come from a repo?
  // How will this work if source data changes from entity to entity? Does it at all?
  // Is it worth just loading it for the area, then load it based on ID?
  dialogue.ParseData(json, function (d) {
    console.log("A conversation finished:", d);
  }, true);

  // This risks getting messy, just ensure that stuff is separated out per thing it does.
  this.wallgroup = game.add.group();
  this.npcs = game.add.group();

  this.hero = new Hero(game, 100, 100, 'hero');

  let npc = new NPC(game, 10, 10, 'some-npc');
  npc.onUsedEvent(function (id, name) {

    // Do a thing, perhaps tap in to conversationeer, who knows?
    console.info(name + " was used.");

    // Starts a global action state (chat)
    dialogue.Start();

  }, this);

  this.npcs.add(npc);

  // And so on and so forth...
  // ...

  // Key (easier as global)
  this.interactionKey = game.input.keyboard.addKey(Phaser.Keyboard.E);

  /// This idea falls down because it expects that you 'know' what you're interacting with at that particular time.
  // So far the only thing I can think of is to get your current targets type, then form a decision based from that. It doesn't
  // expect you to know what you're dealing with, it just passes its type back through the pipeline, then you can do an interaction
  // check from that point.
  this.interactionKey.onDown.add(onInteraction, this);

}

function update() {

  game.physics.arcade.collide(this.hero, this.wallgroup);

  this.game.physics.arcade.overlap(this.hero, this.npcs, function (player, npc) {
    player.assignTarget(npc);
  }, null, this);

}

function runDialogue() {

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

function onInteraction(APPMODE) {

  switch (APPMODE) {
    case APPMODES.FIELD:
      this.hero.interactWithTarget();
      break;
    case APPMODES.CHAT:
      runDialogue();
      break;
  }

}