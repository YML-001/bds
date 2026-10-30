/*
 * 业务规则（前后端规则合并到前端模拟）
 * - 任班时长：yxbdsTenureUtil.ts / FdyYxbdsTenureHelper.java
 * - 批次资格：FdyYxbdsBatchEligibilityValidator.java（错误码 334）
 * - 学院名额：FdyYxbdsCollegeQuotaValidator.java
 */
(function () {
  const XN_MC_PATTERN = /(\d{4})\s*[-—~至/]\s*(\d{4})/;
  const XN_SINGLE_YEAR_PATTERN = /(\d{4})\s*学年/;

  function isValidYearPair(qsnf, jsnf) {
    if (qsnf == null || jsnf == null) return false;
    const s = Number(String(qsnf).trim()), e = Number(String(jsnf).trim());
    return Number.isFinite(s) && Number.isFinite(e) && e > s;
  }
  function isSameYearPair(qsnf, jsnf) {
    if (qsnf == null || jsnf == null) return false;
    const q = String(qsnf).trim(), j = String(jsnf).trim();
    if (!q || !j || q !== j) return false;
    return Number.isFinite(Number(q));
  }
  function buildXnDateRangeFromYears(qsnf, jsnf) {
    if (!isValidYearPair(qsnf, jsnf)) return null;
    return [new Date(Number(qsnf), 8, 1), new Date(Number(jsnf), 7, 31)];
  }
  function buildXnDateRangeFromSameYear(y) {
    y = Number(String(y).trim());
    if (!Number.isFinite(y)) return null;
    return [new Date(y, 0, 1), new Date(y, 11, 31)];
  }
  function extractYearsFromLabel(xnmc) {
    if (!xnmc || !String(xnmc).trim()) return {};
    const t = String(xnmc).trim();
    const dual = t.match(XN_MC_PATTERN);
    if (dual) return { qsnf: dual[1], jsnf: dual[2] };
    const single = t.match(XN_SINGLE_YEAR_PATTERN);
    if (single) return { qsnf: String(Number(single[1]) - 1), jsnf: single[1] };
    return {};
  }
  function toDateOnly(s) {
    if (!s) return null;
    const d = new Date(String(s).replace(/-/g, '/'));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  function monthDiff(a, b) { return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()); }
  function countOverlapMonths(rzkssj, rzjssj, xnStart, xnEnd) {
    const rs = toDateOnly(rzkssj), re = toDateOnly(rzjssj);
    if (!rs || !re) return -1;
    const effStart = rs < xnStart ? xnStart : rs;
    const effEnd = re > xnEnd ? xnEnd : re;
    if (effStart > effEnd) return -1;
    return monthDiff(effStart, effEnd);
  }
  function resolveXnDateRange(p) {
    if (isSameYearPair(p.qsnf, p.jsnf)) { const r = buildXnDateRangeFromSameYear(p.qsnf); if (r) return r; }
    if (isValidYearPair(p.qsnf, p.jsnf)) { const r = buildXnDateRangeFromYears(p.qsnf, p.jsnf); if (r) return r; }
    const l = extractYearsFromLabel(p.pcxnmc);
    if (isValidYearPair(l.qsnf, l.jsnf)) return buildXnDateRangeFromYears(l.qsnf, l.jsnf);
    return null;
  }
  function resolveXnLabel(p) {
    if (p.pcxnmc && String(p.pcxnmc).trim()) return String(p.pcxnmc).trim();
    if (p.qsnf != null && p.jsnf != null) return p.qsnf + '-' + p.jsnf;
    return '所选学年';
  }
  /** 前端校验文案（yxbdsTenureUtil.validateTenureInXn） */
  function validateTenureInXn(p) {
    const need = p.rzsczx;
    if (need == null || need <= 0) return { ok: true };
    const range = resolveXnDateRange(p);
    if (!range) return { ok: false, message: '无法解析评选学年时间范围，请核对评选学年。' };
    const months = countOverlapMonths(p.rzkssj, p.rzjssj, range[0], range[1]);
    const xnLabel = resolveXnLabel(p);
    if (months < 0) return { ok: false, message: `任班导师时间与评选学年「${xnLabel}」无交集，无法参评。` };
    if (months < need) return { ok: false, message: `在评选学年「${xnLabel}」内，担任班导师时长为 ${months} 个月，未达到本批次要求（不少于 ${need} 个月）。` };
    return { ok: true, months };
  }

  /** 批次状态 shzt：0未开始 1已开始 2已公示 3已结束（FdyYxbdspcxxShztHelper.resolveShzt） */
  function pcShzt(pc, now) {
    const today = window.SEED_UTIL.fmtDate(now || new Date());
    if (pc.gsjssj && today > pc.gsjssj) return '3';
    if (!pc.gsjssj && pc.pcjssj && today > pc.pcjssj) return '3';
    if (pc.gskssj && today >= pc.gskssj) return '2';
    if (pc.pckssj && today >= pc.pckssj) return '1';
    return '0';
  }

  /** 后端批次资格校验（FdyYxbdsBatchEligibilityValidator.validate），返回 null 表示通过 */
  function validateBatchEligibility(row, excludeId) {
    const S = window.Store;
    if (!row || !row.pcid) return '参数错误：请选择评选批次。';
    const pc = S.state.yxbdsPc.find(p => p.id === row.pcid);
    if (!pc) return '评选批次不存在或已删除，无法保存。';
    if (String(pc.ext1) === '0') return '该评选批次未启用，无法保存。';
    const today = window.SEED_UTIL.fmtDate(new Date());
    if (pc.pckssj && today < pc.pckssj) return '当前未到评选开始时间，无法保存。开始日期：' + pc.pckssj;
    if (pc.pcjssj && today > pc.pcjssj) return '本期评选已截止，无法保存。结束日期：' + pc.pcjssj;
    const shzt = pcShzt(pc);
    if (shzt === '0') return '该评选批次尚未开始，无法保存。';
    if (shzt === '2' || shzt === '3') return '该评选批次已公示或已结束，无法保存。';
    if (!row.pcxnid) return '请选择评选学年。';
    if (row.pcxnid !== pc.xnid) return '所选评选学年不属于当前评选批次，请重新选择。';
    if (row.gh && S.state.yxbds.some(a => a.pcid === row.pcid && a.gh === row.gh && a.id !== excludeId && (a.lczt === '1' || a.lczt === '3'))) {
      return '您已提交班导师评优，无法重复提交';
    }
    if (Number(pc.sfkcp) === 0 && row.gh) {
      const b = S.state.bds.find(x => x.gh === row.gh);
      if (b && b.sfjrfdy) return '本批次不允许兼任辅导员参评。';
    }
    if (pc.rzsczx && Number(pc.rzsczx) > 0) {
      if (!row.rzkssj || !row.rzjssj) return '请选择任班导师开始、结束日期。';
      const xn = S.state.xnList.find(x => x.id === row.pcxnid) || {};
      const range = resolveXnDateRange({ qsnf: xn.qsnf, jsnf: xn.jsnf, pcxnmc: row.pcxnmc || xn.mc });
      const label = row.pcxnmc || xn.mc || row.pcxnid;
      if (!range) return '无法解析评选学年时间范围，请核对评选学年配置。';
      const months = countOverlapMonths(row.rzkssj, row.rzjssj, range[0], range[1]);
      if (months < 0) return '任班导师时间与评选学年「' + label + '」无交集，无法参评。';
      if (months < Number(pc.rzsczx)) return '在评选学年「' + label + '」内，担任班导师时长为 ' + months + ' 个月，未达到本批次要求（不少于' + pc.rzsczx + '个月）。';
    }
    return null;
  }

  /** 学院名额校验（仅学院审核节点 + 同意时） */
  function validateCollegeQuota(app) {
    const S = window.Store;
    const pc = S.state.yxbdsPc.find(p => p.id === app.pcid);
    if (!pc || pc.mebl == null || pc.mebl < 0 || pc.mebl > 100) return { ok: false, message: '批次推荐名额比例配置无效' };
    if (!app.xybm) return { ok: false, message: '缺少申请人学院信息，无法审核同意' };
    const total = S.state.bds.filter(b => b.xybm === app.xybm).length;
    const maxAllowed = Math.round(total * Number(pc.mebl) / 100);
    const approved = S.state.yxbds.filter(a => a.pcid === app.pcid && a.xybm === app.xybm && ['1', '3', '4', '5'].includes(String(a.shzt))).length;
    const after = approved + 1;
    const detail = { total, mebl: pc.mebl, maxAllowed, approved };
    if (after > maxAllowed) return { ok: false, message: '推荐人数超过批次规定人数，无法同意', detail };
    return { ok: true, detail };
  }

  /** 任班导师时间筛选（yxbdsgl bdsdsj：lt12 / 12to36 / gt36），按任职起止月数 */
  function tenureBucket(rzkssj, rzjssj) {
    const yearOnly = v => (/^\d{4}$/.test(String(v || '')) ? v + '-09-01' : v);
    const s = toDateOnly(yearOnly(rzkssj)), e = (rzjssj === '至今' ? null : toDateOnly(yearOnly(rzjssj))) || new Date();
    if (!s) return '';
    const m = monthDiff(s, e);
    return m < 12 ? 'lt12' : (m <= 36 ? '12to36' : 'gt36');
  }

  window.RULES = { validateTenureInXn, validateBatchEligibility, validateCollegeQuota, pcShzt, countOverlapMonths, resolveXnDateRange, tenureBucket };
})();
