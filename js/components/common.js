/* 公共组件：复刻 znzhxgpt-yw/src/components 下的 MSearch / VxeTable / TableBtn / SectionTitle / ImportExcel / FileExport */
window.ProtoComponents = window.ProtoComponents || {};
window.ProtoPages = window.ProtoPages || {};

/* ---------- MySearch：4 列网格、默认只显示前 3 项 + 展开/收起 ---------- */
ProtoComponents.MySearch = {
  props: {
    conditions: { type: Array, required: true },
    model: { type: Object, required: true },
    searchTitle: { type: String, default: '立即搜索' },
    hideCollapse: Boolean,
  },
  emits: ['search', 'reset'],
  data() { return { expanded: false, defaults: {} }; },
  created() { this.conditions.forEach(c => { this.defaults[c.feild] = JSON.parse(JSON.stringify(this.model[c.feild] ?? (c.multiple ? [] : ''))); }); },
  computed: {
    shown() { return this.hideCollapse || this.expanded ? this.conditions : this.conditions.slice(0, 3); },
  },
  methods: {
    reset() {
      this.conditions.forEach(c => { this.model[c.feild] = JSON.parse(JSON.stringify(this.defaults[c.feild])); });
      this.$emit('reset');
    },
    opts(c) { return typeof c.options === 'function' ? c.options() : (c.options || []); },
  },
  template: `
  <div class="msearch">
    <div class="search_box">
      <div class="search_box_item" v-for="c in shown" :key="c.feild">
        <div class="search_item">
          <div class="search_label">{{ c.label }}</div>
          <el-input v-if="c.type==='text'" class="search_input" v-model="model[c.feild]" :placeholder="c.placeholder || '请输入'" clearable @keyup.enter="$emit('search')" />
          <el-select v-else-if="c.type==='select'" class="search_input" v-model="model[c.feild]" :placeholder="c.placeholder || '请选择'" :multiple="c.multiple" :filterable="c.filterable" clearable collapse-tags>
            <el-option v-for="o in opts(c)" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-date-picker v-else-if="c.type==='daterange'" class="search_input" v-model="model[c.feild]" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" />
          <el-date-picker v-else-if="c.type==='year'" class="search_input" v-model="model[c.feild]" type="year" value-format="YYYY" :placeholder="c.placeholder || '请选择'" />
          <div v-else-if="c.type==='readonly'" class="search_input" style="background:#f5f7fa;line-height:24px;color:#3c444f">{{ c.text || model[c.feild] || '--' }}</div>
        </div>
      </div>
      <div class="search_box_end">
        <el-button v-if="!hideCollapse && conditions.length > 3" link type="primary" @click="expanded=!expanded">
          {{ expanded ? '收起' : '展开' }}<el-icon class="ml6"><ArrowUp v-if="expanded"/><ArrowDown v-else/></el-icon>
        </el-button>
        <el-button type="primary" @click="$emit('search')"><el-icon style="margin-right:4px"><Search/></el-icon>{{ searchTitle }}</el-button>
        <el-button class="m-operation-btn" @click="reset">重置</el-button>
      </div>
    </div>
  </div>`,
};

/* ---------- TableBtn ---------- */
ProtoComponents.TableBtn = {
  props: { variant: String, label: String, danger: Boolean, disabled: Boolean },
  emits: ['click'],
  computed: {
    preset() {
      const map = { add: ['add.svg', '新增'], import: ['import.svg', '导入'], export: ['export.svg', '导出'], delete: ['delete.svg', '删除'], approve: ['approve.svg', '通过'], reject: ['notApproved.svg', '不通过'], refresh: ['refresh.svg', '刷新'], update: ['update.svg', '修改'], setting: ['setting.svg', '设置'] };
      return this.variant ? map[this.variant] : null;
    },
  },
  template: `
  <el-button class="m-operation-btn btn-operation-item" :class="{ 'danger-line': danger }" :disabled="disabled" @click="$emit('click')">
    <template v-if="preset && !$slots.default"><img :src="'assets/btn/' + preset[0]" class="btn-svg" /><span class="ml4">{{ label || preset[1] }}</span></template>
    <slot v-else>{{ label }}</slot>
  </el-button>`,
};

/* ---------- ProTable：VxeTable 外壳 + 前端分页 ---------- */
ProtoComponents.ProTable = {
  props: {
    data: { type: Array, default: () => [] },
    pageSize: { type: Number, default: 15 },
    pageSizes: { type: Array, default: () => [15, 30, 45, 90] },
    rowKey: { type: String, default: 'id' },
    toolbar: { type: Boolean, default: true },
    height: { type: [String, Number], default: undefined },
    noPadding: Boolean,
    fill: { type: Boolean, default: true },
    pagination: { type: Boolean, default: true },
    showSummary: Boolean,
    summaryMethod: Function,
  },
  emits: ['selection-change'],
  data() { return { pageNo: 1, size: this.pageSize }; },
  computed: {
    paged() {
      if (!this.pagination) return this.data;
      const s = (this.pageNo - 1) * this.size;
      return this.data.slice(s, s + this.size);
    },
  },
  watch: { 'data.length'() { const max = Math.max(1, Math.ceil(this.data.length / this.size)); if (this.pageNo > max) this.pageNo = max; } },
  methods: {
    clearSelection() { this.$refs.tbl && this.$refs.tbl.clearSelection(); },
    seq(i) { return (this.pageNo - 1) * this.size + i + 1; },
  },
  template: `
  <div class="table-wrapper" :style="noPadding ? 'padding:0;min-height:0' : ''">
    <div class="operator-box" v-if="toolbar && ($slots.operator || $slots.right)">
      <div class="ops"><slot name="operator" /></div>
      <div class="ops"><slot name="right" /></div>
    </div>
    <div class="table-body" :class="{ fill: fill && !height }">
      <div :class="{ 'table-abs': fill && !height }">
        <el-table ref="tbl" class="proto-table" :data="paged" border :row-key="rowKey" :height="height || (fill ? '100%' : undefined)" style="width:100%"
          :show-summary="showSummary" :summary-method="summaryMethod"
          @selection-change="v => $emit('selection-change', v)" empty-text="暂无数据">
          <slot :seq="seq" />
        </el-table>
      </div>
    </div>
    <div class="table-pagination" v-if="pagination">
      <el-pagination background="false" :total="data.length" v-model:current-page="pageNo" v-model:page-size="size" :page-sizes="pageSizes" layout="total, prev, pager, next, sizes" />
    </div>
  </div>`,
};

ProtoComponents.NameCell = {
  props: { name: String },
  template: `<div class="userInfo"><img class="avatar" src="assets/ava_img.png" /><span class="name">{{ name || '-' }}</span></div>`,
};
ProtoComponents.SexTag = {
  props: { xb: [String, Number] },
  template: `<el-tag v-if="xb==1||xb==2" round size="small" class="sex-tag" :class="xb==1?'male':'female'" effect="plain">{{ xb==1?'男':'女' }}</el-tag><span v-else>-</span>`,
};
ProtoComponents.SectionTitle = {
  props: { title: String },
  template: `<div class="section-title">{{ title }}</div>`,
};
ProtoComponents.ZtTag = {
  props: { label: String, cls: String },
  template: `<span class="zt_tag" :class="cls">{{ label }}</span>`,
};

/* ---------- ImportExcel：批量添加${title} ---------- */
ProtoComponents.ImportExcel = {
  props: { modelValue: Boolean, title: String, templateName: String },
  emits: ['update:modelValue', 'submit', 'download'],
  data() { return { file: null }; },
  watch: { modelValue(v) { if (v) this.file = null; } },
  methods: {
    pick() { this.$refs.inp.click(); },
    onFile(e) {
      const f = e.target.files[0];
      if (!f) return;
      if (!/\.(xls|xlsx)$/i.test(f.name)) { ElementPlus.ElMessage.warning('上传文件只能是 xls / xlsx 格式!'); return; }
      if (f.size > 10 * 1024 * 1024) { ElementPlus.ElMessage.warning('上传文件大小不能超过 10M！'); return; }
      this.file = f; e.target.value = '';
    },
    useSample() { this.file = { name: (this.templateName || this.title) + '-演示数据.xlsx', size: 18432, sample: true }; },
    submit() {
      if (!this.file) { ElementPlus.ElMessage.warning('请上传文件！'); return; }
      this.$emit('submit', this.file);
      this.$emit('update:modelValue', false);
    },
  },
  template: `
  <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" :title="'批量添加' + title" width="580px" append-to-body destroy-on-close>
    <el-form label-width="100px">
      <el-form-item label="模板下载 :">
        <el-button type="primary" link @click="$emit('download')"><el-icon><Download/></el-icon> 点击下载</el-button>
      </el-form-item>
      <el-form-item label="文件上传 :">
        <div class="upload-drag w100" @click="pick">
          <el-icon style="font-size:40px;color:#c0c4cc"><UploadFilled/></el-icon>
          <div>将文件拖到此处，或 <span class="text-primary">点击上传</span></div>
          <div class="tip">请上传 .xls , .xlsx 标准格式文件，文件最大为 10M</div>
        </div>
        <input ref="inp" type="file" accept=".xls,.xlsx" style="display:none" @change="onFile" />
        <div v-if="file" class="file-chip"><el-icon><Document/></el-icon>{{ file.name }}<span class="x" @click="file=null">✕</span></div>
        <div v-else style="font-size:12px;color:#909399;margin-top:6px">没有现成文件？<el-button link type="primary" size="small" @click="useSample">使用演示数据文件</el-button></div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submit">确定</el-button>
    </template>
  </el-dialog>`,
};

/* ---------- FileExportDialog：文件名 + 选择导出列，生成真实 CSV（Excel 可直接打开） ---------- */
window.downloadCsv = function (fileName, columns, rows) {
  const esc = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const lines = [columns.map(c => esc(c.cn)).join(',')].concat(rows.map(r => columns.map(c => esc(c.fmt ? c.fmt(r) : r[c.en])).join(',')));
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
};
ProtoComponents.FileExportDialog = {
  props: { modelValue: Boolean, title: String, defaultFileName: String, columns: Array, rows: Array },
  emits: ['update:modelValue'],
  data() { return { fileName: '', selected: [] }; },
  watch: { modelValue(v) { if (v) { this.fileName = this.defaultFileName; this.selected = this.columns.map(c => c.en); } } },
  computed: { unselected() { return this.columns.filter(c => !this.selected.includes(c.en)); } },
  methods: {
    colName(en) { return (this.columns.find(c => c.en === en) || {}).cn; },
    remove(en) { this.selected = this.selected.filter(x => x !== en); },
    add(en) { this.selected.push(en); },
    move(i, d) { const j = i + d; if (j < 0 || j >= this.selected.length) return; const a = this.selected.slice(); [a[i], a[j]] = [a[j], a[i]]; this.selected = a; },
    doExport() {
      if (!this.fileName) { ElementPlus.ElMessage.warning('请输入文件名'); return; }
      if (!this.selected.length) { ElementPlus.ElMessage.warning('请至少选择一列'); return; }
      const cols = this.selected.map(en => this.columns.find(c => c.en === en));
      window.downloadCsv(this.fileName, cols, this.rows);
      ElementPlus.ElMessage.success('导出成功，共 ' + this.rows.length + ' 条');
      this.$emit('update:modelValue', false);
    },
  },
  template: `
  <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" :title="title" width="680px" append-to-body>
    <div class="flex_a mb16"><span style="width:80px">文件名</span><el-input v-model="fileName" placeholder="请输入文件名" style="flex:1"><template #append>.xlsx</template></el-input></div>
    <div class="mb10" style="color:#3c444f">已选导出列（{{ selected.length }}）<span class="text-muted fs12">　点击 ↑↓ 调整顺序，点击 ✕ 移除</span></div>
    <div style="border:1px solid #e3f1f9;border-radius:4px;padding:8px;min-height:60px;margin-bottom:14px">
      <span v-for="(en,i) in selected" :key="en" class="file-chip">{{ colName(en) }}<span class="x" @click="move(i,-1)">↑</span><span class="x" @click="move(i,1)">↓</span><span class="x" @click="remove(en)">✕</span></span>
    </div>
    <div class="mb10" style="color:#3c444f">可选列<span class="text-muted fs12">　点击添加</span></div>
    <div style="border:1px dashed #e3f1f9;border-radius:4px;padding:8px;min-height:40px">
      <span v-for="c in unselected" :key="c.en" class="file-chip cur_p" style="color:#606266;background:#fff" @click="add(c.en)">+ {{ c.cn }}</span>
      <span v-if="!unselected.length" class="text-muted fs12">全部列已选</span>
    </div>
    <div class="text-muted fs12 mt10">将导出 {{ rows.length }} 条记录（勾选了行时仅导出勾选行）。原型以 CSV 文件下载，可直接用 Excel 打开。</div>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="doExport">导出</el-button>
    </template>
  </el-dialog>`,
};

/* ---------- 占位页（非本次原型范围的菜单） ---------- */
ProtoComponents.PlaceholderPage = {
  props: { title: String },
  template: `
  <div class="placeholder-page">
    <el-icon style="font-size:56px;color:#bfddee"><Tickets/></el-icon>
    <div class="big">{{ title }}</div>
    <div>该菜单不属于“班导师模块”，本原型未复刻其内容。</div>
    <el-button type="primary" plain @click="$root.go('/bds')">前往 班导师 名单</el-button>
  </div>`,
};
