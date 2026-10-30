/*
 * 优秀班导师评选 > 优秀班导师（线上为 linkPage → 低代码 iframe）
 * 列表：znzhxgpt-code/src/pages/workflow/pages/yxbds/yxbds.vue
 * 表单：yxbdslcym.vue；办理壳：workflow/components/HandlerFlowTask.vue；审批弹窗：TaskCommit.vue
 * 后端：FdyYxbdsBatchEligibilityValidator（保存/提交时）、FdyYxbdsCollegeQuotaValidator（学院审核同意时）
 * 视图通过 hash 参数切换：view=list|form|handle|view，id=工单ID
 */
(function () {
  const S = window.Store;
  const NODES = () => window.YXBDS_NODES;
  const warn = m => ElementPlus.ElMessage.warning(m);

  function pcOf(id) { return S.state.yxbdsPc.find(p => p.id === id) || {}; }
  function rzRange(a) { if (!a.rzkssj && !a.rzjssj) return '-'; return (a.rzkssj || '').slice(0, 10) + ' ~ ' + (a.rzjssj || '').slice(0, 10); }
  window.yxRzRange = rzRange;

  /* ---------- 工单列表 ---------- */
  const LcList = {
    data() { return { f: { flowStatus: '', createTime: [], workOrderCode: '' }, q: {}, pageNo: 1, size: 10, dense: false }; },
    created() { this.q = JSON.parse(JSON.stringify(this.f)); },
    computed: {
      role() { return S.role(); },
      rows() {
        const q = this.q;
        const r = S.role();
        let base = S.state.yxbds.filter(a => a.workOrderCode);
        if (r.key === 'bds') base = base.filter(a => a.gh === r.gh || String(a.lczt) === '3');
        else base = S.scopeFilter(base);
        return base.filter(a => a.workOrderCode &&
          (q.flowStatus === '' || q.flowStatus === undefined || a.flowStatus === q.flowStatus) &&
          (!q.workOrderCode || a.workOrderCode.includes(q.workOrderCode.trim())) &&
          (!q.createTime || !q.createTime.length || (a.createTime.slice(0, 10) >= q.createTime[0] && a.createTime.slice(0, 10) <= q.createTime[1])),
        ).slice().sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
      },
      paged() { const s = (this.pageNo - 1) * this.size; return this.rows.slice(s, s + this.size); },
    },
    methods: {
      rzRange,
      pcName(id) { return pcOf(id).pcmc; },
      search() { this.q = JSON.parse(JSON.stringify(this.f)); this.pageNo = 1; },
      reset() { this.f = { flowStatus: '', createTime: [], workOrderCode: '' }; this.search(); },
      isInit(a) { return a.flowStatus === 6; },
      start() { go('/yxbdspx/yxbds', { view: 'form' }); },
      handle(a) { go('/yxbdspx/yxbds', { view: 'form', id: a.id }); },
      view(a) { go('/yxbdspx/yxbds', { view: 'view', id: a.id }); },
      remind(a) {
        if (a.flowStatus !== 1) { warn('当前工单没有可催办的任务'); return; }
        ElementPlus.ElMessage.success('催办成功');
      },
      cancel(a) {
        if (S.role().key === 'bds' && a.gh !== S.role().gh) { warn('只能撤销本人申请'); return; }
        ElementPlus.ElMessageBox.confirm('是否撤销此工单？', '', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
          if ([2, 3, 4, 5].includes(a.flowStatus)) { warn('流程已结束，无法撤销'); return; }
          a.flowStatus = 5; a.lczt = '2'; a.shzt = '2';
          a.records.push({ node: (NODES()[a.currentNode] || {}).name || '申请', user: a.xm, role: '发起人', action: '撤销', opinion: '主动撤销', time: S.now() });
          ElementPlus.ElMessage.success('撤销成功！');
        }).catch(() => {});
      },
      exportRows() {
        window.downloadCsv('优秀班导师', [
          { en: 'xm', cn: '姓名' }, { en: 'gh', cn: '工号' }, { cn: '评选批次', fmt: r => this.pcName(r.pcid) }, { en: 'pcxnmc', cn: '评测学年' }, { en: 'szxy', cn: '学院' },
          { cn: '性别', fmt: r => window.dictLabel('xb', r.xb) }, { en: 'zzmm', cn: '政治面貌' }, { en: 'zw', cn: '职称(务)' }, { cn: '任班导师时间', fmt: rzRange },
          { en: 'bjmc', cn: '负责班级' }, { cn: '流程状态', fmt: r => window.dictLabel('flowStatus', r.flowStatus) },
        ], this.rows);
      },
    },
    template: `
    <div class="lc-list">
      <div class="lc-search">
        <div class="lc-item"><span class="lab">流程状态</span>
          <el-select v-model="f.flowStatus" clearable placeholder="流程状态" style="flex:1"><el-option v-for="o in DICT.flowStatus" :key="o.value" :label="o.label" :value="o.value" /></el-select></div>
        <div class="lc-item" style="width:300px"><span class="lab">创建日期</span>
          <el-date-picker v-model="f.createTime" type="daterange" value-format="YYYY-MM-DD" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" style="flex:1" /></div>
        <div class="lc-item"><span class="lab">工单编号</span><el-input v-model="f.workOrderCode" clearable placeholder="工单编号" style="flex:1" /></div>
        <div style="margin-left:auto" class="flex_a">
          <el-button type="primary" icon="Search" @click="search">查询</el-button>
          <el-button class="m-operation-btn" @click="reset">重置</el-button>
        </div>
      </div>
      <div class="lc-toolbar">
        <el-button type="primary" @click="start">新建</el-button>
        <div class="icons">
          <el-tooltip content="刷新"><el-icon @click="search"><RefreshRight /></el-icon></el-tooltip>
          <el-tooltip content="密度"><el-icon @click="dense=!dense"><Sort /></el-icon></el-tooltip>
          <el-tooltip content="导出（可导出历年名单）"><el-icon @click="exportRows"><Bottom /></el-icon></el-tooltip>
        </div>
      </div>
      <div style="flex:1;position:relative;min-height:300px"><div style="position:absolute;inset:0">
      <el-table class="proto-table" :data="paged" border :size="dense ? 'small' : 'default'" empty-text="暂无数据" height="100%">
        <el-table-column type="index" label="序号" width="56" align="center" :index="i => (pageNo-1)*size + i + 1" />
        <el-table-column label="姓名" prop="xm" min-width="100" />
        <el-table-column label="工号" prop="gh" min-width="110" />
        <el-table-column label="评选批次" min-width="200"><template #default="{row}">{{ pcName(row.pcid) }}</template></el-table-column>
        <el-table-column label="评测学年" prop="pcxnmc" min-width="140" />
        <el-table-column label="学院" prop="szxy" min-width="120" />
        <el-table-column label="性别" min-width="72"><template #default="{row}">{{ row.xb==='1'?'男':(row.xb==='2'?'女':'-') }}</template></el-table-column>
        <el-table-column label="政治面貌" prop="zzmm" min-width="120" />
        <el-table-column label="职称(务)" prop="zw" min-width="100" />
        <el-table-column label="任班导师时间" min-width="200"><template #default="{row}">{{ rzRange(row) }}</template></el-table-column>
        <el-table-column label="负责班级" prop="bjmc" min-width="160" />
        <el-table-column label="流程状态" min-width="120"><template #default="{row}">{{ dictLabel('flowStatus', row.flowStatus) }}</template></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{row}">
            <div class="op-links">
              <span v-if="!isInit(row)" class="op-link" @click="view(row)">详情</span>
              <span v-else class="op-link" @click="handle(row)">办理</span>
              <span class="op-link" @click="remind(row)">催办</span>
              <span class="op-link danger" @click="cancel(row)">撤销</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
      </div></div>
      <div class="table-pagination">
        <el-pagination :total="rows.length" v-model:current-page="pageNo" v-model:page-size="size" :page-sizes="[10,20,50,100]" layout="total, prev, pager, next, sizes" />
      </div>
    </div>`,
  };

  /* ---------- 流程表单 + 办理壳 ---------- */
  const LcTask = {
    props: { view: String, id: String, from: String },
    data() {
      return { page: 'formInfo', form: this.blank(), commitVisible: false, operation: null, copy: [] };
    },
    computed: {
      app() { return this.id ? S.state.yxbds.find(a => a.id === this.id) : null; },
      mode() {
        if (this.view === 'form') return 'start';
        if (this.view === 'handle') return 'handle';
        return 'view';
      },
      readOnly() { return this.mode !== 'start'; },
      role() { return S.role(); },
      taskName() {
        if (this.mode === 'start') return '启动流程';
        const a = this.app;
        if (!a) return '';
        if (a.lczt === '1') return (NODES()[a.currentNode] || {}).name;
        return '';
      },
      tabs() {
        const t = [{ k: 'formInfo', n: '表单信息' }];
        if (this.mode === 'start') t.push({ k: 'copyInfo', n: '抄送设置' }); else t.push({ k: 'copyInfoYSP', n: '抄送人' });
        t.push({ k: 'flowProcess', n: '流程图' });
        if (this.mode === 'handle') t.push({ k: 'assigneeList', n: '当前审批人' });
        if (this.mode !== 'start' || (this.app && this.app.flowStatus !== 6)) t.push({ k: 'approveInfo', n: '审批记录' });
        return t;
      },
      batchOptions() {
        const list = S.state.yxbdsPc.filter(p => window.RULES.pcShzt(p) === '1' && String(p.ext1) === '1');
        if (this.form.pcid && !list.find(p => p.id === this.form.pcid)) { const cur = pcOf(this.form.pcid); if (cur.id) list.push(cur); }
        return list.map(p => ({ label: p.pcmc, value: p.id }));
      },
      pcxnOptions() {
        const pc = pcOf(this.form.pcid);
        if (!pc.id) return [];
        const xn = S.state.xnList.find(x => x.id === pc.xnid);
        return xn ? [{ label: xn.mc, value: xn.id }] : [];
      },
      batchHint() {
        const pc = pcOf(this.form.pcid);
        const parts = [];
        if (pc.rzsczx > 0) parts.push('本批次要求评选学年内担任班导师不少于 ' + pc.rzsczx + ' 个月');
        if (pc.id && Number(pc.sfkcp) === 0) parts.push('本批次不允许兼任辅导员参评');
        return parts.join('；');
      },
      bjOptions() {
        const b = S.state.bds.find(x => x.gh === this.form.gh);
        return b ? (b.bjbhList || []).map(x => ({ label: S.className(x), value: x })) : [];
      },
      rzRangeModel: {
        get() { return this.form.rzkssj && this.form.rzjssj ? [this.form.rzkssj, this.form.rzjssj] : []; },
        set(v) { if (v && v.length === 2) { this.form.rzkssj = v[0]; this.form.rzjssj = v[1]; } else { this.form.rzkssj = ''; this.form.rzjssj = ''; } },
      },
      rules() {
        return {
          pcid: [{ required: true, message: '请选择评选批次', trigger: 'change' }],
          pcxnid: [{ required: true, message: '请选择评选学年', trigger: 'change' }],
          xm: [{ required: true, message: '请填写姓名', trigger: 'blur' }],
          gh: [{ required: true, message: '请填写工号', trigger: 'blur' }],
          xb: [{ required: true, message: '请选择性别', trigger: 'change' }],
          xybm: [{ required: true, message: '请选择学院', trigger: 'change' }],
          zzmm: [{ required: true, message: '请选择政治面貌', trigger: 'change' }],
          rzkssj: [{ required: true, message: '请选择任班导师时间', trigger: 'change' }],
          zw: [{ required: true, message: '请选择职称', trigger: 'change' }],
          lxdh: [{ required: true, message: '请填写联系电话', trigger: 'blur' }],
        };
      },
      assignees() {
        const a = this.app;
        if (!a || a.lczt !== '1') return [];
        const u = window.yxNodeUser(a.currentNode, a.xybm);
        const r = window.ROLES.find(x => x.key === NODES()[a.currentNode].role);
        return [{ loginName: r && u.user === r.xm ? r.gh : '-', showName: u.user, delegated: '', time: '' }];
      },
      canHandle() {
        const a = this.app;
        if (!a || a.lczt !== '1') return false;
        const node = NODES()[a.currentNode];
        if (!node) return false;
        if (node.role === 'xbzr') return window.isYxZg(a.xybm);
        if (node.role !== this.role.key) return false;
        if (this.role.scope === 'college' && a.xybm !== this.role.xybm) return false;
        return true;
      },
      initiator() { return this.app ? this.app.createUser : this.role.xm; },
    },
    watch: { id: { immediate: true, handler() { this.load(); } }, view() { this.load(); } },
    methods: {
      blank() { return { id: '', pcid: '', pcxnid: '', pcxnmc: '', xm: '', gh: '', xb: '', xybm: '', szxy: '', zzmm: '', rzkssj: '', rzjssj: '', zw: '', lxdh: '', bjbh: '', bjmc: '', sfccpbb: '', zysj: '', zmcl: [] }; },
      load() {
        this.page = 'formInfo';
        if (this.app) { this.form = Object.assign(this.blank(), JSON.parse(JSON.stringify(this.app))); return; }
        const r = S.role();
        const j = S.findJzg(r.gh) || {};
        this.form = Object.assign(this.blank(), { xm: r.xm, gh: r.gh, xb: j.xb || '', zzmm: j.zzmm || '', lxdh: j.lxdh || '', xybm: j.xybm && j.xybm !== 'xgb' ? j.xybm : '', szxy: j.xybm && j.xybm !== 'xgb' ? j.szxy : '' });
        const b = S.state.bds.find(x => x.gh === r.gh);
        if (b) this.form.rzkssj = '';
      },
      collegeName(x) { return S.collegeName(x) || x; },
      onPcidChange() {
        const opts = this.pcxnOptions;
        this.form.pcxnid = opts.length === 1 ? opts[0].value : '';
        this.form.pcxnmc = opts.length === 1 ? opts[0].label : '';
      },
      onPcxnChange(v) { const o = this.pcxnOptions.find(x => x.value === v); this.form.pcxnmc = o ? o.label : ''; },
      onBjChange(v) { this.form.bjmc = v ? S.className(v) : ''; },
      pickFile() { this.$refs.file.click(); },
      onFile(e) {
        const files = Array.from(e.target.files || []);
        if (this.form.zmcl.length + files.length > 10) { ElementPlus.ElMessage.error('已经超出最大上传个数限制'); return; }
        files.forEach(f => this.form.zmcl.push({ name: f.name, size: f.size > 1048576 ? (f.size / 1048576).toFixed(1) + 'MB' : Math.ceil(f.size / 1024) + 'KB' }));
        e.target.value = '';
      },
      back() {
        if (this.from === 'todo') go('/todo'); else go('/yxbdspx/yxbds');
      },
      tenureCheck() {
        const pc = pcOf(this.form.pcid);
        if (!(pc.rzsczx > 0) || !this.form.rzkssj || !this.form.rzjssj) return true;
        const xn = S.state.xnList.find(x => x.id === this.form.pcxnid) || {};
        const r = window.RULES.validateTenureInXn({ qsnf: xn.qsnf, jsnf: xn.jsnf, pcxnmc: this.form.pcxnmc || xn.mc, rzkssj: this.form.rzkssj, rzjssj: this.form.rzjssj, rzsczx: pc.rzsczx });
        if (!r.ok) { warn(r.message || '任班导师时长不满足本批次要求'); return false; }
        return true;
      },
      persist(asDraft) {
        let a = this.app;
        const data = JSON.parse(JSON.stringify(this.form));
        data.szxy = S.collegeName(data.xybm);
        if (!a) {
          const seq = S.state.woSeq++;
          const d = new Date();
          a = Object.assign(data, {
            id: 'yx' + seq,
            workOrderCode: 'YXBDS' + d.getFullYear() + window.SEED_UTIL.pad(d.getMonth() + 1) + window.SEED_UTIL.pad(d.getDate()) + window.SEED_UTIL.pad(seq) + '0' + (100 + seq),
            createTime: S.now(), createUser: S.role().xm, records: [], currentNode: 0, flowStatus: 6, lczt: '0', shzt: '',
          });
          S.state.yxbds.push(a);
        } else Object.assign(a, data, { id: a.id, workOrderCode: a.workOrderCode, records: a.records, createTime: a.createTime, createUser: a.createUser });
        if (!asDraft) {
          a.records.push({ node: '申请', user: a.xm, role: '班导师', action: '提交', opinion: '', time: S.now() });
          a.currentNode = 1; a.flowStatus = 1; a.lczt = '1'; a.shzt = window.yxShztByNode(1);
        }
        return a;
      },
      saveDraft() {
        const err = window.RULES.validateBatchEligibility(this.form, this.app && this.app.id);
        if (err) { warn(err); return; }
        const a = this.persist(true);
        ElementPlus.ElMessage.success('草稿保存成功！');
        if (!this.id) go('/yxbdspx/yxbds', { view: 'form', id: a.id });
      },
      submit() {
        this.page = 'formInfo';
        this.$nextTick(() => this.$refs.f.validate(ok => {
          if (!ok) return;
          if (!this.tenureCheck()) return;
          const err = window.RULES.validateBatchEligibility(this.form, this.app && this.app.id);
          if (err) { warn(err); return; }
          this.persist(false);
          ElementPlus.ElMessage.success('启动成功！');
          this.back();
        }));
      },
      openOp(type) {
        this.operation = type === 'agree' ? { type: 'agree', label: '同意' } : { type: 'refuse', label: '驳回' };
        this.commitVisible = true;
      },
      doCommit({ message }) {
        const a = this.app;
        const i = a.currentNode;
        const node = NODES()[i];
        const u = window.yxNodeUser(i, a.xybm);
        if (this.operation.type === 'agree') {
          if (node.key === 'Activity_1751t1c') {
            const q = window.RULES.validateCollegeQuota(a);
            if (!q.ok) { warn(q.message); return; }
          }
          a.records.push({ node: node.name, user: S.role().xm || u.user, role: u.roleName, action: '同意', opinion: message, time: S.now() });
          if (i >= NODES().length - 1) { a.currentNode = NODES().length; a.flowStatus = 3; a.lczt = '3'; a.shzt = '3'; }
          else { a.currentNode = i + 1; a.shzt = window.yxShztByNode(i + 1); }
        } else {
          a.records.push({ node: node.name, user: S.role().xm || u.user, role: u.roleName, action: '驳回', opinion: message, time: S.now() });
          a.flowStatus = 2; a.lczt = '2'; a.shzt = '2';
        }
        this.commitVisible = false;
        ElementPlus.ElMessage.success(this.operation.label + '成功！');
        this.back();
      },
    },
    template: `
    <div class="lc-handle" style="position:relative">
      <div class="lc-back-corner" title="返回" @click="back"><el-icon><RefreshLeft /></el-icon></div>
      <div class="lc-tabs">
        <div v-for="t in tabs" :key="t.k" class="lc-tab" :class="{ active: page === t.k }" @click="page = t.k">{{ t.n }}</div>
      </div>
      <div class="lc-titlebar">
        <div class="t">优秀班导师
          <span v-if="taskName" class="lc-node-tag">当前节点：{{ taskName }}</span>
          <span v-if="mode !== 'start'" class="lc-node-tag" style="color:#909399;background:#f4f4f5;border-color:#e9e9eb">发起人：{{ initiator }}</span>
          <span v-if="app && mode !== 'start'" class="text-muted fs12" style="font-weight:400">工单编号：{{ app.workOrderCode }}　流程状态：{{ dictLabel('flowStatus', app.flowStatus) }}</span>
        </div>
        <div class="flex_a">
          <template v-if="mode === 'start'">
            <el-button type="success" plain @click="saveDraft">保存草稿</el-button>
            <el-button type="primary" plain @click="submit">提交</el-button>
          </template>
          <template v-else-if="mode === 'handle' && canHandle">
            <el-button type="primary" @click="openOp('agree')">同意</el-button>
            <el-button type="danger" plain @click="openOp('refuse')">驳回</el-button>
          </template>
          <span v-else-if="mode === 'handle'" class="text-muted fs12">当前角色不是该节点审批人，仅可查看</span>
        </div>
      </div>

      <el-form v-show="page === 'formInfo'" ref="f" :model="form" :rules="rules" label-position="top" :disabled="readOnly">
        <div class="lc-group-title">基础信息</div>
        <div class="lc-grid">
          <div class="lc-cell span-2"><el-form-item label="评选批次" prop="pcid"><el-select v-model="form.pcid" placeholder="请选择" filterable @change="onPcidChange"><el-option v-for="o in batchOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></div>
          <div class="lc-cell span-2"><el-form-item label="评选学年" prop="pcxnid"><el-select v-model="form.pcxnid" placeholder="请选择" filterable @change="onPcxnChange"><el-option v-for="o in pcxnOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></div>
          <div class="lc-cell"><el-form-item label="姓名" prop="xm"><el-input v-model="form.xm" disabled placeholder="请输入" /></el-form-item></div>
          <div class="lc-cell"><el-form-item label="性别" prop="xb"><el-select v-model="form.xb" placeholder="请选择"><el-option label="男" value="1" /><el-option label="女" value="2" /></el-select></el-form-item></div>
          <div class="lc-cell"><el-form-item label="工号" prop="gh"><el-input v-model="form.gh" disabled placeholder="请输入" /></el-form-item></div>
          <div class="lc-cell"><el-form-item label="学院" prop="xybm"><el-select v-model="form.xybm" disabled placeholder="请选择"><el-option v-for="c in $S.collegeOptions()" :key="c.value" :label="c.label" :value="c.value" /></el-select></el-form-item></div>
          <div class="lc-cell"><el-form-item label="政治面貌" prop="zzmm"><el-select v-model="form.zzmm" placeholder="请选择" filterable><el-option v-for="z in DICT.zzmm" :key="z.value" :label="z.label" :value="z.value" /></el-select></el-form-item></div>
          <div class="lc-cell span-2"><el-form-item label="任班导师时间" prop="rzkssj">
            <el-date-picker v-model="rzRangeModel" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width:100%" />
            <div v-if="batchHint" class="hint-line">{{ batchHint }}</div>
          </el-form-item></div>
          <div class="lc-cell"><el-form-item label="职称（务）" prop="zw"><el-select v-model="form.zw" placeholder="请选择" filterable allow-create><el-option v-for="z in DICT.zw" :key="z.value" :label="z.label" :value="z.value" /></el-select></el-form-item></div>
          <div class="lc-cell span-2"><el-form-item label="联系电话" prop="lxdh"><el-input v-model="form.lxdh" placeholder="请输入" /></el-form-item></div>
          <div class="lc-cell span-2"><el-form-item label="负责班级"><el-select v-model="form.bjbh" placeholder="请选择" clearable filterable @change="onBjChange"><el-option v-for="o in bjOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></div>
          <div class="lc-cell span-4"><el-form-item label="是否参评标兵"><el-radio-group v-model="form.sfccpbb"><el-radio value="1">是</el-radio><el-radio value="0">否</el-radio></el-radio-group></el-form-item></div>
        </div>
        <div class="lc-group-title">主要事迹（重点考察政治素质、履职规范、工作成效及学生评价）</div>
        <div class="lc-grid">
          <div class="lc-cell span-4"><el-form-item label="主要事迹"><el-input v-model="form.zysj" type="textarea" :rows="5" placeholder="请输入本学年主要业绩" /></el-form-item></div>
        </div>
        <div class="lc-group-title">证明文件</div>
        <div>
          <el-button v-if="!readOnly" icon="Upload" @click="pickFile">上传文件</el-button>
          <input ref="file" type="file" multiple style="display:none" @change="onFile" />
          <div class="mt10">
            <div v-for="(f,i) in form.zmcl" :key="i" class="file-chip"><el-icon><Document /></el-icon>{{ f.name }}<span class="text-muted fs12">{{ f.size }}</span><span v-if="!readOnly" class="x" @click="form.zmcl.splice(i,1)">✕</span></div>
            <span v-if="!form.zmcl.length && readOnly" class="text-muted fs12">无</span>
          </div>
        </div>
      </el-form>

      <copy-for-select v-if="page === 'copyInfo'" />
      <div v-if="page === 'copyInfoYSP'" class="text-muted" style="padding:40px;text-align:center">暂无抄送人</div>
      <flow-chart v-if="page === 'flowProcess'" :app="app" />
      <div v-if="page === 'assigneeList'" style="padding-top:12px">
        <el-table class="proto-table" :data="assignees" border empty-text="暂无数据">
          <el-table-column type="index" label="序号" width="100" />
          <el-table-column label="审批人登录名" prop="loginName" />
          <el-table-column label="审批人姓名" prop="showName" />
          <el-table-column label="被委托人" prop="delegated" />
          <el-table-column label="处理时间" prop="time" />
        </el-table>
      </div>
      <approve-records v-if="page === 'approveInfo'" :records="app ? app.records : []" style="padding-top:12px" />

      <task-commit-dialog v-model="commitVisible" :operation="operation" @confirm="doCommit" />
    </div>`,
  };

  ProtoPages['/yxbdspx/yxbds'] = {
    components: { LcList, LcTask },
    props: { query: Object },
    computed: { view() { return (this.query && this.query.view) || 'list'; } },
    template: `
    <div class="lc-frame">
      <lc-list v-if="view === 'list'" />
      <lc-task v-else :key="view + (query.id || 'new')" :view="view" :id="query.id" :from="query.from" />
    </div>`,
  };
})();
