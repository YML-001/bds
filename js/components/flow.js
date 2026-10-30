/* 低代码流程公共件：复刻 znzhxgpt-code/src/pages/workflow/components（HandlerFlowTask / TaskCommit / ProcessViewer） */

/* 流程图（线上 BPMN：开始 → 申请 → 学院审核 → 副书记审核 → 优秀班导师专干（学工部）审核 ||| → 学工部审核 ||| → 结束） */
ProtoComponents.FlowChart = {
  props: { app: Object },
  computed: {
    nodes() { return window.YXBDS_NODES; },
  },
  methods: {
    cls(i) {
      const a = this.app;
      if (!a || a.lczt === '0') return '';
      if (a.lczt === '3') return 'done';
      if (a.lczt === '2') {
        const lastIdx = this.nodes.findIndex(n => n.name === (a.records[a.records.length - 1] || {}).node);
        if (i < lastIdx) return 'done';
        if (i === lastIdx) return 'reject';
        return '';
      }
      if (i < a.currentNode) return 'done';
      if (i === a.currentNode) return 'current';
      return '';
    },
  },
  template: `
  <div>
    <div class="flow-chart">
      <div class="circle"></div>
      <template v-for="(n,i) in nodes" :key="n.key">
        <div class="arrow"></div>
        <div class="node" :class="cls(i)">
          <el-icon class="user-ico"><User /></el-icon>{{ n.name }}
          <span v-if="n.multi" class="multi">|||</span>
        </div>
      </template>
      <div class="arrow"></div>
      <div class="circle endc"></div>
    </div>
    <div class="flex_a f_jc_c fs12 text-muted" style="gap:18px;margin-top:-80px">
      <span><span class="zt_tag zt_tag_3">已完成</span></span>
      <span><span class="zt_tag zt_tag_1">当前节点</span></span>
      <span><span class="zt_tag zt_tag_4">已驳回</span></span>
    </div>
  </div>`,
};

/* 审批记录（HandlerFlowTask approveInfo） */
ProtoComponents.ApproveRecords = {
  props: { records: { type: Array, default: () => [] } },
  methods: {
    tagType(a) { return a === '同意' ? 'success' : (a === '驳回' || a === '拒绝' ? 'danger' : (a === '撤销' ? 'info' : 'primary')); },
  },
  template: `
  <div>
    <div class="sum-bar">
      <span><el-icon color="#83cdca"><User /></el-icon> 总人次 <b>{{ records.length }}</b></span>
      <span><el-icon color="#afca7f"><CircleCheck /></el-icon> 已提交 <b>{{ records.length }}</b></span>
      <span><el-icon color="#bbace5"><Loading /></el-icon> 未提交 <b>0</b></span>
    </div>
    <el-table class="proto-table" :data="records" border empty-text="暂无数据">
      <el-table-column type="index" label="序号" width="80" align="center" />
      <el-table-column label="流程环节" prop="node" min-width="180" />
      <el-table-column label="实际审批人" min-width="140"><template #default="{row}">{{ row.user }}<span class="text-muted fs12">（{{ row.role }}）</span></template></el-table-column>
      <el-table-column label="受委托人" width="100"><template #default>-</template></el-table-column>
      <el-table-column label="审批操作" width="110"><template #default="{row}"><el-tag :type="tagType(row.action)" effect="dark" size="small">{{ row.action }}</el-tag></template></el-table-column>
      <el-table-column label="审批意见" prop="opinion" min-width="200" />
      <el-table-column label="处理时间" prop="time" width="190" />
    </el-table>
  </div>`,
};

/* 审批提交弹窗（TaskCommit.vue：审批意见必填、最多 500 字、常用意见标签、附件） */
ProtoComponents.TaskCommitDialog = {
  props: { modelValue: Boolean, operation: Object },
  emits: ['update:modelValue', 'confirm'],
  data() { return { form: { message: '' }, files: [] }; },
  watch: { modelValue(v) { if (v) { this.form.message = ''; this.files = []; } } },
  computed: {
    spyj() { return this.operation && this.operation.type === 'agree' ? ['同意', '同意推荐', '情况属实，同意'] : ['不同意', '材料不完整，请补充', '不符合推荐条件']; },
  },
  methods: {
    submit() {
      this.$refs.f.validate(ok => {
        if (!ok) return;
        this.$emit('confirm', { message: this.form.message, files: this.files });
      });
    },
    addFile() { this.files.push({ name: '审批附件' + (this.files.length + 1) + '.pdf' }); },
  },
  template: `
  <el-dialog :model-value="modelValue" @update:model-value="v=>$emit('update:modelValue',v)" :title="operation ? operation.label : ''" width="600px" append-to-body>
    <el-form ref="f" :model="form" label-width="100px" label-position="left">
      <el-form-item label="审批意见" prop="message" :rules="[{ required: true, message: '审批意见不能为空', trigger: 'blur' }]">
        <el-input type="textarea" v-model="form.message" placeholder="请输入审批意见" maxlength="500" show-word-limit :autosize="{ minRows: 6, maxRows: 12 }" />
        <div class="flex_a mt10" style="gap:8px;flex-wrap:wrap">
          <el-tag v-for="t in spyj" :key="t" class="cur_p" @click="form.message = t">{{ t }}</el-tag>
        </div>
      </el-form-item>
      <el-form-item label="附件">
        <div>
          <el-button size="small" icon="Upload" @click="addFile">上传附件</el-button>
          <div><span v-for="(f,i) in files" :key="i" class="file-chip"><el-icon><Document /></el-icon>{{ f.name }}<span class="x" @click="files.splice(i,1)">✕</span></span></div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submit">确定</el-button>
    </template>
  </el-dialog>`,
};

/* 抄送设置（CopyForSelect，原型仅做选择展示） */
ProtoComponents.CopyForSelect = {
  props: { modelValue: Array },
  emits: ['update:modelValue'],
  data() { return { type: 'user', val: [] }; },
  computed: { users() { return window.Store.state.jzg.slice(0, 40).map(j => ({ label: j.xm + '（' + j.gh + '）', value: j.gh })); } },
  template: `
  <div style="padding:16px 0">
    <el-form label-width="90px">
      <el-form-item label="抄送类型">
        <el-radio-group v-model="type"><el-radio value="user">用户</el-radio><el-radio value="role">角色</el-radio><el-radio value="dept">部门</el-radio></el-radio-group>
      </el-form-item>
      <el-form-item label="抄送对象">
        <el-select v-model="val" multiple filterable placeholder="请选择抄送对象（可选）" style="width:420px">
          <el-option v-for="u in users" :key="u.value" :label="u.label" :value="u.value" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>`,
};
