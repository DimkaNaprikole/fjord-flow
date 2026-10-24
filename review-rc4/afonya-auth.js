/* Visitor email verification. Passwords go only to Firebase Authentication. */
import {readVisitorSession,writeVisitorSession,clearVisitorSession,getRememberPreference,setRememberPreference,getSessionRevision} from './visitor-session.mjs?v=cms-auth-20261023-r3';
export {getRememberPreference,setRememberPreference};
const copy={
  ru:['Подтвердите email для общения с Фьорди','Email','Пароль (не менее 6 символов)','Создать аккаунт','Войти','Мы отправили ссылку. Откройте её в почте, вернитесь сюда и нажмите «Я подтвердил».','Я подтвердил','Отправить ссылку снова','Если аккаунт уже есть, нажмите «Войти».','Почта ещё не подтверждена.','Не удалось подтвердить почту. Попробуйте ещё раз.'],
  en:['Verify your email to talk to Fjordi','Email','Password (at least 6 characters)','Create account','Sign in','We sent a verification link. Open it, then return and choose “I verified”.','I verified','Send the link again','Sign in if you already have an account.','Your email is not verified yet.','Could not confirm the email. Try again.'],
  nb:['Bekreft e-posten for å snakke med Fjordi','E-post','Passord (minst 6 tegn)','Opprett konto','Logg inn','Vi har sendt en bekreftelseslenke. Åpne den, kom tilbake og velg «Jeg har bekreftet».','Jeg har bekreftet','Send lenken på nytt','Logg inn hvis du allerede har en konto.','E-posten er ennå ikke bekreftet.','Kunne ikke bekrefte e-posten. Prøv igjen.'],
  uk:['Підтвердьте пошту, щоб поговорити з Фьорді','Електронна пошта','Пароль (щонайменше 6 символів)','Створити акаунт','Увійти','Ми надіслали посилання для підтвердження. Відкрийте його, поверніться й натисніть «Я підтвердив».','Я підтвердив','Надіслати посилання ще раз','Якщо маєте акаунт, увійдіть.','Пошта ще не підтверджена.','Не вдалося підтвердити пошту. Спробуйте ще раз.'],
  sv:['Bekräfta din e-post för att prata med Fjordi','E-post','Lösenord (minst 6 tecken)','Skapa konto','Logga in','Vi har skickat en verifieringslänk. Öppna den, återvänd och välj ”Jag har verifierat”.','Jag har verifierat','Skicka länken igen','Logga in om du redan har ett konto.','E-postadressen är inte verifierad ännu.','Kunde inte verifiera e-postadressen. Försök igen.'],
  da:['Bekræft din e-mail for at tale med Fjordi','E-mail','Adgangskode (mindst 6 tegn)','Opret konto','Log ind','Vi har sendt et bekræftelseslink. Åbn det, vend tilbage, og vælg »Jeg har bekræftet«.','Jeg har bekræftet','Send linket igen','Log ind, hvis du allerede har en konto.','E-mailen er endnu ikke bekræftet.','Kunne ikke bekræfte e-mailen. Prøv igen.']
};
const make=(tag,cls)=>{const element=document.createElement(tag);if(cls)element.className=cls;return element};
const url=(apiKey,route)=>`https://identitytoolkit.googleapis.com/v1/accounts:${route}?key=${encodeURIComponent(apiKey)}`;
async function call(apiKey,route,body){const response=await fetch(url(apiKey,route),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',cache:'no-store'});const data=await response.json();if(!response.ok)throw Object.assign(new Error(String(data.error?.message||'AUTH_FAILED').slice(0,100)),{status:response.status});return data}
const lookup=(key,token)=>call(key,'lookup',{idToken:token}).then(value=>value.users?.[0]);
const recoveryCopy={
 ru:['Забыли пароль?','Если аккаунт с этой почтой существует, письмо для восстановления отправлено. Проверьте также папку «Спам».','Не удалось отправить письмо. Попробуйте позже.','Неверная почта или пароль. Проверьте данные или нажмите «Забыли пароль?».'],
 en:['Forgot password?','If this email has an account, a recovery email has been sent. Check your spam folder too.','Could not send the email. Please try later.','Incorrect email or password. Check your details or choose “Forgot password?”.'],
 nb:['Glemt passord?','Hvis e-posten har en konto, er en gjenopprettingsmelding sendt. Sjekk også søppelpost.','Kunne ikke sende e-posten. Prøv senere.','Feil e-post eller passord. Sjekk opplysningene eller velg «Glemt passord?».'],
 uk:['Забули пароль?','Якщо для цієї пошти є акаунт, лист для відновлення надіслано. Перевірте також спам.','Не вдалося надіслати лист. Спробуйте пізніше.','Неправильна пошта або пароль. Перевірте дані або натисніть «Забули пароль?».'],
 sv:['Glömt lösenordet?','Om adressen har ett konto har ett återställningsmejl skickats. Kontrollera även skräpposten.','Kunde inte skicka mejlet. Försök senare.','Fel e-post eller lösenord. Kontrollera uppgifterna eller välj ”Glömt lösenordet?”.'],
 da:['Glemt adgangskoden?','Hvis adressen har en konto, er en gendannelsesmail sendt. Tjek også spam.','Kunne ikke sende mailen. Prøv senere.','Forkert e-mail eller adgangskode. Kontrollér oplysningerne eller vælg »Glemt adgangskoden?«.']
};
export async function requestPasswordReset(apiKey,email){return call(apiKey,'sendOobCode',{requestType:'PASSWORD_RESET',email:email.trim()})}
const rememberCopy={
 ru:['Запомнить меня в этом браузере на 30 дней','На общем компьютере оставьте галочку выключенной. «Выйти» удалит сохранённый вход.','Браузер не разрешает сохранить вход. Снимите галочку или разрешите хранение данных сайта.'],
 nb:['Husk meg i denne nettleseren i 30 dager','La feltet stå tomt på en delt datamaskin. «Logg ut» fjerner den lagrede innloggingen.','Nettleseren kan ikke lagre innloggingen. Fjern avkrysningen eller tillat lagring for nettstedet.'],
 en:['Remember me in this browser for 30 days','Leave this unchecked on a shared computer. Signing out removes the saved sign-in.','This browser cannot save the sign-in. Uncheck this option or allow site storage.'],
 uk:['Запам’ятати мене в цьому браузері на 30 днів','На спільному комп’ютері залиште прапорець вимкненим. Вихід видалить збережений вхід.','Браузер не дозволяє зберегти вхід. Зніміть прапорець або дозвольте зберігання даних сайту.'],
 sv:['Kom ihåg mig i den här webbläsaren i 30 dagar','Lämna rutan tom på en delad dator. Utloggning tar bort den sparade inloggningen.','Webbläsaren kan inte spara inloggningen. Avmarkera rutan eller tillåt webbplatslagring.'],
 da:['Husk mig i denne browser i 30 dage','Lad feltet være tomt på en delt computer. Log ud fjerner det gemte login.','Browseren kan ikke gemme login. Fjern markeringen eller tillad lagring for webstedet.']
};
const modeCopy={
 ru:['Войти в Fjord Flow','Создать аккаунт Fjord Flow','Войдите с почтой и паролем.','Укажите почту и придумайте пароль. Затем подтвердите почту по ссылке из письма.','Вход','Регистрация','Способ входа'],
 en:['Sign in to Fjord Flow','Create your Fjord Flow account','Sign in with your email and password.','Enter your email and choose a password. Then verify your email using the link we send.','Sign in','Register','Account access'],
 nb:['Logg inn på Fjord Flow','Opprett Fjord Flow-konto','Logg inn med e-post og passord.','Oppgi e-post og velg et passord. Bekreft deretter e-posten med lenken vi sender.','Logg inn','Opprett konto','Kontotilgang'],
 uk:['Увійти до Fjord Flow','Створити акаунт Fjord Flow','Увійдіть за допомогою пошти й пароля.','Вкажіть пошту та створіть пароль. Потім підтвердьте пошту за посиланням із листа.','Вхід','Реєстрація','Доступ до акаунта'],
 sv:['Logga in på Fjord Flow','Skapa ditt Fjord Flow-konto','Logga in med e-post och lösenord.','Ange din e-post och välj ett lösenord. Bekräfta sedan adressen med länken vi skickar.','Logga in','Skapa konto','Kontoåtkomst'],
 da:['Log ind på Fjord Flow','Opret din Fjord Flow-konto','Log ind med e-mail og adgangskode.','Angiv din e-mail og vælg en adgangskode. Bekræft derefter adressen med det link, vi sender.','Log ind','Opret konto','Kontoadgang']};
export function getStoredVisitor(){const visitor=readVisitorSession();return visitor?.emailVerified===true?visitor:null}
// The classic chat script needs a synchronous identity reader for immediate
// account-switch cleanup. Access decisions still use server-verified tokens.
if(typeof window!=='undefined')window.FjordVisitorAuth=Object.freeze({getStoredVisitor});
function markVerified(result){const saved=readVisitorSession();if(!saved||saved.email!==result.email||saved.idToken!==result.idToken)throw Error('STALE_SESSION');return saved.emailVerified===true?saved:writeVisitorSession({...saved,...result,emailVerified:true});}
let socialSDK;
async function loadSocialSDK(apiKey){if(!socialSDK)socialSDK=Promise.all([import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js')]).then(async([app,sdk])=>{const instance=app.getApps().find(a=>a.name==='fjord-flow-social')||app.initializeApp({apiKey,authDomain:'fjord-flow-afonya.firebaseapp.com',projectId:'fjord-flow-afonya'},'fjord-flow-social');const auth=sdk.getAuth(instance);await sdk.setPersistence(auth,sdk.inMemoryPersistence);return {sdk,auth}}).catch(error=>{socialSDK=null;throw error});return socialSDK;}
export async function signOutVisitor(){clearVisitorSession();if(socialSDK){try{const {sdk,auth}=await socialSDK;await sdk.signOut(auth)}catch{}}}
export async function saveSocialVisitor(apiKey,user,options={}){const revision=options.expectedRevision??getSessionRevision(),idToken=await user.getIdToken(),profile=await lookup(apiKey,idToken);if(options.isActive&&!options.isActive())throw Error('STALE_SESSION');if(!profile?.email||profile.disabled||profile.localId!==user.uid)throw Error('SOCIAL_EMAIL_REQUIRED');return writeVisitorSession({idToken,email:profile.email,refreshToken:user.refreshToken,expiresAt:Date.now()+3500000,emailVerified:profile.emailVerified===true},{...options,newSignIn:true,expectedRevision:revision,notify:profile.emailVerified===true});}
const socialCopy={
 ru:['Продолжить с Google','Продолжить с Facebook','или по почте','Окно входа заблокировано. Разрешите всплывающее окно и нажмите ещё раз.','Вход отменён.','Для этой почты уже есть аккаунт. Войдите прежним способом; автоматически объединять аккаунты нельзя.','Для входа нужна доступная почта. Используйте вход по email.','Не удалось выполнить вход. Попробуйте ещё раз или войдите по почте.'],
 en:['Continue with Google','Continue with Facebook','or with email','The sign-in window was blocked. Allow pop-ups and try again.','Sign-in cancelled.','This email already has an account. Use your original sign-in method; accounts are not linked automatically.','An email address is required. Please use email sign-in.','Could not sign in. Try again or use email.'],
 nb:['Fortsett med Google','Fortsett med Facebook','eller med e-post','Innloggingsvinduet ble blokkert. Tillat popup-vinduer og prøv igjen.','Innlogging avbrutt.','Denne e-posten har allerede en konto. Bruk den opprinnelige innloggingen; kontoer kobles ikke automatisk.','Du må ha en e-postadresse. Bruk e-postinnlogging.','Kunne ikke logge inn. Prøv igjen eller bruk e-post.'],
 uk:['Продовжити з Google','Продовжити з Facebook','або через пошту','Вікно входу заблоковано. Дозвольте спливні вікна та спробуйте ще раз.','Вхід скасовано.','Для цієї пошти вже є акаунт. Увійдіть попереднім способом; автоматично акаунти не об’єднуються.','Потрібна адреса пошти. Скористайтеся входом через email.','Не вдалося увійти. Спробуйте ще раз або через пошту.'],
 sv:['Fortsätt med Google','Fortsätt med Facebook','eller med e-post','Inloggningsfönstret blockerades. Tillåt popup-fönster och försök igen.','Inloggningen avbröts.','E-posten har redan ett konto. Använd den ursprungliga inloggningen; konton kopplas inte automatiskt.','En e-postadress krävs. Använd e-postinloggning.','Kunde inte logga in. Försök igen eller använd e-post.'],
 da:['Fortsæt med Google','Fortsæt med Facebook','eller med e-mail','Loginvinduet blev blokeret. Tillad pop op-vinduer og prøv igen.','Login afbrudt.','E-mailen har allerede en konto. Brug den oprindelige loginmetode; konti sammenkædes ikke automatisk.','En e-mailadresse er påkrævet. Brug e-mail-login.','Kunne ikke logge ind. Prøv igen eller brug e-mail.']};
const publicLoginCopy={"ru":["Для входа через Google откройте опубликованный Fjord Flow. Этот локальный адрес не разрешён для Google-входа.","Открыть Fjord Flow ↗"],"uk":["Для входу через Google відкрийте опублікований Fjord Flow. Цю локальну адресу не дозволено для входу через Google.","Відкрити Fjord Flow ↗"],"en":["Open the published Fjord Flow to sign in with Google. This local address is not authorized for Google sign-in.","Open Fjord Flow ↗"],"nb":["Åpne den publiserte Fjord Flow-siden for å logge inn med Google. Denne lokale adressen er ikke godkjent for Google-innlogging.","Åpne Fjord Flow ↗"],"sv":["Öppna den publicerade Fjord Flow-sidan för att logga in med Google. Den lokala adressen är inte godkänd för Google-inloggning.","Öppna Fjord Flow ↗"],"da":["Åbn den publicerede Fjord Flow-side for at logge ind med Google. Den lokale adresse er ikke godkendt til Google-login.","Åbn Fjord Flow ↗"]};
export function socialErrorIndex(code){return code==='auth/popup-blocked'?3:/popup-closed-by-user|cancelled-popup-request/.test(code)?4:code==='auth/account-exists-with-different-credential'?5:code==='SOCIAL_EMAIL_REQUIRED'?6:7;}
let refreshing;
const invalidSession=error=>(error?.status===400||error?.status===401||error?.status===403)&&/^(TOKEN_EXPIRED|INVALID_ID_TOKEN|USER_DISABLED|USER_NOT_FOUND|EMAIL_NOT_FOUND)$/.test(error.message);
export async function getVisitorToken(apiKey){
  const saved=readVisitorSession();if(!saved?.idToken)return '';
  if(saved.expiresAt>Date.now()+60000)return saved.idToken;
  if(!saved.refreshToken)return '';
  const revision=getSessionRevision();
  if(refreshing?.revision===revision&&refreshing.refreshToken===saved.refreshToken)return refreshing.promise;
  const current=()=>getSessionRevision()===revision&&readVisitorSession()?.refreshToken===saved.refreshToken;
  const operation={revision,refreshToken:saved.refreshToken,promise:null};
  operation.promise=(async()=>{
    const res=await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(apiKey),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:saved.refreshToken}),credentials:'omit',cache:'no-store'});
    const value=await res.json();if(!current())return '';
    if(!res.ok){
      if((res.status===400||res.status===401)&&/^(TOKEN_EXPIRED|INVALID_REFRESH_TOKEN|USER_DISABLED|USER_NOT_FOUND|INVALID_GRANT)$/.test(String(value.error?.message||''))){clearVisitorSession();return '';}
      throw Error('AUTH_TEMPORARILY_UNAVAILABLE');
    }
    const seconds=Number(value.expires_in);if(!value.id_token||!value.refresh_token||!Number.isFinite(seconds)||seconds<=0)throw Error('AUTH_TEMPORARILY_UNAVAILABLE');
    const next=writeVisitorSession({...saved,idToken:value.id_token,refreshToken:value.refresh_token,expiresAt:Date.now()+seconds*1000},{expectedRevision:revision,notify:false});return next.idToken;
  })().finally(()=>{if(refreshing===operation)refreshing=null});
  refreshing=operation;return operation.promise;
}
export async function getVisitorSignInMethods(apiKey){
 const token=await getVisitorToken(apiKey),visitor=getStoredVisitor(),revision=getSessionRevision();
 if(!token||!visitor)throw Error('AUTH_REQUIRED');
 const profile=await lookup(apiKey,token);
 if(revision!==getSessionRevision()||getStoredVisitor()?.idToken!==token)throw Error('STALE_SESSION');
 if(!profile?.emailVerified||profile.disabled||profile.email!==visitor.email)throw Error('AUTH_REQUIRED');
 return [...new Set((profile.providerUserInfo||[]).map(p=>p.providerId).filter(p=>typeof p==='string'))];
}
const authFlows=new WeakMap();
export function ensureVerified(dialog,apiKey,language='en',options={}){
  const existing=authFlows.get(dialog);if(existing)return existing.promise;
  const flow={cancelled:false,promise:null};
  const onClose=()=>{flow.cancelled=true;if(authFlows.get(dialog)===flow)authFlows.delete(dialog)};
  dialog.addEventListener('close',onClose);
  flow.promise=runVerification(dialog,apiKey,language,()=>!flow.cancelled&&dialog.open,options).finally(()=>{dialog.removeEventListener('close',onClose);if(authFlows.get(dialog)===flow)authFlows.delete(dialog)});
  authFlows.set(dialog,flow);return flow.promise;
}
async function runVerification(dialog,apiKey,language,isActive,options){
  const w=copy[language]||copy.en;
  const freshToken=await getVisitorToken(apiKey);let previous=freshToken?readVisitorSession():null;
  if(previous?.idToken&&previous?.email){const revision=getSessionRevision();try{const profile=await lookup(apiKey,previous.idToken);if(!isActive()||revision!==getSessionRevision())return null;if(profile?.emailVerified&&!profile.disabled&&profile.email===previous.email)return markVerified(previous);if(!profile||profile.disabled||profile.email!==previous.email){clearVisitorSession();previous=null;}}catch(error){if(revision!==getSessionRevision())return null;if(invalidSession(error)){clearVisitorSession();previous=null;}else throw error;}}
  if(!isActive())return null;
  return new Promise(resolve=>{
    const gate=make('section','fjord-ai-auth'),heading=make('h3'),form=make('form'),email=make('input'),password=make('input'),buttons=make('div','fjord-ai-auth-buttons'),create=make('button'),signIn=make('button'),verified=make('button'),resend=make('button'),message=make('p');
    const m=modeCopy[language]||modeCopy.en;let mode=options.mode==='register'?'register':'login',authBusy=false;
    const modes=make('div','fjord-auth-modes'),loginMode=make('button'),registerMode=make('button'),intro=make('p','fjord-auth-intro');modes.setAttribute('role','group');modes.setAttribute('aria-label',m[6]);loginMode.type=registerMode.type='button';loginMode.textContent=m[4];registerMode.textContent=m[5];modes.append(loginMode,registerMode);
    email.type='email';email.required=true;email.autocomplete='email';email.placeholder=w[1];email.setAttribute('aria-label',w[1]);password.type='password';password.required=true;password.minLength=6;password.placeholder=w[2];password.setAttribute('aria-label',w[2]);const emailLabel=make('label','fjord-auth-field'),passwordLabel=make('label','fjord-auth-field'),emailText=make('span'),passwordText=make('span');emailText.textContent=w[1];passwordText.textContent=w[2];emailLabel.append(emailText,email);passwordLabel.append(passwordText,password);
    const rememberWords=rememberCopy[language]||rememberCopy.en,rememberLabel=make('label','fjord-auth-remember'),remember=make('input'),rememberText=make('span'),rememberNote=make('p','fjord-auth-remember-note');remember.type='checkbox';remember.checked=getRememberPreference();rememberText.textContent=rememberWords[0];rememberNote.textContent=rememberWords[1];rememberLabel.append(remember,rememberText);
    create.type=signIn.type=verified.type=resend.type='button';create.textContent=w[3];signIn.textContent=w[4];verified.textContent=w[6];resend.textContent=w[7];verified.hidden=resend.hidden=true;message.setAttribute('role','status');buttons.append(create,signIn,verified,resend);form.append(emailLabel,passwordLabel,rememberLabel,rememberNote,buttons,message);gate.append(heading,modes,intro,form);dialog.insertBefore(gate,dialog.querySelector('.fjord-ai-portrait'));dialog.classList.add('fjord-ai-auth-pending');
    const recovery=recoveryCopy[language]||recoveryCopy.en,forgot=make('button');forgot.type='button';forgot.textContent=recovery[0];forgot.className='fjord-ai-forgot';buttons.append(forgot);
    function setMode(next){if(authBusy)return;mode=next==='register'?'register':'login';const register=mode==='register';heading.textContent=options.heading||m[register?1:0];intro.textContent=m[register?3:2];create.hidden=!register;signIn.hidden=register;create.type=register?'submit':'button';signIn.type=register?'button':'submit';forgot.hidden=register;password.autocomplete=register?'new-password':'current-password';loginMode.setAttribute('aria-pressed',String(!register));registerMode.setAttribute('aria-pressed',String(register));}
    loginMode.onclick=()=>{password.value='';setMode('login')};registerMode.onclick=()=>{password.value='';setMode('register')};setMode(mode);
    forgot.onclick=async()=>{if(!email.reportValidity())return;forgot.disabled=true;message.textContent='…';try{await requestPasswordReset(apiKey,email.value);message.textContent=recovery[1]}catch{message.textContent=recovery[2]}finally{forgot.disabled=false}};
    let token=previous?.idToken||'',address=previous?.email||'';if(address)email.value=address;
    if(token){verified.hidden=resend.hidden=false;message.textContent=w[9]}
    const finish=result=>{if(result)markVerified(result);dialog.removeEventListener('close',onClose);gate.remove();dialog.classList.remove('fjord-ai-auth-pending');resolve(result)};
    const onClose=()=>finish(null);dialog.addEventListener('close',onClose);
    const s=socialCopy[language]||socialCopy.en,social=make('div','fjord-social-buttons');
    fetch('./chat-config.json?v=2',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(async config=>{const providers=(config?.signInProviders||[]).filter(x=>x==='google.com'||x==='facebook.com');if(!providers.length||!isActive())return;const controls=providers.map(providerId=>{const button=make('button');button.type='button';button.textContent=s[providerId==='google.com'?0:1];button.disabled=true;social.append(button);button.onclick=async()=>{if(providerId==='google.com'&&typeof location!=='undefined'&&location.hostname==='127.0.0.1'){const text=publicLoginCopy[language]||publicLoginCopy.en;message.textContent=text[0]+' ';const link=make('a');link.href='https://dimkanaprikole.github.io/fjord-flow/';link.textContent=text[1];message.append(link);return;}controls.forEach(b=>b.disabled=true);message.textContent='…';try{const {sdk,auth}=await loadSocialSDK(apiKey);auth.languageCode=language;const provider=providerId==='google.com'?new sdk.GoogleAuthProvider():new sdk.FacebookAuthProvider();if(providerId==='facebook.com')provider.addScope('email');const revision=getSessionRevision(),result=await sdk.signInWithPopup(auth,provider),visitor=await saveSocialVisitor(apiKey,result.user,{remember:remember.checked,expectedRevision:revision,isActive});token=visitor.idToken;address=visitor.email;if(!isActive())return;if(visitor.emailVerified){finish(visitor);return;}email.value=address;await sendVerification();}catch(error){if(isActive())message.textContent=/PERSISTENCE_UNAVAILABLE|SESSION_STORAGE_UNAVAILABLE/.test(error.message)?rememberWords[2]:s[socialErrorIndex(String(error.code||error.message||''))];}finally{controls.forEach(b=>b.disabled=false);}};return button;});gate.insertBefore(social,form);const divider=make('p','fjord-social-divider');divider.textContent=s[2];social.after(divider);try{await loadSocialSDK(apiKey);if(isActive())controls.forEach(b=>b.disabled=false);}catch{message.textContent=s[7];}}).catch(()=>{});
    async function authenticate(route){if(authBusy||!form.reportValidity())return;authBusy=true;const revision=getSessionRevision();create.disabled=signIn.disabled=loginMode.disabled=registerMode.disabled=remember.disabled=true;message.textContent='…';try{const result=await call(apiKey,route,{email:email.value.trim(),password:password.value,returnSecureToken:true});if(!isActive())return;token=result.idToken;address=result.email;writeVisitorSession({idToken:token,email:address,refreshToken:result.refreshToken,expiresAt:Date.now()+Number(result.expiresIn||3600)*1000},{remember:remember.checked,newSignIn:true,expectedRevision:revision,notify:false});password.value='';const profile=await lookup(apiKey,token);if(!isActive())return;if(!profile||profile.disabled||profile.email!==address)throw Error('AUTH_REQUIRED');if(profile.emailVerified){finish({idToken:token,email:address});return}if(route==='signUp')await sendVerification();else{verified.hidden=resend.hidden=false;message.textContent=w[9]}}catch(error){if(isActive())message.textContent=/PERSISTENCE_UNAVAILABLE|SESSION_STORAGE_UNAVAILABLE/.test(error.message)?rememberWords[2]:error.message==='EMAIL_EXISTS'?w[8]:/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(error.message)?recovery[3]:w[10]}finally{authBusy=false;create.disabled=signIn.disabled=loginMode.disabled=registerMode.disabled=remember.disabled=false}}
    async function sendVerification(){if(!token)return;resend.disabled=true;try{await call(apiKey,'sendOobCode',{requestType:'VERIFY_EMAIL',idToken:token});verified.hidden=resend.hidden=false;message.textContent=w[5]}catch{message.textContent=w[10]}finally{resend.disabled=false}}
    create.onclick=()=>void authenticate('signUp');signIn.onclick=()=>void authenticate('signInWithPassword');resend.onclick=()=>void sendVerification();verified.onclick=async()=>{message.textContent='…';try{const profile=await lookup(apiKey,token);if(!isActive())return;if(!profile||profile.disabled||profile.email!==address)throw Error('AUTH_REQUIRED');if(profile.emailVerified){finish({idToken:token,email:address});return}message.textContent=w[9]}catch{message.textContent=w[10]}};
    form.addEventListener('submit',event=>{event.preventDefault();if(!authBusy)void authenticate(mode==='register'?'signUp':'signInWithPassword')});
    email.focus({preventScroll:true});
  })
}


let ownerPasswordBusy=false;
export async function linkCurrentGoogleSitePassword(apiKey,password,confirmation,verifyOwner){
 if(ownerPasswordBusy)throw Error('PASSWORD_CHANGE_BUSY');ownerPasswordBusy=true;
 try{
  const {linkVerifiedGooglePassword}=await import('./owner-password-link.mjs?v=cms-auth-20261023-r3');
  await getVisitorToken(apiKey);const revision=getSessionRevision();
  return await linkVerifiedGooglePassword({password,confirmation,expectedEmail:'laurkent123@gmail.com',getSession:()=>revision===getSessionRevision()?getStoredVisitor():null,lookup:token=>lookup(apiKey,token),verifyOwner,update:body=>call(apiKey,'update',body),save:session=>writeVisitorSession(session,{expectedRevision:revision,notify:true})});
 }finally{ownerPasswordBusy=false;}
}

export const getAuthSessionRevision=()=>getSessionRevision();
