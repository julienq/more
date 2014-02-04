MORE
====

MORE promises, _i.e._ a Javascript promises library.

MORE provides a slightly different Promise API and functionality to deal with
timing and lists of promises. More detailed documentation is coming.


## Creating, resolving and rejecting promises

* Create a new promise with `new more.Promise()`.
* Resolve a promise with `promise.resolve(value)`.
* Reject a promise with `promise.reject(value)`.
* Express _when_ a promise should be resolved with `promise.when(f)`. The
  argument `f` is a function that gets called with two functions, `resolve` and
  `reject`, that can be called to revolve or reject the promise. The promise is
  returned. The purpose of this function is to express that the promise can be
  resolved in several ways; for instance:

```js
new more.Promise().when(function (resolve) {
  // resolve when the button is clicked
  button.addEventListener("click", resolve);
}).when(function (resolve) {
  // resolve anyway after a timeout
  setTimeout(resolve, 5000);
}).then(function (value) {
  // Continue after a click or after a timeout
});
```

* Express when a promise should be rejected with `promise.unless(f)`, which is
  the same as **when** except that the arguments to f are reversed so f is
  called with `reject` and `resolve`.
* Set a timeout on a promise with `promise.timeout(ms, error)`. The promise will
  be automatically rejected after **ms** milliseconds, with an optional error
  object or message.


## Folding lists of promises

* Fold over a list of promises with `more.fold(ps, f, z)` where **ps** is a list
  of promises; **f(z, p)** is the function folding over the promise; and **z**
  is the initial value.
* Collect promises in parallel with `more.par(ps)`, which turns a list of
  promises into the promise of a list.
* Collect promises in sequence with `more.seq(ps)`, which turns a list of
  promises into the promise of a value.


## Media and timing

TODO
