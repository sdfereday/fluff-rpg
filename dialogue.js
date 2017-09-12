// Actions would be small nodes on their own that might trigger certain events. It may be wise to set some sort of 'async' flag, as if set, you could run them all at once whilst the conversation happens. Such as if you have people talking in a cutscene, but need to walk around also. You may also want some sort of 'wait' mechanism to halt it at certain points. This, is out of the scope of this tool however.
// Actions should also just be id's in this instance. It makes no sense to carry that extra weight around. It 'might' even make sense to do this for nodes too.
// ...

// https://gamedev.stackexchange.com/questions/40519/how-do-dialog-trees-work
// A node is universal. For every sentence, a node will exist in memory, ready to be used for whatever purpose.

class QNode {

    constructor(data, isRoot) {

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

    }


    Current() {
        return this.isCurrent;
    }

    SetOrigin(node) {
        this.origin.push(node);
    }

    Enter() {
        this.isCurrent = true;
        return this;
    }

    Exit(choice) {
        this.isCurrent = false;
        return this;
    }

}

// Node controller handles the IO of nodes and their linkages. As for how many instances these are yet to be, I'm not sure. Be it per conversation, or one per game / level.
class QNodeController {

    constructor() {
        // Only one node can be active at a time in the stream.
        this.started = false;
        this.activeNode = null;
        this.nodes = [];
        this.onComplete = null;

        return this;
    }

    IsRunning() {
        return this.started;
    }

    FindNode(id) {

        return this.nodes.find(function (item) {
            return item.id === id;
        });

    }

    // NodeController data parser (public facing)
    ParseData(data, onFinished, linkOrigin) {

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
        if (typeof onFinished === 'function')
            this.onComplete = onFinished;

        return this;

    }

    // NodeController access (public facing)
    Start() {

        this.started = true;
        this.activeNode = this.nodes[0];
        this.activeNode.Enter();

        return [this.activeNode];

    }

    Answer(choice) {

        if (!this.started)
            return;

        choice = choice ? choice : 0;

        if (choice > this.activeNode.linked.length - 1)
            throw "- Choice index was out of range.";

        this.activeNode.Exit();
        this.activeNode = this.FindNode(this.activeNode.linked[choice]);
        this.activeNode.Enter();

        return [this.activeNode];

    }

    Next() {

        if (this.activeNode && this.activeNode.isEnd && this.onComplete) {
            this.started = false;
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

    }

}