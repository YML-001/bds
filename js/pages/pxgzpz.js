/* 评选规则配置 /yxbdspx/pxgzpz（pxgzpz.vue + PxgzpzAddDialog.vue + PxgzpzYxbdsmdDrawer.vue） */
(function () {
  const S = window.Store;
  const warn = m => ElementPlus.ElMessage.warning(m);
  const ok = m => ElementPlus.ElMessage.success(m);
  const shztLabel = v => ({ 0: '未开始', 1: '已开始', 2: '已公示', 3: '已结束' }[String(v)] || '-');
  const shztTagType = v => ({ 2: 'success', 1: 'primary', 3: 'info' }[String(v)] || 'warning');
  const range = (a, b) => (!a && !b ? '-' : (a || '') + ' ~ ' + (b || ''));
  const ext1On = r => r.ext1 === undefined || r.ext1 === null || r.ext1 === '' || String(r.ext1) === '1';

  ProtoComponents.PxgzpzAddDialog = {
    props: { modelValue: Boolean, editId: String },
    emits: ['update:modelValue'],
    data() {
      return {
        step: 0, form: this.blank(),
        meblMarks: { 1: '1%', 25: '25%', 50: '50%', 75: '75%', 100: '100%' },
      };
    },
    computed: {
      dlgTitle() { return this.editId ? '评选规则配置编辑' : '评选规则配置新增'; },
      xnOptions() { return S.state.xnList.map(x => ({ label: x.mc, value: x.id })); },
      xyOptions() { return S.collegeOptions(); },
      isXyAllChecked() { return this.xyOptions.length > 0 && this.form.xybm.length === this.xyOptions.length; },
      isXyIndeterminate() { return this.form.xybm.length > 0 && this.form.xybm.length < this.xyOptions.length; },
      rzscOptions() {
        const base = window.DICT.rzsczx;
        const v = this.form.rzsczx;
        return v != null && v !== '' && !base.some(o => o.value === v) ? base.concat([{ label: v + '个月', value: v }]) : base;
      },
    },
    watch: {
      modelValue(v) {
        if (!v) return;
        this.step = 0;
        this.form = this.blank();
        if (this.editId) {
          const p = S.state.yxbdsPc.find(x => x.id === this.editId);
          if (p) {
            Object.assign(this.form, {
              pcmc: p.pcmc, xnid: p.xnid, xnmc: p.xnmc,
              pcRange: p.pckssj ? [p.pckssj, p.pcjssj] : [], gsRange: p.gskssj ? [p.gskssj, p.gsjssj] : [],
              xybm: p.xybm ? p.xybm.split(',') : [], mebl: p.mebl, sfkcp: Number(p.sfkcp), rzsczx: p.rzsczx,
            });
          }
        }
      },
    },
    methods: {
      blank() { return { pcmc: '', xnid: '', xnmc: '', pcRange: [], gsRange: [], xybm: [], mebl: 5, sfkcp: 1, rzsczx: '' }; },
      close() { this.$emit('update:modelValue', false); },
      fmtTip: v => v + '%',
      onXnChange(v) { const o = this.xnOptions.find(x => x.value === v); this.form.xnmc = o ? o.label : ''; },
      handleXyCheckAll(v) { this.form.xybm = v ? this.xyOptions.map(o => o.value) : []; },
      validateStep0() {
        const f = this.form;
        if (!f.pcmc || !f.pcmc.trim()) return warn('请填写评选批次名称'), false;
        if (!f.xnid) return warn('请选择评选学年'), false;
        if (!f.pcRange || f.pcRange.length !== 2) return warn('请选择评选时间'), false;
        if (!f.xybm.length) return warn('请选择二级学院'), false;
        if (!f.mebl) return warn('请选择推荐名额比例'), false;
        return true;
      },
      nextStep() { if (this.validateStep0()) this.step = 1; },
      submit() {
        const f = this.form;
        if (f.rzsczx === '' || f.rzsczx == null) return warn('请选择学年内班导师担任时长');
        const xymc = f.xybm.map(x => S.collegeName(x));
        const body = {
          pcmc: f.pcmc.trim(), xnid: f.xnid, xnmc: f.xnmc || S.xnName(f.xnid), pckssj: f.pcRange[0], pcjssj: f.pcRange[1],
          gskssj: (f.gsRange && f.gsRange[0]) || '', gsjssj: (f.gsRange && f.gsRange[1]) || '',
          xybm: f.xybm.join(','), xymc: xymc.join(','), mebl: f.mebl, sfkcp: f.sfkcp, rzsczx: f.rzsczx,
        };
        if (this.editId) {
          Object.assign(S.state.yxbdsPc.find(x => x.id === this.editId), body);
          ok('修改成功');
        } else {
          S.state.yxbdsPc.unshift(Object.assign(body, { id: S.uid('pc'), ext1: '1', cjsj: S.now() }));
          ok('保存成功');
        }
        this.close();
      },
    },
    template: `
    <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" width="1000px" align-center destroy-on-close :show-close="false" class="pxgzpz-add-dialog" append-to-body>
      <template #header>
        <div class="pz-dlg-hd"><span class="pz-dlg-title">{{ dlgTitle }}</span><el-button text @click="close"><el-icon :size="16"><Close /></el-icon></el-button></div>
      </template>
      <div class="pz-dlg-body">
        <el-steps :active="step" align-center finish-status="success" class="pz-steps">
          <el-step title="基本信息" /><el-step title="评选条件" />
        </el-steps>
        <template v-if="step === 0">
          <div class="pz-sec">基础信息</div>
          <el-row class="pz-row">
            <el-col :span="12"><div class="pz-field"><div class="pz-label"><span class="req">*</span>评选批次名称</div><el-input v-model="form.pcmc" placeholder="请输入" clearable /></div></el-col>
            <el-col :span="12"><div class="pz-field"><div class="pz-label"><span class="req">*</span>评选学年</div>
              <el-select v-model="form.xnid" placeholder="请选择" clearable filterable class="w100" @change="onXnChange"><el-option v-for="o in xnOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></div></el-col>
            <el-col :span="12"><div class="pz-field"><div class="pz-label"><span class="req">*</span>评选时间</div>
              <el-date-picker v-model="form.pcRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width:100%" /></div></el-col>
            <el-col :span="12"><div class="pz-field"><div class="pz-label">公示时间</div>
              <el-date-picker v-model="form.gsRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width:100%" /></div></el-col>
          </el-row>
          <div class="pz-sec mt20">评选名额</div>
          <el-row class="pz-row">
            <el-col :span="12"><div class="pz-field pz-field-slider"><div class="pz-label"><span class="req">*</span>二级学院</div>
              <el-select v-model="form.xybm" placeholder="请选择" clearable filterable multiple collapse-tags collapse-tags-tooltip class="w100">
                <template #header><el-checkbox :model-value="isXyAllChecked" :indeterminate="isXyIndeterminate" @change="handleXyCheckAll">全选</el-checkbox></template>
                <el-option v-for="o in xyOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select></div></el-col>
            <el-col :span="12"><div class="pz-field pz-field-slider">
              <div class="pz-label pz-label-mebl"><span><span class="req">*</span>推荐名额比例不超过学院班导师总人数百分比</span><span class="mebl-value">{{ form.mebl }}%</span></div>
              <el-slider v-model="form.mebl" :min="1" :max="100" :step="1" :format-tooltip="fmtTip" :marks="meblMarks" class="pz-slider" /></div></el-col>
          </el-row>
        </template>
        <template v-else>
          <div class="pz-sec">评选条件</div>
          <div class="pz-sub">优秀班导师</div>
          <el-row :gutter="16" class="pz-row mt12">
            <el-col :span="12"><div class="pz-field flat"><div class="pz-label">兼任辅导员是否可参评</div>
              <el-radio-group v-model="form.sfkcp"><el-radio :value="1">是</el-radio><el-radio :value="0">否</el-radio></el-radio-group></div></el-col>
            <el-col :span="12"><div class="pz-field"><div class="pz-label"><span class="req">*</span>学年内班导师担任时长不少于</div>
              <el-select v-model="form.rzsczx" placeholder="请选择" clearable class="w100"><el-option v-for="o in rzscOptions" :key="o.value" :label="o.label" :value="o.value" /></el-select></div></el-col>
          </el-row>
        </template>
      </div>
      <template #footer>
        <el-button v-if="step === 0" @click="close">返回</el-button>
        <el-button v-if="step === 1" @click="step = 0">返回</el-button>
        <el-button v-if="step === 0" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="step === 1" type="primary" @click="submit">提交</el-button>
      </template>
    </el-dialog>`,
  };

  ProtoComponents.PxgzpzYxbdsmdDrawer = {
    props: { modelValue: Boolean, pcid: String, pcmc: String },
    emits: ['update:modelValue'],
    template: `
    <el-drawer :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" direction="rtl" size="96%" destroy-on-close :show-close="false" class="pxgzpz-yxbdsmd-drawer" append-to-body>
      <template #header>
        <div class="pz-drawer-hd">
          <div class="flex_c" style="gap:4px"><span class="pz-drawer-title">优秀班导师名单</span><span class="pz-drawer-sub">{{ pcmc || '当前批次' }}</span></div>
          <el-button text @click="$emit('update:modelValue', false)"><el-icon :size="18"><Close /></el-icon></el-button>
        </div>
      </template>
      <div class="pz-drawer-body"><yxbdsmd-list mode="maintain" :lock-pcid="pcid" /></div>
    </el-drawer>`,
  };

  ProtoPages['/yxbdspx/pxgzpz'] = {
    data() { return { model: { pcmc: '', xnmc: '', shzt: '' }, q: {}, addVisible: false, editId: '', rosterVisible: false, rosterPcid: '', rosterPcmc: '' }; },
    created() { this.q = Object.assign({}, this.model); },
    computed: {
      conditions() {
        return [
          { label: '评选批次名称', feild: 'pcmc', type: 'text' },
          { label: '评选学年', feild: 'xnmc', type: 'text', placeholder: '请输入学年名称' },
          { label: '状态', feild: 'shzt', type: 'select', options: window.DICT.pcShzt.map(o => ({ label: o.label, value: o.value })) },
        ];
      },
      rows() {
        const q = this.q;
        return S.state.yxbdsPc.map(p => Object.assign({}, p, { shzt: window.RULES.pcShzt(p) }))
          .filter(p => (!q.pcmc || p.pcmc.includes(q.pcmc.trim())) && (!q.xnmc || (p.xnmc || '').includes(q.xnmc.trim())) && (!q.shzt || p.shzt === q.shzt))
          .sort((a, b) => (a.cjsj < b.cjsj ? 1 : -1));
      },
    },
    methods: {
      shztLabel, shztTagType, range, ext1On,
      noticed(row) { return ext1On(row) && row.pckssj && row.pckssj <= (S.state.seedDate || '9999-12-31'); },
      search() { this.q = Object.assign({}, this.model); },
      raw(r) { return S.state.yxbdsPc.find(x => x.id === r.id); },
      openAdd() { this.editId = ''; this.addVisible = true; },
      openEdit(r) { this.editId = r.id; this.addVisible = true; },
      openRoster(r) { this.rosterPcid = r.id; this.rosterPcmc = r.pcmc; this.rosterVisible = true; },
      onExt1(r, v) { this.raw(r).ext1 = v ? '1' : '0'; ok('已更新'); },
      onCopy(r) {
        const src = this.raw(r);
        S.state.yxbdsPc.unshift(Object.assign(JSON.parse(JSON.stringify(src)), { id: S.uid('pc'), pcmc: src.pcmc + '（复制）', cjsj: S.now() }));
        ok('复制成功');
      },
      onDelete(r) {
        ElementPlus.ElMessageBox.confirm('确定删除该条评选规则配置？删除后列表将不再展示。', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
          S.state.yxbdsPc.splice(S.state.yxbdsPc.findIndex(x => x.id === r.id), 1);
          ok('已删除');
        }).catch(() => {});
      },
    },
    template: `
    <div class="flex_c" style="flex:1;min-height:0">
      <my-search :conditions="conditions" :model="model" hide-collapse @search="search" @reset="search" />
      <div class="page-gap"></div>
      <pro-table :data="rows">
        <template #operator><el-button type="primary" icon="Plus" @click="openAdd">新增</el-button></template>
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="评选批次名称" prop="pcmc" min-width="160" show-overflow-tooltip />
        <el-table-column label="评选学年" prop="xnmc" min-width="120" />
        <el-table-column label="评选时间" min-width="220"><template #default="{row}">{{ range(row.pckssj, row.pcjssj) }}</template></el-table-column>
        <el-table-column label="公示时间" min-width="220"><template #default="{row}">{{ range(row.gskssj, row.gsjssj) }}</template></el-table-column>
        <el-table-column label="状态" width="100"><template #default="{row}"><el-tag :type="shztTagType(row.shzt)" size="small" effect="plain">{{ shztLabel(row.shzt) }}</el-tag></template></el-table-column>
        <el-table-column label="启用" width="88"><template #default="{row}"><el-switch :model-value="ext1On(row)" @change="v => onExt1(row, v)" /></template></el-table-column>
        <el-table-column label="通知" width="120"><template #default="{row}"><span v-if="noticed(row)">通知已发出</span><span v-else class="text-muted">—</span></template></el-table-column>
        <el-table-column label="操作" fixed="right" min-width="280">
          <template #default="{row}">
            <div class="op-links">
              <span class="op-link" @click="openRoster(row)">查看名单</span>
              <span class="op-link" @click="openEdit(row)">编辑</span>
              <span class="op-link" @click="onCopy(row)">复制</span>
              <span class="op-link danger" @click="onDelete(row)">删除</span>
            </div>
          </template>
        </el-table-column>
      </pro-table>
      <pxgzpz-add-dialog v-model="addVisible" :edit-id="editId" />
      <pxgzpz-yxbdsmd-drawer v-model="rosterVisible" :pcid="rosterPcid" :pcmc="rosterPcmc" />
    </div>`,
  };
})();
