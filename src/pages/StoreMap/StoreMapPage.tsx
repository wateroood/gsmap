import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { STORES, BRAND_META, BRAND_ORDER, type IStore, type BrandKey } from '@/data/stores';
import { cn } from '@/lib/utils';

type FilterKey = 'all' | BrandKey;

const FILTERS: { key: FilterKey; label: string; dotClass: string; activeClass: string }[] = [
  { key: 'all', label: '全部', dotClass: 'bg-[var(--ink)]', activeClass: 'bg-[var(--ink)] text-white' },
  { key: 'star', label: '国色星洗', dotClass: 'bg-[var(--red)]', activeClass: 'bg-[var(--red)] text-white' },
  { key: 'pure', label: '国色净衣馆', dotClass: 'bg-[var(--blue)]', activeClass: 'bg-[var(--blue)] text-white' },
  { key: 'lux', label: '国色1678', dotClass: 'bg-[var(--gold)]', activeClass: 'bg-[var(--gold)] text-white' },
];

function getBrandColor(brand: BrandKey): string {
  if (brand === 'star') return 'var(--red)';
  if (brand === 'pure') return 'var(--blue)';
  return 'var(--gold)';
}

function getBrandPinClass(brand: BrandKey): string {
  if (brand === 'star') return 'gs-red';
  if (brand === 'pure') return 'gs-blue';
  return 'gs-gold';
}

export default function StoreMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [keyword, setKeyword] = useState('');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [activeStoreIdx, setActiveStoreIdx] = useState<number | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const stats = useMemo(() => ({
    total: STORES.length,
    star: STORES.filter(s => s.brand === 'star').length,
    pure: STORES.filter(s => s.brand === 'pure').length,
    lux: STORES.filter(s => s.brand === 'lux').length,
    areas: new Set(STORES.map(s => s.area)).size,
  }), []);

  const kw = keyword.trim().toLowerCase();
  const filteredStores = useMemo(() => {
    return STORES.filter(s => {
      const brandOk = filter === 'all' || s.brand === filter;
      if (!brandOk) return false;
      if (!kw) return true;
      return (
        s.name.toLowerCase().includes(kw) ||
        s.short.toLowerCase().includes(kw) ||
        s.addr.toLowerCase().includes(kw) ||
        s.area.toLowerCase().includes(kw)
      );
    });
  }, [filter, kw]);

  const tipText = useMemo(() => {
    if (filter === 'all') return `共 ${stats.total} 家门店 · 覆盖 ${stats.areas} 个片区 · 点击列表可定位`;
    if (filter === 'star') return `国色星洗 ${stats.star} 家门店`;
    if (filter === 'pure') return `国色净衣馆 ${stats.pure} 家门店`;
    return `国色1678 高端洗护 ${stats.lux} 家门店`;
  }, [filter, stats]);

  // 初始化地图
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.585, 104.070],
      zoom: 11,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 高德标准彩色矢量电子地图（含道路、水系、绿地、建筑、文字注记）
      const vectorLayer = L.tileLayer(
        'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
        {
          subdomains: ['1', '2', '3', '4'],
          maxZoom: 18,
          attribution: '&copy; 高德地图',
        }
      );
      vectorLayer.addTo(map);

      // 瓦片加载失败时回退到 OSM
      let tileFailCount = 0;
      const fallbackToOSM = () => {
        if (tileFailCount > 15) return;
        tileFailCount++;
        if (tileFailCount === 15) {
          map.removeLayer(vectorLayer);
          L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors',
            }
          ).addTo(map);
        }
      };
      vectorLayer.on('tileerror', fallbackToOSM);

    // 创建 Marker
    const markers: L.Marker[] = [];
    STORES.forEach((s, idx) => {
      const color = getBrandColor(s.brand);
      const icon = L.divIcon({
        className: '',
        html: `
          <div class="gs-marker ${getBrandPinClass(s.brand)}">
            <div class="pin" style="--pin-color:${color}">
              <div class="pin-inner"></div>
            </div>
            <div class="gs-label">${s.short}</div>
          </div>
        `,
        iconSize: [140, 64],
        iconAnchor: [20, 54],
        popupAnchor: [0, -52],
      });

      const marker = L.marker([s.lat, s.lng], { icon, title: s.name });
      const meta = BRAND_META[s.brand];
      const brandCls = s.brand === 'star' ? 'red' : s.brand === 'pure' ? 'blue' : 'gold';

      // 弹窗内容（含导航按钮）
      const navUrl = `https://uri.amap.com/navigation?to=${s.lng},${s.lat},${encodeURIComponent(s.name)}&mode=car&policy=1&src=guose-store-map&coordinate=gaode&callnative=0`;
      const popupContent = `
        <div class="gs-popup">
          <div class="gs-popup-head">
            <div class="gs-popup-name">${s.name}</div>
            <span class="gs-popup-brand brand-${brandCls}">${meta.label}</span>
          </div>
          <div class="gs-popup-addr">${s.addr}</div>
          <div class="gs-popup-meta">
            <span class="gs-tag">商圈 · ${s.area}</span>
            <span class="gs-tag">营业 ${s.hours}</span>
            <span class="gs-tag rate-tag">${s.rate !== null ? '评分 ' + s.rate.toFixed(1) : '暂无评分'}</span>
          </div>
          <a class="gs-nav-btn" href="${navUrl}" target="_blank" rel="noopener noreferrer">
            <span class="gs-nav-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
            </span>
            导航到这里
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        maxWidth: 280,
        minWidth: 260,
        className: 'gs-popup-container',
      });

      marker.on('click', () => {
        marker.openPopup();
        setActiveStoreIdx(idx);
      });

      (marker as any).storeIdx = idx;
      markers.push(marker);
    });

    L.layerGroup(markers).addTo(map);

    // 自动适配边界
    const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
    map.fitBounds(bounds.pad(0.12));

    // 缩放控制标签密度
    const updateLabelDensity = () => {
      document.body.classList.toggle('map-zoom-low', map.getZoom() < 12);
    };
    map.on('zoomend', updateLabelDensity);
    updateLabelDensity();

    mapRef.current = map;
    markersRef.current = markers;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // 面板折叠时地图重算尺寸
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [panelCollapsed]);

  // 筛选 / 搜索变化时更新 marker 显示
  useEffect(() => {
    markersRef.current.forEach((m, idx) => {
      const store = STORES[idx];
      const brandOk = filter === 'all' || store.brand === filter;
      const kwOk =
        !kw ||
        store.name.toLowerCase().includes(kw) ||
        store.short.toLowerCase().includes(kw) ||
        store.addr.toLowerCase().includes(kw) ||
        store.area.toLowerCase().includes(kw);
      const show = brandOk && kwOk;
      const el = m.getElement();
      if (el) el.style.display = show ? '' : 'none';
      if (!show) m.closePopup();
    });
    setActiveStoreIdx(null);
  }, [filter, kw]);

  // 点击列表项定位到门店
  const handleStoreClick = (store: IStore, idx: number) => {
    const map = mapRef.current;
    const marker = markersRef.current[idx];
    if (!map || !marker) return;

    setActiveStoreIdx(idx);
    map.flyTo([store.lat, store.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
    setTimeout(() => marker.openPopup(), 650);

    // 移动端点击后收起列表
    if (window.innerWidth < 768) {
      setMobileListOpen(false);
    }
  };

  // 切换面板折叠
  const togglePanel = () => {
    setPanelCollapsed(v => !v);
  };

  return (
    <div className="gs-app">
      {/* 自定义 Marker 样式 + 应用样式 */}
      <style>{`
        :root {
          --ink: #141210;
          --ink-2: #4a443d;
          --ink-3: #7a7066;
          --paper: #f2f5f8;
          --card: #ffffff;
          --line: #dde3ea;
          --gold: #d99523;
          --gold-soft: #fff2d6;
          --red: #e53935;
          --red-soft: #ffe0de;
          --blue: #1565c0;
          --blue-soft: #d6e8ff;
        }
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        body {
          font-family: "PingFang SC","Microsoft YaHei","Noto Sans SC",-apple-system,sans-serif;
          color: var(--ink);
          background: var(--paper);
        }

        .gs-app {
          display: flex;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }

        /* ===== 左侧面板 ===== */
        .gs-panel {
          width: 384px;
          min-width: 384px;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--card);
          border-right: 1px solid var(--line);
          z-index: 10;
          transition: margin-left 0.3s ease, width 0.3s ease, min-width 0.3s ease;
        }
        .gs-panel.collapsed {
          margin-left: -384px;
        }

        .gs-panel-head {
          padding: 20px 22px 16px;
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          border-bottom: none;
        }
        .gs-brand-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }
        .gs-brand-mark {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          flex: none;
          background: #fff;
          color: #0d47a1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 1px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        }
        .gs-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin: 0;
          line-height: 1.2;
          color: #fff;
        }
        .gs-sub {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.75);
          margin-top: 4px;
          letter-spacing: 0.3px;
        }
        .gs-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 14px;
        }
        .gs-stat {
          position: relative;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 8px 4px 10px;
          text-align: center;
          transition: all 0.2s;
          backdrop-filter: blur(4px);
          overflow: hidden;
        }
        .gs-stat::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 3px;
          background: #fff;
          opacity: 0.5;
        }
        .gs-stat.red::after { background: var(--red); opacity: 1; }
        .gs-stat.blue::after { background: #64b5f6; opacity: 1; }
        .gs-stat.gold::after { background: var(--gold); opacity: 1; }
        .gs-stat.total::after { background: #fff; opacity: 1; }
        .gs-stat:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-1px);
        }
        .gs-stat b {
          display: block;
          font-size: 19px;
          font-weight: 700;
          line-height: 1.2;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        .gs-stat span {
          display: block;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.85);
          margin-top: 3px;
          letter-spacing: 0.3px;
        }

        .gs-filters {
          display: flex;
          gap: 8px;
          padding: 14px 22px 6px;
        }
        .gs-filter-btn {
          flex: 1;
          border: 1px solid var(--line);
          background: var(--card);
          border-radius: 20px;
          padding: 7px 0;
          font-size: 12px;
          color: var(--ink-2);
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .gs-filter-btn .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex: none;
        }
        .gs-filter-btn.active {
          color: #fff;
          border-color: transparent;
        }
        .gs-filter-btn.active[data-brand='all'] { background: var(--blue); }
        .gs-filter-btn.active[data-brand='star'] { background: var(--red); }
        .gs-filter-btn.active[data-brand='pure'] { background: var(--blue); }
        .gs-filter-btn.active[data-brand='lux'] { background: var(--gold); }
        .gs-filter-btn.active[data-brand='all'] .dot { background: #fff; }
        .gs-filter-btn.active[data-brand='star'] .dot { background: #fff; }
        .gs-filter-btn.active[data-brand='pure'] .dot { background: #fff; }
        .gs-filter-btn.active[data-brand='lux'] .dot { background: #fff; }
        .gs-filter-btn:hover:not(.active) {
          border-color: var(--blue);
          color: var(--blue);
          background: var(--blue-soft);
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(21, 101, 192, 0.15);
        }
        .gs-filter-btn:active:not(.active) {
          transform: translateY(0);
        }

        .gs-legend {
          display: flex;
          gap: 14px;
          padding: 10px 22px 8px;
          font-size: 11.5px;
          color: var(--ink-2);
          border-bottom: 1px solid var(--line);
          align-items: center;
          flex-wrap: wrap;
        }
        .gs-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .gs-legend-pin {
          width: 11px;
          height: 11px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .gs-legend-pin.red { background: var(--red); }
        .gs-legend-pin.blue { background: var(--blue); }
        .gs-legend-pin.gold { background: var(--gold); }

        .gs-list-wrap {
          flex: 1;
          overflow-y: auto;
          padding: 8px 14px 20px;
        }
        .gs-list-wrap::-webkit-scrollbar { width: 6px; }
        .gs-list-wrap::-webkit-scrollbar-thumb {
          background: var(--line);
          border-radius: 3px;
        }
        .gs-list-wrap::-webkit-scrollbar-track { background: transparent; }

        .gs-group-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink-2);
          padding: 12px 8px 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gs-group-title .gdot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex: none;
        }

        .gs-store-item {
          display: flex;
          gap: 10px;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .gs-store-item {
          position: relative;
        }
        .gs-store-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 3px;
          border-radius: 0 2px 2px 0;
          background: transparent;
          transition: background 0.15s;
        }
        .gs-store-item:hover {
          background: #f5f9ff;
        }
        .gs-store-item.active {
          background: #e8f1fc;
          border-color: rgba(21, 101, 192, 0.3);
          box-shadow: 0 2px 8px rgba(21, 101, 192, 0.12);
        }
        .gs-store-item.active::before { background: var(--blue); }
        .gs-store-item.active[data-brand='star']::before { background: var(--red); }
        .gs-store-item.active[data-brand='pure']::before { background: var(--blue); }
        .gs-store-item.active[data-brand='lux']::before { background: var(--gold); }
        .gs-store-item.active .gs-store-name {
          color: var(--blue);
          font-weight: 700;
        }
        .gs-store-item.active[data-brand='star'] .gs-store-name { color: var(--red); }
        .gs-store-item.active[data-brand='pure'] .gs-store-name { color: var(--blue); }
        .gs-store-item.active[data-brand='lux'] .gs-store-name { color: var(--gold); }
        .gs-store-pin {
          width: 10px;
          height: 10px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          flex: none;
          margin-top: 5px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .gs-store-pin.red { background: var(--red); }
        .gs-store-pin.blue { background: var(--blue); }
        .gs-store-pin.gold { background: var(--gold); }

        .gs-store-body {
          flex: 1;
          min-width: 0;
        }
        .gs-store-name {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.3;
          margin-bottom: 3px;
        }
        .gs-store-addr {
          font-size: 12px;
          color: var(--ink-2);
          line-height: 1.45;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .gs-store-hours {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          color: var(--ink-3);
          margin-bottom: 5px;
        }
        .gs-store-hours svg {
          flex: none;
          color: var(--blue);
        }
        .gs-store-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .gs-tag {
          font-size: 10.5px;
          color: var(--ink-3);
          background: var(--paper);
          padding: 2px 7px;
          border-radius: 10px;
          line-height: 1.4;
        }
        .gs-tag.rate {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 13px;
          font-weight: 700;
          color: var(--gold);
          background: transparent;
          padding: 0;
          line-height: 1;
        }
        .gs-tag.rate .rate-star { font-size: 13px; }

        .gs-empty {
          text-align: center;
          color: var(--ink-3);
          font-size: 13px;
          padding: 40px 0;
        }

        /* ===== 搜索框 ===== */
        .gs-search-wrap { padding: 0 22px 14px; }
        .gs-search-input {
          position: relative;
          display: flex;
          align-items: center;
          height: 40px;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 10px;
          transition: border-color 0.2s, background 0.2s;
        }
        .gs-search-input:focus-within {
          border-color: var(--blue);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.1);
        }
        .gs-search-icon {
          position: absolute;
          left: 12px;
          color: var(--ink-3);
          pointer-events: none;
          flex-shrink: 0;
        }
        .gs-search-field {
          flex: 1;
          min-width: 0;
          height: 100%;
          padding: 0 36px 0 36px;
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: var(--ink);
          font-family: inherit;
        }
        .gs-search-field::placeholder { color: var(--ink-3); }
        .gs-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 50%;
          background: var(--ink-3);
          color: #fff;
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.15s;
          padding: 0;
        }
        .gs-search-clear:hover { opacity: 1; }

        /* ===== 折叠按钮（桌面端） ===== */
        .gs-collapse-btn {
          position: absolute;
          top: 50%;
          left: 384px;
          transform: translateY(-50%);
          width: 28px;
          height: 64px;
          background: var(--card);
          border: 1px solid var(--line);
          border-left: none;
          border-radius: 0 10px 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1000;
          transition: left 0.3s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.08);
          color: var(--ink-2);
          outline: none;
        }
        .gs-collapse-btn:hover {
          background: var(--red);
          color: #fff;
          box-shadow: 2px 4px 14px rgba(229, 57, 53, 0.35);
          width: 32px;
        }
        .gs-collapse-btn:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }
        .gs-panel.collapsed ~ .gs-collapse-btn {
          left: 0;
          border-radius: 0 10px 10px 0;
          border-left: none;
        }
        .gs-collapse-btn-icon {
          transition: transform 0.3s ease;
        }
        .gs-panel.collapsed ~ .gs-collapse-btn .gs-collapse-btn-icon {
          transform: rotate(180deg);
        }

        /* ===== 地图区域 ===== */
        .gs-map-wrap {
          flex: 1;
          position: relative;
          min-width: 0;
        }
        .gs-map {
          width: 100%;
          height: 100%;
        }
        .gs-map-tip {
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 12px;
          color: var(--ink);
          font-weight: 500;
          z-index: 500;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          border: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gs-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--red);
          animation: gs-pulse 2s ease-in-out infinite;
          flex: none;
        }
        @keyframes gs-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        /* ===== 自定义 Marker ===== */
        .gs-marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
        }
        .gs-marker .pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: var(--pin-color, var(--red));
          border: 3px solid #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0,0,0,0.1);
          position: relative;
        }
        .gs-marker .pin-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .gs-marker .gs-label {
          margin-top: 4px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--ink);
          background: #ffffff;
          padding: 3px 9px;
          border-radius: 12px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
          border: 1px solid var(--line);
          transition: opacity 0.2s, transform 0.2s;
        }
        .gs-marker:hover .gs-label {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        /* 缩放级别低时淡化标签 */
        .map-zoom-low .gs-marker .gs-label {
          opacity: 0.35;
        }

        /* ===== Popup 样式 ===== */
        .gs-popup-container .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
          padding: 0;
        }
        .gs-popup-container .leaflet-popup-content {
          margin: 0;
          width: 260px !important;
        }
        .gs-popup-container .leaflet-popup-tip {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .gs-popup {
          padding: 14px 16px;
          font-family: inherit;
        }
        .gs-popup-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }
        .gs-popup-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.3;
          flex: 1;
        }
        .gs-popup-brand {
          font-size: 10.5px;
          padding: 2px 8px;
          border-radius: 10px;
          color: #fff;
          flex: none;
          white-space: nowrap;
        }
        .gs-popup-brand.brand-red { background: var(--red); }
        .gs-popup-brand.brand-blue { background: var(--blue); }
        .gs-popup-brand.brand-gold { background: var(--gold); }
        .gs-popup-addr {
          font-size: 12.5px;
          color: var(--ink-2);
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .gs-popup-meta {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .gs-popup-meta .gs-tag {
          font-size: 10.5px;
          background: var(--paper);
        }
        .gs-popup-meta .rate-tag { color: var(--gold); }

        .leaflet-popup-content .gs-nav-btn,
        .gs-popup .gs-nav-btn,
        .gs-nav-btn {
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px 0;
          background: #1565c0 !important;
          color: #fff !important;
          font-size: 13px;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none !important;
          transition: all 0.2s;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
          border: none;
          cursor: pointer;
        }
        .leaflet-popup-content .gs-nav-btn:visited,
        .gs-nav-btn:visited {
          color: #fff !important;
        }
        .leaflet-popup-content .gs-nav-btn:hover,
        .gs-nav-btn:hover {
          background: #0d47a1 !important;
          color: #fff !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(21, 101, 192, 0.45);
        }
        .leaflet-popup-content .gs-nav-btn:active,
        .gs-nav-btn:active {
          color: #fff !important;
          transform: translateY(0);
        }
        .gs-nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ===== 移动端适配 ===== */
        .gs-mobile-toggle {
          display: none;
        }

        @media (max-width: 768px) {
          .gs-panel {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            min-width: 100%;
            height: auto;
            max-height: 60vh;
            z-index: 30;
            border-right: none;
            border-bottom: 1px solid var(--line);
            transition: transform 0.3s ease;
            transform: translateY(0);
          }
          .gs-panel.collapsed {
            margin-left: 0;
            transform: translateY(calc(-100% + 52px));
          }
          .gs-panel.collapsed .gs-list-wrap,
          .gs-panel.collapsed .gs-legend,
          .gs-panel.collapsed .gs-filters {
            display: none;
          }

        /* 移动端：面板在顶部，折叠按钮在面板底部边缘 */
          .gs-collapse-btn {
            display: none;
          }

          .gs-mobile-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            position: absolute;
            top: calc(60vh - 1px);
            left: 50%;
            transform: translateX(-50%);
            background: var(--card);
            border: 1px solid var(--line);
            border-top: none;
            border-radius: 0 0 14px 14px;
            padding: 7px 24px;
            font-size: 12px;
            font-weight: 500;
            color: var(--ink-2);
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08);
            transition: top 0.3s ease, background 0.2s ease, color 0.2s ease;
            white-space: nowrap;
          }
          .gs-mobile-toggle:hover {
            background: var(--gold-soft);
            color: var(--gold);
          }
          .gs-panel.collapsed ~ .gs-mobile-toggle {
            top: 52px;
          }

          .gs-map-tip {
            top: auto;
            bottom: 16px;
            font-size: 11px;
            padding: 6px 14px;
          }

          .gs-stats {
            gap: 6px;
          }
          .gs-stat b { font-size: 16px; }
          .gs-stat span { font-size: 9px; }
        }
      `}</style>

      {/* 左侧面板 */}
      <aside className={cn('gs-panel', panelCollapsed && 'collapsed')}>
        <div className="gs-panel-head">
          <div className="gs-brand-row">
            <div className="gs-brand-mark">国</div>
            <div style={{ flex: 1 }}>
              <h1 className="gs-title">国色洗染 · 成都门店分布</h1>
              <div className="gs-sub">Chengdu Store Locator</div>
            </div>
          </div>
          <div className="gs-stats">
            <div className="gs-stat total">
              <b>{stats.total}</b>
              <span>门店总数</span>
            </div>
            <div className="gs-stat red">
              <b>{stats.star}</b>
              <span>国色星洗</span>
            </div>
            <div className="gs-stat blue">
              <b>{stats.pure}</b>
              <span>净衣馆</span>
            </div>
            <div className="gs-stat gold">
              <b>{stats.lux}</b>
              <span>1678</span>
            </div>
          </div>
        </div>

        <div className="gs-filters">
          {FILTERS.map(f => (
            <button
              key={f.key}
              data-brand={f.key}
              className={cn('gs-filter-btn', filter === f.key && 'active')}
              onClick={() => setFilter(f.key)}
            >
              <span className="dot" />
              {f.label}
            </button>
          ))}
        </div>

        <div className="gs-search-wrap">
          <div className="gs-search-input">
            <Search className="gs-search-icon" size={16} strokeWidth={2} />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索门店名称/地址/商圈"
              className="gs-search-field"
            />
            {keyword && (
              <button
                type="button"
                className="gs-search-clear"
                onClick={() => setKeyword('')}
                aria-label="清除搜索"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        <div className="gs-legend">
          <div className="gs-legend-item">
            <span className="gs-legend-pin red" />
            国色星洗
          </div>
          <div className="gs-legend-item">
            <span className="gs-legend-pin blue" />
            国色净衣馆
          </div>
          <div className="gs-legend-item">
            <span className="gs-legend-pin gold" />
            国色1678
          </div>
        </div>

        <div className="gs-list-wrap">
          {BRAND_ORDER.map(brand => {
            const items = filteredStores.filter(s => s.brand === brand);
            if (items.length === 0) return null;
            const meta = BRAND_META[brand];
            return (
              <div key={brand}>
                <div className="gs-group-title">
                  <span className="gdot" style={{ background: getBrandColor(brand) }} />
                  {meta.label} · {items.length} 家
                </div>
                {items.map(store => {
                  const idx = STORES.indexOf(store);
                  return (
                    <div
                      key={idx}
                      data-brand={brand}
                      className={cn('gs-store-item', activeStoreIdx === idx && 'active')}
                      onClick={() => handleStoreClick(store, idx)}
                    >
                      <span className={cn('gs-store-pin', brand === 'star' ? 'red' : brand === 'pure' ? 'blue' : 'gold')} />
                      <div className="gs-store-body">
                        <div className="gs-store-name">{store.name}</div>
                        <div className="gs-store-addr">{store.addr}</div>
                        <div className="gs-store-hours">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
                          {store.hours}
                        </div>
                        <div className="gs-store-meta">
                          <span className="gs-tag">{store.area}</span>
                          <span className="gs-tag rate">
                            <span className="rate-star">★</span>
                            {store.rate !== null ? store.rate.toFixed(1) : '暂无'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {filteredStores.length === 0 && (
            <div className="gs-empty">
              {keyword ? '未找到相关门店，换个关键字试试' : '当前筛选下暂无门店'}
            </div>
          )}
        </div>
      </aside>

      {/* 移动端折叠按钮 — 放在面板外避免受 panel stacking context 限制 */}
      <button
        className="gs-mobile-toggle"
        onClick={togglePanel}
        aria-label={panelCollapsed ? '展开面板' : '收起面板'}
      >
        {panelCollapsed ? (
          <>
            <ChevronDown size={14} />
            展开门店列表
          </>
        ) : (
          <>
            <ChevronUp size={14} />
            收起列表
          </>
        )}
      </button>

      {/* 桌面端折叠按钮 — 始终可见，位置随面板折叠联动 */}
      <button
        className="gs-collapse-btn"
        onClick={togglePanel}
        aria-label={panelCollapsed ? '展开面板' : '收起面板'}
        title={panelCollapsed ? '展开面板' : '收起面板'}
      >
        <ChevronLeft className="gs-collapse-btn-icon" size={16} strokeWidth={2.5} />
      </button>

      {/* 地图区域 */}
      <div className="gs-map-wrap">
        <div ref={mapContainerRef} className="gs-map" />
        <div className="gs-map-tip">
          <span className="gs-pulse" />
          <span>{tipText}</span>
        </div>
      </div>
    </div>
  );
}


