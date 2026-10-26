import type { AppLanguage } from './dictionary';

type Labels = Record<string, string>;

const CAMERA_RIG_ZH: Labels = {
  Tripod: '三脚架（固定机位）',
  'Broadcast Pedestal': '广播级升降台（演播室/转播）',
  'Dana Dolly': '轨道滑车 / Dana Dolly',
  Slider: '摄影滑轨',
  Steadicam: '斯坦尼康 / 穿戴式稳定器',
  Handheld: '手持 / 肩扛支架',
  Gimbal: '电动三轴稳定器（如影）',
  'Jib / Crane': '小摇臂 / 大摇臂',
  TechnoCrane: '伸缩摇臂（TechnoCrane）',
  'Car Mount': '车载吸盘 / 侧挂支架',
  Drone: '航拍无人机',
  'Cable Cam': '索道摄影系统',
};

const LIGHT_FIXTURE_ZH: Labels = {
  fresnel: '菲涅尔聚光灯',
  softbox: '柔光箱 / 球形柔光罩',
  tube_light: '灯管 / 像素灯管',
  led_panel: '柔光 LED 面板灯',
  spotlight: '硬光成像灯 / 椭球聚光灯',
  china_ball: '中国球 / 灯笼柔光罩',
  practical: '实景灯 / 灯泡',
  reflector: '反光板 / 跳光板',
  hmi: 'HMI 日光灯（Joker / PAR）',
  par_can: 'PAR 灯（光束投射灯）',
  kino_flo: 'Kino Flo 荧光灯板',
  flag_solid: 'C 型灯架黑旗（负补光）',
  flag_silk: 'C 型灯架柔光旗',
  flag_net: 'C 型灯架网旗（减光 1/2–1 挡）',
  flag_cutter: 'C 型灯架切光旗',
  flag_cucoloris: '影纹板 / Cookie（斑驳阴影）',
  flag_branchaloris: '树枝影纹架',
  flag_shutter: '遮扉 / 切光片',
  c_stand_flag: 'C 型灯架 + 40 英寸支臂',
  tripod: '重型三脚灯架（Baby / Combo）',
  overhead_diffusion: '8×8 英尺顶置柔光框',
};

const PROP_ZH: Labels = {
  sofa: '三人沙发', sofa_sectional: 'L 形组合沙发', armchair: '扶手椅 / 躺椅',
  table_coffee: '茶几', tv: '电视与媒体柜', bookshelf: '书架 / 储物架', plant: '盆栽 / 景观树',
  dining_set: '餐桌 + 4 把椅子', table_rect: '长方形桌', table_round: '圆餐桌 + 4 把椅子',
  chair: '餐椅', desk: '办公桌', bar_counter: '吧台', bar_stool: '吧凳',
  bed_king: '特大号床', bed: '双人床 / 大床', nightstand: '床头柜', wardrobe: '衣柜',
  sound_boom: '挑杆录音师', c_stand: 'C 型灯架 + 40 英寸支臂', tripod: '通用重型三脚架',
  director_chair: '导演折叠椅', apple_box: '苹果箱（全箱/半箱）', camera_cart: '摄影器材车', green_screen: '绿幕 / 无缝背景',
  car: '四门轿车', vehicle_suv: 'SUV / 越野车', vehicle_truck: '制片器材卡车', vehicle_police: '警用巡逻车',
  stage: '演唱会舞台', stage_riser: '舞台升高台', stage_runway: '延伸台 / T 台', stage_truss: '灯光桁架塔',
  drum_kit: '鼓台 + 全套架子鼓', keyboard_rig: '键盘 / 合成器台', amp_stack: '吉他音箱堆栈',
  speaker_stack: 'PA 扬声器堆栈', speaker_array: '线阵列扬声器吊挂', sub_stack: '超低音扬声器堆栈',
  monitor_wedge: '地面返听音箱', foh_console: '前场调音台位', monitor_console: '返听调音台位', mic_stand: '麦克风架',
  barricade: '观众隔离栏', video_wall: 'LED 视频墙 / 屏幕', broadcast_truck: '电视转播车', broadcast_van: 'ENG 新闻采访车',
  sat_truck: '卫星上行转播车', gun: '手枪', rifle: '战术步枪 / 霰弹枪', bomb: '定时炸弹 / C4 炸药',
  letter: '密封信件 / 信封', tree: '景观树 / 植被', stairs: '楼梯段', toilet: '坐便器 / 卫生间', sink: '洗手盆 / 水槽',
  bathtub: '浴缸', shower: '淋浴盘 / 淋浴间', kitchen_counter: '厨房操作台', kitchen_island: '厨房中岛', fridge: '冰箱',
  stove: '灶台 / 炉具', column: '结构柱', railing: '栏杆 / 扶手', radiator: '暖气片', fireplace: '壁炉 / 炉台',
  box: '通用箱体 / 方块', circle: '通用圆柱 / 圆形',
};

const CATEGORY_ZH: Labels = {
  Living: '客厅', 'Dining & Office': '餐厅与办公室', Bedroom: '卧室', 'Studio & Stage': '摄影棚与场务',
  'Concert & Stage': '演出与舞台', 'Broadcast & Production': '转播与制作', Vehicles: '车辆',
  'Weapons & Explosives': '武器与爆炸物', 'Documents & Hand Props': '文件与手持道具', Architecture: '建筑与固定装置',
  Landscape: '景观', Generic: '通用',
};

const SHOT_SIZE_ZH: Labels = {
  EWS: '大远景', WS: '全景', FS: '全身景', MLS: '中全景', MS: '中景', MCU: '中近景', CU: '近景', BCU: '大近景', ECU: '特写',
  'Extreme Wide Shot': '大远景', 'Wide Shot': '全景', 'Full Shot': '全身景', 'Medium Long Shot': '中全景',
  'Medium Shot': '中景', 'Medium Close-Up': '中近景', 'Close-Up': '近景', 'Big Close-Up': '大近景', 'Extreme Close-Up': '特写',
};

const MOVEMENT_ZH: Labels = {
  Static: '固定', Pan: '摇镜', Tilt: '俯仰', Dolly: '推拉轨道', Truck: '横移', Pedestal: '升降', Zoom: '变焦',
  Tracking: '跟拍', Handheld: '手持', Steadicam: '斯坦尼康', Crane: '摇臂', Drone: '无人机', Arc: '环绕',
};

export const cameraRigLabel = (value: string, englishLabel: string, lang: AppLanguage): string =>
  lang === 'zh' ? CAMERA_RIG_ZH[value] ?? englishLabel : englishLabel;

export const lightFixtureLabel = (type: string, englishName: string, lang: AppLanguage): string =>
  lang === 'zh' ? LIGHT_FIXTURE_ZH[type] ?? englishName : englishName;

export const propLabel = (type: string, englishName: string, lang: AppLanguage): string =>
  lang === 'zh' ? PROP_ZH[type] ?? englishName : englishName;

export const propCategoryLabel = (category: string, lang: AppLanguage): string =>
  lang === 'zh' ? CATEGORY_ZH[category] ?? category : category;

export const shotSizeLabel = (value: string | undefined, lang: AppLanguage): string =>
  !value || lang !== 'zh' ? value ?? '' : SHOT_SIZE_ZH[value] ?? value;

export const cameraMovementLabel = (value: string | undefined, lang: AppLanguage): string =>
  !value || lang !== 'zh' ? value ?? '' : MOVEMENT_ZH[value] ?? value;

export const storyboardSlotLabel = (label: string, lang: AppLanguage): string => {
  if (lang !== 'zh') return label;
  if (/^start$/i.test(label)) return '起始';
  if (/^end$/i.test(label)) return '结束';
  const match = label.match(/^(?:waypoint|beat)\s*(\d+)$/i);
  return match ? `节点 ${match[1]}` : label;
};

/** Translate only untouched generated/demo copy. User-authored project text stays verbatim. */
export const generatedProjectTextLabel = (value: string | undefined, lang: AppLanguage): string => {
  if (!value || lang !== 'zh') return value ?? '';
  const exact: Labels = {
    'Subject in frame': '人物位于画面中',
  };
  if (exact[value]) return exact[value];
  const shot = value.match(/^Shot\s+(.+)$/i);
  if (shot) return `镜头 ${shot[1]}`;
  const actor = value.match(/^Actor\s+(.+)$/i);
  if (actor) return `人物 ${actor[1]}`;
  const camera = value.match(/^Camera\s+(.+)$/i);
  if (camera) return `摄影机 ${camera[1]}`;
  const mediumOnActor = value.match(/^Medium shot on Actor\s+(.+)$/i);
  if (mediumOnActor) return `人物 ${mediumOnActor[1]} 的中景镜头`;
  return value;
};
