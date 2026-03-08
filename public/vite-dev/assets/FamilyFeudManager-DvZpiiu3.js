import {
  v as Ao,
  X as Co,
  n as Do,
  s as Eo,
  R as F,
  D as Io,
  u as Kn,
  a as No,
  w as Ro,
  p as So,
  k as Zn,
  r as b,
  d as ce,
  e as ho,
  l as vo,
  t as vt,
  o as wo,
  m as xo,
  F as xt,
  j as y,
  i as yo,
} from './application-BWXX6fgN.js';

/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Po = [['path', { d: 'm6 9 6 6 6-6', key: 'qrunsl' }]],
  Wt = ce('chevron-down', Po);
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const _o = [['path', { d: 'm9 18 6-6-6-6', key: 'mthhwq' }]],
  Ht = ce('chevron-right', _o);
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Oo = [
    [
      'path',
      {
        d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0',
        key: '1nclc0',
      },
    ],
    ['circle', { cx: '12', cy: '12', r: '3', key: '1v7zrd' }],
  ],
  Bo = ce('eye', Oo);
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const To = [['path', { d: 'M21 12a9 9 0 1 1-6.219-8.56', key: '13zald' }]],
  er = ce('loader-circle', To);
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ko = [
    [
      'path',
      {
        d: 'M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z',
        key: '10ikf1',
      },
    ],
  ],
  Lo = ce('play', ko);
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Mo = [
    ['path', { d: 'M5 12h14', key: '1ays0h' }],
    ['path', { d: 'M12 5v14', key: 's699le' }],
  ],
  $o = ce('plus', Mo);
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Fo = [
    ['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', key: '1357e3' }],
    ['path', { d: 'M3 3v5h5', key: '1xhq8a' }],
  ],
  Dt = ce('rotate-ccw', Fo);
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Go = [
    [
      'path',
      {
        d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
        key: '1s2grr',
      },
    ],
    ['path', { d: 'M20 2v4', key: '1rf3ol' }],
    ['path', { d: 'M22 4h-4', key: 'gwowj6' }],
    ['circle', { cx: '4', cy: '20', r: '2', key: '6kqj1y' }],
  ],
  jo = ce('sparkles', Go);
/**
 * @license lucide-react v0.554.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Wo = [
    ['path', { d: 'M10 11v6', key: 'nco0om' }],
    ['path', { d: 'M14 11v6', key: 'outv1u' }],
    ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', key: 'miytrc' }],
    ['path', { d: 'M3 6h18', key: 'd0wm0j' }],
    ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', key: 'e791ji' }],
  ],
  tr = ce('trash-2', Wo);
function Ho(e, t) {
  const { code: n, registerFamilyFeudDispatch: r, unregisterFamilyFeudDispatch: o } = Kn(),
    { adminFetch: s } = ho(),
    [i, a] = b.useState(!1),
    [c, l] = b.useState(null);
  b.useEffect(() => {
    if (e && t)
      return (
        r == null || r(e, t),
        () => {
          o == null || o(e);
        }
      );
  }, [e, t, r, o]);
  const p = b.useCallback(
      async (h, g, w = 'New Bucket') => {
        if (!n) return (l('Missing experience code'), null);
        (a(!0), l(null));
        const D = `/api/experiences/${encodeURIComponent(n)}/blocks/${encodeURIComponent(h)}/family_feud/add_bucket`;
        try {
          const C = await s(D, {
              method: 'POST',
              body: JSON.stringify({ question_id: g, name: w }),
            }),
            v = await C.json();
          if (!C.ok || (v == null ? void 0 : v.success) === !1) {
            const I = (v == null ? void 0 : v.error) || 'Failed to add bucket';
            return (l(I), null);
          }
          return v.data.bucket;
        } catch (C) {
          const v =
            C instanceof Error && C.message === 'Authentication expired'
              ? 'Authentication expired'
              : 'Connection error. Please try again.';
          return (l(v), null);
        } finally {
          a(!1);
        }
      },
      [n, s],
    ),
    u = b.useCallback(
      async (h, g, w, D) => {
        if (!n) return (l('Missing experience code'), null);
        (a(!0), l(null));
        const C = `/api/experiences/${encodeURIComponent(n)}/blocks/${encodeURIComponent(h)}/family_feud/buckets/${encodeURIComponent(w)}`;
        try {
          const v = await s(C, {
              method: 'PATCH',
              body: JSON.stringify({ question_id: g, name: D }),
            }),
            I = await v.json();
          if (!v.ok || (I == null ? void 0 : I.success) === !1) {
            const S = (I == null ? void 0 : I.error) || 'Failed to rename bucket';
            return (l(S), !1);
          }
          return !0;
        } catch (v) {
          const I =
            v instanceof Error && v.message === 'Authentication expired'
              ? 'Authentication expired'
              : 'Connection error. Please try again.';
          return (l(I), !1);
        } finally {
          a(!1);
        }
      },
      [n, s],
    ),
    d = b.useCallback(
      async (h, g, w) => {
        if (!n) return (l('Missing experience code'), null);
        (a(!0), l(null));
        const D = `/api/experiences/${encodeURIComponent(n)}/blocks/${encodeURIComponent(h)}/family_feud/buckets/${encodeURIComponent(w)}`;
        try {
          const C = await s(D, { method: 'DELETE', body: JSON.stringify({ question_id: g }) }),
            v = await C.json();
          if (!C.ok || (v == null ? void 0 : v.success) === !1) {
            const I = (v == null ? void 0 : v.error) || 'Failed to delete bucket';
            return (l(I), !1);
          }
          return !0;
        } catch (C) {
          const v =
            C instanceof Error && C.message === 'Authentication expired'
              ? 'Authentication expired'
              : 'Connection error. Please try again.';
          return (l(v), !1);
        } finally {
          a(!1);
        }
      },
      [n, s],
    ),
    f = b.useCallback(
      async (h, g, w, D) => {
        if (!n) return (l('Missing experience code'), null);
        (a(!0), l(null));
        const C = `/api/experiences/${encodeURIComponent(n)}/blocks/${encodeURIComponent(h)}/family_feud/answers/${encodeURIComponent(w)}/bucket`;
        try {
          const v = await s(C, {
              method: 'PATCH',
              body: JSON.stringify({ question_id: g, bucket_id: D }),
            }),
            I = await v.json();
          if (!v.ok || (I == null ? void 0 : I.success) === !1) {
            const S = (I == null ? void 0 : I.error) || 'Failed to assign answer';
            return (l(S), !1);
          }
          return !0;
        } catch (v) {
          const I =
            v instanceof Error && v.message === 'Authentication expired'
              ? 'Authentication expired'
              : 'Connection error. Please try again.';
          return (l(I), !1);
        } finally {
          a(!1);
        }
      },
      [n, s],
    ),
    m = b.useCallback(
      async (h, g) => {
        if (!n) return (l('Missing experience code'), null);
        (a(!0), l(null));
        const w = `/api/experiences/${encodeURIComponent(n)}/blocks/${encodeURIComponent(h)}/family_feud/auto_categorize`;
        try {
          const D = await s(w, { method: 'POST', body: JSON.stringify({ question_id: g }) }),
            C = await D.json();
          if (!D.ok || (C == null ? void 0 : C.success) === !1) {
            const v = (C == null ? void 0 : C.error) || 'Failed to auto-categorize answers';
            return (l(v), null);
          }
          return C.data;
        } catch (D) {
          const C =
            D instanceof Error && D.message === 'Authentication expired'
              ? 'Authentication expired'
              : 'Connection error. Please try again.';
          return (l(C), null);
        } finally {
          a(!1);
        }
      },
      [n, s],
    );
  return {
    addBucket: p,
    renameBucket: u,
    deleteBucket: d,
    assignAnswer: f,
    autoCategorize: m,
    isLoading: i,
    error: c,
    setError: l,
  };
}
function nr(e) {
  b.useEffect(() => {
    const t = e.current;
    if (!t) return;
    const n = () => {
      const { scrollTop: o, scrollHeight: s, clientHeight: i } = t,
        a = o === 0,
        c = o + i >= s - 1;
      (a ? t.setAttribute('data-at-top', 'true') : t.removeAttribute('data-at-top'),
        c ? t.setAttribute('data-at-bottom', 'true') : t.removeAttribute('data-at-bottom'));
    };
    (n(), t.addEventListener('scroll', n, { passive: !0 }));
    const r = new MutationObserver(n);
    return (
      r.observe(t, { childList: !0, subtree: !0 }),
      () => {
        (t.removeEventListener('scroll', n), r.disconnect());
      }
    );
  }, [e]);
}
function Y(e) {
  return `Minified Redux error #${e}; visit https://redux.js.org/Errors?code=${e} for the full message or use the non-minified dev environment for full errors. `;
}
var Uo = (typeof Symbol == 'function' && Symbol.observable) || '@@observable',
  fn = Uo,
  gn = () => Math.random().toString(36).substring(7).split('').join('.'),
  Vo = { INIT: `@@redux/INIT${gn()}`, REPLACE: `@@redux/REPLACE${gn()}` },
  mn = Vo;
function zo(e) {
  if (typeof e != 'object' || e === null) return !1;
  let t = e;
  for (; Object.getPrototypeOf(t) !== null; ) t = Object.getPrototypeOf(t);
  return Object.getPrototypeOf(e) === t || Object.getPrototypeOf(e) === null;
}
function rr(e, t, n) {
  if (typeof e != 'function') throw new Error(Y(2));
  if (
    (typeof t == 'function' && typeof n == 'function') ||
    (typeof n == 'function' && typeof arguments[3] == 'function')
  )
    throw new Error(Y(0));
  if ((typeof t == 'function' && typeof n > 'u' && ((n = t), (t = void 0)), typeof n < 'u')) {
    if (typeof n != 'function') throw new Error(Y(1));
    return n(rr)(e, t);
  }
  let r = e,
    o = t,
    s = new Map(),
    i = s,
    a = 0,
    c = !1;
  function l() {
    i === s &&
      ((i = new Map()),
      s.forEach((g, w) => {
        i.set(w, g);
      }));
  }
  function p() {
    if (c) throw new Error(Y(3));
    return o;
  }
  function u(g) {
    if (typeof g != 'function') throw new Error(Y(4));
    if (c) throw new Error(Y(5));
    let w = !0;
    l();
    const D = a++;
    return (
      i.set(D, g),
      function () {
        if (w) {
          if (c) throw new Error(Y(6));
          ((w = !1), l(), i.delete(D), (s = null));
        }
      }
    );
  }
  function d(g) {
    if (!zo(g)) throw new Error(Y(7));
    if (typeof g.type > 'u') throw new Error(Y(8));
    if (typeof g.type != 'string') throw new Error(Y(17));
    if (c) throw new Error(Y(9));
    try {
      ((c = !0), (o = r(o, g)));
    } finally {
      c = !1;
    }
    return (
      (s = i).forEach((D) => {
        D();
      }),
      g
    );
  }
  function f(g) {
    if (typeof g != 'function') throw new Error(Y(10));
    ((r = g), d({ type: mn.REPLACE }));
  }
  function m() {
    const g = u;
    return {
      subscribe(w) {
        if (typeof w != 'object' || w === null) throw new Error(Y(11));
        function D() {
          const v = w;
          v.next && v.next(p());
        }
        return (D(), { unsubscribe: g(D) });
      },
      [fn]() {
        return this;
      },
    };
  }
  return (
    d({ type: mn.INIT }),
    { dispatch: d, subscribe: u, getState: p, replaceReducer: f, [fn]: m }
  );
}
function bn(e, t) {
  return function (...n) {
    return t(e.apply(this, n));
  };
}
function hn(e, t) {
  if (typeof e == 'function') return bn(e, t);
  if (typeof e != 'object' || e === null) throw new Error(Y(16));
  const n = {};
  for (const r in e) {
    const o = e[r];
    typeof o == 'function' && (n[r] = bn(o, t));
  }
  return n;
}
function or(...e) {
  return e.length === 0
    ? (t) => t
    : e.length === 1
      ? e[0]
      : e.reduce(
          (t, n) =>
            (...r) =>
              t(n(...r)),
        );
}
function qo(...e) {
  return (t) => (n, r) => {
    const o = t(n, r);
    let s = () => {
      throw new Error(Y(15));
    };
    const i = { getState: o.getState, dispatch: (c, ...l) => s(c, ...l) },
      a = e.map((c) => c(i));
    return ((s = or(...a)(o.dispatch)), { ...o, dispatch: s });
  };
}
var Yo = {};
/**
 * @license React
 * use-sync-external-store-with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Ue = b;
function Xo(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var Qo = typeof Object.is == 'function' ? Object.is : Xo,
  Jo = Ue.useSyncExternalStore,
  Ko = Ue.useRef,
  Zo = Ue.useEffect,
  es = Ue.useMemo,
  ts = Ue.useDebugValue;
Yo.useSyncExternalStoreWithSelector = function (e, t, n, r, o) {
  var s = Ko(null);
  if (s.current === null) {
    var i = { hasValue: !1, value: null };
    s.current = i;
  } else i = s.current;
  s = es(
    function () {
      function c(f) {
        if (!l) {
          if (((l = !0), (p = f), (f = r(f)), o !== void 0 && i.hasValue)) {
            var m = i.value;
            if (o(m, f)) return (u = m);
          }
          return (u = f);
        }
        if (((m = u), Qo(p, f))) return m;
        var h = r(f);
        return o !== void 0 && o(m, h) ? ((p = f), m) : ((p = f), (u = h));
      }
      var l = !1,
        p,
        u,
        d = n === void 0 ? null : n;
      return [
        function () {
          return c(t());
        },
        d === null
          ? void 0
          : function () {
              return c(d());
            },
      ];
    },
    [t, n, r, o],
  );
  var a = Jo(e, s[0], s[1]);
  return (
    Zo(
      function () {
        ((i.hasValue = !0), (i.value = a));
      },
      [a],
    ),
    ts(a),
    a
  );
};
var ns = b.version.startsWith('19'),
  rs = Symbol.for(ns ? 'react.transitional.element' : 'react.element'),
  os = Symbol.for('react.portal'),
  ss = Symbol.for('react.fragment'),
  is = Symbol.for('react.strict_mode'),
  as = Symbol.for('react.profiler'),
  cs = Symbol.for('react.consumer'),
  ls = Symbol.for('react.context'),
  sr = Symbol.for('react.forward_ref'),
  us = Symbol.for('react.suspense'),
  ds = Symbol.for('react.suspense_list'),
  Ut = Symbol.for('react.memo'),
  ps = Symbol.for('react.lazy'),
  fs = sr,
  gs = Ut;
function ms(e) {
  if (typeof e == 'object' && e !== null) {
    const { $$typeof: t } = e;
    switch (t) {
      case rs:
        switch (((e = e.type), e)) {
          case ss:
          case as:
          case is:
          case us:
          case ds:
            return e;
          default:
            switch (((e = e && e.$$typeof), e)) {
              case ls:
              case sr:
              case ps:
              case Ut:
                return e;
              case cs:
                return e;
              default:
                return t;
            }
        }
      case os:
        return t;
    }
  }
}
function bs(e) {
  return ms(e) === Ut;
}
function hs(e, t, n, r, { areStatesEqual: o, areOwnPropsEqual: s, areStatePropsEqual: i }) {
  let a = !1,
    c,
    l,
    p,
    u,
    d;
  function f(D, C) {
    return ((c = D), (l = C), (p = e(c, l)), (u = t(r, l)), (d = n(p, u, l)), (a = !0), d);
  }
  function m() {
    return ((p = e(c, l)), t.dependsOnOwnProps && (u = t(r, l)), (d = n(p, u, l)), d);
  }
  function h() {
    return (
      e.dependsOnOwnProps && (p = e(c, l)),
      t.dependsOnOwnProps && (u = t(r, l)),
      (d = n(p, u, l)),
      d
    );
  }
  function g() {
    const D = e(c, l),
      C = !i(D, p);
    return ((p = D), C && (d = n(p, u, l)), d);
  }
  function w(D, C) {
    const v = !s(C, l),
      I = !o(D, c, C, l);
    return ((c = D), (l = C), v && I ? m() : v ? h() : I ? g() : d);
  }
  return function (C, v) {
    return a ? w(C, v) : f(C, v);
  };
}
function ys(e, { initMapStateToProps: t, initMapDispatchToProps: n, initMergeProps: r, ...o }) {
  const s = t(e, o),
    i = n(e, o),
    a = r(e, o);
  return hs(s, i, a, e, o);
}
function vs(e, t) {
  const n = {};
  for (const r in e) {
    const o = e[r];
    typeof o == 'function' && (n[r] = (...s) => t(o(...s)));
  }
  return n;
}
function Tt(e) {
  return function (n) {
    const r = e(n);
    function o() {
      return r;
    }
    return ((o.dependsOnOwnProps = !1), o);
  };
}
function yn(e) {
  return e.dependsOnOwnProps ? !!e.dependsOnOwnProps : e.length !== 1;
}
function ir(e, t) {
  return function (r, { displayName: o }) {
    const s = function (a, c) {
      return s.dependsOnOwnProps ? s.mapToProps(a, c) : s.mapToProps(a, void 0);
    };
    return (
      (s.dependsOnOwnProps = !0),
      (s.mapToProps = function (a, c) {
        ((s.mapToProps = e), (s.dependsOnOwnProps = yn(e)));
        let l = s(a, c);
        return (
          typeof l == 'function' &&
            ((s.mapToProps = l), (s.dependsOnOwnProps = yn(l)), (l = s(a, c))),
          l
        );
      }),
      s
    );
  };
}
function Vt(e, t) {
  return (n, r) => {
    throw new Error(
      `Invalid value of type ${typeof e} for ${t} argument when connecting component ${r.wrappedComponentName}.`,
    );
  };
}
function xs(e) {
  return e && typeof e == 'object'
    ? Tt((t) => vs(e, t))
    : e
      ? typeof e == 'function'
        ? ir(e)
        : Vt(e, 'mapDispatchToProps')
      : Tt((t) => ({ dispatch: t }));
}
function Ds(e) {
  return e ? (typeof e == 'function' ? ir(e) : Vt(e, 'mapStateToProps')) : Tt(() => ({}));
}
function ws(e, t, n) {
  return { ...n, ...e, ...t };
}
function Cs(e) {
  return function (n, { displayName: r, areMergedPropsEqual: o }) {
    let s = !1,
      i;
    return function (c, l, p) {
      const u = e(c, l, p);
      return (s ? o(u, i) || (i = u) : ((s = !0), (i = u)), i);
    };
  };
}
function Is(e) {
  return e ? (typeof e == 'function' ? Cs(e) : Vt(e, 'mergeProps')) : () => ws;
}
function Ss(e) {
  e();
}
function Es() {
  let e = null,
    t = null;
  return {
    clear() {
      ((e = null), (t = null));
    },
    notify() {
      Ss(() => {
        let n = e;
        for (; n; ) (n.callback(), (n = n.next));
      });
    },
    get() {
      const n = [];
      let r = e;
      for (; r; ) (n.push(r), (r = r.next));
      return n;
    },
    subscribe(n) {
      let r = !0;
      const o = (t = { callback: n, next: null, prev: t });
      return (
        o.prev ? (o.prev.next = o) : (e = o),
        function () {
          !r ||
            e === null ||
            ((r = !1),
            o.next ? (o.next.prev = o.prev) : (t = o.prev),
            o.prev ? (o.prev.next = o.next) : (e = o.next));
        }
      );
    },
  };
}
var vn = { notify() {}, get: () => [] };
function ar(e, t) {
  let n,
    r = vn,
    o = 0,
    s = !1;
  function i(h) {
    p();
    const g = r.subscribe(h);
    let w = !1;
    return () => {
      w || ((w = !0), g(), u());
    };
  }
  function a() {
    r.notify();
  }
  function c() {
    m.onStateChange && m.onStateChange();
  }
  function l() {
    return s;
  }
  function p() {
    (o++, n || ((n = t ? t.addNestedSub(c) : e.subscribe(c)), (r = Es())));
  }
  function u() {
    (o--, n && o === 0 && (n(), (n = void 0), r.clear(), (r = vn)));
  }
  function d() {
    s || ((s = !0), p());
  }
  function f() {
    s && ((s = !1), u());
  }
  const m = {
    addNestedSub: i,
    notifyNestedSubs: a,
    handleChangeWrapper: c,
    isSubscribed: l,
    trySubscribe: d,
    tryUnsubscribe: f,
    getListeners: () => r,
  };
  return m;
}
var As = () =>
    typeof window < 'u' &&
    typeof window.document < 'u' &&
    typeof window.document.createElement < 'u',
  Rs = As(),
  Ns = () => typeof navigator < 'u' && navigator.product === 'ReactNative',
  Ps = Ns(),
  _s = () => (Rs || Ps ? b.useLayoutEffect : b.useEffect),
  nt = _s();
function xn(e, t) {
  return e === t ? e !== 0 || t !== 0 || 1 / e === 1 / t : e !== e && t !== t;
}
function wt(e, t) {
  if (xn(e, t)) return !0;
  if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1;
  const n = Object.keys(e),
    r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (let o = 0; o < n.length; o++)
    if (!Object.prototype.hasOwnProperty.call(t, n[o]) || !xn(e[n[o]], t[n[o]])) return !1;
  return !0;
}
var Os = {
    childContextTypes: !0,
    contextType: !0,
    contextTypes: !0,
    defaultProps: !0,
    displayName: !0,
    getDefaultProps: !0,
    getDerivedStateFromError: !0,
    getDerivedStateFromProps: !0,
    mixins: !0,
    propTypes: !0,
    type: !0,
  },
  Bs = { name: !0, length: !0, prototype: !0, caller: !0, callee: !0, arguments: !0, arity: !0 },
  Ts = { $$typeof: !0, render: !0, defaultProps: !0, displayName: !0, propTypes: !0 },
  cr = { $$typeof: !0, compare: !0, defaultProps: !0, displayName: !0, propTypes: !0, type: !0 },
  ks = { [fs]: Ts, [gs]: cr };
function Dn(e) {
  return bs(e) ? cr : ks[e.$$typeof] || Os;
}
var Ls = Object.defineProperty,
  Ms = Object.getOwnPropertyNames,
  wn = Object.getOwnPropertySymbols,
  $s = Object.getOwnPropertyDescriptor,
  Fs = Object.getPrototypeOf,
  Cn = Object.prototype;
function kt(e, t) {
  if (typeof t != 'string') {
    if (Cn) {
      const s = Fs(t);
      s && s !== Cn && kt(e, s);
    }
    let n = Ms(t);
    wn && (n = n.concat(wn(t)));
    const r = Dn(e),
      o = Dn(t);
    for (let s = 0; s < n.length; ++s) {
      const i = n[s];
      if (!Bs[i] && !(o && o[i]) && !(r && r[i])) {
        const a = $s(t, i);
        try {
          Ls(e, i, a);
        } catch {}
      }
    }
  }
  return e;
}
var Ct = Symbol.for('react-redux-context'),
  It = typeof globalThis < 'u' ? globalThis : {};
function Gs() {
  if (!b.createContext) return {};
  const e = It[Ct] ?? (It[Ct] = new Map());
  let t = e.get(b.createContext);
  return (t || ((t = b.createContext(null)), e.set(b.createContext, t)), t);
}
var lr = Gs(),
  js = [null, null];
function Ws(e, t, n) {
  nt(() => e(...t), n);
}
function Hs(e, t, n, r, o, s) {
  ((e.current = r), (n.current = !1), o.current && ((o.current = null), s()));
}
function Us(e, t, n, r, o, s, i, a, c, l, p) {
  if (!e) return () => {};
  let u = !1,
    d = null;
  const f = () => {
    if (u || !a.current) return;
    const h = t.getState();
    let g, w;
    try {
      g = r(h, o.current);
    } catch (D) {
      ((w = D), (d = D));
    }
    (w || (d = null),
      g === s.current
        ? i.current || l()
        : ((s.current = g), (c.current = g), (i.current = !0), p()));
  };
  return (
    (n.onStateChange = f),
    n.trySubscribe(),
    f(),
    () => {
      if (((u = !0), n.tryUnsubscribe(), (n.onStateChange = null), d)) throw d;
    }
  );
}
function Vs(e, t) {
  return e === t;
}
function zs(
  e,
  t,
  n,
  {
    pure: r,
    areStatesEqual: o = Vs,
    areOwnPropsEqual: s = wt,
    areStatePropsEqual: i = wt,
    areMergedPropsEqual: a = wt,
    forwardRef: c = !1,
    context: l = lr,
  } = {},
) {
  const p = l,
    u = Ds(e),
    d = xs(t),
    f = Is(n),
    m = !!e;
  return (g) => {
    const w = g.displayName || g.name || 'Component',
      D = `Connect(${w})`,
      C = {
        shouldHandleStateChanges: m,
        displayName: D,
        wrappedComponentName: w,
        WrappedComponent: g,
        initMapStateToProps: u,
        initMapDispatchToProps: d,
        initMergeProps: f,
        areStatesEqual: o,
        areStatePropsEqual: i,
        areOwnPropsEqual: s,
        areMergedPropsEqual: a,
      };
    function v(O) {
      const [_, M, B] = b.useMemo(() => {
          const { reactReduxForwardedRef: U, ...ae } = O;
          return [O.context, U, ae];
        }, [O]),
        $ = b.useMemo(() => {
          let U = p;
          return (_ != null && _.Consumer, U);
        }, [_, p]),
        V = b.useContext($),
        se = !!O.store && !!O.store.getState && !!O.store.dispatch,
        Ce = !!V && !!V.store,
        ee = se ? O.store : V.store,
        qe = Ce ? V.getServerState : ee.getState,
        Ie = b.useMemo(() => ys(ee.dispatch, C), [ee]),
        [pe, Ye] = b.useMemo(() => {
          if (!m) return js;
          const U = ar(ee, se ? void 0 : V.subscription),
            ae = U.notifyNestedSubs.bind(U);
          return [U, ae];
        }, [ee, se, V]),
        Xe = b.useMemo(() => (se ? V : { ...V, subscription: pe }), [se, V, pe]),
        Se = b.useRef(void 0),
        Ee = b.useRef(B),
        fe = b.useRef(void 0),
        Qe = b.useRef(!1),
        Ae = b.useRef(!1),
        E = b.useRef(void 0);
      nt(
        () => (
          (Ae.current = !0),
          () => {
            Ae.current = !1;
          }
        ),
        [],
      );
      const N = b.useMemo(
          () => () => (fe.current && B === Ee.current ? fe.current : Ie(ee.getState(), B)),
          [ee, B],
        ),
        T = b.useMemo(
          () => (ae) => (pe ? Us(m, ee, pe, Ie, Ee, Se, Qe, Ae, fe, Ye, ae) : () => {}),
          [pe],
        );
      Ws(Hs, [Ee, Se, Qe, B, fe, Ye]);
      let L;
      try {
        L = b.useSyncExternalStore(T, N, qe ? () => Ie(qe(), B) : N);
      } catch (U) {
        throw (
          E.current &&
            (U.message += `
The error may be correlated with this previous error:
${E.current.stack}

`),
          U
        );
      }
      nt(() => {
        ((E.current = void 0), (fe.current = void 0), (Se.current = L));
      });
      const Q = b.useMemo(() => b.createElement(g, { ...L, ref: M }), [M, g, L]);
      return b.useMemo(() => (m ? b.createElement($.Provider, { value: Xe }, Q) : Q), [$, Q, Xe]);
    }
    const S = b.memo(v);
    if (((S.WrappedComponent = g), (S.displayName = v.displayName = D), c)) {
      const _ = b.forwardRef(function (B, $) {
        return b.createElement(S, { ...B, reactReduxForwardedRef: $ });
      });
      return ((_.displayName = D), (_.WrappedComponent = g), kt(_, g));
    }
    return kt(S, g);
  };
}
var ur = zs;
function qs(e) {
  const { children: t, context: n, serverState: r, store: o } = e,
    s = b.useMemo(() => {
      const c = ar(o);
      return { store: o, subscription: c, getServerState: r ? () => r : void 0 };
    }, [o, r]),
    i = b.useMemo(() => o.getState(), [o]);
  nt(() => {
    const { subscription: c } = s;
    return (
      (c.onStateChange = c.notifyNestedSubs),
      c.trySubscribe(),
      i !== o.getState() && c.notifyNestedSubs(),
      () => {
        (c.tryUnsubscribe(), (c.onStateChange = void 0));
      }
    );
  }, [s, i]);
  const a = n || lr;
  return b.createElement(a.Provider, { value: s }, t);
}
var Ys = qs,
  Xs = 'Invariant failed';
function Qs(e, t) {
  throw new Error(Xs);
}
var ie = function (t) {
    var n = t.top,
      r = t.right,
      o = t.bottom,
      s = t.left,
      i = r - s,
      a = o - n,
      c = {
        top: n,
        right: r,
        bottom: o,
        left: s,
        width: i,
        height: a,
        x: s,
        y: n,
        center: { x: (r + s) / 2, y: (o + n) / 2 },
      };
    return c;
  },
  zt = function (t, n) {
    return {
      top: t.top - n.top,
      left: t.left - n.left,
      bottom: t.bottom + n.bottom,
      right: t.right + n.right,
    };
  },
  In = function (t, n) {
    return {
      top: t.top + n.top,
      left: t.left + n.left,
      bottom: t.bottom - n.bottom,
      right: t.right - n.right,
    };
  },
  Js = function (t, n) {
    return { top: t.top + n.y, left: t.left + n.x, bottom: t.bottom + n.y, right: t.right + n.x };
  },
  St = { top: 0, right: 0, bottom: 0, left: 0 },
  qt = function (t) {
    var n = t.borderBox,
      r = t.margin,
      o = r === void 0 ? St : r,
      s = t.border,
      i = s === void 0 ? St : s,
      a = t.padding,
      c = a === void 0 ? St : a,
      l = ie(zt(n, o)),
      p = ie(In(n, i)),
      u = ie(In(p, c));
    return {
      marginBox: l,
      borderBox: ie(n),
      paddingBox: p,
      contentBox: u,
      margin: o,
      border: i,
      padding: c,
    };
  },
  ne = function (t) {
    var n = t.slice(0, -2),
      r = t.slice(-2);
    if (r !== 'px') return 0;
    var o = Number(n);
    return (isNaN(o) && Qs(), o);
  },
  Ks = function () {
    return { x: window.pageXOffset, y: window.pageYOffset };
  },
  rt = function (t, n) {
    var r = t.borderBox,
      o = t.border,
      s = t.margin,
      i = t.padding,
      a = Js(r, n);
    return qt({ borderBox: a, border: o, margin: s, padding: i });
  },
  ot = function (t, n) {
    return (n === void 0 && (n = Ks()), rt(t, n));
  },
  dr = function (t, n) {
    var r = {
        top: ne(n.marginTop),
        right: ne(n.marginRight),
        bottom: ne(n.marginBottom),
        left: ne(n.marginLeft),
      },
      o = {
        top: ne(n.paddingTop),
        right: ne(n.paddingRight),
        bottom: ne(n.paddingBottom),
        left: ne(n.paddingLeft),
      },
      s = {
        top: ne(n.borderTopWidth),
        right: ne(n.borderRightWidth),
        bottom: ne(n.borderBottomWidth),
        left: ne(n.borderLeftWidth),
      };
    return qt({ borderBox: t, margin: r, padding: o, border: s });
  },
  pr = function (t) {
    var n = t.getBoundingClientRect(),
      r = window.getComputedStyle(t);
    return dr(n, r);
  },
  Le = function (t) {
    var n = [],
      r = null,
      o = function () {
        for (var i = arguments.length, a = new Array(i), c = 0; c < i; c++) a[c] = arguments[c];
        ((n = a),
          !r &&
            (r = requestAnimationFrame(function () {
              ((r = null), t.apply(void 0, n));
            })));
      };
    return (
      (o.cancel = function () {
        r && (cancelAnimationFrame(r), (r = null));
      }),
      o
    );
  };
function st() {
  return (
    (st = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) ({}).hasOwnProperty.call(n, r) && (e[r] = n[r]);
          }
          return e;
        }),
    st.apply(null, arguments)
  );
}
function fr(e, t) {}
fr.bind(null, 'warn');
fr.bind(null, 'error');
function le() {}
function Zs(e, t) {
  return { ...e, ...t };
}
function re(e, t, n) {
  const r = t.map((o) => {
    const s = Zs(n, o.options);
    return (
      e.addEventListener(o.eventName, o.fn, s),
      function () {
        e.removeEventListener(o.eventName, o.fn, s);
      }
    );
  });
  return function () {
    r.forEach((s) => {
      s();
    });
  };
}
const ei = 'Invariant failed';
class it extends Error {}
it.prototype.toString = function () {
  return this.message;
};
function x(e, t) {
  throw new it(ei);
}
class ti extends F.Component {
  constructor(...t) {
    (super(...t),
      (this.callbacks = null),
      (this.unbind = le),
      (this.onWindowError = (n) => {
        const r = this.getCallbacks();
        (r.isDragging() && r.tryAbort(), n.error instanceof it && n.preventDefault());
      }),
      (this.getCallbacks = () => {
        if (!this.callbacks) throw new Error('Unable to find AppCallbacks in <ErrorBoundary/>');
        return this.callbacks;
      }),
      (this.setCallbacks = (n) => {
        this.callbacks = n;
      }));
  }
  componentDidMount() {
    this.unbind = re(window, [{ eventName: 'error', fn: this.onWindowError }]);
  }
  componentDidCatch(t) {
    if (t instanceof it) {
      this.setState({});
      return;
    }
    throw t;
  }
  componentWillUnmount() {
    this.unbind();
  }
  render() {
    return this.props.children(this.setCallbacks);
  }
}
const ni = `
  Press space bar to start a drag.
  When dragging you can use the arrow keys to move the item around and escape to cancel.
  Some screen readers may require you to be in focus mode or to use your pass through key
`,
  at = (e) => e + 1,
  ri = (e) => `
  You have lifted an item in position ${at(e.source.index)}
`,
  gr = (e, t) => {
    const n = e.droppableId === t.droppableId,
      r = at(e.index),
      o = at(t.index);
    return n
      ? `
      You have moved the item from position ${r}
      to position ${o}
    `
      : `
    You have moved the item from position ${r}
    in list ${e.droppableId}
    to list ${t.droppableId}
    in position ${o}
  `;
  },
  mr = (e, t, n) =>
    t.droppableId === n.droppableId
      ? `
      The item ${e}
      has been combined with ${n.draggableId}`
      : `
      The item ${e}
      in list ${t.droppableId}
      has been combined with ${n.draggableId}
      in list ${n.droppableId}
    `,
  oi = (e) => {
    const t = e.destination;
    if (t) return gr(e.source, t);
    const n = e.combine;
    return n ? mr(e.draggableId, e.source, n) : 'You are over an area that cannot be dropped on';
  },
  Sn = (e) => `
  The item has returned to its starting position
  of ${at(e.index)}
`,
  si = (e) => {
    if (e.reason === 'CANCEL')
      return `
      Movement cancelled.
      ${Sn(e.source)}
    `;
    const t = e.destination,
      n = e.combine;
    return t
      ? `
      You have dropped the item.
      ${gr(e.source, t)}
    `
      : n
        ? `
      You have dropped the item.
      ${mr(e.draggableId, e.source, n)}
    `
        : `
    The item has been dropped while not over a drop area.
    ${Sn(e.source)}
  `;
  },
  tt = { dragHandleUsageInstructions: ni, onDragStart: ri, onDragUpdate: oi, onDragEnd: si };
function ii(e, t) {
  return !!(e === t || (Number.isNaN(e) && Number.isNaN(t)));
}
function br(e, t) {
  if (e.length !== t.length) return !1;
  for (let n = 0; n < e.length; n++) if (!ii(e[n], t[n])) return !1;
  return !0;
}
function P(e, t) {
  const n = b.useState(() => ({ inputs: t, result: e() }))[0],
    r = b.useRef(!0),
    o = b.useRef(n),
    i =
      r.current || !!(t && o.current.inputs && br(t, o.current.inputs))
        ? o.current
        : { inputs: t, result: e() };
  return (
    b.useEffect(() => {
      ((r.current = !1), (o.current = i));
    }, [i]),
    i.result
  );
}
function A(e, t) {
  return P(() => e, t);
}
const W = { x: 0, y: 0 },
  H = (e, t) => ({ x: e.x + t.x, y: e.y + t.y }),
  J = (e, t) => ({ x: e.x - t.x, y: e.y - t.y }),
  ue = (e, t) => e.x === t.x && e.y === t.y,
  xe = (e) => ({ x: e.x !== 0 ? -e.x : 0, y: e.y !== 0 ? -e.y : 0 }),
  be = (e, t, n = 0) => (e === 'x' ? { x: t, y: n } : { x: n, y: t }),
  Me = (e, t) => Math.sqrt((t.x - e.x) ** 2 + (t.y - e.y) ** 2),
  En = (e, t) => Math.min(...t.map((n) => Me(e, n))),
  hr = (e) => (t) => ({ x: e(t.x), y: e(t.y) });
var ai = (e, t) => {
  const n = ie({
    top: Math.max(t.top, e.top),
    right: Math.min(t.right, e.right),
    bottom: Math.min(t.bottom, e.bottom),
    left: Math.max(t.left, e.left),
  });
  return n.width <= 0 || n.height <= 0 ? null : n;
};
const Ve = (e, t) => ({
    top: e.top + t.y,
    left: e.left + t.x,
    bottom: e.bottom + t.y,
    right: e.right + t.x,
  }),
  An = (e) => [
    { x: e.left, y: e.top },
    { x: e.right, y: e.top },
    { x: e.left, y: e.bottom },
    { x: e.right, y: e.bottom },
  ],
  ci = { top: 0, right: 0, bottom: 0, left: 0 },
  li = (e, t) => (t ? Ve(e, t.scroll.diff.displacement) : e),
  ui = (e, t, n) => (n && n.increasedBy ? { ...e, [t.end]: e[t.end] + n.increasedBy[t.line] } : e),
  di = (e, t) => (t && t.shouldClipSubject ? ai(t.pageMarginBox, e) : ie(e));
var he = ({ page: e, withPlaceholder: t, axis: n, frame: r }) => {
    const o = li(e.marginBox, r),
      s = ui(o, n, t),
      i = di(s, r);
    return { page: e, withPlaceholder: t, active: i };
  },
  Yt = (e, t) => {
    e.frame || x();
    const n = e.frame,
      r = J(t, n.scroll.initial),
      o = xe(r),
      s = {
        ...n,
        scroll: {
          initial: n.scroll.initial,
          current: t,
          diff: { value: r, displacement: o },
          max: n.scroll.max,
        },
      },
      i = he({
        page: e.subject.page,
        withPlaceholder: e.subject.withPlaceholder,
        axis: e.axis,
        frame: s,
      });
    return { ...e, frame: s, subject: i };
  };
function j(e, t = br) {
  let n = null;
  function r(...o) {
    if (n && n.lastThis === this && t(o, n.lastArgs)) return n.lastResult;
    const s = e.apply(this, o);
    return ((n = { lastResult: s, lastArgs: o, lastThis: this }), s);
  }
  return (
    (r.clear = function () {
      n = null;
    }),
    r
  );
}
const yr = j((e) => e.reduce((t, n) => ((t[n.descriptor.id] = n), t), {})),
  vr = j((e) => e.reduce((t, n) => ((t[n.descriptor.id] = n), t), {})),
  pt = j((e) => Object.values(e)),
  pi = j((e) => Object.values(e));
var De = j((e, t) =>
  pi(t)
    .filter((r) => e === r.descriptor.droppableId)
    .sort((r, o) => r.descriptor.index - o.descriptor.index),
);
function Xt(e) {
  return e.at && e.at.type === 'REORDER' ? e.at.destination : null;
}
function ft(e) {
  return e.at && e.at.type === 'COMBINE' ? e.at.combine : null;
}
var gt = j((e, t) => t.filter((n) => n.descriptor.id !== e.descriptor.id)),
  fi = ({
    isMovingForward: e,
    draggable: t,
    destination: n,
    insideDestination: r,
    previousImpact: o,
  }) => {
    if (!n.isCombineEnabled || !Xt(o)) return null;
    function i(f) {
      const m = { type: 'COMBINE', combine: { draggableId: f, droppableId: n.descriptor.id } };
      return { ...o, at: m };
    }
    const a = o.displaced.all,
      c = a.length ? a[0] : null;
    if (e) return c ? i(c) : null;
    const l = gt(t, r);
    if (!c) {
      if (!l.length) return null;
      const f = l[l.length - 1];
      return i(f.descriptor.id);
    }
    const p = l.findIndex((f) => f.descriptor.id === c);
    p === -1 && x();
    const u = p - 1;
    if (u < 0) return null;
    const d = l[u];
    return i(d.descriptor.id);
  },
  we = (e, t) => e.descriptor.droppableId === t.descriptor.id;
const xr = { point: W, value: 0 },
  $e = { invisible: {}, visible: {}, all: [] },
  gi = { displaced: $e, displacedBy: xr, at: null };
var oe = (e, t) => (n) => e <= n && n <= t,
  Dr = (e) => {
    const t = oe(e.top, e.bottom),
      n = oe(e.left, e.right);
    return (r) => {
      if (t(r.top) && t(r.bottom) && n(r.left) && n(r.right)) return !0;
      const s = t(r.top) || t(r.bottom),
        i = n(r.left) || n(r.right);
      if (s && i) return !0;
      const c = r.top < e.top && r.bottom > e.bottom,
        l = r.left < e.left && r.right > e.right;
      return c && l ? !0 : (c && i) || (l && s);
    };
  },
  mi = (e) => {
    const t = oe(e.top, e.bottom),
      n = oe(e.left, e.right);
    return (r) => t(r.top) && t(r.bottom) && n(r.left) && n(r.right);
  };
const Qt = {
    direction: 'vertical',
    line: 'y',
    crossAxisLine: 'x',
    start: 'top',
    end: 'bottom',
    size: 'height',
    crossAxisStart: 'left',
    crossAxisEnd: 'right',
    crossAxisSize: 'width',
  },
  wr = {
    direction: 'horizontal',
    line: 'x',
    crossAxisLine: 'y',
    start: 'left',
    end: 'right',
    size: 'width',
    crossAxisStart: 'top',
    crossAxisEnd: 'bottom',
    crossAxisSize: 'height',
  };
var bi = (e) => (t) => {
  const n = oe(t.top, t.bottom),
    r = oe(t.left, t.right);
  return (o) => (e === Qt ? n(o.top) && n(o.bottom) : r(o.left) && r(o.right));
};
const hi = (e, t) => {
    const n = t.frame ? t.frame.scroll.diff.displacement : W;
    return Ve(e, n);
  },
  yi = (e, t, n) => (t.subject.active ? n(t.subject.active)(e) : !1),
  vi = (e, t, n) => n(t)(e),
  Jt = ({
    target: e,
    destination: t,
    viewport: n,
    withDroppableDisplacement: r,
    isVisibleThroughFrameFn: o,
  }) => {
    const s = r ? hi(e, t) : e;
    return yi(s, t, o) && vi(s, n, o);
  },
  xi = (e) => Jt({ ...e, isVisibleThroughFrameFn: Dr }),
  Cr = (e) => Jt({ ...e, isVisibleThroughFrameFn: mi }),
  Di = (e) => Jt({ ...e, isVisibleThroughFrameFn: bi(e.destination.axis) }),
  wi = (e, t, n) => {
    if (typeof n == 'boolean') return n;
    if (!t) return !0;
    const { invisible: r, visible: o } = t;
    if (r[e]) return !1;
    const s = o[e];
    return s ? s.shouldAnimate : !0;
  };
function Ci(e, t) {
  const n = e.page.marginBox,
    r = { top: t.point.y, right: 0, bottom: 0, left: t.point.x };
  return ie(zt(n, r));
}
function Fe({
  afterDragging: e,
  destination: t,
  displacedBy: n,
  viewport: r,
  forceShouldAnimate: o,
  last: s,
}) {
  return e.reduce(
    function (a, c) {
      const l = Ci(c, n),
        p = c.descriptor.id;
      if (
        (a.all.push(p),
        !xi({ target: l, destination: t, viewport: r, withDroppableDisplacement: !0 }))
      )
        return ((a.invisible[c.descriptor.id] = !0), a);
      const d = wi(p, s, o),
        f = { draggableId: p, shouldAnimate: d };
      return ((a.visible[p] = f), a);
    },
    { all: [], visible: {}, invisible: {} },
  );
}
function Ii(e, t) {
  if (!e.length) return 0;
  const n = e[e.length - 1].descriptor.index;
  return t.inHomeList ? n : n + 1;
}
function Rn({ insideDestination: e, inHomeList: t, displacedBy: n, destination: r }) {
  const o = Ii(e, { inHomeList: t });
  return {
    displaced: $e,
    displacedBy: n,
    at: { type: 'REORDER', destination: { droppableId: r.descriptor.id, index: o } },
  };
}
function ct({
  draggable: e,
  insideDestination: t,
  destination: n,
  viewport: r,
  displacedBy: o,
  last: s,
  index: i,
  forceShouldAnimate: a,
}) {
  const c = we(e, n);
  if (i == null) return Rn({ insideDestination: t, inHomeList: c, displacedBy: o, destination: n });
  const l = t.find((m) => m.descriptor.index === i);
  if (!l) return Rn({ insideDestination: t, inHomeList: c, displacedBy: o, destination: n });
  const p = gt(e, t),
    u = t.indexOf(l),
    d = p.slice(u);
  return {
    displaced: Fe({
      afterDragging: d,
      destination: n,
      displacedBy: o,
      last: s,
      viewport: r.frame,
      forceShouldAnimate: a,
    }),
    displacedBy: o,
    at: { type: 'REORDER', destination: { droppableId: n.descriptor.id, index: i } },
  };
}
function de(e, t) {
  return !!t.effected[e];
}
var Si = ({ isMovingForward: e, destination: t, draggables: n, combine: r, afterCritical: o }) => {
    if (!t.isCombineEnabled) return null;
    const s = r.draggableId,
      a = n[s].descriptor.index;
    return de(s, o) ? (e ? a : a - 1) : e ? a + 1 : a;
  },
  Ei = ({ isMovingForward: e, isInHomeList: t, insideDestination: n, location: r }) => {
    if (!n.length) return null;
    const o = r.index,
      s = e ? o + 1 : o - 1,
      i = n[0].descriptor.index,
      a = n[n.length - 1].descriptor.index,
      c = t ? a : a + 1;
    return s < i || s > c ? null : s;
  },
  Ai = ({
    isMovingForward: e,
    isInHomeList: t,
    draggable: n,
    draggables: r,
    destination: o,
    insideDestination: s,
    previousImpact: i,
    viewport: a,
    afterCritical: c,
  }) => {
    const l = i.at;
    if ((l || x(), l.type === 'REORDER')) {
      const u = Ei({
        isMovingForward: e,
        isInHomeList: t,
        location: l.destination,
        insideDestination: s,
      });
      return u == null
        ? null
        : ct({
            draggable: n,
            insideDestination: s,
            destination: o,
            viewport: a,
            last: i.displaced,
            displacedBy: i.displacedBy,
            index: u,
          });
    }
    const p = Si({
      isMovingForward: e,
      destination: o,
      displaced: i.displaced,
      draggables: r,
      combine: l.combine,
      afterCritical: c,
    });
    return p == null
      ? null
      : ct({
          draggable: n,
          insideDestination: s,
          destination: o,
          viewport: a,
          last: i.displaced,
          displacedBy: i.displacedBy,
          index: p,
        });
  },
  Ri = ({ displaced: e, afterCritical: t, combineWith: n, displacedBy: r }) => {
    const o = !!(e.visible[n] || e.invisible[n]);
    return de(n, t) ? (o ? W : xe(r.point)) : o ? r.point : W;
  },
  Ni = ({ afterCritical: e, impact: t, draggables: n }) => {
    const r = ft(t);
    r || x();
    const o = r.draggableId,
      s = n[o].page.borderBox.center,
      i = Ri({
        displaced: t.displaced,
        afterCritical: e,
        combineWith: o,
        displacedBy: t.displacedBy,
      });
    return H(s, i);
  };
const Ir = (e, t) => t.margin[e.start] + t.borderBox[e.size] / 2,
  Pi = (e, t) => t.margin[e.end] + t.borderBox[e.size] / 2,
  Kt = (e, t, n) =>
    t[e.crossAxisStart] + n.margin[e.crossAxisStart] + n.borderBox[e.crossAxisSize] / 2,
  Nn = ({ axis: e, moveRelativeTo: t, isMoving: n }) =>
    be(e.line, t.marginBox[e.end] + Ir(e, n), Kt(e, t.marginBox, n)),
  Pn = ({ axis: e, moveRelativeTo: t, isMoving: n }) =>
    be(e.line, t.marginBox[e.start] - Pi(e, n), Kt(e, t.marginBox, n)),
  _i = ({ axis: e, moveInto: t, isMoving: n }) =>
    be(e.line, t.contentBox[e.start] + Ir(e, n), Kt(e, t.contentBox, n));
var Oi = ({ impact: e, draggable: t, draggables: n, droppable: r, afterCritical: o }) => {
    const s = De(r.descriptor.id, n),
      i = t.page,
      a = r.axis;
    if (!s.length) return _i({ axis: a, moveInto: r.page, isMoving: i });
    const { displaced: c, displacedBy: l } = e,
      p = c.all[0];
    if (p) {
      const d = n[p];
      if (de(p, o)) return Pn({ axis: a, moveRelativeTo: d.page, isMoving: i });
      const f = rt(d.page, l.point);
      return Pn({ axis: a, moveRelativeTo: f, isMoving: i });
    }
    const u = s[s.length - 1];
    if (u.descriptor.id === t.descriptor.id) return i.borderBox.center;
    if (de(u.descriptor.id, o)) {
      const d = rt(u.page, xe(o.displacedBy.point));
      return Nn({ axis: a, moveRelativeTo: d, isMoving: i });
    }
    return Nn({ axis: a, moveRelativeTo: u.page, isMoving: i });
  },
  Lt = (e, t) => {
    const n = e.frame;
    return n ? H(t, n.scroll.diff.displacement) : t;
  };
const Bi = ({ impact: e, draggable: t, droppable: n, draggables: r, afterCritical: o }) => {
  const s = t.page.borderBox.center,
    i = e.at;
  return !n || !i
    ? s
    : i.type === 'REORDER'
      ? Oi({ impact: e, draggable: t, draggables: r, droppable: n, afterCritical: o })
      : Ni({ impact: e, draggables: r, afterCritical: o });
};
var mt = (e) => {
    const t = Bi(e),
      n = e.droppable;
    return n ? Lt(n, t) : t;
  },
  Sr = (e, t) => {
    const n = J(t, e.scroll.initial),
      r = xe(n);
    return {
      frame: ie({ top: t.y, bottom: t.y + e.frame.height, left: t.x, right: t.x + e.frame.width }),
      scroll: {
        initial: e.scroll.initial,
        max: e.scroll.max,
        current: t,
        diff: { value: n, displacement: r },
      },
    };
  };
function _n(e, t) {
  return e.map((n) => t[n]);
}
function Ti(e, t) {
  for (let n = 0; n < t.length; n++) {
    const r = t[n].visible[e];
    if (r) return r;
  }
  return null;
}
var ki = ({ impact: e, viewport: t, destination: n, draggables: r, maxScrollChange: o }) => {
    const s = Sr(t, H(t.scroll.current, o)),
      i = n.frame ? Yt(n, H(n.frame.scroll.current, o)) : n,
      a = e.displaced,
      c = Fe({
        afterDragging: _n(a.all, r),
        destination: n,
        displacedBy: e.displacedBy,
        viewport: s.frame,
        last: a,
        forceShouldAnimate: !1,
      }),
      l = Fe({
        afterDragging: _n(a.all, r),
        destination: i,
        displacedBy: e.displacedBy,
        viewport: t.frame,
        last: a,
        forceShouldAnimate: !1,
      }),
      p = {},
      u = {},
      d = [a, c, l];
    return (
      a.all.forEach((m) => {
        const h = Ti(m, d);
        if (h) {
          u[m] = h;
          return;
        }
        p[m] = !0;
      }),
      { ...e, displaced: { all: a.all, invisible: p, visible: u } }
    );
  },
  Li = (e, t) => H(e.scroll.diff.displacement, t),
  Zt = ({ pageBorderBoxCenter: e, draggable: t, viewport: n }) => {
    const r = Li(n, e),
      o = J(r, t.page.borderBox.center);
    return H(t.client.borderBox.center, o);
  },
  Er = ({
    draggable: e,
    destination: t,
    newPageBorderBoxCenter: n,
    viewport: r,
    withDroppableDisplacement: o,
    onlyOnMainAxis: s = !1,
  }) => {
    const i = J(n, e.page.borderBox.center),
      c = {
        target: Ve(e.page.borderBox, i),
        destination: t,
        withDroppableDisplacement: o,
        viewport: r,
      };
    return s ? Di(c) : Cr(c);
  },
  Mi = ({
    isMovingForward: e,
    draggable: t,
    destination: n,
    draggables: r,
    previousImpact: o,
    viewport: s,
    previousPageBorderBoxCenter: i,
    previousClientSelection: a,
    afterCritical: c,
  }) => {
    if (!n.isEnabled) return null;
    const l = De(n.descriptor.id, r),
      p = we(t, n),
      u =
        fi({
          isMovingForward: e,
          draggable: t,
          destination: n,
          insideDestination: l,
          previousImpact: o,
        }) ||
        Ai({
          isMovingForward: e,
          isInHomeList: p,
          draggable: t,
          draggables: r,
          destination: n,
          insideDestination: l,
          previousImpact: o,
          viewport: s,
          afterCritical: c,
        });
    if (!u) return null;
    const d = mt({ impact: u, draggable: t, droppable: n, draggables: r, afterCritical: c });
    if (
      Er({
        draggable: t,
        destination: n,
        newPageBorderBoxCenter: d,
        viewport: s.frame,
        withDroppableDisplacement: !1,
        onlyOnMainAxis: !0,
      })
    )
      return {
        clientSelection: Zt({ pageBorderBoxCenter: d, draggable: t, viewport: s }),
        impact: u,
        scrollJumpRequest: null,
      };
    const m = J(d, i),
      h = ki({ impact: u, viewport: s, destination: n, draggables: r, maxScrollChange: m });
    return { clientSelection: a, impact: h, scrollJumpRequest: m };
  };
const z = (e) => {
  const t = e.subject.active;
  return (t || x(), t);
};
var $i = ({
  isMovingForward: e,
  pageBorderBoxCenter: t,
  source: n,
  droppables: r,
  viewport: o,
}) => {
  const s = n.subject.active;
  if (!s) return null;
  const i = n.axis,
    a = oe(s[i.start], s[i.end]),
    c = pt(r)
      .filter((p) => p !== n)
      .filter((p) => p.isEnabled)
      .filter((p) => !!p.subject.active)
      .filter((p) => Dr(o.frame)(z(p)))
      .filter((p) => {
        const u = z(p);
        return e
          ? s[i.crossAxisEnd] < u[i.crossAxisEnd]
          : u[i.crossAxisStart] < s[i.crossAxisStart];
      })
      .filter((p) => {
        const u = z(p),
          d = oe(u[i.start], u[i.end]);
        return a(u[i.start]) || a(u[i.end]) || d(s[i.start]) || d(s[i.end]);
      })
      .sort((p, u) => {
        const d = z(p)[i.crossAxisStart],
          f = z(u)[i.crossAxisStart];
        return e ? d - f : f - d;
      })
      .filter((p, u, d) => z(p)[i.crossAxisStart] === z(d[0])[i.crossAxisStart]);
  if (!c.length) return null;
  if (c.length === 1) return c[0];
  const l = c.filter((p) => oe(z(p)[i.start], z(p)[i.end])(t[i.line]));
  return l.length === 1
    ? l[0]
    : l.length > 1
      ? l.sort((p, u) => z(p)[i.start] - z(u)[i.start])[0]
      : c.sort((p, u) => {
          const d = En(t, An(z(p))),
            f = En(t, An(z(u)));
          return d !== f ? d - f : z(p)[i.start] - z(u)[i.start];
        })[0];
};
const On = (e, t) => {
    const n = e.page.borderBox.center;
    return de(e.descriptor.id, t) ? J(n, t.displacedBy.point) : n;
  },
  Fi = (e, t) => {
    const n = e.page.borderBox;
    return de(e.descriptor.id, t) ? Ve(n, xe(t.displacedBy.point)) : n;
  };
var Gi = ({
    pageBorderBoxCenter: e,
    viewport: t,
    destination: n,
    insideDestination: r,
    afterCritical: o,
  }) =>
    r
      .filter((i) =>
        Cr({ target: Fi(i, o), destination: n, viewport: t.frame, withDroppableDisplacement: !0 }),
      )
      .sort((i, a) => {
        const c = Me(e, Lt(n, On(i, o))),
          l = Me(e, Lt(n, On(a, o)));
        return c < l ? -1 : l < c ? 1 : i.descriptor.index - a.descriptor.index;
      })[0] || null,
  ze = j(function (t, n) {
    const r = n[t.line];
    return { value: r, point: be(t.line, r) };
  });
const ji = (e, t, n) => {
    const r = e.axis;
    if (e.descriptor.mode === 'virtual') return be(r.line, t[r.line]);
    const o = e.subject.page.contentBox[r.size],
      c =
        De(e.descriptor.id, n).reduce((l, p) => l + p.client.marginBox[r.size], 0) + t[r.line] - o;
    return c <= 0 ? null : be(r.line, c);
  },
  Ar = (e, t) => ({ ...e, scroll: { ...e.scroll, max: t } }),
  Rr = (e, t, n) => {
    const r = e.frame;
    (we(t, e) && x(), e.subject.withPlaceholder && x());
    const o = ze(e.axis, t.displaceBy).point,
      s = ji(e, o, n),
      i = {
        placeholderSize: o,
        increasedBy: s,
        oldFrameMaxScroll: e.frame ? e.frame.scroll.max : null,
      };
    if (!r) {
      const p = he({ page: e.subject.page, withPlaceholder: i, axis: e.axis, frame: e.frame });
      return { ...e, subject: p };
    }
    const a = s ? H(r.scroll.max, s) : r.scroll.max,
      c = Ar(r, a),
      l = he({ page: e.subject.page, withPlaceholder: i, axis: e.axis, frame: c });
    return { ...e, subject: l, frame: c };
  },
  Wi = (e) => {
    const t = e.subject.withPlaceholder;
    t || x();
    const n = e.frame;
    if (!n) {
      const i = he({ page: e.subject.page, axis: e.axis, frame: null, withPlaceholder: null });
      return { ...e, subject: i };
    }
    const r = t.oldFrameMaxScroll;
    r || x();
    const o = Ar(n, r),
      s = he({ page: e.subject.page, axis: e.axis, frame: o, withPlaceholder: null });
    return { ...e, subject: s, frame: o };
  };
var Hi = ({
    previousPageBorderBoxCenter: e,
    moveRelativeTo: t,
    insideDestination: n,
    draggable: r,
    draggables: o,
    destination: s,
    viewport: i,
    afterCritical: a,
  }) => {
    if (!t) {
      if (n.length) return null;
      const u = {
          displaced: $e,
          displacedBy: xr,
          at: { type: 'REORDER', destination: { droppableId: s.descriptor.id, index: 0 } },
        },
        d = mt({ impact: u, draggable: r, droppable: s, draggables: o, afterCritical: a }),
        f = we(r, s) ? s : Rr(s, r, o);
      return Er({
        draggable: r,
        destination: f,
        newPageBorderBoxCenter: d,
        viewport: i.frame,
        withDroppableDisplacement: !1,
        onlyOnMainAxis: !0,
      })
        ? u
        : null;
    }
    const c = e[s.axis.line] <= t.page.borderBox.center[s.axis.line],
      l = (() => {
        const u = t.descriptor.index;
        return t.descriptor.id === r.descriptor.id || c ? u : u + 1;
      })(),
      p = ze(s.axis, r.displaceBy);
    return ct({
      draggable: r,
      insideDestination: n,
      destination: s,
      viewport: i,
      displacedBy: p,
      last: $e,
      index: l,
    });
  },
  Ui = ({
    isMovingForward: e,
    previousPageBorderBoxCenter: t,
    draggable: n,
    isOver: r,
    draggables: o,
    droppables: s,
    viewport: i,
    afterCritical: a,
  }) => {
    const c = $i({
      isMovingForward: e,
      pageBorderBoxCenter: t,
      source: r,
      droppables: s,
      viewport: i,
    });
    if (!c) return null;
    const l = De(c.descriptor.id, o),
      p = Gi({
        pageBorderBoxCenter: t,
        viewport: i,
        destination: c,
        insideDestination: l,
        afterCritical: a,
      }),
      u = Hi({
        previousPageBorderBoxCenter: t,
        destination: c,
        draggable: n,
        draggables: o,
        moveRelativeTo: p,
        insideDestination: l,
        viewport: i,
        afterCritical: a,
      });
    if (!u) return null;
    const d = mt({ impact: u, draggable: n, droppable: c, draggables: o, afterCritical: a });
    return {
      clientSelection: Zt({ pageBorderBoxCenter: d, draggable: n, viewport: i }),
      impact: u,
      scrollJumpRequest: null,
    };
  },
  K = (e) => {
    const t = e.at;
    return t ? (t.type === 'REORDER' ? t.destination.droppableId : t.combine.droppableId) : null;
  };
const Vi = (e, t) => {
  const n = K(e);
  return n ? t[n] : null;
};
var zi = ({ state: e, type: t }) => {
  const n = Vi(e.impact, e.dimensions.droppables),
    r = !!n,
    o = e.dimensions.droppables[e.critical.droppable.id],
    s = n || o,
    i = s.axis.direction,
    a =
      (i === 'vertical' && (t === 'MOVE_UP' || t === 'MOVE_DOWN')) ||
      (i === 'horizontal' && (t === 'MOVE_LEFT' || t === 'MOVE_RIGHT'));
  if (a && !r) return null;
  const c = t === 'MOVE_DOWN' || t === 'MOVE_RIGHT',
    l = e.dimensions.draggables[e.critical.draggable.id],
    p = e.current.page.borderBoxCenter,
    { draggables: u, droppables: d } = e.dimensions;
  return a
    ? Mi({
        isMovingForward: c,
        previousPageBorderBoxCenter: p,
        draggable: l,
        destination: s,
        draggables: u,
        viewport: e.viewport,
        previousClientSelection: e.current.client.selection,
        previousImpact: e.impact,
        afterCritical: e.afterCritical,
      })
    : Ui({
        isMovingForward: c,
        previousPageBorderBoxCenter: p,
        draggable: l,
        isOver: s,
        draggables: u,
        droppables: d,
        viewport: e.viewport,
        afterCritical: e.afterCritical,
      });
};
function me(e) {
  return e.phase === 'DRAGGING' || e.phase === 'COLLECTING';
}
function Nr(e) {
  const t = oe(e.top, e.bottom),
    n = oe(e.left, e.right);
  return function (o) {
    return t(o.y) && n(o.x);
  };
}
function qi(e, t) {
  return e.left < t.right && e.right > t.left && e.top < t.bottom && e.bottom > t.top;
}
function Yi({ pageBorderBox: e, draggable: t, candidates: n }) {
  const r = t.page.borderBox.center,
    o = n
      .map((s) => {
        const i = s.axis,
          a = be(s.axis.line, e.center[i.line], s.page.borderBox.center[i.crossAxisLine]);
        return { id: s.descriptor.id, distance: Me(r, a) };
      })
      .sort((s, i) => i.distance - s.distance);
  return o[0] ? o[0].id : null;
}
function Xi({ pageBorderBox: e, draggable: t, droppables: n }) {
  const r = pt(n).filter((o) => {
    if (!o.isEnabled) return !1;
    const s = o.subject.active;
    if (!s || !qi(e, s)) return !1;
    if (Nr(s)(e.center)) return !0;
    const i = o.axis,
      a = s.center[i.crossAxisLine],
      c = e[i.crossAxisStart],
      l = e[i.crossAxisEnd],
      p = oe(s[i.crossAxisStart], s[i.crossAxisEnd]),
      u = p(c),
      d = p(l);
    return !u && !d ? !0 : u ? c < a : l > a;
  });
  return r.length
    ? r.length === 1
      ? r[0].descriptor.id
      : Yi({ pageBorderBox: e, draggable: t, candidates: r })
    : null;
}
const Pr = (e, t) => ie(Ve(e, t));
var Qi = (e, t) => {
  const n = e.frame;
  return n ? Pr(t, n.scroll.diff.value) : t;
};
function _r({ displaced: e, id: t }) {
  return !!(e.visible[t] || e.invisible[t]);
}
function Ji({ draggable: e, closest: t, inHomeList: n }) {
  return t
    ? n && t.descriptor.index > e.descriptor.index
      ? t.descriptor.index - 1
      : t.descriptor.index
    : null;
}
var Ki = ({
  pageBorderBoxWithDroppableScroll: e,
  draggable: t,
  destination: n,
  insideDestination: r,
  last: o,
  viewport: s,
  afterCritical: i,
}) => {
  const a = n.axis,
    c = ze(n.axis, t.displaceBy),
    l = c.value,
    p = e[a.start],
    u = e[a.end],
    f =
      gt(t, r).find((h) => {
        const g = h.descriptor.id,
          w = h.page.borderBox.center[a.line],
          D = de(g, i),
          C = _r({ displaced: o, id: g });
        return D ? (C ? u <= w : p < w - l) : C ? u <= w + l : p < w;
      }) || null,
    m = Ji({ draggable: t, closest: f, inHomeList: we(t, n) });
  return ct({
    draggable: t,
    insideDestination: r,
    destination: n,
    viewport: s,
    last: o,
    displacedBy: c,
    index: m,
  });
};
const Zi = 4;
var ea = ({
    draggable: e,
    pageBorderBoxWithDroppableScroll: t,
    previousImpact: n,
    destination: r,
    insideDestination: o,
    afterCritical: s,
  }) => {
    if (!r.isCombineEnabled) return null;
    const i = r.axis,
      a = ze(r.axis, e.displaceBy),
      c = a.value,
      l = t[i.start],
      p = t[i.end],
      d = gt(e, o).find((m) => {
        const h = m.descriptor.id,
          g = m.page.borderBox,
          D = g[i.size] / Zi,
          C = de(h, s),
          v = _r({ displaced: n.displaced, id: h });
        return C
          ? v
            ? p > g[i.start] + D && p < g[i.end] - D
            : l > g[i.start] - c + D && l < g[i.end] - c - D
          : v
            ? p > g[i.start] + c + D && p < g[i.end] + c - D
            : l > g[i.start] + D && l < g[i.end] - D;
      });
    return d
      ? {
          displacedBy: a,
          displaced: n.displaced,
          at: {
            type: 'COMBINE',
            combine: { draggableId: d.descriptor.id, droppableId: r.descriptor.id },
          },
        }
      : null;
  },
  Or = ({
    pageOffset: e,
    draggable: t,
    draggables: n,
    droppables: r,
    previousImpact: o,
    viewport: s,
    afterCritical: i,
  }) => {
    const a = Pr(t.page.borderBox, e),
      c = Xi({ pageBorderBox: a, draggable: t, droppables: r });
    if (!c) return gi;
    const l = r[c],
      p = De(l.descriptor.id, n),
      u = Qi(l, a);
    return (
      ea({
        pageBorderBoxWithDroppableScroll: u,
        draggable: t,
        previousImpact: o,
        destination: l,
        insideDestination: p,
        afterCritical: i,
      }) ||
      Ki({
        pageBorderBoxWithDroppableScroll: u,
        draggable: t,
        destination: l,
        insideDestination: p,
        last: o.displaced,
        viewport: s,
        afterCritical: i,
      })
    );
  },
  en = (e, t) => ({ ...e, [t.descriptor.id]: t });
const ta = ({ previousImpact: e, impact: t, droppables: n }) => {
  const r = K(e),
    o = K(t);
  if (!r || r === o) return n;
  const s = n[r];
  if (!s.subject.withPlaceholder) return n;
  const i = Wi(s);
  return en(n, i);
};
var na = ({ draggable: e, draggables: t, droppables: n, previousImpact: r, impact: o }) => {
    const s = ta({ previousImpact: r, impact: o, droppables: n }),
      i = K(o);
    if (!i) return s;
    const a = n[i];
    if (we(e, a) || a.subject.withPlaceholder) return s;
    const c = Rr(a, e, t);
    return en(s, c);
  },
  Te = ({
    state: e,
    clientSelection: t,
    dimensions: n,
    viewport: r,
    impact: o,
    scrollJumpRequest: s,
  }) => {
    const i = r || e.viewport,
      a = n || e.dimensions,
      c = t || e.current.client.selection,
      l = J(c, e.initial.client.selection),
      p = { offset: l, selection: c, borderBoxCenter: H(e.initial.client.borderBoxCenter, l) },
      u = {
        selection: H(p.selection, i.scroll.current),
        borderBoxCenter: H(p.borderBoxCenter, i.scroll.current),
        offset: H(p.offset, i.scroll.diff.value),
      },
      d = { client: p, page: u };
    if (e.phase === 'COLLECTING') return { ...e, dimensions: a, viewport: i, current: d };
    const f = a.draggables[e.critical.draggable.id],
      m =
        o ||
        Or({
          pageOffset: u.offset,
          draggable: f,
          draggables: a.draggables,
          droppables: a.droppables,
          previousImpact: e.impact,
          viewport: i,
          afterCritical: e.afterCritical,
        }),
      h = na({
        draggable: f,
        impact: m,
        previousImpact: e.impact,
        draggables: a.draggables,
        droppables: a.droppables,
      });
    return {
      ...e,
      current: d,
      dimensions: { draggables: a.draggables, droppables: h },
      impact: m,
      viewport: i,
      scrollJumpRequest: s || null,
      forceShouldAnimate: s ? !1 : null,
    };
  };
function ra(e, t) {
  return e.map((n) => t[n]);
}
var Br = ({ impact: e, viewport: t, draggables: n, destination: r, forceShouldAnimate: o }) => {
    const s = e.displaced,
      i = ra(s.all, n),
      a = Fe({
        afterDragging: i,
        destination: r,
        displacedBy: e.displacedBy,
        viewport: t.frame,
        forceShouldAnimate: o,
        last: s,
      });
    return { ...e, displaced: a };
  },
  Tr = ({
    impact: e,
    draggable: t,
    droppable: n,
    draggables: r,
    viewport: o,
    afterCritical: s,
  }) => {
    const i = mt({ impact: e, draggable: t, draggables: r, droppable: n, afterCritical: s });
    return Zt({ pageBorderBoxCenter: i, draggable: t, viewport: o });
  },
  kr = ({ state: e, dimensions: t, viewport: n }) => {
    e.movementMode !== 'SNAP' && x();
    const r = e.impact,
      o = n || e.viewport,
      s = t || e.dimensions,
      { draggables: i, droppables: a } = s,
      c = i[e.critical.draggable.id],
      l = K(r);
    l || x();
    const p = a[l],
      u = Br({ impact: r, viewport: o, destination: p, draggables: i }),
      d = Tr({
        impact: u,
        draggable: c,
        droppable: p,
        draggables: i,
        viewport: o,
        afterCritical: e.afterCritical,
      });
    return Te({ impact: u, clientSelection: d, state: e, dimensions: s, viewport: o });
  },
  oa = (e) => ({ index: e.index, droppableId: e.droppableId }),
  Lr = ({ draggable: e, home: t, draggables: n, viewport: r }) => {
    const o = ze(t.axis, e.displaceBy),
      s = De(t.descriptor.id, n),
      i = s.indexOf(e);
    i === -1 && x();
    const a = s.slice(i + 1),
      c = a.reduce((d, f) => ((d[f.descriptor.id] = !0), d), {}),
      l = { inVirtualList: t.descriptor.mode === 'virtual', displacedBy: o, effected: c };
    return {
      impact: {
        displaced: Fe({
          afterDragging: a,
          destination: t,
          displacedBy: o,
          last: null,
          viewport: r.frame,
          forceShouldAnimate: !1,
        }),
        displacedBy: o,
        at: { type: 'REORDER', destination: oa(e.descriptor) },
      },
      afterCritical: l,
    };
  },
  sa = (e, t) => ({ draggables: e.draggables, droppables: en(e.droppables, t) }),
  ia = ({ draggable: e, offset: t, initialWindowScroll: n }) => {
    const r = rt(e.client, t),
      o = ot(r, n);
    return { ...e, placeholder: { ...e.placeholder, client: r }, client: r, page: o };
  },
  aa = (e) => {
    const t = e.frame;
    return (t || x(), t);
  },
  ca = ({ additions: e, updatedDroppables: t, viewport: n }) => {
    const r = n.scroll.diff.value;
    return e.map((o) => {
      const s = o.descriptor.droppableId,
        i = t[s],
        c = aa(i).scroll.diff.value,
        l = H(r, c);
      return ia({ draggable: o, offset: l, initialWindowScroll: n.scroll.initial });
    });
  },
  la = ({ state: e, published: t }) => {
    const n = t.modified.map((w) => {
        const D = e.dimensions.droppables[w.droppableId];
        return Yt(D, w.scroll);
      }),
      r = { ...e.dimensions.droppables, ...yr(n) },
      o = vr(ca({ additions: t.additions, updatedDroppables: r, viewport: e.viewport })),
      s = { ...e.dimensions.draggables, ...o };
    t.removals.forEach((w) => {
      delete s[w];
    });
    const i = { droppables: r, draggables: s },
      a = K(e.impact),
      c = a ? i.droppables[a] : null,
      l = i.draggables[e.critical.draggable.id],
      p = i.droppables[e.critical.droppable.id],
      { impact: u, afterCritical: d } = Lr({
        draggable: l,
        home: p,
        draggables: s,
        viewport: e.viewport,
      }),
      f = c && c.isCombineEnabled ? e.impact : u,
      m = Or({
        pageOffset: e.current.page.offset,
        draggable: i.draggables[e.critical.draggable.id],
        draggables: i.draggables,
        droppables: i.droppables,
        previousImpact: f,
        viewport: e.viewport,
        afterCritical: d,
      }),
      h = {
        ...e,
        phase: 'DRAGGING',
        impact: m,
        onLiftImpact: u,
        dimensions: i,
        afterCritical: d,
        forceShouldAnimate: !1,
      };
    return e.phase === 'COLLECTING'
      ? h
      : { ...h, phase: 'DROP_PENDING', reason: e.reason, isWaiting: !1 };
  };
const Mt = (e) => e.movementMode === 'SNAP',
  Et = (e, t, n) => {
    const r = sa(e.dimensions, t);
    return !Mt(e) || n ? Te({ state: e, dimensions: r }) : kr({ state: e, dimensions: r });
  };
function At(e) {
  return e.isDragging && e.movementMode === 'SNAP' ? { ...e, scrollJumpRequest: null } : e;
}
const Bn = { phase: 'IDLE', completed: null, shouldFlush: !1 };
var ua = (e = Bn, t) => {
  if (t.type === 'FLUSH') return { ...Bn, shouldFlush: !0 };
  if (t.type === 'INITIAL_PUBLISH') {
    e.phase !== 'IDLE' && x();
    const {
        critical: n,
        clientSelection: r,
        viewport: o,
        dimensions: s,
        movementMode: i,
      } = t.payload,
      a = s.draggables[n.draggable.id],
      c = s.droppables[n.droppable.id],
      l = { selection: r, borderBoxCenter: a.client.borderBox.center, offset: W },
      p = {
        client: l,
        page: {
          selection: H(l.selection, o.scroll.initial),
          borderBoxCenter: H(l.selection, o.scroll.initial),
          offset: H(l.selection, o.scroll.diff.value),
        },
      },
      u = pt(s.droppables).every((h) => !h.isFixedOnPage),
      { impact: d, afterCritical: f } = Lr({
        draggable: a,
        home: c,
        draggables: s.draggables,
        viewport: o,
      });
    return {
      phase: 'DRAGGING',
      isDragging: !0,
      critical: n,
      movementMode: i,
      dimensions: s,
      initial: p,
      current: p,
      isWindowScrollAllowed: u,
      impact: d,
      afterCritical: f,
      onLiftImpact: d,
      viewport: o,
      scrollJumpRequest: null,
      forceShouldAnimate: null,
    };
  }
  if (t.type === 'COLLECTION_STARTING')
    return e.phase === 'COLLECTING' || e.phase === 'DROP_PENDING'
      ? e
      : (e.phase !== 'DRAGGING' && x(), { ...e, phase: 'COLLECTING' });
  if (t.type === 'PUBLISH_WHILE_DRAGGING')
    return (
      e.phase === 'COLLECTING' || e.phase === 'DROP_PENDING' || x(),
      la({ state: e, published: t.payload })
    );
  if (t.type === 'MOVE') {
    if (e.phase === 'DROP_PENDING') return e;
    me(e) || x();
    const { client: n } = t.payload;
    return ue(n, e.current.client.selection)
      ? e
      : Te({ state: e, clientSelection: n, impact: Mt(e) ? e.impact : null });
  }
  if (t.type === 'UPDATE_DROPPABLE_SCROLL') {
    if (e.phase === 'DROP_PENDING' || e.phase === 'COLLECTING') return At(e);
    me(e) || x();
    const { id: n, newScroll: r } = t.payload,
      o = e.dimensions.droppables[n];
    if (!o) return e;
    const s = Yt(o, r);
    return Et(e, s, !1);
  }
  if (t.type === 'UPDATE_DROPPABLE_IS_ENABLED') {
    if (e.phase === 'DROP_PENDING') return e;
    me(e) || x();
    const { id: n, isEnabled: r } = t.payload,
      o = e.dimensions.droppables[n];
    (o || x(), o.isEnabled === r && x());
    const s = { ...o, isEnabled: r };
    return Et(e, s, !0);
  }
  if (t.type === 'UPDATE_DROPPABLE_IS_COMBINE_ENABLED') {
    if (e.phase === 'DROP_PENDING') return e;
    me(e) || x();
    const { id: n, isCombineEnabled: r } = t.payload,
      o = e.dimensions.droppables[n];
    (o || x(), o.isCombineEnabled === r && x());
    const s = { ...o, isCombineEnabled: r };
    return Et(e, s, !0);
  }
  if (t.type === 'MOVE_BY_WINDOW_SCROLL') {
    if (e.phase === 'DROP_PENDING' || e.phase === 'DROP_ANIMATING') return e;
    (me(e) || x(), e.isWindowScrollAllowed || x());
    const n = t.payload.newScroll;
    if (ue(e.viewport.scroll.current, n)) return At(e);
    const r = Sr(e.viewport, n);
    return Mt(e) ? kr({ state: e, viewport: r }) : Te({ state: e, viewport: r });
  }
  if (t.type === 'UPDATE_VIEWPORT_MAX_SCROLL') {
    if (!me(e)) return e;
    const n = t.payload.maxScroll;
    if (ue(n, e.viewport.scroll.max)) return e;
    const r = { ...e.viewport, scroll: { ...e.viewport.scroll, max: n } };
    return { ...e, viewport: r };
  }
  if (
    t.type === 'MOVE_UP' ||
    t.type === 'MOVE_DOWN' ||
    t.type === 'MOVE_LEFT' ||
    t.type === 'MOVE_RIGHT'
  ) {
    if (e.phase === 'COLLECTING' || e.phase === 'DROP_PENDING') return e;
    e.phase !== 'DRAGGING' && x();
    const n = zi({ state: e, type: t.type });
    return n
      ? Te({
          state: e,
          impact: n.impact,
          clientSelection: n.clientSelection,
          scrollJumpRequest: n.scrollJumpRequest,
        })
      : e;
  }
  if (t.type === 'DROP_PENDING') {
    const n = t.payload.reason;
    return (
      e.phase !== 'COLLECTING' && x(),
      { ...e, phase: 'DROP_PENDING', isWaiting: !0, reason: n }
    );
  }
  if (t.type === 'DROP_ANIMATE') {
    const { completed: n, dropDuration: r, newHomeClientOffset: o } = t.payload;
    return (
      e.phase === 'DRAGGING' || e.phase === 'DROP_PENDING' || x(),
      {
        phase: 'DROP_ANIMATING',
        completed: n,
        dropDuration: r,
        newHomeClientOffset: o,
        dimensions: e.dimensions,
      }
    );
  }
  if (t.type === 'DROP_COMPLETE') {
    const { completed: n } = t.payload;
    return { phase: 'IDLE', completed: n, shouldFlush: !1 };
  }
  return e;
};
function k(e, t) {
  return e instanceof Object && 'type' in e && e.type === t;
}
const da = (e) => ({ type: 'BEFORE_INITIAL_CAPTURE', payload: e }),
  pa = (e) => ({ type: 'LIFT', payload: e }),
  fa = (e) => ({ type: 'INITIAL_PUBLISH', payload: e }),
  ga = (e) => ({ type: 'PUBLISH_WHILE_DRAGGING', payload: e }),
  ma = () => ({ type: 'COLLECTION_STARTING', payload: null }),
  ba = (e) => ({ type: 'UPDATE_DROPPABLE_SCROLL', payload: e }),
  ha = (e) => ({ type: 'UPDATE_DROPPABLE_IS_ENABLED', payload: e }),
  ya = (e) => ({ type: 'UPDATE_DROPPABLE_IS_COMBINE_ENABLED', payload: e }),
  Mr = (e) => ({ type: 'MOVE', payload: e }),
  va = (e) => ({ type: 'MOVE_BY_WINDOW_SCROLL', payload: e }),
  xa = (e) => ({ type: 'UPDATE_VIEWPORT_MAX_SCROLL', payload: e }),
  Da = () => ({ type: 'MOVE_UP', payload: null }),
  wa = () => ({ type: 'MOVE_DOWN', payload: null }),
  Ca = () => ({ type: 'MOVE_RIGHT', payload: null }),
  Ia = () => ({ type: 'MOVE_LEFT', payload: null }),
  tn = () => ({ type: 'FLUSH', payload: null }),
  Sa = (e) => ({ type: 'DROP_ANIMATE', payload: e }),
  nn = (e) => ({ type: 'DROP_COMPLETE', payload: e }),
  $r = (e) => ({ type: 'DROP', payload: e }),
  Ea = (e) => ({ type: 'DROP_PENDING', payload: e }),
  Fr = () => ({ type: 'DROP_ANIMATION_FINISHED', payload: null });
var Aa =
    (e) =>
    ({ getState: t, dispatch: n }) =>
    (r) =>
    (o) => {
      if (!k(o, 'LIFT')) {
        r(o);
        return;
      }
      const { id: s, clientSelection: i, movementMode: a } = o.payload,
        c = t();
      (c.phase === 'DROP_ANIMATING' && n(nn({ completed: c.completed })),
        t().phase !== 'IDLE' && x(),
        n(tn()),
        n(da({ draggableId: s, movementMode: a })));
      const p = { draggableId: s, scrollOptions: { shouldPublishImmediately: a === 'SNAP' } },
        { critical: u, dimensions: d, viewport: f } = e.startPublishing(p);
      n(fa({ critical: u, dimensions: d, clientSelection: i, movementMode: a, viewport: f }));
    },
  Ra = (e) => () => (t) => (n) => {
    (k(n, 'INITIAL_PUBLISH') && e.dragging(),
      k(n, 'DROP_ANIMATE') && e.dropping(n.payload.completed.result.reason),
      (k(n, 'FLUSH') || k(n, 'DROP_COMPLETE')) && e.resting(),
      t(n));
  };
const rn = { outOfTheWay: 'cubic-bezier(0.2, 0, 0, 1)', drop: 'cubic-bezier(.2,1,.1,1)' },
  Ge = { opacity: { drop: 0, combining: 0.7 }, scale: { drop: 0.75 } },
  Gr = { outOfTheWay: 0.2, minDropTime: 0.33, maxDropTime: 0.55 },
  ge = `${Gr.outOfTheWay}s ${rn.outOfTheWay}`,
  ke = {
    fluid: `opacity ${ge}`,
    snap: `transform ${ge}, opacity ${ge}`,
    drop: (e) => {
      const t = `${e}s ${rn.drop}`;
      return `transform ${t}, opacity ${t}`;
    },
    outOfTheWay: `transform ${ge}`,
    placeholder: `height ${ge}, width ${ge}, margin ${ge}`,
  },
  Tn = (e) => (ue(e, W) ? void 0 : `translate(${e.x}px, ${e.y}px)`),
  $t = {
    moveTo: Tn,
    drop: (e, t) => {
      const n = Tn(e);
      if (n) return t ? `${n} scale(${Ge.scale.drop})` : n;
    },
  },
  { minDropTime: Ft, maxDropTime: jr } = Gr,
  Na = jr - Ft,
  kn = 1500,
  Pa = 0.6;
var _a = ({ current: e, destination: t, reason: n }) => {
    const r = Me(e, t);
    if (r <= 0) return Ft;
    if (r >= kn) return jr;
    const o = r / kn,
      s = Ft + Na * o,
      i = n === 'CANCEL' ? s * Pa : s;
    return Number(i.toFixed(2));
  },
  Oa = ({ impact: e, draggable: t, dimensions: n, viewport: r, afterCritical: o }) => {
    const { draggables: s, droppables: i } = n,
      a = K(e),
      c = a ? i[a] : null,
      l = i[t.descriptor.droppableId],
      p = Tr({
        impact: e,
        draggable: t,
        draggables: s,
        afterCritical: o,
        droppable: c || l,
        viewport: r,
      });
    return J(p, t.client.borderBox.center);
  },
  Ba = ({ draggables: e, reason: t, lastImpact: n, home: r, viewport: o, onLiftImpact: s }) =>
    !n.at || t !== 'DROP'
      ? {
          impact: Br({
            draggables: e,
            impact: s,
            destination: r,
            viewport: o,
            forceShouldAnimate: !0,
          }),
          didDropInsideDroppable: !1,
        }
      : n.at.type === 'REORDER'
        ? { impact: n, didDropInsideDroppable: !0 }
        : { impact: { ...n, displaced: $e }, didDropInsideDroppable: !0 };
const Ta =
  ({ getState: e, dispatch: t }) =>
  (n) =>
  (r) => {
    if (!k(r, 'DROP')) {
      n(r);
      return;
    }
    const o = e(),
      s = r.payload.reason;
    if (o.phase === 'COLLECTING') {
      t(Ea({ reason: s }));
      return;
    }
    if (o.phase === 'IDLE') return;
    (o.phase === 'DROP_PENDING' && o.isWaiting && x(),
      o.phase === 'DRAGGING' || o.phase === 'DROP_PENDING' || x());
    const a = o.critical,
      c = o.dimensions,
      l = c.draggables[o.critical.draggable.id],
      { impact: p, didDropInsideDroppable: u } = Ba({
        reason: s,
        lastImpact: o.impact,
        afterCritical: o.afterCritical,
        onLiftImpact: o.onLiftImpact,
        home: o.dimensions.droppables[o.critical.droppable.id],
        viewport: o.viewport,
        draggables: o.dimensions.draggables,
      }),
      d = u ? Xt(p) : null,
      f = u ? ft(p) : null,
      m = { index: a.draggable.index, droppableId: a.droppable.id },
      h = {
        draggableId: l.descriptor.id,
        type: l.descriptor.type,
        source: m,
        reason: s,
        mode: o.movementMode,
        destination: d,
        combine: f,
      },
      g = Oa({
        impact: p,
        draggable: l,
        dimensions: c,
        viewport: o.viewport,
        afterCritical: o.afterCritical,
      }),
      w = { critical: o.critical, afterCritical: o.afterCritical, result: h, impact: p };
    if (!(!ue(o.current.client.offset, g) || !!h.combine)) {
      t(nn({ completed: w }));
      return;
    }
    const C = _a({ current: o.current.client.offset, destination: g, reason: s });
    t(Sa({ newHomeClientOffset: g, dropDuration: C, completed: w }));
  };
var Wr = () => ({ x: window.pageXOffset, y: window.pageYOffset });
function ka(e) {
  return {
    eventName: 'scroll',
    options: { passive: !0, capture: !1 },
    fn: (t) => {
      (t.target !== window && t.target !== window.document) || e();
    },
  };
}
function La({ onWindowScroll: e }) {
  function t() {
    e(Wr());
  }
  const n = Le(t),
    r = ka(n);
  let o = le;
  function s() {
    return o !== le;
  }
  function i() {
    (s() && x(), (o = re(window, [r])));
  }
  function a() {
    (s() || x(), n.cancel(), o(), (o = le));
  }
  return { start: i, stop: a, isActive: s };
}
const Ma = (e) => k(e, 'DROP_COMPLETE') || k(e, 'DROP_ANIMATE') || k(e, 'FLUSH'),
  $a = (e) => {
    const t = La({
      onWindowScroll: (n) => {
        e.dispatch(va({ newScroll: n }));
      },
    });
    return (n) => (r) => {
      (!t.isActive() && k(r, 'INITIAL_PUBLISH') && t.start(),
        t.isActive() && Ma(r) && t.stop(),
        n(r));
    };
  };
var Fa = (e) => {
    let t = !1,
      n = !1;
    const r = setTimeout(() => {
        n = !0;
      }),
      o = (s) => {
        t || n || ((t = !0), e(s), clearTimeout(r));
      };
    return ((o.wasCalled = () => t), o);
  },
  Ga = () => {
    const e = [],
      t = (o) => {
        const s = e.findIndex((a) => a.timerId === o);
        s === -1 && x();
        const [i] = e.splice(s, 1);
        i.callback();
      };
    return {
      add: (o) => {
        const s = setTimeout(() => t(s)),
          i = { timerId: s, callback: o };
        e.push(i);
      },
      flush: () => {
        if (!e.length) return;
        const o = [...e];
        ((e.length = 0),
          o.forEach((s) => {
            (clearTimeout(s.timerId), s.callback());
          }));
      },
    };
  };
const ja = (e, t) =>
    e == null && t == null
      ? !0
      : e == null || t == null
        ? !1
        : e.droppableId === t.droppableId && e.index === t.index,
  Wa = (e, t) =>
    e == null && t == null
      ? !0
      : e == null || t == null
        ? !1
        : e.draggableId === t.draggableId && e.droppableId === t.droppableId,
  Ha = (e, t) => {
    if (e === t) return !0;
    const n =
        e.draggable.id === t.draggable.id &&
        e.draggable.droppableId === t.draggable.droppableId &&
        e.draggable.type === t.draggable.type &&
        e.draggable.index === t.draggable.index,
      r = e.droppable.id === t.droppable.id && e.droppable.type === t.droppable.type;
    return n && r;
  },
  _e = (e, t) => {
    t();
  },
  Ke = (e, t) => ({
    draggableId: e.draggable.id,
    type: e.droppable.type,
    source: { droppableId: e.droppable.id, index: e.draggable.index },
    mode: t,
  });
function Rt(e, t, n, r) {
  if (!e) {
    n(r(t));
    return;
  }
  const o = Fa(n);
  (e(t, { announce: o }), o.wasCalled() || n(r(t)));
}
var Ua = (e, t) => {
    const n = Ga();
    let r = null;
    const o = (u, d) => {
        (r && x(),
          _e('onBeforeCapture', () => {
            const f = e().onBeforeCapture;
            f && f({ draggableId: u, mode: d });
          }));
      },
      s = (u, d) => {
        (r && x(),
          _e('onBeforeDragStart', () => {
            const f = e().onBeforeDragStart;
            f && f(Ke(u, d));
          }));
      },
      i = (u, d) => {
        r && x();
        const f = Ke(u, d);
        ((r = { mode: d, lastCritical: u, lastLocation: f.source, lastCombine: null }),
          n.add(() => {
            _e('onDragStart', () => Rt(e().onDragStart, f, t, tt.onDragStart));
          }));
      },
      a = (u, d) => {
        const f = Xt(d),
          m = ft(d);
        r || x();
        const h = !Ha(u, r.lastCritical);
        h && (r.lastCritical = u);
        const g = !ja(r.lastLocation, f);
        g && (r.lastLocation = f);
        const w = !Wa(r.lastCombine, m);
        if ((w && (r.lastCombine = m), !h && !g && !w)) return;
        const D = { ...Ke(u, r.mode), combine: m, destination: f };
        n.add(() => {
          _e('onDragUpdate', () => Rt(e().onDragUpdate, D, t, tt.onDragUpdate));
        });
      },
      c = () => {
        (r || x(), n.flush());
      },
      l = (u) => {
        (r || x(), (r = null), _e('onDragEnd', () => Rt(e().onDragEnd, u, t, tt.onDragEnd)));
      };
    return {
      beforeCapture: o,
      beforeStart: s,
      start: i,
      update: a,
      flush: c,
      drop: l,
      abort: () => {
        if (!r) return;
        const u = {
          ...Ke(r.lastCritical, r.mode),
          combine: null,
          destination: null,
          reason: 'CANCEL',
        };
        l(u);
      },
    };
  },
  Va = (e, t) => {
    const n = Ua(e, t);
    return (r) => (o) => (s) => {
      if (k(s, 'BEFORE_INITIAL_CAPTURE')) {
        n.beforeCapture(s.payload.draggableId, s.payload.movementMode);
        return;
      }
      if (k(s, 'INITIAL_PUBLISH')) {
        const a = s.payload.critical;
        (n.beforeStart(a, s.payload.movementMode), o(s), n.start(a, s.payload.movementMode));
        return;
      }
      if (k(s, 'DROP_COMPLETE')) {
        const a = s.payload.completed.result;
        (n.flush(), o(s), n.drop(a));
        return;
      }
      if ((o(s), k(s, 'FLUSH'))) {
        n.abort();
        return;
      }
      const i = r.getState();
      i.phase === 'DRAGGING' && n.update(i.critical, i.impact);
    };
  };
const za = (e) => (t) => (n) => {
    if (!k(n, 'DROP_ANIMATION_FINISHED')) {
      t(n);
      return;
    }
    const r = e.getState();
    (r.phase !== 'DROP_ANIMATING' && x(), e.dispatch(nn({ completed: r.completed })));
  },
  qa = (e) => {
    let t = null,
      n = null;
    function r() {
      (n && (cancelAnimationFrame(n), (n = null)), t && (t(), (t = null)));
    }
    return (o) => (s) => {
      if (
        ((k(s, 'FLUSH') || k(s, 'DROP_COMPLETE') || k(s, 'DROP_ANIMATION_FINISHED')) && r(),
        o(s),
        !k(s, 'DROP_ANIMATE'))
      )
        return;
      const i = {
        eventName: 'scroll',
        options: { capture: !0, passive: !1, once: !0 },
        fn: function () {
          e.getState().phase === 'DROP_ANIMATING' && e.dispatch(Fr());
        },
      };
      n = requestAnimationFrame(() => {
        ((n = null), (t = re(window, [i])));
      });
    };
  };
var Ya = (e) => () => (t) => (n) => {
    ((k(n, 'DROP_COMPLETE') || k(n, 'FLUSH') || k(n, 'DROP_ANIMATE')) && e.stopPublishing(), t(n));
  },
  Xa = (e) => {
    let t = !1;
    return () => (n) => (r) => {
      if (k(r, 'INITIAL_PUBLISH')) {
        ((t = !0),
          e.tryRecordFocus(r.payload.critical.draggable.id),
          n(r),
          e.tryRestoreFocusRecorded());
        return;
      }
      if ((n(r), !!t)) {
        if (k(r, 'FLUSH')) {
          ((t = !1), e.tryRestoreFocusRecorded());
          return;
        }
        if (k(r, 'DROP_COMPLETE')) {
          t = !1;
          const o = r.payload.completed.result;
          (o.combine && e.tryShiftRecord(o.draggableId, o.combine.draggableId),
            e.tryRestoreFocusRecorded());
        }
      }
    };
  };
const Qa = (e) => k(e, 'DROP_COMPLETE') || k(e, 'DROP_ANIMATE') || k(e, 'FLUSH');
var Ja = (e) => (t) => (n) => (r) => {
  if (Qa(r)) {
    (e.stop(), n(r));
    return;
  }
  if (k(r, 'INITIAL_PUBLISH')) {
    n(r);
    const o = t.getState();
    (o.phase !== 'DRAGGING' && x(), e.start(o));
    return;
  }
  (n(r), e.scroll(t.getState()));
};
const Ka = (e) => (t) => (n) => {
    if ((t(n), !k(n, 'PUBLISH_WHILE_DRAGGING'))) return;
    const r = e.getState();
    r.phase === 'DROP_PENDING' && (r.isWaiting || e.dispatch($r({ reason: r.reason })));
  },
  Za = or;
var ec = ({
  dimensionMarshal: e,
  focusMarshal: t,
  styleMarshal: n,
  getResponders: r,
  announce: o,
  autoScroller: s,
}) => rr(ua, Za(qo(Ra(n), Ya(e), Aa(e), Ta, za, qa, Ka, Ja(s), $a, Xa(t), Va(r, o))));
const Nt = () => ({ additions: {}, removals: {}, modified: {} });
function tc({ registry: e, callbacks: t }) {
  let n = Nt(),
    r = null;
  const o = () => {
    r ||
      (t.collectionStarting(),
      (r = requestAnimationFrame(() => {
        r = null;
        const { additions: c, removals: l, modified: p } = n,
          u = Object.keys(c)
            .map((m) => e.draggable.getById(m).getDimension(W))
            .sort((m, h) => m.descriptor.index - h.descriptor.index),
          d = Object.keys(p).map((m) => {
            const g = e.droppable.getById(m).callbacks.getScrollWhileDragging();
            return { droppableId: m, scroll: g };
          }),
          f = { additions: u, removals: Object.keys(l), modified: d };
        ((n = Nt()), t.publish(f));
      })));
  };
  return {
    add: (c) => {
      const l = c.descriptor.id;
      ((n.additions[l] = c),
        (n.modified[c.descriptor.droppableId] = !0),
        n.removals[l] && delete n.removals[l],
        o());
    },
    remove: (c) => {
      const l = c.descriptor;
      ((n.removals[l.id] = !0),
        (n.modified[l.droppableId] = !0),
        n.additions[l.id] && delete n.additions[l.id],
        o());
    },
    stop: () => {
      r && (cancelAnimationFrame(r), (r = null), (n = Nt()));
    },
  };
}
var Hr = ({ scrollHeight: e, scrollWidth: t, height: n, width: r }) => {
    const o = J({ x: t, y: e }, { x: r, y: n });
    return { x: Math.max(0, o.x), y: Math.max(0, o.y) };
  },
  Ur = () => {
    const e = document.documentElement;
    return (e || x(), e);
  },
  Vr = () => {
    const e = Ur();
    return Hr({
      scrollHeight: e.scrollHeight,
      scrollWidth: e.scrollWidth,
      width: e.clientWidth,
      height: e.clientHeight,
    });
  },
  nc = () => {
    const e = Wr(),
      t = Vr(),
      n = e.y,
      r = e.x,
      o = Ur(),
      s = o.clientWidth,
      i = o.clientHeight,
      a = r + s,
      c = n + i;
    return {
      frame: ie({ top: n, left: r, right: a, bottom: c }),
      scroll: { initial: e, current: e, max: t, diff: { value: W, displacement: W } },
    };
  },
  rc = ({ critical: e, scrollOptions: t, registry: n }) => {
    const r = nc(),
      o = r.scroll.current,
      s = e.droppable,
      i = n.droppable.getAllByType(s.type).map((p) => p.callbacks.getDimensionAndWatchScroll(o, t)),
      a = n.draggable.getAllByType(e.draggable.type).map((p) => p.getDimension(o));
    return { dimensions: { draggables: vr(a), droppables: yr(i) }, critical: e, viewport: r };
  };
function Ln(e, t, n) {
  return !(
    n.descriptor.id === t.id ||
    n.descriptor.type !== t.type ||
    e.droppable.getById(n.descriptor.droppableId).descriptor.mode !== 'virtual'
  );
}
var oc = (e, t) => {
    let n = null;
    const r = tc({
        callbacks: { publish: t.publishWhileDragging, collectionStarting: t.collectionStarting },
        registry: e,
      }),
      o = (d, f) => {
        (e.droppable.exists(d) || x(), n && t.updateDroppableIsEnabled({ id: d, isEnabled: f }));
      },
      s = (d, f) => {
        n &&
          (e.droppable.exists(d) || x(),
          t.updateDroppableIsCombineEnabled({ id: d, isCombineEnabled: f }));
      },
      i = (d, f) => {
        n && (e.droppable.exists(d) || x(), t.updateDroppableScroll({ id: d, newScroll: f }));
      },
      a = (d, f) => {
        n && e.droppable.getById(d).callbacks.scroll(f);
      },
      c = () => {
        if (!n) return;
        r.stop();
        const d = n.critical.droppable;
        (e.droppable.getAllByType(d.type).forEach((f) => f.callbacks.dragStopped()),
          n.unsubscribe(),
          (n = null));
      },
      l = (d) => {
        n || x();
        const f = n.critical.draggable;
        (d.type === 'ADDITION' && Ln(e, f, d.value) && r.add(d.value),
          d.type === 'REMOVAL' && Ln(e, f, d.value) && r.remove(d.value));
      };
    return {
      updateDroppableIsEnabled: o,
      updateDroppableIsCombineEnabled: s,
      scrollDroppable: a,
      updateDroppableScroll: i,
      startPublishing: (d) => {
        n && x();
        const f = e.draggable.getById(d.draggableId),
          m = e.droppable.getById(f.descriptor.droppableId),
          h = { draggable: f.descriptor, droppable: m.descriptor },
          g = e.subscribe(l);
        return (
          (n = { critical: h, unsubscribe: g }),
          rc({ critical: h, registry: e, scrollOptions: d.scrollOptions })
        );
      },
      stopPublishing: c,
    };
  },
  zr = (e, t) =>
    e.phase === 'IDLE'
      ? !0
      : e.phase !== 'DROP_ANIMATING' || e.completed.result.draggableId === t
        ? !1
        : e.completed.result.reason === 'DROP',
  sc = (e) => {
    window.scrollBy(e.x, e.y);
  };
const ic = j((e) => pt(e).filter((t) => !(!t.isEnabled || !t.frame))),
  ac = (e, t) => ic(t).find((r) => (r.frame || x(), Nr(r.frame.pageMarginBox)(e))) || null;
var cc = ({ center: e, destination: t, droppables: n }) => {
  if (t) {
    const o = n[t];
    return o.frame ? o : null;
  }
  return ac(e, n);
};
const je = {
  startFromPercentage: 0.25,
  maxScrollAtPercentage: 0.05,
  maxPixelScroll: 28,
  ease: (e) => e ** 2,
  durationDampening: { stopDampeningAt: 1200, accelerateAt: 360 },
  disabled: !1,
};
var lc = (e, t, n = () => je) => {
    const r = n(),
      o = e[t.size] * r.startFromPercentage,
      s = e[t.size] * r.maxScrollAtPercentage;
    return { startScrollingFrom: o, maxScrollValueAt: s };
  },
  qr = ({ startOfRange: e, endOfRange: t, current: n }) => {
    const r = t - e;
    return r === 0 ? 0 : (n - e) / r;
  },
  on = 1,
  uc = (e, t, n = () => je) => {
    const r = n();
    if (e > t.startScrollingFrom) return 0;
    if (e <= t.maxScrollValueAt) return r.maxPixelScroll;
    if (e === t.startScrollingFrom) return on;
    const s =
        1 - qr({ startOfRange: t.maxScrollValueAt, endOfRange: t.startScrollingFrom, current: e }),
      i = r.maxPixelScroll * r.ease(s);
    return Math.ceil(i);
  },
  dc = (e, t, n) => {
    const r = n(),
      o = r.durationDampening.accelerateAt,
      s = r.durationDampening.stopDampeningAt,
      i = t,
      a = s,
      l = Date.now() - i;
    if (l >= s) return e;
    if (l < o) return on;
    const p = qr({ startOfRange: o, endOfRange: a, current: l }),
      u = e * r.ease(p);
    return Math.ceil(u);
  },
  Mn = ({
    distanceToEdge: e,
    thresholds: t,
    dragStartTime: n,
    shouldUseTimeDampening: r,
    getAutoScrollerOptions: o,
  }) => {
    const s = uc(e, t, o);
    return s === 0 ? 0 : r ? Math.max(dc(s, n, o), on) : s;
  },
  $n = ({
    container: e,
    distanceToEdges: t,
    dragStartTime: n,
    axis: r,
    shouldUseTimeDampening: o,
    getAutoScrollerOptions: s,
  }) => {
    const i = lc(e, r, s);
    return t[r.end] < t[r.start]
      ? Mn({
          distanceToEdge: t[r.end],
          thresholds: i,
          dragStartTime: n,
          shouldUseTimeDampening: o,
          getAutoScrollerOptions: s,
        })
      : -1 *
          Mn({
            distanceToEdge: t[r.start],
            thresholds: i,
            dragStartTime: n,
            shouldUseTimeDampening: o,
            getAutoScrollerOptions: s,
          });
  },
  pc = ({ container: e, subject: t, proposedScroll: n }) => {
    const r = t.height > e.height,
      o = t.width > e.width;
    return !o && !r ? n : o && r ? null : { x: o ? 0 : n.x, y: r ? 0 : n.y };
  };
const fc = hr((e) => (e === 0 ? 0 : e));
var Yr = ({
  dragStartTime: e,
  container: t,
  subject: n,
  center: r,
  shouldUseTimeDampening: o,
  getAutoScrollerOptions: s,
}) => {
  const i = { top: r.y - t.top, right: t.right - r.x, bottom: t.bottom - r.y, left: r.x - t.left },
    a = $n({
      container: t,
      distanceToEdges: i,
      dragStartTime: e,
      axis: Qt,
      shouldUseTimeDampening: o,
      getAutoScrollerOptions: s,
    }),
    c = $n({
      container: t,
      distanceToEdges: i,
      dragStartTime: e,
      axis: wr,
      shouldUseTimeDampening: o,
      getAutoScrollerOptions: s,
    }),
    l = fc({ x: c, y: a });
  if (ue(l, W)) return null;
  const p = pc({ container: t, subject: n, proposedScroll: l });
  return p ? (ue(p, W) ? null : p) : null;
};
const gc = hr((e) => (e === 0 ? 0 : e > 0 ? 1 : -1)),
  sn = (() => {
    const e = (t, n) => (t < 0 ? t : t > n ? t - n : 0);
    return ({ current: t, max: n, change: r }) => {
      const o = H(t, r),
        s = { x: e(o.x, n.x), y: e(o.y, n.y) };
      return ue(s, W) ? null : s;
    };
  })(),
  Xr = ({ max: e, current: t, change: n }) => {
    const r = { x: Math.max(t.x, e.x), y: Math.max(t.y, e.y) },
      o = gc(n),
      s = sn({ max: r, current: t, change: o });
    return !s || (o.x !== 0 && s.x === 0) || (o.y !== 0 && s.y === 0);
  },
  an = (e, t) => Xr({ current: e.scroll.current, max: e.scroll.max, change: t }),
  mc = (e, t) => {
    if (!an(e, t)) return null;
    const n = e.scroll.max,
      r = e.scroll.current;
    return sn({ current: r, max: n, change: t });
  },
  cn = (e, t) => {
    const n = e.frame;
    return n ? Xr({ current: n.scroll.current, max: n.scroll.max, change: t }) : !1;
  },
  bc = (e, t) => {
    const n = e.frame;
    return !n || !cn(e, t) ? null : sn({ current: n.scroll.current, max: n.scroll.max, change: t });
  };
var hc = ({
    viewport: e,
    subject: t,
    center: n,
    dragStartTime: r,
    shouldUseTimeDampening: o,
    getAutoScrollerOptions: s,
  }) => {
    const i = Yr({
      dragStartTime: r,
      container: e.frame,
      subject: t,
      center: n,
      shouldUseTimeDampening: o,
      getAutoScrollerOptions: s,
    });
    return i && an(e, i) ? i : null;
  },
  yc = ({
    droppable: e,
    subject: t,
    center: n,
    dragStartTime: r,
    shouldUseTimeDampening: o,
    getAutoScrollerOptions: s,
  }) => {
    const i = e.frame;
    if (!i) return null;
    const a = Yr({
      dragStartTime: r,
      container: i.pageMarginBox,
      subject: t,
      center: n,
      shouldUseTimeDampening: o,
      getAutoScrollerOptions: s,
    });
    return a && cn(e, a) ? a : null;
  },
  Fn = ({
    state: e,
    dragStartTime: t,
    shouldUseTimeDampening: n,
    scrollWindow: r,
    scrollDroppable: o,
    getAutoScrollerOptions: s,
  }) => {
    const i = e.current.page.borderBoxCenter,
      c = e.dimensions.draggables[e.critical.draggable.id].page.marginBox;
    if (e.isWindowScrollAllowed) {
      const u = e.viewport,
        d = hc({
          dragStartTime: t,
          viewport: u,
          subject: c,
          center: i,
          shouldUseTimeDampening: n,
          getAutoScrollerOptions: s,
        });
      if (d) {
        r(d);
        return;
      }
    }
    const l = cc({ center: i, destination: K(e.impact), droppables: e.dimensions.droppables });
    if (!l) return;
    const p = yc({
      dragStartTime: t,
      droppable: l,
      subject: c,
      center: i,
      shouldUseTimeDampening: n,
      getAutoScrollerOptions: s,
    });
    p && o(l.descriptor.id, p);
  },
  vc = ({ scrollWindow: e, scrollDroppable: t, getAutoScrollerOptions: n = () => je }) => {
    const r = Le(e),
      o = Le(t);
    let s = null;
    const i = (l) => {
      s || x();
      const { shouldUseTimeDampening: p, dragStartTime: u } = s;
      Fn({
        state: l,
        scrollWindow: r,
        scrollDroppable: o,
        dragStartTime: u,
        shouldUseTimeDampening: p,
        getAutoScrollerOptions: n,
      });
    };
    return {
      start: (l) => {
        s && x();
        const p = Date.now();
        let u = !1;
        const d = () => {
          u = !0;
        };
        (Fn({
          state: l,
          dragStartTime: 0,
          shouldUseTimeDampening: !1,
          scrollWindow: d,
          scrollDroppable: d,
          getAutoScrollerOptions: n,
        }),
          (s = { dragStartTime: p, shouldUseTimeDampening: u }),
          u && i(l));
      },
      stop: () => {
        s && (r.cancel(), o.cancel(), (s = null));
      },
      scroll: i,
    };
  },
  xc = ({ move: e, scrollDroppable: t, scrollWindow: n }) => {
    const r = (a, c) => {
        const l = H(a.current.client.selection, c);
        e({ client: l });
      },
      o = (a, c) => {
        if (!cn(a, c)) return c;
        const l = bc(a, c);
        if (!l) return (t(a.descriptor.id, c), null);
        const p = J(c, l);
        return (t(a.descriptor.id, p), J(c, p));
      },
      s = (a, c, l) => {
        if (!a || !an(c, l)) return l;
        const p = mc(c, l);
        if (!p) return (n(l), null);
        const u = J(l, p);
        return (n(u), J(l, u));
      };
    return (a) => {
      const c = a.scrollJumpRequest;
      if (!c) return;
      const l = K(a.impact);
      l || x();
      const p = o(a.dimensions.droppables[l], c);
      if (!p) return;
      const u = a.viewport,
        d = s(a.isWindowScrollAllowed, u, p);
      d && r(a, d);
    };
  },
  Dc = ({ scrollDroppable: e, scrollWindow: t, move: n, getAutoScrollerOptions: r }) => {
    const o = vc({ scrollWindow: t, scrollDroppable: e, getAutoScrollerOptions: r }),
      s = xc({ move: n, scrollWindow: t, scrollDroppable: e });
    return {
      scroll: (c) => {
        if (!(r().disabled || c.phase !== 'DRAGGING')) {
          if (c.movementMode === 'FLUID') {
            o.scroll(c);
            return;
          }
          c.scrollJumpRequest && s(c);
        }
      },
      start: o.start,
      stop: o.stop,
    };
  };
const ye = 'data-rfd',
  ve = (() => {
    const e = `${ye}-drag-handle`;
    return { base: e, draggableId: `${e}-draggable-id`, contextId: `${e}-context-id` };
  })(),
  Gt = (() => {
    const e = `${ye}-draggable`;
    return { base: e, contextId: `${e}-context-id`, id: `${e}-id` };
  })(),
  wc = (() => {
    const e = `${ye}-droppable`;
    return { base: e, contextId: `${e}-context-id`, id: `${e}-id` };
  })(),
  Gn = { contextId: `${ye}-scroll-container-context-id` },
  Cc = (e) => (t) => `[${t}="${e}"]`,
  Oe = (e, t) =>
    e
      .map((n) => {
        const r = n.styles[t];
        return r ? `${n.selector} { ${r} }` : '';
      })
      .join(' '),
  Ic = 'pointer-events: none;';
var Sc = (e) => {
  const t = Cc(e),
    n = (() => {
      const a = `
      cursor: -webkit-grab;
      cursor: grab;
    `;
      return {
        selector: t(ve.contextId),
        styles: {
          always: `
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: rgba(0,0,0,0);
          touch-action: manipulation;
        `,
          resting: a,
          dragging: Ic,
          dropAnimating: a,
        },
      };
    })(),
    r = (() => {
      const a = `
      transition: ${ke.outOfTheWay};
    `;
      return {
        selector: t(Gt.contextId),
        styles: { dragging: a, dropAnimating: a, userCancel: a },
      };
    })(),
    o = { selector: t(wc.contextId), styles: { always: 'overflow-anchor: none;' } },
    i = [
      r,
      n,
      o,
      {
        selector: 'body',
        styles: {
          dragging: `
        cursor: grabbing;
        cursor: -webkit-grabbing;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        overflow-anchor: none;
      `,
        },
      },
    ];
  return {
    always: Oe(i, 'always'),
    resting: Oe(i, 'resting'),
    dragging: Oe(i, 'dragging'),
    dropAnimating: Oe(i, 'dropAnimating'),
    userCancel: Oe(i, 'userCancel'),
  };
};
const Z =
    typeof window < 'u' &&
    typeof window.document < 'u' &&
    typeof window.document.createElement < 'u'
      ? b.useLayoutEffect
      : b.useEffect,
  Pt = () => {
    const e = document.querySelector('head');
    return (e || x(), e);
  },
  jn = (e) => {
    const t = document.createElement('style');
    return (e && t.setAttribute('nonce', e), (t.type = 'text/css'), t);
  };
function Ec(e, t) {
  const n = P(() => Sc(e), [e]),
    r = b.useRef(null),
    o = b.useRef(null),
    s = A(
      j((u) => {
        const d = o.current;
        (d || x(), (d.textContent = u));
      }),
      [],
    ),
    i = A((u) => {
      const d = r.current;
      (d || x(), (d.textContent = u));
    }, []);
  Z(() => {
    (!r.current && !o.current) || x();
    const u = jn(t),
      d = jn(t);
    return (
      (r.current = u),
      (o.current = d),
      u.setAttribute(`${ye}-always`, e),
      d.setAttribute(`${ye}-dynamic`, e),
      Pt().appendChild(u),
      Pt().appendChild(d),
      i(n.always),
      s(n.resting),
      () => {
        const f = (m) => {
          const h = m.current;
          (h || x(), Pt().removeChild(h), (m.current = null));
        };
        (f(r), f(o));
      }
    );
  }, [t, i, s, n.always, n.resting, e]);
  const a = A(() => s(n.dragging), [s, n.dragging]),
    c = A(
      (u) => {
        if (u === 'DROP') {
          s(n.dropAnimating);
          return;
        }
        s(n.userCancel);
      },
      [s, n.dropAnimating, n.userCancel],
    ),
    l = A(() => {
      o.current && s(n.resting);
    }, [s, n.resting]);
  return P(() => ({ dragging: a, dropping: c, resting: l }), [a, c, l]);
}
function Qr(e, t) {
  return Array.from(e.querySelectorAll(t));
}
var Jr = (e) =>
  e && e.ownerDocument && e.ownerDocument.defaultView ? e.ownerDocument.defaultView : window;
function bt(e) {
  return e instanceof Jr(e).HTMLElement;
}
function Ac(e, t) {
  const n = `[${ve.contextId}="${e}"]`,
    r = Qr(document, n);
  if (!r.length) return null;
  const o = r.find((s) => s.getAttribute(ve.draggableId) === t);
  return !o || !bt(o) ? null : o;
}
function Rc(e) {
  const t = b.useRef({}),
    n = b.useRef(null),
    r = b.useRef(null),
    o = b.useRef(!1),
    s = A(function (d, f) {
      const m = { id: d, focus: f };
      return (
        (t.current[d] = m),
        function () {
          const g = t.current;
          g[d] !== m && delete g[d];
        }
      );
    }, []),
    i = A(
      function (d) {
        const f = Ac(e, d);
        f && f !== document.activeElement && f.focus();
      },
      [e],
    ),
    a = A(function (d, f) {
      n.current === d && (n.current = f);
    }, []),
    c = A(
      function () {
        r.current ||
          (o.current &&
            (r.current = requestAnimationFrame(() => {
              r.current = null;
              const d = n.current;
              d && i(d);
            })));
      },
      [i],
    ),
    l = A(function (d) {
      n.current = null;
      const f = document.activeElement;
      f && f.getAttribute(ve.draggableId) === d && (n.current = d);
    }, []);
  return (
    Z(
      () => (
        (o.current = !0),
        function () {
          o.current = !1;
          const d = r.current;
          d && cancelAnimationFrame(d);
        }
      ),
      [],
    ),
    P(
      () => ({ register: s, tryRecordFocus: l, tryRestoreFocusRecorded: c, tryShiftRecord: a }),
      [s, l, c, a],
    )
  );
}
function Nc() {
  const e = { draggables: {}, droppables: {} },
    t = [];
  function n(u) {
    return (
      t.push(u),
      function () {
        const f = t.indexOf(u);
        f !== -1 && t.splice(f, 1);
      }
    );
  }
  function r(u) {
    t.length && t.forEach((d) => d(u));
  }
  function o(u) {
    return e.draggables[u] || null;
  }
  function s(u) {
    const d = o(u);
    return (d || x(), d);
  }
  const i = {
    register: (u) => {
      ((e.draggables[u.descriptor.id] = u), r({ type: 'ADDITION', value: u }));
    },
    update: (u, d) => {
      const f = e.draggables[d.descriptor.id];
      f &&
        f.uniqueId === u.uniqueId &&
        (delete e.draggables[d.descriptor.id], (e.draggables[u.descriptor.id] = u));
    },
    unregister: (u) => {
      const d = u.descriptor.id,
        f = o(d);
      f &&
        u.uniqueId === f.uniqueId &&
        (delete e.draggables[d],
        e.droppables[u.descriptor.droppableId] && r({ type: 'REMOVAL', value: u }));
    },
    getById: s,
    findById: o,
    exists: (u) => !!o(u),
    getAllByType: (u) => Object.values(e.draggables).filter((d) => d.descriptor.type === u),
  };
  function a(u) {
    return e.droppables[u] || null;
  }
  function c(u) {
    const d = a(u);
    return (d || x(), d);
  }
  const l = {
    register: (u) => {
      e.droppables[u.descriptor.id] = u;
    },
    unregister: (u) => {
      const d = a(u.descriptor.id);
      d && u.uniqueId === d.uniqueId && delete e.droppables[u.descriptor.id];
    },
    getById: c,
    findById: a,
    exists: (u) => !!a(u),
    getAllByType: (u) => Object.values(e.droppables).filter((d) => d.descriptor.type === u),
  };
  function p() {
    ((e.draggables = {}), (e.droppables = {}), (t.length = 0));
  }
  return { draggable: i, droppable: l, subscribe: n, clean: p };
}
function Pc() {
  const e = P(Nc, []);
  return (
    b.useEffect(
      () =>
        function () {
          e.clean();
        },
      [e],
    ),
    e
  );
}
var ln = F.createContext(null),
  lt = () => {
    const e = document.body;
    return (e || x(), e);
  };
const _c = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    border: '0',
    padding: '0',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    'clip-path': 'inset(100%)',
  },
  Oc = (e) => `rfd-announcement-${e}`;
function Bc(e) {
  const t = P(() => Oc(e), [e]),
    n = b.useRef(null);
  return (
    b.useEffect(
      function () {
        const s = document.createElement('div');
        return (
          (n.current = s),
          (s.id = t),
          s.setAttribute('aria-live', 'assertive'),
          s.setAttribute('aria-atomic', 'true'),
          st(s.style, _c),
          lt().appendChild(s),
          function () {
            setTimeout(function () {
              const c = lt();
              (c.contains(s) && c.removeChild(s), s === n.current && (n.current = null));
            });
          }
        );
      },
      [t],
    ),
    A((o) => {
      const s = n.current;
      if (s) {
        s.textContent = o;
        return;
      }
    }, [])
  );
}
const Tc = { separator: '::' };
function un(e, t = Tc) {
  const n = F.useId();
  return P(() => `${e}${t.separator}${n}`, [t.separator, e, n]);
}
function kc({ contextId: e, uniqueId: t }) {
  return `rfd-hidden-text-${e}-${t}`;
}
function Lc({ contextId: e, text: t }) {
  const n = un('hidden-text', { separator: '-' }),
    r = P(() => kc({ contextId: e, uniqueId: n }), [n, e]);
  return (
    b.useEffect(
      function () {
        const s = document.createElement('div');
        return (
          (s.id = r),
          (s.textContent = t),
          (s.style.display = 'none'),
          lt().appendChild(s),
          function () {
            const a = lt();
            a.contains(s) && a.removeChild(s);
          }
        );
      },
      [r, t],
    ),
    r
  );
}
var ht = F.createContext(null);
function Kr(e) {
  const t = b.useRef(e);
  return (
    b.useEffect(() => {
      t.current = e;
    }),
    t
  );
}
function Mc() {
  let e = null;
  function t() {
    return !!e;
  }
  function n(i) {
    return i === e;
  }
  function r(i) {
    e && x();
    const a = { abandon: i };
    return ((e = a), a);
  }
  function o() {
    (e || x(), (e = null));
  }
  function s() {
    e && (e.abandon(), o());
  }
  return { isClaimed: t, isActive: n, claim: r, release: o, tryAbandon: s };
}
function We(e) {
  return e.phase === 'IDLE' || e.phase === 'DROP_ANIMATING' ? !1 : e.isDragging;
}
const $c = 9,
  Fc = 13,
  dn = 27,
  Zr = 32,
  Gc = 33,
  jc = 34,
  Wc = 35,
  Hc = 36,
  Uc = 37,
  Vc = 38,
  zc = 39,
  qc = 40,
  Yc = { [Fc]: !0, [$c]: !0 };
var eo = (e) => {
  Yc[e.keyCode] && e.preventDefault();
};
const yt = (() => {
    const e = 'visibilitychange';
    return typeof document > 'u'
      ? e
      : [e, `ms${e}`, `webkit${e}`, `moz${e}`, `o${e}`].find((r) => `on${r}` in document) || e;
  })(),
  to = 0,
  Wn = 5;
function Xc(e, t) {
  return Math.abs(t.x - e.x) >= Wn || Math.abs(t.y - e.y) >= Wn;
}
const Hn = { type: 'IDLE' };
function Qc({ cancel: e, completed: t, getPhase: n, setPhase: r }) {
  return [
    {
      eventName: 'mousemove',
      fn: (o) => {
        const { button: s, clientX: i, clientY: a } = o;
        if (s !== to) return;
        const c = { x: i, y: a },
          l = n();
        if (l.type === 'DRAGGING') {
          (o.preventDefault(), l.actions.move(c));
          return;
        }
        l.type !== 'PENDING' && x();
        const p = l.point;
        if (!Xc(p, c)) return;
        o.preventDefault();
        const u = l.actions.fluidLift(c);
        r({ type: 'DRAGGING', actions: u });
      },
    },
    {
      eventName: 'mouseup',
      fn: (o) => {
        const s = n();
        if (s.type !== 'DRAGGING') {
          e();
          return;
        }
        (o.preventDefault(), s.actions.drop({ shouldBlockNextClick: !0 }), t());
      },
    },
    {
      eventName: 'mousedown',
      fn: (o) => {
        (n().type === 'DRAGGING' && o.preventDefault(), e());
      },
    },
    {
      eventName: 'keydown',
      fn: (o) => {
        if (n().type === 'PENDING') {
          e();
          return;
        }
        if (o.keyCode === dn) {
          (o.preventDefault(), e());
          return;
        }
        eo(o);
      },
    },
    { eventName: 'resize', fn: e },
    {
      eventName: 'scroll',
      options: { passive: !0, capture: !1 },
      fn: () => {
        n().type === 'PENDING' && e();
      },
    },
    {
      eventName: 'webkitmouseforcedown',
      fn: (o) => {
        const s = n();
        if ((s.type === 'IDLE' && x(), s.actions.shouldRespectForcePress())) {
          e();
          return;
        }
        o.preventDefault();
      },
    },
    { eventName: yt, fn: e },
  ];
}
function Jc(e) {
  const t = b.useRef(Hn),
    n = b.useRef(le),
    r = P(
      () => ({
        eventName: 'mousedown',
        fn: function (u) {
          if (
            u.defaultPrevented ||
            u.button !== to ||
            u.ctrlKey ||
            u.metaKey ||
            u.shiftKey ||
            u.altKey
          )
            return;
          const d = e.findClosestDraggableId(u);
          if (!d) return;
          const f = e.tryGetLock(d, i, { sourceEvent: u });
          if (!f) return;
          u.preventDefault();
          const m = { x: u.clientX, y: u.clientY };
          (n.current(), l(f, m));
        },
      }),
      [e],
    ),
    o = P(
      () => ({
        eventName: 'webkitmouseforcewillbegin',
        fn: (p) => {
          if (p.defaultPrevented) return;
          const u = e.findClosestDraggableId(p);
          if (!u) return;
          const d = e.findOptionsForDraggable(u);
          d && (d.shouldRespectForcePress || (e.canGetLock(u) && p.preventDefault()));
        },
      }),
      [e],
    ),
    s = A(
      function () {
        const u = { passive: !1, capture: !0 };
        n.current = re(window, [o, r], u);
      },
      [o, r],
    ),
    i = A(() => {
      t.current.type !== 'IDLE' && ((t.current = Hn), n.current(), s());
    }, [s]),
    a = A(() => {
      const p = t.current;
      (i(),
        p.type === 'DRAGGING' && p.actions.cancel({ shouldBlockNextClick: !0 }),
        p.type === 'PENDING' && p.actions.abort());
    }, [i]),
    c = A(
      function () {
        const u = { capture: !0, passive: !1 },
          d = Qc({
            cancel: a,
            completed: i,
            getPhase: () => t.current,
            setPhase: (f) => {
              t.current = f;
            },
          });
        n.current = re(window, d, u);
      },
      [a, i],
    ),
    l = A(
      function (u, d) {
        (t.current.type !== 'IDLE' && x(),
          (t.current = { type: 'PENDING', point: d, actions: u }),
          c());
      },
      [c],
    );
  Z(
    function () {
      return (
        s(),
        function () {
          n.current();
        }
      );
    },
    [s],
  );
}
function Kc() {}
const Zc = { [jc]: !0, [Gc]: !0, [Hc]: !0, [Wc]: !0 };
function el(e, t) {
  function n() {
    (t(), e.cancel());
  }
  function r() {
    (t(), e.drop());
  }
  return [
    {
      eventName: 'keydown',
      fn: (o) => {
        if (o.keyCode === dn) {
          (o.preventDefault(), n());
          return;
        }
        if (o.keyCode === Zr) {
          (o.preventDefault(), r());
          return;
        }
        if (o.keyCode === qc) {
          (o.preventDefault(), e.moveDown());
          return;
        }
        if (o.keyCode === Vc) {
          (o.preventDefault(), e.moveUp());
          return;
        }
        if (o.keyCode === zc) {
          (o.preventDefault(), e.moveRight());
          return;
        }
        if (o.keyCode === Uc) {
          (o.preventDefault(), e.moveLeft());
          return;
        }
        if (Zc[o.keyCode]) {
          o.preventDefault();
          return;
        }
        eo(o);
      },
    },
    { eventName: 'mousedown', fn: n },
    { eventName: 'mouseup', fn: n },
    { eventName: 'click', fn: n },
    { eventName: 'touchstart', fn: n },
    { eventName: 'resize', fn: n },
    { eventName: 'wheel', fn: n, options: { passive: !0 } },
    { eventName: yt, fn: n },
  ];
}
function tl(e) {
  const t = b.useRef(Kc),
    n = P(
      () => ({
        eventName: 'keydown',
        fn: function (s) {
          if (s.defaultPrevented || s.keyCode !== Zr) return;
          const i = e.findClosestDraggableId(s);
          if (!i) return;
          const a = e.tryGetLock(i, p, { sourceEvent: s });
          if (!a) return;
          s.preventDefault();
          let c = !0;
          const l = a.snapLift();
          t.current();
          function p() {
            (c || x(), (c = !1), t.current(), r());
          }
          t.current = re(window, el(l, p), { capture: !0, passive: !1 });
        },
      }),
      [e],
    ),
    r = A(
      function () {
        const s = { passive: !1, capture: !0 };
        t.current = re(window, [n], s);
      },
      [n],
    );
  Z(
    function () {
      return (
        r(),
        function () {
          t.current();
        }
      );
    },
    [r],
  );
}
const _t = { type: 'IDLE' },
  nl = 120,
  rl = 0.15;
function ol({ cancel: e, getPhase: t }) {
  return [
    { eventName: 'orientationchange', fn: e },
    { eventName: 'resize', fn: e },
    {
      eventName: 'contextmenu',
      fn: (n) => {
        n.preventDefault();
      },
    },
    {
      eventName: 'keydown',
      fn: (n) => {
        if (t().type !== 'DRAGGING') {
          e();
          return;
        }
        (n.keyCode === dn && n.preventDefault(), e());
      },
    },
    { eventName: yt, fn: e },
  ];
}
function sl({ cancel: e, completed: t, getPhase: n }) {
  return [
    {
      eventName: 'touchmove',
      options: { capture: !1 },
      fn: (r) => {
        const o = n();
        if (o.type !== 'DRAGGING') {
          e();
          return;
        }
        o.hasMoved = !0;
        const { clientX: s, clientY: i } = r.touches[0],
          a = { x: s, y: i };
        (r.preventDefault(), o.actions.move(a));
      },
    },
    {
      eventName: 'touchend',
      fn: (r) => {
        const o = n();
        if (o.type !== 'DRAGGING') {
          e();
          return;
        }
        (r.preventDefault(), o.actions.drop({ shouldBlockNextClick: !0 }), t());
      },
    },
    {
      eventName: 'touchcancel',
      fn: (r) => {
        if (n().type !== 'DRAGGING') {
          e();
          return;
        }
        (r.preventDefault(), e());
      },
    },
    {
      eventName: 'touchforcechange',
      fn: (r) => {
        const o = n();
        o.type === 'IDLE' && x();
        const s = r.touches[0];
        if (!s || !(s.force >= rl)) return;
        const a = o.actions.shouldRespectForcePress();
        if (o.type === 'PENDING') {
          a && e();
          return;
        }
        if (a) {
          if (o.hasMoved) {
            r.preventDefault();
            return;
          }
          e();
          return;
        }
        r.preventDefault();
      },
    },
    { eventName: yt, fn: e },
  ];
}
function il(e) {
  const t = b.useRef(_t),
    n = b.useRef(le),
    r = A(function () {
      return t.current;
    }, []),
    o = A(function (f) {
      t.current = f;
    }, []),
    s = P(
      () => ({
        eventName: 'touchstart',
        fn: function (f) {
          if (f.defaultPrevented) return;
          const m = e.findClosestDraggableId(f);
          if (!m) return;
          const h = e.tryGetLock(m, a, { sourceEvent: f });
          if (!h) return;
          const g = f.touches[0],
            { clientX: w, clientY: D } = g,
            C = { x: w, y: D };
          (n.current(), u(h, C));
        },
      }),
      [e],
    ),
    i = A(
      function () {
        const f = { capture: !0, passive: !1 };
        n.current = re(window, [s], f);
      },
      [s],
    ),
    a = A(() => {
      const d = t.current;
      d.type !== 'IDLE' &&
        (d.type === 'PENDING' && clearTimeout(d.longPressTimerId), o(_t), n.current(), i());
    }, [i, o]),
    c = A(() => {
      const d = t.current;
      (a(),
        d.type === 'DRAGGING' && d.actions.cancel({ shouldBlockNextClick: !0 }),
        d.type === 'PENDING' && d.actions.abort());
    }, [a]),
    l = A(
      function () {
        const f = { capture: !0, passive: !1 },
          m = { cancel: c, completed: a, getPhase: r },
          h = re(window, sl(m), f),
          g = re(window, ol(m), f);
        n.current = function () {
          (h(), g());
        };
      },
      [c, r, a],
    ),
    p = A(
      function () {
        const f = r();
        f.type !== 'PENDING' && x();
        const m = f.actions.fluidLift(f.point);
        o({ type: 'DRAGGING', actions: m, hasMoved: !1 });
      },
      [r, o],
    ),
    u = A(
      function (f, m) {
        r().type !== 'IDLE' && x();
        const h = setTimeout(p, nl);
        (o({ type: 'PENDING', point: m, actions: f, longPressTimerId: h }), l());
      },
      [l, r, o, p],
    );
  (Z(
    function () {
      return (
        i(),
        function () {
          n.current();
          const m = r();
          m.type === 'PENDING' && (clearTimeout(m.longPressTimerId), o(_t));
        }
      );
    },
    [r, i, o],
  ),
    Z(function () {
      return re(window, [
        { eventName: 'touchmove', fn: () => {}, options: { capture: !1, passive: !1 } },
      ]);
    }, []));
}
const al = ['input', 'button', 'textarea', 'select', 'option', 'optgroup', 'video', 'audio'];
function no(e, t) {
  if (t == null) return !1;
  if (al.includes(t.tagName.toLowerCase())) return !0;
  const r = t.getAttribute('contenteditable');
  return r === 'true' || r === '' ? !0 : t === e ? !1 : no(e, t.parentElement);
}
function cl(e, t) {
  const n = t.target;
  return bt(n) ? no(e, n) : !1;
}
var ll = (e) => ie(e.getBoundingClientRect()).center;
function ul(e) {
  return e instanceof Jr(e).Element;
}
const dl = (() => {
  const e = 'matches';
  return typeof document > 'u'
    ? e
    : [e, 'msMatchesSelector', 'webkitMatchesSelector'].find((r) => r in Element.prototype) || e;
})();
function ro(e, t) {
  return e == null ? null : e[dl](t) ? e : ro(e.parentElement, t);
}
function pl(e, t) {
  return e.closest ? e.closest(t) : ro(e, t);
}
function fl(e) {
  return `[${ve.contextId}="${e}"]`;
}
function gl(e, t) {
  const n = t.target;
  if (!ul(n)) return null;
  const r = fl(e),
    o = pl(n, r);
  return !o || !bt(o) ? null : o;
}
function ml(e, t) {
  const n = gl(e, t);
  return n ? n.getAttribute(ve.draggableId) : null;
}
function bl(e, t) {
  const n = `[${Gt.contextId}="${e}"]`,
    o = Qr(document, n).find((s) => s.getAttribute(Gt.id) === t);
  return !o || !bt(o) ? null : o;
}
function hl(e) {
  e.preventDefault();
}
function Ze({ expected: e, phase: t, isLockActive: n, shouldWarn: r }) {
  return !(!n() || e !== t);
}
function oo({ lockAPI: e, store: t, registry: n, draggableId: r }) {
  if (e.isClaimed()) return !1;
  const o = n.draggable.findById(r);
  return !(!o || !o.options.isEnabled || !zr(t.getState(), r));
}
function yl({
  lockAPI: e,
  contextId: t,
  store: n,
  registry: r,
  draggableId: o,
  forceSensorStop: s,
  sourceEvent: i,
}) {
  if (!oo({ lockAPI: e, store: n, registry: r, draggableId: o })) return null;
  const c = r.draggable.getById(o),
    l = bl(t, c.descriptor.id);
  if (!l || (i && !c.options.canDragInteractiveElements && cl(l, i))) return null;
  const p = e.claim(s || le);
  let u = 'PRE_DRAG';
  function d() {
    return c.options.shouldRespectForcePress;
  }
  function f() {
    return e.isActive(p);
  }
  function m(I, S) {
    Ze({ expected: I, phase: u, isLockActive: f, shouldWarn: !0 }) && n.dispatch(S());
  }
  const h = m.bind(null, 'DRAGGING');
  function g(I) {
    function S() {
      (e.release(), (u = 'COMPLETED'));
    }
    (u !== 'PRE_DRAG' && (S(), x()), n.dispatch(pa(I.liftActionArgs)), (u = 'DRAGGING'));
    function O(_, M = { shouldBlockNextClick: !1 }) {
      if ((I.cleanup(), M.shouldBlockNextClick)) {
        const B = re(window, [
          { eventName: 'click', fn: hl, options: { once: !0, passive: !1, capture: !0 } },
        ]);
        setTimeout(B);
      }
      (S(), n.dispatch($r({ reason: _ })));
    }
    return {
      isActive: () => Ze({ expected: 'DRAGGING', phase: u, isLockActive: f, shouldWarn: !1 }),
      shouldRespectForcePress: d,
      drop: (_) => O('DROP', _),
      cancel: (_) => O('CANCEL', _),
      ...I.actions,
    };
  }
  function w(I) {
    const S = Le((_) => {
      h(() => Mr({ client: _ }));
    });
    return {
      ...g({
        liftActionArgs: { id: o, clientSelection: I, movementMode: 'FLUID' },
        cleanup: () => S.cancel(),
        actions: { move: S },
      }),
      move: S,
    };
  }
  function D() {
    const I = {
      moveUp: () => h(Da),
      moveRight: () => h(Ca),
      moveDown: () => h(wa),
      moveLeft: () => h(Ia),
    };
    return g({
      liftActionArgs: { id: o, clientSelection: ll(l), movementMode: 'SNAP' },
      cleanup: le,
      actions: I,
    });
  }
  function C() {
    Ze({ expected: 'PRE_DRAG', phase: u, isLockActive: f, shouldWarn: !0 }) && e.release();
  }
  return {
    isActive: () => Ze({ expected: 'PRE_DRAG', phase: u, isLockActive: f, shouldWarn: !1 }),
    shouldRespectForcePress: d,
    fluidLift: w,
    snapLift: D,
    abort: C,
  };
}
const vl = [Jc, tl, il];
function xl({ contextId: e, store: t, registry: n, customSensors: r, enableDefaultSensors: o }) {
  const s = [...(o ? vl : []), ...(r || [])],
    i = b.useState(() => Mc())[0],
    a = A(
      function (g, w) {
        We(g) && !We(w) && i.tryAbandon();
      },
      [i],
    );
  (Z(
    function () {
      let g = t.getState();
      return t.subscribe(() => {
        const D = t.getState();
        (a(g, D), (g = D));
      });
    },
    [i, t, a],
  ),
    Z(() => i.tryAbandon, [i.tryAbandon]));
  const c = A((h) => oo({ lockAPI: i, registry: n, store: t, draggableId: h }), [i, n, t]),
    l = A(
      (h, g, w) =>
        yl({
          lockAPI: i,
          registry: n,
          contextId: e,
          store: t,
          draggableId: h,
          forceSensorStop: g || null,
          sourceEvent: w && w.sourceEvent ? w.sourceEvent : null,
        }),
      [e, i, n, t],
    ),
    p = A((h) => ml(e, h), [e]),
    u = A(
      (h) => {
        const g = n.draggable.findById(h);
        return g ? g.options : null;
      },
      [n.draggable],
    ),
    d = A(
      function () {
        i.isClaimed() && (i.tryAbandon(), t.getState().phase !== 'IDLE' && t.dispatch(tn()));
      },
      [i, t],
    ),
    f = A(() => i.isClaimed(), [i]),
    m = P(
      () => ({
        canGetLock: c,
        tryGetLock: l,
        findClosestDraggableId: p,
        findOptionsForDraggable: u,
        tryReleaseLock: d,
        isLockClaimed: f,
      }),
      [c, l, p, u, d, f],
    );
  for (let h = 0; h < s.length; h++) s[h](m);
}
const Dl = (e) => ({
    onBeforeCapture: (t) => {
      const n = () => {
        e.onBeforeCapture && e.onBeforeCapture(t);
      };
      Zn.flushSync(n);
    },
    onBeforeDragStart: e.onBeforeDragStart,
    onDragStart: e.onDragStart,
    onDragEnd: e.onDragEnd,
    onDragUpdate: e.onDragUpdate,
  }),
  wl = (e) => ({
    ...je,
    ...e.autoScrollerOptions,
    durationDampening: { ...je.durationDampening, ...e.autoScrollerOptions },
  });
function Be(e) {
  return (e.current || x(), e.current);
}
function Cl(e) {
  const { contextId: t, setCallbacks: n, sensors: r, nonce: o, dragHandleUsageInstructions: s } = e,
    i = b.useRef(null),
    a = Kr(e),
    c = A(() => Dl(a.current), [a]),
    l = A(() => wl(a.current), [a]),
    p = Bc(t),
    u = Lc({ contextId: t, text: s }),
    d = Ec(t, o),
    f = A((B) => {
      Be(i).dispatch(B);
    }, []),
    m = P(
      () =>
        hn(
          {
            publishWhileDragging: ga,
            updateDroppableScroll: ba,
            updateDroppableIsEnabled: ha,
            updateDroppableIsCombineEnabled: ya,
            collectionStarting: ma,
          },
          f,
        ),
      [f],
    ),
    h = Pc(),
    g = P(() => oc(h, m), [h, m]),
    w = P(
      () =>
        Dc({
          scrollWindow: sc,
          scrollDroppable: g.scrollDroppable,
          getAutoScrollerOptions: l,
          ...hn({ move: Mr }, f),
        }),
      [g.scrollDroppable, f, l],
    ),
    D = Rc(t),
    C = P(
      () =>
        ec({
          announce: p,
          autoScroller: w,
          dimensionMarshal: g,
          focusMarshal: D,
          getResponders: c,
          styleMarshal: d,
        }),
      [p, w, g, D, c, d],
    );
  i.current = C;
  const v = A(() => {
      const B = Be(i);
      B.getState().phase !== 'IDLE' && B.dispatch(tn());
    }, []),
    I = A(() => {
      const B = Be(i).getState();
      return B.phase === 'DROP_ANIMATING' ? !0 : B.phase === 'IDLE' ? !1 : B.isDragging;
    }, []),
    S = P(() => ({ isDragging: I, tryAbort: v }), [I, v]);
  n(S);
  const O = A((B) => zr(Be(i).getState(), B), []),
    _ = A(() => me(Be(i).getState()), []),
    M = P(
      () => ({
        marshal: g,
        focus: D,
        contextId: t,
        canLift: O,
        isMovementAllowed: _,
        dragHandleUsageInstructionsId: u,
        registry: h,
      }),
      [t, g, u, D, O, _, h],
    );
  return (
    xl({
      contextId: t,
      store: C,
      registry: h,
      customSensors: r || null,
      enableDefaultSensors: e.enableDefaultSensors !== !1,
    }),
    b.useEffect(() => v, [v]),
    F.createElement(
      ht.Provider,
      { value: M },
      F.createElement(Ys, { context: ln, store: C }, e.children),
    )
  );
}
function Il() {
  return F.useId();
}
function Sl(e) {
  const t = Il(),
    n = e.dragHandleUsageInstructions || tt.dragHandleUsageInstructions;
  return F.createElement(ti, null, (r) =>
    F.createElement(
      Cl,
      {
        nonce: e.nonce,
        contextId: t,
        setCallbacks: r,
        dragHandleUsageInstructions: n,
        enableDefaultSensors: e.enableDefaultSensors,
        sensors: e.sensors,
        onBeforeCapture: e.onBeforeCapture,
        onBeforeDragStart: e.onBeforeDragStart,
        onDragStart: e.onDragStart,
        onDragUpdate: e.onDragUpdate,
        onDragEnd: e.onDragEnd,
        autoScrollerOptions: e.autoScrollerOptions,
      },
      e.children,
    ),
  );
}
const Un = { dragging: 5e3, dropAnimating: 4500 },
  El = (e, t) => (t ? ke.drop(t.duration) : e ? ke.snap : ke.fluid),
  Al = (e, t) => {
    if (e) return t ? Ge.opacity.drop : Ge.opacity.combining;
  },
  Rl = (e) => (e.forceShouldAnimate != null ? e.forceShouldAnimate : e.mode === 'SNAP');
function Nl(e) {
  const n = e.dimension.client,
    { offset: r, combineWith: o, dropping: s } = e,
    i = !!o,
    a = Rl(e),
    c = !!s,
    l = c ? $t.drop(r, i) : $t.moveTo(r);
  return {
    position: 'fixed',
    top: n.marginBox.top,
    left: n.marginBox.left,
    boxSizing: 'border-box',
    width: n.borderBox.width,
    height: n.borderBox.height,
    transition: El(a, s),
    transform: l,
    opacity: Al(i, c),
    zIndex: c ? Un.dropAnimating : Un.dragging,
    pointerEvents: 'none',
  };
}
function Pl(e) {
  return {
    transform: $t.moveTo(e.offset),
    transition: e.shouldAnimateDisplacement ? void 0 : 'none',
  };
}
function _l(e) {
  return e.type === 'DRAGGING' ? Nl(e) : Pl(e);
}
function Ol(e, t, n = W) {
  const r = window.getComputedStyle(t),
    o = t.getBoundingClientRect(),
    s = dr(o, r),
    i = ot(s, n),
    a = { client: s, tagName: t.tagName.toLowerCase(), display: r.display },
    c = { x: s.marginBox.width, y: s.marginBox.height };
  return { descriptor: e, placeholder: a, displaceBy: c, client: s, page: i };
}
function Bl(e) {
  const t = un('draggable'),
    {
      descriptor: n,
      registry: r,
      getDraggableRef: o,
      canDragInteractiveElements: s,
      shouldRespectForcePress: i,
      isEnabled: a,
    } = e,
    c = P(
      () => ({ canDragInteractiveElements: s, shouldRespectForcePress: i, isEnabled: a }),
      [s, a, i],
    ),
    l = A(
      (f) => {
        const m = o();
        return (m || x(), Ol(n, m, f));
      },
      [n, o],
    ),
    p = P(() => ({ uniqueId: t, descriptor: n, options: c, getDimension: l }), [n, l, c, t]),
    u = b.useRef(p),
    d = b.useRef(!0);
  (Z(
    () => (r.draggable.register(u.current), () => r.draggable.unregister(u.current)),
    [r.draggable],
  ),
    Z(() => {
      if (d.current) {
        d.current = !1;
        return;
      }
      const f = u.current;
      ((u.current = p), r.draggable.update(p, f));
    }, [p, r.draggable]));
}
var pn = F.createContext(null);
function ut(e) {
  const t = b.useContext(e);
  return (t || x(), t);
}
function Tl(e) {
  e.preventDefault();
}
const kl = (e) => {
  const t = b.useRef(null),
    n = A((S = null) => {
      t.current = S;
    }, []),
    r = A(() => t.current, []),
    { contextId: o, dragHandleUsageInstructionsId: s, registry: i } = ut(ht),
    { type: a, droppableId: c } = ut(pn),
    l = P(
      () => ({ id: e.draggableId, index: e.index, type: a, droppableId: c }),
      [e.draggableId, e.index, a, c],
    ),
    {
      children: p,
      draggableId: u,
      isEnabled: d,
      shouldRespectForcePress: f,
      canDragInteractiveElements: m,
      isClone: h,
      mapped: g,
      dropAnimationFinished: w,
    } = e;
  if (!h) {
    const S = P(
      () => ({
        descriptor: l,
        registry: i,
        getDraggableRef: r,
        canDragInteractiveElements: m,
        shouldRespectForcePress: f,
        isEnabled: d,
      }),
      [l, i, r, m, f, d],
    );
    Bl(S);
  }
  const D = P(
      () =>
        d
          ? {
              tabIndex: 0,
              role: 'button',
              'aria-describedby': s,
              'data-rfd-drag-handle-draggable-id': u,
              'data-rfd-drag-handle-context-id': o,
              draggable: !1,
              onDragStart: Tl,
            }
          : null,
      [o, s, u, d],
    ),
    C = A(
      (S) => {
        g.type === 'DRAGGING' && g.dropping && S.propertyName === 'transform' && Zn.flushSync(w);
      },
      [w, g],
    ),
    v = P(() => {
      const S = _l(g),
        O = g.type === 'DRAGGING' && g.dropping ? C : void 0;
      return {
        innerRef: n,
        draggableProps: {
          'data-rfd-draggable-context-id': o,
          'data-rfd-draggable-id': u,
          style: S,
          onTransitionEnd: O,
        },
        dragHandleProps: D,
      };
    }, [o, D, u, g, C, n]),
    I = P(
      () => ({
        draggableId: l.id,
        type: l.type,
        source: { index: l.index, droppableId: l.droppableId },
      }),
      [l.droppableId, l.id, l.index, l.type],
    );
  return F.createElement(F.Fragment, null, p(v, g.snapshot, I));
};
var so = (e, t) => e === t,
  io = (e) => {
    const { combine: t, destination: n } = e;
    return n ? n.droppableId : t ? t.droppableId : null;
  };
const Ll = (e) => (e.combine ? e.combine.draggableId : null),
  Ml = (e) => (e.at && e.at.type === 'COMBINE' ? e.at.combine.draggableId : null);
function $l() {
  const e = j((o, s) => ({ x: o, y: s })),
    t = j((o, s, i = null, a = null, c = null) => ({
      isDragging: !0,
      isClone: s,
      isDropAnimating: !!c,
      dropAnimation: c,
      mode: o,
      draggingOver: i,
      combineWith: a,
      combineTargetFor: null,
    })),
    n = j((o, s, i, a, c = null, l = null, p = null) => ({
      mapped: {
        type: 'DRAGGING',
        dropping: null,
        draggingOver: c,
        combineWith: l,
        mode: s,
        offset: o,
        dimension: i,
        forceShouldAnimate: p,
        snapshot: t(s, a, c, l, null),
      },
    }));
  return (o, s) => {
    if (We(o)) {
      if (o.critical.draggable.id !== s.draggableId) return null;
      const i = o.current.client.offset,
        a = o.dimensions.draggables[s.draggableId],
        c = K(o.impact),
        l = Ml(o.impact),
        p = o.forceShouldAnimate;
      return n(e(i.x, i.y), o.movementMode, a, s.isClone, c, l, p);
    }
    if (o.phase === 'DROP_ANIMATING') {
      const i = o.completed;
      if (i.result.draggableId !== s.draggableId) return null;
      const a = s.isClone,
        c = o.dimensions.draggables[s.draggableId],
        l = i.result,
        p = l.mode,
        u = io(l),
        d = Ll(l),
        m = {
          duration: o.dropDuration,
          curve: rn.drop,
          moveTo: o.newHomeClientOffset,
          opacity: d ? Ge.opacity.drop : null,
          scale: d ? Ge.scale.drop : null,
        };
      return {
        mapped: {
          type: 'DRAGGING',
          offset: o.newHomeClientOffset,
          dimension: c,
          dropping: m,
          draggingOver: u,
          combineWith: d,
          mode: p,
          forceShouldAnimate: null,
          snapshot: t(p, a, u, d, m),
        },
      };
    }
    return null;
  };
}
function ao(e = null) {
  return {
    isDragging: !1,
    isDropAnimating: !1,
    isClone: !1,
    dropAnimation: null,
    mode: null,
    draggingOver: null,
    combineTargetFor: e,
    combineWith: null,
  };
}
const Fl = {
  mapped: {
    type: 'SECONDARY',
    offset: W,
    combineTargetFor: null,
    shouldAnimateDisplacement: !0,
    snapshot: ao(null),
  },
};
function Gl() {
  const e = j((i, a) => ({ x: i, y: a })),
    t = j(ao),
    n = j((i, a = null, c) => ({
      mapped: {
        type: 'SECONDARY',
        offset: i,
        combineTargetFor: a,
        shouldAnimateDisplacement: c,
        snapshot: t(a),
      },
    })),
    r = (i) => (i ? n(W, i, !0) : null),
    o = (i, a, c, l) => {
      const p = c.displaced.visible[i],
        u = !!(l.inVirtualList && l.effected[i]),
        d = ft(c),
        f = d && d.draggableId === i ? a : null;
      if (!p) {
        if (!u) return r(f);
        if (c.displaced.invisible[i]) return null;
        const g = xe(l.displacedBy.point),
          w = e(g.x, g.y);
        return n(w, f, !0);
      }
      if (u) return r(f);
      const m = c.displacedBy.point,
        h = e(m.x, m.y);
      return n(h, f, p.shouldAnimate);
    };
  return (i, a) => {
    if (We(i))
      return i.critical.draggable.id === a.draggableId
        ? null
        : o(a.draggableId, i.critical.draggable.id, i.impact, i.afterCritical);
    if (i.phase === 'DROP_ANIMATING') {
      const c = i.completed;
      return c.result.draggableId === a.draggableId
        ? null
        : o(a.draggableId, c.result.draggableId, c.impact, c.afterCritical);
    }
    return null;
  };
}
const jl = () => {
    const e = $l(),
      t = Gl();
    return (r, o) => e(r, o) || t(r, o) || Fl;
  },
  Wl = { dropAnimationFinished: Fr },
  Hl = ur(jl, Wl, null, { context: ln, areStatePropsEqual: so })(kl);
function co(e) {
  return ut(pn).isUsingCloneFor === e.draggableId && !e.isClone ? null : F.createElement(Hl, e);
}
function lo(e) {
  const t = typeof e.isDragDisabled == 'boolean' ? !e.isDragDisabled : !0,
    n = !!e.disableInteractiveElementBlocking,
    r = !!e.shouldRespectForcePress;
  return F.createElement(
    co,
    st({}, e, {
      isClone: !1,
      isEnabled: t,
      canDragInteractiveElements: n,
      shouldRespectForcePress: r,
    }),
  );
}
const uo = (e) => (t) => e === t,
  Ul = uo('scroll'),
  Vl = uo('auto'),
  Vn = (e, t) => t(e.overflowX) || t(e.overflowY),
  zl = (e) => {
    const t = window.getComputedStyle(e),
      n = { overflowX: t.overflowX, overflowY: t.overflowY };
    return Vn(n, Ul) || Vn(n, Vl);
  },
  ql = () => !1,
  po = (e) =>
    e == null
      ? null
      : e === document.body
        ? ql()
          ? e
          : null
        : e === document.documentElement
          ? null
          : zl(e)
            ? e
            : po(e.parentElement);
var jt = (e) => ({ x: e.scrollLeft, y: e.scrollTop });
const fo = (e) =>
  e ? (window.getComputedStyle(e).position === 'fixed' ? !0 : fo(e.parentElement)) : !1;
var Yl = (e) => {
    const t = po(e),
      n = fo(e);
    return { closestScrollable: t, isFixedOnPage: n };
  },
  Xl = ({
    descriptor: e,
    isEnabled: t,
    isCombineEnabled: n,
    isFixedOnPage: r,
    direction: o,
    client: s,
    page: i,
    closest: a,
  }) => {
    const c = (() => {
        if (!a) return null;
        const { scrollSize: d, client: f } = a,
          m = Hr({
            scrollHeight: d.scrollHeight,
            scrollWidth: d.scrollWidth,
            height: f.paddingBox.height,
            width: f.paddingBox.width,
          });
        return {
          pageMarginBox: a.page.marginBox,
          frameClient: f,
          scrollSize: d,
          shouldClipSubject: a.shouldClipSubject,
          scroll: {
            initial: a.scroll,
            current: a.scroll,
            max: m,
            diff: { value: W, displacement: W },
          },
        };
      })(),
      l = o === 'vertical' ? Qt : wr,
      p = he({ page: i, withPlaceholder: null, axis: l, frame: c });
    return {
      descriptor: e,
      isCombineEnabled: n,
      isFixedOnPage: r,
      axis: l,
      isEnabled: t,
      client: s,
      page: i,
      frame: c,
      subject: p,
    };
  };
const Ql = (e, t) => {
  const n = pr(e);
  if (!t || e !== t) return n;
  const r = n.paddingBox.top - t.scrollTop,
    o = n.paddingBox.left - t.scrollLeft,
    s = r + t.scrollHeight,
    i = o + t.scrollWidth,
    c = zt({ top: r, right: i, bottom: s, left: o }, n.border);
  return qt({ borderBox: c, margin: n.margin, border: n.border, padding: n.padding });
};
var Jl = ({
  ref: e,
  descriptor: t,
  env: n,
  windowScroll: r,
  direction: o,
  isDropDisabled: s,
  isCombineEnabled: i,
  shouldClipSubject: a,
}) => {
  const c = n.closestScrollable,
    l = Ql(e, c),
    p = ot(l, r),
    u = (() => {
      if (!c) return null;
      const f = pr(c),
        m = { scrollHeight: c.scrollHeight, scrollWidth: c.scrollWidth };
      return { client: f, page: ot(f, r), scroll: jt(c), scrollSize: m, shouldClipSubject: a };
    })();
  return Xl({
    descriptor: t,
    isEnabled: !s,
    isCombineEnabled: i,
    isFixedOnPage: n.isFixedOnPage,
    direction: o,
    client: l,
    page: p,
    closest: u,
  });
};
const Kl = { passive: !1 },
  Zl = { passive: !0 };
var zn = (e) => (e.shouldPublishImmediately ? Kl : Zl);
const et = (e) => (e && e.env.closestScrollable) || null;
function eu(e) {
  const t = b.useRef(null),
    n = ut(ht),
    r = un('droppable'),
    { registry: o, marshal: s } = n,
    i = Kr(e),
    a = P(
      () => ({ id: e.droppableId, type: e.type, mode: e.mode }),
      [e.droppableId, e.mode, e.type],
    ),
    c = b.useRef(a),
    l = P(
      () =>
        j((v, I) => {
          t.current || x();
          const S = { x: v, y: I };
          s.updateDroppableScroll(a.id, S);
        }),
      [a.id, s],
    ),
    p = A(() => {
      const v = t.current;
      return !v || !v.env.closestScrollable ? W : jt(v.env.closestScrollable);
    }, []),
    u = A(() => {
      const v = p();
      l(v.x, v.y);
    }, [p, l]),
    d = P(() => Le(u), [u]),
    f = A(() => {
      const v = t.current,
        I = et(v);
      if (((v && I) || x(), v.scrollOptions.shouldPublishImmediately)) {
        u();
        return;
      }
      d();
    }, [d, u]),
    m = A(
      (v, I) => {
        t.current && x();
        const S = i.current,
          O = S.getDroppableRef();
        O || x();
        const _ = Yl(O),
          M = { ref: O, descriptor: a, env: _, scrollOptions: I };
        t.current = M;
        const B = Jl({
            ref: O,
            descriptor: a,
            env: _,
            windowScroll: v,
            direction: S.direction,
            isDropDisabled: S.isDropDisabled,
            isCombineEnabled: S.isCombineEnabled,
            shouldClipSubject: !S.ignoreContainerClipping,
          }),
          $ = _.closestScrollable;
        return (
          $ &&
            ($.setAttribute(Gn.contextId, n.contextId),
            $.addEventListener('scroll', f, zn(M.scrollOptions))),
          B
        );
      },
      [n.contextId, a, f, i],
    ),
    h = A(() => {
      const v = t.current,
        I = et(v);
      return ((v && I) || x(), jt(I));
    }, []),
    g = A(() => {
      const v = t.current;
      v || x();
      const I = et(v);
      ((t.current = null),
        I &&
          (d.cancel(),
          I.removeAttribute(Gn.contextId),
          I.removeEventListener('scroll', f, zn(v.scrollOptions))));
    }, [f, d]),
    w = A((v) => {
      const I = t.current;
      I || x();
      const S = et(I);
      (S || x(), (S.scrollTop += v.y), (S.scrollLeft += v.x));
    }, []),
    D = P(
      () => ({
        getDimensionAndWatchScroll: m,
        getScrollWhileDragging: h,
        dragStopped: g,
        scroll: w,
      }),
      [g, m, h, w],
    ),
    C = P(() => ({ uniqueId: r, descriptor: a, callbacks: D }), [D, a, r]);
  (Z(
    () => (
      (c.current = C.descriptor),
      o.droppable.register(C),
      () => {
        (t.current && g(), o.droppable.unregister(C));
      }
    ),
    [D, a, g, C, s, o.droppable],
  ),
    Z(() => {
      t.current && s.updateDroppableIsEnabled(c.current.id, !e.isDropDisabled);
    }, [e.isDropDisabled, s]),
    Z(() => {
      t.current && s.updateDroppableIsCombineEnabled(c.current.id, e.isCombineEnabled);
    }, [e.isCombineEnabled, s]));
}
function Ot() {}
const qn = { width: 0, height: 0, margin: ci },
  tu = ({ isAnimatingOpenOnMount: e, placeholder: t, animate: n }) =>
    e || n === 'close'
      ? qn
      : {
          height: t.client.borderBox.height,
          width: t.client.borderBox.width,
          margin: t.client.margin,
        },
  nu = ({ isAnimatingOpenOnMount: e, placeholder: t, animate: n }) => {
    const r = tu({ isAnimatingOpenOnMount: e, placeholder: t, animate: n });
    return {
      display: t.display,
      boxSizing: 'border-box',
      width: r.width,
      height: r.height,
      marginTop: r.margin.top,
      marginRight: r.margin.right,
      marginBottom: r.margin.bottom,
      marginLeft: r.margin.left,
      flexShrink: '0',
      flexGrow: '0',
      pointerEvents: 'none',
      transition: n !== 'none' ? ke.placeholder : null,
    };
  },
  ru = (e) => {
    const t = b.useRef(null),
      n = A(() => {
        t.current && (clearTimeout(t.current), (t.current = null));
      }, []),
      { animate: r, onTransitionEnd: o, onClose: s, contextId: i } = e,
      [a, c] = b.useState(e.animate === 'open');
    b.useEffect(
      () =>
        a
          ? r !== 'open'
            ? (n(), c(!1), Ot)
            : t.current
              ? Ot
              : ((t.current = setTimeout(() => {
                  ((t.current = null), c(!1));
                })),
                n)
          : Ot,
      [r, a, n],
    );
    const l = A(
        (u) => {
          u.propertyName === 'height' && (o(), r === 'close' && s());
        },
        [r, s, o],
      ),
      p = nu({ isAnimatingOpenOnMount: a, animate: e.animate, placeholder: e.placeholder });
    return F.createElement(e.placeholder.tagName, {
      style: p,
      'data-rfd-placeholder-context-id': i,
      onTransitionEnd: l,
      ref: e.innerRef,
    });
  };
var ou = F.memo(ru);
class su extends F.PureComponent {
  constructor(...t) {
    (super(...t),
      (this.state = {
        isVisible: !!this.props.on,
        data: this.props.on,
        animate: this.props.shouldAnimate && this.props.on ? 'open' : 'none',
      }),
      (this.onClose = () => {
        this.state.animate === 'close' && this.setState({ isVisible: !1 });
      }));
  }
  static getDerivedStateFromProps(t, n) {
    return t.shouldAnimate
      ? t.on
        ? { isVisible: !0, data: t.on, animate: 'open' }
        : n.isVisible
          ? { isVisible: !0, data: n.data, animate: 'close' }
          : { isVisible: !1, animate: 'close', data: null }
      : { isVisible: !!t.on, data: t.on, animate: 'none' };
  }
  render() {
    if (!this.state.isVisible) return null;
    const t = { onClose: this.onClose, data: this.state.data, animate: this.state.animate };
    return this.props.children(t);
  }
}
const iu = (e) => {
  const t = b.useContext(ht);
  t || x();
  const { contextId: n, isMovementAllowed: r } = t,
    o = b.useRef(null),
    s = b.useRef(null),
    {
      children: i,
      droppableId: a,
      type: c,
      mode: l,
      direction: p,
      ignoreContainerClipping: u,
      isDropDisabled: d,
      isCombineEnabled: f,
      snapshot: m,
      useClone: h,
      updateViewportMaxScroll: g,
      getContainerForClone: w,
    } = e,
    D = A(() => o.current, []),
    C = A(($ = null) => {
      o.current = $;
    }, []);
  A(() => s.current, []);
  const v = A(($ = null) => {
      s.current = $;
    }, []),
    I = A(() => {
      r() && g({ maxScroll: Vr() });
    }, [r, g]);
  eu({
    droppableId: a,
    type: c,
    mode: l,
    direction: p,
    isDropDisabled: d,
    isCombineEnabled: f,
    ignoreContainerClipping: u,
    getDroppableRef: D,
  });
  const S = P(
      () =>
        F.createElement(
          su,
          { on: e.placeholder, shouldAnimate: e.shouldAnimatePlaceholder },
          ({ onClose: $, data: V, animate: se }) =>
            F.createElement(ou, {
              placeholder: V,
              onClose: $,
              innerRef: v,
              animate: se,
              contextId: n,
              onTransitionEnd: I,
            }),
        ),
      [n, I, e.placeholder, e.shouldAnimatePlaceholder, v],
    ),
    O = P(
      () => ({
        innerRef: C,
        placeholder: S,
        droppableProps: { 'data-rfd-droppable-id': a, 'data-rfd-droppable-context-id': n },
      }),
      [n, a, S, C],
    ),
    _ = h ? h.dragging.draggableId : null,
    M = P(() => ({ droppableId: a, type: c, isUsingCloneFor: _ }), [a, _, c]);
  function B() {
    if (!h) return null;
    const { dragging: $, render: V } = h,
      se = F.createElement(
        co,
        {
          draggableId: $.draggableId,
          index: $.source.index,
          isClone: !0,
          isEnabled: !0,
          shouldRespectForcePress: !1,
          canDragInteractiveElements: !0,
        },
        (Ce, ee) => V(Ce, ee, $),
      );
    return yo.createPortal(se, w());
  }
  return F.createElement(pn.Provider, { value: M }, i(O, m), B());
};
function au() {
  return (document.body || x(), document.body);
}
const Yn = {
    mode: 'standard',
    type: 'DEFAULT',
    direction: 'vertical',
    isDropDisabled: !1,
    isCombineEnabled: !1,
    ignoreContainerClipping: !1,
    renderClone: null,
    getContainerForClone: au,
  },
  go = (e) => {
    let t = { ...e },
      n;
    for (n in Yn) e[n] === void 0 && (t = { ...t, [n]: Yn[n] });
    return t;
  },
  Bt = (e, t) => e === t.droppable.type,
  Xn = (e, t) => t.draggables[e.draggable.id],
  cu = () => {
    const e = {
        placeholder: null,
        shouldAnimatePlaceholder: !0,
        snapshot: {
          isDraggingOver: !1,
          draggingOverWith: null,
          draggingFromThisWith: null,
          isUsingPlaceholder: !1,
        },
        useClone: null,
      },
      t = { ...e, shouldAnimatePlaceholder: !1 },
      n = j((s) => ({
        draggableId: s.id,
        type: s.type,
        source: { index: s.index, droppableId: s.droppableId },
      })),
      r = j((s, i, a, c, l, p) => {
        const u = l.descriptor.id;
        if (l.descriptor.droppableId === s) {
          const m = p ? { render: p, dragging: n(l.descriptor) } : null,
            h = {
              isDraggingOver: a,
              draggingOverWith: a ? u : null,
              draggingFromThisWith: u,
              isUsingPlaceholder: !0,
            };
          return {
            placeholder: l.placeholder,
            shouldAnimatePlaceholder: !1,
            snapshot: h,
            useClone: m,
          };
        }
        if (!i) return t;
        if (!c) return e;
        const f = {
          isDraggingOver: a,
          draggingOverWith: u,
          draggingFromThisWith: null,
          isUsingPlaceholder: !0,
        };
        return {
          placeholder: l.placeholder,
          shouldAnimatePlaceholder: !0,
          snapshot: f,
          useClone: null,
        };
      });
    return (s, i) => {
      const a = go(i),
        c = a.droppableId,
        l = a.type,
        p = !a.isDropDisabled,
        u = a.renderClone;
      if (We(s)) {
        const d = s.critical;
        if (!Bt(l, d)) return t;
        const f = Xn(d, s.dimensions),
          m = K(s.impact) === c;
        return r(c, p, m, m, f, u);
      }
      if (s.phase === 'DROP_ANIMATING') {
        const d = s.completed;
        if (!Bt(l, d.critical)) return t;
        const f = Xn(d.critical, s.dimensions);
        return r(c, p, io(d.result) === c, K(d.impact) === c, f, u);
      }
      if (s.phase === 'IDLE' && s.completed && !s.shouldFlush) {
        const d = s.completed;
        if (!Bt(l, d.critical)) return t;
        const f = K(d.impact) === c,
          m = !!(d.impact.at && d.impact.at.type === 'COMBINE'),
          h = d.critical.droppable.id === c;
        return f ? (m ? e : t) : h ? e : t;
      }
      return t;
    };
  },
  lu = { updateViewportMaxScroll: xa },
  mo = ur(cu, lu, (e, t, n) => ({ ...go(n), ...e, ...t }), { context: ln, areStatePropsEqual: so })(
    iu,
  );
var uu = Symbol.for('react.lazy'),
  dt = vo[' use '.trim().toString()];
function du(e) {
  return typeof e == 'object' && e !== null && 'then' in e;
}
function bo(e) {
  return (
    e != null &&
    typeof e == 'object' &&
    '$$typeof' in e &&
    e.$$typeof === uu &&
    '_payload' in e &&
    du(e._payload)
  );
}
function pu(e) {
  const t = gu(e),
    n = b.forwardRef((r, o) => {
      let { children: s, ...i } = r;
      bo(s) && typeof dt == 'function' && (s = dt(s._payload));
      const a = b.Children.toArray(s),
        c = a.find(bu);
      if (c) {
        const l = c.props.children,
          p = a.map((u) =>
            u === c
              ? b.Children.count(l) > 1
                ? b.Children.only(null)
                : b.isValidElement(l)
                  ? l.props.children
                  : null
              : u,
          );
        return y.jsx(t, {
          ...i,
          ref: o,
          children: b.isValidElement(l) ? b.cloneElement(l, void 0, p) : null,
        });
      }
      return y.jsx(t, { ...i, ref: o, children: s });
    });
  return ((n.displayName = `${e}.Slot`), n);
}
var fu = pu('Slot');
function gu(e) {
  const t = b.forwardRef((n, r) => {
    let { children: o, ...s } = n;
    if ((bo(o) && typeof dt == 'function' && (o = dt(o._payload)), b.isValidElement(o))) {
      const i = yu(o),
        a = hu(s, o.props);
      return (o.type !== b.Fragment && (a.ref = r ? xo(r, i) : i), b.cloneElement(o, a));
    }
    return b.Children.count(o) > 1 ? b.Children.only(null) : null;
  });
  return ((t.displayName = `${e}.SlotClone`), t);
}
var mu = Symbol('radix.slottable');
function bu(e) {
  return (
    b.isValidElement(e) &&
    typeof e.type == 'function' &&
    '__radixId' in e.type &&
    e.type.__radixId === mu
  );
}
function hu(e, t) {
  const n = { ...t };
  for (const r in t) {
    const o = e[r],
      s = t[r];
    /^on[A-Z]/.test(r)
      ? o && s
        ? (n[r] = (...a) => {
            const c = s(...a);
            return (o(...a), c);
          })
        : o && (n[r] = o)
      : r === 'style'
        ? (n[r] = { ...o, ...s })
        : r === 'className' && (n[r] = [o, s].filter(Boolean).join(' '));
  }
  return { ...e, ...n };
}
function yu(e) {
  var r, o;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null ? void 0 : r.get,
    n = t && 'isReactWarning' in t && t.isReactWarning;
  return n
    ? e.ref
    : ((t = (o = Object.getOwnPropertyDescriptor(e, 'ref')) == null ? void 0 : o.get),
      (n = t && 'isReactWarning' in t && t.isReactWarning),
      n ? e.props.ref : e.props.ref || e.ref);
}
const Qn = (e) => (typeof e == 'boolean' ? `${e}` : e === 0 ? '0' : e),
  Jn = Do,
  vu = (e, t) => (n) => {
    var r;
    if ((t == null ? void 0 : t.variants) == null)
      return Jn(e, n == null ? void 0 : n.class, n == null ? void 0 : n.className);
    const { variants: o, defaultVariants: s } = t,
      i = Object.keys(o).map((l) => {
        const p = n == null ? void 0 : n[l],
          u = s == null ? void 0 : s[l];
        if (p === null) return null;
        const d = Qn(p) || Qn(u);
        return o[l][d];
      }),
      a =
        n &&
        Object.entries(n).reduce((l, p) => {
          let [u, d] = p;
          return (d === void 0 || (l[u] = d), l);
        }, {}),
      c =
        t == null || (r = t.compoundVariants) === null || r === void 0
          ? void 0
          : r.reduce((l, p) => {
              let { class: u, className: d, ...f } = p;
              return Object.entries(f).every((m) => {
                let [h, g] = m;
                return Array.isArray(g) ? g.includes({ ...s, ...a }[h]) : { ...s, ...a }[h] === g;
              })
                ? [...l, u, d]
                : l;
            }, []);
    return Jn(e, i, c, n == null ? void 0 : n.class, n == null ? void 0 : n.className);
  },
  xu = vu(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
      variants: {
        variant: {
          default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
          destructive:
            'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
          outline:
            'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
          secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          link: 'text-primary underline-offset-4 hover:underline',
        },
        size: {
          default: 'h-9 px-4 py-2',
          sm: 'h-8 rounded-md px-3 text-xs',
          lg: 'h-10 rounded-md px-8',
          icon: 'h-9 w-9',
        },
      },
      defaultVariants: { variant: 'default', size: 'default' },
    },
  ),
  He = b.forwardRef(({ className: e, variant: t, size: n, asChild: r = !1, ...o }, s) => {
    const i = r ? fu : 'button';
    return y.jsx(i, { className: wo(xu({ variant: t, size: n, className: e })), ref: s, ...o });
  });
He.displayName = 'Button';
const Du = '_container_vhrpf_1',
  wu = '_header_vhrpf_7',
  Cu = '_title_vhrpf_16',
  Iu = '_progress_vhrpf_22',
  Su = '_content_vhrpf_27',
  Eu = '_currentQuestion_vhrpf_34',
  Au = '_questionText_vhrpf_42',
  Ru = '_buckets_vhrpf_49',
  Nu = '_bucketRow_vhrpf_56',
  Pu = '_bucketInfo_vhrpf_66',
  _u = '_bucketName_vhrpf_73',
  Ou = '_percentage_vhrpf_79',
  Bu = '_actions_vhrpf_85',
  Tu = '_error_vhrpf_99',
  q = {
    container: Du,
    header: wu,
    title: Cu,
    progress: Iu,
    content: Su,
    currentQuestion: Eu,
    questionText: Au,
    buckets: Ru,
    bucketRow: Nu,
    bucketInfo: Pu,
    bucketName: _u,
    percentage: Ou,
    actions: Bu,
    error: Tu,
  };
function ku({
  gameState: e,
  onRevealBucket: t,
  onShowX: n,
  onNextQuestion: r,
  onRestartPlaying: o,
  onRestartCategorizing: s,
  onRestartEverything: i,
}) {
  const [a, c] = b.useState(null),
    [l, p] = b.useState(!1),
    [u, d] = b.useState(!1),
    [f, m] = b.useState(null),
    h = e.questions[e.current_question_index],
    g = e.current_question_index === e.questions.length - 1;
  if (!h)
    return y.jsx('div', {
      className: q.root,
      children: y.jsx('div', { className: q.error, children: 'No questions found in game state.' }),
    });
  const w = async (S) => {
      const O = `${e.current_question_index}-${S}`;
      c(O);
      try {
        await t(e.current_question_index, S);
      } finally {
        c(null);
      }
    },
    D = async () => {
      p(!0);
      try {
        await n();
      } finally {
        setTimeout(() => p(!1), 5e3);
      }
    },
    C = async () => {
      d(!0);
      try {
        await r();
      } finally {
        d(!1);
      }
    },
    v = async (S) => {
      if (confirm(I(S))) {
        m(S);
        try {
          S === 'playing' ? await o() : S === 'categorizing' ? await s() : await i();
        } finally {
          m(null);
        }
      }
    },
    I = (S) => {
      switch (S) {
        case 'playing':
          return 'Restart to question 1 and hide all buckets? (Keeps all categorization)';
        case 'categorizing':
          return 'Reset all bucket assignments and return to categorizing? (Keeps all answers)';
        case 'everything':
          return 'Delete all answers and start over? This cannot be undone!';
      }
    };
  return y.jsxs('div', {
    className: q.container,
    children: [
      y.jsxs('div', {
        className: q.header,
        children: [
          y.jsx('span', { className: q.title, children: 'Playing Controls' }),
          y.jsxs('span', {
            className: q.progress,
            children: ['Question ', e.current_question_index + 1, ' of ', e.questions.length],
          }),
        ],
      }),
      y.jsxs('div', {
        className: q.content,
        children: [
          y.jsx('div', {
            className: q.currentQuestion,
            children: y.jsx('h4', { className: q.questionText, children: h.question_text }),
          }),
          y.jsx('div', {
            className: q.buckets,
            children: h.buckets.map((S, O) => {
              const _ = `${e.current_question_index}-${O}`,
                M = a === _;
              return y.jsxs(
                'div',
                {
                  className: q.bucketRow,
                  children: [
                    y.jsxs('div', {
                      className: q.bucketInfo,
                      children: [
                        y.jsx('span', { className: q.bucketName, children: S.bucket_name }),
                        y.jsxs('span', { className: q.percentage, children: [S.percentage, '%'] }),
                      ],
                    }),
                    y.jsxs(He, {
                      variant: S.revealed ? 'outline' : 'default',
                      size: 'sm',
                      onClick: () => w(O),
                      disabled: S.revealed || M,
                      children: [
                        y.jsx(Bo, { size: 16 }),
                        S.revealed ? 'Revealed' : M ? 'Revealing...' : 'Reveal',
                      ],
                    }),
                  ],
                },
                S.bucket_id,
              );
            }),
          }),
          y.jsxs('div', {
            className: q.actions,
            children: [
              y.jsxs('button', {
                onClick: D,
                disabled: l,
                className: `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${l ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`,
                children: [y.jsx(Co, { size: 16 }), l ? 'Showing X...' : 'Show X'],
              }),
              y.jsx('button', {
                onClick: C,
                disabled: u,
                className: `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${u ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed' : 'bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary))]/90'}`,
                children: g
                  ? 'Close Game'
                  : y.jsxs(y.Fragment, { children: ['Next Question ', y.jsx(Ht, { size: 16 })] }),
              }),
              y.jsxs(Io, {
                children: [
                  y.jsx(So, {
                    asChild: !0,
                    children: y.jsxs('button', {
                      disabled: f !== null,
                      className: `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${f !== null ? 'text-[hsl(var(--muted-foreground))] cursor-not-allowed' : 'text-white hover:text-white hover:bg-[hsl(var(--background))]'}`,
                      children: [y.jsx(Dt, { size: 16 }), 'Reset', y.jsx(Wt, { size: 14 })],
                    }),
                  }),
                  y.jsxs(Eo, {
                    align: 'end',
                    children: [
                      y.jsxs(vt, {
                        onClick: () => v('playing'),
                        disabled: f !== null,
                        children: [
                          y.jsx(Dt, { size: 14 }),
                          y.jsx('span', { className: 'ml-2', children: 'Restart Playing' }),
                        ],
                      }),
                      y.jsxs(vt, {
                        onClick: () => v('categorizing'),
                        disabled: f !== null,
                        children: [
                          y.jsx(Dt, { size: 14 }),
                          y.jsx('span', { className: 'ml-2', children: 'Re-categorize' }),
                        ],
                      }),
                      y.jsx(Ao, {}),
                      y.jsxs(vt, {
                        onClick: () => v('everything'),
                        disabled: f !== null,
                        className: 'text-red-500 focus:text-red-400',
                        children: [
                          y.jsx(tr, { size: 14 }),
                          y.jsx('span', { className: 'ml-2', children: 'Reset Everything' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
const Lu = '_headerRow_1bi72_1',
  Mu = '_title_1bi72_9',
  $u = '_questionContainer_1bi72_15',
  Fu = '_questionHeader_1bi72_22',
  Gu = '_questionContent_1bi72_45',
  ju = '_questionTitle_1bi72_49',
  Wu = '_questionCount_1bi72_56',
  Hu = '_layout_1bi72_63',
  Uu = '_bucketsColumn_1bi72_70',
  Vu = '_answersColumn_1bi72_71',
  zu = '_columnHeader_1bi72_77',
  qu = '_columnHeaderActions_1bi72_89',
  Yu = '_bucketsList_1bi72_95',
  Xu = '_bucket_1bi72_70',
  Qu = '_isDraggingOver_1bi72_109',
  Ju = '_bucketHeader_1bi72_114',
  Ku = '_collapseButton_1bi72_123',
  Zu = '_bucketNameInput_1bi72_137',
  ed = '_bucketCount_1bi72_154',
  td = '_deleteButton_1bi72_160',
  nd = '_spinner_1bi72_176',
  rd = '_bucketDropZone_1bi72_188',
  od = '_bucketDropZoneInner_1bi72_225',
  sd = '_emptyBucket_1bi72_232',
  id = '_answersList_1bi72_242',
  ad = '_answersListInner_1bi72_282',
  cd = '_answer_1bi72_71',
  ld = '_isDragging_1bi72_109',
  ud = '_noBuckets_1bi72_327',
  dd = '_noAnswers_1bi72_328',
  pd = '_empty_1bi72_232',
  R = {
    headerRow: Lu,
    title: Mu,
    questionContainer: $u,
    questionHeader: Fu,
    questionContent: Gu,
    questionTitle: ju,
    questionCount: Wu,
    layout: Hu,
    bucketsColumn: Uu,
    answersColumn: Vu,
    columnHeader: zu,
    columnHeaderActions: qu,
    bucketsList: Yu,
    bucket: Xu,
    isDraggingOver: Qu,
    bucketHeader: Ju,
    collapseButton: Ku,
    bucketNameInput: Zu,
    bucketCount: ed,
    deleteButton: td,
    spinner: nd,
    bucketDropZone: rd,
    bucketDropZoneInner: od,
    emptyBucket: sd,
    answersList: id,
    answersListInner: ad,
    answer: cd,
    isDragging: ld,
    noBuckets: ud,
    noAnswers: dd,
    empty: pd,
  };
function yd({ block: e }) {
  const { code: t } = Kn(),
    [n, r] = b.useReducer(Ro, []),
    {
      addBucket: o,
      renameBucket: s,
      deleteBucket: i,
      assignAnswer: a,
      autoCategorize: c,
    } = Ho(e.id, r),
    l = e.children ?? [],
    [p, u] = b.useState({}),
    d = b.useRef({}),
    [f, m] = b.useState(null),
    [h, g] = b.useState(null),
    [w, D] = b.useState(!1),
    [C, v] = b.useState(null),
    [I, S] = b.useState(new Set()),
    [O, _] = b.useState(new Set()),
    M = e.kind === No.FAMILY_FEUD ? e.payload : void 0,
    B = M == null ? void 0 : M.game_state,
    $ = (B == null ? void 0 : B.phase) === 'playing';
  b.useEffect(() => {
    const E = l.map((L) => {
      const Q = L.responses.all_responses ?? [],
        te = L.payload,
        U = (te == null ? void 0 : te.buckets) ?? [],
        ae = Q.map((X) => {
          var Pe;
          const Ne =
            typeof X.answer == 'string'
              ? X.answer
              : (((Pe = X.answer) == null ? void 0 : Pe.value) ?? JSON.stringify(X.answer));
          return { id: X.id, text: Ne, userId: X.user_id, userName: 'User', questionId: L.id };
        }),
        G = U.map((X) => ({
          id: X.id,
          name: X.name,
          answers: ae.filter((Ne) => {
            var Pe;
            return (Pe = X.answer_ids) == null ? void 0 : Pe.includes(Ne.id);
          }),
          isCollapsed: !1,
        })),
        Re = new Set(G.flatMap((X) => X.answers.map((Ne) => Ne.id))),
        Je = ae.filter((X) => !Re.has(X.id));
      return {
        questionId: L.id,
        questionText: (te == null ? void 0 : te.question) ?? 'Question',
        buckets: G,
        unassignedAnswers: Je,
      };
    });
    r({ type: xt.INIT, payload: E });
    const N = new Set(l.map((L) => L.id)),
      T = new Set(E.flatMap((L) => L.buckets.map((Q) => Q.id)));
    (S(N), _(T));
  }, []);
  const V = b.useCallback(
      async (E) => {
        m(E);
        try {
          const N = n.find((L) => L.questionId === E),
            T = (N == null ? void 0 : N.buckets.length) || 0;
          await o(e.id, E, `Bucket ${T + 1}`);
        } finally {
          m(null);
        }
      },
      [o, e.id, n],
    ),
    se = b.useCallback(
      (E, N, T) => {
        (u((L) => ({ ...L, [N]: T })),
          d.current[N] && clearTimeout(d.current[N]),
          (d.current[N] = setTimeout(async () => {
            await s(e.id, E, N, T);
          }, 500)));
      },
      [e.id, s],
    ),
    Ce = b.useCallback(
      async (E, N) => {
        g(N);
        try {
          await i(e.id, E, N);
        } finally {
          g(null);
        }
      },
      [i, e.id],
    ),
    ee = b.useCallback(
      async (E) => {
        v(E);
        try {
          const N = await c(e.id, E);
          if (!(N != null && N.buckets)) return;
          const T = n.find((G) => G.questionId === E);
          if (!T) return;
          const L = [...T.unassignedAnswers, ...T.buckets.flatMap((G) => G.answers)],
            Q = N.buckets.map((G) => ({
              id: G.id,
              name: G.name,
              answers: L.filter((Re) => {
                var Je;
                return (Je = G.answer_ids) == null ? void 0 : Je.includes(Re.id);
              }),
            })),
            te = new Set(Q.flatMap((G) => G.answers.map((Re) => Re.id))),
            U = L.filter((G) => !te.has(G.id)),
            ae = n.map((G) =>
              G.questionId === E ? { ...G, buckets: Q, unassignedAnswers: U } : G,
            );
          r({ type: xt.INIT, payload: ae });
        } finally {
          v(null);
        }
      },
      [c, e.id, n],
    ),
    qe = b.useCallback(
      async (E, N) => {
        const { source: T, destination: L, draggableId: Q } = E;
        if (!L || (T.droppableId === L.droppableId && T.index === L.index)) return;
        const te = L.droppableId === 'unassigned' ? null : L.droppableId;
        (r({ type: xt.ANSWER_ASSIGNED, payload: { answerId: Q, bucketId: te } }),
          a(e.id, N, Q, te));
      },
      [a, e.id],
    ),
    Ie = b.useCallback((E) => {
      S((N) => {
        const T = new Set(N);
        return (T.has(E) ? T.delete(E) : T.add(E), T);
      });
    }, []),
    pe = b.useCallback((E) => {
      _((N) => {
        const T = new Set(N);
        return (T.has(E) ? T.delete(E) : T.add(E), T);
      });
    }, []),
    Ye = b.useCallback(async () => {
      if (t) {
        D(!0);
        try {
          if (
            !(
              await fetch(`/api/experiences/${t}/blocks/${e.id}/family_feud/start_playing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
            ).ok
          )
            throw new Error('Failed to start playing');
        } catch (E) {
          console.error('Error starting playing:', E);
        } finally {
          D(!1);
        }
      }
    }, [t, e.id]),
    Xe = b.useCallback(
      async (E, N) => {
        if (t)
          try {
            if (
              !(
                await fetch(`/api/experiences/${t}/blocks/${e.id}/family_feud/reveal_bucket`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ question_index: E, bucket_index: N }),
                })
              ).ok
            )
              throw new Error('Failed to reveal bucket');
          } catch (T) {
            console.error('Error revealing bucket:', T);
          }
      },
      [t, e.id],
    ),
    Se = b.useCallback(async () => {
      if (t)
        try {
          if (
            !(
              await fetch(`/api/experiences/${t}/blocks/${e.id}/family_feud/show_x`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
            ).ok
          )
            throw new Error('Failed to show X');
        } catch (E) {
          console.error('Error showing X:', E);
        }
    }, [t, e.id]),
    Ee = b.useCallback(async () => {
      if (t)
        try {
          if (
            !(
              await fetch(`/api/experiences/${t}/blocks/${e.id}/family_feud/next_question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
            ).ok
          )
            throw new Error('Failed to advance question');
        } catch (E) {
          console.error('Error advancing question:', E);
        }
    }, [t, e.id]),
    fe = b.useCallback(async () => {
      if (t)
        try {
          if (
            !(
              await fetch(`/api/experiences/${t}/blocks/${e.id}/family_feud/restart_playing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
            ).ok
          )
            throw new Error('Failed to restart playing');
        } catch (E) {
          console.error('Error restarting playing:', E);
        }
    }, [t, e.id]),
    Qe = b.useCallback(async () => {
      if (t)
        try {
          if (
            !(
              await fetch(`/api/experiences/${t}/blocks/${e.id}/family_feud/restart_categorizing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
            ).ok
          )
            throw new Error('Failed to restart categorizing');
        } catch (E) {
          console.error('Error restarting categorizing:', E);
        }
    }, [t, e.id]),
    Ae = b.useCallback(async () => {
      if (t)
        try {
          if (
            !(
              await fetch(`/api/experiences/${t}/blocks/${e.id}/family_feud/restart_everything`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              })
            ).ok
          )
            throw new Error('Failed to reset everything');
        } catch (E) {
          console.error('Error resetting everything:', E);
        }
    }, [t, e.id]);
  return l.length === 0
    ? y.jsx('div', {
        className: R.root,
        children: y.jsx('div', {
          className: R.empty,
          children: y.jsx('p', { children: 'No questions found for this Family Feud block.' }),
        }),
      })
    : $ && B
      ? y.jsxs('div', {
          className: R.root,
          children: [
            y.jsx('h2', {
              className: R.title,
              children: (M == null ? void 0 : M.title) || 'Family Feud',
            }),
            y.jsx(ku, {
              block: e,
              gameState: B,
              onRevealBucket: Xe,
              onShowX: Se,
              onNextQuestion: Ee,
              onRestartPlaying: fe,
              onRestartCategorizing: Qe,
              onRestartEverything: Ae,
            }),
          ],
        })
      : y.jsxs('div', {
          className: R.root,
          children: [
            y.jsxs('div', {
              className: R.headerRow,
              children: [
                y.jsx('h2', {
                  className: R.title,
                  children: (M == null ? void 0 : M.title) ?? 'Family Feud',
                }),
                y.jsxs(He, {
                  variant: 'default',
                  size: 'lg',
                  onClick: Ye,
                  disabled: w,
                  children: [y.jsx(Lo, { size: 20 }), w ? 'Starting...' : 'Start Playing'],
                }),
              ],
            }),
            n.map((E) => {
              const N = I.has(E.questionId);
              return y.jsxs(
                'div',
                {
                  className: R.questionContainer,
                  children: [
                    y.jsxs('button', {
                      className: R.questionHeader,
                      onClick: () => Ie(E.questionId),
                      'aria-expanded': !N,
                      children: [
                        N ? y.jsx(Ht, { size: 20 }) : y.jsx(Wt, { size: 20 }),
                        y.jsx('h3', { className: R.questionTitle, children: E.questionText }),
                        y.jsxs('span', {
                          className: R.questionCount,
                          children: [
                            '(',
                            E.unassignedAnswers.length,
                            ' unassigned, ',
                            E.buckets.length,
                            ' buckets)',
                          ],
                        }),
                      ],
                    }),
                    !N &&
                      y.jsx('div', {
                        className: R.questionContent,
                        children: y.jsx(Sl, {
                          onDragEnd: (T) => qe(T, E.questionId),
                          children: y.jsxs('div', {
                            className: R.layout,
                            children: [
                              y.jsx(fd, {
                                question: E,
                                addingBucketForQuestion: f,
                                autoCategorizing: C,
                                editingBucketNames: p,
                                deletingBucketId: h,
                                collapsedBuckets: O,
                                onAddBucket: V,
                                onAutoCategorize: ee,
                                onRenameBucket: se,
                                onDeleteBucket: Ce,
                                onToggleBucket: pe,
                              }),
                              y.jsx(bd, { answers: E.unassignedAnswers }),
                            ],
                          }),
                        }),
                      }),
                  ],
                },
                E.questionId,
              );
            }),
          ],
        });
}
const fd = ({
    question: e,
    addingBucketForQuestion: t,
    autoCategorizing: n,
    editingBucketNames: r,
    deletingBucketId: o,
    collapsedBuckets: s,
    onAddBucket: i,
    onAutoCategorize: a,
    onRenameBucket: c,
    onDeleteBucket: l,
    onToggleBucket: p,
  }) => {
    const u = n === e.questionId,
      d = e.unassignedAnswers.length > 0;
    return y.jsxs('div', {
      className: R.bucketsColumn,
      children: [
        y.jsxs('div', {
          className: R.columnHeader,
          children: [
            y.jsx('span', { children: 'Buckets' }),
            y.jsxs('div', {
              className: R.columnHeaderActions,
              children: [
                d &&
                  y.jsxs(He, {
                    variant: 'outline',
                    size: 'sm',
                    onClick: () => a(e.questionId),
                    disabled: u,
                    children: [
                      u ? y.jsx(er, { size: 16, className: R.spinner }) : y.jsx(jo, { size: 16 }),
                      u ? 'Categorizing...' : 'Auto-categorize',
                    ],
                  }),
                y.jsxs(He, {
                  variant: 'outline',
                  size: 'sm',
                  onClick: () => i(e.questionId),
                  disabled: t === e.questionId,
                  children: [
                    y.jsx($o, { size: 16 }),
                    t === e.questionId ? 'Adding...' : 'Add Bucket',
                  ],
                }),
              ],
            }),
          ],
        }),
        y.jsxs('div', {
          className: R.bucketsList,
          children: [
            e.buckets.map((f) =>
              y.jsx(
                gd,
                {
                  questionId: e.questionId,
                  bucket: f,
                  isCollapsed: s.has(f.id),
                  editingBucketNames: r,
                  deletingBucketId: o,
                  onRenameBucket: c,
                  onDeleteBucket: l,
                  onToggleBucket: () => p(f.id),
                },
                f.id,
              ),
            ),
            e.buckets.length === 0 &&
              y.jsx('div', {
                className: R.noBuckets,
                children: y.jsx('p', { children: 'Click "Add Bucket" to get started.' }),
              }),
          ],
        }),
      ],
    });
  },
  gd = ({
    questionId: e,
    bucket: t,
    isCollapsed: n,
    editingBucketNames: r,
    deletingBucketId: o,
    onRenameBucket: s,
    onDeleteBucket: i,
    onToggleBucket: a,
  }) => {
    const c = (l, p, u) => {
      const d = t.answers[u.source.index];
      return y.jsx('div', {
        ref: l.innerRef,
        ...l.draggableProps,
        ...l.dragHandleProps,
        className: `${R.answer} ${p.isDragging ? R.isDragging : ''}`,
        children: d.text,
      });
    };
    return y.jsx(mo, {
      droppableId: t.id,
      renderClone: c,
      children: (l, p) =>
        y.jsxs('div', {
          ref: l.innerRef,
          ...l.droppableProps,
          className: `${R.bucket} ${p.isDraggingOver ? R.isDraggingOver : ''}`,
          children: [
            y.jsxs('div', {
              className: R.bucketHeader,
              children: [
                y.jsx('button', {
                  className: R.collapseButton,
                  onClick: a,
                  children: n ? y.jsx(Ht, { size: 16 }) : y.jsx(Wt, { size: 16 }),
                }),
                y.jsx('input', {
                  type: 'text',
                  value: r[t.id] ?? t.name,
                  onChange: (u) => s(e, t.id, u.target.value),
                  className: R.bucketNameInput,
                }),
                y.jsxs('span', {
                  className: R.bucketCount,
                  children: ['(', t.answers.length, ')'],
                }),
                y.jsx('button', {
                  className: R.deleteButton,
                  onClick: () => i(e, t.id),
                  disabled: o === t.id,
                  children:
                    o === t.id
                      ? y.jsx(er, { size: 14, className: R.spinner })
                      : y.jsx(tr, { size: 14 }),
                }),
              ],
            }),
            !n && y.jsx(md, { bucket: t, snapshot: p }),
            l.placeholder,
          ],
        }),
    });
  },
  md = ({ bucket: e, snapshot: t }) => {
    const n = b.useRef(null);
    return (
      nr(n),
      y.jsx('div', {
        ref: n,
        className: `${R.bucketDropZone} ${t.isDraggingOver ? R.isDraggingOver : ''}`,
        children: y.jsx('div', {
          className: R.bucketDropZoneInner,
          children:
            e.answers.length === 0
              ? y.jsx('div', { className: R.emptyBucket, children: 'Drop answers here' })
              : e.answers.map((r, o) =>
                  y.jsx(
                    lo,
                    {
                      draggableId: r.id,
                      index: o,
                      children: (s, i) =>
                        y.jsx('div', {
                          ref: s.innerRef,
                          ...s.draggableProps,
                          ...s.dragHandleProps,
                          className: `${R.answer} ${i.isDragging ? R.isDragging : ''}`,
                          children: r.text,
                        }),
                    },
                    r.id,
                  ),
                ),
        }),
      })
    );
  },
  bd = ({ answers: e }) => {
    const t = b.useRef(null);
    nr(t);
    const n = (r, o, s) => {
      const i = e[s.source.index];
      return y.jsx('div', {
        ref: r.innerRef,
        ...r.draggableProps,
        ...r.dragHandleProps,
        className: `${R.answer} ${o.isDragging ? R.isDragging : ''}`,
        children: i.text,
      });
    };
    return y.jsxs('div', {
      className: R.answersColumn,
      children: [
        y.jsx('div', {
          className: R.columnHeader,
          children: y.jsxs('span', { children: ['Answers (', e.length, ')'] }),
        }),
        y.jsx(mo, {
          droppableId: 'unassigned',
          renderClone: n,
          children: (r, o) =>
            y.jsx('div', {
              ref: t,
              ...r.droppableProps,
              className: `${R.answersList} ${o.isDraggingOver ? R.isDraggingOver : ''}`,
              children: y.jsxs('div', {
                ref: r.innerRef,
                className: R.answersListInner,
                children: [
                  e.length === 0
                    ? y.jsx('div', {
                        className: R.noAnswers,
                        children: y.jsx('p', {
                          children: 'All answers have been assigned to buckets.',
                        }),
                      })
                    : e.map((s, i) =>
                        y.jsx(
                          lo,
                          {
                            draggableId: s.id,
                            index: i,
                            children: (a, c) =>
                              y.jsx('div', {
                                ref: a.innerRef,
                                ...a.draggableProps,
                                ...a.dragHandleProps,
                                className: `${R.answer} ${c.isDragging ? R.isDragging : ''}`,
                                children: s.text,
                              }),
                          },
                          s.id,
                        ),
                      ),
                  r.placeholder,
                ],
              }),
            }),
        }),
      ],
    });
  };
export { Ht as C, yd as F, $o as P, tr as T, Lo as a, Wt as b };
