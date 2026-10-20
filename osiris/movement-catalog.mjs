import {isReadyLifeClip} from './cat-brain.mjs';

export const MOVEMENT_GROUPS = Object.freeze([
  {id:'expression',label:'Мимика'},
  {id:'play',label:'Игры'},
  {id:'daily',label:'Кошачьи привычки'},
  {id:'manual',label:'По команде'},
].map(Object.freeze));

// Descriptions name observed actions, not the choreography requested for a future take.
// Each entry is one source movement. A technical matte variant is not another skill.
const DEFINITIONS = [
  ['blink','Сонно моргает','expression','auto','Сидит, медленно прикрывает глаза и снова смотрит перед собой.',''],
  ['yawn','Зевает','expression','auto','Открывает пасть в зевке, закрывает её и успокаивается.',''],
  ['listen','Прислушивается','expression','auto','Реагирует ушами и взглядом на звук.',''],
  ['nose-lick','Облизывает нос','expression','auto','Коротко облизывает нос и возвращает спокойное выражение.',''],
  ['groom','Моет лапу','expression','auto','Поднимает переднюю лапу, облизывает её и умывается.',''],
  ['yarn','Играет с клубком','play','auto','Следит за клубком и играет с ним кошачьими лапами.','Игрушка — часть этого ролика.'],
  ['mouse','Ловит игрушечную мышку','play','auto','Замечает мышку, подкрадывается и бросается к игрушке.',''],
  ['feather','Ловит перо','play','auto','Следит за пером и тянется к нему лапами.',''],
  ['tail','Играет со своим хвостом','play','auto','Следит за хвостом и пытается его поймать.',''],
  ['paper','Играет с бумажкой','play','auto','Заинтересовывается бумажным комочком и играет с ним.',''],
  ['side-hop','Игриво подпрыгивает','play','auto','Готовится, делает подскок вперёд-вправо и приземляется.','Это игровой прыжок; резкий боковой отскок от испуга ещё требует нового дубля. После посадки хвост местами угловат.'],
  ['lying-toy','Играет лёжа','play','auto','Возится с игрушкой, оставаясь на полу.',''],
  ['sniff','Изучает запахи','daily','auto','Нюхает пол, затем поднимает голову и ловит запах воздуха.','Две позы исходного листа входят в один ролик.'],
  ['stretch','Потягивается','daily','auto','Опускает грудь, вытягивает тело и возвращается в стойку.',''],
  ['knead','Мнёт лапками','daily','auto','По очереди приподнимает и ставит передние лапы.','Разминается на месте; это не походка.'],
  ['scratch','Чешет ухо','daily','auto','Чешет область уха задней лапой и заканчивает движение.','Начало уже с приподнятой задней лапой.'],
  ['shake','Встряхивается','daily','auto','Встаёт, встряхивает голову и шею, затем успокаивается.','Капли — отдельный прозрачный эффект. Полная волна через плечи, корпус и таз пока не подтверждена.'],
  ['body-groom','Лижет плечо','daily','auto','Поворачивает голову к плечу, вылизывается и поднимает голову.',''],
  ['roll','Перекатывается','daily','auto','Из положения на боку переворачивается на спину и обратно.','Начинает уже лёжа; вход из сидения находится в отдельном движении.'],
  ['look-back','Оглядывается','daily','auto','Стоя на месте, смотрит назад через плечо.','Ходьба с резкой остановкой и взглядом назад ещё требует нового дубля.'],
  ['rear-leg-stretch','Вытягивает заднюю лапу','daily','auto','На трёх опорах вытягивает заднюю лапу назад и ставит её на пол.','Лапа уже приподнята в начале; это короткое потягивание стоя.'],
  ['lie-down','Ложится на бок','daily','auto','Из сидения опускается на бок и устраивается на полу.',''],
  ['pleading','Взгляд со шляпой','manual','manual','Прижимает шляпу к груди и смотрит в камеру.','Костюмная сцена запускается по команде.'],
  ['rub','Трётся щекой','manual','manual','Трётся головой о собственную видимую опору.','Опора сохраняется вместе с котом; ролик не означает контакт с произвольной кнопкой.'],
  ['ledge-reach','Проверяет край лапой','manual','manual','Со своей подставки тянется лапой вниз и возвращает её.','Полного спуска на нижний уровень пока нет. Подставка — часть сцены.'],
  ['arched-back','Настороженно выгибает спину','manual','manual','Усиливает дугу спины, затем выпрямляется.','В начале уже немного выгнут, ненадолго открывает рот. Не включается в спокойное автоматическое поведение.'],
  ['jump-panther-short','Пантера · короткий прыжок','manual','manual','Готовится, отталкивается, вытягивается в полёте и приземляется на четыре лапы.','Завершается в низкой стойке. Это отдельный прыжок по команде, без нажатия кнопки и длительной паузы после посадки.'],
  ['cursor','Ловит стрелку и касается лапой','manual','target','Следит за стрелкой, приближается и касается её лапой.','Для кнопок используется тот же ролик с удалённой стрелкой. Контакт происходит на 4,5 с; автоматические клики запрещены.'],
];

export const MOVEMENT_DEFINITIONS = Object.freeze(DEFINITIONS.map(
  ([id,title,group,mode,description,limitation])=>Object.freeze({id,title,group,mode,description,limitation})
));

function readyMedia(clip) {
  return isReadyLifeClip(clip) && clip.visualReview==='sampled-pass' &&
    /^[a-z0-9-]+-packed\.mp4$/i.test(clip.packed||'') &&
    [clip.width,clip.height,clip.fps,clip.duration].every(n=>Number.isFinite(n)&&n>0);
}

export function buildMovementCatalog(metadata) {
  const latest = new Map();
  for (const clip of metadata?.clips||[]) {
    // A rejected replacement must not hide the previous accepted version.
    if (readyMedia(clip)) latest.set(clip.id,clip);
  }
  const labels=new Map(MOVEMENT_GROUPS.map(group=>[group.id,group.label]));
  const clips=MOVEMENT_DEFINITIONS.filter(item=>latest.has(item.id)).map(item=>({
    ...item,groupLabel:labels.get(item.group),media:latest.get(item.id),
    variants:item.id==='cursor'&&latest.has('cursor-button')?
      [{id:'cursor-button',title:'Касание кнопки',media:latest.get('cursor-button')}]:[],
  }));
  const assetCount=clips.reduce((sum,clip)=>sum+1+clip.variants.length,0);
  return {
    clips,assetCount,actionCount:clips.length,
    autoCount:clips.filter(clip=>clip.mode==='auto').length,
    missing:MOVEMENT_DEFINITIONS.filter(item=>!latest.has(item.id)).map(item=>item.id),
  };
}

/** Only installed, accepted ordinary behaviors enter autonomous selection. */
export function behaviorPools(catalog) {
  const automatic=group=>catalog.clips.filter(clip=>clip.group===group&&clip.mode==='auto').map(clip=>clip.id);
  return {
    availablePlay:automatic('play'),
    availableExpressions:automatic('expression'),
    availableDaily:automatic('daily'),
  };
}

export function sceneFromSearch(search,catalog) {
  const id=new URLSearchParams(search).get('scene');
  return catalog.clips.some(clip=>clip.id===id)?id:null;
}
