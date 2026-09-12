import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { STORES, BRAND_META, BRAND_ORDER, type IStore, type BrandKey } from '@/data/stores';
import { cn } from '@/lib/utils';

type FilterKey = 'all' | BrandKey;

declare global {
  interface Window {
    AMap: any;
  }
}

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
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [keyword, setKeyword] = useState('');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [activeStoreIdx, setActiveStoreIdx] = useState<number | null>(null);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const hasFilter = filter !== 'all' || keyword.trim() !== '';
  const tipSuffix = '家门店 · 点击列表可定位';

  // 构建图钉 HTML
  const buildMarkerHtml = useCallback((s: IStore) => {
    const color = getBrandColor(s.brand);
    return `
      <div class="gs-marker ${getBrandPinClass(s.brand)}">
        <div class="pin" style="--pin-color:${color}">
          <div class="pin-inner"></div>
        </div>
        <div class="gs-label">${s.short}</div>
      </div>
    `;
  }, []);

  // 构建弹窗 HTML
  const buildPopupHtml = useCallback((s: IStore) => {
    const meta = BRAND_META[s.brand];
    const brandCls = s.brand === 'star' ? 'red' : s.brand === 'pure' ? 'blue' : 'gold';
    const navUrl = `https://uri.amap.com/navigation?to=${s.lng},${s.lat},${encodeURIComponent(s.name)}&mode=car&policy=1&src=guose-store-map&coordinate=gaode&callnative=0`;
    return `
      <div class="gs-popup">
        <div class="gs-popup-head">
          <div class="gs-popup-name">${s.name}</div>
          <span class="gs-popup-brand brand-${brandCls}">${meta.label}</span>
        </div>
        <div class="gs-popup-addr">${s.addr}</div>
        <div class="gs-popup-meta">
          <span class="gs-tag">商圈 · ${s.area}</span>
          <span class="gs-tag hours-tag"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>${s.hours}</span>
          <span class="gs-tag rate-tag"><span style="font-size:11px;">★</span>${s.rate !== null ? s.rate.toFixed(1) + ' 分' : '暂无评分'}</span>
        </div>
        <a class="gs-nav-btn" href="${navUrl}" target="_blank" rel="noopener noreferrer">
          <span class="gs-nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
          </span>
          导航到这里
        </a>
      </div>
    `;
  }, []);

  // 清除所有 marker 的 active 态
  const clearAllActive = useCallback(() => {
    markersRef.current.forEach(m => {
      const el = m.getContentElement?.() || m.getDom?.();
      if (el) el.querySelector('.gs-marker')?.classList.remove('active');
    });
  }, []);

  // 高亮指定 marker
  const highlightMarker = useCallback((idx: number) => {
    clearAllActive();
    const marker = markersRef.current[idx];
    if (!marker) return;
    const el = marker.getContentElement?.() || marker.getDom?.();
    if (el) el.querySelector('.gs-marker')?.classList.add('active');
  }, [clearAllActive]);

  // 打开指定门店的弹窗
  const openInfoWindow = useCallback((idx: number) => {
    const map = mapRef.current;
    const marker = markersRef.current[idx];
    const store = STORES[idx];
    if (!map || !marker || !store) return;

    if (!infoWindowRef.current) {
      infoWindowRef.current = new window.AMap.InfoWindow({
        isCustom: true,
        offset: new window.AMap.Pixel(0, -56),
      });
    }

    infoWindowRef.current.setContent(buildPopupHtml(store));
    infoWindowRef.current.open(map, marker.getPosition());
    highlightMarker(idx);
    setActiveStoreIdx(idx);
  }, [buildPopupHtml, highlightMarker]);

  // 初始化地图
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const AMap = window.AMap;
    if (!AMap) {
      setLoadError('高德 JS API 加载失败，请检查网络或 Key 配置');
      return;
    }

    try {
      const vectorLayer = new AMap.TileLayer({
        tileSize: 256,
        mapStyle: 'amap://styles/normal',
        zIndex: 1,
      });

      const map = new AMap.Map(mapContainerRef.current, {
        viewMode: '2D',
        zoom: 11,
        zooms: [3, 20],
        center: [104.070, 30.585],
        resizeEnable: true,
        layers: [vectorLayer],
        features: ['bg', 'road', 'building', 'point'],
      });

      // 比例尺控件
      AMap.Scale && new AMap.Scale({
        position: 'LB',
        offset: [16, 16],
      }).addTo(map);

      // 隐藏高德默认的logo和版权（如果需要）
      // 高德JS API 2.0 中 Logo 默认显示在左下角，按规定保留

      // 创建 Marker
      const markers: any[] = [];
      STORES.forEach((s, idx) => {
        const marker = new AMap.Marker({
          position: [s.lng, s.lat],
          content: buildMarkerHtml(s),
          anchor: 'bottom-center',
          offset: new AMap.Pixel(0, 0),
          zIndex: 100,
        });

        marker.on('click', () => {
          openInfoWindow(idx);
        });

        (marker as any).storeIdx = idx;
        markers.push(marker);
      });

      map.add(markers);

      // 自动适配边界
      const positions = markers.map((m: any) => m.getPosition());
      if (positions.length > 0) {
        map.setFitView(markers, false, [80, 80, 80, 80]);
      }

      // 关闭弹窗时清除 active
      map.on('click', () => {
        infoWindowRef.current?.close();
        clearAllActive();
        setActiveStoreIdx(null);
      });

      mapRef.current = map;
      markersRef.current = markers;
      setMapReady(true);

      return () => {
        map.destroy();
        mapRef.current = null;
        markersRef.current = [];
        infoWindowRef.current = null;
      };
    } catch (e: any) {
      setLoadError(`地图初始化失败：${e?.message || String(e)}`);
    }
  }, [buildMarkerHtml, clearAllActive, openInfoWindow]);

  // 面板折叠时地图重算尺寸
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const timer = setTimeout(() => {
      map.resize();
    }, 310);
    return () => clearTimeout(timer);
  }, [panelCollapsed]);

  // 筛选 / 搜索变化时更新 marker 显示
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
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
      if (show) {
        m.show();
      } else {
        m.hide();
      }
    });
    // 关闭弹窗
    if (infoWindowRef.current && mapRef.current) {
      infoWindowRef.current.close();
    }
    setActiveStoreIdx(null);
  }, [filter, kw, mapReady]);

  // 点击列表项定位到门店
  const handleStoreClick = (store: IStore, idx: number) => {
    const map = mapRef.current;
    const marker = markersRef.current[idx];
    if (!map || !marker) return;

    setActiveStoreIdx(idx);
    highlightMarker(idx);

    const currentZoom = map.getZoom();
    const targetZoom = Math.max(currentZoom, 15);
    map.setZoomAndCenter(targetZoom, [store.lng, store.lat], false, 600);

    // 延迟打开弹窗，等地图动画结束
    setTimeout(() => openInfoWindow(idx), 650);

    // 移动端点击后收起列表
    if (window.innerWidth < 768) {
      setMobileListOpen(false);
    }
  };

  // 切换面板折叠
  const togglePanel = () => {
    setPanelCollapsed(v => !v);
  };

  if (loadError) {
    return (
      <div className="gs-app">
        <div className="gs-map-wrap flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
            <h2 className="text-lg font-bold text-red-600 mb-2">地图加载失败</h2>
            <p className="text-sm text-gray-600">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

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
          padding: 16px 20px 12px;
          background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
          border-bottom: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .gs-brand-row {
          display: flex;
          align-items: center;
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
        .gs-head-collapse-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          background: rgba(255, 255, 255, 0.9);
          color: var(--blue);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          flex: none;
          white-space: nowrap;
        }
        .gs-head-collapse-btn:hover {
          background: #fff;
          color: #0d47a1;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }
        .gs-head-collapse-btn svg {
          transition: transform 0.3s ease;
        }
        .gs-panel.collapsed .gs-head-collapse-btn svg {
          transform: rotate(180deg);
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
          padding: 12px 20px 0;
        }
        .gs-filter-btn {
          flex: 1;
          border: 1px solid var(--line);
          background: var(--card);
          border-radius: 10px;
          padding: 7px 0;
          height: 34px;
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
          padding: 12px 20px;
          font-size: 11.5px;
          color: var(--ink-2);
          border-bottom: 1px solid var(--line);
          align-items: center;
          flex-wrap: wrap;
          margin-top: 12px;
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
          padding: 12px 12px 16px;
        }
        .gs-list-wrap::-webkit-scrollbar { width: 6px; }
        .gs-list-wrap::-webkit-scrollbar-thumb {
          background: #cfd8dc;
          border-radius: 3px;
          transition: background 0.2s;
        }
        .gs-list-wrap::-webkit-scrollbar-thumb:hover { background: #90caf9; }
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
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px 20px;
          text-align: center;
        }
        .gs-empty-icon {
          width: 48px;
          height: 48px;
          color: var(--ink-3);
          opacity: 0.6;
        }
        .gs-empty-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          margin: 0;
        }
        .gs-empty-desc {
          font-size: 12px;
          color: var(--ink-3);
          line-height: 1.5;
          margin: 0;
        }
        .gs-empty-btn {
          margin-top: 8px;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 600;
          color: var(--blue);
          background: var(--blue-soft);
          border: 1px solid rgba(21, 101, 192, 0.25);
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .gs-empty-btn:hover {
          background: var(--blue);
          color: #fff;
          border-color: var(--blue);
        }

        /* ===== 搜索框 ===== */
        .gs-search-wrap { padding: 12px 20px 0; }
        .gs-search-input {
          position: relative;
          display: flex;
          align-items: center;
          height: 34px;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 10px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .gs-search-input:focus-within {
          border-color: var(--blue);
          box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.15);
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
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border: none;
          border-radius: 50%;
          background: var(--paper);
          color: var(--ink-3);
          cursor: pointer;
          transition: all 0.15s;
          padding: 0;
        }
        .gs-search-clear:hover {
          background: var(--muted);
          color: var(--ink);
        }

        /* ===== 折叠按钮（桌面端）—— 已移入标题栏，此为地图区悬浮展开按钮 ===== */
        .gs-collapse-btn {
          display: none;
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
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(10px);
          padding: 7px 16px;
          border-radius: 20px;
          font-size: 12px;
          color: var(--ink-2);
          font-weight: 500;
          z-index: 500;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--line);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s;
        }
        .gs-map-tip .tip-count {
          color: var(--blue);
          font-weight: 700;
        }
        .gs-map-tip.has-filter {
          background: #e8f1fc;
          border-color: rgba(21, 101, 192, 0.3);
          color: var(--ink);
        }
        .gs-map-tip.has-filter .tip-count {
          color: var(--blue);
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
          transition: transform 0.25s ease;
          pointer-events: auto;
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
          transition: all 0.25s ease;
        }
        .gs-marker.active {
          z-index: 1000 !important;
          transform: translateY(-4px);
        }
        .gs-marker.gs-red .pin { --pin-glow: rgba(229, 57, 53, 0.45); }
        .gs-marker.gs-blue .pin { --pin-glow: rgba(21, 101, 192, 0.45); }
        .gs-marker.gs-gold .pin { --pin-glow: rgba(217, 149, 35, 0.45); }
        .gs-marker.active .pin {
          width: 36px;
          height: 36px;
          box-shadow:
            0 6px 20px rgba(0, 0, 0, 0.4),
            0 0 0 4px rgba(255, 255, 255, 0.9),
            0 0 0 7px var(--pin-glow, rgba(21, 101, 192, 0.4));
          animation: gs-pin-pulse 2s ease-in-out infinite;
        }
        @keyframes gs-pin-pulse {
          0%, 100% { box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.9), 0 0 0 7px var(--pin-glow, rgba(21, 101, 192, 0.4)); }
          50% { box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.95), 0 0 0 12px var(--pin-glow, rgba(21, 101, 192, 0.15)); }
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

        /* ===== InfoWindow 样式 ===== */
        .amap-info-content {
          padding: 0 !important;
          background: transparent !important;
        }
        .amap-info-close {
          display: none;
        }
        .amap-info-sharp {
          display: none;
        }
        .gs-popup {
          padding: 14px 16px;
          font-family: inherit;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
          width: 260px;
          position: relative;
        }
        .gs-popup::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 16px;
          height: 16px;
          background: #fff;
          box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.06);
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
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          color: var(--ink-2);
          background: var(--paper);
          padding: 3px 8px;
          border-radius: 6px;
          line-height: 1.4;
          font-weight: 500;
        }
        .gs-popup-meta .gs-tag.rate-tag {
          color: var(--gold);
          font-weight: 700;
          line-height: 1.4;
        }
        .gs-popup-meta .gs-tag.rate-tag span {
          line-height: 1;
        }
        .gs-popup-meta .gs-tag.hours-tag svg {
          width: 11px;
          height: 11px;
          color: var(--blue);
        }

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
        .gs-nav-btn:visited {
          color: #fff !important;
        }
        .gs-nav-btn:hover {
          background: #0d47a1 !important;
          color: #fff !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(21, 101, 192, 0.45);
        }
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
            background: var(--blue);
            color: #fff;
            border: none;
            border-radius: 0 0 14px 14px;
            padding: 7px 20px 9px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 3px 10px rgba(21, 101, 192, 0.35);
            transition: all 0.3s ease;
            white-space: nowrap;
          }
          .gs-mobile-toggle::before {
            content: '';
            position: absolute;
            top: 3px;
            left: 50%;
            transform: translateX(-50%);
            width: 32px;
            height: 3px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.5);
          }
          .gs-mobile-toggle:hover {
            background: #0d47a1;
          }
          .gs-panel.collapsed ~ .gs-mobile-toggle {
            top: 52px;
            background: var(--card);
            color: var(--ink-2);
            border: 1px solid var(--line);
            border-top: none;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
            padding-top: 8px;
          }
          .gs-panel.collapsed ~ .gs-mobile-toggle::before {
            background: var(--blue);
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 className="gs-title">国色洗染 · 成都门店分布</h1>
              <div className="gs-sub">Chengdu Store Locator</div>
            </div>
            <button
              type="button"
              className="gs-head-collapse-btn"
              onClick={togglePanel}
              aria-label={panelCollapsed ? '展开面板' : '收起面板'}
              title={panelCollapsed ? '展开面板' : '收起面板'}
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
              <span>{panelCollapsed ? '展开' : '收起'}</span>
            </button>
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
              <svg className="gs-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"/>
                <path d="m21 21-4.3-4.3"/>
                <path d="M8 11h6"/>
              </svg>
              <p className="gs-empty-title">未找到匹配的门店</p>
              <p className="gs-empty-desc">换个关键字或切换品牌试试</p>
              {hasFilter && (
                <button
                  type="button"
                  className="gs-empty-btn"
                  onClick={() => {
                    setFilter('all');
                    setKeyword('');
                  }}
                >
                  清空筛选
                </button>
              )}
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

      {/* 地图区域 */}
      <div className="gs-map-wrap">
        <div ref={mapContainerRef} className="gs-map" />
        <div className={cn('gs-map-tip', hasFilter && 'has-filter')}>
          <span className="gs-pulse" />
          <span>{hasFilter ? '筛选结果：' : '共 '}<span className="tip-count">{hasFilter ? filteredStores.length : stats.total}</span> {tipSuffix}</span>
        </div>
      </div>
    </div>
  );
}
