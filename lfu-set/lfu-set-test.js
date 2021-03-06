/* global describe, it, expect */
"use strict";

var sinon = require("sinon");
var LfuSet = require("@collections/lfu-set");
var describeCollection = require("../specs/collection");
var describeSet = require("../specs/set");

describe("LfuSet", function () {

    // construction, has, add, get, delete
    function newLfuSet(values) {
        return new LfuSet(values);
    }

    [LfuSet, newLfuSet].forEach(function (LfuSet) {
        describeCollection(LfuSet, [1, 2, 3, 4], true);
        describeCollection(LfuSet, [{id: 0}, {id: 1}, {id: 2}, {id: 3}], true);
        describeSet(LfuSet);
    });

    it("handles many repeated values", function () {
        var set = new LfuSet([1, 1, 1, 2, 2, 2, 1, 2]);
        expect(set.toArray()).toEqual([1, 2]);
    });

    it("removes stale entries", function () {
        var set = LfuSet([3, 4, 1, 3, 2], 3);

        expect(set.length).toBe(3);
        expect(set.toArray()).toEqual([1, 2, 3]);
        set.add(4);
        expect(set.toArray()).toEqual([2, 4, 3]);
    });

    it("emits LFU changes as singleton operation", function () {
        var a = 1, b = 2, c = 3, d = 4;
        var lfuset = LfuSet([d, c, a, b, c], 3);
        lfuset.observeRangeChange(function(plus, minus) {
            expect(plus).toEqual([d]);
            expect(minus).toEqual([a]);
        });
        expect(lfuset.add(d)).toBe(false);
    });

    it("dispatches LRU changes as singleton operation", function () {
        var set = LfuSet([4, 3, 1, 2, 3], 3);
        var spy = sinon.spy();
        set.observeRangeChange(function (plus, minus) {
            spy("before-plus", plus);
            spy("before-minus", minus);
        });
        set.observeRangeChange(function (plus, minus) {
            spy("after-plus", plus);
            spy("after-minus", minus);
        });
        expect(set.add(4)).toBe(false);
        expect(spy.args).toEqual([
            ["before-plus", [4]],
            ["before-minus", [1]],
            ["after-plus", [4]],
            ["after-minus", [1]]
        ]);
    });
});

