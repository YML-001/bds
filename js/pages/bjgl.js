/*
 * 基础信息 > 班级管理 /bjgl/index（xsxxgl/teacherSide/bjgl/bjgl.vue）
 * 管理班级弹窗 Tab：学生列表 xslb.vue / 班导师列表 bdslb.vue / 班干部信息 bgbxx.vue / 操作日志 bgbczrz.vue
 * 班导师与班级的关联以在任履历为准，并同步 bds[].bjbhList。添加时填写学年和起止时间。
 * 班导师角色只读：列表只有「查看」，弹窗只展示班级信息，不能新增、导入、编辑、删除或管理班级。
 */
(function () {
  const S = window.Store;
  const warn = m => ElementPlus.ElMessage.warning(m);
  const ok = m => ElementPlus.ElMessage.success(m);
  const bjlxLabel = v => (v === '0' ? '本科生' : v === '1' ? '硕士生' : '博士生');
  const dash = v => (v === undefined || v === null || String(v).trim() === '' ? '-' : String(v));
  /** 班导师：key 为 bds，或数据范围是本人且角色名是班导师 */
  function isBdsRole(r) {
    const role = r || S.role();
    return role.key === 'bds' || (role.scope === 'self' && role.jsmc === '班导师');
  }

  const studentsOf = bjbh => S.studentsOf(bjbh);

  /* ---------- 学生列表 ---------- */
  ProtoComponents.BjXslb = {
    props: { bjbh: String },
    data() { return { model: { keyword: '', xb: '' }, q: { keyword: '', xb: '' } }; },
    computed: {
      conditions() { return [{ label: '搜索关键词', feild: 'keyword', type: 'text' }, { label: '性别', feild: 'xb', type: 'select', options: window.DICT.xb }]; },
      rows() {
        const q = this.q;
        return studentsOf(this.bjbh).filter(s => (!q.keyword || s.xm.includes(q.keyword.trim()) || s.xh.includes(q.keyword.trim())) && (!q.xb || s.xb === q.xb));
      },
    },
    methods: {
      search() { this.q = Object.assign({}, this.model); },
      tip(t) { ElementPlus.ElMessage.info('「' + t + '」属于学生信息模块，原型未展开'); },
    },
    template: `
    <div>
      <my-search :conditions="conditions" :model="model" hide-collapse @search="search" @reset="search" />
      <div class="mt10"></div>
      <pro-table :data="rows" :height="400" row-key="xh" no-padding>
        <template #operator><el-button style="border-color:#2a8dc7;color:#2a8dc7" @click="tip('添加学生')"><img src="assets/btn/add.svg" style="width:12px;height:12px" /><span style="margin-left:4px">添加学生</span></el-button></template>
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column label="姓名" min-width="110"><template #default="{row}"><name-cell :name="row.xm" /></template></el-table-column>
        <el-table-column label="性别" width="80"><template #default="{row}"><sex-tag :xb="row.xb" /></template></el-table-column>
        <el-table-column label="学号" prop="xh" min-width="130" />
        <el-table-column label="院系" prop="szxy" min-width="110" />
        <el-table-column label="专业" prop="zymc" min-width="100" />
        <el-table-column label="班级" prop="bjmc" min-width="110" />
        <el-table-column label="当前年级" prop="dqnj" width="90" />
        <el-table-column label="入学年级" prop="rxnf" width="90" />
        <el-table-column label="手机号" prop="sjh" min-width="135" />
        <el-table-column label="出生日期" prop="csrq" min-width="110" />
        <el-table-column label="操作" fixed="right" width="270">
          <template #default><div class="op-links"><span class="op-link" @click="tip('详情')">详情</span><span class="op-link" @click="tip('调班')">调班</span><span class="op-link" @click="tip('操作记录')">操作记录</span><span class="op-link danger" @click="tip('移出班级')">移出班级</span></div></template>
        </el-table-column>
      </pro-table>
    </div>`,
  };

  /* ---------- 班导师列表（bdslb.vue） ---------- */
  ProtoComponents.BjBdslb = {
    props: { bjbh: String },
    data() {
      return {
        model: { keyword: '' }, q: { keyword: '' }, detailVisible: false, detailId: '',
        addVisible: false, addModel: { keyword: '' }, addQ: { keyword: '' }, addSelected: [],
        addPeriod: { xnid: '', ksrq: null, jsrq: null },
      };
    },
    computed: {
      conditions() { return [{ label: '搜索关键词', feild: 'keyword', type: 'text', placeholder: '姓名或工号' }]; },
      xnOptions() { return S.state.xnList || []; },
      rows() {
        const k = (this.q.keyword || '').trim();
        return S.bdsOfClass(this.bjbh).filter(b => !k || b.xm.includes(k) || b.gh.includes(k)).map(b => S.bdsView(b));
      },
      addRows() {
        const k = (this.addQ.keyword || '').trim();
        return S.state.bds.filter(b => !(b.bjbhList || []).includes(this.bjbh)).filter(b => !k || b.xm.includes(k) || b.gh.includes(k))
          .slice().sort((a, b) => (a.xybm + a.gh < b.xybm + b.gh ? -1 : 1));
      },
    },
    methods: {
      dash,
      lbLabel: v => window.dictLabel('lb', v),
      sfygLabel: v => window.dictLabel('sfygcszjl', v),
      xjqnjsLabel: v => (String(v) === '1' ? '是' : String(v) === '0' ? '否' : '-'),
      xjlxLabel: v => window.dictLabel('xjqnjslx', v),
      search() { this.q = Object.assign({}, this.model); },
      viewDetail(row) { this.detailId = row.id; this.detailVisible = true; },
      remove(row) {
        if (!row.gh || !this.bjbh) return warn('数据不完整，无法移除');
        ElementPlus.ElMessageBox.confirm('确定将该班导师从本班移除？仅解除与当前班级的关联，不删除班导师档案。历史带班记录会保留。', '移除确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
          S.endBdsClass(row.gh, this.bjbh);
          ok('移除成功');
        }).catch(() => {});
      },
      openAdd() {
        this.addModel.keyword = '';
        this.addQ = { keyword: '' };
        this.addSelected = [];
        this.addPeriod = { xnid: '', ksrq: null, jsrq: null };
        this.addVisible = true;
      },
      addSearch() { this.addQ = Object.assign({}, this.addModel); },
      confirmAdd() {
        if (!this.addSelected.length) return warn('请选择要添加的班导师');
        const ghList = this.addSelected.map(r => String(r.gh || '').trim()).filter(Boolean);
        if (!ghList.length) return warn('所选记录缺少工号');
        const err = S.assignBdsClasses(ghList.map(gh => ({ gh, bjbh: this.bjbh, period: this.addPeriod })));
        if (err) return warn(err);
        ok('添加成功');
        this.addVisible = false;
      },
    },
    template: `
    <div class="bjgl-bdslb">
      <my-search :conditions="conditions" :model="model" search-title="立即查询" hide-collapse @search="search" @reset="search" />
      <div class="mt10"></div>
      <pro-table :data="rows" :height="400" no-padding>
        <template #operator><table-btn variant="add" label="添加班导师" @click="openAdd" /></template>
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column label="工号" width="110"><template #default="{row}">{{ dash(row.gh) }}</template></el-table-column>
        <el-table-column label="姓名" min-width="110"><template #default="{row}"><name-cell :name="row.xm" /></template></el-table-column>
        <el-table-column label="性别" width="70"><template #default="{row}"><sex-tag :xb="row.xb" /></template></el-table-column>
        <el-table-column label="民族" width="80"><template #default="{row}">{{ dash(row.mz) }}</template></el-table-column>
        <el-table-column label="学院" min-width="140"><template #default="{row}">{{ dash(row.szxy) }}</template></el-table-column>
        <el-table-column label="学历(位)" min-width="120"><template #default="{row}">{{ dash(row.xlw) }}</template></el-table-column>
        <el-table-column label="类别" width="110"><template #default="{row}">{{ lbLabel(row.lb) }}</template></el-table-column>
        <el-table-column label="职称" width="100"><template #default="{row}">{{ dash(row.zc) }}</template></el-table-column>
        <el-table-column label="出国深造" width="90"><template #default="{row}">{{ sfygLabel(row.sfygcszjl) }}</template></el-table-column>
        <el-table-column label="工作单位" min-width="120"><template #default="{row}">{{ dash(row.gzdw) }}</template></el-table-column>
        <el-table-column label="联系电话" width="135"><template #default="{row}">{{ dash(row.lxdh) }}</template></el-table-column>
        <el-table-column label="新进青年教师" width="110"><template #default="{row}">{{ xjqnjsLabel(row.xjqnjs) }}</template></el-table-column>
        <el-table-column label="青年教师类型" min-width="140"><template #default="{row}">{{ xjlxLabel(row.xjqnjslx) }}</template></el-table-column>
        <el-table-column label="带班班级" min-width="260" show-overflow-tooltip><template #default="{row}">{{ dash(row.bjTenure || row.bjmcs) }}</template></el-table-column>
        <el-table-column label="带班数量" width="90"><template #default="{row}">{{ dash(row.dbsl) }}</template></el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="{row}"><div class="op-links"><span class="op-link" @click="viewDetail(row)">详情</span><span class="op-link danger" @click="remove(row)">移除</span></div></template>
        </el-table-column>
      </pro-table>
      <bds-detail-dialog v-model="detailVisible" :detail-id="detailId" />
      <el-dialog v-model="addVisible" width="1200px" append-to-body align-center :close-on-click-modal="false" destroy-on-close>
        <template #header><span style="font-size:18px;font-weight:600;color:#3c444f;line-height:28px">添加班导师</span></template>
        <div class="info-grid edit cols-3">
          <div class="info-cell"><div class="lab"><span class="req">*</span>学年</div>
            <el-select v-model="addPeriod.xnid" filterable clearable placeholder="请选择学年">
              <el-option v-for="x in xnOptions" :key="x.id" :label="x.mc" :value="x.id" />
            </el-select></div>
          <div class="info-cell"><div class="lab"><span class="req">*</span>开始时间</div>
            <el-date-picker v-model="addPeriod.ksrq" type="date" value-format="YYYY-MM-DD" placeholder="请选择开始时间" /></div>
          <div class="info-cell"><div class="lab">结束时间</div>
            <el-date-picker v-model="addPeriod.jsrq" type="date" value-format="YYYY-MM-DD" placeholder="不填表示至今" clearable /></div>
        </div>
        <div class="info-tip">学年和开始时间必填。结束时间不填表示仍在任（至今）；填写后按该日期固化为历史带班。与已有履历时间重叠时不能保存。</div>
        <my-search :conditions="conditions" :model="addModel" search-title="立即查询" hide-collapse @search="addSearch" @reset="addSearch" />
        <div class="mt10"></div>
        <pro-table :data="addRows" :height="320" :toolbar="false" no-padding @selection-change="v => addSelected = v">
          <el-table-column type="selection" width="40" align="center" reserve-selection />
          <el-table-column label="工号" prop="gh" width="110" />
          <el-table-column label="姓名" min-width="110"><template #default="{row}"><name-cell :name="row.xm" /></template></el-table-column>
          <el-table-column label="性别" width="70"><template #default="{row}"><sex-tag :xb="row.xb" /></template></el-table-column>
          <el-table-column label="学院" prop="szxy" min-width="140" />
          <el-table-column label="职称" prop="zc" width="100" />
          <el-table-column label="联系电话" prop="lxdh" width="135" />
        </pro-table>
        <template #footer><el-button @click="addVisible = false">取消</el-button><el-button type="primary" @click="confirmAdd">立即添加</el-button></template>
      </el-dialog>
    </div>`,
  };

  /* ---------- 班干部信息（bgbxx.vue） ---------- */
  const ZW = ['班长', '团支书', '学习委员', '生活委员', '文体委员', '心理委员', '组织委员'];
  function bgbOf(bjbh) {
    const st = S.state;
    if (!st.bgb) st.bgb = {};
    if (!st.bgb[bjbh]) {
      const stu = studentsOf(bjbh);
      st.bgb[bjbh] = stu.slice(0, 4).map((s, i) => ({ id: bjbh + '_' + i, jsmc: ZW[i], xm: s.xm, xb: s.xb, xh: s.xh, szxy: s.szxy, bjmc: s.bjmc, nj: s.dqnj, pycc: '本科' }));
    }
    return st.bgb[bjbh];
  }
  function addLog(bjbh, czlx, s, zw, czms) {
    if (!S.state.bgbczrz) S.state.bgbczrz = [];
    S.state.bgbczrz.unshift({ id: S.uid('log'), bjbh, cjsj: S.now(), czlx, xm: s.xm, xh: s.xh, zwmc: zw, czms, cjr: S.role().xm });
  }
  ProtoComponents.BjBgbxx = {
    props: { bjbh: String },
    data() { return { model: { keyword: '' }, q: { keyword: '' }, addVisible: false, addModel: { keyword: '', xb: '' }, addQ: { keyword: '', xb: '' }, pick: null, zw: '' }; },
    computed: {
      conditions() { return [{ label: '搜索关键词', feild: 'keyword', type: 'text' }]; },
      addConditions() { return [{ label: '搜索关键词', feild: 'keyword', type: 'text' }, { label: '性别', feild: 'xb', type: 'select', options: [{ label: '全部', value: '' }].concat(window.DICT.xb) }]; },
      rows() { const k = (this.q.keyword || '').trim(); return bgbOf(this.bjbh).filter(b => !k || b.xm.includes(k) || b.xh.includes(k) || b.jsmc.includes(k)); },
      addRows() { const q = this.addQ; return studentsOf(this.bjbh).filter(s => (!q.keyword || s.xm.includes(q.keyword.trim()) || s.xh.includes(q.keyword.trim())) && (!q.xb || s.xb === q.xb)); },
      zwOptions: () => ZW,
    },
    methods: {
      search() { this.q = Object.assign({}, this.model); },
      del(row) {
        ElementPlus.ElMessageBox.confirm('确定要删除该班干部任命吗？', '删除确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
          const list = bgbOf(this.bjbh);
          list.splice(list.findIndex(x => x.id === row.id), 1);
          addLog(this.bjbh, '3', row, row.jsmc, '删除任命：' + row.xm + '（' + row.jsmc + '）');
          ok('删除成功');
        }).catch(() => {});
      },
      openAdd() { this.pick = null; this.zw = ''; this.addVisible = true; },
      addSearch() { this.addQ = Object.assign({}, this.addModel); },
      confirmAdd() {
        if (!this.pick) return warn('请选择学生');
        if (!this.zw) return warn('请选择任命职务');
        const s = this.pick;
        bgbOf(this.bjbh).push({ id: S.uid('bgb'), jsmc: this.zw, xm: s.xm, xb: s.xb, xh: s.xh, szxy: s.szxy, bjmc: s.bjmc, nj: s.dqnj, pycc: '本科' });
        addLog(this.bjbh, '1', s, this.zw, '新增任命：' + s.xm + '（' + this.zw + '）');
        ok('添加成功');
        this.addVisible = false;
      },
    },
    template: `
    <div>
      <my-search :conditions="conditions" :model="model" search-title="立即查询" hide-collapse @search="search" @reset="search" />
      <div class="mt10"></div>
      <pro-table :data="rows" :height="400" no-padding>
        <template #operator><table-btn variant="add" label="添加班干部" @click="openAdd" /></template>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="职务名称" prop="jsmc" min-width="100" />
        <el-table-column label="姓名" min-width="110"><template #default="{row}"><name-cell :name="row.xm" /></template></el-table-column>
        <el-table-column label="性别" width="80"><template #default="{row}"><sex-tag :xb="row.xb" /></template></el-table-column>
        <el-table-column label="学号" prop="xh" min-width="130" />
        <el-table-column label="院系" prop="szxy" width="110" />
        <el-table-column label="班级" prop="bjmc" min-width="110" />
        <el-table-column label="年级" prop="nj" width="90" />
        <el-table-column label="学历层次" prop="pycc" width="100" />
        <el-table-column label="操作" fixed="right" width="100"><template #default="{row}"><div class="op-links"><span class="op-link danger" @click="del(row)">删除</span></div></template></el-table-column>
      </pro-table>
      <el-dialog v-model="addVisible" title="添加班干部" width="1100px" append-to-body align-center destroy-on-close>
        <my-search :conditions="addConditions" :model="addModel" search-title="立即查询" hide-collapse @search="addSearch" @reset="addSearch" />
        <div class="mt10"></div>
        <el-table :data="addRows" border height="360" highlight-current-row class="proto-table" @current-change="v => pick = v">
          <el-table-column width="50" align="center"><template #default="{row}"><el-radio :model-value="pick && pick.xh" :value="row.xh" @click.prevent="pick = row"><span></span></el-radio></template></el-table-column>
          <el-table-column label="姓名" prop="xm" min-width="100" />
          <el-table-column label="性别" width="80"><template #default="{row}"><sex-tag :xb="row.xb" /></template></el-table-column>
          <el-table-column label="学号" prop="xh" min-width="130" />
          <el-table-column label="院系" prop="szxy" width="120" />
          <el-table-column label="班级" prop="bjmc" min-width="110" />
          <el-table-column label="年级" prop="dqnj" width="90" />
          <el-table-column label="学历层次" width="100"><template #default>本科</template></el-table-column>
        </el-table>
        <div class="flex_a mt16" style="gap:10px"><span><span style="color:#f43f51">*</span>任命职务</span>
          <el-select v-model="zw" placeholder="请选择任命职务" style="width:240px"><el-option v-for="z in zwOptions" :key="z" :label="z" :value="z" /></el-select></div>
        <template #footer><el-button @click="addVisible = false">取消</el-button><el-button type="primary" @click="confirmAdd">确定</el-button></template>
      </el-dialog>
    </div>`,
  };

  /* ---------- 操作日志（bgbczrz.vue） ---------- */
  ProtoComponents.BjBgbczrz = {
    props: { bjbh: String },
    data() { return { model: { keyword: '', czlx: '', dateRange: [] }, q: { keyword: '', czlx: '', dateRange: [] } }; },
    computed: {
      conditions() {
        return [
          { label: '搜索关键词', feild: 'keyword', type: 'text' },
          { label: '操作类型', feild: 'czlx', type: 'select', options: [{ label: '全部', value: '' }, { label: '新增任命', value: '1' }, { label: '删除任命', value: '3' }] },
          { label: '操作时间', feild: 'dateRange', type: 'daterange' },
        ];
      },
      rows() {
        const q = this.q, k = (q.keyword || '').trim();
        return (S.state.bgbczrz || []).filter(l => l.bjbh === this.bjbh && (!k || l.xm.includes(k) || l.xh.includes(k)) && (!q.czlx || l.czlx === q.czlx) &&
          (!q.dateRange || !q.dateRange.length || (l.cjsj.slice(0, 10) >= q.dateRange[0] && l.cjsj.slice(0, 10) <= q.dateRange[1])));
      },
    },
    methods: {
      search() { this.q = JSON.parse(JSON.stringify(this.model)); },
      czlxLabel: v => ({ 1: '新增任命', 3: '删除任命' }[v] || '-'),
    },
    template: `
    <div>
      <my-search :conditions="conditions" :model="model" search-title="立即查询" hide-collapse @search="search" @reset="search" />
      <div class="mt10"></div>
      <pro-table :data="rows" :height="400" :toolbar="false" no-padding>
        <el-table-column label="操作时间" prop="cjsj" width="170" />
        <el-table-column label="操作类型" width="110"><template #default="{row}"><el-tag size="small" :type="row.czlx === '3' ? 'danger' : 'success'" effect="plain">{{ czlxLabel(row.czlx) }}</el-tag></template></el-table-column>
        <el-table-column label="姓名" prop="xm" width="100" />
        <el-table-column label="学号" prop="xh" width="140" />
        <el-table-column label="职务名称" prop="zwmc" width="120" />
        <el-table-column label="操作内容" prop="czms" min-width="240" />
        <el-table-column label="操作人" prop="cjr" width="120" />
      </pro-table>
    </div>`,
  };

  /* ---------- 班级管理列表 ---------- */
  ProtoPages['/bjgl/index'] = {
    data() {
      const r = S.role();
      return {
        model: { keyword: '', xybm: '', zybh: '', bjbh: '', shzt: '', tjrq: '' }, q: {},
        myClass: isBdsRole(r),
        remindVisible: false, remindGroups: [],
        viewVisible: false, viewRow: null,
        remindTitle: '【智慧学工】请尽快为未绑定班导师的班级指定班导师',
        addVisible: false, isEdit: false, form: {},
        detailVisible: false, detailBjbh: '', detailTab: 'xslb',
        tabs: [{ name: '学生列表', text: 'xslb' }, { name: '班导师列表', text: 'bdslb' }, { name: '班干部信息', text: 'bgbxx' }, { name: '操作日志', text: 'bgbczrz' }],
        rules: {
          bjmc: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
          bjbh: [{ required: true, message: '请输入班级编号', trigger: 'blur' }],
          xybm: [{ required: true, message: '请选择所在院系', trigger: 'change' }],
          nj: [{ required: true, message: '请选择所属年级', trigger: 'change' }],
          bjlx: [{ required: true, message: '请选择班级类型', trigger: 'change' }],
        },
      };
    },
    created() { this.q = Object.assign({}, this.model); },
    watch: {
      'model.xybm'() { this.model.zybh = ''; this.model.bjbh = ''; },
      'model.zybh'() { this.model.bjbh = ''; },
    },
    computed: {
      role() { return S.role(); },
      isBds() { return isBdsRole(this.role); },
      showDb() { return this.isBds; },
      viewCells() {
        const row = this.viewRow || {};
        const lx = row.bjlx === undefined || row.bjlx === null || row.bjlx === '' ? '-' : bjlxLabel(row.bjlx);
        return [
          ['班级名称', dash(row.bjmc)],
          ['编号', dash(row.bjbh)],
          ['类型', lx],
          ['院系', dash(row.xymc)],
          ['年级', dash(row.nj)],
          ['辅导员', dash(row.fdyxm)],
          ['班导师', dash(row.bdsxm)],
          ['学生人数', dash(row.xsrs)],
          ['当前带班班导师', this.currentBdsText(row.bjbh)],
        ];
      },
      scopedClasses() {
        const r = this.role;
        if (r.scope === 'fdy') return S.state.classes.filter(c => c.fdyxm === r.xm);
        if (r.scope === 'college' || r.scope === 'self') return S.state.classes.filter(c => c.xybm === r.xybm);
        return S.state.classes;
      },
      conditions() {
        const m = this.model;
        const zys = () => {
          if (!m.xybm) return [];
          const seen = {};
          return S.state.classes.filter(c => c.xybm === m.xybm && !seen[c.zybh] && (seen[c.zybh] = 1)).map(c => ({ label: c.zymc, value: c.zybh }));
        };
        return [
          { label: '搜索关键词', feild: 'keyword', type: 'text' },
          { label: '院系', feild: 'xybm', type: 'select', filterable: true, options: () => S.collegeOptions().filter(o => this.role.scope === 'all' || o.value === this.role.xybm) },
          { label: '专业', feild: 'zybh', type: 'select', filterable: true, options: zys },
          { label: '班级', feild: 'bjbh', type: 'select', filterable: true, options: () => (m.zybh ? S.state.classes.filter(c => c.zybh === m.zybh).map(c => ({ label: c.bjmc, value: c.bjbh })) : []) },
          { label: '审核状态', feild: 'shzt', type: 'select', options: [] },
          { label: '添加日期', feild: 'tjrq', type: 'select', options: [] },
        ];
      },
      rows() {
        const q = this.q, k = (q.keyword || '').trim();
        let list = this.scopedClasses;
        if (this.myClass && this.showDb) {
          const me = S.state.bds.find(b => b.gh === this.role.gh);
          const mine = (me && me.bjbhList) || [];
          list = list.filter(c => mine.includes(c.bjbh));
        }
        return list.filter(c => (!k || c.bjmc.includes(k) || c.bjbh.includes(k)) && (!q.xybm || c.xybm === q.xybm) && (!q.zybh || c.zybh === q.zybh) && (!q.bjbh || c.bjbh === q.bjbh))
          .map(c => Object.assign({}, c, { bdsxm: S.bdsOfClass(c.bjbh).map(b => b.xm).join('、') }));
      },
      njOptions() { const a = []; for (let y = 2020; y <= 2030; y++) a.push(String(y)); return a; },
      xyOptions() { return S.collegeOptions(); },
    },
    methods: {
      bjlxLabel, dash,
      can: c => S.can(c),
      search() { this.q = Object.assign({}, this.model); },
      currentBdsText(bjbh) {
        if (!bjbh) return '-';
        const names = [];
        const seen = {};
        (S.state.bdsRz || []).filter(z => z.bjbh === bjbh && !z.jsrq).forEach(z => {
          if (!z.gh || seen[z.gh]) return;
          seen[z.gh] = 1;
          const b = S.state.bds.find(x => x.gh === z.gh);
          names.push((b && b.xm) || z.gh);
        });
        if (!names.length) S.bdsOfClass(bjbh).forEach(b => { if (b.xm) names.push(b.xm); });
        return names.length ? names.join('、') : '-';
      },
      openView(row) { this.viewRow = Object.assign({}, row); this.viewVisible = true; },
      openAdd() {
        if (isBdsRole()) return;
        this.isEdit = false; this.form = { bjmc: '', bjbh: '', xybm: '', nj: '', bjlx: '' }; this.addVisible = true;
      },
      openEdit(row) {
        if (isBdsRole()) return;
        this.isEdit = true; this.form = { bjmc: row.bjmc, bjbh: row.bjbh, xybm: row.xybm, nj: row.nj, bjlx: row.bjlx }; this.addVisible = true;
      },
      submit() {
        if (isBdsRole()) return;
        this.$refs.addForm.validate(valid => {
          if (!valid) return;
          const f = this.form;
          if (this.isEdit) {
            Object.assign(S.state.classes.find(c => c.bjbh === f.bjbh), { bjmc: f.bjmc, xybm: f.xybm, xymc: S.collegeName(f.xybm), nj: f.nj, bjlx: f.bjlx });
            ok('编辑成功');
          } else {
            if (S.state.classes.find(c => c.bjbh === f.bjbh)) return warn('班级编号已存在');
            S.state.classes.unshift({ bjbh: f.bjbh, bjmc: f.bjmc, xybm: f.xybm, xymc: S.collegeName(f.xybm), zybh: '', zymc: '', nj: f.nj, bjlx: f.bjlx, fdyxm: '', xsrs: 0 });
            ok('新增成功');
          }
          this.addVisible = false;
        });
      },
      del(row) {
        if (isBdsRole()) return;
        ElementPlus.ElMessageBox.confirm('确定要删除该班级吗？', '删除确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
          S.state.classes.splice(S.state.classes.findIndex(c => c.bjbh === row.bjbh), 1);
          S.state.bds.forEach(b => { if ((b.bjbhList || []).includes(row.bjbh)) S.endBdsClass(b.gh, row.bjbh); });
          ok('删除成功');
        }).catch(() => {});
      },
      openDetail(row) {
        if (isBdsRole()) return this.openView(row);
        this.detailBjbh = row.bjbh; this.detailTab = 'xslb'; this.detailVisible = true;
      },
      importTip() {
        if (isBdsRole()) return;
        ElementPlus.ElMessage.info('班级导入属于基础信息模块，原型未展开');
      },
      remindBody(g) {
        const names = g.classes.map(c => c.bjmc).join('、');
        return g.xm + '老师：\n您所带班级中有 ' + g.classes.length + ' 个尚未绑定班导师：' + names + '。\n请在「基础信息 - 班级管理 - 管理班级 - 班导师列表」中完成绑定。一个班仅一名班导师，一名班导师同时最多带两个班。\n党委学生工作部';
      },
      openRemind() {
        if (isBdsRole()) return;
        const bound = new Set((S.state.bdsRz || []).filter(r => !r.jsrq).map(r => r.bjbh));
        const unbound = S.state.classes.filter(c => !bound.has(c.bjbh));
        const map = {};
        unbound.forEach(c => {
          const name = c.fdyxm || '未指定辅导员';
          if (!map[name]) map[name] = { xm: name, classes: [] };
          map[name].classes.push(c);
        });
        this.remindGroups = Object.values(map).map(g => {
          const person = window.ROLES.find(r => r.xm === g.xm) || S.state.jzg.find(j => j.xm === g.xm) || {};
          return Object.assign(g, { gh: person.gh || '', body: this.remindBody(g) });
        });
        if (!this.remindGroups.length) return ok('当前班级均已绑定在任班导师');
        this.remindVisible = true;
      },
      sendRemind() {
        if (!S.state.messages) S.state.messages = [];
        this.remindGroups.forEach(g => {
          S.state.messages.unshift({
            id: S.uid('msg'), gh: g.gh, xm: g.xm, title: this.remindTitle, body: g.body,
            itsTitle: this.remindTitle, cjsj: S.now(), read: false,
          });
        });
        const n = this.remindGroups.length;
        this.remindVisible = false;
        ok('已向 ' + n + ' 名辅导员发送系统消息，并推送 ITS 待办');
      },
    },
    template: `
    <div class="flex_c" style="flex:1;min-height:0">
      <my-search :conditions="conditions" :model="model" search-title="立即查询" @search="search" @reset="search" />
      <div class="page-gap"></div>
      <pro-table :data="rows" row-key="bjbh">
        <template #operator>
          <table-btn v-if="!isBds && can('add')" variant="add" @click="openAdd" />
          <table-btn v-if="!isBds && can('import')" variant="import" @click="importTip" />
          <el-button v-if="!isBds && role.key === 'xgbgly'" type="primary" plain @click="openRemind">一键提醒</el-button>
        </template>
        <template #right>
          <el-checkbox v-if="showDb" v-model="myClass" class="db-checkbox">我的带班</el-checkbox>
        </template>
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column label="编号" prop="bjbh" width="160" />
        <el-table-column label="班级名称" prop="bjmc" min-width="120" />
        <el-table-column label="班级类型" min-width="100"><template #default="{row}">{{ bjlxLabel(row.bjlx) }}</template></el-table-column>
        <el-table-column label="所在院系" prop="xymc" min-width="120" />
        <el-table-column label="所在年级" prop="nj" min-width="90" />
        <el-table-column label="辅导员姓名" width="100"><template #default="{row}">{{ dash(row.fdyxm) }}</template></el-table-column>
        <el-table-column label="班导师姓名" width="120" show-overflow-tooltip><template #default="{row}">{{ dash(row.bdsxm) }}</template></el-table-column>
        <el-table-column label="学生人数" prop="xsrs" width="80" />
        <el-table-column label="操作" fixed="right" width="260">
          <template #default="{row}">
            <div class="op-links" style="justify-content:center">
              <span v-if="isBds" class="op-link" @click="openView(row)">查看</span>
              <template v-else>
                <span v-if="can('edit')" class="op-link" @click="openEdit(row)">编辑</span>
                <span class="op-link" @click="openDetail(row)">管理班级</span>
                <span v-if="can('del')" class="op-link danger" @click="del(row)">删除</span>
              </template>
            </div>
          </template>
        </el-table-column>
      </pro-table>

      <el-dialog v-model="addVisible" :title="isEdit ? '编辑班级' : '增加班级'" width="640px" :close-on-click-modal="false" destroy-on-close draggable append-to-body>
        <el-form ref="addForm" :model="form" :rules="rules" label-position="top" class="bjgl-add-form">
          <el-row :gutter="20">
            <el-col :span="8"><el-form-item label="班级名称" prop="bjmc"><el-input v-model="form.bjmc" placeholder="请输入" clearable /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="班级编号" prop="bjbh"><el-input v-model="form.bjbh" placeholder="请输入" clearable :disabled="isEdit" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="所在院系" prop="xybm"><el-select v-model="form.xybm" placeholder="请选择" clearable><el-option v-for="o in xyOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8"><el-form-item label="所属年级" prop="nj"><el-select v-model="form.nj" placeholder="请选择" clearable><el-option v-for="y in njOptions" :key="y" :label="y" :value="y" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="班级类型" prop="bjlx"><el-select v-model="form.bjlx" placeholder="请选择" clearable><el-option v-for="o in DICT.bjlx" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></el-col>
          </el-row>
        </el-form>
        <template #footer><el-button @click="addVisible = false">关闭</el-button><el-button type="primary" @click="submit">提交</el-button></template>
      </el-dialog>

      <el-dialog v-model="viewVisible" title="查看班级" width="920px" align-center :close-on-click-modal="false" destroy-on-close draggable append-to-body>
        <section-title title="班级信息" />
        <div class="info-grid cols-3">
          <div v-for="c in viewCells" :key="c[0]" class="info-cell"><div class="lab">{{ c[0] }}</div><div class="val">{{ c[1] }}</div></div>
        </div>
        <template #footer><el-button @click="viewVisible = false">关闭</el-button></template>
      </el-dialog>

      <el-dialog v-model="detailVisible" title="班级管理详情" width="1400px" top="5vh" :close-on-click-modal="false" destroy-on-close draggable append-to-body>
        <div class="bjglxq-tabs">
          <div v-for="t in tabs" :key="t.text" class="tab_item" :class="{ active: t.text === detailTab }" @click="detailTab = t.text">{{ t.name }}</div>
        </div>
        <bj-xslb v-if="detailTab === 'xslb'" :bjbh="detailBjbh" />
        <bj-bdslb v-if="detailTab === 'bdslb'" :bjbh="detailBjbh" />
        <bj-bgbxx v-if="detailTab === 'bgbxx'" :bjbh="detailBjbh" />
        <bj-bgbczrz v-if="detailTab === 'bgbczrz'" :bjbh="detailBjbh" />
      </el-dialog>

      <el-dialog v-model="remindVisible" title="一键提醒" width="760px" append-to-body :close-on-click-modal="false">
        <div class="info-tip">以下班级当前没有在任班导师。确认后按辅导员归并发送系统消息，并推送 ITS 待办。</div>
        <div v-for="g in remindGroups" :key="g.xm" style="border:1px solid #c7e1f0;border-radius:6px;padding:12px 14px;margin-bottom:10px">
          <div style="font-weight:700;margin-bottom:6px">{{ g.xm }} · {{ g.classes.length }} 个班</div>
          <div style="font-weight:600">{{ remindTitle }}</div>
          <div style="white-space:pre-wrap;line-height:1.7;margin-top:6px">{{ g.body }}</div>
          <div class="text-muted fs12" style="margin-top:6px">ITS 待办：{{ remindTitle }}</div>
        </div>
        <template #footer>
          <el-button @click="remindVisible = false">取消</el-button>
          <el-button type="primary" @click="sendRemind">确认发送</el-button>
        </template>
      </el-dialog>
    </div>`,
  };
})();
