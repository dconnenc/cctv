import { F as z } from './FamilyFeudManager-DvZpiiu3.js';
import { j as e, B as g, u as h, r as p, a as x, b as y } from './application-BWXX6fgN.js';
import { D as f, a as j } from './dialog-C-y_qkUB.js';

import { F as z } from './FamilyFeudManager-DvZpiiu3.js';
function N() {
  const { code: t, experienceFetch: r } = h(),
    [d, s] = p.useState(!1),
    [l, i] = p.useState(null);
  return {
    clearBuzzerResponses: p.useCallback(
      async (u) => {
        if (!t || !u) return null;
        (s(!0), i(null));
        try {
          const n = await (
            await r(
              `/api/experiences/${encodeURIComponent(t)}/blocks/${encodeURIComponent(u)}/clear_buzzer_responses`,
              { method: 'DELETE' },
            )
          ).json();
          if (!(n != null && n.success)) {
            const _ = (n == null ? void 0 : n.error) || 'Failed to clear buzzer responses';
            return (i(_), { success: !1, error: _ });
          }
          return { success: !0 };
        } catch (c) {
          const n =
            c instanceof Error && c.message === 'Authentication expired'
              ? 'Authentication expired'
              : 'Connection error. Please try again.';
          return (i(n), { success: !1, error: n });
        } finally {
          s(!1);
        }
      },
      [t, r],
    ),
    isLoading: d,
    error: l,
  };
}
const b = '_root_1iy21_1',
  k = '_title_1iy21_8',
  B = '_summary_1iy21_13',
  v = '_count_1iy21_19',
  L = '_countLabel_1iy21_25',
  E = '_list_1iy21_30',
  R = '_listItem_1iy21_39',
  D = '_position_1iy21_47',
  I = '_name_1iy21_59',
  F = '_time_1iy21_64',
  w = '_empty_1iy21_70',
  o = {
    root: b,
    title: k,
    summary: B,
    count: v,
    countLabel: L,
    list: E,
    listItem: R,
    position: D,
    name: I,
    time: F,
    empty: w,
  };
function C({ block: t, participants: r }) {
  var u;
  const { clearBuzzerResponses: d, isLoading: s } = N(),
    l = ((u = t.responses) == null ? void 0 : u.all_responses) ?? [],
    i = r,
    m = (c) => {
      var n;
      return ((n = i.find((_) => _.user_id === c)) == null ? void 0 : n.name) ?? 'Unknown';
    };
  return e.jsxs('div', {
    className: o.root,
    children: [
      e.jsx(f, { className: o.title, children: 'Buzzer' }),
      e.jsx(j, { className: 'sr-only', children: 'Manage buzzer responses' }),
      e.jsxs('div', {
        className: o.summary,
        children: [
          e.jsx('span', { className: o.count, children: l.length }),
          e.jsx('span', { className: o.countLabel, children: l.length === 1 ? 'buzz' : 'buzzes' }),
        ],
      }),
      l.length > 0
        ? e.jsx('ol', {
            className: o.list,
            children: l.map((c, n) =>
              e.jsxs(
                'li',
                {
                  className: o.listItem,
                  children: [
                    e.jsx('span', { className: o.position, children: n + 1 }),
                    e.jsx('span', { className: o.name, children: m(c.user_id) }),
                    e.jsx('span', {
                      className: o.time,
                      children: new Date(c.answer.buzzed_at).toLocaleTimeString(),
                    }),
                  ],
                },
                c.id,
              ),
            ),
          })
        : e.jsx('p', { className: o.empty, children: 'No one has buzzed in yet.' }),
      e.jsx(g, {
        onClick: () => d(t.id),
        loading: s,
        loadingText: 'Resetting…',
        disabled: l.length === 0,
        children: 'Reset Buzzers',
      }),
    ],
  });
}
const U = '_root_1gjtg_1',
  P = '_title_1gjtg_7',
  T = '_content_1gjtg_14',
  $ = '_field_1gjtg_21',
  M = '_label_1gjtg_27',
  A = '_value_1gjtg_33',
  a = { root: U, title: P, content: T, field: $, label: M, value: A };
function S({ blockId: t }) {
  var l;
  const { experience: r, isLoading: d } = h();
  if (d)
    return e.jsx('div', {
      className: 'flex-centered',
      children: e.jsx('p', { children: 'Loading block...' }),
    });
  if (!r)
    return e.jsx('div', {
      className: 'flex-centered',
      children: e.jsx('p', { children: 'Experience not found' }),
    });
  let s = r.blocks.find((i) => i.id === t);
  if (!s) {
    for (const i of r.blocks)
      if ((l = i.children) != null && l.length && ((s = i.children.find((m) => m.id === t)), s))
        break;
  }
  if (!s)
    return e.jsxs('div', {
      className: 'flex-centered',
      children: [
        e.jsx('h1', { children: 'Block not found' }),
        e.jsx('p', { children: "The block you're looking for doesn't exist." }),
      ],
    });
  if (s.kind === x.FAMILY_FEUD) return e.jsx(z, { block: s });
  if (s.kind === x.BUZZER) {
    const i = [...(r.hosts || []), ...(r.participants || [])];
    return e.jsx(C, { block: s, participants: i });
  }
  return e.jsxs('div', {
    className: a.root,
    children: [
      e.jsx(f, { className: a.title, children: 'Block Details' }),
      e.jsx(j, { className: 'sr-only', children: 'View block information' }),
      e.jsx('div', {
        className: a.content,
        children: e.jsxs('div', {
          className: a.field,
          children: [
            e.jsx('span', { className: a.label, children: 'Kind:' }),
            e.jsx('span', { className: a.value, children: s.kind }),
          ],
        }),
      }),
    ],
  });
}
function Y() {
  const { blockId: t } = y();
  return t
    ? e.jsx('div', { className: a.root, children: e.jsx(S, { blockId: t }) })
    : e.jsx('div', {
        className: 'flex-centered',
        children: e.jsx('p', { children: 'Block ID not found' }),
      });
}
export { Y as BlockPage, S as default };
