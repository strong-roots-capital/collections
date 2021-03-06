/* global describe, it, expect */
"use strict";

var sinon = require("sinon");
var extendSpyExpectation = require("../specs/spy-expectation");
var ObservableRange = require("@collections/observable/range");

describe("ObservableRange", function () {

    describe("observeRangeChange", function () {

        extendSpyExpectation();

        it("observe, dispatch", function () {
            var range = Object.create(ObservableRange.prototype);
            var spy;

            var observer = range.observeRangeChange(function (plus, minus, index) {
                spy(plus, minus, index);
            });

            spy = sinon.spy();
            range.dispatchRangeChange([1, 2, 3], [], 0);
            expect(spy).toHaveBeenCalledWith([1, 2, 3], [], 0);

            observer.cancel();
        });
    });

});
