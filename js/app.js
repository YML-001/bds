/* 应用壳：头部（角色切换）/ 顶部应用导航 / 左侧四级菜单 / 页签 / hash 路由 */
(function () {
  const { createApp, reactive, computed } = Vue;
  const S = window.Store;

  /* ---------- 路由 ---------- */
  function parseHash() {
    const h = decodeURIComponent(location.hash.replace(/^#/, '')) || '';
    const [path, qs] = h.split('?');
    const query = {};
    (qs || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); query[k] = v === undefined ? '' : v; });
    return { path: path || '', query };
  }
  const route = reactive(parseHash());
  window.addEventListener('hashchange', () => Object.assign(route, parseHash()));
  function buildHash(path, query) {
    const qs = Object.entries(query || {}).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
    return '#' + path + (qs ? '?' + qs : '');
  }
  /** 班导师相关且已复刻的页面才允许进入（首页、我的待办、ProtoPages） */
  function pageReady(path) {
    return path === '/home' || path === '/todo' || !!(window.ProtoPages && window.ProtoPages[path]);
  }
  function firstReadyLeaf(nodes) {
    for (const n of nodes || []) {
      if (n.children) { const f = firstReadyLeaf(n.children); if (f) return f; }
      else if (pageReady(n.path)) return n;
    }
    return null;
  }
  window.go = function (path, query) {
    if (!pageReady(path)) return;
    location.hash = buildHash(path, query);
  };

  /* ---------- 菜单工具 ---------- */
  function allowedSet() {
    const r = S.role();
    const key = r.menus || (r.scope === 'all' ? 'full' : r.scope);
    return new Set(window.ROLE_MENUS[key]);
  }
  function filterTree(nodes, allow) {
    return nodes.map(n => {
      if (n.children) {
        const c = filterTree(n.children, allow);
        return c.length ? Object.assign({}, n, { children: c }) : null;
      }
      return allow.has(n.path) ? n : null;
    }).filter(Boolean);
  }
  function findLeaf(nodes, path, trail = []) {
    for (const n of nodes) {
      if (n.children) { const f = findLeaf(n.children, path, trail.concat(n)); if (f) return f; }
      else if (n.path === path) return { node: n, trail };
    }
    return null;
  }
  function firstLeaf(nodes) {
    for (const n of nodes) { if (n.children) { const f = firstLeaf(n.children); if (f) return f; } else return n; }
    return null;
  }
  function appOfPath(path) {
    for (const a of window.APPS) {
      if (a.path && a.path === path) return a;
      if (a.menus && findLeaf(window.APP_MENUS[a.menus], path)) return a;
    }
    return null;
  }
  function titleOf(path) {
    if (window.PAGE_TITLES[path]) return window.PAGE_TITLES[path];
    for (const k in window.APP_MENUS) { const f = findLeaf(window.APP_MENUS[k], path); if (f) return f.node.title; }
    const a = window.APPS.find(x => x.path === path);
    return a ? a.name : '页面';
  }
  window.MenuUtil = { titleOf, appOfPath };

  const DEFAULT_PATH = { xgbgly: '/bds', xgbld: '/todo', fsj: '/todo', xbzr: '/todo', bds: '/yxbdspx/yxbds', xyzg: '/bds', fdy: '/bjgl/index', yxzg: '/fdydwjs/yxbdspx/yxbdsmdJs' };

  /* ---------- 页签 ---------- */
  const TAB_KEY = 'bds_proto_tabs';
  const tabsState = reactive({ list: JSON.parse(sessionStorage.getItem(TAB_KEY) || '[]').filter(t => pageReady(t.path)) });
  function saveTabs() { sessionStorage.setItem(TAB_KEY, JSON.stringify(tabsState.list)); }
  function touchTab(path, query) {
    const full = buildHash(path, query).slice(1);
    const t = tabsState.list.find(x => x.path === path);
    if (t) t.full = full; else tabsState.list.push({ path, full, title: titleOf(path) });
    saveTabs();
  }

  /* ---------- 头部 ---------- */
  const AppHeader = {
    props: { apps: Array, activeApp: String },
    data() { return { pop: false }; },
    computed: { role() { return S.role(); }, roles() { return window.ROLES; }, roleKey() { return S.session.roleKey; } },
    methods: {
      appOn(a) {
        if (a.path) return pageReady(a.path);
        return !!firstReadyLeaf(filterTree(window.APP_MENUS[a.menus], allowedSet()));
      },
      openApp(a) {
        if (!this.appOn(a)) return;
        if (a.path) return go(a.path);
        const leaf = firstReadyLeaf(filterTree(window.APP_MENUS[a.menus], allowedSet()));
        if (leaf) go(leaf.path);
      },
      switchRole(r) {
        this.pop = false;
        if (r.key === S.session.roleKey) return;
        S.setRole(r.key);
        tabsState.list = []; saveTabs();
        go(DEFAULT_PATH[r.key] || '/home');
        ElementPlus.ElMessage.success('已切换为「' + r.jsmc + '」：' + r.xm);
      },
      reset() {
        ElementPlus.ElMessageBox.confirm('将清除本地所有演示操作（新增、审批、删除等），恢复初始演示数据。是否继续？', '重置演示数据', { type: 'warning' })
          .then(() => S.reset()).catch(() => {});
      },
      manual() { ElementPlus.ElMessage.info('操作手册：原型未接入，线上为外链 PDF'); },
      scroll(d) { this.$refs.nav.scrollBy({ left: d * 300, behavior: 'smooth' }); },
    },
    template: `
    <div class="header">
      <div class="logo-container"></div>
      <div class="top">
        <el-popover v-model:visible="pop" placement="bottom-end" :width="320" trigger="click" popper-class="role-pop">
          <template #reference>
            <div class="user-box">
              <div class="avatar"><img src="assets/avatar.png" /></div>
              <div>
                <div class="uname">{{ role.xm }}<el-icon><ArrowDown /></el-icon></div>
                <div class="ujs">{{ role.jsmc }}</div>
              </div>
            </div>
          </template>
          <div class="role-pop">
            <div class="role-title">切换角色（原型演示用，各角色菜单、按钮与数据范围不同）</div>
            <div v-for="r in roles" :key="r.key" class="role-row" :class="{ active: r.key === roleKey }" @click="switchRole(r)">
              <div class="small-avatar"><img src="assets/jstx.png" /></div>
              <div class="r-name"><div>{{ r.jsmc }} · {{ r.xm }}（{{ r.gh }}）</div><div class="r-desc">{{ r.desc }}</div></div>
              <el-icon v-if="r.key === roleKey" color="#2656bb"><Check /></el-icon>
            </div>
            <div class="footer-actions">
              <span @click="reset">重置演示数据</span>
              <span>|</span>
              <span><a href="mobile.html" target="_blank">打开移动端原型</a></span>
            </div>
          </div>
        </el-popover>
        <div class="manual-entry ml25" @click="manual"><img src="assets/icon-bookmark.svg" />操作手册</div>
      </div>
      <div class="bottom">
        <div class="b-left" ref="nav">
          <div v-for="a in apps" :key="a.key" class="tags" :class="{ active: a.key === activeApp, 'is-off': !appOn(a) }" @click="openApp(a)">{{ a.name }}</div>
        </div>
        <div class="scroll-btn" @click="scroll(1)"><el-icon color="#3589cf" size="18"><DArrowRight /></el-icon></div>
      </div>
    </div>`,
  };

  /* ---------- 左侧菜单（aside.vue） ---------- */
  const AppAside = {
    props: { tree: Array, active: String },
    data() { return { open: {} }; },
    watch: { active: { immediate: true, handler() { this.expandActive(); } }, tree() { this.expandActive(); } },
    methods: {
      expandActive() {
        const f = findLeaf(this.tree || [], this.active);
        if (f) f.trail.forEach(n => { this.open[n.title + (n.path || '')] = true; });
      },
      k(n) { return n.title + (n.path || ''); },
      toggle(n) { this.open[this.k(n)] = !this.open[this.k(n)]; },
      contains(n) { return !!findLeaf([n], this.active); },
      /** 叶子未复刻，或分组子树里没有可进入的叶子：置灰，不能点、不能展开 */
      off(n) {
        if (n.children) return !firstReadyLeaf(n.children);
        return !pageReady(n.path);
      },
      click(n) {
        if (this.off(n)) return;
        if (n.children) this.toggle(n);
        else go(n.path);
      },
    },
    template: `
    <div class="aside-split">
      <div class="aside-scroll">
        <template v-for="g in tree" :key="k(g)">
          <div class="split-item" :class="{ 'is-off': off(g) }"><div class="line"></div><div class="title">{{ g.title }}</div></div>
          <div v-if="!off(g)" class="menu_list">
            <div v-for="m in g.children" :key="k(m)">
              <div class="menu_item_right_two" :class="{ active: !m.children && m.path === active, 'is-off': off(m) }" @click="click(m)">
                <div class="title_wrapper"><img src="assets/sjgl.svg" /><span class="title">{{ m.title }}</span></div>
                <span v-if="m.children && !off(m)" class="menu_arrow" :class="{ open: open[k(m)] }"><el-icon><ArrowDown /></el-icon></span>
              </div>
              <div v-if="m.children && !off(m) && open[k(m)]" class="third_level_menu">
                <div v-for="t in m.children" :key="k(t)" class="third_level_item">
                  <div class="row" :class="{ active: !t.children && t.path === active, 'is-off': off(t) }" @click="click(t)">
                    <span>{{ t.title }}</span>
                    <span v-if="t.children && !off(t)" class="menu_arrow" :class="{ open: open[k(t)] }"><el-icon><ArrowDown /></el-icon></span>
                  </div>
                  <div v-if="t.children && !off(t) && open[k(t)]" class="fourth_level_menu">
                    <div v-for="f in t.children" :key="k(f)" class="fourth_level_item" :class="{ active: f.path === active, 'is-off': off(f) }" @click="click(f)">{{ f.title }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>`,
    setup() { return { go: window.go }; },
  };

  /* ---------- 页签栏（mycomponents/Tabs） ---------- */
  const AppTabs = {
    props: { active: String },
    computed: { list() { return tabsState.list; } },
    methods: {
      back() { history.back(); },
      open(t) { if (pageReady(t.path)) location.hash = '#' + t.full; },
      close(t) {
        const i = this.list.indexOf(t);
        this.list.splice(i, 1); saveTabs();
        if (t.path === this.active) {
          const n = this.list[i] || this.list[i - 1];
          if (n) this.open(n); else go(DEFAULT_PATH[S.session.roleKey] || '/home');
        }
      },
      cmd(c) {
        const cur = this.list.find(t => t.path === this.active);
        if (c === 'refresh') { this.$root.refreshKey++; return; }
        if (c === 'other') tabsState.list = cur ? [cur] : [];
        if (c === 'all') { tabsState.list = []; go(DEFAULT_PATH[S.session.roleKey] || '/home'); }
        if (c === 'current' && cur) this.close(cur);
        saveTabs();
      },
    },
    template: `
    <div class="tabs-box">
      <div class="tabs-menu">
        <div class="back" @click="back"><el-icon><ArrowLeft /></el-icon>返回上一步</div>
        <div class="tabs-list">
          <div v-for="t in list" :key="t.path" class="tab-item" :class="{ active: t.path === active }" @click="open(t)">
            <span>{{ t.title }}</span>
            <span class="close" v-if="list.length > 1" @click.stop="close(t)"><el-icon><Close /></el-icon></span>
          </div>
        </div>
        <el-dropdown trigger="click" @command="cmd">
          <div class="tabs-more"><img src="assets/tabs-right.svg" style="width:16px" /></div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="refresh" icon="Refresh">刷新</el-dropdown-item>
              <el-dropdown-item command="current" icon="Remove">关闭当前</el-dropdown-item>
              <el-dropdown-item command="other" icon="CircleClose">关闭其他</el-dropdown-item>
              <el-dropdown-item command="all" icon="FolderDelete">关闭所有</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>`,
  };

  /* ---------- 根组件 ---------- */
  const Root = {
    components: { AppHeader, AppAside, AppTabs },
    data() { return { route, refreshKey: 0 }; },
    computed: {
      role() { return S.role(); },
      roleKey() { return S.session.roleKey; },
      apps() { const sc = this.role.scope; return window.APPS.filter(a => a.scopes.includes(sc)); },
      app() { return appOfPath(route.path) || window.APPS[0]; },
      tree() { return this.app.menus ? filterTree(window.APP_MENUS[this.app.menus], allowedSet()) : []; },
      leafAllowed() {
        if (!this.app.menus) return true;
        return allowedSet().has(route.path);
      },
      pageComp() {
        if (!this.leafAllowed) return null;
        return window.ProtoPages[route.path] || null;
      },
      title() { return titleOf(route.path); },
    },
    watch: {
      'route.path': {
        immediate: true,
        handler(p) {
          if (!p || !pageReady(p)) {
            const def = DEFAULT_PATH[S.session.roleKey] || '/home';
            if (p !== def) go(def);
            return;
          }
          touchTab(p, route.query);
          document.title = titleOf(p) + ' - 班导师模块原型';
        },
      },
      'route.query'() { if (route.path) touchTab(route.path, route.query); },
    },
    methods: { go: window.go, reset() { S.reset(); } },
    template: `
    <div class="layout">
      <app-header :apps="apps" :active-app="app.key" />
      <div class="layout-body">
        <div class="layout-main">
          <app-aside v-if="tree.length" :tree="tree" :active="route.path" />
          <div class="layout-content" :style="tree.length ? '' : 'margin-left:-20px'">
            <app-tabs :active="route.path" />
            <div class="page-box" :key="roleKey + '_' + refreshKey">
              <keep-alive :max="12">
                <component v-if="pageComp" :is="pageComp" :key="route.path" :query="route.query" />
              </keep-alive>
              <div v-if="!pageComp && !leafAllowed" class="placeholder-page">
                <el-icon style="font-size:56px;color:#f4b0b8"><Lock /></el-icon>
                <div class="big">当前角色无「{{ title }}」菜单权限</div>
                <div>请在右上角切换为有权限的角色。</div>
              </div>
            </div>
          </div>
        </div>
        <div class="footer"><span>2025 © wk-Admin By wonsun Technology.</span></div>
      </div>
      <div class="demo-badge">原型演示 · 当前：{{ role.jsmc }} {{ role.xm }}<a @click="reset">重置数据</a></div>
    </div>`,
  };

  window.mountProto = function () {
    const app = createApp(Root);
    app.use(ElementPlus, { locale: ElementPlusLocaleZhCn });
    for (const [k, c] of Object.entries(ElementPlusIconsVue)) app.component(k, c);
    for (const [k, c] of Object.entries(window.ProtoComponents)) app.component(k, c);
    app.config.globalProperties.$S = S;
    app.config.globalProperties.go = window.go;
    app.config.globalProperties.dictLabel = window.dictLabel;
    app.config.globalProperties.dictItem = window.dictItem;
    app.config.globalProperties.DICT = window.DICT;
    app.mount('#app');
  };
})();
