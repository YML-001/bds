/* 演示数据生成：全部为虚构人员信息，固定随机种子，重置后结果一致 */
(function () {
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  const pad = n => (n < 10 ? '0' + n : '' + n);
  const fmtDate = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const fmtTime = d => fmtDate(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  window.SEED_UTIL = { fmtDate, fmtTime, addDays, pad, rng };

  window.buildSeed = function () {
    const r = rng(20261027);
    const pick = arr => arr[Math.floor(r() * arr.length)];
    const today = new Date();
    today.setHours(9, 30, 0, 0);

    const colleges = [
      { xybm: '001001001001', xymc: '基础医学院' },
      { xybm: '001001001007', xymc: '计算机学院' },
      { xybm: '001001001012', xymc: '商学院' },
      { xybm: '001001001015', xymc: '机电工程学院' },
      { xybm: '001001001018', xymc: '化学化工学院' },
      { xybm: '001001001021', xymc: '土木工程学院' },
      { xybm: '001001001024', xymc: '文学院' },
      { xybm: '001001001027', xymc: '数学与统计学院' },
      { xybm: '001001001031', xymc: '湘雅医学院' },
    ];
    window.__collegeMap = {};
    colleges.forEach(c => { window.__collegeMap[c.xybm] = c.xymc; });
    const majorsByCollege = {
      '001001001001': ['基础医学', '生物医学', '法医学'],
      '001001001007': ['计科', '软件工程', '人工智能', '大数据'],
      '001001001012': ['会计学', '金融学', '工商管理'],
      '001001001015': ['机械工程', '测控技术'],
      '001001001018': ['化学工程', '应用化学'],
      '001001001021': ['土木工程', '工程管理'],
      '001001001024': ['汉语言文学', '新闻学'],
      '001001001027': ['数学', '统计学'],
      '001001001031': ['临床医学', '护理学'],
    };
    const xnList = [
      { id: 'xn2023', mc: '2023-2024 学年', qsnf: '2023', jsnf: '2024' },
      { id: 'xn2024', mc: '2024-2025 学年', qsnf: '2024', jsnf: '2025' },
      { id: 'xn2025', mc: '2025-2026 学年', qsnf: '2025', jsnf: '2026' },
      { id: 'xn2026', mc: '2026-2027 学年', qsnf: '2026', jsnf: '2027' },
    ];

    // 班级
    const classes = [];
    const fdyNames = ['唐思远', '彭雅琴', '龙子涵', '谭立伟', '罗晓燕', '贺文博', '曾一鸣', '邓紫薇', '田浩然', '蒋梦琪', '毛俊杰', '肖雨桐'];
    colleges.forEach((c, ci) => {
      const majors = majorsByCollege[c.xybm];
      let k = 0;
      ['22', '23', '24', '25'].forEach(nj => {
        majors.forEach((m, mi) => {
          const count = c.xybm === '001001001007' ? 2 : 1;
          for (let i = 1; i <= count; i++) {
            if (r() < 0.25 && c.xybm !== '001001001007') continue;
            k++;
            classes.push({
              bjbh: '20' + nj + pad(ci + 1) + pad(mi + 1) + pad(i),
              bjmc: m + nj + pad(i),
              xybm: c.xybm,
              xymc: c.xymc,
              zybh: c.xybm.slice(-2) + pad(mi + 1), zymc: m,
              nj: '20' + nj,
              bjlx: '0',
              fdyxm: fdyNames[(ci + k) % fdyNames.length],
              xsrs: 26 + Math.floor(r() * 14),
            });
          }
        });
      });
    });

    // 教职工池（工号查询用）
    const surnames = '王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤'.split('');
    const given = ['志强', '晓明', '海燕', '丽娟', '建华', '文静', '国庆', '春燕', '振宇', '雪梅', '俊峰', '慧敏', '立新', '红霞', '子轩', '思雨', '博文', '佳怡', '浩宇', '欣怡', '宇航', '梦瑶', '鹏飞', '婉婷', '天佑', '若曦', '明哲', '雅婷', '景行', '书瑶', '承志', '安琪', '一帆', '晨曦', '凯文', '静怡', '泽宇', '诗涵', '嘉懿', '可欣'];
    const mzList = ['汉族', '汉族', '汉族', '汉族', '汉族', '土家族', '苗族', '回族', '侗族', '瑶族'];
    const zcList = ['讲师', '讲师', '副教授', '副教授', '教授', '助教', '特聘教授', '副研究员'];
    const xlwList = ['博士', '博士', '博士', '硕士', '硕士', '本科'];
    const jzg = [];
    const usedGh = {};
    function makeGh() {
      let gh;
      do { gh = String(200000 + Math.floor(r() * 30000)); } while (usedGh[gh]);
      usedGh[gh] = 1;
      return gh;
    }
    function phone() { return '1' + pick(['35', '37', '38', '39', '58', '59', '86', '88']) + String(Math.floor(10000000 + r() * 89999999)); }
    colleges.forEach(c => {
      if (c.xybm === '001001001031') return;
      const n = c.xybm === '001001001007' ? 26 : 10;
      for (let i = 0; i < n; i++) {
        jzg.push({
          gh: makeGh(), xm: pick(surnames) + pick(given), xb: r() < 0.62 ? '1' : '2', mz: pick(mzList),
          xybm: c.xybm, szxy: c.xymc, zc: pick(zcList), xlw: pick(xlwList), lxdh: phone(),
          zzmm: pick(['中共党员', '中共党员', '中共党员', '群众', '民主党派', '中共预备党员']),
        });
      }
    });
    // 角色用户（演示账号）
    const roleUsers = [
      { gh: '100231', xm: '王立新', xb: '1', mz: '汉族', xybm: 'xgb', szxy: '党委学生工作部', zc: '副研究员', xlw: '硕士', lxdh: '13874120231', zzmm: '中共党员' },
      { gh: '100108', xm: '赵建国', xb: '1', mz: '汉族', xybm: 'xgb', szxy: '党委学生工作部', zc: '研究员', xlw: '博士', lxdh: '13974100108', zzmm: '中共党员' },
      { gh: '210356', xm: '陈晓峰', xb: '1', mz: '汉族', xybm: '001001001007', szxy: '计算机学院', zc: '副教授', xlw: '博士', lxdh: '13807310356', zzmm: '中共党员' },
      { gh: '210417', xm: '刘佳', xb: '2', mz: '汉族', xybm: '001001001007', szxy: '计算机学院', zc: '讲师', xlw: '硕士', lxdh: '13687310417', zzmm: '中共党员' },
      { gh: '222318', xm: '周明远', xb: '1', mz: '汉族', xybm: '001001001007', szxy: '计算机学院', zc: '讲师', xlw: '博士', lxdh: '15873122318', zzmm: '中共党员' },
      { gh: '210588', xm: '周启明', xb: '1', mz: '汉族', xybm: '001001001007', szxy: '计算机学院', zc: '讲师', xlw: '硕士', lxdh: '13773120588', zzmm: '中共党员' },
      { gh: '219801', xm: '唐思远', xb: '1', mz: '汉族', xybm: '001001001007', szxy: '计算机学院', zc: '讲师', xlw: '硕士', lxdh: '13673119801', zzmm: '中共党员' },
      { gh: '210662', xm: '林书衡', xb: '1', mz: '汉族', xybm: '001001001007', szxy: '计算机学院', zc: '副教授', xlw: '博士', lxdh: '13573120662', zzmm: '中共党员' },
    ];
    roleUsers.forEach(u => { usedGh[u.gh] = 1; jzg.push(u); });

    // 班导师名单：每个学院取大部分教职工
    const bds = [];
    let bid = 1;
    const classPool = {};
    classes.forEach(c => { (classPool[c.xybm] = classPool[c.xybm] || []).push(c.bjbh); });
    const takeClasses = (xybm, n) => {
      const pool = classPool[xybm] || [];
      const out = [];
      for (let i = 0; i < n && pool.length; i++) out.push(pool.shift());
      return out;
    };
    jzg.forEach((t, idx) => {
      if (t.xybm === 'xgb' || t.gh === '210356' || t.gh === '210417' || t.gh === '210588' || t.gh === '219801' || t.gh === '210662') return;
      const isMe = t.gh === '222318';
      if (!isMe && r() < 0.15) return; // 部分教职工不是班导师（可用于“新增-工号查询”）
      const lb = r() < 0.86 ? '1' : pick(['2', '4', '5']);
      const xjqnjs = r() < 0.22 ? '1' : '0';
      const rzYear = 2019 + Math.floor(r() * 6);
      bds.push({
        id: 'bds' + bid++, gh: t.gh, xm: t.xm, xb: t.xb, mz: t.mz, xybm: t.xybm, szxy: t.szxy,
        xlw: t.xlw, lb, zc: t.zc, sfygcszjl: r() < 0.55 ? '1' : '0', gzdw: t.szxy, lxdh: t.lxdh,
        xjqnjs, xjqnjslx: xjqnjs === '1' ? pick(['1', '2', '3', '4']) : '',
        bz: '', bjbhList: isMe ? takeClasses(t.xybm, 2) : takeClasses(t.xybm, r() < 0.8 ? 1 : 2),
        sfjrfdy: !isMe && r() < 0.12, // 是否兼任辅导员（xj_jsybjglxx RYBJLX=3）
        rzkssj: isMe ? '2023-09-01' : rzYear + '-09-01',
        zzmm: t.zzmm, cjsj: fmtTime(addDays(today, -400 + idx)), ly: 'jzg',
      });
    });

    classes.forEach(c => { if (c.xybm === '001001001031') c.fdyxm = '秦牧之'; });
    const zhou = bds.find(b => b.gh === '222318');
    const tangPool = classes.filter(c => c.xybm === '001001001007' && !(zhou && (zhou.bjbhList || []).includes(c.bjbh)));
    tangPool.slice(0, 4).forEach(c => { c.fdyxm = '唐思远'; });
    tangPool.slice(0, 2).forEach(c => {
      bds.forEach(b => { b.bjbhList = (b.bjbhList || []).filter(x => x !== c.bjbh); });
    });

    const bdsRz = [];
    let rzid = 1;
    const usedHist = {};
    function xnOf(iso) {
      const y = Number(String(iso).slice(0, 4));
      const m = Number(String(iso).slice(5, 7));
      const s = m >= 9 ? y : y - 1;
      return s + '-' + (s + 1);
    }
    bds.forEach(b => {
      const start0 = b.rzkssj || '2023-09-01';
      (b.bjbhList || []).forEach(bjbh => {
        bdsRz.push({ id: 'rz' + rzid++, gh: b.gh, bjbh, ksrq: start0, jsrq: '', xn: xnOf(start0), xq: '' });
      });
      const windows = [['2016-09-01', '2018-08-31'], ['2014-09-01', '2016-08-31'], ['2012-09-01', '2014-08-31']];
      const n = b.gh === '222318' ? 2 : (1 + (Number(String(b.gh).slice(-1)) % 2));
      let left = n;
      windows.forEach(([ksrq, end]) => {
        if (!left) return;
        const pool = classes.filter(c => {
          if (c.xybm !== b.xybm || (b.bjbhList || []).includes(c.bjbh)) return false;
          const slot = c.bjbh + '|' + ksrq;
          if (usedHist[slot]) return false;
          return !bdsRz.some(r => r.bjbh === c.bjbh && r.ksrq <= end && (!r.jsrq || r.jsrq >= ksrq));
        });
        pool.slice(0, left).forEach(c => {
          usedHist[c.bjbh + '|' + ksrq] = 1;
          bdsRz.push({ id: 'rz' + rzid++, gh: b.gh, bjbh: c.bjbh, ksrq, jsrq: end, xn: xnOf(ksrq), xq: '' });
          left--;
        });
      });
    });
    bdsRz.forEach(r => { if (!r.xn && r.ksrq) r.xn = xnOf(r.ksrq); });

    // 优秀班导师评选批次（fdy_yxbdspcxx）
    const allXybm = colleges.map(c => c.xybm);
    const allXymc = colleges.map(c => c.xymc);
    const yxbdsPc = [
      {
        id: 'pc1', pcmc: '2025-2026学年优秀班导师评选', xnid: 'xn2025', xnmc: '2025-2026 学年',
        pckssj: fmtDate(addDays(today, -12)), pcjssj: fmtDate(addDays(today, 18)),
        gskssj: fmtDate(addDays(today, 20)), gsjssj: fmtDate(addDays(today, 26)),
        xybm: allXybm.join(','), xymc: allXymc.join(','), mebl: 12, sfkcp: 0, rzsczx: 9, ext1: '1', cjsj: fmtTime(addDays(today, -20)),
      },
      {
        id: 'pc2', pcmc: '2024-2025学年优秀班导师评选', xnid: 'xn2024', xnmc: '2024-2025 学年',
        pckssj: '2025-09-01', pcjssj: '2025-09-30', gskssj: '2025-10-08', gsjssj: '2025-10-15',
        xybm: allXybm.join(','), xymc: allXymc.join(','), mebl: 15, sfkcp: 0, rzsczx: 12, ext1: '1', cjsj: '2025-08-25 10:12:00',
      },
      {
        id: 'pc3', pcmc: '2026-2027学年优秀班导师评选（预设）', xnid: 'xn2026', xnmc: '2026-2027 学年',
        pckssj: fmtDate(addDays(today, 300)), pcjssj: fmtDate(addDays(today, 330)), gskssj: '', gsjssj: '',
        xybm: allXybm.join(','), xymc: allXymc.join(','), mebl: 10, sfkcp: 1, rzsczx: 6, ext1: '0', cjsj: fmtTime(addDays(today, -2)),
      },
    ];

    // 优秀班导师流程工单（fdy_yxbdsxx + 工单）
    const NODES = window.YXBDS_NODES;
    const yxbds = [];
    let woSeq = 1;
    const cs = bds.filter(b => b.xybm === '001001001007' && b.gh !== '222318' && !b.sfjrfdy);
    const others = bds.filter(b => b.xybm !== '001001001007' && !b.sfjrfdy);
    function mkApp(b, pcid, nodeIdx, result, daysAgo) {
      const rolesByNode = NODES.map((n, i) => window.yxNodeUser(i, b.xybm));
      const pc = yxbdsPc.find(p => p.id === pcid);
      const created = addDays(today, -daysAgo);
      const bj = classes.find(c => c.bjbh === b.bjbhList[0]) || {};
      const app = {
        id: 'yx' + woSeq, workOrderCode: 'YXBDS' + created.getFullYear() + pad(created.getMonth() + 1) + pad(created.getDate()) + pad(woSeq) + '0' + (100 + woSeq),
        pcid, pcxnid: pc.xnid, pcxnmc: pc.xnmc, xm: b.xm, gh: b.gh, xb: b.xb, xybm: b.xybm, szxy: b.szxy,
        zzmm: b.zzmm || '中共党员', rzkssj: b.rzkssj, rzjssj: pcid === 'pc2' ? '2025-08-31' : '2026-08-31', zw: b.zc.indexOf('教授') >= 0 ? (b.zc.indexOf('副') >= 0 ? '副教授' : '教授') : '讲师',
        lxdh: b.lxdh, bjbh: bj.bjbh || '', bjmc: bj.bjmc || '', sfccpbb: r() < 0.5 ? '1' : '0',
        zysj: '担任' + (bj.bjmc || '') + '班导师期间，坚持每周深入班级开展主题班会与谈心谈话，指导班级获评校级优良学风班；关注学生学业与心理状况，帮扶学业困难学生 6 人，班级四级通过率 92%。',
        zmcl: [{ name: '班级获奖证明.pdf', size: '1.2MB' }, { name: '学生评价汇总.docx', size: '86KB' }],
        createTime: fmtTime(created), createUser: b.xm, records: [], currentNode: nodeIdx, flowStatus: 1, lczt: '1', shzt: '0',
      };
      woSeq++;
      app.records.push({ node: '申请', user: b.xm, role: '班导师', action: '提交', opinion: '', time: fmtTime(created) });
      for (let i = 1; i < nodeIdx; i++) {
        const t = addDays(created, i);
        const ru = rolesByNode[i];
        app.records.push({ node: NODES[i].name, user: ru.user, role: ru.roleName, action: '同意', opinion: '同意', time: fmtTime(t) });
      }
      if (result === 'pass') {
        for (let i = nodeIdx; i < NODES.length; i++) {
          const ru = rolesByNode[i];
          app.records.push({ node: NODES[i].name, user: ru.user, role: ru.roleName, action: '同意', opinion: '同意', time: fmtTime(addDays(created, i)) });
        }
        app.currentNode = NODES.length; app.flowStatus = 3; app.lczt = '3'; app.shzt = '3';
      } else if (result === 'reject') {
        const ru = rolesByNode[nodeIdx];
        app.records.push({ node: NODES[nodeIdx].name, user: ru.user, role: ru.roleName, action: '驳回', opinion: '任班导师期间班级工作材料不完整，建议下一年度再申报。', time: fmtTime(addDays(created, nodeIdx)) });
        app.flowStatus = 2; app.lczt = '2'; app.shzt = '2';
      } else if (result === 'draft') {
        app.records = []; app.currentNode = 0; app.flowStatus = 6; app.lczt = '0'; app.shzt = '';
      } else {
        app.shzt = window.yxShztByNode(nodeIdx);
      }
      yxbds.push(app);
      return app;
    }
    // 本批次（进行中）：覆盖各审批节点
    mkApp(cs[0], 'pc1', 1, null, 6);        // 待学院审核
    mkApp(cs[1], 'pc1', 2, null, 8);        // 待副书记审核
    mkApp(cs[2], 'pc1', 1, 'reject', 9);    // 学院审核驳回
    mkApp(others[0], 'pc1', 3, null, 9);    // 待专干审核
    mkApp(others[3], 'pc1', 4, null, 10);   // 待学工部审核
    mkApp(others[6], 'pc1', 1, null, 3);
    mkApp(others[9], 'pc1', 2, null, 5);
    mkApp(others[12], 'pc1', 1, null, 2);
    mkApp(cs[3], 'pc1', 0, 'draft', 1);
    mkApp(cs[6], 'pc1', 3, null, 7);        // 计算机学院已推荐（占名额）
    mkApp(cs[7], 'pc1', 1, null, 4);        // 计算机学院待学院审核（用于演示名额超限）
    // 上一批次（已结束）
    mkApp(cs[4], 'pc2', 1, 'pass', 400);
    mkApp(cs[5], 'pc2', 1, 'pass', 401);
    mkApp(others[1], 'pc2', 1, 'pass', 402);
    mkApp(others[4], 'pc2', 1, 'pass', 403);
    mkApp(others[7], 'pc2', 3, 'reject', 404);
    mkApp(others[10], 'pc2', 1, 'pass', 405);
    yxbdsPc.push({
      id: 'pc0', pcmc: '2023-2024学年优秀班导师评选', xnid: 'xn2023', xnmc: '2023-2024 学年',
      pckssj: '2024-09-01', pcjssj: '2024-09-30', gskssj: '2024-10-08', gsjssj: '2024-10-15',
      xybm: allXybm.join(','), xymc: allXymc.join(','), mebl: 12, sfkcp: 0, rzsczx: 9, ext1: '1', cjsj: '2024-08-20 09:00:00',
    });
    if (cs[8]) mkApp(cs[8], 'pc0', 1, 'pass', 760);
    if (others[15]) mkApp(others[15], 'pc0', 1, 'pass', 761);

    // 优秀班导师标兵（fdy_bbxx）
    const bbxx = [];
    yxbds.filter(a => a.lczt === '3' && a.sfccpbb === '1').concat(yxbds.filter(a => a.lczt === '3').slice(0, 3)).forEach((a, i) => {
      if (bbxx.find(x => x.gh === a.gh)) return;
      bbxx.push({
        id: 'bb' + (i + 1), xm: a.xm, gh: a.gh, xybm: a.xybm, szxy: a.szxy, xb: a.xb, zzmm: a.zzmm, zw: a.zw, lxdh: a.lxdh,
        rzkssj: a.rzkssj.slice(0, 4), rzjssj: '至今', bjbh: a.bjbh, bjmc: a.bjmc, xnid: 'xn2024', drsj: '2025-10-20', bz: '',
        zysj: a.zysj,
      });
    });
    others.slice(20, 26).forEach((b, i) => {
      const bj = classes.find(c => c.bjbh === b.bjbhList[0]) || {};
      bbxx.push({
        id: 'bb' + (100 + i), xm: b.xm, gh: b.gh, xybm: b.xybm, szxy: b.szxy, xb: b.xb, zzmm: b.zzmm || '中共党员',
        zw: b.zc.indexOf('教授') >= 0 ? (b.zc.indexOf('副') >= 0 ? '副教授' : '教授') : '讲师', lxdh: b.lxdh,
        rzkssj: String(2018 + (i % 4)), rzjssj: i % 3 === 0 ? '2024' : '至今', bjbh: bj.bjbh || '', bjmc: bj.bjmc || '',
        xnid: i < 3 ? 'xn2024' : 'xn2023', drsj: i < 3 ? '2024-10-18' : '2023-10-16', bz: i === 1 ? '校级优秀班导师标兵' : '',
        zysj: '担任' + (bj.bjmc || '') + '班导师期间，建立“一生一档”成长台账，组织学风建设月、职业规划讲座等活动 20 余场；所带班级获评校级先进班集体，学生满意度测评位列学院第一。',
      });
    });
    const histB = (cs[4] || bds[0]);
    if (histB) {
      bbxx.push({
        id: 'bbhist2023', xm: '沈知夏', gh: '218803', xybm: histB.xybm, szxy: histB.szxy, xb: '2', zzmm: '中共党员',
        zw: '讲师', lxdh: histB.lxdh, rzkssj: '2021', rzjssj: '2024', bjbh: (histB.bjbhList || [])[0] || '', bjmc: '', xnid: 'xn2023', drsj: '2024-10-12', bz: '2023-2024学年历史标兵',
        zysj: '2023-2024学年担任班导师，班级学风建设成效明显。',
      });
      const hc = classes.find(c => c.bjbh === (histB.bjbhList || [])[0]);
      bbxx[bbxx.length - 1].bjmc = hc ? hc.bjmc : '';
    }

    // 津贴发放
    const jtffPc = [
      { id: 'jt1', ffpcmc: '2025-2026学年第一学期班导师津贴', ffxn: '2025-2026 学年', ffzq: '六个月', fflx: '2', bkffryleix: '', fdyjt: '', dhbt: '', xjqnjsbdsjt: '400', qtbdsjt: '200', qtjt: '', zt: 1, cjsj: fmtTime(addDays(today, -7)) },
      { id: 'jt2', ffpcmc: '2024-2025学年第二学期班导师津贴', ffxn: '2024-2025 学年', ffzq: '六个月', fflx: '2', bkffryleix: '', fdyjt: '', dhbt: '', xjqnjsbdsjt: '400', qtbdsjt: '200', qtjt: '', zt: 5, cjsj: '2025-06-20 09:00:00' },
      { id: 'jt3', ffpcmc: '2025年秋季辅导员津贴+电话补贴', ffxn: '2025-2026 学年', ffzq: '三个月', fflx: '1', bkffryleix: '0', fdyjt: '800', dhbt: '100', xjqnjsbdsjt: '', qtbdsjt: '', qtjt: '', zt: 1, cjsj: fmtTime(addDays(today, -5)) },
      { id: 'jt4', ffpcmc: '2025年学生工作专项其他津贴', ffxn: '2025-2026 学年', ffzq: '一个月', fflx: '3', bkffryleix: '', fdyjt: '', dhbt: '', xjqnjsbdsjt: '', qtbdsjt: '', qtjt: '400', zt: 4, cjsj: fmtTime(addDays(today, -3)) },
    ];
    const jtffRymd = [];
    const jtffSplc = [];
    let rid = 1;
    function addRymd(pc, b, dqzt) {
      const bj = b.bjbhList.map(x => (classes.find(c => c.bjbh === x) || {}).bjmc).filter(Boolean);
      const row = {
        id: 'md' + rid++, ffpcid: pc.id, rylb: 1, gh: b.gh, xm: b.xm, xybm: b.xybm, xymc: b.szxy,
        sdbj: bj.join('、'), sdbjsl: bj.length, sfxjqnjsyjs: b.xjqnjs === '1' ? '1' : '0',
        ffxmlx: '班导师津贴', ffje: 0, dqzt, ffzt: pc.zt === 5 ? '1' : '0', ffsj: pc.zt === 5 ? '2025-07-10' : '', bhsm: '',
      };
      const base = Number(pc.qtbdsjt || 0) + (row.sfxjqnjsyjs === '1' ? Number(pc.xjqnjsbdsjt || 0) : 0);
      row.ffje = base * (window.DICT.ffzqMultiplier[pc.ffzq] || 1);
      jtffRymd.push(row);
      const isCs = b.xybm === '001001001007';
      const steps = [
        { spjd: 1, name: '本人核对', who: b.xm, js: '班导师' },
        { spjd: 2, name: '学办主任审核', who: isCs ? '刘佳' : b.szxy + '学办主任', js: '学办主任' },
        { spjd: 3, name: '副书记审核', who: isCs ? '陈晓峰' : b.szxy + '副书记', js: '副书记' },
        { spjd: 4, name: '学工部管理员审核', who: '王立新', js: '津贴发放专干' },
        { spjd: 5, name: '学工部领导审核', who: '赵建国', js: '津贴发放管理员' },
      ];
      steps.filter(s => s.spjd < dqzt).forEach((s, i) => {
        jtffSplc.push({ id: 'sp' + rid + '_' + i, mdid: row.id, spjd: s.spjd, splcztmc: s.spjd === 1 ? '已核对' : '审核通过', czrxm: s.who, jse: s.js, spjg: 1, spyj: s.spjd === 1 ? '信息无误' : '同意', czsj: fmtTime(addDays(today, -6 + i)), ffje: row.ffje });
      });
    }
    bds.forEach((b, i) => {
      let d;
      if (b.xybm === '001001001007') d = b.gh === '222318' ? 1 : [1, 2, 2, 3, 4][i % 5];
      else d = [1, 1, 2, 3, 4, 5, 6][i % 7];
      addRymd(jtffPc[0], b, d);
      if (i % 2 === 0) addRymd(jtffPc[1], b, 6);
    });
    // 无校内财务账号人员（rylb=2）与学生（rylb=3）担任班导师
    const ext = [
      { rylb: 2, xm: '欧阳思雨', xybm: '001001001007', zjlx: '1', zjhm: '430104199003152248', yhkh: '6217 0029 1000 3456 781', dqmc: '长沙市', zy: '企业导师', ssdqmc: '湖南省', khh: '中国建设银行长沙岳麓支行', gzdw: '湖南麓谷信息科技有限公司', sjh: '13907318826', email: 'oysy@lgxx.com', sfgy: '0', xb: '2', csrq: '1990-03-15', csd: '湖南长沙', rystatus: '在职', bj: '20250703', sfxj: '0', dqzt: 2 },
      { rylb: 2, xm: '贺建平', xybm: '001001001012', zjlx: '1', zjhm: '430602198511204417', yhkh: '6222 0219 0101 8899 302', dqmc: '岳阳市', zy: '会计师', ssdqmc: '湖南省', khh: '中国工商银行岳阳分行', gzdw: '天职国际会计师事务所', sjh: '13807302291', email: 'hjp@tzgj.cn', sfgy: '0', xb: '1', csrq: '1985-11-20', csd: '湖南岳阳', rystatus: '在职', bj: '', sfxj: '0', dqzt: 1 },
      { rylb: 3, xm: '谭可欣', xh: '233711025', xybm: '001001001007', bj: '20250701', sfxj: '0', dqzt: 2 },
      { rylb: 3, xm: '龚子豪', xh: '233706011', xybm: '001001001001', bj: '', sfxj: '0', dqzt: 3 },
    ];
    ext.forEach(e => {
      const c = e.bj ? (classes.filter(x => x.xybm === e.xybm && x.nj === '2025')[e.rylb === 3 ? 1 : 0] || {}) : {};
      const pc = jtffPc[0];
      const row = Object.assign({}, e, {
        id: 'md' + rid++, ffpcid: pc.id, gh: '', xymc: window.__collegeMap[e.xybm], sdbj: c.bjmc || '', sdbjsl: c.bjmc ? 1 : 0, sfxjqnjsyjs: e.sfxj,
        ffxmlx: '班导师津贴', ffje: Number(pc.qtbdsjt) * window.DICT.ffzqMultiplier[pc.ffzq], ffzt: '0', ffsj: '', bhsm: '',
      });
      delete row.bj; delete row.sfxj;
      jtffRymd.push(row);
    });

    const yxbdsZg = [
      { xybm: '001001001007', gh: '210417', xm: '刘佳' },
      { xybm: '001001001007', gh: '210662', xm: '林书衡' },
    ];

    return {
      version: 3,
      seedDate: fmtDate(today),
      colleges, xnList, classes, jzg, bds, bdsRz, yxbdsPc, yxbds, yxbdsZg, bbxx, jtffPc, jtffRymd, jtffSplc,
      messages: [], bjStudents: {}, bgb: {}, bgbczrz: [],
      importTask: null,
      bdsSeq: bid, woSeq, rid,
    };
  };
})();
