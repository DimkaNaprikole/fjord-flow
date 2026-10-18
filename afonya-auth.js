/* Visitor email verification for Afonya. Passwords go only to Firebase Authentication. */
const copy={
  ru:['Подтвердите email для общения с Афоней','Email','Пароль (не менее 6 символов)','Создать аккаунт','Войти','Мы отправили ссылку. Откройте её в почте, вернитесь сюда и нажмите «Я подтвердил».','Я подтвердил','Отправить ссылку снова','Если аккаунт уже есть, нажмите «Войти».','Почта ещё не подтверждена.','Не удалось подтвердить почту. Попробуйте ещё раз.'],
  en:['Verify your email to talk to Afonya','Email','Password (at least 6 characters)','Create account','Sign in','We sent a verification link. Open it, then return and choose “I verified”.','I verified','Send the link again','Sign in if you already have an account.','Your email is not verified yet.','Could not confirm the email. Try again.'],
  nb:['Bekreft e-posten for å snakke med Afonja','E-post','Passord (minst 6 tegn)','Opprett konto','Logg inn','Vi har sendt en bekreftelseslenke. Åpne den, kom tilbake og velg «Jeg har bekreftet».','Jeg har bekreftet','Send lenken på nytt','Logg inn hvis du allerede har en konto.','E-posten er ennå ikke bekreftet.','Kunne ikke bekrefte e-posten. Prøv igjen.'],
  uk:['Підтвердьте пошту, щоб поговорити з Афонею','Електронна пошта','Пароль (щонайменше 6 символів)','Створити акаунт','Увійти','Ми надіслали посилання для підтвердження. Відкрийте його, поверніться й натисніть «Я підтвердив».','Я підтвердив','Надіслати посилання ще раз','Якщо маєте акаунт, увійдіть.','Пошта ще не підтверджена.','Не вдалося підтвердити пошту. Спробуйте ще раз.'],
  sv:['Bekräfta din e-post för att prata med Afonja','E-post','Lösenord (minst 6 tecken)','Skapa konto','Logga in','Vi har skickat en verifieringslänk. Öppna den, återvänd och välj ”Jag har verifierat”.','Jag har verifierat','Skicka länken igen','Logga in om du redan har ett konto.','E-postadressen är inte verifierad ännu.','Kunde inte verifiera e-postadressen. Försök igen.'],
  da:['Bekræft din e-mail for at tale med Afonja','E-mail','Adgangskode (mindst 6 tegn)','Opret konto','Log ind','Vi har sendt et bekræftelseslink. Åbn det, vend tilbage, og vælg »Jeg har bekræftet«.','Jeg har bekræftet','Send linket igen','Log ind, hvis du allerede har en konto.','E-mailen er endnu ikke bekræftet.','Kunne ikke bekræfte e-mailen. Prøv igen.']
};
const make=(tag,cls)=>{const element=document.createElement(tag);if(cls)element.className=cls;return element};
const url=(apiKey,route)=>`https://identitytoolkit.googleapis.com/v1/accounts:${route}?key=${encodeURIComponent(apiKey)}`;
async function call(apiKey,route,body){const response=await fetch(url(apiKey,route),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(String(data.error?.message||'AUTH_FAILED').slice(0,100));return data}
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
const cacheKey='fjord-afonya-visitor';
export async function getVisitorToken(apiKey){
  let saved;try{saved=JSON.parse(sessionStorage.getItem(cacheKey)||'null')}catch{}
  if(!saved?.idToken)return '';
  if(saved.refreshToken&&(!saved.expiresAt||saved.expiresAt<Date.now()+60000)){
    const res=await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(apiKey),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:saved.refreshToken}),credentials:'omit',cache:'no-store'});
    if(!res.ok){sessionStorage.removeItem(cacheKey);return ''}
    const value=await res.json();saved={...saved,idToken:value.id_token,refreshToken:value.refresh_token,expiresAt:Date.now()+Number(value.expires_in)*1000};sessionStorage.setItem(cacheKey,JSON.stringify(saved));
  }
  return saved.idToken;
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
  let previous=null;try{await getVisitorToken(apiKey);previous=JSON.parse(sessionStorage.getItem(cacheKey)||'null')}catch{}
  if(previous?.idToken&&previous?.email){try{const profile=await lookup(apiKey,previous.idToken);if(profile?.emailVerified&&profile.email===previous.email)return previous}catch{sessionStorage.removeItem(cacheKey)}}
  if(!isActive())return null;
  return new Promise(resolve=>{
    const gate=make('section','fjord-ai-auth'),heading=make('h3'),form=make('form'),email=make('input'),password=make('input'),buttons=make('div','fjord-ai-auth-buttons'),create=make('button'),signIn=make('button'),verified=make('button'),resend=make('button'),message=make('p');
    heading.textContent=options.heading||w[0];email.type='email';email.required=true;email.autocomplete='email';email.placeholder=w[1];password.type='password';password.required=true;password.minLength=6;password.autocomplete='current-password';password.placeholder=w[2];create.type=signIn.type=verified.type=resend.type='button';create.textContent=w[3];signIn.textContent=w[4];verified.textContent=w[6];resend.textContent=w[7];verified.hidden=resend.hidden=true;message.setAttribute('role','status');message.textContent=w[8];buttons.append(create,signIn,verified,resend);form.append(email,password,buttons,message);gate.append(heading,form);dialog.insertBefore(gate,dialog.querySelector('.fjord-ai-portrait'));dialog.classList.add('fjord-ai-auth-pending');
    const recovery=recoveryCopy[language]||recoveryCopy.en,forgot=make('button');forgot.type='button';forgot.textContent=recovery[0];forgot.className='fjord-ai-forgot';buttons.append(forgot);
    forgot.onclick=async()=>{if(!email.reportValidity())return;forgot.disabled=true;message.textContent='…';try{await requestPasswordReset(apiKey,email.value);message.textContent=recovery[1]}catch{message.textContent=recovery[2]}finally{forgot.disabled=false}};
    let token=previous?.idToken||'',address=previous?.email||'';if(address)email.value=address;
    if(token){verified.hidden=resend.hidden=false;message.textContent=w[9]}
    const finish=result=>{dialog.removeEventListener('close',onClose);gate.remove();dialog.classList.remove('fjord-ai-auth-pending');resolve(result)};
    const onClose=()=>finish(null);dialog.addEventListener('close',onClose);
    async function authenticate(route){if(!form.reportValidity())return;create.disabled=signIn.disabled=true;message.textContent='…';try{const result=await call(apiKey,route,{email:email.value.trim(),password:password.value,returnSecureToken:true});token=result.idToken;address=result.email;sessionStorage.setItem(cacheKey,JSON.stringify({idToken:token,email:address,refreshToken:result.refreshToken,expiresAt:Date.now()+Number(result.expiresIn||3600)*1000}));password.value='';const profile=await lookup(apiKey,token);if(profile?.emailVerified){finish({idToken:token,email:address});return}if(route==='signUp')await sendVerification();else{verified.hidden=resend.hidden=false;message.textContent=w[9]}}catch(error){message.textContent=error.message==='EMAIL_EXISTS'?w[8]:/INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(error.message)?recovery[3]:w[10]}finally{create.disabled=signIn.disabled=false}}
    async function sendVerification(){if(!token)return;resend.disabled=true;try{await call(apiKey,'sendOobCode',{requestType:'VERIFY_EMAIL',idToken:token});verified.hidden=resend.hidden=false;message.textContent=w[5]}catch{message.textContent=w[10]}finally{resend.disabled=false}}
    create.onclick=()=>void authenticate('signUp');signIn.onclick=()=>void authenticate('signInWithPassword');resend.onclick=()=>void sendVerification();verified.onclick=async()=>{message.textContent='…';try{const profile=await lookup(apiKey,token);if(profile?.emailVerified){finish({idToken:token,email:address});return}message.textContent=w[9]}catch{message.textContent=w[10]}};
    form.addEventListener('submit',event=>{event.preventDefault();if(!signIn.disabled)void authenticate('signInWithPassword')});
    email.focus({preventScroll:true});
  })
}
