/*
 * 顶部应用「个人信息」。
 * 只展示当前登录人在班导师名单 Store.state.bds 中的那一条，
 * 字段与名单「详情」弹窗相同（BDS_FMT.detailCells + Store.bdsView）。
 * 带班班级、带班数量走当前在任记录，并带上学年和起止时间。历年各段与名单详情共用 bdsRz。不在名单中则只提示。
 * 只读：没有编辑、保存、提交。详情弹窗有「导出证明」，本页保留该按钮。
 */
(function () {
  const S = window.Store;

  ProtoPages['/app/grxx'] = {
    computed: {
      row() {
        const gh = S.role().gh;
        const b = (S.state.bds || []).find(x => x.gh === gh);
        return b ? S.bdsView(b) : null;
      },
      cells() { return this.row ? window.BDS_FMT.detailCells(this.row) : []; },
      rzRows() { return this.row ? S.rzRows(this.row.gh) : []; },
    },
    methods: {
      cert() { if (this.row) window.openBdsCert(this.row); },
    },
    template: `
    <div class="grxx-page">
      <div class="info-tip">班导师不能维护本人资料，如需更正请联系辅导员或学院班导师专干。</div>
      <template v-if="row">
        <section-title title="基本信息" />
        <div class="info-grid cols-4">
          <div class="info-cell" v-for="c in cells" :key="c[0]"><div class="lab">{{ c[0] }}</div><div class="val">{{ c[1] }}</div></div>
        </div>
        <section-title title="历年带班" />
        <el-table :data="rzRows" border size="small" empty-text="暂无带班履历" style="margin-bottom:16px">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="班级" prop="bjmc" min-width="140" />
          <el-table-column label="学年" prop="xn" min-width="150" />
          <el-table-column label="开始日期" prop="ksrq" width="120" />
          <el-table-column label="结束日期" prop="jsrq" width="120" />
          <el-table-column label="状态" prop="zt" width="90" />
        </el-table>
        <div class="grxx-actions">
          <el-button type="primary" @click="cert">导出证明</el-button>
        </div>
      </template>
      <div v-else class="grxx-empty">当前账号不在班导师名单中</div>
    </div>`,
  };
})();
