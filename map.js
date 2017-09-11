const MapTypes = {
    STARTPOINT: 0,
    KEY: 1,
    DOOR: 2,
    ENEMY: 3,
    EXIT: 4
}

const Types = {
    UNSET: 0
};

const LevelMap = [
    [0, 0, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
    [0, 0, 0]
];

const MapObjects = [{
    type: MapTypes.STARTPOINT,
    properties: {
        x: 0,
        y: 0
    }
}, {
    type: MapTypes.KEY,
    position: {
        x: 1,
        y: 2
    },
    properties: {
        id: "keyid1"
    }
}, {
    type: MapTypes.DOOR,
    position: {
        x: 2,
        y: 6
    },
    properties: {
        locked: true,
        unlockedBy: "keyid1"
    }
}, {
    type: MapTypes.ENEMY,
    position: {
        x: 3,
        y: 4
    },
    properties: {
        id: "enemyid1"
    }
}];

/// Helpers
const Helpers = {

    scoreTile: function (above, below, left, right) {
        let sum = 0;
        if (above) sum += 1;
        if (left) sum += 2;
        if (below) sum += 4;
        if (right) sum += 8;
        return sum;
    }

};

class Cell {

    constructor(x, y, v) {
        this.x = x;
        this.y = y;
        this.walkable = v;
        this.bitValue = 0;
        this.type = Types.UNSET;
    }

    setBitValue(n) {
        this.bitValue = n;
    }

    setType(type) {
        this.type = type;
    }

    setWalkable(type) {
        this.walkable = type;
    }

    isWalkable() {
        return this.walkable;
    }

}

class MapManager {

    constructor() {

        this.w = 0;
        this.h = 0;
        this.mapCache = [];
        this.initialMapData = [];

    }

    build(mapData) {

        let generated = [];

        // We start with row to rotate the array in a way that reads better for us, the user, to deal with.
        for (let row = 0; row < mapData.length; row++) {
            for (let col = 0; col < mapData[row].length; col++) {
                // x & y still apply in the same way of course as they don't care about array placement (walkable type does care however).
                generated.push(new Cell(col, row, mapData[row][col]));
            }
        }

        // Not zero-based
        this.w = mapData.length;
        this.h = mapData[0].length;

        this.mapData = [].concat(mapData);
        this.mapCache = generated;

        // We also want to set the bit value of each cell to know what graphic to give that particular thing. It's nothing complex, just a simple index mapping to a group. We only care about the walkable tiles, since we'll never see any other graphics but the one we're on. If this was an overhead game, we'd also need to parse the walls as well as floors. However we do need to find out where the walls are.
        let walkables = this.mapCache.filter(x => x.isWalkable()),
            i = 0,
            len = walkables.length;

        for (i; i < len; i++) {

            let currentTile = walkables[i];

            // Remember: We want 'walls' next to this tile.
            let up = !this.isWalkable(currentTile.x, currentTile.y - 1);
            let down = !this.isWalkable(currentTile.x, currentTile.y + 1);
            let right = !this.isWalkable(currentTile.x + 1, currentTile.y);
            let left = !this.isWalkable(currentTile.x - 1, currentTile.y);

            let tscore = Helpers.scoreTile(up, down, right, left);

            currentTile.setBitValue(tscore);

        }

        return [].concat(this.mapCache);

    }

    ready() {

        return this.mapCache.length > 0;

    }

    findFirstWalkable() {

        return this.mapCache.find(c => c.isWalkable());

    }

    getAt(x, y) {

        if (y < 0 || x < 0 || y > this.h || x > this.w)
            return;

        return this.mapCache.find(c => c.x === x && c.y === y);

    }

    isWalkable(x, y) {

        let c = this.getAt(x, y);
        return c && c.isWalkable();

    }

    setWalkable(x, y, state) {

        this.getAt(x, y).setWalkable(state);

    }

    raw() {

        /// We return the multi-dimensional map data here to use for decorating. It would make more claritive sense
        /// however to use 'mapCache', so will consider that one later. For instance, we can 'setWalkable' dynamically,
        /// but we aren't doing that to the map data, only the map cache (not sure if that's relevant).
        // Ensures immutability
        // https://vincent.billey.me/pure-javascript-immutable-array/
        return [].concat(this.mapData);

    }

    getMapCache() {

        return [].concat(this.mapCache);

    }

}

///
let mapMan = new MapManager(),
    start;

document.getElementById("go").addEventListener('click', function () {

    mapMan.build(LevelMap);

    start = mapMan.findFirstWalkable();

    /// Summary
    console.log(mapMan.getMapCache());

});

