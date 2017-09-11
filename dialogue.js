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

// Actions would be small nodes on their own that might trigger certain events. It may be wise to set some sort of 'async' flag, as if set, you could run them all at once whilst the conversation happens. Such as if you have people talking in a cutscene, but need to walk around also. You may also want some sort of 'wait' mechanism to halt it at certain points. This, is out of the scope of this tool however.
// Actions should also just be id's in this instance. It makes no sense to carry that extra weight around. It 'might' even make sense to do this for nodes too.
// ...

// https://gamedev.stackexchange.com/questions/40519/how-do-dialog-trees-work
// A node is universal. For every sentence, a node will exist in memory, ready to be used for whatever purpose.
var QNode = function (data, isRoot) {

    // Sanitize - Let us make the assumption that all text must be set. For automated events, you may wish to handle these elsewhere.
    if (!data.text)
        throw "- Node would be redundant (are you passing any data?)";

    this.id = data.id;
    this.text = data.text;

    // Collections
    this.linked = data.linked;
    this.actions = data.actions;

    // If a choice node, may wish to treat differently (user input for instance)
    this.isRoot = isRoot;
    this.hasChoice = this.linked.length > 1;
    this.isEnd = this.linked.length === 0;

    // Origin will be a previous node that this node connected to, it optional however
    this.origin = [];

    // Internal, used for locking the current node to prevent overwrite
    this.isCurrent = false;

};

QNode.prototype.Current = function () {
    return this.isCurrent;
};

QNode.prototype.SetOrigin = function (node) {
    this.origin.push(node);
};

QNode.prototype.Enter = function () {
    this.isCurrent = true;
    return this;
};

QNode.prototype.Exit = function (choice) {
    this.isCurrent = false;
    return this;
};

// Node controller handles the IO of nodes and their linkages. As for how many instances these are yet to be, I'm not sure. Be it per conversation, or one per game / level.
var QNodeController = function () {

    // Only one node can be active at a time in the stream.
    this.activeNode = null;
    this.nodes = [];
    this.onComplete = null;

    return this;

};

QNodeController.prototype.FindNode = function (id) {

    return this.nodes.find(function (item) {
        return item.id === id;
    });

};

// NodeController data parser (public facing)
QNodeController.prototype.ParseData = function (data, cb, linkOrigin) {

    var self = this;

    // Initial node mappings
    this.nodes = data.map(function (nodeData, i) {
        return new QNode(nodeData, i === 0);
    });

    // After-binding history (optional, if you never intend to know the origin then don't bother with it)
    if (linkOrigin) {
        this.nodes.forEach(function (node) {
            node.linked.forEach(function (id) {
                let ch = self.FindNode(id);
                if (!ch)
                    throw "- A node of ID " + id + " could not be located.";
                ch.SetOrigin(node);
                if (node.hasChoice)
                    ch.isChoice = true;
            });
        });
    }

    // and callback
    if (typeof cb === 'function')
        this.onComplete = cb;

    return this;

};

// NodeController access (public facing)
QNodeController.prototype.Start = function () {

    this.started = true;
    this.activeNode = this.nodes[0];
    this.activeNode.Enter();

    return [this.activeNode];

};

QNodeController.prototype.Answer = function (choice) {

    if (!this.started)
        return;

    choice = choice ? choice : 0;

    if (choice > this.activeNode.linked.length - 1)
        throw "- Choice index was out of range.";

    this.activeNode.Exit();
    this.activeNode = this.FindNode(this.activeNode.linked[choice]);
    this.activeNode.Enter();

    return [this.activeNode];

};

QNodeController.prototype.Next = function () {

    if (this.activeNode && this.activeNode.isEnd && this.onComplete) {
        this.onComplete({
            "duh": "blooo"
        });
        return;
    }

    if (!this.started)
        return;

    this.started = !this.activeNode.isEnd;

    let self = this;
    let collection = this.activeNode.linked.map(function (id) {
        return self.FindNode(id);
    });

    if (collection.length > 1) {

        return collection;

    } else {

        this.activeNode.Exit();
        this.activeNode = collection[0];
        this.activeNode.Enter();

        return [this.activeNode];

    }

};

///// And to test the lot out:
var nodeController = new QNodeController()
    .ParseData(json, function (d) {
        console.log("Conversation done:", d);
    }, true);

/// If you really feel daring, consider adding 'events' to the enter and exit of the nodes. This will add for even more flexibility. 'If'.
// Current index text
console.log(nodeController.Start());

/*
console.log(nodeController.Next());
console.log(nodeController.Next());
 
// Move to the next one (add a choice, otherwise will default to zero)
console.log(nodeController.Answer(1));
 
console.log(nodeController.Next());
console.log(nodeController.Next());*/

// Visualize
// create an array with nodes
var lastNode, lastY = 0, inc = 0;
var nodes = nodeController.nodes.map(function (nd, i) {

    var wasChoice = false;

    if (lastNode && lastNode.isChoice) {
        wasChoice = true;
        lastY = (i - 1) * 64;
        inc += 1;
    } else {
        inc = 0;
    }

    lastNode = nd;

    return {
        id: nd.id,
        label: nd.text,
        color: nd.isChoice ? { background: 'black', color: 'white' } : { background: 'pink' },
        x: wasChoice ? 300 / inc : i,
        y: wasChoice ? lastY : i * 64,
        fixed: true,
        physics: false
    }

}), edges = [];

nodeController.nodes.forEach(function (nd) {

    nd.linked.forEach(function (link) {

        edges.push({
            from: nd.id,
            to: link,
            arrows: 'to'
        });

    });

});