/*
 * 优秀班导师评选：
 *  /fdydwjs/yxbdspx/yxbdsgl   优秀班导师（只读，yxbdsgl.vue）
 *  /fdydwjs/yxbdspx/yxbdsmdJs 优秀班导师（角色端，yxbdsmdJs.vue：暂存 / 提交审核）
 *  学工端维护版 yxbdsmd.vue 复用于「评选规则配置 > 查看名单」抽屉（见 pxgzpz.js）
 *  /yxbdspx/yxbbsjb           优秀班导师标兵（yxbbsjb.vue）
 */
(function () {
  const S = window.Store;
  const warn = m => ElementPlus.ElMessage.warning(m);
  const ok = m => ElementPlus.ElMessage.success(m);
  const pcOf = id => S.state.yxbdsPc.find(p => p.id === id) || {};
  const xbLabel = v => (String(v) === '1' ? '男' : (String(v) === '2' ? '女' : '-'));
  const lcztTag = v => ({ 3: 'success', 2: 'danger', 1: 'warning' }[String(v)] || 'info');
  const bdsdsjOpts = window.DICT.bdsdsj;
  window.YX_FMT = { xbLabel, lcztTag };

  /* ---------- 不符合参评资格（YxbdsPcxEligibilityDialog.vue） ---------- */
  ProtoComponents.YxbdsPcxEligibilityDialog = {
    props: { modelValue: Boolean, message: String },
    emits: ['update:modelValue'],
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" width="420px" align-center append-to-body :show-close="false">
      <div class="elig-body">
        <el-icon :size="48" color="#e6a23c"><WarningFilled /></el-icon>
        <div class="t">不符合参评资格</div>
        <div class="m">{{ message || '所选评选批次与个人条件不满足参评要求，请核对后重试。' }}</div>
      </div>
      <template #footer><div style="text-align:center"><el-button type="primary" style="min-width:120px" @click="$emit('update:modelValue', false)">我知道了</el-button></div></template>
    </el-dialog>`,
  };

  /* ---------- 优秀班导师新增 / 编辑（YxbdsmdEditDialog.vue） ---------- */
  ProtoComponents.YxbdsmdEditDialog = {
    props: { modelValue: Boolean, editId: String, defaultPcid: String, lockPcid: Boolean, applyMode: Boolean },
    emits: ['update:modelValue', 'success'],
    data() { return { form: this.blank(), files: [], eligVisible: false, eligMsg: '' }; },
    computed: {
      title() { return this.editId ? '优秀班导师编辑' : '优秀班导师新增'; },
      isSelf() { return this.applyMode && S.role().scope === 'self'; },
      locked() { return this.isSelf && !this.editId; },
      batchOptions() { return S.state.yxbdsPc.filter(p => String(p.ext1) !== '0').map(p => ({ label: p.pcmc, value: p.id })); },
      pcxnOptions() { const pc = pcOf(this.form.pcid); const xn = S.state.xnList.find(x => x.id === pc.xnid); return xn ? [{ label: xn.mc, value: xn.id }] : []; },
      batchHint() {
        const pc = pcOf(this.form.pcid); const p = [];
        if (pc.rzsczx > 0) p.push('本批次要求评选学年内担任班导师不少于 ' + pc.rzsczx + ' 个月');
        if (pc.id && Number(pc.sfkcp) === 0) p.push('本批次不允许兼任辅导员参评');
        return p.join('；');
      },
      bjOptions() { return this.form.xybm ? S.classesOf(this.form.xybm).map(c => ({ label: c.bjmc, value: c.bjbh })) : []; },
    },
    watch: {
      modelValue(v) {
        if (!v) return;
        this.form = this.blank();
        this.files = [];
        if (this.editId) {
          const d = S.state.yxbds.find(a => a.id === this.editId);
          if (d) { Object.assign(this.form, JSON.parse(JSON.stringify(d))); this.files = JSON.parse(JSON.stringify(d.zmcl || [])); }
        } else {
          if (this.defaultPcid) { this.form.pcid = this.defaultPcid; this.onPcidChange(); }
          if (this.locked) this.fillByGh(S.role().gh, true);
        }
      },
    },
    methods: {
      blank() { return { pcid: '', pcxnid: '', pcxnmc: '', xm: '', gh: '', xb: '', zzmm: '', xybm: '', szxy: '', rzkssj: '', rzjssj: '', zw: '', lxdh: '', sfccpbb: '1', zysj: '', bjbh: '', bjmc: '' }; },
      close() { this.$emit('update:modelValue', false); },
      onPcidChange() { const o = this.pcxnOptions; this.form.pcxnid = o.length === 1 ? o[0].value : ''; this.form.pcxnmc = o.length === 1 ? o[0].label : ''; },
      onPcxnChange(v) { const o = this.pcxnOptions.find(x => x.value === v); this.form.pcxnmc = o ? o.label : ''; },
      onXyChange() { this.form.szxy = S.collegeName(this.form.xybm); this.form.bjbh = ''; this.form.bjmc = ''; },
      onBjChange(v) { this.form.bjmc = S.className(v); },
      fillByGh(gh, silent) {
        const m = S.findJzg(gh);
        if (!m) { if (!silent) warn('未查询到该工号的教职工信息'); return false; }
        const zw = window.DICT.zw.map(z => z.value).filter(z => (m.zc || '').includes(z)).sort((a, b) => b.length - a.length)[0];
        Object.assign(this.form, { gh: m.gh, xm: m.xm, xb: m.xb, zzmm: m.zzmm, lxdh: m.lxdh, zw: zw || this.form.zw });
        if (m.xybm && S.collegeName(m.xybm)) { this.form.xybm = m.xybm; this.form.szxy = S.collegeName(m.xybm); }
        const b = S.state.bds.find(x => x.gh === m.gh);
        if (b && b.bjbhList && b.bjbhList[0]) { this.form.bjbh = b.bjbhList[0]; this.form.bjmc = S.className(b.bjbhList[0]); }
        if (!silent) ok('已根据工号带出教职工信息');
        return true;
      },
      searchGh() { const gh = (this.form.gh || '').trim(); if (!gh) { warn('请先输入工号'); return; } this.fillByGh(gh, false); },
      pickFile() { this.$refs.file.click(); },
      onFile(e) {
        const f = e.target.files[0]; e.target.value = '';
        if (!f) return;
        if (!/\.(rar|zip|doc|docx|pdf)$/i.test(f.name)) { ElementPlus.ElMessage.error('仅支持 .rar .zip .doc .docx .pdf'); return; }
        if (f.size > 20 * 1024 * 1024) { ElementPlus.ElMessage.error('单个文件不能超过20MB'); return; }
        this.files.push({ name: f.name, size: f.size > 1048576 ? (f.size / 1048576).toFixed(1) + 'MB' : Math.ceil(f.size / 1024) + 'KB' });
        ok('上传成功');
      },
      preview(f) { ElementPlus.ElMessage.info('预览：' + f.name + '（原型不含真实文件）'); },
      validate() {
        const f = this.form;
        if (!f.pcid) return warn('请选择评选批次'), false;
        if (!f.pcxnid) return warn('请选择评选学年'), false;
        if (!f.xm || !f.gh) return warn('请填写姓名、工号'), false;
        if (!f.xb) return warn('请选择性别'), false;
        if (!f.zzmm || !f.xybm) return warn('请选择政治面貌、学院'), false;
        if (!f.rzkssj || !f.rzjssj) return warn('请选择任班导师开始、结束日期'), false;
        if (f.rzjssj < f.rzkssj) return warn('结束日期不能早于开始日期'), false;
        if (!f.zw || !f.lxdh) return warn('请填写职称、联系电话'), false;
        if (!f.bjbh) return warn('请选择负责班级'), false;
        const pc = pcOf(f.pcid);
        if (pc.rzsczx > 0) {
          const xn = S.state.xnList.find(x => x.id === f.pcxnid) || {};
          const r = window.RULES.validateTenureInXn({ qsnf: xn.qsnf, jsnf: xn.jsnf, pcxnmc: f.pcxnmc || xn.mc, rzkssj: f.rzkssj, rzjssj: f.rzjssj, rzsczx: pc.rzsczx });
          if (!r.ok) return warn(r.message || '任班导师时长不满足本批次要求'), false;
        }
        return true;
      },
      save(tjsh) {
        if (!this.validate()) return;
        const err = window.RULES.validateBatchEligibility(this.form, this.editId);
        if (err) { this.eligMsg = err; this.eligVisible = true; return; }
        const data = Object.assign(JSON.parse(JSON.stringify(this.form)), { szxy: S.collegeName(this.form.xybm), zmcl: JSON.parse(JSON.stringify(this.files)) });
        if (this.editId) {
          const a = S.state.yxbds.find(x => x.id === this.editId);
          Object.assign(a, data, { id: a.id, records: a.records, workOrderCode: a.workOrderCode, createTime: a.createTime, flowStatus: a.flowStatus, currentNode: a.currentNode, lczt: a.lczt, shzt: a.shzt });
          if (tjsh === 0) { a.shzt = ''; a.lczt = '0'; }
          if (tjsh === 1) { a.shzt = '0'; a.lczt = '1'; }
        } else {
          const draft = tjsh === 0;
          S.state.yxbds.push(Object.assign(data, {
            id: S.uid('yxmd'), workOrderCode: '', createTime: S.now(), createUser: S.role().xm, records: [], currentNode: 0,
            flowStatus: draft ? 6 : 1, lczt: draft ? '0' : '1', shzt: draft ? '' : '0',
          }));
        }
        let msg = this.editId ? '修改成功' : '保存成功';
        if (this.applyMode && tjsh === 0) msg = '已暂存';
        if (this.applyMode && tjsh === 1) msg = '已提交审核';
        ok(msg);
        this.close();
        this.$emit('success');
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" :title="title" width="980px" align-center destroy-on-close append-to-body class="dlg-title-lg">
      <div class="sec-title-dk">基础信息</div>
      <div class="info-grid compact cols-4">
        <div class="info-cell span-2"><div class="lab"><span class="req">*</span>评选批次</div>
          <el-select v-model="form.pcid" placeholder="请选择" filterable :disabled="lockPcid" @change="onPcidChange"><el-option v-for="o in batchOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></div>
        <div class="info-cell span-2"><div class="lab"><span class="req">*</span>评选学年</div>
          <el-select v-model="form.pcxnid" placeholder="请选择" @change="onPcxnChange"><el-option v-for="o in pcxnOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>姓名</div><el-input v-model="form.xm" placeholder="请输入" clearable :disabled="locked" /></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>性别</div><el-select v-model="form.xb" placeholder="请选择" clearable><el-option label="男" value="1" /><el-option label="女" value="2" /></el-select></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>工号</div>
          <el-input v-model="form.gh" placeholder="请输入" clearable :disabled="locked" @keyup.enter="searchGh"><template v-if="!locked" #append><el-button icon="Search" title="按工号查询教职工并填充" @click="searchGh" /></template></el-input></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>学院</div>
          <el-select v-model="form.xybm" placeholder="请选择" filterable :disabled="locked" @change="onXyChange"><el-option v-for="o in $S.collegeOptions()" :key="o.value" :label="o.label" :value="o.value" /></el-select></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>政治面貌</div><el-select v-model="form.zzmm" placeholder="请选择" filterable><el-option v-for="z in DICT.zzmm" :key="z.value" :label="z.label" :value="z.value" /></el-select></div>
        <div class="info-cell span-2"><div class="lab"><span class="req">*</span>任班导师时间</div>
          <div class="flex_a" style="gap:8px">
            <el-date-picker v-model="form.rzkssj" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" style="flex:1" />
            <span>至</span>
            <el-date-picker v-model="form.rzjssj" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" style="flex:1" />
          </div>
          <div v-if="batchHint" class="hint-line">{{ batchHint }}</div></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>职称（务）</div><el-select v-model="form.zw" placeholder="请选择" filterable allow-create><el-option v-for="z in DICT.zw" :key="z.value" :label="z.label" :value="z.value" /></el-select></div>
        <div class="info-cell span-2"><div class="lab"><span class="req">*</span>联系电话</div><el-input v-model="form.lxdh" placeholder="请输入" clearable /></div>
        <div class="info-cell span-2"><div class="lab"><span class="req">*</span>负责班级</div>
          <el-select v-model="form.bjbh" placeholder="请选择" filterable clearable @change="onBjChange"><el-option v-for="o in bjOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></div>
        <div class="info-cell span-4"><div class="lab">是否参评标兵</div><el-radio-group v-model="form.sfccpbb"><el-radio value="1">是</el-radio><el-radio value="0">否</el-radio></el-radio-group></div>
      </div>
      <div class="sec-title-dk">主要事迹（重点考察政治素质、履职规范、工作成效及学生评价）</div>
      <el-input v-model="form.zysj" type="textarea" :rows="5" placeholder="请输入本学年主要业绩" />
      <div class="sec-title-dk mt16">证明文件</div>
      <div>
        <el-button icon="Upload" @click="pickFile">上传文件</el-button>
        <span class="text-muted fs12 ml10">支持 .rar .zip .doc .docx .pdf，单个文件不超过 20MB</span>
        <input ref="file" type="file" accept=".rar,.zip,.doc,.docx,.pdf" style="display:none" @change="onFile" />
        <div class="mt10">
          <div v-for="(f,i) in files" :key="i" class="flex_a" style="gap:10px;padding:4px 0">
            <el-icon><Document /></el-icon><span>{{ f.name }}</span><span class="text-muted fs12">{{ f.size }}</span>
            <el-button type="primary" link @click="preview(f)">查看</el-button>
            <el-button type="primary" link @click="preview(f)">下载</el-button>
            <el-button type="danger" link @click="files.splice(i,1)">移除</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="close">取消</el-button>
        <template v-if="applyMode">
          <el-button type="primary" plain @click="save(0)">暂存</el-button>
          <el-button type="primary" @click="save(1)">提交审核</el-button>
        </template>
        <el-button v-else type="primary" @click="save()">确定</el-button>
      </template>
      <yxbds-pcx-eligibility-dialog v-model="eligVisible" :message="eligMsg" />
    </el-dialog>`,
  };

  /* ---------- 优秀班导师详情（YxbdsmdDetailDialog.vue） ---------- */
  ProtoComponents.YxbdsmdDetailDialog = {
    props: { modelValue: Boolean, detailId: String },
    emits: ['update:modelValue'],
    computed: {
      d() { return S.state.yxbds.find(a => a.id === this.detailId) || {}; },
      cells() {
        const d = this.d, pc = pcOf(d.pcid);
        return [
          ['评选批次', pc.pcmc, 2], ['评选学年', d.pcxnmc, 2], ['姓名', d.xm], ['性别', xbLabel(d.xb)], ['工号', d.gh], ['学院', d.szxy],
          ['政治面貌', d.zzmm], ['任班导师时间', window.yxRzRange(d), 2], ['职称（务）', d.zw], ['联系电话', d.lxdh], ['负责班级', d.bjmc], ['是否参评标兵', String(d.sfccpbb) === '1' ? '是' : (String(d.sfccpbb) === '0' ? '否' : '-')],
          ['流程状态', window.dictLabel('lczt', d.lczt)],
        ];
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" title="优秀班导师详情" width="980px" align-center destroy-on-close append-to-body class="dlg-title-lg">
      <div class="sec-title-dk">基础信息</div>
      <div class="info-grid cols-4">
        <div v-for="c in cells" :key="c[0]" class="info-cell" :class="c[2] ? 'span-' + c[2] : ''"><div class="lab">{{ c[0] }}</div><div class="val">{{ c[1] || '-' }}</div></div>
      </div>
      <div class="sec-title-dk">主要事迹（重点考察政治素质、履职规范、工作成效及学生评价）</div>
      <div style="border:1px solid #c7e1f0;border-radius:4px;padding:12px;line-height:24px;min-height:80px;white-space:pre-wrap">{{ d.zysj || '-' }}</div>
      <div class="sec-title-dk mt16">证明文件</div>
      <div v-if="d.zmcl && d.zmcl.length"><span v-for="(f,i) in d.zmcl" :key="i" class="file-chip"><el-icon><Document /></el-icon>{{ f.name }}<span class="text-muted fs12">{{ f.size }}</span></span></div>
      <div v-else class="text-muted">暂无证明文件</div>
    </el-dialog>`,
  };

  /* ---------- 优秀班导师名单（yxbdsgl / yxbdsmd / yxbdsmdJs / 抽屉 共用） ---------- */
  ProtoComponents.YxbdsmdList = {
    props: { mode: { type: String, default: 'readonly' }, lockPcid: String },
    data() {
      return { model: { xm: '', gh: '', pcid: '', pcxn: '', xybm: '', xb: '', zzmm: '', bdsdsj: '', zw: '', sfccpbb: '', lczt: '' }, q: {}, editVisible: false, editId: '', detailVisible: false, detailId: '', zgVisible: false, zgGh: '' };
    },
    created() { this.q = Object.assign({}, this.model); },
    computed: {
      conditions() {
        const pcOpts = () => S.state.yxbdsPc.filter(p => String(p.ext1) !== '0').map(p => ({ label: p.pcmc, value: p.id }));
        const xnOpts = () => S.state.xnList.map(x => ({ label: x.mc, value: x.id }));
        const base = [{ label: '姓名', feild: 'xm', type: 'text' }, { label: '工号', feild: 'gh', type: 'text' }];
        if (this.mode === 'readonly') {
          return base.concat([
            { label: '评选批次', feild: 'pcid', type: 'select', filterable: true, options: pcOpts },
            { label: '评测学年', feild: 'pcxn', type: 'select', filterable: true, options: xnOpts },
            { label: '学院', feild: 'xybm', type: 'select', filterable: true, options: () => S.collegeOptions() },
            { label: '性别', feild: 'xb', type: 'select', options: window.DICT.xb },
            { label: '政治面貌', feild: 'zzmm', type: 'select', options: window.DICT.zzmm },
            { label: '职称(务)', feild: 'zw', type: 'select', options: window.DICT.zw },
            { label: '任班导师时间', feild: 'bdsdsj', type: 'select', options: bdsdsjOpts },
            { label: '流程状态', feild: 'lczt', type: 'select', placeholder: '全部', options: window.DICT.lczt },
          ]);
        }
        const list = base.concat([
          { label: '评选批次', feild: 'pcid', type: 'select', filterable: true, options: pcOpts },
          { label: '评选学年', feild: 'pcxn', type: 'select', filterable: true, options: xnOpts },
          { label: '学院', feild: 'xybm', type: 'select', filterable: true, options: () => S.collegeOptions() },
          { label: '性别', feild: 'xb', type: 'select', options: window.DICT.xb },
          { label: '政治面貌', feild: 'zzmm', type: 'select', options: window.DICT.zzmm },
          { label: '担任班导师时间', feild: 'bdsdsj', type: 'select', options: bdsdsjOpts },
          { label: '职称(务)', feild: 'zw', type: 'select', options: window.DICT.zw },
          { label: '是否参评标兵', feild: 'sfccpbb', type: 'select', options: window.DICT.yesno },
          { label: '流程状态', feild: 'lczt', type: 'select', placeholder: '全部', options: window.DICT.lczt },
        ]);
        return this.lockPcid ? list.filter(c => c.feild !== 'pcid') : list;
      },
      rows() {
        const q = this.q;
        let list = S.state.yxbds;
        if (this.mode === 'role') list = S.scopeFilter(list);
        if (this.lockPcid) list = list.filter(a => a.pcid === this.lockPcid);
        return list.filter(a =>
          (!q.xm || a.xm.includes(q.xm.trim())) && (!q.gh || a.gh.includes(q.gh.trim())) && (!q.pcid || a.pcid === q.pcid) &&
          (!q.pcxn || a.pcxnid === q.pcxn) && (!q.xybm || a.xybm === q.xybm) && (!q.xb || a.xb === q.xb) && (!q.zzmm || a.zzmm === q.zzmm) &&
          (!q.zw || a.zw === q.zw) && (!q.sfccpbb || String(a.sfccpbb) === q.sfccpbb) && (!q.lczt || a.lczt === q.lczt) &&
          (!q.bdsdsj || window.RULES.tenureBucket(a.rzkssj, a.rzjssj) === q.bdsdsj),
        ).slice().sort((a, b) => (a.createTime < b.createTime ? 1 : -1));
      },
      canWrite() {
        if (this.mode === 'maintain') return true;
        if (this.mode === 'role') return window.isYxZg(S.role().xybm);
        return false;
      },
      showZg() { return this.mode === 'role' && S.role().key === 'xbzr'; },
      zgNow() { return S.state.yxbdsZg || []; },
      zgOptions() {
        const xy = S.role().xybm;
        const has = new Set(this.zgNow.map(z => z.gh));
        return S.state.jzg.filter(j => j.xybm === xy && !has.has(j.gh));
      },
    },
    methods: {
      xbLabel, lcztTag,
      rz: a => window.yxRzRange(a),
      pcName: id => pcOf(id).pcmc,
      search() { this.q = Object.assign({}, this.model); },
      add() { this.editId = ''; this.editVisible = true; },
      edit(r) { this.editId = r.id; this.editVisible = true; },
      detail(r) { this.detailId = r.id; this.detailVisible = true; },
      exportList() {
        window.downloadCsv('优秀班导师名单', [
          { en: 'xm', cn: '姓名' }, { en: 'gh', cn: '工号' }, { cn: '评选批次', fmt: r => this.pcName(r.pcid) }, { en: 'pcxnmc', cn: '评测学年' },
          { en: 'szxy', cn: '学院' }, { cn: '性别', fmt: r => xbLabel(r.xb) }, { en: 'zzmm', cn: '政治面貌' }, { en: 'zw', cn: '职称(务)' },
          { cn: '任班导师时间', fmt: r => this.rz(r) }, { en: 'bjmc', cn: '负责班级' }, { cn: '流程状态', fmt: r => window.dictLabel('lczt', r.lczt) },
        ], this.rows);
        ok('已按当前筛选导出（可导出历年名单）');
      },
      addZg() {
        const j = this.zgOptions.find(x => x.gh === this.zgGh);
        if (!j) return warn('请选择本学院教职工');
        if (!S.state.yxbdsZg) S.state.yxbdsZg = [];
        S.state.yxbdsZg.push({ xybm: j.xybm, gh: j.gh, xm: j.xm });
        this.zgGh = '';
        this.zgVisible = false;
        ok('已添加专干，该人员可查看并审核本学院优秀班导师');
      },
      del(r) {
        ElementPlus.ElMessageBox.confirm('确定删除该条记录？删除后为逻辑删除。', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
          const i = S.state.yxbds.findIndex(a => a.id === r.id);
          if (i >= 0) S.state.yxbds.splice(i, 1);
          ok('已删除');
        }).catch(() => {});
      },
    },
    template: `
    <div class="flex_c" style="flex:1;min-height:0">
      <my-search :conditions="conditions" :model="model" @search="search" @reset="search" />
      <div class="page-gap"></div>
      <pro-table :data="rows">
        <template #operator>
          <el-button v-if="canWrite" type="primary" icon="Plus" @click="add">新增</el-button>
          <el-button v-if="showZg" @click="zgVisible = true">添加专干</el-button>
          <el-button type="primary" plain @click="exportList">导出（可导出历年名单）</el-button>
        </template>
        <template #default="{ seq }">
          <el-table-column type="index" label="序号" width="60" align="center" :index="seq" />
          <el-table-column label="姓名" prop="xm" min-width="100" />
          <el-table-column label="工号" prop="gh" min-width="110" />
          <el-table-column label="评选批次" min-width="200" show-overflow-tooltip><template #default="{row}">{{ pcName(row.pcid) }}</template></el-table-column>
          <el-table-column label="评测学年" prop="pcxnmc" min-width="140" />
          <el-table-column label="学院" prop="szxy" min-width="120" />
          <el-table-column label="性别" width="72"><template #default="{row}">{{ xbLabel(row.xb) }}</template></el-table-column>
          <el-table-column label="政治面貌" prop="zzmm" min-width="120" />
          <el-table-column label="职称(务)" prop="zw" min-width="100" />
          <el-table-column label="任班导师时间" min-width="230"><template #default="{row}">{{ rz(row) }}</template></el-table-column>
          <el-table-column label="负责班级" prop="bjmc" min-width="160" />
          <el-table-column label="流程状态" min-width="120"><template #default="{row}"><el-tag :type="lcztTag(row.lczt)" size="small" effect="plain">{{ dictLabel('lczt', row.lczt) }}</el-tag></template></el-table-column>
          <el-table-column label="操作" fixed="right" :min-width="canWrite ? 200 : 80">
            <template #default="{row}">
              <div class="op-links">
                <span class="op-link" @click="detail(row)">查看</span>
                <span v-if="canWrite" class="op-link" @click="edit(row)">编辑</span>
                <span v-if="mode === 'maintain'" class="op-link danger" @click="del(row)">删除</span>
              </div>
            </template>
          </el-table-column>
        </template>
      </pro-table>
      <yxbdsmd-edit-dialog v-model="editVisible" :edit-id="editId" :default-pcid="lockPcid" :lock-pcid="!!lockPcid" :apply-mode="mode === 'role'" />
      <yxbdsmd-detail-dialog v-model="detailVisible" :detail-id="detailId" />
      <el-dialog v-model="zgVisible" title="添加专干" width="520px" append-to-body>
        <div class="info-tip">默认专干为学办主任。添加后，主任和专干都能查看、审核本学院申报，并维护申报信息。</div>
        <div style="margin:8px 0 12px">当前专干：<span v-for="z in zgNow" :key="z.gh" style="margin-right:8px">{{ z.xm }}（{{ z.gh }}）</span></div>
        <el-select v-model="zgGh" filterable placeholder="选择本学院教职工" style="width:100%">
          <el-option v-for="j in zgOptions" :key="j.gh" :label="j.xm + '（' + j.gh + '）'" :value="j.gh" />
        </el-select>
        <template #footer>
          <el-button @click="zgVisible = false">关闭</el-button>
          <el-button type="primary" @click="addZg">确定</el-button>
        </template>
      </el-dialog>
    </div>`,
  };

  ProtoPages['/fdydwjs/yxbdspx/yxbdsgl'] = { template: `<yxbdsmd-list mode="readonly" />` };
  ProtoPages['/fdydwjs/yxbdspx/yxbdsmdJs'] = { template: `<yxbdsmd-list mode="role" />` };

  /* ---------- 优秀班导师标兵 ---------- */
  ProtoComponents.YxbbsjbEditDialog = {
    props: { modelValue: Boolean, editId: String },
    emits: ['update:modelValue'],
    data() { return { form: this.blank() }; },
    computed: {
      title() { return this.editId ? '优秀班导师标兵编辑' : '优秀班导师标兵新增'; },
      bjOptions() { return this.form.xybm ? S.classesOf(this.form.xybm).map(c => ({ label: c.bjmc, value: c.bjbh })) : []; },
    },
    watch: {
      modelValue(v) {
        if (!v) return;
        this.form = this.blank();
        if (this.editId) {
          const d = S.state.bbxx.find(x => x.id === this.editId);
          if (d) Object.assign(this.form, JSON.parse(JSON.stringify(d)), { rzStartYear: d.rzkssj, rzEndYear: d.rzjssj === '至今' ? '' : d.rzjssj, rzToNow: d.rzjssj === '至今' });
        }
      },
    },
    methods: {
      blank() { return { xm: '', gh: '', xybm: '', szxy: '', xb: '', zzmm: '', rzStartYear: '', rzEndYear: '', rzToNow: false, bjbh: '', bjmc: '', zw: '', lxdh: '', xnid: '', drsj: '', bz: '', zysj: '' }; },
      close() { this.$emit('update:modelValue', false); },
      searchGh() {
        const gh = (this.form.gh || '').trim();
        if (!gh) return warn('请先输入工号');
        const m = S.findJzg(gh);
        if (!m) return warn('未查询到该工号的教职工信息');
        Object.assign(this.form, { xm: m.xm, xb: m.xb, zzmm: m.zzmm, lxdh: m.lxdh });
        if (m.xybm && S.collegeName(m.xybm)) { this.form.xybm = m.xybm; this.form.szxy = S.collegeName(m.xybm); }
        ok('已根据工号带出教职工信息');
      },
      onToNow(v) { if (v) this.form.rzEndYear = ''; },
      save() {
        const f = this.form;
        if (!f.xm) return warn('请输入姓名');
        if (!f.gh) return warn('请输入工号');
        if (!f.xb) return warn('请选择性别');
        if (!f.zzmm) return warn('请选择政治面貌');
        if (!f.xybm) return warn('请选择学院');
        if (!f.rzStartYear) return warn('请选择担任班导师起始年份');
        if (!f.rzToNow && !f.rzEndYear) return warn('请选择结束年份或勾选至今');
        if (!f.rzToNow && f.rzEndYear < f.rzStartYear) return warn('结束年份不能早于起始年份');
        if (!f.bjbh) return warn('请选择负责班级');
        if (!f.zw) return warn('请选择职称（务）');
        if (!f.lxdh) return warn('请输入联系电话');
        if (!f.zysj) return warn('请填写主要业绩');
        if (f.zysj.length > 1000) return warn('主要业绩不超过1000字');
        const body = { xm: f.xm, gh: f.gh, xybm: f.xybm, szxy: S.collegeName(f.xybm), xb: f.xb, zzmm: f.zzmm, zw: f.zw, lxdh: f.lxdh, rzkssj: f.rzStartYear, rzjssj: f.rzToNow ? '至今' : f.rzEndYear, bjbh: f.bjbh, bjmc: S.className(f.bjbh), xnid: f.xnid, bz: f.bz, zysj: f.zysj };
        if (this.editId) Object.assign(S.state.bbxx.find(x => x.id === this.editId), body);
        else S.state.bbxx.unshift(Object.assign(body, { id: S.uid('bb'), drsj: S.today() }));
        ok('保存成功');
        this.close();
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" :title="title" width="980px" align-center destroy-on-close append-to-body class="dlg-title-lg">
      <div class="sec-title-dk">基础信息</div>
      <div class="info-grid compact cols-4">
        <div class="info-cell"><div class="lab"><span class="req">*</span>姓名</div><el-input v-model="form.xm" placeholder="请输入" clearable /></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>工号</div><el-input v-model="form.gh" placeholder="请输入" clearable @keyup.enter="searchGh"><template #append><el-button icon="Search" title="按工号查询教职工并填充" @click="searchGh" /></template></el-input></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>学院</div><el-select v-model="form.xybm" placeholder="请选择" filterable @change="form.bjbh=''"><el-option v-for="o in $S.collegeOptions()" :key="o.value" :label="o.label" :value="o.value" /></el-select></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>性别</div><el-select v-model="form.xb" placeholder="请选择" clearable><el-option label="男" value="1" /><el-option label="女" value="2" /></el-select></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>政治面貌</div><el-select v-model="form.zzmm" placeholder="请选择" filterable><el-option v-for="z in DICT.zzmm" :key="z.value" :label="z.label" :value="z.value" /></el-select></div>
        <div class="info-cell span-2"><div class="lab"><span class="req">*</span>担任班导师时间</div>
          <div class="flex_a" style="gap:8px">
            <el-date-picker v-model="form.rzStartYear" type="year" value-format="YYYY" placeholder="起始年份" style="flex:1" />
            <span>至</span>
            <el-date-picker v-model="form.rzEndYear" type="year" value-format="YYYY" placeholder="结束年份" :disabled="form.rzToNow" style="flex:1" />
            <el-checkbox v-model="form.rzToNow" @change="onToNow">至今</el-checkbox>
          </div></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>负责班级</div><el-select v-model="form.bjbh" placeholder="请先选学院" filterable clearable><el-option v-for="o in bjOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>职称（务）</div><el-select v-model="form.zw" placeholder="请选择" filterable allow-create><el-option v-for="z in DICT.zw" :key="z.value" :label="z.label" :value="z.value" /></el-select></div>
        <div class="info-cell"><div class="lab"><span class="req">*</span>联系电话</div><el-input v-model="form.lxdh" placeholder="请输入" clearable /></div>
        <div class="info-cell"><div class="lab">学年</div><el-select v-model="form.xnid" placeholder="请选择" clearable><el-option v-for="x in $S.state.xnList" :key="x.id" :label="x.mc" :value="x.id" /></el-select></div>
        <div class="info-cell"><div class="lab">导入时间</div><el-input v-model="form.drsj" disabled placeholder="保存时自动生成" /></div>
        <div class="info-cell span-4"><div class="lab">备注</div><el-input v-model="form.bz" placeholder="请输入" clearable /></div>
      </div>
      <div class="sec-title-dk mt16">主要业绩（1000字以内）</div>
      <el-input v-model="form.zysj" type="textarea" :rows="6" maxlength="1000" show-word-limit placeholder="请输入主要业绩" />
      <template #footer><el-button @click="close">取消</el-button><el-button type="primary" @click="save">确定</el-button></template>
    </el-dialog>`,
  };

  ProtoComponents.YxbbsjbDetailDialog = {
    props: { modelValue: Boolean, detailId: String },
    emits: ['update:modelValue'],
    computed: {
      d() { return S.state.bbxx.find(x => x.id === this.detailId) || {}; },
      cells() {
        const d = this.d;
        return [['姓名', d.xm], ['工号', d.gh], ['学院', d.szxy], ['性别', xbLabel(d.xb)], ['政治面貌', d.zzmm], ['任班导师时间', d.rzkssj ? d.rzkssj + ' ~ ' + (d.rzjssj || '') : '-'], ['负责班级', d.bjmc], ['职称（务）', d.zw],
          ['联系电话', d.lxdh], ['学年', S.xnName(d.xnid)], ['导入时间', d.drsj], ['备注', d.bz]];
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" title="优秀班导师标兵详情" width="980px" align-center destroy-on-close append-to-body class="dlg-title-lg">
      <div class="sec-title-dk">基础信息</div>
      <div class="info-grid cols-4"><div v-for="c in cells" :key="c[0]" class="info-cell"><div class="lab">{{ c[0] }}</div><div class="val">{{ c[1] || '-' }}</div></div></div>
      <div class="sec-title-dk">主要业绩（1000字以内）</div>
      <div style="border:1px solid #c7e1f0;border-radius:4px;padding:12px;line-height:24px;min-height:80px;white-space:pre-wrap">{{ d.zysj || '-' }}</div>
    </el-dialog>`,
  };

  ProtoPages['/yxbdspx/yxbbsjb'] = {
    data() {
      return { model: { xm: '', gh: '', xnid: '', xybm: '', xb: '', zzmm: '', bdsdsj: '', zw: '' }, q: {}, selection: [], editVisible: false, editId: '', detailVisible: false, detailId: '', importVisible: false, importXnid: '' };
    },
    created() { this.q = Object.assign({}, this.model); },
    computed: {
      conditions() {
        return [
          { label: '姓名', feild: 'xm', type: 'text' }, { label: '工号', feild: 'gh', type: 'text' },
          { label: '学年', feild: 'xnid', type: 'select', placeholder: '全部', options: () => S.state.xnList.map(x => ({ label: x.mc, value: x.id })) },
          { label: '学院', feild: 'xybm', type: 'select', filterable: true, options: () => S.collegeOptions() },
          { label: '性别', feild: 'xb', type: 'select', options: window.DICT.xb },
          { label: '政治面貌', feild: 'zzmm', type: 'select', options: window.DICT.zzmm },
          { label: '担任班导师时间', feild: 'bdsdsj', type: 'select', options: bdsdsjOpts },
          { label: '职称(务)', feild: 'zw', type: 'select', options: window.DICT.zw },
        ];
      },
      rows() {
        const q = this.q;
        return S.state.bbxx.filter(b =>
          (!q.xm || b.xm.includes(q.xm.trim())) && (!q.gh || b.gh.includes(q.gh.trim())) && (!q.xnid || b.xnid === q.xnid) && (!q.xybm || b.xybm === q.xybm) &&
          (!q.xb || b.xb === q.xb) && (!q.zzmm || b.zzmm === q.zzmm) && (!q.zw || b.zw === q.zw) && (!q.bdsdsj || window.RULES.tenureBucket(b.rzkssj, b.rzjssj) === q.bdsdsj));
      },
    },
    methods: {
      xbLabel,
      can: c => S.can(c),
      xn: id => S.xnName(id) || '-',
      search() { this.q = Object.assign({}, this.model); },
      add() { this.editId = ''; this.editVisible = true; },
      edit(r) { this.editId = r.id; this.editVisible = true; },
      detail(r) { this.detailId = r.id; this.detailVisible = true; },
      del(r) {
        ElementPlus.ElMessageBox.confirm('确定删除该条记录？删除后为逻辑删除。', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
          S.state.bbxx.splice(S.state.bbxx.findIndex(x => x.id === r.id), 1); ok('已删除');
        }).catch(() => {});
      },
      batchDel() {
        const ids = this.selection.map(x => x.id);
        if (!ids.length) return warn('请先勾选要删除的记录');
        ElementPlus.ElMessageBox.confirm('确定删除选中的 ' + ids.length + ' 条记录？删除后为逻辑删除。', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
          S.state.bbxx = S.state.bbxx.filter(x => !ids.includes(x.id));
          this.$refs.tbl.clearSelection();
          ok('已删除 ' + ids.length + ' 条记录');
        }).catch(() => {});
      },
      exportAll() {
        ok('已按当前筛选导出（可导出历年名单）');
        window.downloadCsv('优秀班导师标兵', [
          { en: 'xm', cn: '姓名' }, { en: 'gh', cn: '工号' }, { en: 'szxy', cn: '学院' }, { cn: '性别', fmt: r => xbLabel(r.xb) }, { en: 'zzmm', cn: '政治面貌' }, { en: 'zw', cn: '职称(务)' },
          { cn: '任班导师时间', fmt: r => r.rzkssj + ' ~ ' + r.rzjssj }, { en: 'bjmc', cn: '负责班级' }, { cn: '学年', fmt: r => S.xnName(r.xnid) }, { en: 'drsj', cn: '导入时间' }, { en: 'zysj', cn: '主要业绩' },
        ], this.rows);
      },
      downloadTemplate() {
        const h = ['序号', '学院', '工号', '姓名', '性别', '政治面貌', '任班导师时间', '负责班级', '职称（务）', '联系电话', '主要业绩（1000字以内）', '备注'];
        window.downloadCsv('优秀班导师标兵导入模板', h.map(c => ({ en: c, cn: c })), []);
        ok('下载成功');
      },
      openImport() { this.importXnid = ''; this.importVisible = true; },
      pickImport() { if (!this.importXnid) return warn('请先选择学年后再导入'); this.$refs.imp.click(); },
      onImportFile(e) {
        const f = e.target.files[0]; e.target.value = '';
        if (!f) return;
        if (!/\.xlsx$/i.test(f.name)) return ElementPlus.ElMessage.error('导入失败，请检查文件格式是否与模板一致');
        this.doImport();
      },
      doImport() {
        const cand = S.state.bds.filter(b => !S.state.bbxx.find(x => x.gh === b.gh)).slice(0, 3);
        cand.forEach(b => {
          S.state.bbxx.unshift({ id: S.uid('bb'), xm: b.xm, gh: b.gh, xybm: b.xybm, szxy: b.szxy, xb: b.xb, zzmm: b.zzmm, zw: b.zc.includes('教授') ? (b.zc.includes('副') ? '副教授' : '教授') : '讲师', lxdh: b.lxdh,
            rzkssj: (b.rzkssj || '2022').slice(0, 4), rzjssj: '至今', bjbh: b.bjbhList[0] || '', bjmc: S.className(b.bjbhList[0]), xnid: this.importXnid, drsj: S.today(), bz: '', zysj: '（导入）担任班导师期间扎实开展班级建设与学生指导工作，班级学风优良。' });
        });
        ok('导入成功，共 ' + cand.length + ' 条');
        this.importVisible = false;
      },
    },
    template: `
    <div class="flex_c" style="flex:1;min-height:0">
      <my-search :conditions="conditions" :model="model" @search="search" @reset="search" />
      <div class="page-gap"></div>
      <pro-table ref="tbl" :data="rows" @selection-change="v => selection = v">
        <template #operator>
          <el-button v-if="can('add')" type="primary" icon="Plus" @click="add">新增</el-button>
          <el-button v-if="can('import')" type="primary" plain @click="openImport">导入</el-button>
          <el-button v-if="can('import')" @click="downloadTemplate">下载模板</el-button>
          <el-button type="primary" plain @click="exportAll">导出（可导出历年名单）</el-button>
          <el-button type="danger" plain icon="Delete" :disabled="!selection.length" @click="batchDel">一键删除{{ selection.length ? '(' + selection.length + ')' : '' }}</el-button>
        </template>
        <el-table-column type="selection" width="40" align="center" reserve-selection />
        <el-table-column label="姓名" prop="xm" min-width="100" />
        <el-table-column label="工号" prop="gh" min-width="110" />
        <el-table-column label="学院" prop="szxy" min-width="120" />
        <el-table-column label="性别" width="72"><template #default="{row}">{{ xbLabel(row.xb) }}</template></el-table-column>
        <el-table-column label="政治面貌" prop="zzmm" min-width="120" />
        <el-table-column label="职称(务)" prop="zw" min-width="100" />
        <el-table-column label="任班导师时间" min-width="200"><template #default="{row}">{{ row.rzkssj }} ~ {{ row.rzjssj }}</template></el-table-column>
        <el-table-column label="负责班级" prop="bjmc" min-width="160" />
        <el-table-column label="学年" min-width="120"><template #default="{row}">{{ xn(row.xnid) }}</template></el-table-column>
        <el-table-column label="导入时间" min-width="110"><template #default="{row}">{{ row.drsj ? row.drsj.slice(0,10) : '-' }}</template></el-table-column>
        <el-table-column label="操作" fixed="right" min-width="200">
          <template #default="{row}"><div class="op-links"><span class="op-link" @click="detail(row)">查看</span><span class="op-link" @click="edit(row)">编辑</span><span class="op-link danger" @click="del(row)">删除</span></div></template>
        </el-table-column>
      </pro-table>
      <yxbbsjb-edit-dialog v-model="editVisible" :edit-id="editId" />
      <yxbbsjb-detail-dialog v-model="detailVisible" :detail-id="detailId" />
      <el-dialog v-model="importVisible" title="导入优秀班导师标兵" width="520px" destroy-on-close append-to-body>
        <div style="color:#606266;font-size:14px;margin-bottom:16px;line-height:1.5">请先选择学年再导入。系统会在前端根据学院名称匹配学院编码(xybm)、根据负责班级名称匹配班级编号(bjbh)，并解析任班导师时间后逐条入库。</div>
        <el-form label-width="100px">
          <el-form-item label="学年" required><el-select v-model="importXnid" placeholder="请选择学年" clearable filterable class="w100"><el-option v-for="x in $S.state.xnList" :key="x.id" :label="x.mc" :value="x.id" /></el-select></el-form-item>
          <el-form-item label="Excel">
            <div>
              <el-button type="primary" :disabled="!importXnid" @click="pickImport">选择文件</el-button>
              <el-button v-if="importXnid" link type="primary" @click="doImport">使用演示数据</el-button>
              <div v-if="!importXnid" style="color:#e6a23c;font-size:12px">请先选择学年</div>
              <input ref="imp" type="file" accept=".xlsx" style="display:none" @change="onImportFile" />
            </div>
          </el-form-item>
        </el-form>
      </el-dialog>
    </div>`,
  };
})();
