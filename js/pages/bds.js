/* 人员管理 > 班导师（znzhxgpt-yw/src/views/fdydwjs/jzggl/bdslb.vue 及 components/*） */
(function () {
  const S = window.Store;
  const dash = v => (v === undefined || v === null || String(v).trim() === '' ? '-' : String(v));
  const xjqnjsLabel = v => (String(v) === '1' ? '是' : (String(v) === '0' ? '否' : '-'));
  /* 名单「详情」与顶部「个人信息」共用这一套字段，不要另做档案长页 */
  function detailCells(d) {
    d = d || {};
    return [
      ['工号', dash(d.gh)], ['姓名', dash(d.xm)], ['性别', window.dictLabel('xb', d.xb)], ['民族', dash(d.mz)],
      ['学院', dash(d.szxy)], ['学历(位)', dash(d.xlw)], ['类别', window.dictLabel('lb', d.lb)], ['职称', dash(d.zc)],
      ['出国深造', window.dictLabel('sfygcszjl', d.sfygcszjl)], ['工作单位', dash(d.gzdw)], ['联系电话', dash(d.lxdh)], ['新进青年教师', xjqnjsLabel(d.xjqnjs)],
      ['青年教师类型', window.dictLabel('xjqnjslx', d.xjqnjslx)], ['带班数量', dash(d.dbsl)], ['来源', d.ly === 'sdlr' ? '手动录入' : '教职工库'], ['带班班级', dash(d.bjTenure || d.bjmcs)], ['备注', dash(d.bz)],
    ];
  }
  window.BDS_FMT = { dash, xjqnjsLabel, detailCells };

  /* ---------- 新增 / 编辑班导师（BdsEditDialog.vue，980px） ---------- */
  ProtoComponents.BdsEditDialog = {
    props: { modelValue: Boolean, editId: String },
    emits: ['update:modelValue', 'success'],
    data() { return { form: this.empty(), searching: false, entry: 'query', rz: { xnid: '', ksrq: null, jsrq: null } }; },
    computed: {
      title() { return this.editId ? '编辑班导师' : '新增班导师'; },
      xyOptions() { return S.collegeOptions(); },
      xnOptions() { return S.state.xnList || []; },
      bjOptions() { return this.form.xybm ? S.classesOf(this.form.xybm).map(c => ({ label: c.bjmc, value: c.bjbh })) : []; },
      rules() { return { gh: [{ required: true, message: '请输入工号', trigger: 'blur' }], xm: [{ required: true, message: '请输入姓名', trigger: 'blur' }] }; },
    },
    watch: {
      modelValue(v) {
        if (!v) return;
        this.form = this.empty();
        this.entry = 'query';
        this.rz = { xnid: '', ksrq: null, jsrq: null };
        if (this.editId) {
          const d = S.state.bds.find(b => b.id === this.editId);
          if (d) {
            Object.assign(this.form, JSON.parse(JSON.stringify(d)));
            const tracked = (S.state.bdsRz || []).some(r => r.gh === d.gh);
            if (tracked) {
              const ids = [];
              S.openRz(d.gh).forEach(r => { if (r.bjbh && ids.indexOf(r.bjbh) < 0) ids.push(r.bjbh); });
              this.form.bjbhList = ids;
            }
            this.entry = d.ly === 'sdlr' ? 'sdlr' : 'query';
          }
        }
        this.$nextTick(() => this.$refs.f && this.$refs.f.clearValidate());
      },
      'form.xjqnjs'(v) { if (v !== '1') this.form.xjqnjslx = ''; },
    },
    methods: {
      empty() { return { id: '', gh: '', xm: '', xb: '', mz: '', xybm: '', szxy: '', xlw: '', lb: '', zc: '', sfygcszjl: '', gzdw: '', lxdh: '', xjqnjs: '0', xjqnjslx: '', bz: '', bjbhList: [], ly: 'jzg' }; },
      close() { this.$emit('update:modelValue', false); },
      onXyChange() { this.form.szxy = S.collegeName(this.form.xybm); this.form.bjbhList = []; },
      searchJzg() {
        const gh = (this.form.gh || '').trim();
        if (!gh) { ElementPlus.ElMessage.warning('请先输入工号'); return; }
        this.searching = true;
        setTimeout(() => {
          this.searching = false;
          const m = S.findJzg(gh);
          if (!m) { ElementPlus.ElMessage.warning('未查询到该工号的教职工信息，可改用手动录入'); return; }
          this.form.xm = m.xm; this.form.xb = m.xb; this.form.mz = m.mz; this.form.lxdh = m.lxdh; this.form.zc = m.zc;
          if (this.xyOptions.find(x => x.value === m.xybm)) { this.form.xybm = m.xybm; this.form.szxy = m.szxy; } else { this.form.xybm = ''; this.form.szxy = ''; }
          ElementPlus.ElMessage.success('已根据工号带出教职工信息');
        }, 300);
      },
      submit() {
        this.$refs.f.validate(ok => {
          if (!ok) return;
          const gh = this.form.gh.trim(), xm = this.form.xm.trim();
          const jzg = S.findJzg(gh);
          if (this.entry === 'sdlr') {
            if (!this.form.xb) { ElementPlus.ElMessage.error('请选择性别'); return; }
            if (!this.form.xybm) { ElementPlus.ElMessage.error('请选择学院'); return; }
            if (!(this.form.lxdh || '').trim()) { ElementPlus.ElMessage.error('请填写联系电话'); return; }
          } else {
            if (!jzg) { ElementPlus.ElMessage.error('工号在教职工信息中不存在，请核对工号，或改用手动录入'); return; }
            if (jzg.xm !== xm) { ElementPlus.ElMessage.error('工号与姓名不匹配（系统中为 ' + jzg.xm + '）'); return; }
          }
          const dup = S.state.bds.find(b => b.gh === gh && b.id !== this.form.id);
          if (dup && !this.form.id) { ElementPlus.ElMessage.error('该工号已在班导师名单中'); return; }
          const tracked = (S.state.bdsRz || []).some(r => r.gh === gh);
          const curOpen = tracked ? S.openRz(gh).map(r => r.bjbh) : [];
          const next = this.form.bjbhList || [];
          const adding = next.filter(bh => curOpen.indexOf(bh) < 0);
          if (adding.length) {
            const periodErr = S.validateRzPeriod(this.rz);
            if (periodErr) { ElementPlus.ElMessage.error(periodErr); return; }
          }
          const clsErr = S.replaceOpenClasses(gh, next, adding.length ? this.rz : undefined);
          if (clsErr) { ElementPlus.ElMessage.error(clsErr); return; }
          const body = Object.assign({}, this.form, { gh, xm, ly: this.entry === 'sdlr' ? 'sdlr' : 'jzg', xjqnjslx: this.form.xjqnjs === '1' ? this.form.xjqnjslx : '' });
          const exist = this.form.id ? S.state.bds.find(b => b.id === this.form.id) : S.state.bds.find(b => b.gh === gh);
          if (exist) Object.assign(exist, body, { id: exist.id });
          else S.state.bds.unshift(Object.assign(body, { id: 'bds' + (S.state.bdsSeq++), sfjrfdy: false, rzkssj: S.today(), zzmm: jzg ? jzg.zzmm : (this.form.zzmm || ''), cjsj: S.now() }));
          S.syncBjbh(S.state.bds.find(b => b.gh === gh));
          ElementPlus.ElMessage.success('保存成功');
          this.close();
          this.$emit('success');
        });
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" :title="title" width="980px" align-center destroy-on-close :close-on-click-modal="false" append-to-body class="dlg-title-lg">
      <el-form ref="f" :model="form" :rules="rules">
        <section-title title="基本信息" />
        <div v-if="!editId" class="info-tip">
          <el-radio-group v-model="entry">
            <el-radio value="query">工号查询</el-radio>
            <el-radio value="sdlr">手动录入</el-radio>
          </el-radio-group>
          <div style="margin-top:6px">{{ entry === 'sdlr' ? '医学口等不在教职工库的班导师请手填工号、姓名、性别、学院、联系电话，保存后来源为「手动录入」。' : '输入工号后点击查询，可自动带出教职工姓名、学院等信息。查询不到时可改用手动录入。' }}</div>
        </div>
        <div v-else class="info-tip">{{ entry === 'sdlr' ? '该记录为手动录入，不在教职工库中。' : '输入工号后点击查询，可自动带出教职工姓名、学院等信息' }}</div>
        <div class="info-grid edit cols-4">
          <div class="info-cell"><div class="lab"><span class="req">*</span>工号</div>
            <el-form-item prop="gh"><el-input v-model="form.gh" placeholder="请输入工号" clearable @keyup.enter="searchJzg">
              <template v-if="entry !== 'sdlr'" #append><el-button icon="Search" :loading="searching" title="按工号查询教职工并填充" @click="searchJzg">查询</el-button></template>
            </el-input></el-form-item></div>
          <div class="info-cell"><div class="lab"><span class="req">*</span>姓名</div><el-form-item prop="xm"><el-input v-model="form.xm" placeholder="请输入姓名" clearable /></el-form-item></div>
          <div class="info-cell"><div class="lab">性别</div><el-form-item><el-select v-model="form.xb" clearable placeholder="请选择"><el-option label="男" value="1" /><el-option label="女" value="2" /></el-select></el-form-item></div>
          <div class="info-cell"><div class="lab">民族</div><el-form-item><el-input v-model="form.mz" placeholder="请输入民族" clearable /></el-form-item></div>
        </div>
        <section-title title="任职信息" />
        <div class="info-grid edit cols-4">
          <div class="info-cell"><div class="lab">学院</div><el-form-item><el-select v-model="form.xybm" filterable clearable placeholder="请选择学院" @change="onXyChange"><el-option v-for="o in xyOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></div>
          <div class="info-cell"><div class="lab">学历(位)</div><el-form-item><el-input v-model="form.xlw" placeholder="请输入学历或学位" clearable /></el-form-item></div>
          <div class="info-cell"><div class="lab">类别</div><el-form-item><el-select v-model="form.lb" clearable placeholder="请选择"><el-option v-for="o in DICT.lb" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></div>
          <div class="info-cell"><div class="lab">职称</div><el-form-item><el-input v-model="form.zc" placeholder="请输入职称" clearable /></el-form-item></div>
          <div class="info-cell"><div class="lab">出国深造</div><el-form-item><el-select v-model="form.sfygcszjl" clearable placeholder="请选择"><el-option label="有" value="1" /><el-option label="无" value="0" /></el-select></el-form-item></div>
          <div class="info-cell"><div class="lab">工作单位</div><el-form-item><el-input v-model="form.gzdw" placeholder="请输入工作单位" clearable /></el-form-item></div>
          <div class="info-cell"><div class="lab">联系电话</div><el-form-item><el-input v-model="form.lxdh" placeholder="请输入联系电话" clearable /></el-form-item></div>
          <div class="info-cell"><div class="lab">新进青年教师</div><el-form-item><el-select v-model="form.xjqnjs" placeholder="请选择"><el-option label="否" value="0" /><el-option label="是" value="1" /></el-select></el-form-item></div>
          <div v-if="form.xjqnjs === '1'" class="info-cell span-2"><div class="lab">青年教师类型</div><el-form-item><el-select v-model="form.xjqnjslx" clearable placeholder="请选择青年教师类型"><el-option v-for="o in DICT.xjqnjslx" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item></div>
          <div v-if="form.xjqnjs === '1'" class="info-cell span-2" style="background:#fff"></div>
        </div>
        <section-title title="带班与备注" />
        <div class="info-tip">新选择的带班班级按下面的学年和起止时间写入履历。学年、开始时间必填；结束时间不填表示仍在任（至今），填写后按该日期固化为历史段。已经在任的班级保持原记录；取消勾选只给当前在任写结束日期，历史不删。</div>
        <div class="info-grid edit cols-1">
          <div class="info-cell"><div class="lab">带班班级</div><el-form-item>
            <el-select v-model="form.bjbhList" multiple filterable clearable collapse-tags collapse-tags-tooltip :placeholder="form.xybm ? '请选择带班班级，可多选' : '请先选择学院再选班级'">
              <el-option v-for="o in bjOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select></el-form-item></div>
        </div>
        <div class="info-grid edit cols-3">
          <div class="info-cell"><div class="lab"><span class="req">*</span>学年</div><el-form-item>
            <el-select v-model="rz.xnid" filterable clearable placeholder="请选择学年">
              <el-option v-for="x in xnOptions" :key="x.id" :label="x.mc" :value="x.id" />
            </el-select></el-form-item></div>
          <div class="info-cell"><div class="lab"><span class="req">*</span>开始时间</div><el-form-item>
            <el-date-picker v-model="rz.ksrq" type="date" value-format="YYYY-MM-DD" placeholder="请选择开始时间" /></el-form-item></div>
          <div class="info-cell"><div class="lab">结束时间</div><el-form-item>
            <el-date-picker v-model="rz.jsrq" type="date" value-format="YYYY-MM-DD" placeholder="不填表示至今" clearable /></el-form-item></div>
        </div>
        <div class="info-grid edit cols-1">
          <div class="info-cell" style="min-height:120px"><div class="lab">备注</div><el-form-item><el-input v-model="form.bz" type="textarea" :rows="3" resize="none" maxlength="200" show-word-limit placeholder="选填，可补充说明" /></el-form-item></div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>`,
  };

  /* ---------- 班导师详情（BdsDetailDialog.vue） ---------- */
  ProtoComponents.BdsDetailDialog = {
    props: { modelValue: Boolean, detailId: String, gh: String },
    emits: ['update:modelValue'],
    computed: {
      d() {
        const b = this.detailId ? S.state.bds.find(x => x.id === this.detailId) : S.state.bds.find(x => x.gh === this.gh);
        return b ? S.bdsView(b) : {};
      },
      cells() { return detailCells(this.d); },
      rzRows() { return S.rzRows(this.d.gh); },
    },
    methods: {
      cert() { if (this.d && this.d.gh) window.openBdsCert(this.d); },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" title="班导师详情" width="980px" align-center destroy-on-close append-to-body class="dlg-title-lg">
      <div style="padding:0 15px 10px">
        <section-title title="基本信息" />
        <div class="info-grid cols-4">
          <div class="info-cell" v-for="c in cells" :key="c[0]"><div class="lab">{{ c[0] }}</div><div class="val">{{ c[1] }}</div></div>
        </div>
        <section-title title="历年带班" />
        <el-table :data="rzRows" border size="small" empty-text="暂无带班履历">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="班级" prop="bjmc" min-width="140" />
          <el-table-column label="学年" prop="xn" min-width="150" />
          <el-table-column label="开始日期" prop="ksrq" width="120" />
          <el-table-column label="结束日期" prop="jsrq" width="120" />
          <el-table-column label="状态" prop="zt" width="90" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="$emit('update:modelValue', false)">关闭</el-button>
        <el-button type="primary" @click="cert">导出证明</el-button>
      </template>
    </el-dialog>`,
  };

  window.openBdsCert = function (b) {
    if (!b || !b.gh) return;
    try {
      window.downloadBdsCert(b);
      ElementPlus.ElMessage.success('已下载班导师证明');
    } catch (e) {
      ElementPlus.ElMessage.error('导出证明失败');
    }
  };

  /* ---------- 导入进度 / 导入结果 ---------- */
  ProtoComponents.BdsImportProgressDialog = {
    props: { modelValue: Boolean, task: Object },
    emits: ['update:modelValue'],
    computed: {
      t() { return this.task || {}; },
      statusText() { return { 0: '后台导入中', 1: '导入完成', 2: '导入失败' }[this.t.zt] || ''; },
      percent() { return this.t.total ? Math.min(100, Math.round(this.t.processed * 100 / this.t.total)) : 0; },
      pStatus() { return this.t.zt === '1' ? 'success' : (this.t.zt === '2' ? 'exception' : undefined); },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" title="导入进度" width="480px" append-to-body>
      <div v-if="t.wjmc" style="margin-bottom:8px;color:#303133;word-break:break-all">{{ t.wjmc }}</div>
      <div style="margin-bottom:12px;color:#606266">{{ statusText }}</div>
      <el-progress :percentage="percent" :status="pStatus" :indeterminate="t.zt==='0' && !t.total" />
      <div style="margin-top:10px;color:#909399;font-size:13px">已处理 {{ t.processed || 0 }} / {{ t.total || '-' }}</div>
      <p style="margin:14px 0 0;color:#909399;font-size:12px;line-height:1.5">关闭后后台继续导入，再次进入本页可查看进度和失败明细。</p>
      <template #footer><el-button type="primary" @click="$emit('update:modelValue', false)">关闭</el-button></template>
    </el-dialog>`,
  };
  ProtoComponents.BdsImportResultDialog = {
    props: { modelValue: Boolean, task: Object },
    emits: ['update:modelValue'],
    data() { return { reason: '' }; },
    computed: {
      t() { return this.task || {}; },
      reasons() { return Array.from(new Set((this.t.failList || []).map(x => x.reason))); },
      list() { return (this.t.failList || []).filter(x => !this.reason || x.reason === this.reason); },
    },
    methods: {
      exportFail() {
        window.downloadCsv('班导师导入失败清单', [{ en: 'rowNum', cn: 'Excel行号' }, { en: 'xy', cn: '学院' }, { en: 'bjmc', cn: '班级' }, { en: 'xm', cn: '姓名' }, { en: 'gh', cn: '工号' }, { en: 'reason', cn: '失败原因' }], this.list);
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" title="导入结果" width="860px" append-to-body destroy-on-close>
      <div style="margin-bottom:12px;color:#606266">共 <b>{{ t.total }}</b> 行，成功 <b style="color:#67c23a">{{ t.success }}</b> 行，失败 <b style="color:#f56c6c">{{ t.fail }}</b> 行</div>
      <div class="flex_b f_ai_c mb10">
        <el-select v-model="reason" clearable filterable placeholder="按失败原因筛选" style="width:320px"><el-option v-for="r in reasons" :key="r" :label="r" :value="r" /></el-select>
        <el-button type="primary" plain @click="exportFail">导出失败清单</el-button>
      </div>
      <el-table :data="list" border max-height="420" size="small">
        <el-table-column prop="rowNum" label="Excel行号" width="100" />
        <el-table-column prop="xy" label="学院" min-width="120" show-overflow-tooltip />
        <el-table-column prop="bjmc" label="班级" min-width="140" show-overflow-tooltip />
        <el-table-column prop="xm" label="姓名" width="100" />
        <el-table-column prop="gh" label="工号" width="120" />
        <el-table-column prop="reason" label="失败原因" min-width="200" show-overflow-tooltip />
      </el-table>
      <template #footer><el-button type="primary" @click="$emit('update:modelValue', false)">关闭</el-button></template>
    </el-dialog>`,
  };

  /* 模拟后台异步导入：按 Excel 模板逐行处理，部分行失败 */
  function runImport(fileName, onDone) {
    const st = S.state;
    const notBds = st.jzg.filter(j => j.xybm !== 'xgb' && !st.bds.find(b => b.gh === j.gh)).slice(0, 6);
    const okRows = notBds.map(j => ({ j, bj: S.classesOf(j.xybm)[0] }));
    const csAny = st.bds[3] || st.bds[0];
    const failList = [
      { xy: '计算机学院', bjmc: '计科2501', xm: '高晓东', gh: '239981', reason: '工号在教职工信息中不存在，请核对工号' },
      { xy: csAny.szxy, bjmc: S.className(csAny.bjbhList[0]) || '-', xm: '李明', gh: csAny.gh, reason: '工号与姓名不匹配（系统中为 ' + csAny.xm + '）' },
      { xy: '商学院', bjmc: '会计学2402', xm: '吴佳', gh: '', reason: '工号为空' },
      { xy: '文学院', bjmc: '新闻学2301', xm: '郑凯', gh: 'A12-9', reason: '工号格式不正确' },
    ];
    const total = okRows.length + failList.length;
    failList.forEach((f, i) => { f.rowNum = okRows.length + i + 3; });
    st.importTask = { taskId: 'task' + Date.now(), wjmc: fileName, zt: '0', total, processed: 0, success: 0, fail: 0, errMsg: '', failList: [] };
    const timer = setInterval(() => {
      const t = st.importTask;
      if (!t || t.zt !== '0') { clearInterval(timer); return; }
      t.processed = Math.min(total, t.processed + 2);
      if (t.processed >= total) {
        clearInterval(timer);
        okRows.forEach(({ j, bj }) => {
          st.bds.unshift({
            id: 'bds' + (st.bdsSeq++), gh: j.gh, xm: j.xm, xb: j.xb, mz: j.mz, xybm: j.xybm, szxy: j.szxy, xlw: j.xlw, lb: '1', zc: j.zc,
            sfygcszjl: '0', gzdw: j.szxy, lxdh: j.lxdh, xjqnjs: '0', xjqnjslx: '', bz: '批量导入', bjbhList: [],
            sfjrfdy: false, rzkssj: S.today(), zzmm: j.zzmm, cjsj: S.now(), ly: 'jzg',
          });
          if (bj) {
            const day = S.today();
            const label = S.xnLabel(day);
            const xn = (S.state.xnList || []).find(x => (x.qsnf + '-' + x.jsnf) === label);
            S.replaceOpenClasses(j.gh, [bj.bjbh], { xnid: xn ? xn.id : '', xn: label, ksrq: day, jsrq: '' });
          }
        });
        Object.assign(t, { zt: '1', success: okRows.length, fail: failList.length, failList });
        onDone && onDone();
      }
    }, 600);
  }

  /* ---------- 页面 ---------- */
  ProtoPages['/bds'] = {
    data() {
      return {
        model: { xm: '', gh: '', xybm: '', xb: '', lb: '', zc: '', xjqnjs: '', xjqnjslx: '', sfygcszjl: '', xnid: '', rzrange: null },
        applied: {},
        selection: [],
        editVisible: false, editId: '',
        detailVisible: false, detailId: '',
        importVisible: false, progressVisible: false, resultVisible: false,
        exportVisible: false,
      };
    },
    computed: {
      conditions() {
        return [
          { label: '姓名', feild: 'xm', type: 'text' },
          { label: '工号', feild: 'gh', type: 'text' },
          { label: '院系', feild: 'xybm', type: 'select', filterable: true, options: () => S.collegeOptions() },
          { label: '性别', feild: 'xb', type: 'select', options: window.DICT.xb },
          { label: '类别', feild: 'lb', type: 'select', options: window.DICT.lb },
          { label: '职称', feild: 'zc', type: 'text' },
          { label: '新进青年教师', feild: 'xjqnjs', type: 'select', options: window.DICT.yesno },
          { label: '青年教师类型', feild: 'xjqnjslx', type: 'select', options: window.DICT.xjqnjslx },
          { label: '出国深造', feild: 'sfygcszjl', type: 'select', options: window.DICT.sfygcszjl },
          { label: '学年', feild: 'xnid', type: 'select', filterable: true, placeholder: '查同期带班', options: () => S.state.xnList.map(x => ({ label: x.mc, value: x.id })) },
          { label: '任职区间', feild: 'rzrange', type: 'daterange' },
        ];
      },
      rows() {
        const q = this.applied;
        return S.scopeFilter(S.state.bds).filter(b =>
          (!q.xm || b.xm.includes(q.xm.trim())) && (!q.gh || b.gh.includes(q.gh.trim())) && (!q.xybm || b.xybm === q.xybm) &&
          (!q.xb || b.xb === q.xb) && (!q.lb || b.lb === q.lb) && (!q.zc || (b.zc || '').includes(q.zc.trim())) &&
          (!q.xjqnjs || b.xjqnjs === q.xjqnjs) && (!q.xjqnjslx || b.xjqnjslx === q.xjqnjslx) && (!q.sfygcszjl || b.sfygcszjl === q.sfygcszjl),
        ).slice().sort((a, b) => (a.xybm + a.gh < b.xybm + b.gh ? -1 : 1)).map(b => S.bdsView(b));
      },
      task() { return S.state.importTask; },
      exportColumns() {
        return [
          { en: 'gh', cn: '工号' }, { en: 'xm', cn: '姓名' }, { en: 'xb', cn: '性别', fmt: r => window.dictLabel('xb', r.xb) }, { en: 'mz', cn: '民族' },
          { en: 'szxy', cn: '学院' }, { en: 'xlw', cn: '学历(位)' }, { en: 'lb', cn: '类别', fmt: r => window.dictLabel('lb', r.lb) }, { en: 'zc', cn: '职称' },
          { en: 'sfygcszjl', cn: '出国深造', fmt: r => window.dictLabel('sfygcszjl', r.sfygcszjl) }, { en: 'gzdw', cn: '工作单位' }, { en: 'lxdh', cn: '联系电话' },
          { en: 'xjqnjs', cn: '新进青年教师', fmt: r => xjqnjsLabel(r.xjqnjs) }, { en: 'xjqnjslx', cn: '青年教师类型', fmt: r => (r.xjqnjslx ? window.dictLabel('xjqnjslx', r.xjqnjslx) : '') },
          { en: 'bjTenure', cn: '带班班级' }, { en: 'dbsl', cn: '带班数量' },
        ];
      },
      exportRows() { return this.selection.length ? this.selection : this.rows; },
    },
    created() { this.applied = Object.assign({}, this.model); },
    methods: {
      dash, xjqnjsLabel,
      can(c) { return S.can(c); },
      search() { this.applied = Object.assign({}, this.model); },
      add() { this.editId = ''; this.editVisible = true; },
      edit(r) { this.editId = r.id; this.editVisible = true; },
      detail(r) { this.detailId = r.id; this.detailVisible = true; },
      del(r) {
        ElementPlus.ElMessageBox.confirm('确定删除该班导师？删除后名单中不再显示。', '删除确认', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
          const i = S.state.bds.findIndex(b => b.id === r.id);
          if (i >= 0) S.state.bds.splice(i, 1);
          ElementPlus.ElMessage.success('删除成功');
        }).catch(() => {});
      },
      tqCount(row) {
        const q = this.applied;
        if (q.rzrange && q.rzrange.length === 2) return S.overlapCount(row.gh, q.rzrange[0], q.rzrange[1]);
        if (q.xnid) { const sp = S.xnSpan(q.xnid); return sp ? S.overlapCount(row.gh, sp[0], sp[1]) : row.dbsl; }
        return row.dbsl;
      },
      lyLabel(v) { return v === 'sdlr' ? '手动录入' : '教职工库'; },
      cert(row) { window.openBdsCert(row); },
      downloadBlankCert() { window.downloadBlankBdsCert(); },
      downloadTemplate() {
        const cols = ['工号', '姓名', '性别', '学院', '联系电话', '带班班级编号', '民族', '学历(位)', '类别', '职称', '工作单位', '是否为新进青年教师', '备注'].map(c => ({ en: c, cn: c }));
        window.downloadCsv('班导师导入模板', cols, []);
      },
      onImport(file) {
        this.progressVisible = true;
        runImport(file.name, () => {
          const t = S.state.importTask;
          if (t.fail > 0) { this.progressVisible = false; this.resultVisible = true; } else ElementPlus.ElMessage.success('导入成功 ' + t.success + ' 行');
        });
      },
      openLatest() {
        const t = this.task;
        if (t.zt === '0') { this.progressVisible = true; return; }
        if (t.fail > 0) { this.resultVisible = true; return; }
        ElementPlus.ElMessage.success('最近一次导入成功 ' + t.success + ' 行');
      },
    },
    template: `
    <div class="flex_c" style="flex:1">
      <my-search :conditions="conditions" :model="model" @search="search" @reset="search" />
      <div class="page-gap"></div>
      <pro-table :data="rows" @selection-change="v => selection = v">
        <template #operator>
          <table-btn v-if="can('add')" variant="add" @click="add" />
          <table-btn v-if="can('import')" variant="import" @click="importVisible = true" />
          <el-button v-if="can('import')" link type="primary" @click="downloadTemplate">下载导入模板</el-button>
          <el-button v-if="task && task.taskId && can('import')" link type="primary" @click="openLatest">{{ task.zt === '0' ? '导入进度' : '最近导入结果' }}</el-button>
          <table-btn variant="export" @click="exportVisible = true" />
          <el-button link type="primary" @click="downloadBlankCert">下载空白证明模板</el-button>
          <span class="text-muted fs12">选择学年或任职区间后，「同期带班数」按重叠区间统计</span>
        </template>
        <el-table-column type="selection" width="40" align="center" reserve-selection />
        <el-table-column label="工号" width="110"><template #default="{row}">{{ dash(row.gh) }}</template></el-table-column>
        <el-table-column label="姓名" min-width="110"><template #default="{row}"><name-cell :name="row.xm" /></template></el-table-column>
        <el-table-column label="性别" width="70" align="center"><template #default="{row}"><sex-tag :xb="row.xb" /></template></el-table-column>
        <el-table-column label="民族" width="80"><template #default="{row}">{{ dash(row.mz) }}</template></el-table-column>
        <el-table-column label="学院" min-width="140"><template #default="{row}">{{ dash(row.szxy) }}</template></el-table-column>
        <el-table-column label="学历(位)" min-width="120"><template #default="{row}">{{ dash(row.xlw) }}</template></el-table-column>
        <el-table-column label="类别" width="110"><template #default="{row}">{{ dictLabel('lb', row.lb) }}</template></el-table-column>
        <el-table-column label="职称" width="100"><template #default="{row}">{{ dash(row.zc) }}</template></el-table-column>
        <el-table-column label="出国深造" width="90"><template #default="{row}">{{ dictLabel('sfygcszjl', row.sfygcszjl) }}</template></el-table-column>
        <el-table-column label="工作单位" min-width="120"><template #default="{row}">{{ dash(row.gzdw) }}</template></el-table-column>
        <el-table-column label="联系电话" width="120"><template #default="{row}">{{ dash(row.lxdh) }}</template></el-table-column>
        <el-table-column label="新进青年教师" width="110"><template #default="{row}">{{ xjqnjsLabel(row.xjqnjs) }}</template></el-table-column>
        <el-table-column label="青年教师类型" min-width="140"><template #default="{row}">{{ dictLabel('xjqnjslx', row.xjqnjslx) }}</template></el-table-column>
        <el-table-column label="带班班级" min-width="280" show-overflow-tooltip><template #default="{row}">{{ dash(row.bjTenure || row.bjmcs) }}</template></el-table-column>
        <el-table-column label="带班数量" width="90"><template #default="{row}">{{ dash(row.dbsl) }}</template></el-table-column>
        <el-table-column label="同期带班数" width="100"><template #default="{row}">{{ tqCount(row) }}</template></el-table-column>
        <el-table-column label="来源" width="100"><template #default="{row}">{{ lyLabel(row.ly) }}</template></el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{row}">
            <div class="op-links">
              <span class="op-link" @click="detail(row)">详情</span>
              <span class="op-link" @click="cert(row)">导出证明</span>
              <span v-if="can('compile')" class="op-link" @click="edit(row)">编辑</span>
              <span v-if="can('del')" class="op-link danger" @click="del(row)">删除</span>
            </div>
          </template>
        </el-table-column>
      </pro-table>
      <bds-edit-dialog v-model="editVisible" :edit-id="editId" />
      <bds-detail-dialog v-model="detailVisible" :detail-id="detailId" />
      <import-excel v-model="importVisible" title="班导师" template-name="班导师导入模板" @download="downloadTemplate" @submit="onImport" />
      <bds-import-progress-dialog v-model="progressVisible" :task="task" />
      <bds-import-result-dialog v-model="resultVisible" :task="task" />
      <file-export-dialog v-model="exportVisible" title="导出班导师" default-file-name="班导师名单" :columns="exportColumns" :rows="exportRows" />
    </div>`,
  };
})();
