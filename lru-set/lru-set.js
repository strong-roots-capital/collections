"use strict";

var Set = require("@collections/set");
var GenericCollection = require("@collections/generic-collection");
var GenericSet = require("@collections/generic-set");
var ObservableObject = require("@collections/observable/object");
var ObservableRange = require("@collections/observable/range");
var equalsOperator = require("@collections/equals");
var hashOperator = require("@collections/hash");
var copy = require("@collections/copy");

module.exports = LruSet;

function LruSet(values, maxLength, equals, hash, getDefault) {
    if (!(this instanceof LruSet)) {
        return new LruSet(values, maxLength, equals, hash, getDefault);
    }
    maxLength = maxLength || Infinity;
    equals = equals || equalsOperator;
    hash = hash || hashOperator;
    getDefault = getDefault || noop;
    this.store = new Set(undefined, equals, hash);
    this.contentEquals = equals;
    this.contentHash = hash;
    this.getDefault = getDefault;
    this.maxLength = maxLength;
    this.length = 0;
    this.addEach(values);
}

copy(LruSet.prototype, GenericCollection.prototype);
copy(LruSet.prototype, GenericSet.prototype);
copy(LruSet.prototype, ObservableObject.prototype);
copy(LruSet.prototype, ObservableRange.prototype);

LruSet.prototype.constructClone = function (values) {
    return new this.constructor(
        values,
        this.maxLength,
        this.contentEquals,
        this.contentHash,
        this.getDefault
    );
};

LruSet.prototype.has = function (value) {
    return this.store.has(value);
};

LruSet.prototype.get = function (value) {
    value = this.store.get(value);
    if (value !== undefined) {
        this.store["delete"](value);
        this.store.add(value);
    } else {
        value = this.getDefault(value);
    }
    return value;
};

LruSet.prototype.add = function (value) {
    var found = this.store.has(value);
    var plus = [], minus = [], eldest;
    // if the value already exists, we delete it and add it back again so it
    // appears at the end of the list of values to truncate
    if (found) {    // update
        this.store["delete"](value);
        this.store.add(value);
    } else if (this.maxLength > 0) {    // add
        // because minus is constructed before adding value, we must ensure the
        // set has positive length. hence the maxLength check.
        plus.push(value);
        if (this.length >= this.maxLength) {
            eldest = this.store.order.head.next;
            minus.push(eldest.value);
        }
        if (this.dispatchesRangeChanges) {
            this.dispatchRangeWillChange(plus, minus, 0);
        }
        this.store.add(value);
        if (minus.length > 0) {
            this.store["delete"](eldest.value);
        }
        // only assign to length once to avoid jitter on length observers
        this.length = this.length + plus.length - minus.length;
        // after change
        if (this.dispatchesRangeChanges) {
            this.dispatchRangeChange(plus, minus, 0);
        }
    }
    // whether it grew
    return plus.length !== minus.length;
};

LruSet.prototype["delete"] = function (value) {
    var found = this.store.has(value);
    if (found) {
        if (this.dispatchesRangeChanges) {
            this.dispatchRangeWillChange([], [value], 0);
        }
        this.store["delete"](value);
        this.length--;
        if (this.dispatchesRangeChanges) {
            this.dispatchRangeChange([], [value], 0);
        }
    }
    return found;
};

LruSet.prototype.one = function () {
    if (this.length > 0) {
        return this.store.one();
    }
};

LruSet.prototype.clear = function () {
    var clearing;
    if (this.dispatchesRangeChanges) {
        clearing = this.toArray();
        this.dispatchRangeWillChange([], clearing, 0);
    }
    var length = this.length;
    this.store.clear();
    this.length = 0;
    if (this.dispatchesRangeChanges) {
        this.dispatchRangeChange([], clearing, 0);
    }
    return length;
};

LruSet.prototype.reduce = function (callback, basis /*, thisp*/) {
    var thisp = arguments[2];
    var set = this.store;
    var index = 0;
    return set.reduce(function (basis, value) {
        return callback.call(thisp, basis, value, index++, this);
    }, basis, this);
};

LruSet.prototype.reduceRight = function (callback, basis /*, thisp*/) {
    var thisp = arguments[2];
    var set = this.store;
    var index = this.length - 1;
    return set.reduceRight(function (basis, value) {
        return callback.call(thisp, basis, value, index--, this);
    }, basis, this);
};

LruSet.prototype.iterate = function () {
    return this.store.iterate();
};

function noop() {}
