/*
 * 顶部应用与左侧菜单树（与线上 authMenuList 一致，菜单名称/层级/路径均按线上）。
 * 只有班导师相关、且已在 window.ProtoPages 注册的叶子可以点击进入。
 * 分组只有子树里存在可进入的叶子时才能展开；整组都不是班导师的菜单不能点击，也不能展开。
 * 其余菜单按线上结构保留展示，不从菜单树删除。
 * roles：可选，限定仅某些数据范围（all/college/self）的角色可见。
 */
window.APP_MENUS = {
  xgdwjs: [
    {
      title: '辅导员队伍管理', path: '/fdydwgl', children: [
        { title: '数据概览', path: '/sjgl/xgdwjs' },
        {
          title: '少数民族学生事务考核', children: [
            { title: '考评批次管理', path: '/mzxsswkh/kppcgl' },
            { title: '考核记录', path: '/mzxsswkh/khgl' },
          ],
        },
        {
          title: '人员管理', path: '/54', children: [
            { title: '辅导员', path: '/fdy' },
            { title: '班导师', path: '/bds' },
          ],
        },
        {
          title: '评奖评优', children: [
            {
              title: '优秀学生工作干部', children: [
                { title: '评选规则配置', path: '/fdydwjs/xsgbpjgz' },
                { title: '优秀学生工作干部', path: '/fdydwjs/xsgbpjxx' },
                { title: '优秀学生工作干部', path: '/fdydwjs/xsgbpjsh' },
              ],
            },
            {
              title: '优秀班导师评选', path: '/yxbdspx', children: [
                { title: '优秀班导师', path: '/yxbdspx/yxbds' },
                { title: '优秀班导师', path: '/fdydwjs/yxbdspx/yxbdsgl' },
                { title: '优秀班导师', path: '/fdydwjs/yxbdspx/yxbdsmdJs' },
                { title: '优秀班导师标兵', path: '/yxbdspx/yxbbsjb' },
                { title: '优秀班导师评选规则配置', path: '/yxbdspx/pxgzpz' },
                { title: '模范辅导员', path: '/mffdy/mffdyjb' },
              ],
            },
          ],
        },
        { title: '津贴发放管理', path: '/jtffgl' },
        { title: '辅导员“六个一”作风建设', path: '/fdy_lgyzfjs_fdy' },
        { title: '辅导员“六个一”作风建设', path: '/fdy_lgyzfjs_gld' },
        {
          title: '年度学生工作综合考核', children: [
            { title: '总成绩核定', path: '/fdydwjs/ndxsgzzhkh/zcjhd/index' },
            { title: '考核通知管理', path: '/tzfb/index' },
          ],
        },
      ],
    },
    {
      title: '辅导员研修基地', path: '/77', children: [
        { title: '师资库', path: '/szkxx/szkxx' },
        { title: '培训学分管理', path: '/pxxfc/pxxfgl' },
        { title: '荣誉库', path: '/ryk/ryk' },
        { title: '培训记录', path: '/fdyyxjd/pxjl' },
        { title: '项目库', path: '/fdyyxjd/xmk' },
      ],
    },
  ],
  jcxx: [
    {
      title: '基础信息', children: [
        {
          title: '班级管理', children: [
            { title: '班级管理', path: '/bjgl/index' },
            { title: '学生分配班级', path: '/bjgl/xsfpbj' },
          ],
        },
        { title: '学生信息', path: '/xsxx/index' },
        { title: '教职工信息', path: '/jzgxx/index' },
      ],
    },
  ],
};

/* 顶部导航应用（线上：首页、迎新管理、我的待办、个人信息、数据统计、学生事务管理、学工队伍建设、业务助手、武装部工作、心理…） */
window.APPS = [
  { key: 'home', name: '首页', path: '/home', scopes: ['all', 'college', 'self', 'fdy'] },
  { key: 'yxgl', name: '迎新管理', path: '/app/yxgl', scopes: ['all', 'college'] },
  { key: 'todo', name: '我的待办', path: '/todo', scopes: ['all', 'college', 'self', 'fdy'] },
  { key: 'grxx', name: '个人信息', path: '/app/grxx', scopes: ['all', 'college', 'self', 'fdy'] },
  { key: 'sjtj', name: '数据统计', path: '/app/sjtj', scopes: ['all', 'college'] },
  { key: 'xsswgl', name: '学生事务管理', path: '/app/xsswgl', scopes: ['all', 'college', 'self'] },
  { key: 'xgdwjs', name: '学工队伍建设', menus: 'xgdwjs', scopes: ['all', 'college', 'self', 'fdy'] },
  { key: 'jcxx', name: '基础信息', menus: 'jcxx', scopes: ['all', 'college', 'self', 'fdy'] },
  { key: 'ywzs', name: '业务助手', path: '/app/ywzs', scopes: ['all', 'college', 'self'] },
  { key: 'wzbgz', name: '武装部工作', path: '/app/wzbgz', scopes: ['all'] },
  { key: 'xljk', name: '心理健康', path: '/app/xljk', scopes: ['all', 'college'] },
];

/* 各数据范围角色可见的菜单叶子（基础信息应用按 scope 单独配置） */
window.ROLE_MENUS.full = window.ROLE_MENUS.full.concat(['/bjgl/index', '/bjgl/xsfpbj', '/xsxx/index', '/jzgxx/index']);
window.ROLE_MENUS.college = window.ROLE_MENUS.college.concat(['/bjgl/index', '/xsxx/index']);
window.ROLE_MENUS.self = window.ROLE_MENUS.self.concat(['/bjgl/index', '/bds']);
window.ROLE_MENUS.xyzg = ['/bds', '/bjgl/index'];
window.ROLE_MENUS.fdy = ['/bds', '/bjgl/index'];
window.ROLE_MENUS.yxzg = ['/yxbdspx/yxbds', '/fdydwjs/yxbdspx/yxbdsmdJs', '/fdydwjs/yxbdspx/yxbdsgl', '/yxbdspx/yxbbsjb'];

window.PAGE_TITLES = { '/home': '首页', '/todo': '我的待办' };
