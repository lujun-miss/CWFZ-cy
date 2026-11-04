/* 统一顶栏组件：城市切换 + 账号信息（与首页 dashboard 保持一致）
 * 页面只需放置以下节点：
 *   #tbCity  #tbUser  #tbUserName  #tbUserPhone
 * 并调用 tbOpenCity() / tbLogout()
 */
(function () {
    var CITY_KEY = 'ceyuan_current_city';
    var PROFILE_KEY = 'ceyuan_member_profile';
    var HOT_CITIES = [
        { name: '北京市', prov: '北京市' }, { name: '上海市', prov: '上海市' },
        { name: '广州市', prov: '广东省' }, { name: '深圳市', prov: '广东省' },
        { name: '杭州市', prov: '浙江省' }, { name: '成都市', prov: '四川省' },
        { name: '重庆市', prov: '重庆市' }, { name: '武汉市', prov: '湖北省' },
        { name: '南京市', prov: '江苏省' }, { name: '苏州市', prov: '江苏省' },
        { name: '西安市', prov: '陕西省' }, { name: '天津市', prov: '天津市' }
    ];
    var DEFAULT_CITY = '成都市';

    function loadCity() {
        try { return JSON.parse(localStorage.getItem(CITY_KEY) || 'null'); } catch (e) { return null; }
    }
    function cityName() {
        var c = loadCity();
        return (c && c.name) ? c.name : DEFAULT_CITY;
    }
    function loadUser() {
        try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch (e) { return null; }
    }
    function goto(url) {
        try { if (parent && parent.window && parent.window.switchPage) { parent.window.switchPage(url, null); return; } } catch (e) {}
        window.location.href = url;
    }
    function toast(msg) {
        var t = document.createElement('div');
        t.className = 'fixed px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 shadow-xl';
        t.style.cssText = 'left:50%;transform:translateX(-50%);top:70px;z-index:999;transition:opacity .3s';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () {
            t.style.opacity = 0;
            setTimeout(function () { t.remove(); }, 300);
        }, 1800);
    }

    function render() {
        var c = document.getElementById('tbCity');
        if (c) c.textContent = cityName();

        var label = document.getElementById('tbUser');
        var dn = document.getElementById('tbUserName');
        var dp = document.getElementById('tbUserPhone');
        var u = loadUser();
        if (u) {
            var name = u.contact || u.company || (u.phone ? u.phone.slice(0, 3) + '****' + u.phone.slice(-4) : '个人用户');
            if (label) label.textContent = name.length > 6 ? name.slice(0, 6) + '…' : name;
            if (dn) dn.textContent = name;
            if (dp) dp.textContent = u.phone || '—';
        } else {
            if (label) label.textContent = '未登录';
            if (dn) dn.textContent = '未登录';
            if (dp) dp.textContent = '—';
        }
    }

    function buildPanel() {
        var html = '' +
            '<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm hidden" id="tbCityMask" onclick="if(event.target===this)tbCloseCity()">' +
            '  <div class="w-[520px] max-w-[92vw] bg-white rounded-2xl shadow-2xl overflow-hidden">' +
            '    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">' +
            '      <div>' +
            '        <h3 class="text-sm font-black text-slate-800">切换城市</h3>' +
            '        <p class="text-[11px] text-slate-400 mt-0.5">选择后优先推荐当地政策</p>' +
            '      </div>' +
            '      <button onclick="tbCloseCity()" class="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400"><i class="fa fa-times"></i></button>' +
            '    </div>' +
            '    <div class="px-5 py-4">' +
            '      <div class="text-[11px] font-bold text-slate-400 mb-2">热门城市</div>' +
            '      <div class="grid grid-cols-4 gap-2">' + HOT_CITIES.map(function (c) {
                return '<button onclick="tbPickCity(\'' + c.name + '\',\'' + c.prov + '\')" class="px-2 py-2 rounded-xl text-xs border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">' + c.name.replace('市', '') + '</button>';
            }).join('') + '</div>' +
            '    </div>' +
            '    <div class="px-5 py-3 bg-slate-50 text-[10px] text-slate-400">当前：<span id="tbCityNow"></span> · 更多城市请在首页「切换城市」中按省份浏览</div>' +
            '  </div>' +
            '</div>';
        var d = document.createElement('div');
        d.innerHTML = html;
        document.body.appendChild(d.firstChild);
    }

    function openCity() {
        if (!document.getElementById('tbCityMask')) buildPanel();
        var now = document.getElementById('tbCityNow');
        if (now) now.textContent = cityName();
        document.getElementById('tbCityMask').classList.remove('hidden');
    }
    function closeCity() {
        var m = document.getElementById('tbCityMask');
        if (m) m.classList.add('hidden');
    }
    function pickCity(name, prov) {
        try { localStorage.setItem(CITY_KEY, JSON.stringify({ name: name, province: prov || '', t: Date.now() })); } catch (e) {}
        render();
        closeCity();
        toast('已切换至 ' + name + '，将为您推荐当地政策');
    }
    function logout() {
        if (!confirm('确定退出当前账号吗？')) return;
        try { localStorage.removeItem(PROFILE_KEY); } catch (e) {}
        toast('已退出登录，正在跳转登录页');
        setTimeout(function () { goto('login.html'); }, 800);
    }

    window.tbRender = render;
    window.tbOpenCity = openCity;
    window.tbCloseCity = closeCity;
    window.tbPickCity = pickCity;
    window.tbLogout = logout;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();
