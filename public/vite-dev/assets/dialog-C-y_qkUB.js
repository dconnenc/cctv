import {
  y as J,
  I as N,
  L as Q,
  z as R,
  G as U,
  J as X,
  K as Y,
  m as Z,
  M as ee,
  C as h,
  j as i,
  H as m,
  X as ne,
  O as oe,
  x as q,
  r as s,
  N as te,
  A as x,
  o as y,
} from './application-BWXX6fgN.js';

function ae(e) {
  const t = re(e),
    o = s.forwardRef((a, n) => {
      const { children: r, ...l } = a,
        c = s.Children.toArray(r),
        d = c.find(ie);
      if (d) {
        const u = d.props.children,
          p = c.map((D) =>
            D === d
              ? s.Children.count(u) > 1
                ? s.Children.only(null)
                : s.isValidElement(u)
                  ? u.props.children
                  : null
              : D,
          );
        return i.jsx(t, {
          ...l,
          ref: n,
          children: s.isValidElement(u) ? s.cloneElement(u, void 0, p) : null,
        });
      }
      return i.jsx(t, { ...l, ref: n, children: r });
    });
  return ((o.displayName = `${e}.Slot`), o);
}
function re(e) {
  const t = s.forwardRef((o, a) => {
    const { children: n, ...r } = o;
    if (s.isValidElement(n)) {
      const l = ce(n),
        c = le(r, n.props);
      return (n.type !== s.Fragment && (c.ref = a ? Z(a, l) : l), s.cloneElement(n, c));
    }
    return s.Children.count(n) > 1 ? s.Children.only(null) : null;
  });
  return ((t.displayName = `${e}.SlotClone`), t);
}
var se = Symbol('radix.slottable');
function ie(e) {
  return (
    s.isValidElement(e) &&
    typeof e.type == 'function' &&
    '__radixId' in e.type &&
    e.type.__radixId === se
  );
}
function le(e, t) {
  const o = { ...t };
  for (const a in t) {
    const n = e[a],
      r = t[a];
    /^on[A-Z]/.test(a)
      ? n && r
        ? (o[a] = (...c) => {
            const d = r(...c);
            return (n(...c), d);
          })
        : n && (o[a] = n)
      : a === 'style'
        ? (o[a] = { ...n, ...r })
        : a === 'className' && (o[a] = [n, r].filter(Boolean).join(' '));
  }
  return { ...e, ...o };
}
function ce(e) {
  var a, n;
  let t = (a = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null ? void 0 : a.get,
    o = t && 'isReactWarning' in t && t.isReactWarning;
  return o
    ? e.ref
    : ((t = (n = Object.getOwnPropertyDescriptor(e, 'ref')) == null ? void 0 : n.get),
      (o = t && 'isReactWarning' in t && t.isReactWarning),
      o ? e.props.ref : e.props.ref || e.ref);
}
var C = 'Dialog',
  [j] = J(C),
  [de, f] = j(C),
  O = (e) => {
    const {
        __scopeDialog: t,
        children: o,
        open: a,
        defaultOpen: n,
        onOpenChange: r,
        modal: l = !0,
      } = e,
      c = s.useRef(null),
      d = s.useRef(null),
      [u, p] = q({ prop: a, defaultProp: n ?? !1, onChange: r, caller: C });
    return i.jsx(de, {
      scope: t,
      triggerRef: c,
      contentRef: d,
      contentId: R(),
      titleId: R(),
      descriptionId: R(),
      open: u,
      onOpenChange: p,
      onOpenToggle: s.useCallback(() => p((D) => !D), [p]),
      modal: l,
      children: o,
    });
  };
O.displayName = C;
var P = 'DialogTrigger',
  ue = s.forwardRef((e, t) => {
    const { __scopeDialog: o, ...a } = e,
      n = f(P, o),
      r = N(t, n.triggerRef);
    return i.jsx(x.button, {
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': n.open,
      'aria-controls': n.contentId,
      'data-state': b(n.open),
      ...a,
      ref: r,
      onClick: m(e.onClick, n.onOpenToggle),
    });
  });
ue.displayName = P;
var E = 'DialogPortal',
  [fe, I] = j(E, { forceMount: void 0 }),
  A = (e) => {
    const { __scopeDialog: t, forceMount: o, children: a, container: n } = e,
      r = f(E, t);
    return i.jsx(fe, {
      scope: t,
      forceMount: o,
      children: s.Children.map(a, (l) =>
        i.jsx(h, {
          present: o || r.open,
          children: i.jsx(U, { asChild: !0, container: n, children: l }),
        }),
      ),
    });
  };
A.displayName = E;
var v = 'DialogOverlay',
  w = s.forwardRef((e, t) => {
    const o = I(v, e.__scopeDialog),
      { forceMount: a = o.forceMount, ...n } = e,
      r = f(v, e.__scopeDialog);
    return r.modal
      ? i.jsx(h, { present: a || r.open, children: i.jsx(pe, { ...n, ref: t }) })
      : null;
  });
w.displayName = v;
var ge = ae('DialogOverlay.RemoveScroll'),
  pe = s.forwardRef((e, t) => {
    const { __scopeDialog: o, ...a } = e,
      n = f(v, o);
    return i.jsx(Y, {
      as: ge,
      allowPinchZoom: !0,
      shards: [n.contentRef],
      children: i.jsx(x.div, {
        'data-state': b(n.open),
        ...a,
        ref: t,
        style: { pointerEvents: 'auto', ...a.style },
      }),
    });
  }),
  g = 'DialogContent',
  T = s.forwardRef((e, t) => {
    const o = I(g, e.__scopeDialog),
      { forceMount: a = o.forceMount, ...n } = e,
      r = f(g, e.__scopeDialog);
    return i.jsx(h, {
      present: a || r.open,
      children: r.modal ? i.jsx(me, { ...n, ref: t }) : i.jsx(xe, { ...n, ref: t }),
    });
  });
T.displayName = g;
var me = s.forwardRef((e, t) => {
    const o = f(g, e.__scopeDialog),
      a = s.useRef(null),
      n = N(t, o.contentRef, a);
    return (
      s.useEffect(() => {
        const r = a.current;
        if (r) return X(r);
      }, []),
      i.jsx(S, {
        ...e,
        ref: n,
        trapFocus: o.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: m(e.onCloseAutoFocus, (r) => {
          var l;
          (r.preventDefault(), (l = o.triggerRef.current) == null || l.focus());
        }),
        onPointerDownOutside: m(e.onPointerDownOutside, (r) => {
          const l = r.detail.originalEvent,
            c = l.button === 0 && l.ctrlKey === !0;
          (l.button === 2 || c) && r.preventDefault();
        }),
        onFocusOutside: m(e.onFocusOutside, (r) => r.preventDefault()),
      })
    );
  }),
  xe = s.forwardRef((e, t) => {
    const o = f(g, e.__scopeDialog),
      a = s.useRef(!1),
      n = s.useRef(!1);
    return i.jsx(S, {
      ...e,
      ref: t,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      onCloseAutoFocus: (r) => {
        var l, c;
        ((l = e.onCloseAutoFocus) == null || l.call(e, r),
          r.defaultPrevented ||
            (a.current || (c = o.triggerRef.current) == null || c.focus(), r.preventDefault()),
          (a.current = !1),
          (n.current = !1));
      },
      onInteractOutside: (r) => {
        var d, u;
        ((d = e.onInteractOutside) == null || d.call(e, r),
          r.defaultPrevented ||
            ((a.current = !0), r.detail.originalEvent.type === 'pointerdown' && (n.current = !0)));
        const l = r.target;
        (((u = o.triggerRef.current) == null ? void 0 : u.contains(l)) && r.preventDefault(),
          r.detail.originalEvent.type === 'focusin' && n.current && r.preventDefault());
      },
    });
  }),
  S = s.forwardRef((e, t) => {
    const { __scopeDialog: o, trapFocus: a, onOpenAutoFocus: n, onCloseAutoFocus: r, ...l } = e,
      c = f(g, o),
      d = s.useRef(null),
      u = N(t, d);
    return (
      Q(),
      i.jsxs(i.Fragment, {
        children: [
          i.jsx(ee, {
            asChild: !0,
            loop: !0,
            trapped: a,
            onMountAutoFocus: n,
            onUnmountAutoFocus: r,
            children: i.jsx(te, {
              role: 'dialog',
              id: c.contentId,
              'aria-describedby': c.descriptionId,
              'aria-labelledby': c.titleId,
              'data-state': b(c.open),
              ...l,
              ref: u,
              onDismiss: () => c.onOpenChange(!1),
            }),
          }),
          i.jsxs(i.Fragment, {
            children: [
              i.jsx(De, { titleId: c.titleId }),
              i.jsx(ye, { contentRef: d, descriptionId: c.descriptionId }),
            ],
          }),
        ],
      })
    );
  }),
  _ = 'DialogTitle',
  M = s.forwardRef((e, t) => {
    const { __scopeDialog: o, ...a } = e,
      n = f(_, o);
    return i.jsx(x.h2, { id: n.titleId, ...a, ref: t });
  });
M.displayName = _;
var F = 'DialogDescription',
  W = s.forwardRef((e, t) => {
    const { __scopeDialog: o, ...a } = e,
      n = f(F, o);
    return i.jsx(x.p, { id: n.descriptionId, ...a, ref: t });
  });
W.displayName = F;
var $ = 'DialogClose',
  k = s.forwardRef((e, t) => {
    const { __scopeDialog: o, ...a } = e,
      n = f($, o);
    return i.jsx(x.button, {
      type: 'button',
      ...a,
      ref: t,
      onClick: m(e.onClick, () => n.onOpenChange(!1)),
    });
  });
k.displayName = $;
function b(e) {
  return e ? 'open' : 'closed';
}
var L = 'DialogTitleWarning',
  [Oe, G] = oe(L, { contentName: g, titleName: _, docsSlug: 'dialog' }),
  De = ({ titleId: e }) => {
    const t = G(L),
      o = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
    return (
      s.useEffect(() => {
        e && (document.getElementById(e) || console.error(o));
      }, [o, e]),
      null
    );
  },
  ve = 'DialogDescriptionWarning',
  ye = ({ contentRef: e, descriptionId: t }) => {
    const a = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${G(ve).contentName}}.`;
    return (
      s.useEffect(() => {
        var r;
        const n = (r = e.current) == null ? void 0 : r.getAttribute('aria-describedby');
        t && n && (document.getElementById(t) || console.warn(a));
      }, [a, e, t]),
      null
    );
  },
  Ce = O,
  Re = A,
  V = w,
  z = T,
  B = M,
  H = W,
  he = k;
const Pe = Ce,
  Ne = Re,
  K = s.forwardRef(({ className: e, ...t }, o) =>
    i.jsx(V, {
      ref: o,
      className: y(
        'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        e,
      ),
      ...t,
    }),
  );
K.displayName = V.displayName;
const Ee = s.forwardRef(({ className: e, children: t, ...o }, a) =>
  i.jsxs(Ne, {
    children: [
      i.jsx(K, {}),
      i.jsxs(z, {
        ref: a,
        className: y(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
          e,
        ),
        ...o,
        children: [
          t,
          i.jsxs(he, {
            className:
              'absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
            children: [
              i.jsx(ne, { className: 'h-4 w-4' }),
              i.jsx('span', { className: 'sr-only', children: 'Close' }),
            ],
          }),
        ],
      }),
    ],
  }),
);
Ee.displayName = z.displayName;
const _e = s.forwardRef(({ className: e, ...t }, o) =>
  i.jsx(B, { ref: o, className: y('text-lg font-semibold leading-none tracking-tight', e), ...t }),
);
_e.displayName = B.displayName;
const be = s.forwardRef(({ className: e, ...t }, o) =>
  i.jsx(H, { ref: o, className: y('text-sm text-muted-foreground', e), ...t }),
);
be.displayName = H.displayName;
export { _e as D, be as a, Pe as b, Ee as c };
