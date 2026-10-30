/*
 * 演示角色配置（右上角切换）。
 * - jsid 取自源码硬编码（roleJsid.ts / jtff 服务），仅作展示；
 * - perms：页面按钮权限码，对应源码 v-auth（add/import/compile/del/edit/kjxsz/shjd）；
 * - scope：数据范围 all=全校，college=本学院，self=本人。
 * 后续迭代调整角色权限时，改这里即可。
 */
window.ROLES = [
  {
    key: 'xgbgly', jsmc: '学工部管理员', jsid: '6a9c37344a7c9e243ce43ad094f94a2c',
    desc: '事务办一级 · 优秀班导师专干（学工部）· 津贴发放专干',
    gh: '100231', xm: '王立新', bmmc: '党委学生工作部', scope: 'all',
    perms: ['add', 'import', 'compile', 'del', 'edit', 'kjxsz', 'shjd'],
  },
  {
    key: 'xgbld', jsmc: '学工部领导', jsid: '6127f21920b242328ab3ed508c5bf3de',
    desc: '事务办二级 · 学工部审核 · 津贴发放管理员',
    gh: '100108', xm: '赵建国', bmmc: '党委学生工作部', scope: 'all',
    perms: ['shjd'],
  },
  {
    key: 'fsj', jsmc: '学院副书记', jsid: '2525a2dd70004581bc7250285b44ad7c',
    desc: '计算机学院 · 副书记审核',
    gh: '210356', xm: '陈晓峰', bmmc: '计算机学院', xybm: '001001001007', scope: 'college',
    perms: [],
  },
  {
    key: 'xbzr', jsmc: '学办主任', jsid: '70f9e085ef5543dbb9fc30646997c056',
    desc: '计算机学院 · 学院审核（校验推荐名额）',
    gh: '210417', xm: '刘佳', bmmc: '计算机学院', xybm: '001001001007', scope: 'college',
    perms: [],
  },
  {
    key: 'bds', jsmc: '班导师', jsid: 'c7e637e2a4d74c208ff295900c95d686',
    desc: '计算机学院 · 申请优秀班导师 · 核对津贴 · 个人信息只读',
    gh: '222318', xm: '周明远', bmmc: '计算机学院', xybm: '001001001007', scope: 'self',
    perms: [],
  },
  {
    key: 'xyzg', jsmc: '学院班导师专干', jsid: 'demo-xyzg',
    desc: '计算机学院 · 维护本学院班导师名单（新增、导入、编辑）',
    gh: '210588', xm: '周启明', bmmc: '计算机学院', xybm: '001001001007', scope: 'college', menus: 'xyzg',
    perms: ['add', 'import', 'compile', 'edit'],
  },
  {
    key: 'fdy', jsmc: '辅导员', jsid: 'demo-fdy',
    desc: '计算机学院 · 唐思远 · 可编辑所带班级的班导师',
    gh: '219801', xm: '唐思远', bmmc: '计算机学院', xybm: '001001001007', scope: 'fdy', menus: 'fdy',
    perms: ['compile', 'edit'],
  },
  {
    key: 'yxzg', jsmc: '优秀班导师专干', jsid: 'demo-yxzg',
    desc: '计算机学院 · 已加入专干名单 · 可查看、审核并维护本学院申报',
    gh: '210662', xm: '林书衡', bmmc: '计算机学院', xybm: '001001001007', scope: 'college', menus: 'yxzg',
    perms: ['add', 'compile', 'edit'],
  },
];

/** 学院审核人：学办主任，或已写入专干名单（state.yxbdsZg）的人 */
window.isYxZg = function (xybm) {
  const r = window.Store.role();
  if (r.key === 'xbzr' && (!xybm || r.xybm === xybm)) return true;
  return (window.Store.state.yxbdsZg || []).some(z => z.gh === r.gh && (!xybm || z.xybm === xybm));
};

/* 优秀班导师低代码流程节点（线上流程图：申请 → 学院审核 → 副书记审核 → 优秀班导师专干（学工部）审核 → 学工部审核） */
window.YXBDS_NODES = [
  { key: 'apply', name: '申请', role: 'bds' },
  { key: 'Activity_1751t1c', name: '学院审核', role: 'xbzr' },
  { key: 'fsjsh', name: '副书记审核', role: 'fsj' },
  { key: 'zgsh', name: '优秀班导师专干（学工部）审核', role: 'xgbgly', multi: true },
  { key: 'xgbsh', name: '学工部审核', role: 'xgbld', multi: true },
];

/* 审批节点对应的演示审批人（计算机学院用演示账号，其他学院用占位姓名） */
window.yxNodeUser = function (nodeIdx, xybm) {
  const node = window.YXBDS_NODES[nodeIdx];
  const role = window.ROLES.find(r => r.key === node.role);
  if (role.scope === 'college' && xybm !== role.xybm) {
    const c = (window.__collegeMap && window.__collegeMap[xybm]) || '学院';
    return { user: c + (node.role === 'fsj' ? '副书记' : '学办主任'), roleName: role.jsmc };
  }
  return { user: role.xm, roleName: role.jsmc };
};
window.YXBDS_NODE_ROLE = window.YXBDS_NODES.map((n, i) => window.yxNodeUser(i, '001001001007'));

/* 节点 → 业务审核状态 shzt（0学院审核中 1学院公示中 4学工部审核中 5学工部公示中 3已通过 2未通过） */
window.yxShztByNode = function (nodeIdx) {
  return { 1: '0', 2: '1', 3: '4', 4: '5' }[nodeIdx] || '0';
};

/* 各角色可见菜单（学工队伍建设应用）。path 与线上一致 */
window.ROLE_MENUS = {
  full: ['/sjgl/xgdwjs', '/mzxsswkh/kppcgl', '/mzxsswkh/khgl', '/fdy', '/bds', '/fdydwjs/xsgbpjgz', '/fdydwjs/xsgbpjxx', '/fdydwjs/xsgbpjsh',
    '/yxbdspx/yxbds', '/fdydwjs/yxbdspx/yxbdsgl', '/yxbdspx/yxbbsjb', '/yxbdspx/pxgzpz', '/mffdy/mffdyjb', '/jtffgl', '/fdy_lgyzfjs_fdy', '/fdy_lgyzfjs_gld',
    '/fdydwjs/ndxsgzzhkh/zcjhd/index', '/tzfb/index', '/szkxx/szkxx', '/pxxfc/pxxfgl', '/ryk/ryk', '/fdyyxjd/pxjl', '/fdyyxjd/xmk'],
  college: ['/sjgl/xgdwjs', '/bds', '/yxbdspx/yxbds', '/fdydwjs/yxbdspx/yxbdsmdJs', '/fdydwjs/yxbdspx/yxbdsgl', '/yxbdspx/yxbbsjb', '/jtffgl'],
  self: ['/yxbdspx/yxbds', '/yxbdspx/yxbbsjb', '/jtffgl'],
};
