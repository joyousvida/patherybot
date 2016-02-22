"use strict";
var crypto = require('crypto');


var MAP_DATA = {"ID":7222,"tiles":[
    [["s",""],["r",""],["o"],["o"],["r",""],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["f",""]],
    [["s",""],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["r",""],["r",""],["f",""]],
    [["s",""],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["f",""]],
    [["s",""],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["f",""]],
    [["s",""],["o"],["r",""],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["f",""]],
    [["s",""],["r",""],["o"],["o"],["r",""],["o"],["o"],["o"],["o"],["o"],["o"],["o"],["f",""]],
    [["s",""],["o"],["o"],["o"],["o"],["c",""],["o"],["o"],["o"],["o"],["o"],["o"],["f",""]]
], "teleports":0,"checkpoints":1,"width":"13","height":"7","walls":"8","name":"Simple","flags":null,"dateCreated":null,"dateExpires":1452402000,"isBlind":false,"isMultiPath":false,"code":"13x7.c1.r7.w8.t0.Simple.:0s.0r.2r.7f.0s.9r.0r.0f.0s.11f.0s.11f.0s.1r.9f.0s.0r.2r.7f.0s.4a.6f."};
var MAP_DATA = {"ID":7222,"tiles":[
    [["s",""],["r",""],["o"],["o"],["f",""]],
    [["s",""],["o"],["o"],["r",""],["f",""]],
], "width":"5","height":"2"};
for (let k of ['width', 'height', 'walls']) {
    MAP_DATA[k] = parseInt(MAP_DATA[k]);
}

var map_util = {
    print: function(map) {
        var border = '*';
        for (var i = 0; i < map.width; i++)
            border += '-';
        border += '*';

        console.log(border);
        for (var i = 0; i < map.height; i++) {
            var s = '|';
            for (var j = 0; j < map.width; j++) {
                s += map.tiles[i][j][0];
            }
            console.log(s + '|');
        }
        console.log(border);
    },
    hash: function(map) {
        var md5sum = crypto.createHash('md5');
        md5sum.update(map.width + ',' + map.height);
        for (var i = 0; i < map.height; i++) {
            for (var j = 0; j < map.width; j++) {
                md5sum.update(map.tiles[i][j][0]);
            }
        }
        return md5sum.digest('hex');
    }
}


class MapGenerator {
    constructor(w, h) {
        this.w = w; this.h = h;

        this._inner_data = [];
        for (var i = 0; i < (w - 2) * h; i++) {
            this._inner_data.push('o');
        }
    }

    _form_map() {
        var tiles = [];
        for (var i = 0; i < this.h; i++) {
            var row = [["s", ""]];
            for (var j = 0; j < this.w - 2; j++) {
                var cell_type = this._inner_data[i * (this.w - 2) + j];
                if (cell_type === "r")
                    row.push(["r", ""]);
                else
                    row.push(["o"]);
            }
            row.push(["f", ""]);
            tiles.push(row);
        }
        return {tiles: tiles, width: this.w, height: this.h};
    }

    *make_maps() {
        while (true) {
            yield this._form_map();

            var cursor = 0;
            while (this._inner_data[cursor] === 'r') {
                this._inner_data[cursor] = 'o';
                cursor += 1;
                if (cursor >= this._inner_data.length)
                    return;
            }
            this._inner_data[cursor] = 'r';
        }
    }
}

var mg = new MapGenerator(4, 2);
for (let m of mg.make_maps()) {
    map_util.print(m);
}


class CostValidator {
    constructor() {
        this._cache = {};
    }

    get_cost(map) {
        var hash = map_util.hash(map);
        if (this._cache[hash] == null)
            this._cache[hash] = this.bfs(map);
        return this._cache[hash];
    }

    bfs(map) {
        var offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        function neighbors(pt) {
            var ret = [];
            for (var i = 0; i < offsets.length; i++) {
                var o = offsets[i];
                var x = o[0] + pt[0], y = o[1] + pt[1];
                if (x < 0 || x >= map.width || y < 0 || y >= map.height)
                    continue;
                ret.push([x, y]); // TODO
            }
            return ret;
        }

        function get_tile(pt) {
            return map.tiles[pt[1]][pt[0]][0];
        }

        var min_dists = {}; // TODO: implicit toString for key
        var q = [];
        for (var i = 0; i < map.height; i++)
            q.push({loc: [0, i], dist: 0});

        while (true) {
            //console.log('md', min_dists);
            //console.log('q', q);
            if (q.length === 0)
                return Infinity;
            var cur = q[0];
            q = q.slice(1);

            var old_dist = min_dists[cur.loc];
            if (old_dist == null || old_dist > cur.dist) {
                min_dists[cur.loc] = cur.dist; // TODO
                var nbrs = neighbors(cur.loc)
                for (let nbr of nbrs) {
                    if (get_tile(nbr) !== "o" && get_tile(nbr) !== "s" && get_tile(nbr) !== "f")
                        continue;
                    q.push({loc: nbr, dist: cur.dist + 1});
                }
            }

            if (get_tile(cur.loc) == "f") // end tile
                return cur.dist;
        }

    }
}

