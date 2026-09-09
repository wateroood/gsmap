// EXPORTS: IStore, BRAND_META, BRAND_ORDER, STORES

export type BrandKey = 'star' | 'pure' | 'lux';

export interface IStore {
  brand: BrandKey;
  name: string;
  short: string;
  lat: number;
  lng: number;
  addr: string;
  area: string;
  hours: string;
  rate: number | null;
}

export const BRAND_META: Record<BrandKey, { label: string; cls: string }> = {
  star: { label: '国色星洗', cls: 'red' },
  pure: { label: '国色净衣馆', cls: 'blue' },
  lux: { label: '国色1678', cls: 'gold' },
};

export const BRAND_ORDER: BrandKey[] = ['star', 'pure', 'lux'];

export const STORES: IStore[] = [
  // ---------- 国色星洗（32 家） ----------
  { brand: 'star', name: '国色星洗(大魔方店)', short: '大魔方店', lat: 30.573975, lng: 104.071775, addr: '科华南路1366号(心岛地铁站出入口步行350米)', area: '交子商圈', hours: '08:30-23:00', rate: 4.2 },
  { brand: 'star', name: '国色星洗(润富国际店)', short: '润富国际店', lat: 30.584765, lng: 104.048608, addr: '锦晖西二街333号', area: '石羊场', hours: '08:30-20:00', rate: 4.3 },
  { brand: 'star', name: '国色星洗(锦城大道店)', short: '锦城大道店', lat: 30.57566, lng: 104.049002, addr: '锦城大道1264号(锦城大道地铁站D口步行160米)', area: '石羊场', hours: '08:30-20:00', rate: 3.9 },
  { brand: 'star', name: '国色星洗(高攀路店)', short: '高攀路店', lat: 30.617522, lng: 104.080547, addr: '飞云三巷38-40号1层', area: '桂溪', hours: '08:30-20:00', rate: 4.4 },
  { brand: 'star', name: '国色星洗(AFC中航国际广场店)', short: '中航国际店', lat: 30.583625, lng: 104.062175, addr: '交子二路中航国际广场C座113号1层', area: '交子商圈', hours: '08:30-20:00', rate: 4.3 },
  { brand: 'star', name: '国色星洗(香月湖店)', short: '香月湖店', lat: 30.553812, lng: 104.059059, addr: '吉庆一路302号润莱·金座', area: '大源', hours: '08:30-20:00', rate: 4.2 },
  { brand: 'star', name: '国色星洗(世豪店)', short: '世豪店', lat: 30.548856, lng: 104.041652, addr: '天府二街1033号3栋1层附103号', area: '天府新区', hours: '08:30-20:00', rate: 4.0 },
  { brand: 'star', name: '国色星洗(锦尚西二路店)', short: '锦尚西二路店', lat: 30.578808, lng: 104.0537, addr: '成汉南路366号中海·城南华府', area: '石羊场', hours: '08:30-20:00', rate: 3.6 },
  { brand: 'star', name: '国色星洗(半岛城邦店)', short: '半岛城邦店', lat: 30.592446, lng: 104.078984, addr: '高新区灌锦东路164号5栋1楼2号', area: '柳江', hours: '08:30-20:00', rate: 3.9 },
  { brand: 'star', name: '国色星洗(晶蓝半岛店)', short: '晶蓝半岛店', lat: 30.642576, lng: 104.095699, addr: '宏济新路485号龙湖·晶蓝半岛B区', area: '牛市口', hours: '08:30-20:00', rate: 4.4 },
  { brand: 'star', name: '国色星洗(益州大道中段店)', short: '益州大道店', lat: 30.558525, lng: 104.056271, addr: '高新区盛安街18号天悦府', area: '大源', hours: '08:30-20:00', rate: 4.0 },
  { brand: 'star', name: '国色星洗(怡心湖店)', short: '怡心湖店', lat: 30.479206, lng: 104.036176, addr: '瑞祥路374号', area: '天府新区', hours: '08:30-20:00', rate: 4.4 },
  { brand: 'star', name: '国色星洗世纪城店', short: '世纪城店', lat: 30.557689, lng: 104.079449, addr: '世纪城路590号', area: '天府新区', hours: '08:30-20:00', rate: 4.2 },
  { brand: 'star', name: '国色星洗(桐梓林壹号店)', short: '桐梓林壹号店', lat: 30.60343, lng: 104.056798, addr: '盛和二路168号桐梓林壹号', area: '桐梓林', hours: '09:00-21:00', rate: 4.0 },
  { brand: 'star', name: '国色星洗(中海锦城店)', short: '中海锦城店', lat: 30.607865, lng: 103.988568, addr: '金履三路8号附13(簇桥地铁站D2口步行130米)', area: '簇桥', hours: '08:30-20:00', rate: 3.9 },
  { brand: 'star', name: '国色星洗(鹭岛店)', short: '鹭岛店', lat: 30.642725, lng: 104.013525, addr: '龙华南路91号', area: '双楠', hours: '08:30-20:00', rate: 4.5 },
  { brand: 'star', name: '国色星洗(西派城店)', short: '西派城店', lat: 30.615814, lng: 103.982159, addr: '来凤三路73号', area: '武侯新城', hours: '08:30-20:00', rate: 4.4 },
  { brand: 'star', name: '国色星洗(西派国樾店)', short: '西派国樾店', lat: 30.49333, lng: 104.01775, addr: '万顺路二段82号', area: '天府新区', hours: '08:30-20:00', rate: 4.1 },
  { brand: 'star', name: '国色星洗(通盈街店)', short: '通盈街店', lat: 30.632011, lng: 104.104561, addr: '通盈街25号(凌云峰阁3号门西北50米)', area: '海椒市', hours: '08:30-20:00', rate: 4.1 },
  { brand: 'star', name: '国色星洗(人居东御佲家店)', short: '东御佲家店', lat: 30.592475, lng: 104.151883, addr: '牡丹街222-224号', area: '成龙路', hours: '08:30-20:00', rate: 4.3 },
  { brand: 'star', name: '国色星洗(麓镇店)', short: '麓镇店', lat: 30.480869, lng: 104.09714, addr: '麓山国际社区帕萨迪纳三组团4-1-4号商业', area: '万安', hours: '08:30-20:00', rate: 4.5 },
  { brand: 'star', name: '国色星洗(洗衣洗鞋奢侈品护理金沙店)', short: '金沙店', lat: 30.681321, lng: 104.007244, addr: '金沙遗址路6号附3号', area: '金沙', hours: '08:30-20:00', rate: 4.4 },
  { brand: 'star', name: '国色星洗(洗衣洗鞋奢侈品护理新希望路店)', short: '新希望路店', lat: 30.612887, lng: 104.071963, addr: '长寿路10号附9号', area: '桐梓林', hours: '08:30-20:00', rate: 4.3 },
  { brand: 'star', name: '国色星洗(洗衣洗鞋奢侈品护理天府一街店)', short: '天府一街店', lat: 30.565631, lng: 104.035877, addr: '天府一街1566号', area: '天府新区', hours: '08:30-20:00', rate: 4.1 },
  { brand: 'star', name: '国色星洗(洗衣洗鞋奢侈品护理锦湖林语店)', short: '锦湖林语店', lat: 30.578829, lng: 104.040872, addr: '石羊场路167号1层商业', area: '石羊场', hours: '08:30-20:00', rate: 4.0 },
  { brand: 'star', name: '国色星洗(置信丽都花园B区店)', short: '置信丽都店', lat: 30.62896, lng: 104.03472, addr: '丽都路4号附24号置信丽都花园B区', area: '肖家河', hours: '08:00-20:00', rate: 3.9 },
  { brand: 'star', name: '国色星洗(天府长城·图南多店)', short: '图南多店', lat: 30.593569, lng: 104.071536, addr: '天顺路222号天府长城·图南多', area: '桂溪', hours: '08:30-20:00', rate: 4.3 },
  { brand: 'star', name: '国色星洗(麓山大道店)', short: '麓山大道店', lat: 30.475925, lng: 104.110125, addr: '启元一街526号', area: '万安', hours: '08:30-20:00', rate: 4.2 },
  { brand: 'star', name: '国色星洗·洗衣洗鞋奢侈品护理(塔子山店)', short: '塔子山店', lat: 30.628308, lng: 104.121273, addr: '二郎山路73号二栋附205号', area: '塔子山公园', hours: '08:30-20:00', rate: 4.3 },
  { brand: 'star', name: '国色星洗(保利·康桥店)', short: '保利康桥店', lat: 30.664336, lng: 104.118732, addr: '保利·康桥东南2门旁(杉板桥地铁站B口旁)', area: '建设路', hours: '08:30-20:00', rate: 4.2 },
  { brand: 'star', name: '国色星洗(三千城店)', short: '三千城店', lat: 30.674133, lng: 104.111759, addr: '建业路159号(踏水桥地铁站B口步行440米)', area: '建设路', hours: '08:30-20:00', rate: 4.3 },
  { brand: 'star', name: '国色星洗(佳乐·澜郡夏宫店)', short: '澜郡夏宫店', lat: 30.786464, lng: 104.156717, addr: '蜀龙大道南段128号', area: '三河', hours: '24小时', rate: 4.0 },
  { brand: 'star', name: '国色星洗(天府未来城店)', short: '天府未来城店', lat: 30.436919, lng: 104.092996, addr: '天府未来城', area: '天府新区', hours: '08:30-20:00', rate: null },

  // ---------- 国色净衣馆（11 家） ----------
  { brand: 'pure', name: '国色净衣馆', short: '紫荆总店', lat: 30.614282, lng: 104.049736, addr: '紫杉路步行街40号', area: '紫荆', hours: '08:30-20:00', rate: 4.0 },
  { brand: 'pure', name: '国色净衣馆(天悦府店)', short: '天悦府店', lat: 30.55853, lng: 104.05675, addr: '益州大道中段464-468号', area: '天府新区', hours: '08:30-20:00', rate: 4.0 },
  { brand: 'pure', name: '国色净衣馆(东苑店)', short: '东苑店', lat: 30.602819, lng: 104.080707, addr: '桂溪街道桂溪路201号', area: '桂溪', hours: '08:30-20:00', rate: 3.9 },
  { brand: 'pure', name: '国色净衣馆(朗基天香店)', short: '朗基天香店', lat: 30.538278, lng: 104.059595, addr: '天府五街600-602号', area: '天府新区', hours: '09:00-20:00', rate: 4.0 },
  { brand: 'pure', name: '国色净衣馆(丽都店)', short: '丽都店', lat: 30.629084, lng: 104.03475, addr: '丽都路4号附9号(科园地铁站A1口步行460米)', area: '肖家河', hours: '08:30-20:00', rate: 4.0 },
  { brand: 'pure', name: '国色净衣馆(东湖店)', short: '东湖店', lat: 30.613332, lng: 104.092744, addr: '华润路90号', area: '东光', hours: '08:30-20:00', rate: 4.3 },
  { brand: 'pure', name: '国色净衣馆(天府二街店)', short: '天府二街店', lat: 30.552797, lng: 104.043844, addr: '天府二街伊藤洋华堂对面雅颂居小区一栋一楼', area: '天府新区', hours: '08:30-20:00', rate: 4.2 },
  { brand: 'pure', name: '国色净衣馆(二十四城店)', short: '二十四城店', lat: 30.644039, lng: 104.120188, addr: '万年场街道双成三路18号附46号', area: '万年场', hours: '08:30-20:00', rate: 4.2 },
  { brand: 'pure', name: '国色净衣馆(浣花溪店)', short: '浣花溪店', lat: 30.653964, lng: 104.032916, addr: '科联街19号附10号', area: '草堂', hours: '08:30-20:00', rate: 4.2 },
  { brand: 'pure', name: '国色净衣馆(攀成钢店)', short: '攀成钢店', lat: 30.637237, lng: 104.117072, addr: '通汇街90-92号', area: '五桂桥', hours: '08:30-20:00', rate: 4.4 },
  { brand: 'pure', name: '国色净衣馆(天府新谷9号楼店)', short: '天府新谷店', lat: 30.585704, lng: 104.055765, addr: '府城大道西段399号天府新谷9栋南侧商业1层2号', area: '石羊场', hours: '08:30-20:00', rate: 4.4 },

  // ---------- 国色1678 高端洗护（4 家） ----------
  { brand: 'lux', name: '国色1678(银泰中心in99店)', short: '银泰中心店', lat: 30.584817, lng: 104.069461, addr: '天府大道北段1199号银泰中心in99-3层315-6A', area: '交子商圈', hours: '10:00-22:00', rate: 3.5 },
  { brand: 'lux', name: '国色1678精洗奢洗皮具护理(麓湖店)', short: '麓湖店', lat: 30.467149, lng: 104.061077, addr: '麓湖北路西段519号麓湖生态城天星月影', area: '天府新区', hours: '09:00-20:00', rate: 4.4 },
  { brand: 'lux', name: '国色1678精洗奢洗皮具护理(沄洲店)', short: '沄洲店', lat: 30.445142, lng: 104.058195, addr: '嘉州路1346号沄洲3栋1层1号', area: '正兴', hours: '09:00-20:00', rate: 4.1 },
  { brand: 'lux', name: '国色1678(麓湖汀院店)', short: '汀院店', lat: 30.455074, lng: 104.058124, addr: '正兴街道嘉州路887号', area: '天府新区', hours: '09:00-20:00', rate: 4.2 },
];
