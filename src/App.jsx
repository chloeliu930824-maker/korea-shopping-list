import { useState, useEffect, useRef } from "react";
// 1. 引入你專案中的 supabase client (請確保你的專案中已有設定好 createClient 的 supabase.js)
// 如果路徑不同，可以自行修改，例如 import { supabase } from "./supabaseClient";
import { supabase } from "./supabase"; 

const C = {
  cream: "#FFF8E7", red: "#930500", blue: "#95BBEA",
  lightRed: "#FFE8E8", lightBlue: "#E8F1FB",
  black: "#1a1a1a", gray: "#888", bg: "#e0d8c8",
};

const T = {
  en: {
    title: "🇰🇷 Shopping List",
    subtitle: "✦ KOREA SHOPPING LIST ✦",
    budget: "BUDGET", spent: "SPENT", heavy: "HEAVY",
    items: "items",
    updated: "updated",
    refresh: "🔄 Refresh",
    refreshing: "Updating...",
    addItem: "＋ Add Item",
    addGroup: "＋ Add Group",
    list: "📋 List",
    share: "📤 Share",
    shareTitle: "SHARE YOUR LIST",
    shareDesc: "Copy and send to your travel buddies",
    copyBtn: "📋 Copy List",
    copied: "✅ Copied!",
    copyFail: "Please copy the text above manually",
    subtotal: "SUBTOTAL",
    noItems: "No items yet",
    itemName: "Item name",
    krwPlaceholder: "KRW",
    category: "Category",
    categories: ["Skincare", "Makeup", "Food", "Clothes", "Accessories", "Stationery", "Other"],
    selectCategory: "Category",
    linkPlaceholder: "🔗 Product link",
    altPlaceholder: "📝 Backup option (if sold out)",
    notePlaceholder: "Notes (shade, size...)",
    deleteItem: "Delete Item",
    status: { to_buy: "To Buy", bought: "Bought", sold_out: "Sold Out" },
    weight: { light: "🪶 Light", mid: "📦 Mid", heavy: "🧳 Heavy" },
    newGroup: "Day",
    editGroup: "✏️",
    loginBtn: "🔑 Login / Sync",
    logoutBtn: "🚪 Logout",
    syncing: "🔄 Syncing...",
    syncSuccess: "✅ Cloud Synced",
  },
  zh: {
    title: "🇰🇷 購物清單",
    subtitle: "✦ 韓國購物清單 ✦",
    budget: "總預算", spent: "已買", heavy: "重物",
    items: "件",
    updated: "更新",
    refresh: "🔄 更新",
    refreshing: "更新中...",
    addItem: "＋ 新增商品",
    addGroup: "＋ 新增行程分組",
    list: "📋 清單",
    share: "📤 分享",
    shareTitle: "SHARE YOUR LIST",
    shareDesc: "複製後傳給同行朋友",
    copyBtn: "📋 複製清單",
    copied: "✅ 已複製！",
    copyFail: "請手動複製上方文字",
    subtotal: "SUBTOTAL",
    noItems: "還沒有品項",
    itemName: "商品名稱",
    krwPlaceholder: "韓幣",
    category: "分類",
    categories: ["保養", "彩妝", "食品", "服飾", "配件", "文具", "其他"],
    selectCategory: "選分類",
    linkPlaceholder: "🔗 商品連結",
    altPlaceholder: "📝 備案 B（售完替代品）",
    notePlaceholder: "備註（色號、尺寸...）",
    deleteItem: "刪除商品",
    status: { to_buy: "待買", bought: "已買", sold_out: "售完" },
    weight: { light: "🪶 輕", mid: "📦 中", heavy: "🧳 重" },
    newGroup: "Day",
    editGroup: "✏️",
    loginBtn: "🔑 登入並同步",
    logoutBtn: "🚪 登出",
    syncing: "🔄 同步中...",
    syncSuccess: "✅ 雲端已同步",
  },
};

const STATUS_KEYS = ["to_buy", "bought", "sold_out"];
const WEIGHT_KEYS = ["light", "mid", "heavy"];

const statusStyle = {
  to_buy: { color: C.red, bg: C.lightRed, border: C.red },
  bought: { color: "#1a6b1a", bg: "#e2f5e2", border: "#1a6b1a" },
  sold_out: { color: "#777", bg: "#ececec", border: "#aaa" },
};

function Divider() {
  return (
    <div style={{ textAlign: "center", color: C.red, fontSize: 10, letterSpacing: 4, margin: "8px 0", userSelect: "none" }}>
      ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦
    </div>
  );
}

function ZigzagBorder({ flip }) {
  return (
    <div style={{ height: 10, overflow: "hidden", transform: flip ? "rotate(180deg)" : "none" }}>
      <svg width="100%" height="10" preserveAspectRatio="none">
        <polyline
          points={Array.from({ length: 80 }, (_, i) => `${i * 12},${i % 2 === 0 ? 0 : 10}`).join(" ")}
          stroke={C.red} strokeWidth="1.5" fill="none"
        />
      </svg>
    </div>
  );
}

function ImageUpload({ value, onChange }) {
  const ref = useRef();
  return (
    <div onClick={() => ref.current.click()} style={{
      width: 60, height: 60, border: `2px dashed ${C.blue}`,
      background: value ? "transparent" : C.lightBlue,
      cursor: "pointer", overflow: "hidden", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {value
        ? <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: 22 }}>📷</span>}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files[0];
          if (!file) return;
          // 超過 1.5MB 進行提示，防範本地字串爆掉
          if (file.size > 1500000) {
            alert("圖片檔案過大，請選擇較小的圖片(1.5MB以內)以確保同步流暢！");
            return;
          }
          const reader = new FileReader();
          reader.onload = ev => onChange(ev.target.result);
          reader.readAsDataURL(file);
        }} />
    </div>
  );
}

function StatusBadge({ value, onChange, t }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {STATUS_KEYS.map(k => {
        const active = value === k;
        const st = statusStyle[k];
        return (
          <button key={k} onClick={() => onChange(k)} style={{
            flex: 1, border: `1.5px solid ${active ? st.border : "#ddd"}`,
            background: active ? st.bg : "transparent",
            color: active ? st.color : "#aaa",
            fontSize: 12, fontWeight: 800, padding: "6px 0",
            cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.3,
          }}>
            {t.status[k]}
          </button>
        );
      })}
    </div>
  );
}

function ItemRow({ item, onUpdate, onDelete, t }) {
  const [open, setOpen] = useState(false);
  const bought = item.status === "bought";
  const soldout = item.status === "sold_out";

  return (
    <div style={{ borderBottom: `1px dashed ${C.blue}`, paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <ImageUpload value={item.image} onChange={v => onUpdate({ ...item, image: v })} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={item.name}
            onChange={e => onUpdate({ ...item, name: e.target.value })}
            placeholder={t.itemName}
            style={{
              width: "100%", border: "none", borderBottom: `1.5px solid ${C.red}`,
              background: "transparent", fontSize: 15, fontWeight: 800,
              color: bought || soldout ? C.gray : C.black,
              textDecoration: bought ? "line-through" : "none",
              outline: "none", fontFamily: "inherit", padding: "2px 0", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 12, color: C.red, fontWeight: 800 }}>₩</span>
            <input
              type="number" value={item.krw}
              onChange={e => onUpdate({ ...item, krw: e.target.value })}
              placeholder={t.krwPlaceholder}
              style={{
                width: 90, border: "none", borderBottom: `1px solid ${C.blue}`,
                background: "transparent", fontSize: 14, fontWeight: 700,
                color: C.black, outline: "none", padding: "1px 0",
              }}
            />
            {item.krw && (
              <span style={{ fontSize: 13, color: C.blue, fontWeight: 800 }}>
                ≈ NT${Math.round(Number(item.krw) * (item._rate || 0.023)).toLocaleString()}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
            {WEIGHT_KEYS.map(k => (
              <button key={k} onClick={() => onUpdate({ ...item, weight: item.weight === k ? "" : k })}
                style={{
                  border: `1.5px solid ${item.weight === k ? C.red : C.blue}`,
                  background: item.weight === k ? C.red : "transparent",
                  color: item.weight === k ? "#fff" : C.blue,
                  fontSize: 11, fontWeight: 800, padding: "3px 8px", cursor: "pointer",
                }}>
                {t.weight[k]}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setOpen(v => !v)} style={{
          background: "none", border: `1px solid ${C.red}`, cursor: "pointer",
          color: C.red, fontSize: 12, fontWeight: 800, padding: "6px 10px", flexShrink: 0, marginTop: 2,
        }}>{open ? "▲" : "▼"}</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <StatusBadge value={item.status} onChange={v => onUpdate({ ...item, status: v })} t={t} />
      </div>

      {open && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <select value={item.category} onChange={e => onUpdate({ ...item, category: e.target.value })}
            style={{ border: `1px solid ${C.blue}`, background: C.cream, fontSize: 13, padding: "8px 10px", color: C.black, outline: "none", fontFamily: "inherit", width: "100%" }}>
            <option value="">{t.selectCategory}</option>
            <option value="Unassigned">{t.selectCategory}</option>
            {t.categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={item.link} onChange={e => onUpdate({ ...item, link: e.target.value })}
            placeholder={t.linkPlaceholder}
            style={{ border: `1px solid ${C.blue}`, background: C.cream, fontSize: 13, padding: "8px 10px", color: C.black, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
          <input value={item.alt} onChange={e => onUpdate({ ...item, alt: e.target.value })}
            placeholder={t.altPlaceholder}
            style={{ border: `1px solid ${C.blue}`, background: C.cream, fontSize: 13, padding: "8px 10px", color: C.black, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
          <textarea value={item.note} onChange={e => onUpdate({ ...item, note: e.target.value })}
            placeholder={t.notePlaceholder} rows={2}
            style={{ border: `1px solid ${C.blue}`, background: C.cream, fontSize: 13, padding: "8px 10px", color: C.black, outline: "none", resize: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
          <button onClick={() => onDelete(item.id)}
            style={{ alignSelf: "flex-end", border: `1.5px solid ${C.red}`, background: "none", color: C.red, fontSize: 12, fontWeight: 800, padding: "8px 20px", cursor: "pointer", letterSpacing: 1 }}>
            {t.deleteItem}
          </button>
        </div>
      )}
    </div>
  );
}

function GroupCard({ group, allItems, rate, onRename, onDelete, onAddItem, onUpdateItem, onDeleteItem, t }) {
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(group.name);
  const [collapsed, setCollapsed] = useState(false);
  const items = allItems.filter(i => i.groupId === group.id).map(i => ({ ...i, _rate: rate }));
  const total = items.filter(i => i.status !== "sold_out").reduce((s, i) => s + (Number(i.krw) || 0), 0);
  const boughtTotal = items.filter(i => i.status === "bought").reduce((s, i) => s + (Number(i.krw) || 0), 0);
  const heavy = items.filter(i => i.weight === "heavy").length;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ background: C.red, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => setCollapsed(v => !v)} style={{ background: "none", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", padding: 0, flexShrink: 0 }}>
          {collapsed ? "▶" : "▼"}
        </button>
        {editName
          ? <input autoFocus value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={() => { onRename(group.id, nameVal); setEditName(false); }}
              onKeyDown={e => e.key === "Enter" && (onRename(group.id, nameVal), setEditName(false))}
              style={{ flex: 1, background: "transparent", border: "none", borderBottom: "1px solid #fff", color: "#fff", fontSize: 15, fontWeight: 800, outline: "none", fontFamily: "inherit" }} />
          : <span onClick={() => setEditName(true)} style={{ flex: 1, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              {t.editGroup} {group.name}
            </span>
        }
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {heavy > 0 && <span style={{ fontSize: 10, background: "#fff", color: C.red, fontWeight: 800, padding: "2px 6px" }}>🧳×{heavy}</span>}
          <button onClick={() => onDelete(group.id)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.5)", color: "#fff", fontSize: 11, padding: "3px 8px", cursor: "pointer" }}>✕</button>
        </div>
      </div>

      {!collapsed && (
        <div style={{ background: C.cream, border: `1.5px solid ${C.red}`, borderTop: "none", padding: "10px 12px" }}>
          <ZigzagBorder />
          {items.length === 0
            ? <div style={{ textAlign: "center", color: C.gray, fontSize: 13, padding: "20px 0" }}>{t.noItems}</div>
            : items.map(item => <ItemRow key={item.id} item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} t={t} />)
          }
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.red, letterSpacing: 1 }}>{t.subtotal}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.red }}>
              ₩{total.toLocaleString()}{total ? ` ≈ NT$${Math.round(total * rate).toLocaleString()}` : ""}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
            <span style={{ fontSize: 11, color: C.gray }}>{t.status.bought}</span>
            <span style={{ fontSize: 11, color: "#1a6b1a", fontWeight: 700 }}>
              ₩{boughtTotal.toLocaleString()}{boughtTotal ? ` ≈ NT$${Math.round(boughtTotal * rate).toLocaleString()}` : ""}
            </span>
          </div>
          <ZigzagBorder flip />
          <button onClick={() => onAddItem(group.id)} style={{
            width: "100%", marginTop: 10, border: `1.5px dashed ${C.red}`,
            background: "transparent", color: C.red, fontSize: 14, fontWeight: 800,
            padding: "10px", cursor: "pointer", letterSpacing: 1, fontFamily: "inherit",
          }}>
            {t.addItem}
          </button>
        </div>
      )}
    </div>
  );
}

let _id = 1;
const uid = () => `${Date.now()}_${_id++}`;

export default function App() {
  const [lang, setLang] = useState("en");
  const t = T[lang];
  
  // 核心狀態設定：預設先向 LocalStorage 讀取，若無則初始化基本結構
  const [groups, setGroups] = useState(() => {
    const local = localStorage.getItem("kr_shop_groups");
    if (local) return JSON.parse(local);
    return [{ id: "g0_init", name: "Day 1" }];
  });

  const [items, setItems] = useState(() => {
    const local = localStorage.getItem("kr_shop_items");
    if (local) return JSON.parse(local);
    return [{ id: "i0_init", groupId: "g0_init", name: "", image: null, krw: "", category: "", link: "", note: "", alt: "", weight: "", status: "to_buy" }];
  });

  const [rate, setRate] = useState(0.023);
  const [rateTime, setRateTime] = useState("");
  const [tab, setTab] = useState("list");
  const [shareMsg, setShareMsg] = useState("");
  const [rateLoading, setRateLoading] = useState(false);

  // 新增 Supabase 雲端專用狀態
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState(""); // 顯示目前同步狀況

  // ==================== 1. 處理使用者帳號登入監聽 ====================
  useEffect(() => {
    // 檢查初始 Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // 監聽登入/登出狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ==================== 2. 當使用者存在時，自動載入/保存雲端資料 ====================
  // 載入雲端資料
  const loadCloudData = async (currentUser) => {
    if (!currentUser) return;
    setSyncStatus("syncing");
    try {
      const { data, error } = await supabase
        .from("user_lists")
        .select("groups, items")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) throw error;
      
      // 如果雲端已有備份，覆蓋本地狀態
      if (data) {
        if (data.groups) setGroups(data.groups);
        if (data.items) setItems(data.items);
      }
      setSyncStatus("success");
      setTimeout(() => setSyncStatus(""), 2000);
    } catch (err) {
      console.error("Failed to load cloud data:", err);
      setSyncStatus("");
    }
  };

  // 觸發載入
  useEffect(() => {
    if (user) {
      loadCloudData(user);
    }
  }, [user]);

  // 本地快取備份與雲端防抖動自動更新 (Debounce Sync)
  useEffect(() => {
    localStorage.setItem("kr_shop_groups", JSON.stringify(groups));
    localStorage.setItem("kr_shop_items", JSON.stringify(items));

    if (!user) return;

    // 設定防抖動，避免使用者連續輸入文字時頻繁向資料庫發送 Request
    const timer = setTimeout(async () => {
      setSyncStatus("syncing");
      try {
        const { error } = await supabase
          .from("user_lists")
          .upsert({
            user_id: user.id,
            groups: groups,
            items: items,
            updated_at: new Date()
          }, { onConflict: "user_id" });

        if (error) throw error;
        setSyncStatus("success");
        setTimeout(() => setSyncStatus(""), 2000);
      } catch (err) {
        console.error("Cloud upsert failed:", err);
        setSyncStatus("");
      }
    }, 1000); // 停止輸入後 1 秒進行儲存

    return () => clearTimeout(timer);
  }, [groups, items, user]);

  // ==================== 3. 處理 OAuth / 簡易登入與登出行為 ====================
  const handleLogin = async () => {
    // 這裡預設使用 Google 登入，如果你想換成其他登入方式只需微調此處
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) alert("登入失敗: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // 登出時可以選擇清空本地，或保留單機使用
    localStorage.removeItem("kr_shop_groups");
    localStorage.removeItem("kr_shop_items");
    setGroups([{ id: uid(), name: "Day 1" }]);
    setItems([{ id: uid(), groupId: "g0_init", name: "", image: null, krw: "", category: "", link: "", note: "", alt: "", weight: "", status: "to_buy" }]);
  };

  // ==================== 4. 匯率與清單原汁原味邏輯 ====================
  const fetchRate = () => {
    setRateLoading(true);
    fetch("https://api.frankfurter.app/latest?from=KRW&to=TWD")
      .then(r => r.json())
      .then(d => {
        if (d.rates?.TWD) {
          setRate(d.rates.TWD);
          setRateTime(new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }));
        }
      }).catch(() => {}).finally(() => setRateLoading(false));
  };

  useEffect(() => { fetchRate(); }, []);

  const addGroup = () => setGroups(p => [...p, { id: uid(), name: `${t.newGroup} ${groups.length + 1}` }]);
  const allTotal = items.filter(i => i.status !== "sold_out").reduce((s, i) => s + (Number(i.krw) || 0), 0);
  const boughtTotal = items.filter(i => i.status === "bought").reduce((s, i) => s + (Number(i.krw) || 0), 0);
  const heavyCount = items.filter(i => i.weight === "heavy").length;

  const shareText = [
    "🇰🇷 Korea Shopping List", "",
    ...groups.flatMap(g => {
      const gi = items.filter(i => i.groupId === g.id);
      return [`📍 ${g.name}`, ...gi.map(i => `${i.status === "bought" ? "✅" : i.status === "sold_out" ? "❌" : "⬜"} ${i.name || "—"}${i.krw ? ` ₩${Number(i.krw).toLocaleString()}` : ""}`), ""];
    }),
    `💰 Total: ₩${allTotal.toLocaleString()} ≈ NT$${Math.round(allTotal * rate).toLocaleString()}`,
    `✅ Spent: ₩${boughtTotal.toLocaleString()} ≈ NT$${Math.round(boughtTotal * rate).toLocaleString()}`,
  ].join("\n");

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", fontFamily: "'Noto Sans TC', sans-serif", background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: C.red, padding: "16px 16px 12px", position: "relative" }}>
        
        {/* 頂部按鈕群：語系與 Supabase 登入狀態控管 */}
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 6, alignItems: "center" }}>
          {/* 同步小綠燈 */}
          {syncStatus === "syncing" && <span style={{ fontSize: 11, color: "#fff" }}>{t.syncing}</span>}
          {syncStatus === "success" && <span style={{ fontSize: 11, color: "#bfffbf", fontWeight: "bold" }}>{t.syncSuccess}</span>}
          
          {user ? (
            <button onClick={handleLogout} style={{
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 10px",
              cursor: "pointer", fontFamily: "inherit"
            }}>
              {t.logoutBtn}
            </button>
          ) : (
            <button onClick={handleLogin} style={{
              background: C.blue, border: `1px solid ${C.blue}`,
              color: C.black, fontSize: 11, fontWeight: 800, padding: "4px 10px",
              cursor: "pointer", fontFamily: "inherit"
            }}>
              {t.loginBtn}
            </button>
          )}

          <button onClick={() => setLang(l => l === "en" ? "zh" : "en")} style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)",
            color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 10px",
            cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5,
          }}>
            {lang === "en" ? "中文" : "EN"}
          </button>
        </div>

        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: 3, marginTop: 4 }}>{t.subtitle}</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: 1, marginTop: 2 }}>{t.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>
            1 KRW = {rate.toFixed(4)} TWD{rateTime ? ` · ${rateTime} ${t.updated}` : ""}
          </span>
          <button onClick={fetchRate} disabled={rateLoading} style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#fff", fontSize: 10, padding: "2px 8px", cursor: "pointer",
            fontFamily: "inherit", fontWeight: 700, opacity: rateLoading ? 0.5 : 1,
          }}>
            {rateLoading ? t.refreshing : t.refresh}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {[
            { label: t.budget, val: `₩${allTotal.toLocaleString()}`, sub: `NT$${Math.round(allTotal * rate).toLocaleString()}` },
            { label: t.spent, val: `₩${boughtTotal.toLocaleString()}`, sub: `NT$${Math.round(boughtTotal * rate).toLocaleString()}` },
            { label: t.heavy, val: `🧳 ×${heavyCount}`, sub: t.items },
          ].map(({ label, val, sub }) => (
            <div key={label} style={{ flex: 1, background: "rgba(0,0,0,0.18)", padding: "8px" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: 1 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginTop: 2 }}>{val}</div>
              <div style={{ fontSize: 10, color: C.blue }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#111", position: "sticky", top: 0, zIndex: 10 }}>
        {[["list", t.list], ["share", t.share]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, border: "none", padding: "13px", fontSize: 13, fontWeight: 800,
            background: tab === key ? C.blue : "transparent",
            color: tab === key ? C.black : "#666",
            cursor: "pointer", letterSpacing: 1, fontFamily: "inherit",
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "14px 12px 100px" }}>
        {tab === "list" && (
          <>
            {groups.map(g => (
              <GroupCard key={g.id} group={g} allItems={items} rate={rate} t={t}
                onRename={(id, name) => setGroups(p => p.map(g => g.id === id ? { ...g, name } : g))}
                onDelete={id => { setGroups(p => p.filter(g => g.id !== id)); setItems(p => p.filter(i => i.groupId !== id)); }}
                onAddItem={gid => setItems(p => [...p, { id: uid(), groupId: gid, name: "", image: null, krw: "", category: "", link: "", note: "", alt: "", weight: "", status: "to_buy" }])}
                onUpdateItem={u => setItems(p => p.map(i => i.id === u.id ? u : i))}
                onDeleteItem={id => setItems(p => p.filter(i => i.id !== id))}
              />
            ))}
            <button onClick={addGroup} style={{
              width: "100%", border: `2px dashed ${C.red}`, background: C.cream,
              color: C.red, fontSize: 14, fontWeight: 800, padding: "14px",
              cursor: "pointer", letterSpacing: 2, fontFamily: "inherit",
            }}>{t.addGroup}</button>
          </>
        )}

        {tab === "share" && (
          <div style={{ background: C.cream, border: `1.5px solid ${C.red}`, padding: 16 }}>
            <ZigzagBorder />
            <div style={{ textAlign: "center", margin: "10px 0 8px" }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.red, letterSpacing: 2 }}>{t.shareTitle}</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{t.shareDesc}</div>
            </div>
            <Divider />
            <pre style={{ fontSize: 12, color: C.black, lineHeight: 1.9, whiteSpace: "pre-wrap", fontFamily: "monospace", background: "#fff", padding: 12, border: `1px solid ${C.blue}`, maxHeight: 320, overflowY: "auto", margin: 0 }}>
              {shareText}
            </pre>
            <Divider />
            <button onClick={() => {
              navigator.clipboard?.writeText(shareText).then(() => setShareMsg(t.copied)).catch(() => setShareMsg(t.copyFail));
              setTimeout(() => setShareMsg(""), 2500);
            }} style={{
              width: "100%", background: C.red, color: "#fff", border: "none",
              fontWeight: 800, fontSize: 15, padding: "14px", cursor: "pointer",
              letterSpacing: 2, fontFamily: "inherit", marginTop: 8,
            }}>{t.copyBtn}</button>
            {shareMsg && <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: C.red, fontWeight: 700 }}>{shareMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}