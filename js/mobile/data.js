/*
 * 移动端派生数据：全部从 PC 端同一份 Store（localStorage）推导，PC 端改名单/带班后移动端同步可见。
 * 对应接口：
 *   学工队伍下钻  /yw/.../xgdw（fdyDrill scope=xgdw，行字段 name/gh/xb/status/role/dbs）
 *   教职工详情    find_JzgxqxxBygh + fdyFdyxxGetByGh（fdydetail，rylx=4 班导师）
 *   学生详情      getXsgrxx（xsxq，bdsxx[0] → 班导师姓名/工号/电话）
 *   校领导首页    getDwztqk（队伍总体情况）/ getYxbds（优秀班导师）
 */
(function () {
  const S = window.Store;
  const U = window.SEED_UTIL;

  function hash(str) {
    let h = 0;
    String(str).split('').forEach(ch => { h = (h * 31 + ch.charCodeAt(0)) >>> 0; });
    return h;
  }
  const pick = (arr, seed) => arr[seed % arr.length];
  const phoneOf = seed => '1' + pick(['35', '37', '38', '39', '58', '59', '86', '88'], seed) + String(10000000 + (seed * 7919) % 89999999);
  const fdyGh = (xybm, xm) => '19' + String(hash(xybm + xm) % 10000).padStart(4, '0');
  const leaveOf = gh => (hash(gh) % 13 === 0 ? '请假' : '在岗');
  const bjlxText = v => (String(v) === '0' ? '本科生' : String(v) === '1' ? '硕士生' : String(v) === '2' ? '博士生' : String(v || ''));

  /** 学工队伍：辅导员（班级 fdyxm 去重）+ 班导师（班导师名单）+ 副书记（每院 1 名） */
  function staffAll() {
    const st = S.state;
    const list = [];
    const fdyMap = {};
    st.classes.forEach(c => {
      if (!c.fdyxm) return;
      const k = c.xybm + '|' + c.fdyxm;
      if (!fdyMap[k]) fdyMap[k] = { xm: c.fdyxm, xybm: c.xybm, szxy: c.xymc, dbs: 0 };
      fdyMap[k].dbs++;
    });
    Object.values(fdyMap).forEach(f => {
      const gh = fdyGh(f.xybm, f.xm);
      list.push({ xm: f.xm, xh: gh, gh, xb: hash(f.xm) % 3 === 0 ? '2' : '1', xjztmc: leaveOf(gh), zw: '辅导员', dbs: f.dbs, xybm: f.xybm, szxy: f.szxy });
    });
    st.bds.forEach(b => {
      list.push({ xm: b.xm, xh: b.gh, gh: b.gh, xb: b.xb, xjztmc: leaveOf(b.gh), zw: '班导师', dbs: (b.bjbhList || []).length, xybm: b.xybm, szxy: b.szxy, isBds: true });
    });
    st.colleges.forEach(c => {
      const own = st.jzg.find(j => j.xybm === c.xybm && j.gh === '210356');
      const j = own || st.jzg.find(x => x.xybm === c.xybm && !st.bds.some(b => b.gh === x.gh)) || st.jzg.find(x => x.xybm === c.xybm);
      if (!j) return;
      list.push({ xm: j.xm, xh: j.gh, gh: j.gh, xb: j.xb, xjztmc: '在岗', zw: '副书记', dbs: null, xybm: c.xybm, szxy: c.xymc });
    });
    return list;
  }

  function staffScoped() {
    const r = S.role();
    const all = staffAll();
    return r.scope === 'all' ? all : all.filter(x => x.xybm === r.xybm);
  }

  /** 校领导首页·队伍总体情况（getDwztqk） */
  function teamOverall() {
    const all = staffAll();
    const fdy = all.filter(x => x.zw === '辅导员').length;
    const bds = all.filter(x => x.zw === '班导师').length;
    const fsj = all.filter(x => x.zw === '副书记').length;
    const total = fdy + bds + fsj;
    const stu = S.state.classes.reduce((s, c) => s + (Number(c.xsrs) || 0), 0);
    const pct = v => (total ? Math.round((v / total) * 1000) / 10 : 0);
    return {
      total,
      ratio: total ? Math.round(stu / total) : 0,
      pie: [
        { name: '辅导员', value: pct(fdy), color: '#3087cc' },
        { name: '班导师', value: pct(bds), color: '#1bb975' },
        { name: '副书记', value: pct(fsj), color: '#ff9800' },
      ],
    };
  }

  /** 校领导首页·优秀班导师（getYxbds）：各学院当选数 + 当选/总数/学院覆盖率 */
  function tutorStat() {
    const st = S.state;
    const elected = (st.yxbds || []).filter(a => String(a.lczt) === '3' && !a.sfsc);
    const colleges = st.colleges.map(c => ({ name: c.xymc, value: elected.filter(a => a.xybm === c.xybm).length }));
    const covered = colleges.filter(c => c.value > 0).length;
    return {
      bars: colleges,
      electedCount: elected.length,
      totalCount: st.bds.length,
      coverageRate: st.colleges.length ? Math.round((covered / st.colleges.length) * 100) : 0,
    };
  }

  /** 班导师/教职工档案（fdydetail grxxVal 取值口径：FDY_FDYXX 优先，学籍教职工表兜底） */
  function profile(gh) {
    const st = S.state;
    const b = st.bds.find(x => x.gh === gh);
    const j = S.findJzg(gh) || {};
    const base = Object.assign({}, j, b || {});
    if (!base.xm) {
      const s = staffAll().find(x => x.gh === gh);
      if (s) Object.assign(base, s);
    }
    const seed = hash(gh || 'x');
    const classes = ((b && b.bjbhList) || []).map(bh => st.classes.find(c => c.bjbh === bh)).filter(Boolean);
    const stuCount = classes.reduce((s, c) => s + (Number(c.xsrs) || 0), 0);
    const birthY = 1975 + (seed % 18);
    const rzkssj = (b && b.rzkssj) || '2021-09-01';
    const xl = base.xlw || '硕士';
    const zgxl = xl === '博士' ? '博士研究生' : xl === '硕士' ? '硕士研究生' : '大学本科';
    const schools = ['中南大学', '湖南大学', '华中科技大学', '武汉大学', '中山大学', '四川大学'];
    return {
      gh,
      xm: base.xm || '',
      xb: base.xb === '2' ? '女' : base.xb === '1' ? '男' : '',
      xbCode: base.xb,
      csrq: birthY + '-' + U.pad(1 + (seed % 12)),
      mz: base.mz || '汉族',
      zzmm: base.zzmm || '中共党员',
      sfzh: '4301' + '**********' + String(1000 + (seed % 9000)),
      hyzk: seed % 5 === 0 ? '未婚' : '已婚',
      syzk: seed % 5 === 0 ? '未育' : '已育',
      zyjszw: base.zc || '',
      cjgzsj: (birthY + 26) + '-07',
      drfdysj: rzkssj,
      gwxz: '兼职',
      sfwssmzfdy: '否',
      xxmc: '中南大学',
      ejdw: base.szxy || '',
      ejdwlb: '院系',
      zw: seed % 7 === 0 ? '系副主任' : '',
      zwdj: seed % 7 === 0 ? '副科级' : '',
      sfwgjxsfdy: '否',
      sfwbybfdy: classes.some(c => c.nj === '2022') ? '是' : '否',
      dxsqk: classes.length ? '本科生' : '',
      dzksrs: 0, dbksrs: stuCount, dyjsrs: 0, dgjxsrs: 0,
      pygx: '事业编制',
      nsr: '',
      ndfdygwjt: classes.length ? ((b && b.xjqnjs === '1') ? 4800 : 2400) : '',
      ndtxbt: '',
      sfrzxsss: '否',
      zgxl, xl,
      byyx: pick(schools, seed),
      zymc: pick(['计算机科学与技术', '软件工程', '管理科学与工程', '应用数学', '临床医学', '机械工程'], seed >> 3),
      zhxw: xl === '博士' ? '博士' : xl === '硕士' ? '硕士' : '学士',
      xwsyyx: pick(schools, seed),
      xylb: '学术学位',
      bshjl: xl === '博士' && seed % 3 === 0 ? '有' : '无',
      dacfc: '中南大学人事处',
      bghm: '0731-8887' + String(1000 + (seed % 9000)).slice(0, 4),
      yx: (gh || 'demo') + '@demo.edu.cn',
      lxdh: base.lxdh || phoneOf(seed),
      wxzh: 'wx_' + (gh || ''),
      qqhm: String(100000000 + (seed % 899999999)),
      yb: '410083',
      txdz: '湖南省长沙市岳麓区麓山南路 932 号',
      szbm: base.szxy || '',
      dqzt: leaveOf(gh) === '请假' ? '1' : '0',
      latestXgsj: b ? (b.xgsj || b.cjsj || '') : '',
      isBds: !!b,
      dbbList: classes.map(c => {
        const rz = (st.bdsRz || []).find(r => r.gh === gh && r.bjbh === c.bjbh && !r.jsrq);
        return {
          bjbh: c.bjbh, bjmc: c.bjmc, bjlxText: bjlxText(c.bjlx), nj: c.nj, zymc: c.zymc, xymc: c.xymc,
          xsrs: c.xsrs, bdsxm: S.bdsOfClass(c.bjbh).map(x => x.xm).join('、'),
          xn: rz ? S.xnText(rz.xn, rz.ksrq) : '',
          qzsj: rz ? ((rz.ksrq || '') + ' 至 ' + (rz.jsrq || '至今')) : '',
        };
      }),
      rzList: (st.bdsRz || []).filter(r => r.gh === gh).slice().sort((a, b) => (a.ksrq < b.ksrq ? 1 : -1)).map(r => {
        const c = st.classes.find(x => x.bjbh === r.bjbh) || {};
        return { bjbh: r.bjbh, bjmc: c.bjmc || r.bjbh, xn: S.xnText(r.xn, r.ksrq), ksrq: r.ksrq, jsrq: r.jsrq || '至今', zt: r.jsrq ? '已结束' : '在任' };
      }),
    };
  }

  /** 学工日志统计（getWeekWorkStatsByGh），按 本周/本月/本学期 */
  function xgrzStats(gh, tab) {
    const seed = hash(gh + tab);
    const mul = tab === '1' ? 1 : tab === '2' ? 4 : 18;
    const keys = ['sscq', 'xxck', 'ksxk', 'txth', 'jxgt', 'xghy', 'xxjb'];
    const out = {};
    keys.forEach((k, i) => { out[k] = ((seed >> i) % 4) * mul + (i === 3 ? mul : 0); });
    out.xxjb = (seed % 3 === 0 ? 1 : 0) * Math.ceil(mul / 4);
    return out;
  }

  /** 操作及审核日志（fdyCzrzxxListByGh） */
  function czrzList(gh) {
    const p = profile(gh);
    if (!p.isBds) return [];
    const base = p.latestXgsj || S.now();
    return [
      { xgmk: '带班信息', xgr: '王立新', xgsj: base, shzt: '3' },
      { xgmk: '联系信息', xgr: p.xm, xgsj: '2026-09-12 10:24:31', shzt: '1', shrr: '刘佳', shsj: '2026-09-12 15:02:10', shyj: '信息属实，同意。' },
      { xgmk: '学历学位信息', xgr: p.xm, xgsj: '2026-10-20 09:16:05', shzt: '0' },
    ];
  }

  /** 班级学生 + 学生详情所需的辅导员/班导师信息 */
  function studentsOfClass(bjbh) {
    const c = S.state.classes.find(x => x.bjbh === bjbh) || {};
    return S.studentsOf(bjbh).map(s => Object.assign({}, s, {
      bjbh, fdyxm: c.fdyxm || '', xjztmc: '在读', mz: hash(s.xh) % 9 === 0 ? '土家族' : '汉族',
    }));
  }

  function studentDetail(xh, bjbh) {
    const stu = studentsOfClass(bjbh).find(s => s.xh === xh);
    if (!stu) return null;
    const c = S.state.classes.find(x => x.bjbh === bjbh) || {};
    const seed = hash(xh);
    const bds = S.bdsOfClass(bjbh)[0];
    const fdy = c.fdyxm ? { xm: c.fdyxm, gh: fdyGh(c.xybm, c.fdyxm), lxdh: phoneOf(hash(c.fdyxm)) } : {};
    return Object.assign({}, stu, {
      xmpy: '', hyzk: '未婚', jg: pick(['湖南长沙', '湖南株洲', '湖北武汉', '广东广州', '江西南昌', '河南郑州'], seed),
      zjxy: '无', zzmm: pick(['共青团员', '共青团员', '群众', '中共预备党员'], seed >> 2),
      gjdq: '中国', syd: pick(['湖南省', '湖北省', '广东省', '江西省', '河南省'], seed >> 1),
      jtszd: pick(['长沙市', '株洲市', '武汉市', '广州市', '南昌市'], seed >> 3),
      sfzh: '4301**********' + String(1000 + (seed % 9000)), yx: stu.xh + '@stu.demo.edu.cn',
      yhkh: '6217 **** **** ' + String(1000 + (seed % 9000)), khh: '中国建设银行', jtzz: '（演示数据）',
      pycc: '本科', xslx: '普通本科生', xz: '4',
      fdyxx: [fdy],
      bdsxx: bds ? [{ xm: bds.xm, gh: bds.gh, lxdh: bds.lxdh }] : [],
    });
  }

  window.MData = { staffAll, staffScoped, teamOverall, tutorStat, profile, xgrzStats, czrzList, studentsOfClass, studentDetail, bjlxText };
})();
