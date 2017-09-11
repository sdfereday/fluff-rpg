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

const TYPES = {
  NPC: 0,
  PLAYER: 1
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

  initInteractionKeys(cb) {

    this.interactionKey = this.game.input.keyboard.addKey(Phaser.Keyboard.E);

    if (cb)
      this.interactionKey.onDown.add(cb, this);

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
      typeIs: TYPES.PLAYER
    }

    // Component initializers
    this.initCursors(game);
    this.initInteractionKeys(this.onInteractKey);

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

  onInteractKey() {

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
      typeIs: TYPES.NPC
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
  // game.load.spritesheet('veggies', 'assets/sprites/fruitnveg32wh37.png', 32, 32);

}

function create() {

  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.stage.backgroundColor = '#2d2d2d';

  // This risks getting messy, just ensure that stuff is separated out per thing it does.
  this.wallgroup = game.add.group();
  this.npcs = game.add.group();

  this.hero = new Hero(game, 100, 100, 'hero');

  let npc = new NPC(game, 10, 10, 'some-npc');
  npc.onUsedEvent(function(id, name){
     // Do a thing, perhaps tap in to conversationeer, who knows?
     console.info(name + " was used.");
  });

  this.npcs.add(npc);

  // And so on and so forth...
  // ...

}

function update() {

  game.physics.arcade.collide(this.hero, this.wallgroup);

  this.game.physics.arcade.overlap(this.hero, this.npcs, function(player, npc) {
    player.assignTarget(npc);
  }, null, this);

}
