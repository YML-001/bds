/* 字典常量：取自源码 bdslb.vue / yxbdspx/constants.ts / jtffgl/constants.ts 等 */
window.DICT = {
  xb: [
    { label: '男', value: '1' },
    { label: '女', value: '2' },
  ],
  // jzggl/bdslb.vue L54-70
  lb: [
    { label: '教师', value: '1' },
    { label: '行政人员', value: '2' },
    { label: '离退休人员', value: '3' },
    { label: '博士研究生', value: '4' },
    { label: '硕士研究生', value: '5' },
  ],
  xjqnjslx: [
    { label: '“3+3”讲师', value: '1' },
    { label: '特聘教授', value: '2' },
    { label: '特聘副教授', value: '3' },
    { label: '入职三年内的公共基础课教师', value: '4' },
  ],
  sfygcszjl: [
    { label: '有', value: '1' },
    { label: '无', value: '0' },
  ],
  yesno: [
    { label: '是', value: '1' },
    { label: '否', value: '0' },
  ],
  zzmm: ['群众', '共青团员', '中共预备党员', '中共党员', '民主党派', '无党派人士'].map(v => ({ label: v, value: v })),
  zw: ['助教', '讲师', '副教授', '教授', '其他'].map(v => ({ label: v, value: v })),
  bjlx: [
    { label: '本科生', value: '0' },
    { label: '硕士生', value: '1' },
    { label: '博士生', value: '2' },
  ],
  // yxbdspx/constants.ts：fdy_yxbdsxx.lczt
  lczt: [
    { label: '草稿', value: '0', tag: 'info' },
    { label: '审核中', value: '1', tag: 'warning' },
    { label: '未通过', value: '2', tag: 'danger' },
    { label: '已通过', value: '3', tag: 'success' },
  ],
  // fdy_yxbdsxx.shzt 实体注释
  yxShzt: [
    { label: '学院审核中', value: '0' },
    { label: '学院公示中', value: '1' },
    { label: '未通过', value: '2' },
    { label: '已通过', value: '3' },
    { label: '学工部审核中', value: '4' },
    { label: '学工部公示中', value: '5' },
  ],
  // pxgzpz.vue 批次状态
  pcShzt: [
    { label: '未开始', value: '0', cls: 'zt_tag_5' },
    { label: '已开始', value: '1', cls: 'zt_tag_1' },
    { label: '已公示', value: '2', cls: 'zt_tag_2' },
    { label: '已结束', value: '3', cls: 'zt_tag_5' },
  ],
  rzsczx: [3, 6, 9, 12].map(v => ({ label: v + '个月', value: v })),
  // 任班导师时间筛选（yxbdsgl.vue）
  bdsdsj: [
    { label: '不足1年', value: 'lt12' },
    { label: '1-3年', value: '12to36' },
    { label: '3年以上', value: 'gt36' },
  ],
  // 低代码流程状态 SysFlowWorkOrderStatus（znzhxgpt-code staticDict/flow.ts）
  flowStatus: [
    { label: '已提交', value: 0 },
    { label: '审批中', value: 1 },
    { label: '已拒绝', value: 2 },
    { label: '已完成', value: 3 },
    { label: '终止', value: 4 },
    { label: '撤销', value: 5 },
    { label: '草稿', value: 6 },
  ],
  // 津贴发放 jtffgl/constants.ts
  fflx: [
    { label: '辅导员津贴+电话补贴', value: '1' },
    { label: '班导师津贴', value: '2' },
    { label: '其他', value: '3' },
  ],
  ffzq: ['一个月', '二个月', '三个月', '四个月', '五个月', '六个月', '七个月', '八个月', '九个月', '十个月', '十一个月', '一年', '二年', '三年'].map(v => ({ label: v, value: v })),
  ffzqMultiplier: { 一个月: 1, 二个月: 2, 三个月: 3, 四个月: 4, 五个月: 5, 六个月: 6, 七个月: 7, 八个月: 8, 九个月: 9, 十个月: 10, 十一个月: 11, 一年: 12, 二年: 24, 三年: 36 },
  jtffZt: [
    { label: '草稿', value: 0, cls: 'zt_tag_5' },
    { label: '待学院审核', value: 1, cls: 'zt_tag_2' },
    { label: '待学工审核', value: 2, cls: 'zt_tag_1' },
    { label: '待财务审核', value: 3, cls: 'zt_tag_1' },
    { label: '待发放', value: 4, cls: 'zt_tag_2' },
    { label: '发放完成', value: 5, cls: 'zt_tag_3' },
    { label: '已驳回', value: 6, cls: 'zt_tag_4' },
  ],
  // 人员节点 dqzt（WzbJtffRymdServiceImpl）
  jtffDqzt: [
    { label: '待核对', value: 1, cls: 'zt_tag_5' },
    { label: '待学办主任审核', value: 2, cls: 'zt_tag_2' },
    { label: '待副书记审核', value: 3, cls: 'zt_tag_2' },
    { label: '待学工部管理员审核', value: 4, cls: 'zt_tag_1' },
    { label: '待学工部领导审核', value: 5, cls: 'zt_tag_1' },
    { label: '审批通过', value: 6, cls: 'zt_tag_3' },
    { label: '已驳回', value: 7, cls: 'zt_tag_4' },
  ],
  ffzt: [
    { label: '待发放', value: '0' },
    { label: '已发放', value: '1' },
  ],
  bkffryleix: [
    { label: '副书记', value: '0' },
    { label: '副书记兼职班导师', value: '1' },
  ],
};

window.dictLabel = function (name, value) {
  const list = window.DICT[name] || [];
  const hit = list.find(i => String(i.value) === String(value));
  return hit ? hit.label : (value === undefined || value === null || value === '' ? '-' : value);
};
window.dictItem = function (name, value) {
  return (window.DICT[name] || []).find(i => String(i.value) === String(value)) || {};
};
