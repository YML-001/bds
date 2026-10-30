/* 首页（原型导航）与 我的待办 */
(function () {
  const S = window.Store;

  /** 当前角色待办：优秀班导师工单 */
  window.yxTodoList = function () {
    const r = S.role();
    return S.state.yxbds.filter(a => {
      if (a.lczt !== '1' || !a.workOrderCode) return false;
      const node = window.YXBDS_NODES[a.currentNode];
      if (!node) return false;
      if (node.role === 'xbzr') return window.isYxZg(a.xybm);
      if (node.role !== r.key) return false;
      if (r.scope === 'college' && a.xybm !== r.xybm) return false;
      return true;
    });
  };
  /** 当前角色待办：津贴发放人员节点（dqzt 1 本人核对 / 2 学办主任 / 3 副书记 / 4 学工部管理员 / 5 学工部领导） */
  window.JTFF_DQZT_ROLE = { 1: 'bds', 2: 'xbzr', 3: 'fsj', 4: 'xgbgly', 5: 'xgbld' };
  window.jtffTodoRows = function () {
    const r = S.role();
    return S.state.jtffRymd.filter(m => {
      if (window.JTFF_DQZT_ROLE[m.dqzt] !== r.key) return false;
      if (r.scope === 'college' && m.xybm !== r.xybm) return false;
      if (r.scope === 'self' && m.gh !== r.gh) return false;
      return true;
    });
  };

  ProtoPages['/home'] = {
    computed: {
      role() { return S.role(); },
      roles() { return window.ROLES; },
      yxTodo() { return window.yxTodoList().length; },
      jtTodo() { return window.jtffTodoRows().length; },
      stats() {
        return [
          { n: S.state.bds.length, t: '班导师总数' },
          { n: S.state.yxbds.filter(a => a.pcid === 'pc1' && a.lczt === '1').length, t: '本批次评优审核中' },
          { n: S.state.bbxx.length, t: '优秀班导师标兵' },
          { n: S.state.jtffPc.filter(p => p.fflx === '2').length, t: '班导师津贴批次' },
        ];
      },
      modules() {
        return [
          { t: '班导师名单', d: '人员管理 > 班导师：查询、新增（工号带出）、编辑、详情、删除、批量导入（进度/结果）、导出', p: '/bds' },
          { t: '优秀班导师（申请流程）', d: '低代码流程：新建申请 → 学院审核（名额校验）→ 副书记 → 专干 → 学工部审核', p: '/yxbdspx/yxbds' },
          { t: '优秀班导师（名单）', d: '全校优秀班导师申报信息只读查询', p: '/fdydwjs/yxbdspx/yxbdsgl' },
          { t: '优秀班导师标兵', d: '标兵名单维护：新增、导入、下载模板、导出、一键删除', p: '/yxbdspx/yxbbsjb' },
          { t: '优秀班导师评选规则配置', d: '评选批次：名额比例、兼任辅导员、任班时长要求；查看名单抽屉', p: '/yxbdspx/pxgzpz' },
          { t: '津贴发放管理', d: '班导师津贴批次、人员名单、金额计算、逐人审批链、学院审批进度', p: '/jtffgl' },
          { t: '班级管理 · 班导师列表', d: '基础信息 > 班级管理 > 管理班级 > 班导师列表：添加时选择学年和起止时间，移除只结束在任', p: '/bjgl/index' },
        ];
      },
    },
    methods: {
      switchRole(r) { S.setRole(r.key); ElementPlus.ElMessage.success('已切换为「' + r.jsmc + '」'); },
    },
    template: `
    <div style="background:#fff;flex:1;padding:24px 28px;border-radius:0 0 8px 8px;overflow:auto">
      <div class="flex_b f_ai_c mb16">
        <div>
          <div style="font-size:20px;font-weight:700;color:#1e323f">班导师模块 · 可点击原型</div>
          <div class="text-muted mt10">复刻自智慧学工系统（学工队伍建设 / 基础信息）。数据均为虚构演示数据，操作保存在本机浏览器，可随时“重置演示数据”。</div>
        </div>
        <a href="mobile.html" target="_blank"><el-button type="primary" plain icon="Iphone">打开移动端原型</el-button></a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px" class="mb16">
        <div v-for="s in stats" :key="s.t" class="info-cell" style="border:1px solid #c7e1f0;border-radius:6px">
          <div class="lab">{{ s.t }}</div><div style="font-size:26px;font-weight:700;color:#2a8dc7">{{ s.n }}</div>
        </div>
      </div>
      <section-title title="当前角色" />
      <div class="sum-bar">
        <span>{{ role.jsmc }} · {{ role.xm }}（{{ role.gh }}）</span>
        <span class="text-muted">{{ role.desc }}</span>
        <span style="margin-left:auto">待办：优秀班导师 <b>{{ yxTodo }}</b> 件，津贴核对/审批 <b>{{ jtTodo }}</b> 人</span>
        <el-button type="primary" size="small" @click="go('/todo')">去办理</el-button>
      </div>
      <section-title title="功能模块" />
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px" class="mb16">
        <div v-for="m in modules" :key="m.p" class="info-cell cur_p" style="border:1px solid #c7e1f0;border-radius:6px;min-height:96px" @click="go(m.p)">
          <div class="flex_b"><div class="val">{{ m.t }}</div><el-icon color="#2a8dc7"><Right /></el-icon></div>
          <div class="text-muted fs12 mt10" style="line-height:20px">{{ m.d }}</div>
        </div>
      </div>
      <section-title title="演示角色（右上角头像处也可切换）" />
      <el-table class="proto-table" :data="roles" border>
        <el-table-column label="角色" prop="jsmc" width="140" />
        <el-table-column label="姓名（工号）" width="160"><template #default="{row}">{{ row.xm }}（{{ row.gh }}）</template></el-table-column>
        <el-table-column label="职责" prop="desc" />
        <el-table-column label="数据范围" width="110"><template #default="{row}">{{ {all:'全校',college:'本学院',self:'本人',fdy:'所带班级'}[row.scope] }}</template></el-table-column>
        <el-table-column label="操作" width="120"><template #default="{row}"><span v-if="row.key===role.key" class="text-muted">当前角色</span><span v-else class="op-link" @click="switchRole(row)">切换</span></template></el-table-column>
      </el-table>
    </div>`,
  };

  ProtoPages['/todo'] = {
    data() { return { tab: 'yx' }; },
    computed: {
      role() { return S.role(); },
      yxList() { return window.yxTodoList(); },
      myDrafts() {
        const r = this.role;
        return r.scope === 'self' ? S.state.yxbds.filter(a => a.gh === r.gh && a.lczt === '0' && a.workOrderCode) : [];
      },
      msgs() {
        const r = this.role;
        return (S.state.messages || []).filter(m => m.gh === r.gh || m.xm === r.xm);
      },
      jtGroups() {
        const rows = window.jtffTodoRows();
        const m = {};
        rows.forEach(x => { (m[x.ffpcid] = m[x.ffpcid] || []).push(x); });
        return Object.keys(m).map(id => {
          const pc = S.state.jtffPc.find(p => p.id === id) || {};
          return { pc, count: m[id].length, dqzt: m[id][0].dqzt };
        });
      },
    },
    methods: {
      nodeName(a) { return (window.YXBDS_NODES[a.currentNode] || {}).name; },
      pcName(id) { return (S.state.yxbdsPc.find(p => p.id === id) || {}).pcmc; },
      handle(a) { go('/yxbdspx/yxbds', { view: 'handle', id: a.id, from: 'todo' }); },
      editDraft(a) { go('/yxbdspx/yxbds', { view: 'form', id: a.id, from: 'todo' }); },
      openJt(g) { go('/jtffgl', { open: g.pc.id }); },
    },
    template: `
    <div style="background:#fff;flex:1;padding:16px 24px;border-radius:0 0 8px 8px;display:flex;flex-direction:column">
      <el-tabs v-model="tab">
        <el-tab-pane :label="'优秀班导师评选（' + (yxList.length + myDrafts.length) + '）'" name="yx">
          <el-table class="proto-table" :data="yxList.concat(myDrafts)" border empty-text="暂无待办">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column label="工单编号" prop="workOrderCode" min-width="190" />
            <el-table-column label="流程名称" width="120"><template #default>优秀班导师</template></el-table-column>
            <el-table-column label="申请人" width="110"><template #default="{row}"><name-cell :name="row.xm" /></template></el-table-column>
            <el-table-column label="学院" prop="szxy" min-width="120" />
            <el-table-column label="评选批次" min-width="200"><template #default="{row}">{{ pcName(row.pcid) }}</template></el-table-column>
            <el-table-column label="当前节点" min-width="170"><template #default="{row}"><zt-tag :label="row.lczt==='0'?'草稿（待提交）':nodeName(row)" :cls="row.lczt==='0'?'zt_tag_5':'zt_tag_2'" /></template></el-table-column>
            <el-table-column label="提交时间" prop="createTime" width="170" />
            <el-table-column label="操作" width="100" fixed="right" align="center">
              <template #default="{row}"><span v-if="row.lczt==='0'" class="op-link" @click="editDraft(row)">编辑</span><span v-else class="op-link" @click="handle(row)">办理</span></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane v-if="role.key === 'fdy' || msgs.length" :label="'系统消息（' + msgs.length + '）'" name="msg">
          <el-table class="proto-table" :data="msgs" border empty-text="暂无系统消息">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column label="标题 / ITS 待办" prop="title" min-width="280" />
            <el-table-column label="时间" prop="cjsj" width="170" />
            <el-table-column label="正文" min-width="360"><template #default="{row}"><div style="white-space:pre-wrap">{{ row.body }}</div></template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="'津贴发放（' + jtGroups.length + '）'" name="jt">
          <el-table class="proto-table" :data="jtGroups" border empty-text="暂无待办">
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column label="发放批次" min-width="240"><template #default="{row}">{{ row.pc.ffpcmc }}</template></el-table-column>
            <el-table-column label="津贴类型" width="170"><template #default="{row}">{{ dictLabel('fflx', row.pc.fflx) }}</template></el-table-column>
            <el-table-column label="待处理节点" width="170"><template #default="{row}"><zt-tag :label="dictItem('jtffDqzt',row.dqzt).label" :cls="dictItem('jtffDqzt',row.dqzt).cls" /></template></el-table-column>
            <el-table-column label="待处理人数" prop="count" width="110" align="center" />
            <el-table-column label="操作" width="120" align="center"><template #default="{row}"><span class="op-link" @click="openJt(row)">{{ role.key==='bds' ? '去核对' : '去审批' }}</span></template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>`,
  };
})();
