/*
 * 津贴发放管理 /jtffgl（fdydwjs/jtffgl：jtffgl.vue / EditDialog.vue / BdsRymdDialog.vue / BdsDetailDialog.vue / XyProgressDialog.vue）
 * 审批规则取自 WzbJtffRymdServiceImpl.approve / recomputeBatchZt。
 */
(function () {
  const S = window.Store;
  const warn = m => ElementPlus.ElMessage.warning(m);
  const ok = m => ElementPlus.ElMessage.success(m);
  const FFLX = window.DICT.fflx;
  const ZT_OPTIONS = [{ label: '待学院审核', value: '1' }, { label: '待学工审核', value: '2' }, { label: '待发放', value: '4' }, { label: '发放完成', value: '5' }, { label: '已驳回', value: '6' }];
  const DQZT = window.DICT.jtffDqzt;
  const dqztLabel = v => (DQZT.find(o => String(o.value) === String(v)) || {}).label || '—';
  const ffztLabel = v => (String(v) === '1' ? '已发放' : String(v) === '0' ? '待发放' : '—');
  const sfxjLabel = v => (String(v) === '1' ? '是' : String(v) === '0' ? '否' : '—');
  const RYLB_MC = { 1: '校内人员', 2: '无校内财务账号人员', 3: '学生' };
  /** 角色 → 可审批的人员节点（APPROVE_NODE_BY_JSID） */
  const NODE_BY_ROLE = { xbzr: 2, fsj: 3, xgbgly: 4, xgbld: 5 };
  const SPRJS = { 2: '学办主任', 3: '副书记', 4: '学工部管理员', 5: '学工部领导' };

  function calcFfje(pc, sfxj) {
    const base = Number(pc.qtbdsjt || 0), extra = Number(pc.xjqnjsbdsjt || 0);
    const unit = String(sfxj) === '1' ? base + extra : base;
    return parseFloat((unit * (window.DICT.ffzqMultiplier[pc.ffzq] || 1)).toFixed(2));
  }
  function recomputeBatchZt(pcid) {
    const list = S.state.jtffRymd.filter(m => m.ffpcid === pcid);
    const pc = S.state.jtffPc.find(p => p.id === pcid);
    if (!pc) return;
    if (list.some(m => [1, 2, 3].includes(Number(m.dqzt)))) pc.zt = 1;
    else if (list.some(m => [4, 5].includes(Number(m.dqzt)))) pc.zt = 2;
    else pc.zt = 4;
  }
  function pushSplc(m, spjd, name, js, pass, spyj) {
    S.state.jtffSplc.push({ id: S.uid('sp'), mdid: m.id, spjd, splcztmc: pass ? (spjd === 1 ? '已核对' : '审核通过') : '已驳回', splczt: pass ? 'pass' : 'reject', czrxm: name, jse: js, spjg: pass ? 1 : 2, spyj, czsj: S.now(), ffje: pass ? m.ffje : '' });
  }

  /* ---------- 新增/编辑 — 津贴发放标准维护（EditDialog.vue） ---------- */
  ProtoComponents.JtffEditDialog = {
    props: { modelValue: Boolean, editId: String },
    emits: ['update:modelValue'],
    data() {
      return {
        form: this.blank(),
        rules: {
          ffpcmc: [{ required: true, message: '请输入发放批次名称', trigger: 'blur' }],
          ffxn: [{ required: true, message: '请输入发放学年', trigger: 'blur' }],
          ffzq: [{ required: true, message: '请选择发放周期', trigger: 'change' }],
          fflx: [{ required: true, message: '请选择发放类型', trigger: 'change' }],
        },
      };
    },
    computed: {
      title() { return (this.editId ? '编辑' : '新增') + ' — 津贴发放标准维护'; },
      unit() { return ['一年', '二年', '三年'].includes(this.form.ffzq) ? '元/人/年' : '元/人/月'; },
    },
    watch: {
      modelValue(v) {
        if (!v) return;
        this.form = this.blank();
        if (this.editId) {
          const d = S.state.jtffPc.find(p => p.id === this.editId);
          if (d) Object.assign(this.form, JSON.parse(JSON.stringify(d)), { fflx: String(d.fflx), bkffryleix: d.bkffryleix ? String(d.bkffryleix).split(',').filter(Boolean) : [] });
        }
      },
      'form.fflx'(v) { if (v !== '1') this.form.bkffryleix = []; },
    },
    methods: {
      blank: () => ({ ffpcmc: '', ffxn: '', ffzq: '', fflx: '1', bkffryleix: [], fdyjt: '', dhbt: '', xjqnjsbdsjt: '', qtbdsjt: '', qtjt: '', bz: '' }),
      close() { this.$emit('update:modelValue', false); },
      save() {
        this.$refs.form.validate(valid => {
          if (!valid) return;
          const body = Object.assign(JSON.parse(JSON.stringify(this.form)), { bkffryleix: this.form.bkffryleix.join(',') });
          if (this.editId) {
            const pc = S.state.jtffPc.find(p => p.id === this.editId);
            Object.assign(pc, body, { id: pc.id, zt: pc.zt, cjsj: pc.cjsj });
            if (pc.fflx === '2') S.state.jtffRymd.filter(m => m.ffpcid === pc.id).forEach(m => { m.ffje = calcFfje(pc, m.sfxjqnjsyjs); });
            ok('保存成功');
          } else {
            S.state.jtffPc.unshift(Object.assign(body, { id: S.uid('jt'), zt: 1, cjsj: S.now() }));
            ok('新增成功');
          }
          this.close();
        });
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" :title="title" width="860px" destroy-on-close :close-on-click-modal="false" append-to-body class="jtff-edit-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-position="top" class="jtff-edit-body">
        <div class="jtff-section-title">基础信息</div>
        <div class="jtff-form-grid">
          <el-form-item label="发放批次名称" prop="ffpcmc" class="required-label"><el-input v-model="form.ffpcmc" placeholder="请输入" clearable /></el-form-item>
          <el-form-item label="发放学年" prop="ffxn" class="required-label"><el-select v-model="form.ffxn" placeholder="请选择" clearable filterable style="width:100%"><el-option v-for="x in $S.state.xnList" :key="x.id" :label="x.mc" :value="x.mc" /></el-select></el-form-item>
          <el-form-item label="发放周期" prop="ffzq" class="required-label"><el-select v-model="form.ffzq" placeholder="请选择" clearable style="width:100%"><el-option v-for="o in DICT.ffzq" :key="o.value" :label="o.label" :value="o.value" /></el-select></el-form-item>
        </div>
        <div class="jtff-form-grid jtff-form-grid--2col">
          <el-form-item label="发放类型" prop="fflx" class="required-label"><el-radio-group v-model="form.fflx"><el-radio v-for="o in DICT.fflx" :key="o.value" :value="o.value">{{ o.label }}</el-radio></el-radio-group></el-form-item>
          <el-form-item v-if="form.fflx === '1'" label="不可发放津贴人员类型"><el-checkbox-group v-model="form.bkffryleix"><el-checkbox v-for="o in DICT.bkffryleix" :key="o.value" :value="o.value">{{ o.label }}</el-checkbox></el-checkbox-group></el-form-item>
        </div>
        <div class="jtff-section-title" style="margin-top:20px">发放标准</div>
        <template v-if="form.fflx === '1'">
          <div class="jtff-section-subtitle">辅导员</div>
          <div class="jtff-form-grid">
            <el-form-item label="辅导员津贴" prop="fdyjt" class="required-label"><el-input v-model="form.fdyjt" placeholder="100" clearable><template #append>{{ unit }}</template></el-input></el-form-item>
            <el-form-item label="电话补贴" prop="dhbt" class="required-label"><el-input v-model="form.dhbt" placeholder="100" clearable><template #append>{{ unit }}</template></el-input></el-form-item>
            <div></div>
          </div>
        </template>
        <template v-else-if="form.fflx === '2'">
          <div class="jtff-section-subtitle">班导师</div>
          <div class="jtff-form-grid">
            <el-form-item label="新进青年教师班导师津贴" prop="xjqnjsbdsjt" class="required-label"><el-input v-model="form.xjqnjsbdsjt" placeholder="400" clearable><template #append>{{ unit }}</template></el-input></el-form-item>
            <el-form-item label="其他班导师津贴" prop="qtbdsjt" class="required-label"><el-input v-model="form.qtbdsjt" placeholder="200" clearable><template #append>{{ unit }}</template></el-input></el-form-item>
            <div></div>
          </div>
        </template>
        <template v-else>
          <div class="jtff-form-grid">
            <el-form-item label="其他津贴" prop="qtjt" class="required-label"><el-input v-model="form.qtjt" placeholder="400" clearable><template #append>{{ unit }}</template></el-input></el-form-item>
            <div></div><div></div>
          </div>
        </template>
      </el-form>
      <template #footer><el-button @click="close">返回</el-button><el-button type="primary" @click="save">提交</el-button></template>
    </el-dialog>`,
  };

  /* ---------- 新增/编辑/查看详情（jtffgl/BdsDetailDialog.vue） ---------- */
  ProtoComponents.JtffBdsDetailDialog = {
    props: { modelValue: Boolean, mdId: String, pcid: String, pcmc: String, rylb: String, mode: String, qrzt: String },
    emits: ['update:modelValue'],
    data() { return { form: {}, detail: {} }; },
    computed: {
      isView() { return this.mode === 'view'; },
      title() { return this.mode === 'add' ? '新增' : this.mode === 'edit' ? '编辑' : '查看详情'; },
      pc() { return S.state.jtffPc.find(p => p.id === this.pcid) || {}; },
      splcList() { return S.state.jtffSplc.filter(s => s.mdid === this.mdId); },
      viewCells() {
        const d = this.detail, v = k => (d[k] === undefined || d[k] === null || d[k] === '' ? '—' : d[k]);
        const head = [['发放批次', this.pcmc || '—']];
        if (this.rylb === '2') {
          return head.concat([['证件类型', d.zjlx === '1' ? '居民身份证' : v('zjlx')], ['证件号码', v('zjhm')], ['所属学院', v('xymc')], ['姓名', v('xm')], ['银行卡号', v('yhkh')], ['地区名称', v('dqmc')], ['职业', v('zy')], ['所属地区', v('ssdqmc')],
            ['开户行', v('khh')], ['工作单位', v('gzdw')], ['手机号', v('sjh')], ['电子信箱', v('email')], ['是否雇员', sfxjLabel(d.sfgy)], ['性别', d.xb === '1' ? '男' : d.xb === '2' ? '女' : '—'], ['出生年月日', v('csrq')], ['出生地', v('csd')],
            ['人员状态', v('rystatus')], ['所带班级', v('sdbj')], ['是否新进青年教师', sfxjLabel(d.sfxjqnjsyjs)], ['所带班级数量', v('sdbjsl')], ['', ''], ['', ''], ['', '']]);
        }
        const idCell = this.rylb === '3' ? ['学号', v('xh')] : ['工号', v('gh')];
        return head.concat([idCell, ['姓名', v('xm')], ['所属学院', v('xymc')], ['所带班级', v('sdbj')], ['所带班级数量', v('sdbjsl')], ['发放项目', '班导师津贴'], ['是否新进青年教师', sfxjLabel(d.sfxjqnjsyjs)], ['', ''], ['', '']]);
      },
    },
    watch: {
      modelValue(v) {
        if (!v) return;
        const d = this.mdId ? S.state.jtffRymd.find(m => m.id === this.mdId) : null;
        this.detail = d ? JSON.parse(JSON.stringify(d)) : {};
        this.form = Object.assign({ gh: '', xh: '', xm: '', xybm: '', xymc: '', sdbj: '', sdbjsl: '', sfxjqnjsyjs: '', ffje: null, zjlx: '1', zjhm: '', yhkh: '', dqmc: '', zy: '', ssdqmc: '', khh: '', gzdw: '', sjh: '', email: '', xb: '', csrq: '', sfgy: '', csd: '', rystatus: '' }, this.mode !== 'view' && d ? JSON.parse(JSON.stringify(d)) : {});
        if (this.mode === 'add') this.form.ffje = calcFfje(this.pc, '');
      },
      'form.sfxjqnjsyjs'(v) { if (this.modelValue && !this.isView) this.form.ffje = calcFfje(this.pc, v); },
    },
    methods: {
      dqztLabel, ffztLabel,
      close() { this.$emit('update:modelValue', false); },
      onXy(v) { this.form.xymc = S.collegeName(v); },
      searchGh() {
        const gh = (this.form.gh || '').trim();
        if (!gh) return warn('请输入工号');
        const j = S.findJzg(gh);
        if (!j) return warn('未查询到教职工信息');
        this.form.xm = j.xm;
        if (S.collegeName(j.xybm)) { this.form.xybm = j.xybm; this.form.xymc = S.collegeName(j.xybm); }
        const b = S.state.bds.find(x => x.gh === gh);
        if (b) { const v = S.bdsView(b); this.form.sdbj = v.bjmcs; this.form.sdbjsl = v.dbsl; this.form.sfxjqnjsyjs = b.xjqnjs === '1' ? '1' : '0'; }
      },
      searchXh() { ElementPlus.ElMessage.info('学号查询接口待后端实现'); },
      save() {
        const f = this.form;
        const body = Object.assign({}, f, { ffpcid: this.pcid, rylb: Number(this.rylb), sdbjsl: f.sdbjsl === '' ? 0 : Number(f.sdbjsl), ffxmlx: '班导师津贴' });
        if (this.mode === 'edit') {
          const m = S.state.jtffRymd.find(x => x.id === this.mdId);
          const wasPending = Number(m.dqzt) === 1;
          Object.assign(m, body, { id: m.id, dqzt: wasPending ? 2 : m.dqzt, ffzt: m.ffzt });
          if (wasPending) { m.bhsm = ''; pushSplc(m, 1, S.role().xm, S.role().jsmc, true, '信息核对无误'); }
        } else {
          S.state.jtffRymd.push(Object.assign(body, { id: S.uid('md'), dqzt: this.qrzt === '1' ? 1 : 2, ffzt: '0', ffsj: '', bhsm: '' }));
        }
        ok('保存成功');
        this.close();
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" :title="title" width="900px" destroy-on-close :close-on-click-modal="false" append-to-body>
      <div class="jt-detail-body">
        <div class="jt-sec">发放信息</div>
        <div v-if="isView" class="jt-info-grid">
          <div v-for="(c,i) in viewCells" :key="i" class="jt-info-cell"><template v-if="c[0]"><div class="cell-label">{{ c[0] }}</div><div class="cell-value">{{ c[1] }}</div></template></div>
        </div>
        <template v-else>
          <div v-if="mode === 'edit'" class="jt-form-row">
            <div class="jt-field"><div class="cell-label">当前状态</div><span class="dqzt-chip" :class="'dqzt-chip--' + detail.dqzt">{{ dqztLabel(detail.dqzt) }}</span></div>
            <div class="jt-field"><div class="cell-label">发放状态</div><span class="ffzt-chip" :class="String(detail.ffzt) === '1' ? 'ffzt-chip--done' : 'ffzt-chip--wait'">{{ ffztLabel(detail.ffzt) }}</span></div>
            <div class="jt-field empty"></div><div class="jt-field empty"></div><div class="jt-field empty"></div>
          </div>
          <div v-if="mode === 'edit' && detail.bhsm" class="jt-reject-tip"><el-icon><WarningFilled /></el-icon>驳回说明：{{ detail.bhsm }}</div>
          <div class="jt-form-row">
            <template v-if="rylb === '2'">
              <div class="jt-field"><div class="cell-label">证件类型</div><el-select v-model="form.zjlx" placeholder="请选择"><el-option label="居民身份证" value="1" /><el-option label="护照" value="2" /><el-option label="港澳居民来往内地通行证" value="3" /></el-select></div>
              <div class="jt-field"><div class="cell-label">证件号码</div><el-input v-model="form.zjhm" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">所属学院</div><el-select v-model="form.xybm" placeholder="请选择学院" filterable clearable @change="onXy"><el-option v-for="o in $S.collegeOptions()" :key="o.value" :label="o.label" :value="o.value" /></el-select></div>
              <div class="jt-field"><div class="cell-label">姓名</div><el-input v-model="form.xm" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">银行卡号</div><el-input v-model="form.yhkh" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">地区名称</div><el-input v-model="form.dqmc" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">职业</div><el-input v-model="form.zy" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">所属地区</div><el-input v-model="form.ssdqmc" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">开户行</div><el-input v-model="form.khh" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">工作单位</div><el-input v-model="form.gzdw" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">手机号</div><el-input v-model="form.sjh" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">电子信箱</div><el-input v-model="form.email" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">是否雇员</div><el-select v-model="form.sfgy" placeholder="请选择" clearable><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></div>
              <div class="jt-field"><div class="cell-label">性别</div><el-select v-model="form.xb" placeholder="请选择" clearable><el-option label="男" value="1" /><el-option label="女" value="2" /></el-select></div>
              <div class="jt-field"><div class="cell-label">出生年月日</div><el-date-picker v-model="form.csrq" type="date" value-format="YYYY-MM-DD" placeholder="请选择" /></div>
              <div class="jt-field"><div class="cell-label">出生地</div><el-input v-model="form.csd" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">人员状态</div><el-input v-model="form.rystatus" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">所带班级</div><el-input v-model="form.sdbj" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">是否新进青年教师</div><el-select v-model="form.sfxjqnjsyjs" placeholder="请选择" clearable><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></div>
              <div class="jt-field"><div class="cell-label">所带班级数量</div><el-input v-model="form.sdbjsl" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">发放金额（元）</div><div class="field-readonly">{{ form.ffje ?? '—' }}</div></div>
            </template>
            <template v-else>
              <div v-if="rylb === '3'" class="jt-field"><div class="cell-label">学号</div><el-input v-model="form.xh" placeholder="请输入学号" clearable><template #suffix><el-button type="primary" link @click="searchXh"><el-icon><Search /></el-icon></el-button></template></el-input></div>
              <div v-else class="jt-field"><div class="cell-label">工号</div><el-input v-model="form.gh" placeholder="请输入工号" clearable><template #suffix><el-button type="primary" link @click="searchGh"><el-icon><Search /></el-icon></el-button></template></el-input></div>
              <div class="jt-field"><div class="cell-label">姓名</div><el-input v-model="form.xm" placeholder="请输入姓名" clearable /></div>
              <div class="jt-field"><div class="cell-label">所属学院</div><el-select v-model="form.xybm" placeholder="请选择学院" filterable clearable @change="onXy"><el-option v-for="o in $S.collegeOptions()" :key="o.value" :label="o.label" :value="o.value" /></el-select></div>
              <div class="jt-field"><div class="cell-label">所带班级</div><el-input v-model="form.sdbj" placeholder="请输入所带班级" clearable /></div>
              <div class="jt-field"><div class="cell-label">所带班级数量</div><el-input v-model="form.sdbjsl" placeholder="请输入" clearable /></div>
              <div class="jt-field"><div class="cell-label">是否新进青年教师</div><el-select v-model="form.sfxjqnjsyjs" placeholder="请选择" clearable><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></div>
              <div class="jt-field"><div class="cell-label">发放类型</div><div class="field-readonly">班导师津贴</div></div>
              <div class="jt-field"><div class="cell-label">发放金额（元）</div><div class="field-readonly">{{ form.ffje ?? '—' }}</div></div>
              <div class="jt-field empty"></div><div class="jt-field empty"></div>
            </template>
          </div>
        </template>
        <template v-if="isView">
          <div class="jt-sec" style="margin-top:24px">发放状态</div>
          <div class="timeline">
            <div v-for="(step, idx) in splcList" :key="step.id" class="timeline-item">
              <div class="timeline-icon-wrap">
                <div class="timeline-icon" :class="'icon--' + (step.splczt || (step.spjg === 1 ? 'pass' : 'reject'))"><el-icon v-if="step.spjg === 1"><CircleCheckFilled /></el-icon><el-icon v-else><CircleCloseFilled /></el-icon></div>
                <div v-if="idx < splcList.length - 1" class="timeline-line"></div>
              </div>
              <div class="timeline-content">
                <div class="timeline-header"><span class="timeline-name">{{ step.czrxm }}</span><span class="timeline-role">{{ step.jse }}</span><span class="timeline-time">{{ step.czsj }}</span></div>
                <div class="timeline-status" :class="step.spjg === 1 ? 'status--pass' : 'status--reject'">{{ step.splcztmc }}</div>
                <div v-if="step.spyj" class="timeline-extra">“{{ step.spyj }}”</div>
                <div v-if="step.ffje" class="timeline-extra">发放金额 <strong>{{ step.ffje }}元</strong></div>
              </div>
            </div>
            <div v-if="!splcList.length" class="timeline-empty">暂无审批流程</div>
          </div>
        </template>
      </div>
      <template #footer>
        <el-button @click="close">{{ isView ? '返回' : '取消' }}</el-button>
        <el-button v-if="!isView" type="primary" @click="save">确认</el-button>
        <el-button v-else type="primary" @click="close">确认</el-button>
      </template>
    </el-dialog>`,
  };

  /* ---------- 班导师人员名单（BdsRymdDialog.vue） ---------- */
  ProtoComponents.JtffBdsRymdDialog = {
    props: { modelValue: Boolean, pcid: String, pcmc: String },
    emits: ['update:modelValue'],
    data() {
      return {
        sf: this.blankSearch(), q: this.blankSearch(), activeTab: '1', subFilter: '', selected: [],
        detailVisible: false, detailId: '', detailMode: 'view',
      };
    },
    computed: {
      role() { return S.role(); },
      myNode() { return NODE_BY_ROLE[this.role.key] || null; },
      hasApprove() { return !!this.myNode; },
      isFinalNode() { return this.myNode === 5; },
      batchRows() { return S.state.jtffRymd.filter(m => m.ffpcid === this.pcid); },
      scoped() {
        const r = this.role;
        if (r.scope === 'college') return this.batchRows.filter(m => m.xybm === r.xybm);
        if (r.scope === 'self') return this.batchRows.filter(m => m.gh === r.gh);
        return this.batchRows;
      },
      tabRows() { return this.scoped.filter(m => String(m.rylb) === this.activeTab); },
      rows() {
        const q = this.q, k = (q.xmGh || '').trim();
        return this.tabRows.filter(m =>
          (!k || (m.xm || '').includes(k) || (m.gh || '').includes(k) || (m.xh || '').includes(k)) && (!q.xymc || m.xymc === q.xymc) &&
          (!q.sdbj || (m.sdbj || '').includes(q.sdbj.trim())) && (!q.sfxjqnjsyjs || String(m.sfxjqnjsyjs) === q.sfxjqnjsyjs) && (!q.ffzt || String(m.ffzt) === q.ffzt) &&
          (this.subFilter === '' || (this.subFilter === '1' ? Number(m.dqzt) === 1 : Number(m.dqzt) !== 1)));
      },
      pendingCollegeCount() { return this.isFinalNode ? this.batchRows.filter(m => [1, 2, 3, 4].includes(Number(m.dqzt))).length : 0; },
      nodeLabel() { return this.myNode ? dqztLabel(this.myNode) : '审核'; },
    },
    watch: {
      modelValue(v) { if (v) { this.activeTab = '1'; this.subFilter = ''; this.sf = this.blankSearch(); this.q = this.blankSearch(); this.selected = []; } },
      activeTab() { this.subFilter = ''; this.selected = []; },
    },
    methods: {
      dqztLabel, ffztLabel, sfxjLabel,
      blankSearch: () => ({ xmGh: '', xymc: '', sdbj: '', sfxjqnjsyjs: '', ffzt: '' }),
      close() { this.$emit('update:modelValue', false); },
      search() { this.q = Object.assign({}, this.sf); },
      reset() { this.sf = this.blankSearch(); this.q = this.blankSearch(); },
      canApproveRow(row) { return this.myNode === Number(row.dqzt); },
      summary({ columns, data }) {
        return columns.map((c, i) => {
          if (i === 1) return '合计';
          if (c.property === 'ffje') return data.reduce((s, r) => s + (parseFloat(r.ffje) || 0), 0).toFixed(2);
          return '';
        });
      },
      async doApprove(rows, action) {
        const targets = rows.filter(r => this.canApproveRow(r));
        if (!targets.length) return warn('请选择处于「' + this.nodeLabel + '」节点的人员');
        if (action === 'pass' && targets.some(r => Number(r.dqzt) === 5) && this.pendingCollegeCount > 0) {
          return warn('仍有 ' + this.pendingCollegeCount + ' 名人员未完成前置审核，需全部学院及学工部管理员审核完成后才能最终审核');
        }
        let spyj = '';
        try {
          if (action === 'reject') {
            const r = await ElementPlus.ElMessageBox.prompt('请输入驳回说明', '驳回', { confirmButtonText: '确认驳回', cancelButtonText: '取消', inputType: 'textarea', inputValidator: v => (v && v.trim() ? true : '请输入驳回说明') });
            spyj = r.value || '';
          } else {
            await ElementPlus.ElMessageBox.confirm('确认将选中的 ' + targets.length + ' 名人员审核通过？', '审核通过', { confirmButtonText: '确认通过', cancelButtonText: '取消', type: 'warning' });
          }
        } catch (e) { return; }
        const node = this.myNode, r = this.role;
        const needScope = node === 2 || node === 3;
        let handled = 0, skipped = 0;
        targets.forEach(t => {
          const m = S.state.jtffRymd.find(x => x.id === t.id);
          if (Number(m.dqzt) !== node || (needScope && m.xybm !== r.xybm)) { skipped++; return; }
          if (action === 'reject') { m.dqzt = 1; m.bhsm = spyj; } else m.dqzt = node + 1;
          pushSplc(m, node, r.xm, SPRJS[node], action !== 'reject', action === 'reject' ? spyj : '同意');
          handled++;
        });
        if (!handled) return warn('所选人员均不在您可审批的节点或学院范围内');
        recomputeBatchZt(this.pcid);
        ok((action === 'reject' ? '驳回成功' : '审批通过成功') + (skipped ? '（跳过 ' + skipped + ' 条不在当前审批范围的记录）' : ''));
        this.selected = [];
        this.$refs.tbl && this.$refs.tbl.clearSelection();
      },
      openDetail(mode, row) { this.detailMode = mode; this.detailId = mode === 'add' ? '' : row.id; this.detailVisible = true; },
      del(row) {
        ElementPlus.ElMessageBox.confirm('确认删除「' + (row.xm || row.gh || row.xh || '该记录') + '」吗？', '删除确认', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }).then(() => {
          S.state.jtffRymd.splice(S.state.jtffRymd.findIndex(m => m.id === row.id), 1);
          ok('删除成功');
        }).catch(() => {});
      },
      tip(t) { ElementPlus.ElMessage.info('原型演示：' + t + '（不产生真实文件）'); },
      exportRows() {
        window.downloadCsv('班导师人员名单_' + (this.pcmc || ''), [
          { cn: '当前状态', fmt: r => dqztLabel(r.dqzt) }, { en: 'xymc', cn: '所属学院' }, { en: 'gh', cn: '工号' }, { en: 'xm', cn: '姓名' }, { en: 'sdbjsl', cn: '所带班级数量' }, { en: 'sdbj', cn: '所带班级' },
          { cn: '是否新进青年教师', fmt: r => sfxjLabel(r.sfxjqnjsyjs) }, { en: 'ffsj', cn: '发放时间' }, { cn: '发放状态', fmt: r => ffztLabel(r.ffzt) }, { en: 'ffje', cn: '发放金额（元）' },
        ], this.rows);
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" :title="'班导师人员名单 — ' + (pcmc || '—')" width="1300px" destroy-on-close :close-on-click-modal="false" append-to-body class="bds-rymd-dialog">
      <div class="bds-rymd-body">
        <div class="bds-search-row">
          <el-input v-model="sf.xmGh" placeholder="姓名/工号/学号" clearable class="bds-search-input" @keyup.enter="search" />
          <el-select v-model="sf.xymc" placeholder="所属学院" clearable filterable class="bds-search-input"><el-option v-for="o in $S.collegeOptions()" :key="o.value" :label="o.label" :value="o.label" /></el-select>
          <el-input v-model="sf.sdbj" placeholder="所带班级" clearable class="bds-search-input" @keyup.enter="search" />
          <el-select v-model="sf.sfxjqnjsyjs" placeholder="是否新进青年教师" clearable class="bds-search-input--wide"><el-option label="全部" value="" /><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select>
        </div>
        <div class="bds-search-row">
          <el-select v-model="sf.ffzt" placeholder="发放状态" clearable class="bds-search-input"><el-option label="全部" value="" /><el-option label="待发放" value="0" /><el-option label="已发放" value="1" /></el-select>
          <div class="bds-search-actions"><el-button type="primary" icon="Search" @click="search">立即查询</el-button><el-button @click="reset">重置</el-button></div>
        </div>
        <el-tabs v-model="activeTab" class="bds-tabs">
          <el-tab-pane label="校内人员" name="1" /><el-tab-pane label="无校内财务账号人员" name="2" /><el-tab-pane label="学生" name="3" />
        </el-tabs>
        <el-tabs v-model="subFilter" class="bds-sub-tabs">
          <el-tab-pane name=""><template #label>全部<el-badge v-if="tabRows.length" :value="tabRows.length" class="bds-sub-badge" /></template></el-tab-pane>
          <el-tab-pane label="待确认" name="1" /><el-tab-pane label="已确认" name="2" />
        </el-tabs>
        <div class="bds-table-wrap">
          <pro-table ref="tbl" :data="rows" :height="380" no-padding show-summary :summary-method="summary" @selection-change="v => selected = v">
            <template #operator>
              <el-button type="primary" plain icon="Plus" size="small" @click="openDetail('add')">新增</el-button>
              <el-button type="primary" plain icon="Upload" size="small" @click="tip('导入')">导入</el-button>
              <el-button type="primary" plain icon="Download" size="small" @click="exportRows">导出</el-button>
              <template v-if="hasApprove">
                <el-button type="success" plain icon="Select" size="small" @click="doApprove(selected, 'pass')">批量通过</el-button>
                <el-button type="danger" plain icon="CloseBold" size="small" @click="doApprove(selected, 'reject')">批量驳回</el-button>
              </template>
            </template>
            <template #default="{ seq }">
              <el-table-column type="selection" width="50" align="center" />
              <el-table-column type="index" label="序号" width="55" align="center" :index="seq" />
              <el-table-column label="当前状态" width="140" align="center"><template #default="{row}"><span class="dqzt-chip" :class="'dqzt-chip--' + row.dqzt">{{ dqztLabel(row.dqzt) }}</span><el-tooltip v-if="row.bhsm && Number(row.dqzt) === 1" :content="'驳回说明：' + row.bhsm"><el-icon style="color:#f43f51;margin-left:4px;vertical-align:middle"><WarningFilled /></el-icon></el-tooltip></template></el-table-column>
              <el-table-column label="所属学院" prop="xymc" min-width="140" />
              <template v-if="activeTab === '2'">
                <el-table-column label="证件类型" min-width="100"><template #default="{row}">{{ row.zjlx === '1' ? '居民身份证' : (row.zjlx || '—') }}</template></el-table-column>
                <el-table-column label="证件号" prop="zjhm" min-width="170" />
                <el-table-column label="姓名" prop="xm" min-width="90" />
                <el-table-column label="银行卡号" prop="yhkh" min-width="190" />
                <el-table-column label="开户行" prop="khh" min-width="200" />
                <el-table-column label="工作单位" prop="gzdw" min-width="170" />
                <el-table-column label="手机号" prop="sjh" min-width="130" />
                <el-table-column label="性别" width="80" align="center"><template #default="{row}"><sex-tag :xb="row.xb" /></template></el-table-column>
              </template>
              <template v-else>
                <el-table-column v-if="activeTab === '3'" label="学号" prop="xh" min-width="120" />
                <el-table-column v-else label="工号" prop="gh" min-width="100" />
                <el-table-column label="姓名" prop="xm" min-width="90" />
              </template>
              <el-table-column label="所带班级数量" prop="sdbjsl" min-width="110" align="center" />
              <el-table-column label="所带班级" prop="sdbj" min-width="150" show-overflow-tooltip />
              <el-table-column label="是否新进青年教师" min-width="130" align="center"><template #default="{row}">{{ sfxjLabel(row.sfxjqnjsyjs) }}</template></el-table-column>
              <el-table-column label="发放时间" min-width="120"><template #default="{row}">{{ row.ffsj || '' }}</template></el-table-column>
              <el-table-column label="发放状态" width="100" align="center"><template #default="{row}"><span class="ffzt-chip" :class="String(row.ffzt) === '1' ? 'ffzt-chip--done' : 'ffzt-chip--wait'">{{ ffztLabel(row.ffzt) }}</span></template></el-table-column>
              <el-table-column label="发放金额（元）" prop="ffje" min-width="120" align="right" header-align="right" />
              <el-table-column label="操作" fixed="right" width="150" align="center">
                <template #default="{row}">
                  <div class="op-links" style="justify-content:center">
                    <span class="op-link" @click="openDetail('view', row)">查看</span>
                    <template v-if="canApproveRow(row)"><span class="op-link success" @click="doApprove([row], 'pass')">通过</span><span class="op-link danger" @click="doApprove([row], 'reject')">驳回</span></template>
                    <template v-else><span class="op-link" @click="openDetail('edit', row)">编辑</span><span class="op-link danger" @click="del(row)">删除</span></template>
                  </div>
                </template>
              </el-table-column>
            </template>
          </pro-table>
        </div>
      </div>
      <template #footer>
        <span v-if="isFinalNode && pendingCollegeCount > 0" class="bds-gate-tip">仍有 {{ pendingCollegeCount }} 名人员未完成前置审核，学工部领导暂不能最终审核</span>
        <el-button @click="close">关闭</el-button>
        <template v-if="hasApprove">
          <el-button type="danger" plain @click="doApprove(selected, 'reject')">批量驳回</el-button>
          <el-button type="primary" @click="doApprove(selected, 'pass')">{{ isFinalNode ? '最终审核通过' : '审核通过' }}</el-button>
        </template>
      </template>
      <jtff-bds-detail-dialog v-model="detailVisible" :md-id="detailId" :pcid="pcid" :pcmc="pcmc" :rylb="activeTab" :mode="detailMode" :qrzt="subFilter" />
    </el-dialog>`,
  };

  /* ---------- 学院审批进度（XyProgressDialog.vue） ---------- */
  ProtoComponents.JtffXyProgressDialog = {
    props: { modelValue: Boolean, pcid: String, pcmc: String },
    emits: ['update:modelValue'],
    computed: {
      rows() {
        const map = {};
        S.state.jtffRymd.filter(m => m.ffpcid === this.pcid).forEach(m => {
          const r = map[m.xybm] || (map[m.xybm] = { xybm: m.xybm, xymc: m.xymc, total: 0, dqzt1: 0, dqzt2: 0, dqzt3: 0, dqzt4: 0, dqzt5: 0, dqzt6: 0 });
          r.total++;
          const k = 'dqzt' + Number(m.dqzt);
          if (k in r) r[k]++;
        });
        return Object.values(map).sort((a, b) => (a.xybm < b.xybm ? -1 : 1));
      },
      summary() {
        const done = this.rows.filter(r => r.total > 0 && r.dqzt1 + r.dqzt2 + r.dqzt3 === 0).length;
        return {
          totalXy: this.rows.length, doneXy: done, totalPerson: this.rows.reduce((s, r) => s + r.total, 0),
          pendingPerson: this.rows.reduce((s, r) => s + r.dqzt1 + r.dqzt2 + r.dqzt3, 0), allDone: this.rows.length > 0 && done === this.rows.length,
        };
      },
    },
    methods: {
      xyStatus(r) {
        if (r.total === 0) return { text: '无人员', type: 'info' };
        if (r.dqzt1 + r.dqzt2 + r.dqzt3 > 0) return { text: '审批中', type: 'warning' };
        if (r.dqzt6 === r.total) return { text: '已通过', type: 'success' };
        return { text: '已审完', type: 'primary' };
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" :title="'学院审批进度 — ' + (pcmc || '—')" width="960px" destroy-on-close :close-on-click-modal="false" append-to-body>
      <div class="xy-summary">
        <div class="xy-summary__item">学院进度：<strong>{{ summary.doneXy }}</strong> / {{ summary.totalXy }} 已审完</div>
        <div class="xy-summary__item">人员合计：<strong>{{ summary.totalPerson }}</strong> 人，待学院审核 <strong class="pending">{{ summary.pendingPerson }}</strong> 人</div>
        <el-tag :type="summary.allDone ? 'success' : 'warning'" effect="light" round>{{ summary.allDone ? '全部学院已审完，学工部可最终审核' : '仍有学院未审完' }}</el-tag>
      </div>
      <el-table :data="rows" border stripe max-height="480" style="width:100%" class="proto-table">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="xymc" label="所属学院" min-width="160" show-overflow-tooltip />
        <el-table-column prop="total" label="总人数" width="80" align="center" />
        <el-table-column prop="dqzt1" label="待核对" width="80" align="center" />
        <el-table-column prop="dqzt2" label="待学办主任审核" width="130" align="center" />
        <el-table-column prop="dqzt3" label="待副书记审核" width="120" align="center" />
        <el-table-column prop="dqzt4" label="待学工部管理员审核" width="150" align="center" />
        <el-table-column prop="dqzt5" label="待学工部领导审核" width="140" align="center" />
        <el-table-column prop="dqzt6" label="审批通过" width="90" align="center" />
        <el-table-column label="学院进度" width="100" align="center" fixed="right"><template #default="{row}"><el-tag :type="xyStatus(row).type" effect="light" round size="small">{{ xyStatus(row).text }}</el-tag></template></el-table-column>
      </el-table>
      <div v-if="!rows.length" class="xy-empty">暂无人员数据</div>
      <template #footer><el-button @click="$emit('update:modelValue', false)">关闭</el-button></template>
    </el-dialog>`,
  };

  /* ---------- 批次列表 ---------- */
  ProtoPages['/jtffgl'] = {
    props: { query: Object },
    data() {
      return {
        model: { ffpcmc: '', ffxn: '', fflx: '', ffzq: '', zt: '' }, q: {},
        editVisible: false, editId: '', rymdVisible: false, rymdId: '', rymdTitle: '', xyVisible: false, xyId: '', xyTitle: '',
      };
    },
    created() { this.q = Object.assign({}, this.model); this.handleOpen(); },
    activated() { this.handleOpen(); },
    watch: { 'query.open'() { this.handleOpen(); } },
    computed: {
      conditions() {
        return [
          { label: '发放批次', feild: 'ffpcmc', type: 'text' },
          { label: '发放学年', feild: 'ffxn', type: 'text' },
          { label: '津贴类型', feild: 'fflx', type: 'select', placeholder: '请输入', options: FFLX },
          { label: '发放周期', feild: 'ffzq', type: 'select', placeholder: '全部', options: window.DICT.ffzq },
          { label: '状态', feild: 'zt', type: 'select', placeholder: '全部', options: ZT_OPTIONS },
        ];
      },
      rows() {
        const q = this.q;
        return S.state.jtffPc.filter(p => (!q.ffpcmc || p.ffpcmc.includes(q.ffpcmc.trim())) && (!q.ffxn || (p.ffxn || '').includes(q.ffxn.trim())) &&
          (!q.fflx || String(p.fflx) === q.fflx) && (!q.ffzq || p.ffzq === q.ffzq) && (!q.zt || String(p.zt) === q.zt))
          .slice().sort((a, b) => (a.cjsj < b.cjsj ? 1 : -1));
      },
    },
    methods: {
      can: c => S.can(c),
      ztLabel: v => (ZT_OPTIONS.find(o => o.value === String(v)) || {}).label || '—',
      fflxLabel: v => (FFLX.find(o => o.value === String(v)) || {}).label || '—',
      search() { this.q = Object.assign({}, this.model); },
      handleOpen() {
        const id = this.query && this.query.open;
        if (!id) return;
        const pc = S.state.jtffPc.find(p => p.id === id);
        if (pc) this.$nextTick(() => this.goRymd(pc));
        window.go('/jtffgl');
      },
      goAdd() { this.editId = ''; this.editVisible = true; },
      goEdit(r) { this.editId = r.id; this.editVisible = true; },
      goRymd(r) {
        if (String(r.fflx) !== '2') return ElementPlus.ElMessage.info((String(r.fflx) === '1' ? '辅导员津贴+电话补贴' : '其他津贴') + '人员名单（FdyRymdDialog / QtRymdDialog）不属于班导师模块，原型未展开');
        this.rymdId = r.id; this.rymdTitle = r.ffpcmc; this.rymdVisible = true;
      },
      goXy(r) { this.xyId = r.id; this.xyTitle = r.ffpcmc; this.xyVisible = true; },
      onDelete(r) {
        ElementPlus.ElMessageBox.confirm('确认删除批次【' + r.ffpcmc + '】？删除后不可恢复，请谨慎操作', '确认删除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
          S.state.jtffPc.splice(S.state.jtffPc.findIndex(p => p.id === r.id), 1);
          S.state.jtffRymd = S.state.jtffRymd.filter(m => m.ffpcid !== r.id);
          ok('已删除');
        }).catch(() => {});
      },
      onExport() {
        window.downloadCsv('津贴发放管理', [{ en: 'ffpcmc', cn: '发放批次' }, { en: 'ffxn', cn: '发放学年' }, { en: 'ffzq', cn: '发放周期' }, { cn: '津贴类型', fmt: r => this.fflxLabel(r.fflx) }, { cn: '状态', fmt: r => this.ztLabel(r.zt) }], this.rows);
      },
    },
    template: `
    <div class="flex_c" style="flex:1;min-height:0">
      <my-search :conditions="conditions" :model="model" @search="search" @reset="search" />
      <div class="page-gap"></div>
      <pro-table :data="rows">
        <template #operator>
          <el-button v-if="can('kjxsz')" type="primary" icon="Plus" @click="goAdd">新增</el-button>
          <el-button type="primary" plain icon="Download" @click="onExport">导出</el-button>
        </template>
        <template #default="{ seq }">
          <el-table-column type="index" label="序号" width="60" align="center" :index="seq" />
          <el-table-column label="发放批次" prop="ffpcmc" min-width="180" />
          <el-table-column label="发放学年" prop="ffxn" min-width="120" />
          <el-table-column label="发放周期" prop="ffzq" min-width="120" />
          <el-table-column label="津贴类型" min-width="200"><template #default="{row}">{{ fflxLabel(row.fflx) }}</template></el-table-column>
          <el-table-column label="状态" width="130" align="center"><template #default="{row}"><span class="jtff-zt-chip" :class="'jtff-zt-chip--' + row.zt">{{ ztLabel(row.zt) }}</span></template></el-table-column>
          <el-table-column label="操作" fixed="right" min-width="220" align="center">
            <template #default="{row}">
              <div class="op-links" style="justify-content:center;gap:12px">
                <span class="op-link" @click="goRymd(row)">查看名单</span>
                <span v-if="can('shjd') && (String(row.fflx) === '1' || String(row.fflx) === '2')" class="op-link" @click="goXy(row)">审批进度</span>
                <span v-if="can('kjxsz')" class="op-link" @click="goEdit(row)">编辑</span>
                <span v-if="can('kjxsz')" class="op-link danger" @click="onDelete(row)">删除</span>
              </div>
            </template>
          </el-table-column>
        </template>
      </pro-table>
      <jtff-edit-dialog v-model="editVisible" :edit-id="editId" />
      <jtff-bds-rymd-dialog v-model="rymdVisible" :pcid="rymdId" :pcmc="rymdTitle" />
      <jtff-xy-progress-dialog v-model="xyVisible" :pcid="xyId" :pcmc="xyTitle" />
    </div>`,
  };
})();
