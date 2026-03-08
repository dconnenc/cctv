import { C, u as p } from './CreateBlock-CgwW1au8.js';
import { u as d, c as m, j as o } from './application-BWXX6fgN.js';
import './dialog-C-y_qkUB.js';

import { u as p, C } from './CreateBlock-CgwW1au8.js';
import './dialog-C-y_qkUB.js';
const h = '_root_15jcu_1',
  g = '_container_15jcu_10',
  n = { root: h, container: g };
function B() {
  const { experience: t, code: a } = d(),
    c = m(),
    { change: r } = p(),
    e = [
      ...((t == null ? void 0 : t.hosts) || []),
      ...((t == null ? void 0 : t.participants) || []),
    ],
    s = t == null ? void 0 : t.blocks.find((u) => u.status === 'open'),
    i = () => {
      c(`/experiences/${a}/manage`);
    },
    l = async () => {
      s && (await r(s, 'closed'));
    };
  return o.jsx('section', {
    className: n.root,
    children: o.jsx('div', {
      className: n.container,
      children: o.jsx(C, { onClose: i, participants: e, onEndCurrentBlock: l }),
    }),
  });
}
export { B as default };
