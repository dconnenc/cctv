import {
  X as J,
  g as N,
  q as R,
  B as T,
  h as X,
  e as Z,
  j as a,
  r as h,
  a as s,
  u as z,
} from './application-BWXX6fgN.js';
import { D as ee, a as te } from './dialog-C-y_qkUB.js';

const ae = '_root_ipfid_1',
  se = '_input_ipfid_13',
  $ = { root: ae, input: se };
function A({ label: e, options: t, onChange: r, ...i }) {
  return a.jsxs('label', {
    className: $.root,
    children: [
      e,
      ':',
      a.jsx('select', {
        className: $.input,
        onChange: (o) => r(o.target.value),
        ...i,
        children: t.map((o) => a.jsx('option', { value: o.value, children: o.label }, o.value)),
      }),
    ],
  });
}
function ne() {
  const { code: e } = z(),
    { adminFetch: t } = Z(),
    [r, i] = h.useState(!1),
    [o, n] = h.useState(null);
  return {
    createExperienceBlock: h.useCallback(
      async ({
        kind: c,
        payload: m,
        visible_to_roles: b = [],
        visible_to_segments: k = [],
        target_user_ids: q = [],
        status: u = 'hidden',
        open_immediately: _ = !1,
        variables: p,
        questions: d,
      }) => {
        if (!e) return (n('Missing experience code'), null);
        if (!(c != null && c.trim())) return (n('Please enter a block kind'), null);
        (i(!0),
          n(null),
          R(
            `Creating experience block for ${e} with kind=${c}, open_immediately=${_}, status=${u}`,
          ));
        const v = {
          kind: c,
          payload: m,
          visible_to_roles: b,
          visible_to_segments: k,
          target_user_ids: q,
          status: u,
          open_immediately: _,
          ...(p && { variables: p }),
          ...(d && d.length > 0 && { questions: d }),
        };
        try {
          const y = await (
            await t(`/api/experiences/${encodeURIComponent(e)}/blocks`, {
              method: 'POST',
              body: JSON.stringify({ block: v }),
            })
          ).json();
          if (!(y != null && y.success)) {
            const g = (y == null ? void 0 : y.error) || 'Block create failed';
            return (n(g), { type: 'error', success: !1, error: g, message: g });
          }
          return (R('Successfully created block'), y);
        } catch (P) {
          const y =
            (P == null ? void 0 : P.message) === 'Authentication expired'
              ? 'Authentication expired'
              : 'Connection error. Please try again.';
          return (n(y), null);
        } finally {
          i(!1);
        }
      },
      [e, t],
    ),
    isLoading: r,
    error: o,
    setError: n,
  };
}
function Mt() {
  const { code: e } = z(),
    { adminFetch: t } = Z(),
    [r, i] = h.useState(!1),
    [o, n] = h.useState(null);
  return {
    change: h.useCallback(
      async (c, m) => {
        if (!e) return (n('Missing experience code'), null);
        (i(!0), n(null));
        const b = `/api/experiences/${encodeURIComponent(e)}/blocks/${encodeURIComponent(c.id)}/`;
        try {
          let k = '';
          const q = 'POST';
          let u;
          m === 'open'
            ? (k = `${b}open`)
            : m === 'closed'
              ? (k = `${b}close`)
              : m === 'hidden' && (k = `${b}hide`);
          const _ = await t(k, { method: q, body: u }),
            p = await _.json();
          if (!_.ok || (p == null ? void 0 : p.success) === !1) {
            const d = (p == null ? void 0 : p.error) || `Failed to set status to ${m}`;
            return (n(d), { success: !1, error: d });
          }
          return { success: !0 };
        } catch (k) {
          const q =
            k instanceof Error && k.message === 'Authentication expired'
              ? 'Authentication expired'
              : 'Connection error. Please try again.';
          return (n(q), { success: !1, error: q });
        } finally {
          i(!1);
        }
      },
      [e, t],
    ),
    isLoading: r,
    error: o,
    setError: n,
  };
}
const ie = '_root_jgo4a_1',
  re = '_title_jgo4a_9',
  oe = '_container_jgo4a_15',
  le = '_sectionTitle_jgo4a_25',
  ce = '_columns_jgo4a_33',
  ue = '_column_jgo4a_33',
  de = '_actions_jgo4a_49',
  pe = '_additionalDetails_jgo4a_79',
  me = '_error_jgo4a_86',
  f = {
    root: ie,
    title: re,
    container: oe,
    sectionTitle: le,
    columns: ce,
    column: ue,
    actions: de,
    additionalDetails: pe,
    error: me,
  },
  be = '_helpText_130fl_1',
  _e = { helpText: be },
  ve = () => ({ message: '' }),
  xe = (e) => (e.message.trim() ? null : 'Announcement message is required'),
  fe = (e) => ({ type: s.ANNOUNCEMENT, message: e.message.trim() }),
  ye = (e, t) => !0,
  he = (e, t, r) => e;
function ke({ data: e, onChange: t }) {
  const r = (i) => {
    t == null || t(i);
  };
  return a.jsxs('div', {
    className: f.container,
    children: [
      a.jsx(N, {
        label: 'Announcement Message',
        placeholder: 'Dearest {{ participant_name }}, this is your announcement.',
        required: !0,
        value: e.message,
        onChange: (i) => r({ message: i.target.value }),
      }),
      a.jsx('span', {
        className: _e.helpText,
        children: "Include the participant's name with {{ participant_name }}",
      }),
    ],
  });
}
const Pe = () => ({ label: '' }),
  Te = (e) => null,
  je = (e) => ({ type: s.BUZZER, label: e.label.trim() || void 0 }),
  Ne = (e, t) => !0,
  qe = (e, t, r) => e;
function Ie({ data: e, onChange: t }) {
  return a.jsx('div', {
    className: f.container,
    children: a.jsx(N, {
      label: 'Button Label (optional)',
      placeholder: 'Buzz In',
      value: e.label,
      onChange: (r) => (t == null ? void 0 : t({ label: r.target.value })),
    }),
  });
}
const Ee = '_titleInput_1bg0c_1',
  Oe = '_questionItem_1bg0c_5',
  ge = '_questionNumber_1bg0c_13',
  we = '_questionField_1bg0c_27',
  Le = '_removeButton_1bg0c_34',
  D = { titleInput: Ee, questionItem: Oe, questionNumber: ge, questionField: we, removeButton: Le },
  Ue = () => ({ title: '', questions: [] }),
  Ae = (e) =>
    e.title.trim()
      ? e.questions.filter((r) => r.question.trim()).length === 0
        ? 'Family Feud must have at least one question'
        : null
      : 'Family Feud must have a title',
  Fe = () => !0,
  De = (e) => ({ ...e, questions: e.questions.filter((t) => t.question.trim()) }),
  Me = (e) => ({ type: 'family_feud', title: e.title.trim() }),
  Se = (e) =>
    e.questions
      .filter((t) => t.question.trim())
      .map((t, r) => ({
        payload: { question: t.question.trim(), formKey: `answer_${r}`, inputType: 'text' },
      }));
function Be({ data: e, onChange: t }) {
  const r = () => {
      const n = { id: Date.now().toString(), question: '' };
      t == null || t({ questions: [...e.questions, n] });
    },
    i = (n, l) => {
      const c = [...e.questions];
      ((c[n] = { ...c[n], question: l }), t == null || t({ questions: c }));
    },
    o = (n) => {
      const l = e.questions.filter((c, m) => m !== n);
      t == null || t({ questions: l });
    };
  return a.jsxs('div', {
    className: f.container,
    children: [
      a.jsx('div', {
        className: D.titleInput,
        children: a.jsx(N, {
          label: 'Title',
          placeholder: 'Enter the Family Feud game title',
          value: e.title,
          onChange: (n) => (t == null ? void 0 : t({ title: n.target.value })),
          required: !0,
        }),
      }),
      a.jsx('div', { className: f.sectionTitle, children: 'Questions' }),
      e.questions.map((n, l) =>
        a.jsxs(
          'div',
          {
            className: D.questionItem,
            children: [
              a.jsx('div', { className: D.questionNumber, children: l + 1 }),
              a.jsx('div', {
                className: D.questionField,
                children: a.jsx(N, {
                  placeholder: 'Enter question',
                  value: n.question,
                  onChange: (c) => i(l, c.target.value),
                  required: !0,
                }),
              }),
              a.jsx(T, {
                type: 'button',
                onClick: () => o(l),
                className: D.removeButton,
                children: a.jsx(J, { size: 16 }),
              }),
            ],
          },
          n.id,
        ),
      ),
      a.jsx(T, { type: 'button', onClick: r, children: 'Add Question' }),
    ],
  });
}
const Qe = '_preview_1wbfe_1',
  Ce = '_part_1wbfe_12',
  Re = '_textPart_1wbfe_16',
  $e = '_variablePart_1wbfe_20',
  Ve = '_buttonGroup_1wbfe_28',
  ze = '_partItem_1wbfe_35',
  Ze = '_partNumber_1wbfe_45',
  Ke = '_textPartEditor_1wbfe_57',
  He = '_variablePartEditor_1wbfe_61',
  Ye = '_variableInfo_1wbfe_68',
  We = '_variableFields_1wbfe_74',
  Ge = '_partActions_1wbfe_84',
  E = {
    preview: Qe,
    part: Ce,
    textPart: Re,
    variablePart: $e,
    buttonGroup: Ve,
    partItem: ze,
    partNumber: Ze,
    textPartEditor: Ke,
    variablePartEditor: He,
    variableInfo: Ye,
    variableFields: We,
    partActions: Ge,
  },
  Je = () => ({ parts: [], variables: [] }),
  Xe = (e) => {
    const t = e.parts.filter((o) => o.content.trim());
    if (t.length === 0) return 'Mad lib must have at least one part';
    const r = e.variables.filter((o) => o.name.trim() && o.question.trim()),
      i = t.filter((o) => o.type === 'variable');
    if (i.length > 0 && r.length === 0)
      return 'Variables must have both name and question configured';
    for (const o of i) {
      const n = e.variables.find((l) => l.id === o.content);
      if (!(n != null && n.assigned_user_id)) return 'Each variable must have an assigned user';
    }
    return null;
  };
function et({ data: e, onChange: t }) {
  const { participants: r } = S(),
    i = { parts: e.parts, variables: e.variables || [] },
    o = (u) => {
      t == null || t({ ...i, ...u });
    },
    n = (u, _) => {
      const p = [...i.parts];
      ((p[u] = { ...p[u], content: _ }), o({ parts: p }));
    },
    l = () => {
      const u = Date.now().toString(),
        _ = [...i.parts, { id: u, type: 'text', content: ' ' }];
      o({ parts: _ });
    },
    c = () => {
      const u = Date.now().toString(),
        _ = (Date.now() + 1).toString(),
        p = {
          id: u,
          name: 'variable',
          question: 'Enter a word',
          dataType: 'text',
          assigned_user_id: void 0,
        },
        d = { id: _, type: 'variable', content: u },
        v = { variables: [...i.variables, p], parts: [...i.parts, d] };
      o(v);
    },
    m = (u) => {
      const _ = i.parts[u];
      let p = i.parts.filter((P, y) => y !== u),
        d = i.variables;
      _.type === 'variable' && (d = i.variables.filter((P) => P.id !== _.content));
      const v = [];
      for (let P = 0; P < p.length; P++) {
        const y = p[P];
        if (y.type === 'text') {
          let g = y.content,
            O = P + 1;
          for (; O < p.length && p[O].type === 'text'; ) {
            const B = g.endsWith(' '),
              Q = p[O].content.startsWith(' ');
            (!B && !Q && (g += ' '), (g += p[O].content), O++);
          }
          (v.push({ ...y, content: g }), (P = O - 1));
        } else v.push(y);
      }
      o({ parts: v, variables: d });
    },
    b = (u, _) => {
      const p = i.variables.map((d) => (d.id === u ? { ...d, ..._ } : d));
      o({ variables: p });
    },
    k = (u) =>
      r.filter((_) => !i.variables.some((d, v) => v !== u && d.assigned_user_id === _.user_id)),
    q = () => (i.parts.length === 0 ? !0 : i.parts[i.parts.length - 1].type !== 'text');
  return a.jsxs('div', {
    className: f.container,
    children: [
      a.jsx('div', { className: f.sectionTitle, children: 'Mad Lib Builder' }),
      a.jsx('div', {
        className: E.preview,
        children: i.parts.map((u) => {
          var _;
          return a.jsx(
            'span',
            {
              className: E.part,
              children:
                u.type === 'text'
                  ? a.jsx('span', { className: E.textPart, children: u.content })
                  : a.jsx('span', {
                      className: E.variablePart,
                      children:
                        ((_ = i.variables.find((p) => p.id === u.content)) == null
                          ? void 0
                          : _.name) || '[Variable]',
                    }),
            },
            u.id,
          );
        }),
      }),
      a.jsxs('div', {
        className: E.buttonGroup,
        children: [
          a.jsx(T, { type: 'button', onClick: l, disabled: !q(), children: 'Add Text' }),
          a.jsx(T, { type: 'button', onClick: c, children: 'Add Variable' }),
        ],
      }),
      a.jsx('div', { className: f.sectionTitle, children: 'Mad Lib Parts' }),
      i.parts.map((u, _) => {
        var p;
        return a.jsxs(
          'div',
          {
            className: E.partItem,
            children: [
              a.jsx('div', { className: E.partNumber, children: _ + 1 }),
              u.type === 'text'
                ? a.jsx('div', {
                    className: E.textPartEditor,
                    children: a.jsx(N, {
                      label: 'Text',
                      value: u.content,
                      onChange: (d) => n(_, d.target.value),
                    }),
                  })
                : a.jsxs('div', {
                    className: E.variablePartEditor,
                    children: [
                      a.jsx('div', {
                        className: E.variableInfo,
                        children: a.jsxs('h5', {
                          children: [
                            'Variable:',
                            ' ',
                            ((p = i.variables.find((d) => d.id === u.content)) == null
                              ? void 0
                              : p.name) || 'Unnamed',
                          ],
                        }),
                      }),
                      (() => {
                        const d = i.variables.find((v) => v.id === u.content);
                        return d
                          ? a.jsxs('div', {
                              className: E.variableFields,
                              children: [
                                a.jsx(N, {
                                  label: 'Variable Name',
                                  placeholder: 'adjective',
                                  value: d.name,
                                  onChange: (v) => b(d.id, { name: v.target.value }),
                                }),
                                a.jsx(N, {
                                  label: 'Question to ask user',
                                  placeholder: 'Enter an adjective',
                                  value: d.question,
                                  onChange: (v) => b(d.id, { question: v.target.value }),
                                }),
                                a.jsx(A, {
                                  label: 'Data Type',
                                  options: [
                                    { label: 'Text', value: 'text' },
                                    { label: 'Number', value: 'number' },
                                  ],
                                  value: d.dataType,
                                  onChange: (v) => b(d.id, { dataType: v }),
                                }),
                                a.jsx(A, {
                                  label: 'Assign to participant',
                                  options: [
                                    { label: 'No one', value: '' },
                                    ...k(i.variables.findIndex((v) => v.id === d.id)).map((v) => ({
                                      label: v.name,
                                      value: v.user_id,
                                    })),
                                  ],
                                  value: d.assigned_user_id || '',
                                  onChange: (v) => b(d.id, { assigned_user_id: v || void 0 }),
                                }),
                              ],
                            })
                          : null;
                      })(),
                    ],
                  }),
              a.jsx('div', {
                className: E.partActions,
                children: a.jsx(T, { type: 'button', onClick: () => m(_), children: 'Remove' }),
              }),
            ],
          },
          u.id,
        );
      }),
    ],
  });
}
const tt = '_questions_cdmo6_1',
  at = '_question_cdmo6_1',
  st = '_questionHidden_cdmo6_15',
  nt = '_actions_cdmo6_19',
  M = { questions: tt, question: at, questionHidden: st, actions: nt },
  it = () => ({ questions: [{ question: '', formKey: '', inputType: 'text' }] }),
  rt = (e) =>
    e.questions.filter((r) => r.question.trim() && r.formKey.trim()).length === 0
      ? 'At least one question is required for multistep form'
      : null,
  ot = (e) => {
    const t = e.questions.filter((r) => r.question.trim() && r.formKey.trim());
    return {
      type: s.MULTISTEP_FORM,
      questions: t.map((r) => ({
        type: 'question',
        question: r.question.trim(),
        formKey: r.formKey.trim(),
        inputType: r.inputType,
      })),
    };
  },
  lt = (e, t) => !0,
  ct = (e, t, r) => e;
function ut({ multistepQuestions: e, setMultistepQuestions: t }) {
  const [r, i] = h.useState(0),
    o = () => {
      const l = [...e, { question: '', formKey: '', inputType: 'text' }];
      t(l);
    },
    n = (l, c) => {
      const m = [...e];
      ((m[l] = { ...m[l], ...c }), t(m));
    };
  return a.jsxs('div', {
    className: f.container,
    children: [
      a.jsx('div', {
        className: M.questions,
        children: e.map((l, c) =>
          a.jsxs(
            'div',
            {
              className: X(M.question, { [M.questionHidden]: c !== r }),
              children: [
                a.jsx(N, {
                  label: `Question ${c + 1}`,
                  value: l.question,
                  onChange: (m) => {
                    const b = m.target.value,
                      k = b.split(' ').join('_').toLowerCase();
                    n(c, { question: b, formKey: k });
                  },
                }),
                a.jsx(A, {
                  label: 'Input Type',
                  value: l.inputType,
                  onChange: (m) => n(c, { inputType: m }),
                  options: [
                    { label: 'Text', value: 'text' },
                    { label: 'Number', value: 'number' },
                    { label: 'Email', value: 'email' },
                    { label: 'Password', value: 'password' },
                    { label: 'Phone', value: 'tel' },
                  ],
                }),
              ],
            },
            c,
          ),
        ),
      }),
      a.jsxs('div', {
        className: M.actions,
        children: [
          r > 0 && a.jsx(T, { onClick: () => i(r - 1), children: 'Back' }),
          r < e.length - 1 && a.jsx(T, { onClick: () => i(r + 1), children: 'Next' }),
          r === e.length - 1 &&
            a.jsx(T, {
              onClick: () => {
                (o(), i(r + 1));
              },
              children: '+ Add new question',
            }),
        ],
      }),
    ],
  });
}
const dt = () => ({ prompt: '' }),
  pt = (e) => (e.prompt.trim() ? null : 'Photo upload prompt is required'),
  mt = (e) => ({ type: s.PHOTO_UPLOAD, prompt: e.prompt.trim() }),
  bt = (e, t) => !0,
  _t = (e, t, r) => e;
function vt({ data: e, onChange: t }) {
  const r = (i) => {
    t == null || t(i);
  };
  return a.jsx('div', {
    className: f.container,
    children: a.jsx(N, {
      label: 'Prompt',
      placeholder: 'Upload a photo of...',
      required: !0,
      value: e.prompt,
      onChange: (i) => r({ prompt: i.target.value }),
    }),
  });
}
const xt = '_list_z4q0z_1',
  ft = '_item_z4q0z_10',
  V = { list: xt, item: ft },
  yt = () => ({ question: '', options: ['', ''], pollType: 'single' }),
  ht = (e) => {
    const t = e.options.filter((r) => r.trim() !== '');
    return e.question.trim()
      ? t.length < 2
        ? 'Poll must have at least 2 options'
        : null
      : 'Poll question is required';
  },
  kt = (e) => {
    const t = e.options.filter((r) => r.trim() !== '');
    return { type: s.POLL, question: e.question.trim(), options: t, pollType: e.pollType };
  },
  Pt = (e, t) => !0,
  Tt = (e, t, r) => e;
function jt({ data: e, onChange: t }) {
  const r = (l) => {
      t == null || t(l);
    },
    i = () => {
      const l = [...e.options, ''];
      t == null || t({ options: l });
    },
    o = (l) => {
      if (e.options.length <= 2) return;
      const c = e.options.filter((m, b) => b !== l);
      t == null || t({ options: c });
    },
    n = (l, c) => {
      const m = [...e.options];
      ((m[l] = c), t == null || t({ options: m }));
    };
  return a.jsxs('div', {
    className: f.columns,
    children: [
      a.jsxs('div', {
        className: f.column,
        children: [
          a.jsx(N, {
            label: 'Poll Question',
            placeholder: 'What is your question?',
            required: !0,
            value: e.question,
            onChange: (l) => {
              r({ question: l.target.value });
            },
          }),
          a.jsx(A, {
            label: 'Poll Type',
            options: [
              { label: 'Single Choice', value: 'single' },
              { label: 'Multiple Choice', value: 'multiple' },
            ],
            required: !0,
            value: e.pollType,
            onChange: (l) => r({ pollType: l }),
          }),
        ],
      }),
      a.jsxs('div', {
        className: f.column,
        children: [
          a.jsx('div', {
            className: V.list,
            children: e.options.map((l, c) =>
              a.jsxs(
                'div',
                {
                  className: V.item,
                  children: [
                    a.jsx(
                      N,
                      {
                        label: `Option ${c + 1}`,
                        placeholder: `Option ${c + 1}`,
                        value: l,
                        onChange: (m) => n(c, m.target.value),
                      },
                      c,
                    ),
                    e.options.length > 2 &&
                      a.jsx(T, { type: 'button', onClick: () => o(c), children: 'Remove' }),
                  ],
                },
                c,
              ),
            ),
          }),
          a.jsx(T, { type: 'button', onClick: i, children: 'Add Option' }),
        ],
      }),
    ],
  });
}
const Nt = () => ({ questionText: '', questionFormKey: '', questionInputType: 'text' }),
  qt = (e) =>
    e.questionText.trim()
      ? e.questionFormKey.trim()
        ? null
        : 'Question form key is required'
      : 'Question text is required',
  It = (e) => ({
    type: s.QUESTION,
    question: e.questionText.trim(),
    formKey: e.questionFormKey.trim(),
    inputType: e.questionInputType,
  }),
  Et = (e, t) => !0,
  Ot = (e, t, r) => e;
function gt({ data: e, onChange: t }) {
  const r = (o) => {
      t == null || t(o);
    },
    i = (o) => {
      const n = o.split(' ').join('_').toLowerCase();
      t == null || t({ questionText: o, questionFormKey: n });
    };
  return a.jsxs('div', {
    className: f.container,
    children: [
      a.jsx(N, {
        label: 'Question',
        placeholder: 'What is your question?',
        required: !0,
        value: e.questionText,
        onChange: (o) => i(o.target.value),
      }),
      a.jsx(A, {
        label: 'Input Type',
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Number', value: 'number' },
          { label: 'Email', value: 'email' },
          { label: 'Password', value: 'password' },
          { label: 'Phone', value: 'tel' },
        ],
        required: !0,
        value: e.questionInputType,
        onChange: (o) => r({ questionInputType: o }),
      }),
    ],
  });
}
const K = h.createContext(null);
function S() {
  const e = h.useContext(K);
  if (!e) throw new Error('useCreateBlockContext must be used within a CreateBlockProvider');
  return e;
}
function wt({ children: e, participants: t, onClose: r, onEndCurrentBlock: i }) {
  const o = h.useCallback((L) => {
      switch (L) {
        case s.POLL:
          return { kind: s.POLL, data: yt() };
        case s.QUESTION:
          return { kind: s.QUESTION, data: Nt() };
        case s.MULTISTEP_FORM:
          return { kind: s.MULTISTEP_FORM, data: it() };
        case s.ANNOUNCEMENT:
          return { kind: s.ANNOUNCEMENT, data: ve() };
        case s.MAD_LIB:
          return { kind: s.MAD_LIB, data: Je() };
        case s.FAMILY_FEUD:
          return { kind: s.FAMILY_FEUD, data: Ue() };
        case s.PHOTO_UPLOAD:
          return { kind: s.PHOTO_UPLOAD, data: dt() };
        case s.BUZZER:
          return { kind: s.BUZZER, data: Pe() };
        default: {
          const j = L;
          throw new Error(`Unknown block kind: ${j}`);
        }
      }
    }, []),
    [n, l] = h.useState(() => o(s.POLL)),
    [c, m] = h.useState([]),
    [b, k] = h.useState(''),
    [q, u] = h.useState(''),
    [_, p] = h.useState(!1),
    [d, v] = h.useState(!1),
    { createExperienceBlock: P, isLoading: y, error: g, setError: O } = ne(),
    B = h.useCallback(
      (L) => {
        l(o(L));
      },
      [o],
    ),
    Q = h.useCallback(
      async (L) => {
        O(null);
        let j = null;
        switch (n.kind) {
          case s.POLL:
            j = ht(n.data);
            break;
          case s.QUESTION:
            j = qt(n.data);
            break;
          case s.MULTISTEP_FORM:
            j = rt(n.data);
            break;
          case s.ANNOUNCEMENT:
            j = xe(n.data);
            break;
          case s.MAD_LIB:
            j = Xe(n.data);
            break;
          case s.FAMILY_FEUD:
            j = Ae(n.data);
            break;
          case s.PHOTO_UPLOAD:
            j = pt(n.data);
            break;
          case s.BUZZER:
            j = Te(n.data);
            break;
          default:
            j = `Unknown block kind: ${n.kind}`;
        }
        if (j) {
          O(j);
          return;
        }
        let w = !0;
        switch (n.kind) {
          case s.POLL:
            w = Pt(n.data);
            break;
          case s.QUESTION:
            w = Et(n.data);
            break;
          case s.MULTISTEP_FORM:
            w = lt(n.data);
            break;
          case s.ANNOUNCEMENT:
            w = ye(n.data);
            break;
          case s.MAD_LIB:
            w = !0;
            break;
          case s.FAMILY_FEUD:
            w = Fe();
            break;
          case s.PHOTO_UPLOAD:
            w = bt(n.data);
            break;
          case s.BUZZER:
            w = Ne(n.data);
            break;
          default: {
            const I = n;
            ((w = !1), console.error(`Unknown block kind: ${I.kind}`));
          }
        }
        if (L === 'open' && !w) {
          O('Cannot open this block immediately');
          return;
        }
        let x;
        switch (n.kind) {
          case s.POLL:
            x = { kind: s.POLL, data: Tt(n.data) };
            break;
          case s.QUESTION:
            x = { kind: s.QUESTION, data: Ot(n.data) };
            break;
          case s.MULTISTEP_FORM:
            x = { kind: s.MULTISTEP_FORM, data: ct(n.data) };
            break;
          case s.ANNOUNCEMENT:
            x = { kind: s.ANNOUNCEMENT, data: he(n.data) };
            break;
          case s.MAD_LIB:
            x = { kind: s.MAD_LIB, data: n.data };
            break;
          case s.FAMILY_FEUD:
            x = { kind: s.FAMILY_FEUD, data: De(n.data) };
            break;
          case s.PHOTO_UPLOAD:
            x = { kind: s.PHOTO_UPLOAD, data: _t(n.data) };
            break;
          case s.BUZZER:
            x = { kind: s.BUZZER, data: qe(n.data) };
            break;
          default: {
            const I = n;
            ((x = I), console.error(`Unknown block kind: ${I.kind}`));
          }
        }
        let U;
        switch (x.kind) {
          case s.POLL:
            U = kt(x.data);
            break;
          case s.QUESTION:
            U = It(x.data);
            break;
          case s.MULTISTEP_FORM:
            U = ot(x.data);
            break;
          case s.ANNOUNCEMENT:
            U = fe(x.data);
            break;
          case s.MAD_LIB:
            U = { type: s.MAD_LIB, parts: x.data.parts };
            break;
          case s.FAMILY_FEUD:
            U = Me(x.data);
            break;
          case s.PHOTO_UPLOAD:
            U = mt(x.data);
            break;
          case s.BUZZER:
            U = je(x.data);
            break;
          default: {
            const I = x;
            throw new Error(`Unknown block kind: ${I.kind}`);
          }
        }
        const Y = b
            .split(',')
            .map((I) => I.trim())
            .filter(Boolean),
          W = q
            .split(',')
            .map((I) => I.trim())
            .filter(Boolean),
          C = {
            kind: n.kind,
            payload: U,
            visible_to_roles: c,
            visible_to_segments: Y,
            target_user_ids: W,
            status: L,
            open_immediately: L === 'open',
            show_in_lobby: _,
          };
        if (n.kind === s.MAD_LIB) {
          const G = (x.data.variables ?? []).map((F) => ({
            key: F.id,
            label: F.name,
            datatype: F.dataType === 'number' ? 'number' : 'string',
            required: !0,
            source: F.assigned_user_id
              ? { type: 'participant', participant_id: F.assigned_user_id }
              : { kind: 'question', question: F.question, input_type: 'text' },
          }));
          C.variables = G;
        }
        (n.kind === s.FAMILY_FEUD && x.kind === s.FAMILY_FEUD && (C.questions = Se(x.data)),
          await P(C),
          r(),
          L === 'open' && (await i()),
          l(o(n.kind)),
          m([]),
          k(''),
          u(''),
          p(!1),
          v(!1));
      },
      [n, t, c, b, q, P, r, i, O, o],
    ),
    H = {
      blockData: n,
      setBlockData: l,
      setKind: B,
      participants: t,
      submit: Q,
      isSubmitting: y,
      error: g,
      visibleRoles: c,
      setVisibleRoles: m,
      visibleSegmentsText: b,
      setVisibleSegmentsText: k,
      targetUserIdsText: q,
      setTargetUserIdsText: u,
      showInLobby: _,
      setShowInLobby: p,
      viewAdditionalDetails: d,
      setViewAdditionalDetails: v,
    };
  return a.jsx(K.Provider, { value: H, children: e });
}
function St(e) {
  return a.jsx(wt, { ...e, children: a.jsx(Lt, { onClose: e.onClose }) });
}
function Lt({ onClose: e }) {
  const {
    blockData: t,
    setKind: r,
    submit: i,
    isSubmitting: o,
    error: n,
    viewAdditionalDetails: l,
    setViewAdditionalDetails: c,
  } = S();
  return a.jsxs('div', {
    className: f.root,
    children: [
      a.jsx(ee, { className: f.title, children: 'Create Block' }),
      a.jsx(te, { className: 'sr-only', children: 'Create a new block for your experience' }),
      n && a.jsx('div', { className: f.error, children: n }),
      a.jsx(A, {
        label: 'Kind',
        options: [
          { label: 'Poll', value: s.POLL },
          { label: 'Question', value: s.QUESTION },
          { label: 'Multistep Form', value: s.MULTISTEP_FORM },
          { label: 'Announcement', value: s.ANNOUNCEMENT },
          { label: 'Mad Lib', value: s.MAD_LIB },
          { label: 'Family Feud', value: s.FAMILY_FEUD },
          { label: 'Photo Upload', value: s.PHOTO_UPLOAD },
          { label: 'Buzzer', value: s.BUZZER },
        ],
        value: t.kind,
        onChange: r,
        required: !0,
      }),
      a.jsx(Ut, {}),
      l && a.jsx(At, {}),
      a.jsxs('div', {
        className: f.actions,
        children: [
          a.jsx(T, { onClick: e, children: 'Back' }),
          a.jsx(T, {
            onClick: () => c(!l),
            children: l ? 'Hide Additional Details' : 'View Additional Details',
          }),
          a.jsx(T, {
            onClick: () => i('hidden'),
            loading: o,
            loadingText: 'Creating...',
            children: 'Queue block',
          }),
          a.jsx(T, {
            onClick: () => i('open'),
            loading: o,
            loadingText: 'Creating...',
            children: 'Play now',
          }),
        ],
      }),
    ],
  });
}
function Ut() {
  const { blockData: e, setBlockData: t, participants: r } = S(),
    i = (o) => {
      t((n) => ({ ...n, data: { ...n.data, ...o } }));
    };
  switch (e.kind) {
    case s.POLL:
      return a.jsx(jt, { data: e.data, onChange: i });
    case s.QUESTION:
      return a.jsx(gt, { data: e.data, onChange: i });
    case s.MULTISTEP_FORM:
      return a.jsx(ut, {
        multistepQuestions: e.data.questions,
        setMultistepQuestions: (n) => i({ questions: n }),
      });
    case s.ANNOUNCEMENT:
      return a.jsx(ke, { data: e.data, onChange: i });
    case s.MAD_LIB:
      return a.jsx(et, { data: e.data, onChange: i, participants: r });
    case s.FAMILY_FEUD:
      return a.jsx(Be, { data: e.data, onChange: i });
    case s.PHOTO_UPLOAD:
      return a.jsx(vt, { data: e.data, onChange: i });
    case s.BUZZER:
      return a.jsx(Ie, { data: e.data, onChange: i });
    default:
      const o = e;
      return a.jsxs('div', { className: f.details, children: ['Unknown block type: ', o] });
  }
}
function At() {
  const {
    participants: e,
    visibleRoles: t,
    setVisibleRoles: r,
    visibleSegmentsText: i,
    setVisibleSegmentsText: o,
    targetUserIdsText: n,
    setTargetUserIdsText: l,
    showInLobby: c,
    setShowInLobby: m,
  } = S();
  return a.jsxs('div', {
    className: f.additionalDetails,
    children: [
      a.jsx(A, {
        label: 'Visible to roles',
        options: [
          { label: 'Audience', value: 'audience' },
          { label: 'Player', value: 'player' },
          { label: 'Moderator', value: 'moderator' },
          { label: 'Host', value: 'host' },
        ],
        value: t,
        onChange: (b) => r([b]),
      }),
      a.jsx(N, {
        label: 'Visible to segments (comma-separated)',
        placeholder: 'segment-a, segment-b',
        value: i,
        onChange: (b) => o(b.target.value),
      }),
      a.jsx(A, {
        label: 'Target user IDs',
        options: e.map((b) => ({ label: b.name, value: b.id })),
        value: n,
        onChange: l,
      }),
      a.jsxs('label', {
        className: f.checkboxLabel,
        children: [
          a.jsx('input', { type: 'checkbox', checked: c, onChange: (b) => m(b.target.checked) }),
          'Show in lobby',
        ],
      }),
    ],
  });
}
export { St as C, Mt as u };
