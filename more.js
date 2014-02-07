/* global window */

(function () {
  "use strict";

  var more = window.more = { more: window.more };

  // Wrapper for promises, adding new instance methods resolve and reject, as
  // well as timeout (see below.)
  var promise = (more.Promise = function (f) {
    var promise = new window.Promise(function (resolve, reject) {
      if (typeof resolve === "function") {
        this.resolve = resolve;
        this.reject = reject;
      } else {
        this.resolve = resolve.resolve.bind(resolve);
        this.reject = resolve.reject.bind(resolve);
      }
      if (typeof f === "function") {
        f(this.resolve, this.reject);
      }
    }.bind(this));
    this.then = promise.then.bind(promise);
    this.catch = promise.catch.bind(promise);
  }).prototype;

  // Automatically reject the promise after `ms` ms have passed, with an
  // optional error or error message.
  promise.timeout = function (ms, error) {
    if (ms >= 0) {
      window.setTimeout(function () {
        this.reject(error instanceof Error ? error :
          new Error(error || "Timeout"));
      }.bind(this), ms);
    }
    return this;
  };

  // Resolve a promise when something occurs and return the promise (so that
  // more whens/unless can be added)
  promise.when = function (f) {
    return f(this.resolve, this.reject), this;
  };

  // Rejects the promise when something occurs.
  promise.unless = function (f) {
    return f(this.reject, this.resolve), this;
  };


  // Create an Image element
  more.img = function (attrs) {
    return new Promise(function (resolve, reject) {
      var img = new window.Image();
      if (typeof attrs === "object") {
        for (var attr in attrs) {
          img.setAttribute(attr, attrs[attr]);
        }
      } else {
        img.src = attrs;
      }
      if (img.complete) {
        resolve(img);
      } else {
        img.onload = resolve.bind(null, img);
        img.onerror = reject;
      }
    });
  };

  more.script = function (src, target, async) {
    return new more.Promise(function (resolve, reject) {
      if (!(target instanceof window.Node)) {
        async = !!target;
      }
      if (!target) {
        target = window.document.head || window.document.documentElement;
      }
      var script = target.ownerDocument.createElement("script");
      script.src = src;
      script.async = async;
      script.onload = resolve.bind(null, script);
      script.onerror = reject;
      target.appendChild(script);
    });
  };

  // Fold for a list of promises.
  more.fold = function (ps, f, z) {
    return (function fold (i, n) {
      if (i === n) {
        return new more.Promise().resolve(z);
      }
      if (ps[i] && typeof ps[i].then === "function") {
        return ps[i].then(function (x) {
          z = f(z, x);
          return fold(i + 1, n);
        });
      }
      z = f(z, ps[i]);
      return fold(i + 1, n);
    }(0, ps.length));
  };


  // Synchronization

  // Wrap the return value of a function into a promise, so that the function
  // becomes thenable.
  more.wrap = function (f) {
    return function (v) {
      return new more.Promise().resolve(f(v));
    };
  };

  // Make a promise to delay the execution of f by `ms` milliseconds.
  more.delay = function (f, ms) {
    var promise = new more.Promise();
    window.setTimeout(function () {
      promise.resolve(f());
    }, ms >= 0 ? ms : 0);
    return promise;
  };

  // Make a promise to wait for `ms` milliseconds.
  more.Promise.wait = function (ms) {
    return more.delay(function () {}, ms);
  };

  // Parallel container for promises: turn a list of promises into the promise
  // of a list.
  // TODO change the name to all?
  // TODO any
  more.par = function (ps) {
    return more.fold(ps, function (z, x) {
      return z.push(x), z;
    }, []);
  };

  // Sequential container for promises: turn a list of promises into a single
  // promise for its last value.
  // TODO seq should enforce that promises are resolved in the given order.
  // TODO variants (hard/soft sequence)
  more.seq = function (ps) {
    return more.fold(ps, function (z, x) {
      return typeof x === "function" ? x(z) : x;
    });
  };


  // Reject a promise that gets resolved. Never gets resolved.
  more.reject = function (promise) {
    var reject = new more.Promise();
    promise.then(function (v) {
      reject.reject(v);
    });
    return reject;
  };

  // Events
  // Write something like:
  //   more.seq(
  //     more.seq(
  //       more.event(document, "keydown", function (e) {
  //         return e.shiftKey;
  //       }),
  //       more.reject(more.event(document, "keydown", function (e) {
  //        return !e.shiftKey;
  //       })),
  //       more.event(canvas, "mousedown")
  //     ),
  //     more.events(canvas, "mousemove", function (e) {
  //       context.beginPath();
  //       ...
  //     }),
  //     more.event(canvas, "mouseup").then(function (e) {
  //       canvas.style.cursor = "default";
  //     })
  //   );

  // Return a promise that is resolved once the event has occurred.
  more.event = function (target, type, p) {
    if (typeof p !== function) {
      p = function () {
        return true;
      };
    }
    return new more.Promise(function (resolve) {
      var listener = function (e) {
        if (p(e)) {
          resolve(e);
          target.removeEventListener(type, listener);
        }
      };
      target.addEventListener(type, listener);
    });
  };

  // Setup an event listener and return a promise that is immediately resolved.
  // The event listener can be removed by calling unbind on the promise (e.g.
  // from within more.seq)
  more.events = function (target, type, listener) {
    var promise = new more.Promise().resolve(listener);
    target.addEventListener(type, listener);
    promise.unbind = function () {
      target.removeEventListener(type, listener);
    };
    return promise;
  };

}());
