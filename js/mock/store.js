/* 数据存储层：Vue reactive + localStorage 持久化（PC 端与移动端共用） */
(function () {
  const KEY = 'bds_proto_data_v1';
  const ROLE_KEY = 'bds_proto_role';
  const { reactive, watch } = Vue;

  /** 日期所在学年，如 2024-09-01 → 2024-2025。月份缺省时不猜测。 */
  function xnFromDate(iso) {
    if (!iso) return '';
    const y = Number(String(iso).slice(0, 4));
    const m = Number(String(iso).slice(5, 7));
    if (!y || !m) return '';
    const s = m >= 9 ? y : y - 1;
    return s + '-' + (s + 1);
  }
  /** 旧数据缺学年时按开始日期补上，不升高 version。 */
  function fillMissingXn(d) {
    (d.bdsRz || []).forEach(r => {
      if (r && !r.xn && r.ksrq) r.xn = xnFromDate(r.ksrq);
    });
    return d;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.version === 3) {
          window.__collegeMap = {};
          d.colleges.forEach(c => { window.__collegeMap[c.xybm] = c.xymc; });
          return fillMissingXn(d);
        }
      }
    } catch (e) { /* ignore */ }
    return fillMissingXn(window.buildSeed());
  }

  const state = reactive(load());
  const session = reactive({ roleKey: localStorage.getItem(ROLE_KEY) || 'xgbgly' });

  let timer = null;
  watch(state, () => {
    clearTimeout(timer);
    timer = setTimeout(() => localStorage.setItem(KEY, JSON.stringify(state)), 150);
  }, { deep: true });
  watch(() => session.roleKey, v => localStorage.setItem(ROLE_KEY, v));
  localStorage.setItem(KEY, JSON.stringify(state));

  const uid = p => p + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  const now = () => window.SEED_UTIL.fmtTime(new Date());
  const today = () => window.SEED_UTIL.fmtDate(new Date());

  window.Store = {
    state, session, uid, now, today,
    reset() {
      localStorage.removeItem(KEY);
      location.reload();
    },
    role() { return window.ROLES.find(r => r.key === session.roleKey) || window.ROLES[0]; },
    can(code) { return this.role().perms.includes(code); },
    setRole(key) { session.roleKey = key; },
    collegeName(xybm) { const c = state.colleges.find(x => x.xybm === xybm); return c ? c.xymc : ''; },
    collegeOptions() { return state.colleges.map(c => ({ label: c.xymc, value: c.xybm })); },
    classesOf(xybm) { return state.classes.filter(c => !xybm || c.xybm === xybm); },
    className(bjbh) { const c = state.classes.find(x => x.bjbh === bjbh); return c ? c.bjmc : ''; },
    findJzg(gh) { return state.jzg.find(j => j.gh === String(gh).trim()); },
    /**
     * 带班信息派生字段 bjmcs / dbsl / bjTenure。
     * 该工号已有任职履历时，按当前在任记录（结束日期为空）计算。
     * bjTenure 在班级名后写明学年和起止时间，仍在任显示「至今」。
     */
    bdsView(b) {
      const tracked = (state.bdsRz || []).some(r => r.gh === b.gh);
      const open = tracked ? this.openRz(b.gh) : null;
      const src = open ? open.map(r => r.bjbh) : (b.bjbhList || []);
      const ids = [];
      src.forEach(id => { if (id && ids.indexOf(id) < 0) ids.push(id); });
      const names = ids.map(x => this.className(x)).filter(Boolean);
      const tenure = open ? open.map(r => this.tenureLabel(r)).filter(Boolean).join('、') : names.join('、');
      return Object.assign({}, b, { bjmcs: names.join('、'), bjTenure: tenure, dbsl: names.length });
    },
    tenureLabel(r) {
      if (!r) return '';
      const name = this.className(r.bjbh) || r.bjbh || '';
      if (!name) return '';
      const xn = this.xnText(r.xn, r.ksrq);
      const end = r.jsrq ? r.jsrq : '至今';
      return name + '（' + (xn ? xn + '，' : '') + (r.ksrq || '-') + ' 至 ' + end + '）';
    },
    /** 学年展示文案。记录里缺学年时按开始日期推算。 */
    xnText(xn, ksrq) {
      const raw = xn || xnFromDate(ksrq);
      if (!raw) return '';
      const x = (state.xnList || []).find(i => i.id === raw || i.mc === raw || (i.qsnf + '-' + i.jsnf) === raw);
      if (x) return x.mc;
      return /^\d{4}-\d{4}$/.test(String(raw)) ? (raw + ' 学年') : String(raw);
    },
    rzRows(gh) {
      return (state.bdsRz || []).filter(r => r.gh === gh).slice().sort((a, b) => (a.ksrq < b.ksrq ? 1 : -1)).map(r => ({
        bjbh: r.bjbh,
        bjmc: this.className(r.bjbh) || r.bjbh,
        xn: this.xnText(r.xn, r.ksrq),
        ksrq: r.ksrq,
        jsrq: r.jsrq || '至今',
        zt: r.jsrq ? '已结束' : '在任',
      }));
    },
    /** 班级的班导师姓名（bjgl 列表 bdsxm） */
    bdsOfClass(bjbh) { return state.bds.filter(b => (b.bjbhList || []).includes(bjbh)); },
    /** 班级学生（按班级编号懒生成并持久化，PC 班级管理与移动端共用） */
    studentsOf(bjbh) {
      if (!state.bjStudents) state.bjStudents = {};
      if (state.bjStudents[bjbh]) return state.bjStudents[bjbh];
      const U = window.SEED_UTIL;
      const c = state.classes.find(x => x.bjbh === bjbh) || {};
      const r = U.rng(Number(String(bjbh).slice(-6)) || 7);
      const sur = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田'.split('');
      const giv = ['子涵', '欣怡', '浩然', '梓萱', '宇轩', '雨桐', '俊熙', '思彤', '一诺', '嘉怡', '明轩', '可馨', '天翊', '若汐', '博涛', '语嫣', '晨阳', '诗琪', '泽楷', '梦洁'];
      const list = [];
      for (let i = 1; i <= (c.xsrs || 30); i++) {
        const y = Number(c.nj || 2023) - 18 - Math.floor(r() * 2);
        list.push({
          xh: (c.nj || '2023') + String(bjbh).slice(-6) + U.pad(i), xm: sur[Math.floor(r() * sur.length)] + giv[Math.floor(r() * giv.length)],
          xb: r() < 0.55 ? '1' : '2', szxy: c.xymc, zymc: c.zymc, bjmc: c.bjmc, dqnj: c.nj, rxnf: c.nj,
          sjh: '1' + ['37', '38', '39', '58', '86'][Math.floor(r() * 5)] + String(Math.floor(r() * 1e8)).padStart(8, '0'),
          csrq: y + '-' + U.pad(1 + Math.floor(r() * 12)) + '-' + U.pad(1 + Math.floor(r() * 28)),
        });
      }
      state.bjStudents[bjbh] = list;
      return list;
    },
    /** 按角色过滤数据范围。辅导员只看自己所带班上的班导师。 */
    scopeFilter(list, xybmKey = 'xybm', ghKey = 'gh') {
      const r = this.role();
      if (r.scope === 'college') return list.filter(x => x[xybmKey] === r.xybm);
      if (r.scope === 'self') return list.filter(x => x[ghKey] === r.gh);
      if (r.scope === 'fdy') {
        const mine = new Set(state.classes.filter(c => c.fdyxm === r.xm).map(c => c.bjbh));
        return list.filter(x => {
          if (x.bjbh && mine.has(x.bjbh)) return true;
          const open = (state.bdsRz || []).filter(z => z.gh === x[ghKey] && !z.jsrq).map(z => z.bjbh);
          const cur = open.length ? open : (x.bjbhList || []);
          return cur.some(bh => mine.has(bh));
        });
      }
      return list;
    },
    /** 日期所在学年，如 2024-09-01 → 2024-2025 */
    xnLabel(iso) { return xnFromDate(iso); },
    xnSpan(xnidOrLabel) {
      const xn = state.xnList.find(x => x.id === xnidOrLabel || x.mc === xnidOrLabel);
      if (xn) return [xn.qsnf + '-09-01', xn.jsnf + '-08-31'];
      const m = String(xnidOrLabel || '').match(/(\d{4})/);
      if (!m) return null;
      const y = Number(m[1]);
      return [y + '-09-01', (y + 1) + '-08-31'];
    },
    openRz(gh) { return (state.bdsRz || []).filter(r => r.gh === gh && !r.jsrq); },
    syncBjbh(b) {
      if (!b) return;
      const ids = [];
      this.openRz(b.gh).forEach(r => { if (r.bjbh && ids.indexOf(r.bjbh) < 0) ids.push(r.bjbh); });
      b.bjbhList = ids;
    },
    /** 区间是否重叠。结束日期为空视为仍在任。两端日期都算在内。 */
    rzOverlap(a1, a2, b1, b2) {
      const end = x => (x ? String(x) : '9999-12-31');
      return String(a1) <= end(b2) && String(b1) <= end(a2);
    },
    /** 同一时期带了几个班（班级去重，区间重叠即计入） */
    overlapCount(gh, start, end) {
      if (!start || !end) return this.openRz(gh).length;
      const set = {};
      (state.bdsRz || []).forEach(r => {
        if (r.gh === gh && this.rzOverlap(r.ksrq, r.jsrq, start, end)) set[r.bjbh] = 1;
      });
      return Object.keys(set).length;
    },
    normalizeRzPeriod(p) {
      p = p || {};
      const key = p.xnid || p.xn || '';
      const x = (state.xnList || []).find(i => i.id === key || i.mc === key || (i.qsnf + '-' + i.jsnf) === String(key));
      const ksrq = p.ksrq ? String(p.ksrq).slice(0, 10) : '';
      const jsrq = p.jsrq ? String(p.jsrq).slice(0, 10) : '';
      let xn = '';
      if (x) xn = x.qsnf + '-' + x.jsnf;
      else if (/^\d{4}-\d{4}$/.test(String(key))) xn = String(key);
      return { xnid: x ? x.id : '', xn, ksrq, jsrq };
    },
    /** 学年、开始时间必填。结束时间可空，空表示仍在任。 */
    validateRzPeriod(p) {
      const n = this.normalizeRzPeriod(p);
      if (!n.xn) return '请选择学年';
      if (!n.ksrq) return '请选择开始时间';
      if (n.jsrq && n.jsrq < n.ksrq) return '结束时间不能早于开始时间';
      return '';
    },
    classOccupiedMessage(bjbh, occGh) {
      const who = state.bds.find(b => b.gh === occGh);
      return '班级「' + (this.className(bjbh) || bjbh) + '」当前已有班导师' + (who ? '（' + who.xm + '）' : '') + '，同一时期一个班只能有一名班导师';
    },
    /**
     * 按所选开始、结束时间检查新履历，通过才允许写入。
     * adjust 把某些在任记录临时视为已在指定日期结束（id → jsrq）。
     * extra 是本批尚未落库、但要一并计入重叠的记录。
     */
    checkNewSegments(gh, segs, adjust, extra) {
      const base = (state.bdsRz || []).map(r => {
        if (adjust && Object.prototype.hasOwnProperty.call(adjust, r.id)) return Object.assign({}, r, { jsrq: adjust[r.id] });
        return r;
      }).concat(extra || []);
      const pending = [];
      for (const seg of segs) {
        const start = seg.ksrq;
        const end = seg.jsrq || '';
        const pool = base.concat(pending);
        const hit = pool.find(r => r.bjbh === seg.bjbh && this.rzOverlap(r.ksrq, r.jsrq, start, end));
        if (hit) return this.classOccupiedMessage(seg.bjbh, hit.gh);
        const set = {};
        pool.forEach(r => {
          if (r.gh === gh && this.rzOverlap(r.ksrq, r.jsrq, start, end)) set[r.bjbh] = 1;
        });
        if (!set[seg.bjbh] && Object.keys(set).length >= 2) return '该班导师同一时期最多带两个班，不能再添加';
        pending.push({ gh, bjbh: seg.bjbh, ksrq: start, jsrq: end });
      }
      return '';
    },
    pushRz(gh, bjbh, norm) {
      state.bdsRz.push({ id: uid('rz'), gh, bjbh, ksrq: norm.ksrq, jsrq: norm.jsrq || '', xn: norm.xn, xq: '' });
    },
    /**
     * 把在任班级改成 nextList。新绑定的班级使用 period（学年、开始、结束），
     * 结束为空表示仍在任。从在任中去掉的班级只把结束日期写成今天，不删历史。
     * 重叠按所选起止判断。返回空字符串表示成功，否则为提示文案。
     */
    replaceOpenClasses(gh, nextList, period) {
      if (!state.bdsRz) state.bdsRz = [];
      const next = Array.from(new Set((nextList || []).filter(Boolean)));
      const curRecs = this.openRz(gh);
      const cur = curRecs.map(r => r.bjbh);
      const adding = next.filter(bh => cur.indexOf(bh) < 0);
      const removing = cur.filter(bh => next.indexOf(bh) < 0);
      let norm = null;
      if (adding.length) {
        const v = this.validateRzPeriod(period);
        if (v) return v;
        norm = this.normalizeRzPeriod(period);
      }
      const day = today();
      const adjust = {};
      removing.forEach(bh => {
        const rec = curRecs.find(r => r.bjbh === bh);
        if (rec) adjust[rec.id] = day;
      });
      if (adding.length) {
        const err = this.checkNewSegments(gh, adding.map(bh => ({ bjbh: bh, ksrq: norm.ksrq, jsrq: norm.jsrq })), adjust);
        if (err) return err;
      }
      removing.forEach(bh => {
        const rec = state.bdsRz.find(r => r.gh === gh && r.bjbh === bh && !r.jsrq);
        if (rec) rec.jsrq = day;
      });
      adding.forEach(bh => this.pushRz(gh, bh, norm));
      this.syncBjbh(state.bds.find(b => b.gh === gh));
      return '';
    },
    /** 给班级新增一段带班履历。失败时不写入。 */
    assignBdsClass(gh, bjbh, period) {
      return this.assignBdsClasses([{ gh, bjbh, period }]);
    },
    /** 一批写入。任一条校验失败或时间重叠，则全部不写。 */
    assignBdsClasses(items) {
      if (!state.bdsRz) state.bdsRz = [];
      const norms = [];
      for (const it of items || []) {
        const v = this.validateRzPeriod(it.period);
        if (v) return v;
        const n = this.normalizeRzPeriod(it.period);
        norms.push({ gh: it.gh, bjbh: it.bjbh, ksrq: n.ksrq, jsrq: n.jsrq, xn: n.xn });
      }
      const shadow = [];
      for (const seg of norms) {
        const err = this.checkNewSegments(seg.gh, [seg], null, shadow);
        if (err) return err;
        shadow.push(seg);
      }
      const touched = {};
      norms.forEach(seg => {
        this.pushRz(seg.gh, seg.bjbh, seg);
        touched[seg.gh] = 1;
      });
      Object.keys(touched).forEach(gh => this.syncBjbh(state.bds.find(b => b.gh === gh)));
      return '';
    },
    /** 解除在任：给当前在任记录写今天为结束日期，履历保留。 */
    endBdsClass(gh, bjbh) {
      const cur = this.openRz(gh).map(r => r.bjbh).filter(x => x !== bjbh);
      return this.replaceOpenClasses(gh, cur);
    },
    xnName(id) { const x = state.xnList.find(i => i.id === id); return x ? x.mc : ''; },
  };
})();
