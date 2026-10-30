/*
 * 移动端页面（znzhxgpt-uni）：
 *   #/home      首页（校领导首页·学工队伍板块：队伍总体情况 cardTeam / 优秀班导师 cardTutor）
 *   #/drill     下钻名单 pages/home/fdyDrill.vue（scope=xgdw 学工队伍 / scope=xsrs 我带班学生名单）
 *   #/fdydetail 班导师详情（与 PC 名单详情同一套：基本信息 + 历年带班）
 *   #/xsxq      学生详情 pages/home/xsxq.vue（个人信息·基本信息含班导师姓名/工号/电话）
 *   #/my        我的 pages/my/teacher.vue（我的档案、切换角色）
 */
(function () {
  const { createApp, reactive, computed } = Vue;
  const S = window.Store;
  const M = window.MData;

  /* ---------------- 路由 ---------------- */
  function parseHash() {
    const raw = (location.hash || '#/home').slice(1);
    const [path, qs] = raw.split('?');
    const query = {};
    (qs || '').split('&').filter(Boolean).forEach(kv => {
      const [k, v] = kv.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return { path: path || '/home', query };
  }
  const route = reactive(parseHash());
  window.addEventListener('hashchange', () => Object.assign(route, parseHash()));
  window.mgo = function (path, query) {
    const qs = Object.keys(query || {}).filter(k => query[k] !== '' && query[k] != null)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(query[k])).join('&');
    location.hash = path + (qs ? '?' + qs : '');
  };
  window.mback = function () {
    if (history.length > 1) history.back(); else window.mgo('/home');
  };

  const toast = reactive({ text: '', timer: null });
  window.mtoast = function (text) {
    clearTimeout(toast.timer);
    toast.text = text;
    toast.timer = setTimeout(() => { toast.text = ''; }, 1600);
  };

  const dash = v => (v === undefined || v === null || String(v).trim() === '' ? '—' : String(v));
  const avatarCls = xb => (String(xb) === '2' || xb === '女' ? 'avatar--f' : 'avatar--m');
  const genderTxt = xb => (String(xb) === '2' || xb === '女' ? '♀' : String(xb) === '1' || xb === '男' ? '♂' : '');
  const genderCls = xb => (String(xb) === '2' || xb === '女' ? 'gender--f' : 'gender--m');
  const helpers = { dash, avatarCls, genderTxt, genderCls };

  /* ---------------- 首页 ---------------- */
  const MHome = {
    props: { query: Object },
    setup() {
      const role = computed(() => S.role());
      const team = computed(() => M.teamOverall());
      const tutor = computed(() => M.tutorStat());
      const donutBg = computed(() => {
        let acc = 0;
        const segs = team.value.pie.map(p => {
          const from = acc; acc += p.value;
          return `${p.color} ${from}% ${acc}%`;
        });
        return { background: `conic-gradient(${segs.join(',')})` };
      });
      const maxBar = computed(() => Math.max(1, ...tutor.value.bars.map(b => b.value)));
      const myClasses = computed(() => {
        const b = S.state.bds.find(x => x.gh === role.value.gh);
        return b ? (b.bjbhList || []).length : 0;
      });
      return { role, team, tutor, donutBg, maxBar, myClasses, go: window.mgo, ...helpers };
    },
    template: `
      <div class="home">
        <div class="home-hello">
          <div class="home-hello__name">{{ role.xm }}，您好</div>
          <div class="home-hello__sub">{{ role.jsmc }} · {{ role.scope === 'all' ? '全校' : (S_collegeName(role.xybm)) }}</div>
        </div>
        <div class="entry-grid">
          <div class="entry" @click="go('/drill', { scope: 'xgdw' })"><div class="entry__ic entry__ic--blue">队</div>学工队伍</div>
          <div v-if="role.scope === 'self'" class="entry" @click="go('/drill', { scope: 'xsrs' })"><div class="entry__ic entry__ic--green">生</div>我带班学生名单</div>
          <div class="entry" @click="go('/fdydetail', { gh: role.gh, rylx: '4' })"><div class="entry__ic entry__ic--orange">档</div>我的档案</div>
        </div>
        <div class="m-notice">移动端暂无：优秀班导师申请/审批、班导师津贴核对/审批（uni-app 源码中无对应页面，请在 PC 端演示）。</div>

        <div class="xld-card">
          <div class="xld-card__head">
            <span class="xld-card__title">队伍总体情况</span>
            <span class="xld-card__link" @click="go('/drill', { scope: 'xgdw' })">查看名单</span>
          </div>
          <div class="donut-wrap">
            <div class="donut" :style="donutBg"><div class="donut__hole"><span class="donut__num">{{ team.total }}</span><span class="donut__lbl">队伍总数</span></div></div>
            <div class="legend">
              <div v-for="p in team.pie" :key="p.name" class="legend__row"><span class="legend__dot" :style="{ background: p.color }"></span>{{ p.name }}<span class="legend__val">{{ p.value }}%</span></div>
            </div>
          </div>
          <div class="xld-footer">
            <div class="xld-footer__item"><span class="xld-footer__value" style="color:#0057f0">1:{{ team.ratio }}</span><span class="xld-footer__label">师生比</span></div>
            <div class="xld-footer__item"><span class="xld-footer__value" style="color:#1ec997">0%</span><span class="xld-footer__label">专职辅导员占比</span></div>
            <div class="xld-footer__item"><span class="xld-footer__value" style="color:#ff9800">{{ team.total }}</span><span class="xld-footer__label">队伍总人数</span></div>
          </div>
        </div>

        <div class="xld-card">
          <div class="xld-card__head">
            <span class="xld-card__title">优秀班导师</span>
            <span class="xld-card__link" @click="go('/drill', { scope: 'xgdw', dwlx: '班导师' })">查看班导师</span>
          </div>
          <div class="bars">
            <span class="bars__y">人</span>
            <div v-for="b in tutor.bars" :key="b.name" class="bar">
              <span class="bar__val">{{ b.value }}</span>
              <div class="bar__col" :style="{ height: (b.value / maxBar * 120) + 'px' }"></div>
            </div>
          </div>
          <div class="bar-labels"><span v-for="b in tutor.bars" :key="b.name"><i>{{ b.name.replace(/学院$/, '') }}</i></span></div>
          <div class="xld-footer">
            <div class="xld-footer__item"><span class="xld-footer__value" style="color:#3087cc">{{ tutor.electedCount }}</span><span class="xld-footer__label">优秀当选</span></div>
            <div class="xld-footer__item"><span class="xld-footer__value" style="color:#f29100">{{ tutor.totalCount }}</span><span class="xld-footer__label">班导师总数</span></div>
            <div class="xld-footer__item"><span class="xld-footer__value" style="color:#1ec997">{{ tutor.coverageRate }}%</span><span class="xld-footer__label">学院覆盖率</span></div>
          </div>
        </div>
      </div>`,
    methods: { S_collegeName(x) { return S.collegeName(x); } },
  };

  /* ---------------- 下钻名单 fdyDrill ---------------- */
  const DRILL_META = {
    xsrs: { title: '我带班学生名单', listTitle: '学生列表', unit: '名学生', placeholder: '搜索姓名/学号/班级', sortLabel: '按学号', filters: ['nj', 'zybh', 'bjbh', 'xjzt', 'xb'] },
    xgdw: { title: '学工队伍', listTitle: '学工队伍列表', unit: '名队伍成员', placeholder: '搜索姓名/学号/班级', isStaff: true, filters: ['dwlx', 'zt', 'xb'] },
  };
  const FILTER_LABELS = { nj: '年级', zybh: '专业', bjbh: '班级', xjzt: '学籍', xb: '性别', dwlx: '类型', zt: '状态' };
  const PAGE_SIZE = 10;

  const MDrill = {
    props: { query: Object },
    data() {
      return { keyword: '', applied: '', filters: {}, sheetKey: '', size: PAGE_SIZE, sortAsc: true };
    },
    created() { this.init(); },
    watch: { 'query.scope'() { this.init(); } },
    computed: {
      scope() { return this.query.scope === 'xsrs' ? 'xsrs' : 'xgdw'; },
      meta() { return DRILL_META[this.scope]; },
      classes() {
        if (this.scope !== 'xsrs') return [];
        if (this.query.bjbh) return S.state.classes.filter(c => c.bjbh === this.query.bjbh);
        const b = S.state.bds.find(x => x.gh === S.role().gh);
        return b ? S.state.classes.filter(c => (b.bjbhList || []).includes(c.bjbh)) : [];
      },
      source() {
        if (this.scope === 'xgdw') return M.staffScoped();
        return this.classes.reduce((all, c) => all.concat(M.studentsOfClass(c.bjbh)), []);
      },
      options() {
        if (this.scope === 'xgdw') {
          return {
            dwlx: ['辅导员', '班导师', '副书记'].map(v => ({ label: v, value: v })),
            zt: ['在岗', '请假'].map(v => ({ label: v, value: v })),
            xb: [{ label: '男', value: '1' }, { label: '女', value: '2' }],
          };
        }
        const uniq = (arr, k, l) => arr.filter((x, i) => arr.findIndex(y => y[k] === x[k]) === i).map(x => ({ value: x[k], label: l(x) }));
        return {
          nj: uniq(this.classes, 'nj', c => c.nj + '级'),
          zybh: uniq(this.classes, 'zybh', c => c.zymc),
          bjbh: this.classes.map(c => ({ value: c.bjbh, label: c.bjmc })),
          xjzt: [{ label: '在读', value: '在读' }, { label: '休学', value: '休学' }, { label: '保留学籍', value: '保留学籍' }],
          xb: [{ label: '男', value: '1' }, { label: '女', value: '2' }],
        };
      },
      filterPills() {
        return this.meta.filters.map(key => {
          const val = this.filters[key];
          const label = FILTER_LABELS[key];
          const hit = (this.options[key] || []).find(o => o.value === val);
          return { key, active: !!val, label: hit ? hit.label : '全部' + label };
        });
      },
      filtered() {
        const f = this.filters;
        const kw = this.applied.trim();
        let rows = this.source.filter(r => {
          if (kw && !(String(r.xm).includes(kw) || String(r.xh).includes(kw) || String(r.bjmc || '').includes(kw))) return false;
          if (f.xb && String(r.xb) !== f.xb) return false;
          if (this.scope === 'xgdw') {
            if (f.dwlx && r.zw !== f.dwlx) return false;
            if (f.zt && r.xjztmc !== f.zt) return false;
          } else {
            const c = this.classes.find(x => x.bjbh === r.bjbh) || {};
            if (f.nj && c.nj !== f.nj) return false;
            if (f.zybh && c.zybh !== f.zybh) return false;
            if (f.bjbh && r.bjbh !== f.bjbh) return false;
            if (f.xjzt && r.xjztmc !== f.xjzt) return false;
          }
          return true;
        });
        if (this.scope === 'xsrs') rows = rows.slice().sort((a, b) => (this.sortAsc ? 1 : -1) * String(a.xh).localeCompare(String(b.xh)));
        return rows;
      },
      records() { return this.filtered.slice(0, this.size); },
      hasMore() { return this.records.length < this.filtered.length; },
      summaryChips() {
        if (this.scope !== 'xgdw') return [];
        const rows = this.filtered;
        const s = { fdy: rows.filter(r => r.zw === '辅导员').length, bds: rows.filter(r => r.zw === '班导师').length, leave: rows.filter(r => r.xjztmc === '请假').length };
        const chips = [];
        if (s.fdy) chips.push({ text: s.fdy + '名辅导员', tone: 'primary' });
        if (s.bds) chips.push({ text: s.bds + '名班导师', tone: 'primary' });
        if (s.leave) chips.push({ text: s.leave + '人请假', tone: 'warning' });
        return chips;
      },
      sheetOptions() { return this.options[this.sheetKey] || []; },
      sheetLabel() { return FILTER_LABELS[this.sheetKey] || ''; },
    },
    methods: {
      init() {
        this.keyword = ''; this.applied = ''; this.size = PAGE_SIZE;
        this.filters = {};
        if (this.query.dwlx) this.filters.dwlx = this.query.dwlx;
        if (this.query.bjbh) this.filters.bjbh = this.query.bjbh;
      },
      onSearch() { this.applied = this.keyword; this.size = PAGE_SIZE; },
      pick(v) { this.filters = Object.assign({}, this.filters, { [this.sheetKey]: v }); this.sheetKey = ''; this.size = PAGE_SIZE; },
      loadMore() { if (this.hasMore) this.size += PAGE_SIZE; },
      statusClass(t) {
        t = String(t || '');
        if (t.includes('请假') || t.includes('假')) return 'is-ok';
        if (t.includes('在岗') || t.includes('休')) return 'is-warn';
        if (t.includes('读') || t.includes('在校')) return 'is-ok';
        return 'is-info';
      },
      academic(r) { return [r.dqnj ? r.dqnj + '级' : '', r.zymc, r.bjmc].filter(Boolean).join(' | '); },
      onTap(r) {
        // 学工队伍为教职工，不进入学生详情（源码 openStudentDetail 直接 return）
        if (this.meta.isStaff) return;
        window.mgo('/xsxq', { xh: r.xh, bjbh: r.bjbh });
      },
      onScroll(e) {
        const el = e.target;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) this.loadMore();
      },
      ...helpers,
    },
    mounted() {
      this.$scroller = this.$el.closest('.page');
      this.$onScroll = e => this.onScroll(e);
      this.$scroller && this.$scroller.addEventListener('scroll', this.$onScroll);
    },
    beforeUnmount() { this.$scroller && this.$scroller.removeEventListener('scroll', this.$onScroll); },
    template: `
      <div class="drill-content">
        <div class="search-wrap">
          <div class="search-bar">
            <span class="search-icon"></span>
            <input v-model="keyword" class="search-input" :placeholder="meta.placeholder" @keyup.enter="onSearch" @blur="onSearch" />
          </div>
        </div>
        <div class="filter-row">
          <div v-for="pill in filterPills" :key="pill.key" class="filter-pill" :class="{ active: pill.active }" @click="sheetKey = pill.key">
            <span>{{ pill.label }}</span><span class="filter-arrow">▾</span>
          </div>
        </div>
        <div class="list-head">
          <div class="list-head-top">
            <div class="title-line"><span class="title-line__txt">{{ meta.listTitle }}</span><span class="title-line__bar"></span></div>
            <span v-if="meta.sortLabel" class="sort-btn" @click="sortAsc = !sortAsc">⇅ {{ meta.sortLabel }}{{ sortAsc ? '' : '（倒序）' }}</span>
          </div>
          <div class="list-summary">
            <span>共 <span class="sum-num">{{ filtered.length }}</span> {{ meta.unit }}</span>
            <span v-for="(c, i) in summaryChips" :key="i" class="sum-chip" :class="'sum-chip--' + c.tone">{{ c.text }}</span>
          </div>
        </div>
        <div class="list-scroll">
          <div v-if="!records.length" class="empty-tip">暂无数据</div>
          <template v-else>
            <div v-for="r in records" :key="r.xh + r.zw" class="stu-card" @click="onTap(r)">
              <div class="stu-card__deco"></div>
              <div v-if="r.xjztmc" class="stu-card__status" :class="statusClass(r.xjztmc)">{{ r.xjztmc }}</div>
              <div class="stu-card__head">
                <div class="avatar" :class="avatarCls(r.xb)">{{ (r.xm || '?').slice(0, 1) }}</div>
                <div class="stu-card__info">
                  <div class="stu-card__name-row">
                    <span class="stu-card__name">{{ r.xm || '—' }}</span>
                    <span class="stu-card__xh"><span class="cap">🎓</span>{{ r.xh || '—' }}</span>
                    <span v-if="genderTxt(r.xb)" class="gender" :class="genderCls(r.xb)">{{ genderTxt(r.xb) }}</span>
                  </div>
                  <div v-if="academic(r)" class="stu-card__academic">{{ academic(r) }}</div>
                </div>
              </div>
              <div v-if="scope === 'xgdw' && (r.zw || r.dbs != null)" class="stu-card__panel">
                <div class="stu-card__row">
                  <span v-if="r.zw" class="stu-card__pill">{{ r.zw }}</span>
                  <span v-if="r.dbs != null" class="stu-card__pill">带班&nbsp;<span class="stu-card__num">{{ r.dbs }}</span>&nbsp;个</span>
                </div>
              </div>
              <div v-else-if="scope === 'xsrs' && r.fdyxm" class="stu-card__panel">
                <div class="stu-card__row stu-card__row--between">
                  <span class="stu-card__pill">辅导员：{{ r.fdyxm }}</span>
                </div>
              </div>
            </div>
            <div v-if="hasMore" class="load-more" @click="loadMore">上拉加载更多</div>
            <div v-else class="empty-tip">没有更多了</div>
          </template>
        </div>

        <teleport defer to=".phone">
          <div v-if="sheetKey" class="sheet-mask" @click.self="sheetKey = ''">
            <div class="sheet">
              <div class="sheet__title">选择{{ sheetLabel }}<span class="sheet__close" @click="sheetKey = ''">×</span></div>
              <div class="sheet__body">
                <div class="sheet__opt" :class="{ on: !filters[sheetKey] }" @click="pick('')">全部{{ sheetLabel }}</div>
                <div v-for="o in sheetOptions" :key="o.value" class="sheet__opt" :class="{ on: filters[sheetKey] === o.value }" @click="pick(o.value)">{{ o.label }}</div>
              </div>
            </div>
          </div>
        </teleport>
      </div>`,
  };

  /* ---------------- 班导师详情：与 PC 名单「详情」同一套字段 ---------------- */
  function detailCells(d) {
    d = d || {};
    const dash = v => (v === undefined || v === null || String(v).trim() === '' ? '-' : String(v));
    const xjqnjsLabel = v => (String(v) === '1' ? '是' : (String(v) === '0' ? '否' : '-'));
    return [
      ['工号', dash(d.gh)], ['姓名', dash(d.xm)], ['性别', window.dictLabel('xb', d.xb)], ['民族', dash(d.mz)],
      ['学院', dash(d.szxy)], ['学历(位)', dash(d.xlw)], ['类别', window.dictLabel('lb', d.lb)], ['职称', dash(d.zc)],
      ['出国深造', window.dictLabel('sfygcszjl', d.sfygcszjl)], ['工作单位', dash(d.gzdw)], ['联系电话', dash(d.lxdh)], ['新进青年教师', xjqnjsLabel(d.xjqnjs)],
      ['青年教师类型', window.dictLabel('xjqnjslx', d.xjqnjslx)], ['带班数量', dash(d.dbsl)], ['来源', d.ly === 'sdlr' ? '手动录入' : '教职工库'], ['带班班级', dash(d.bjTenure || d.bjmcs)], ['备注', dash(d.bz)],
    ];
  }

  const MFdyDetail = {
    props: { query: Object },
    computed: {
      gh() { return this.query.gh || S.role().gh; },
      row() {
        const b = (S.state.bds || []).find(x => x.gh === this.gh);
        return b ? S.bdsView(b) : null;
      },
      cells() { return this.row ? detailCells(this.row) : []; },
      rzRows() { return this.row ? S.rzRows(this.row.gh) : []; },
      selfView() { return this.gh === S.role().gh && S.role().key === 'bds'; },
    },
    methods: {
      cert() {
        if (!this.row || !window.downloadBdsCert) { window.mtoast('导出证明失败'); return; }
        try { window.downloadBdsCert(this.row); window.mtoast('已下载班导师证明'); }
        catch (e) { window.mtoast('导出证明失败'); }
      },
      back: window.mback,
    },
    template: `
      <div class="bds-detail">
        <div v-if="selfView" class="info-tip">班导师不能维护本人资料，如需更正请联系辅导员或学院班导师专干。</div>
        <template v-if="row">
          <div class="section">
            <div class="section__head"><span class="section__title">基本信息</span><span class="section__bar"></span></div>
            <div class="info-card">
              <div class="info-card__body">
                <div v-for="c in cells" :key="c[0]" class="info-row"><span class="info-row__label">{{ c[0] }}</span><span class="info-row__value">{{ c[1] }}</span></div>
              </div>
            </div>
          </div>
          <div class="section">
            <div class="sec-head">
              <div class="section__head"><span class="section__title">历年带班</span><span class="section__bar"></span></div>
              <div v-if="rzRows.length" class="count-chip">共&nbsp;<span class="count-chip__num">{{ rzRows.length }}</span>&nbsp;条</div>
            </div>
            <div v-if="!rzRows.length" class="empty-card">暂无带班履历</div>
            <div v-for="(r, i) in rzRows" :key="i" class="rec-card">
              <div class="rec-card__head">
                <span class="idx-badge">{{ i + 1 }}</span>
                <span class="rec-card__title">{{ r.bjmc }}</span>
                <span class="st-chip" :class="r.zt === '在任' ? 'st-chip--success' : 'st-chip--muted'">{{ r.zt }}</span>
              </div>
              <div class="rec-card__body">
                <div class="info-row"><span class="info-row__label">学年</span><span class="info-row__value">{{ r.xn || '—' }}</span></div>
                <div class="info-row"><span class="info-row__label">开始日期</span><span class="info-row__value">{{ r.ksrq || '—' }}</span></div>
                <div class="info-row"><span class="info-row__label">结束日期</span><span class="info-row__value">{{ r.jsrq || '—' }}</span></div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-card">当前账号不在班导师名单中</div>
        <teleport defer to=".phone">
          <div class="detail-foot">
            <div class="foot-btn foot-btn--ghost" @click="back">返回</div>
            <div v-if="row" class="foot-btn foot-btn--primary" @click="cert">导出证明</div>
          </div>
        </teleport>
      </div>`,
  };


  /* ---------------- 学生详情 xsxq ---------------- */
  const XSXQ_TABS = [
    { key: 'grxx', label: '个人信息' }, { key: 'xyxx', label: '学业信息' }, { key: 'zhsz', label: '综合素质' },
    { key: 'rcsw', label: '日常事务' }, { key: 'strz', label: '社团日志' }, { key: 'gat', label: '港澳台' }, { key: 'xjxz', label: '新疆西藏籍' },
  ];
  const MXsxq = {
    props: { query: Object },
    data() { return { XSXQ_TABS, activeTab: 'grxx', closed: {} }; },
    computed: {
      d() { return M.studentDetail(this.query.xh, this.query.bjbh); },
      classText() { return this.d ? [this.d.dqnj ? this.d.dqnj + '级' : '', this.d.bjmc].filter(Boolean).join('-') : ''; },
      sections() {
        const d = this.d;
        if (!d || this.activeTab !== 'grxx') return [];
        const fdy = d.fdyxx[0] || {};
        const bds = d.bdsxx[0] || {};
        return [
          {
            title: '基本信息', rows: [
              ['姓名拼音', d.xmpy], ['出生年月', d.csrq], ['婚否', d.hyzk], ['籍贯', d.jg], ['民族', d.mz], ['宗教信仰', d.zjxy], ['政治面貌', d.zzmm],
              ['辅导员姓名', fdy.xm], ['辅导员工号', fdy.gh], ['辅导员电话', fdy.lxdh],
              ['班导师姓名', bds.xm, 1], ['班导师工号', bds.gh, 1], ['班导师电话', bds.lxdh, 1],
            ],
          },
          { title: '联系信息', rows: [['国籍', d.gjdq], ['生源地', d.syd], ['家庭所在地', d.jtszd], ['本人电话', d.sjh], ['身份证号', d.sfzh], ['电子邮箱', d.yx], ['银行卡号', d.yhkh], ['开户行', d.khh], ['家庭住址', d.jtzz]] },
          { title: '学籍信息', rows: [['培养层次', d.pycc], ['学生类别', d.xslx], ['入学年级', d.rxnf ? d.rxnf + '级' : ''], ['当前年级', d.dqnj ? d.dqnj + '级' : ''], ['学籍状态', d.xjztmc]] },
          { title: '住宿信息', rows: [['住宿类型', ''], ['所在校区', ''], ['宿舍楼栋', ''], ['房间号', ''], ['床位号', '']] },
        ];
      },
    },
    methods: { ...helpers },
    template: `
      <div v-if="!d" class="xq-empty">未找到该学生</div>
      <div v-else>
        <div class="xq-head">
          <div class="avatar" :class="avatarCls(d.xb)">{{ d.xm.slice(0, 1) }}</div>
          <div class="xq-head-info">
            <div class="xq-name-row">
              <span class="xq-name">{{ d.xm }}</span><span class="xq-xh">{{ d.xh }}</span>
              <span class="gender" :class="genderCls(d.xb)">{{ genderTxt(d.xb) }}</span>
            </div>
            <div class="xq-meta-row"><span>{{ d.zymc || '—' }}</span><template v-if="classText"><span>|</span><span>{{ classText }}</span></template></div>
            <div class="xq-chips"><span class="xq-chip xq-chip--blue">学制:{{ d.xz }}年</span><span class="xq-chip xq-chip--warn">{{ d.xjztmc }}</span></div>
          </div>
        </div>
        <div class="xq-panel">
          <div class="xq-tabs">
            <div v-for="t in XSXQ_TABS" :key="t.key" class="xq-tab" :class="{ active: t.key === activeTab }" @click="activeTab = t.key">
              <span>{{ t.label }}</span><span class="xq-tab-line" :class="{ show: t.key === activeTab }"></span>
            </div>
          </div>
          <div class="xq-content">
            <template v-if="sections.length">
              <div v-for="sec in sections" :key="sec.title" class="xq-card">
                <div class="xq-card-head" @click="closed[sec.title] = !closed[sec.title]">
                  <span class="xq-card-icon"></span><span class="xq-card-title">{{ sec.title }}</span>
                  <span class="xq-card-arrow">{{ closed[sec.title] ? '▼' : '▲' }}</span>
                </div>
                <div v-if="!closed[sec.title]" class="xq-rows">
                  <template v-for="(row, ri) in sec.rows" :key="ri">
                    <div class="xq-row" :class="{ hl: row[2] }"><span class="xq-label">{{ row[0] }}</span><span class="xq-value">{{ dash(row[1]) }}</span></div>
                    <div v-if="ri < sec.rows.length - 1" class="xq-divider"></div>
                  </template>
                </div>
              </div>
            </template>
            <div v-else class="xq-empty">暂无数据（非班导师模块范围）</div>
          </div>
        </div>
      </div>`,
  };

  /* ---------------- 我的 ---------------- */
  const MMy = {
    props: { query: Object },
    data() { return { roleSheet: false }; },
    computed: {
      role() { return S.role(); },
      roles() { return window.ROLES; },
      me() { return S.findJzg(this.role.gh) || {}; },
    },
    methods: {
      switchRole(k) {
        S.setRole(k);
        this.roleSheet = false;
        window.mtoast('已切换为：' + this.role.jsmc);
      },
      go: window.mgo,
      reset() { S.reset(); },
      ...helpers,
    },
    template: `
      <div>
        <div class="my-head">
          <div class="avatar" :class="avatarCls(me.xb)">{{ role.xm.slice(0, 1) }}</div>
          <div><div class="my-name">{{ role.xm }}</div><div class="my-sub">工号 {{ role.gh }} · {{ role.jsmc }}</div></div>
        </div>
        <div class="my-group">
          <div class="my-item" @click="go('/fdydetail', { gh: role.gh, rylx: '4' })">我的档案<span class="my-item__arrow"></span></div>
        </div>
        <div class="my-group">
          <div class="my-item" @click="roleSheet = true">切换角色<span class="my-item__val">{{ role.jsmc }}</span><span class="my-item__arrow"></span></div>
          <div class="my-item" @click="reset">重置演示数据<span class="my-item__arrow"></span></div>
          <a class="my-item" href="index.html" style="color:inherit;text-decoration:none">打开 PC 端原型<span class="my-item__arrow"></span></a>
        </div>
        <teleport defer to=".phone">
          <div v-if="roleSheet" class="sheet-mask" @click.self="roleSheet = false">
            <div class="sheet">
              <div class="sheet__title">切换角色<span class="sheet__close" @click="roleSheet = false">×</span></div>
              <div class="sheet__body">
                <div v-for="r in roles" :key="r.key" class="role-opt" :class="{ on: r.key === role.key }" @click="switchRole(r.key)">
                  <span>{{ r.jsmc }}（{{ r.xm }}）</span><small>工号 {{ r.gh }}</small>
                </div>
              </div>
            </div>
          </div>
        </teleport>
      </div>`,
  };

  /* ---------------- 外壳 ---------------- */
  const PAGES = {
    '/home': { comp: MHome, title: '首页', tab: true },
    '/my': { comp: MMy, title: '我的', tab: true },
    '/drill': { comp: MDrill, title: q => (DRILL_META[q.scope === 'xsrs' ? 'xsrs' : 'xgdw'] || {}).title },
    '/fdydetail': { comp: MFdyDetail, title: '班导师详情', noTabbar: true },
    '/xsxq': { comp: MXsxq, title: '学生详情' },
  };

  window.mountMobile = function () {
    const app = createApp({
      setup() {
        const page = computed(() => PAGES[route.path] || PAGES['/home']);
        const title = computed(() => (typeof page.value.title === 'function' ? page.value.title(route.query) : page.value.title));
        const clock = computed(() => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); });
        const viewKey = computed(() => route.path + '?' + JSON.stringify(route.query) + '|' + S.session.roleKey);
        const roleKey = computed({ get: () => S.session.roleKey, set: v => S.setRole(v) });
        return { route, page, title, clock, toast, viewKey, roleKey, roles: window.ROLES, go: window.mgo, back: window.mback, reset: () => S.reset() };
      },
      template: `
        <div class="m-side">
          <h3>班导师模块 · 移动端原型</h3>
          <div>当前角色</div>
          <select v-model="roleKey"><option v-for="r in roles" :key="r.key" :value="r.key">{{ r.jsmc }}（{{ r.xm }} {{ r.gh }}）</option></select>
          <div class="m-side__links">
            <a href="#/home">首页 · 队伍总体 / 优秀班导师</a>
            <a href="#/drill?scope=xgdw">学工队伍下钻名单</a>
            <a href="#/drill?scope=xgdw&dwlx=班导师">学工队伍 · 仅班导师</a>
            <a href="#/fdydetail?gh=222318&rylx=4">班导师详情（周明远）</a>
            <a href="#/drill?scope=xsrs">我带班学生名单（班导师角色）</a>
            <a href="index.html">← PC 端原型</a>
          </div>
          <button class="m-side__btn" @click="reset">重置演示数据</button>
          <p style="color:#8a96a3;font-size:12px">与 PC 端共用同一份本地数据：在 PC 端调整班导师带班后，这里的带班数、带班信息和学生详情里的班导师会同步变化。</p>
        </div>
        <div class="phone">
          <div class="phone-head-bg"></div>
          <div class="status-bar"><span>{{ clock }}</span><span>●●● ▮</span></div>
          <div class="nav-bar">
            <span v-if="!page.tab" class="nav-bar__back" @click="back"></span>
            {{ title }}
          </div>
          <div class="page" :key="viewKey">
            <component :is="page.comp" :query="route.query" />
          </div>
          <div v-if="!page.noTabbar" class="tabbar">
            <div class="tabbar__item" :class="{ on: route.path === '/home' }" @click="go('/home')"><span class="tabbar__ic"></span>首页</div>
            <div class="tabbar__item" :class="{ on: route.path === '/my' }" @click="go('/my')"><span class="tabbar__ic"></span>我的</div>
          </div>
          <div v-if="toast.text" class="m-toast">{{ toast.text }}</div>
        </div>`,
    });
    app.mount('#app');
  };
})();
