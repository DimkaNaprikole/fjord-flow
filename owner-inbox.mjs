import {ensureVerified,getVisitorToken,signOutVisitor} from './afonya-auth.js?v=7';
const status=document.querySelector('#readerStatus'),login=document.querySelector('#readerLogin'),logout=document.querySelector('#readerLogout'),article=document.querySelector('#readerTicket'),dialog=document.querySelector('#readerAuth');
const ticket=new URL(location.href).searchParams.get('ticket');
let settings;
const errors={401:'Войдите снова: срок авторизации истёк.',403:'Это обращение доступно только аккаунту владельца.',404:'Обращение не найдено или срок хранения закончился.',400:'Некорректная ссылка на обращение.'};
function clear(){article.hidden=true;document.querySelector('#readerFacts').replaceChildren();document.querySelector('#readerMessages').replaceChildren();}
async function config(){if(!settings){const response=await fetch('./chat-config.json',{cache:'no-store'});if(!response.ok)throw Error('config');const data=await response.json(),url=new URL(data.endpoint);if(url.origin!=='https://fjord-flow-chat.laurkent123.workers.dev'||!data.firebaseApiKey)throw Error('config');settings=data;}return settings;}
function render(value){
  const facts=document.querySelector('#readerFacts');
  const date=Number.isSafeInteger(value.created_at)?new Date(value.created_at*1000).toLocaleString('ru-RU',{timeZone:'Europe/Oslo'}):'Не указано';
  for(const [label,text] of [['Имя',value.display_name||'Не указано'],['Email',value.email||'Не указан'],['Получено',date+' (Норвегия)'],['Статус',({queued:'Ожидает ответа',answered:'Ответ подготовлен',service_test:'Тест'})[value.status]||'Сохранено']]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=text;facts.append(dt,dd);}
  const messages=document.querySelector('#readerMessages');
  for(const message of value.messages||[]){if(!['user','assistant'].includes(message.role)||typeof message.content!=='string')continue;const section=document.createElement('section'),role=document.createElement('strong'),text=document.createElement('p');section.className='owner-message';role.textContent=message.role==='user'?'Посетитель':'Помощник сайта';text.textContent=message.content;section.append(role,text);messages.append(section);}
  if(!messages.childElementCount){const p=document.createElement('p');p.textContent='Текст переписки отсутствует.';messages.append(p);}
  document.querySelector('#readerTest').hidden=value.service_test!==true;article.hidden=false;
}
async function open(interactive=false){
  clear();login.disabled=true;status.textContent='Проверяем доступ…';
  try{if(!/^[a-f0-9]{64}$/.test(ticket||'')){status.textContent=errors[400];return;}const data=await config();let token=await getVisitorToken(data.firebaseApiKey);
    if(interactive){dialog.querySelector('.fjord-ai-auth')?.remove();dialog.showModal();const visitor=await ensureVerified(dialog,data.firebaseApiKey,'ru',{mode:'login'});if(!visitor)return;token=visitor.idToken;dialog.close();}
    if(!token){status.textContent='Войдите в аккаунт владельца, чтобы открыть обращение.';return;}
    const response=await fetch(new URL('/owner-request?ticket='+encodeURIComponent(ticket),data.endpoint),{headers:{Authorization:'Bearer '+token},credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
    if(!response.ok){status.textContent=errors[response.status]||'Сервис временно недоступен. Попробуйте позже.';logout.hidden=false;return;}
    const result=await response.json();if(result.ticket?.id!==ticket)throw Error('response');render(result.ticket);status.textContent='Доступ подтверждён. Личное обращение.';logout.hidden=false;login.textContent='Обновить';
  }catch{status.textContent='Не удалось открыть обращение. Проверьте соединение и повторите.';}finally{login.disabled=false;}
}
login.addEventListener('click',()=>void open(true));logout.addEventListener('click',async()=>{await signOutVisitor();clear();logout.hidden=true;login.textContent='Войти и открыть';status.textContent='Вы вышли. Сведения обращения скрыты.';});document.querySelector('#readerAuthClose').addEventListener('click',()=>dialog.close());
void open();
