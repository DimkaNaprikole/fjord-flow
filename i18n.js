/* Original catalogue text is preserved; community content is never translated. */
(()=>{'use strict';
const rows=`
Choose a route|Velg en rute|Обрати маршрут|Välj en rutt|Vælg en rute
Contact us|Kontakt oss|Зв’язатися|Kontakta oss|Kontakt os
Video controls unavailable. Open the original video.|Videokontrollene er utilgjengelige. Åpne originalvideoen.|Керування відео недоступне. Відкрийте оригінальне відео.|Videokontrollerna är otillgängliga. Öppna originalvideon.|Videokontrollerne er utilgængelige. Åbn den originale video.
Card checkout preview · no charge|Forhåndsvisning av kortbetaling · ingen belastning|Демонстрація оплати карткою · без списання|Förhandsvisning av kortbetalning · ingen debitering|Forhåndsvisning af kortbetaling · ingen opkrævning
Replay same event (test duplicate protection)|Gjenta samme hendelse (test duplikatvern)|Повторити подію (перевірка захисту від дублювання)|Upprepa samma händelse (testa dubblettskydd)|Gentag samme hændelse (test dubletbeskyttelse)
No personal details or payment information collected.|Ingen person- eller betalingsopplysninger samles inn.|Особисті та платіжні дані не збираються.|Inga person- eller betalningsuppgifter samlas in.|Ingen person- eller betalingsoplysninger indsamles.
Duplicate safely ignored.|Duplikatet ble trygt ignorert.|Дублікат безпечно проігноровано.|Dubbletten ignorerades säkert.|Dublettet blev sikkert ignoreret.
A green glacier lake framed by mountains. Walk about 2.5 km each way from Bondhusdalen; swimming is not permitted.|Et grønt brevann omgitt av fjell. Omtrent 2,5 km til fots hver vei fra Bondhusdalen; bading er ikke tillatt.|Зелене льодовикове озеро серед гір. Від Bondhusdalen — близько 2,5 км пішки в один бік; купатися заборонено.|En grön glaciärsjö bland bergen. Cirka 2,5 km till fots i vardera riktningen från Bondhusdalen; bad är inte tillåtet.|En grøn gletsjersø mellem bjergene. Cirka 2,5 km til fods hver vej fra Bondhusdalen; badning er ikke tilladt.
FJORD / FLOW — Norway, beautifully connected|FJORD / FLOW — Opplev Norge|FJORD / FLOW — Відкрийте Норвегію|FJORD / FLOW — Upptäck Norge|FJORD / FLOW — Oplev Norge
YOUR JOURNEY, STOP BY STOP|REISEN DIN, STOPP FOR STOPP|ВАША ПОДОРОЖ, ЗУПИНКА ЗА ЗУПИНКОЮ|DIN RESA, STOPP FÖR STOPP|DIN REJSE, STOP FOR STOP
Close itinerary|Lukk reiseruten|Закрити маршрут|Stäng resplanen|Luk rejseruten
Map of the whole itinerary|Kart over hele reiseruten|Карта всього маршруту|Karta över hela resan|Kort over hele rejseruten
All stops along the way|Alle stopp underveis|Усі зупинки дорогою|Alla stopp längs vägen|Alle stop undervejs
Starting point|Startpunkt|Початок подорожі|Startpunkt|Startpunkt
Final stop|Siste stopp|Кінцева зупинка|Sista stoppet|Sidste stop
Along the way|Underveis|Дорогою|Längs vägen|Undervejs
Show on map|Vis på kartet|Показати на карті|Visa på kartan|Vis på kortet
View this stop|Se dette stoppet|Переглянути зупинку|Visa detta stopp|Se dette stop
View photo journal ↗|Se bildegalleriet ↗|Переглянути фотогалерею ↗|Visa bildgalleriet ↗|Se billedgalleriet ↗
Open full route in Google Maps ↗|Åpne hele ruten i Google Maps ↗|Відкрити весь маршрут у Google Maps ↗|Öppna hela rutten i Google Maps ↗|Åbn hele ruten i Google Maps ↗
Show the whole route|Vis hele ruten|Показати весь маршрут|Visa hela rutten|Vis hele ruten
Calculating the road route…|Beregner kjøreruten…|Розраховуємо автомобільний маршрут…|Beräknar körrutten…|Beregner køreruten…
Driving only|Bare kjøring|Лише час у дорозі|Endast körning|Kun kørsel
Driving estimates exclude visits, hikes, ferries and current road conditions. Check seasonal mountain-road closures before travelling.|Kjøretiden inkluderer ikke besøk, fotturer, ferger eller aktuelle veiforhold. Sjekk sesongstengte fjellveier før avreise.|Час у дорозі не включає огляд місць, походи, пороми та поточні дорожні умови. Перед поїздкою перевірте сезонні закриття гірських доріг.|Körtiden omfattar inte besök, vandringar, färjor eller aktuella vägförhållanden. Kontrollera säsongsstängda fjällvägar före avresa.|Køretiden omfatter ikke besøg, vandreture, færger eller aktuelle vejforhold. Tjek sæsonlukkede bjergveje før afrejse.
Road calculation is unavailable. All stops are shown; open Google Maps for directions.|Ruteberegningen er utilgjengelig. Alle stopp vises; åpne Google Maps for veibeskrivelse.|Розрахунок дороги недоступний. Усі зупинки показано; відкрийте Google Maps для навігації.|Ruttberäkningen är otillgänglig. Alla stopp visas; öppna Google Maps för vägbeskrivning.|Ruteberegningen er utilgængelig. Alle stop vises; åbn Google Maps for vejvisning.
ADVERTISING|ANNONSEPLASS|РЕКЛАМА|ANNONSPLATS|ANNONCEPLADS
Rates on request|Pris på forespørsel|Вартість — за запитом|Pris på förfrågan|Pris på forespørgsel
Your ad|Din annonse|Тут могла б бути|Din annons|Din annonce
could be here.|kunne vært her.|ваша реклама.|kunde vara här.|kunne være her.
Make your brand part of the journey.|La merkevaren din bli en del av reisen.|Нехай ваш бренд стане частиною подорожі.|Låt ditt varumärke bli en del av resan.|Lad dit brand blive en del af rejsen.
HOTELS · EXPERIENCES · NORWEGIAN DISCOVERIES|HOTELLER · OPPLEVELSER · NORSKE OPPDAGELSER|ГОТЕЛІ · ВРАЖЕННЯ · ВІДКРИТТЯ НОРВЕГІЇ|HOTELL · UPPLEVELSER · NORSKA UPPTÄCKTER|HOTELLER · OPLEVELSER · NORSKE OPDAGELSER
Photo credits|Fotokreditering|Автори фотографій|Fotokreditering|Fotokreditering
Public demo: account creation and posting are disabled. No real credentials are needed.|Offentlig demo: kontoer og innlegg er deaktivert. Ingen ekte innloggingsopplysninger trengs.|Публічне демо: створення акаунтів і дописів вимкнено. Справжні облікові дані не потрібні.|Offentlig demo: konton och inlägg är avstängda. Inga riktiga inloggningsuppgifter behövs.|Offentlig demo: konti og indlæg er deaktiveret. Ingen rigtige loginoplysninger er nødvendige.
PUBLIC DEMO|OFFENTLIG DEMO|ПУБЛІЧНЕ ДЕМО|OFFENTLIG DEMO|OFFENTLIG DEMO
Journeys|Reiser|Подорожі|Resor|Rejser
Admin|Admin|Адмін|Admin|Admin
Our travel journal|Reisejournalen vår|Наш щоденник подорожей|Vår resedagbok|Vores rejsedagbog
Community|Fellesskap|Спільнота|Gemenskap|Fællesskab
CURATED JOURNEYS · NORWAY|UTVALGTE REISER · NORGE|ВИБРАНІ ПОДОРОЖІ · НОРВЕГІЯ|UTVALDA RESOR · NORGE|UDVALGTE REJSER · NORGE
INTERACTIVE PREVIEW|INTERAKTIV FORHÅNDSVISNING|ІНТЕРАКТИВНИЙ ПЕРЕГЛЯД|INTERAKTIV FÖRHANDSVISNING|INTERAKTIV FORHÅNDSVISNING
YOUR NORWEGIAN FIELD GUIDE|DIN NORGESGUIDE|ВАШ ПУТІВНИК НОРВЕГІЄЮ|DIN NORGEGUIDE|DIN NORGESGUIDE
Norway|Norge|Норвегія|Norge|Norge
is calling.|kaller.|кличе.|kallar.|kalder.
Fjords that silence you. Mountains that stay with you.|Fjorder som tar pusten fra deg. Fjell du aldri glemmer.|Фіорди, що вражають. Гори, що залишаються в пам’яті.|Fjordar som tar andan ur dig. Berg du aldrig glömmer.|Fjorde, der tager pusten fra dig. Bjerge, du aldrig glemmer.
Find your own extraordinary, from Hardanger to the Arctic.|Finn ditt eget eventyr, fra Hardanger til Arktis.|Знайдіть свою пригоду — від Хардангера до Арктики.|Hitta ditt eget äventyr, från Hardanger till Arktis.|Find dit eget eventyr, fra Hardanger til Arktis.
Find your Norway|Finn ditt Norge|Знайдіть свою Норвегію|Hitta ditt Norge|Find dit Norge
PACK LIGHT. WANDER FAR.|PAKK LETT. REIS LANGT.|ПАКУЙТЕ ЛЕГКО. МАНДРУЙТЕ ДАЛЕКО.|PACKA LÄTT. RES LÅNGT.|PAK LET. REJS LANGT.
DESIGNED AROUND NORWAY|LAGET FOR NORGE|СТВОРЕНО ДЛЯ НОРВЕГІЇ|SKAPAT FÖR NORGE|SKABT TIL NORGE
TEN VIEWS. ONE NORWAY.|TI UTSIKTER. ETT NORGE.|ДЕСЯТЬ КРАЄВИДІВ. ОДНА НОРВЕГІЯ.|TIO VYER. ETT NORGE.|TI UDSIGTER. ÉT NORGE.
Pause photos|Sett bildene på pause|Призупинити фото|Pausa bilderna|Sæt billederne på pause
Play photos|Start bildene|Продовжити показ фото|Spela bilderna|Start billederne
Next photograph|Neste bilde|Наступне фото|Nästa bild|Næste billede
FJORDS · MOUNTAINS · OPEN AIR|FJORDER · FJELL · FRILUFTSLIV|ФІОРДИ · ГОРИ · ПРОСТІР|FJORDAR · BERG · FRILUFTSLIV|FJORDE · BJERGE · FRILUFTSLIV
Sports photography|Sportsfotografi|Спортивні фотографії|Sportfotografi|Sportsfotografi
Background image with blur and cropping.|Bakgrunnsbilde med uskarphet og beskjæring.|Фонове фото з розмиттям та кадруванням.|Bakgrundsbild med oskärpa och beskärning.|Baggrundsbillede med sløring og beskæring.
MANY LANDSCAPES. ONE EXTRAORDINARY COUNTRY.|MANGE LANDSKAP. ETT ENESTÅENDE LAND.|БЕЗЛІЧ КРАЄВИДІВ. ОДНА НЕЗВИЧАЙНА КРАЇНА.|MÅNGA LANDSKAP. ETT ENASTÅENDE LAND.|MANGE LANDSKABER. ÉT ENESTÅENDE LAND.
ONE DESTINATION. SO MUCH ALONG THE WAY.|ETT REISEMÅL. SÅ MYE UNDERVEIS.|ОДНА МЕТА. СТІЛЬКИ ЦІКАВОГО ДОРОГОЮ.|ETT RESMÅL. SÅ MYCKET LÄNGS VÄGEN.|ÉT REJSEMÅL. SÅ MEGET UNDERVEJS.
Take the|Velg|Оберіть|Ta|Tag
scenic way.|den vakre veien.|мальовничий шлях.|den vackra vägen.|den smukke vej.
Make the journey part of the adventure. Start with a suggested route, or find stops along your own road.|La reisen bli en del av eventyret. Velg en foreslått rute, eller finn stopp langs din egen vei.|Зробіть дорогу частиною пригоди. Оберіть готовий маршрут або знайдіть зупинки на своєму шляху.|Låt resan bli en del av äventyret. Välj en föreslagen rutt eller hitta stopp längs din egen väg.|Lad rejsen blive en del af eventyret. Vælg en foreslået rute, eller find stop på din egen vej.
Chase the waterfalls|Følg fossefallene|Назустріч водоспадам|Följ vattenfallen|Følg vandfaldene
Where the fjord meets the sky|Der fjorden møter himmelen|Там, де фіорд торкається неба|Där fjorden möter himlen|Hvor fjorden møder himlen
Hairpins to the clouds|Sving for sving mot skyene|Серпантином до хмар|Kurva för kurva mot molnen|Sving for sving mod skyerne
THE COLLECTION / SUMMER 2027|UTVALGET / SOMMER 2027|КОЛЕКЦІЯ / ЛІТО 2027|UTVALET / SOMMAR 2027|UDVALGET / SOMMER 2027
Go somewhere|Reis et sted|Вирушайте туди,|Res någonstans|Rejs et sted hen,
that stays with you.|du aldri glemmer.|що залишиться з вами.|du aldrig glömmer.|du aldrig glemmer.
Iconic fjords. Atlantic horizons. Waterfalls and trails.|Ikoniske fjorder. Atlanterhavets horisont. Fossefall og stier.|Знакові фіорди. Атлантичні обрії. Водоспади та стежки.|Ikoniska fjordar. Atlantens horisont. Vattenfall och stigar.|Ikoniske fjorde. Atlantens horisont. Vandfald og stier.
Real Norwegian places, illustrative departures and prices.|Ekte norske reisemål, illustrative avganger og priser.|Справжні місця Норвегії, демонстраційні дати та ціни.|Verkliga norska platser, illustrativa avgångar och priser.|Ægte norske steder, illustrative afgange og priser.
Explore a journey to try the booking workflow.|Utforsk en reise for å prøve bestillingen.|Оберіть подорож, щоб перевірити бронювання.|Utforska en resa för att prova bokningen.|Udforsk en rejse for at prøve bestillingen.
Where will the road take you?|Hvor tar veien deg?|Куди приведе вас дорога?|Vart leder vägen dig?|Hvor fører vejen dig hen?
Find a place or region…|Finn et sted eller en region…|Знайдіть місце або регіон…|Hitta en plats eller region…|Find et sted eller en region…
All journeys|Alle reiser|Усі подорожі|Alla resor|Alle rejser
Fjords|Fjorder|Фіорди|Fjordar|Fjorde
Hiking|Fotturer|Походи|Vandring|Vandreture
Waterfalls|Fossefall|Водоспади|Vattenfall|Vandfald
Coast|Kyst|Узбережжя|Kust|Kyst
Coast & Arctic|Kyst og Arktis|Узбережжя та Арктика|Kust och Arktis|Kyst og Arktis
Glaciers|Isbreer|Льодовики|Glaciärer|Gletsjere
Cities|Byer|Міста|Städer|Byer
Cities & villages|Byer og bygder|Міста та селища|Städer och byar|Byer og landsbyer
View photo journal|Åpne bildegalleriet|Відкрити фотогалерею|Öppna bildgalleriet|Åbn billedgalleriet
Explore|Utforsk|Докладніше|Utforska|Udforsk
Destination reference ↗|Om reisemålet ↗|Про місце ↗|Om resmålet ↗|Om rejsemålet ↗
Original photograph|Originalfotografi|Оригінальне фото|Originalfotografi|Originalfotografi
Photography & destination references|Foto og reisemålskilder|Фото та джерела про місця|Foto och resmålskällor|Foto og kilder om rejsemål
The fjords|Fjordene|Фіорди|Fjordarna|Fjordene
Above it all|Over det hele|Над усім|Ovanför allt|Over det hele
Wild water|Ville fossefall|Стихія води|Vilda vatten|Vilde vandfald
Northern light|Nordlig lys|Північне світло|Nordligt ljus|Nordligt lys
THE SOUND OF SOMETHING WILD|LYDEN AV VILL NATUR|ЗВУКИ ДИКОЇ ПРИРОДИ|LJUDET AV VILD NATUR|LYDEN AF VILD NATUR
Let the landscape|La landskapet|Нехай краєвид|Låt landskapet|Lad landskabet
do the talking.|tale for seg.|говорить сам за себе.|tala för sig självt.|tale for sig selv.
Discover the waterfalls ↗|Oppdag fossefallene ↗|Відкрийте водоспади ↗|Upptäck vattenfallen ↗|Oplev vandfaldene ↗
THE ART OF GOING SOMEWHERE|KUNSTEN Å REISE|МИСТЕЦТВО ПОДОРОЖУВАТИ|KONSTEN ATT RESA|KUNSTEN AT REJSE
A journey begins|En reise begynner|Подорож починається|En resa börjar|En rejse begynder
with a little wonder.|med litt undring.|з маленького дива.|med lite förundran.|med lidt undren.
Find your north|Finn ditt nord|Знайдіть свою північ|Hitta ditt norr|Find dit nord
Look a little closer|Se litt nærmere|Придивіться ближче|Titta lite närmare|Se lidt nærmere
Leave room to wander|Gi plass til omveier|Залиште місце для відкриттів|Ge plats för omvägar|Giv plads til omveje
Bring back a story|Ta med en historie hjem|Привезіть свою історію|Ta med en historia hem|Tag en historie med hjem
STORIES FROM THE ROAD|HISTORIER FRA VEIEN|ІСТОРІЇ З ДОРОГИ|BERÄTTELSER FRÅN VÄGEN|HISTORIER FRA VEJEN
Travel better.|Reis bedre.|Подорожуйте краще.|Res bättre.|Rejs bedre.
Together.|Sammen.|Разом.|Tillsammans.|Sammen.
Sign in / Join|Logg inn / Registrer deg|Увійти / Зареєструватися|Logga in / Registrera dig|Log ind / Tilmeld dig
Sign in|Logg inn|Увійти|Logga in|Log ind
Register|Registrer deg|Реєстрація|Registrera dig|Tilmeld dig
My account|Min konto|Особистий кабінет|Mitt konto|Min konto
Conversation|Samtale|Обговорення|Samtal|Samtale
All conversations|Alle samtaler|Усі обговорення|Alla samtal|Alle samtaler
Travel forum|Reiseforum|Форум подорожей|Reseforum|Rejseforum
Place reviews|Stedsomtaler|Відгуки про місця|Platsrecensioner|Stedanmeldelser
Travel notes|Reisenotater|Дорожні нотатки|Reseanteckningar|Rejsenoter
Destination|Reisemål|Місце|Resmål|Rejsemål
All destinations|Alle reisemål|Усі місця|Alla resmål|Alle rejsemål
Start a conversation|Start en samtale|Почати обговорення|Starta ett samtal|Start en samtale
YOUR TRAVEL NOTEBOOK|DIN REISEBOK|ВАШ ПОДОРОЖНІЙ ЗАПИСНИК|DIN RESEDAGBOK|DIN REJSEDAGBOG
Your travel notebook|Din reisebok|Ваш подорожній записник|Din resedagbok|Din rejsedagbog
Welcome aboard.|Velkommen om bord.|Ласкаво просимо.|Välkommen ombord.|Velkommen om bord.
Welcome back.|Velkommen tilbake.|З поверненням.|Välkommen tillbaka.|Velkommen tilbage.
Create your account.|Opprett kontoen din.|Створіть обліковий запис.|Skapa ditt konto.|Opret din konto.
Your personal account.|Din personlige konto.|Ваш особистий кабінет.|Ditt personliga konto.|Din personlige konto.
Username|Brukernavn|Ім’я користувача|Användarnamn|Brugernavn
Username:|Brukernavn:|Ім’я користувача:|Användarnamn:|Brugernavn:
Password|Passord|Пароль|Lösenord|Adgangskode
Display name|Visningsnavn|Відображуване ім’я|Visningsnamn|Visningsnavn
Use 3–32 letters, numbers, dots, underscores or hyphens.|Bruk 3–32 bokstaver, tall, punktum, understrek eller bindestrek.|Використовуйте 3–32 літери, цифри, крапки, підкреслення або дефіси.|Använd 3–32 bokstäver, siffror, punkter, understreck eller bindestreck.|Brug 3–32 bogstaver, tal, punktummer, understregninger eller bindestreger.
Use at least 8 characters.|Bruk minst 8 tegn.|Використовуйте щонайменше 8 символів.|Använd minst 8 tecken.|Brug mindst 8 tegn.
Create account|Opprett konto|Створити обліковий запис|Skapa konto|Opret konto
Already have an account?|Har du allerede en konto?|Уже маєте обліковий запис?|Har du redan ett konto?|Har du allerede en konto?
New here?|Ny her?|Ви тут уперше?|Ny här?|Ny her?
Signed in as|Logget inn som|Ви увійшли як|Inloggad som|Logget ind som
Your reviews|Dine omtaler|Ваші відгуки|Dina recensioner|Dine anmeldelser
Your forum topics|Dine forumtråder|Ваші теми форуму|Dina forumtrådar|Dine forumtråde
Your travel notes|Dine reisenotater|Ваші дорожні нотатки|Dina reseanteckningar|Dine rejsenoter
No posts yet.|Ingen innlegg ennå.|Дописів поки немає.|Inga inlägg ännu.|Ingen indlæg endnu.
Open conversation|Åpne samtalen|Відкрити обговорення|Öppna samtalet|Åbn samtalen
Sign out|Logg ut|Вийти|Logga ut|Log ud
Close account|Lukk konto|Закрити кабінет|Stäng konto|Luk konto
You are signed in.|Du er logget inn.|Ви увійшли.|Du är inloggad.|Du er logget ind.
Please wait…|Vennligst vent…|Зачекайте…|Vänta…|Vent venligst…
Create a new local account|Opprett en ny lokal konto|Створити новий локальний обліковий запис|Skapa ett nytt lokalt konto|Opret en ny lokal konto
This is a local prototype. Use a test password you do not use elsewhere.|Dette er en lokal prototype. Bruk et testpassord du ikke bruker andre steder.|Це локальний прототип. Використовуйте тестовий пароль, який не використовуєте деінде.|Detta är en lokal prototyp. Använd ett testlösenord som du inte använder någon annanstans.|Dette er en lokal prototype. Brug en testadgangskode, du ikke bruger andre steder.
Continue|Fortsett|Продовжити|Fortsätt|Fortsæt
LEAVE SOMETHING USEFUL|DEL NOE NYTTIG|ПОДІЛІТЬСЯ КОРИСНИМ|DELA NÅGOT ANVÄNDBART|DEL NOGET NYTTIGT
Share your experience.|Del opplevelsen din.|Поділіться враженнями.|Dela din upplevelse.|Del din oplevelse.
Type|Type|Тип|Typ|Type
Forum topic|Forumtråd|Тема форуму|Forumtråd|Forumtråd
Place review|Stedsomtale|Відгук про місце|Platsrecension|Stedanmeldelse
Travel note|Reisenotat|Дорожня нотатка|Reseanteckning|Rejsenote
General travel|Generelt om reiser|Загальні питання|Allmänt om resor|Generelt om rejser
Title|Tittel|Заголовок|Titel|Titel
Your rating|Din vurdering|Ваша оцінка|Ditt betyg|Din bedømmelse
5 — Wonderful|5 — Fantastisk|5 — Чудово|5 — Fantastiskt|5 — Fantastisk
4 — Very good|4 — Veldig bra|4 — Дуже добре|4 — Mycket bra|4 — Meget godt
3 — Good|3 — Bra|3 — Добре|3 — Bra|3 — Godt
2 — Disappointing|2 — Skuffende|2 — Незадовільно|2 — Besvikelse|2 — Skuffende
1 — Poor|1 — Dårlig|1 — Погано|1 — Dåligt|1 — Dårligt
Message|Melding|Повідомлення|Meddelande|Besked
Publish locally|Publiser lokalt|Опублікувати локально|Publicera lokalt|Udgiv lokalt
View conversation|Se samtalen|Переглянути обговорення|Visa samtalet|Se samtalen
Delete my post|Slett innlegget mitt|Видалити мій допис|Ta bort mitt inlägg|Slet mit indlæg
The first story is still yours to tell.|Den første historien venter på deg.|Перша історія чекає на вас.|Den första berättelsen väntar på dig.|Den første historie venter på dig.
Sign in to add a reply.|Logg inn for å svare.|Увійдіть, щоб відповісти.|Logga in för att svara.|Log ind for at svare.
Your post has been published locally.|Innlegget ditt er publisert lokalt.|Ваш допис опубліковано локально.|Ditt inlägg har publicerats lokalt.|Dit indlæg er udgivet lokalt.
YOUR NEXT STOP|DITT NESTE STOPP|ВАША НАСТУПНА ЗУПИНКА|DITT NÄSTA STOPP|DIT NÆSTE STOP
Video credits|Videokilder|Автори відео|Videokällor|Videokilder
Film by|Film av|Автор відео|Film av|Film af
Watch on YouTube ↗|Se på YouTube ↗|Дивитися на YouTube ↗|Se på YouTube ↗|Se på YouTube ↗
Find a stay · Booking.com ↗|Finn overnatting · Booking.com ↗|Знайти житло · Booking.com ↗|Hitta boende · Booking.com ↗|Find overnatning · Booking.com ↗
Stays on the map ↗|Overnatting på kartet ↗|Житло на карті ↗|Boenden på kartan ↗|Overnatning på kortet ↗
Compare car rentals ↗|Sammenlign leiebiler ↗|Порівняти оренду авто ↗|Jämför hyrbilar ↗|Sammenlign billeje ↗
Visitor reviews|Besøkendes omtaler|Відгуки відвідувачів|Besökares recensioner|Besøgendes anmeldelser
No reviews yet. Be the first to share a visit.|Ingen omtaler ennå. Bli den første som deler et besøk.|Відгуків ще немає. Поділіться враженнями першими.|Inga recensioner ännu. Bli först med att dela ett besök.|Ingen anmeldelser endnu. Bliv den første til at dele et besøg.
Write a review|Skriv en omtale|Написати відгук|Skriv en recension|Skriv en anmeldelse
Ask about this place|Spør om dette stedet|Запитати про це місце|Fråga om denna plats|Spørg om dette sted
A PLACE WORTH A CLOSER LOOK|ET STED VERDT Å SE NÆRMERE PÅ|МІСЦЕ, ВАРТЕ УВАГИ|EN PLATS VÄRD EN NÄRMARE TITT|ET STED, DER ER VÆRD AT SE NÆRMERE PÅ
Close photo gallery|Lukk bildegalleriet|Закрити фотогалерею|Stäng bildgalleriet|Luk billedgalleriet
Previous photograph|Forrige fotografi|Попереднє фото|Föregående fotografi|Forrige fotografi
Next photograph|Neste fotografi|Наступне фото|Nästa fotografi|Næste fotografi
THE ROAD TO YOUR NEXT STORY|VEIEN TIL DIN NESTE HISTORIE|ДОРОГА ДО НОВОЇ ІСТОРІЇ|VÄGEN TILL DIN NÄSTA HISTORIA|VEJEN TIL DIN NÆSTE HISTORIE
Make your way here|Finn veien hit|Прокладіть шлях сюди|Hitta vägen hit|Find vej hertil
Starting point|Startpunkt|Початкова точка|Startpunkt|Startpunkt
Norwegian town or current location|Norsk by eller nåværende posisjon|Місто в Норвегії або поточне місце|Norsk stad eller aktuell plats|Norsk by eller aktuel placering
Use my location|Bruk posisjonen min|Моє розташування|Använd min plats|Brug min placering
Travel by|Reisemåte|Транспорт|Färdsätt|Transport
Car|Bil|Автомобіль|Bil|Bil
Public transport|Kollektivtransport|Громадський транспорт|Kollektivtrafik|Offentlig transport
On foot|Til fots|Пішки|Till fots|Til fods
Maximum extra driving per suggested stop|Maksimal ekstra kjøretid per foreslått stopp|Максимальний об’їзд на кожну зупинку|Maximal extra körtid per föreslaget stopp|Maksimal ekstra køretid pr. foreslået stop
30 minutes|30 minutter|30 хвилин|30 minuter|30 minutter
1 hour|1 time|1 година|1 timme|1 time
2 hours|2 timer|2 години|2 timmar|2 timer
Find sights along the road|Finn severdigheter langs veien|Знайти пам’ятки дорогою|Hitta sevärdheter längs vägen|Find seværdigheder langs vejen
Open route in Google Maps|Åpne ruten i Google Maps|Відкрити маршрут у Google Maps|Öppna rutten i Google Maps|Åbn ruten i Google Maps
Make a stop along the way|Ta en stopp underveis|Зупиніться дорогою|Gör ett stopp längs vägen|Gør et stop undervejs
Select all|Velg alle|Вибрати все|Välj alla|Vælg alle
Clear selection|Fjern valgene|Очистити вибір|Rensa val|Ryd valg
Update route with selected stops|Oppdater ruten med valgte stopp|Оновити маршрут із вибраними зупинками|Uppdatera rutten med valda stopp|Opdater ruten med valgte stop
Explore this journey|Utforsk denne reisen|Докладніше про подорож|Utforska denna resa|Udforsk denne rejse
Included in your chosen itinerary|Inkludert i den valgte reiseruten|У вибраному маршруті|Ingår i din valda resplan|Med i din valgte rejseplan
Route found. Select the places you want to visit.|Rute funnet. Velg stedene du vil besøke.|Маршрут знайдено. Оберіть місця для відвідування.|Rutt hittad. Välj de platser du vill besöka.|Rute fundet. Vælg de steder, du vil besøge.
Enter your starting city or use your current location first.|Skriv inn startbyen eller bruk posisjonen din først.|Спочатку вкажіть місто відправлення або своє розташування.|Ange din startstad eller använd din aktuella plats först.|Angiv først din startby, eller brug din aktuelle placering.
Following the road and checking possible stops…|Følger veien og sjekker mulige stopp…|Перевіряємо дорогу та можливі зупинки…|Följer vägen och kontrollerar möjliga stopp…|Følger vejen og tjekker mulige stop…
Location is unavailable. Enter a city or address above.|Posisjon er utilgjengelig. Skriv en by eller adresse ovenfor.|Місцеположення недоступне. Введіть місто чи адресу вище.|Platsen är inte tillgänglig. Ange en stad eller adress ovan.|Placering er ikke tilgængelig. Angiv en by eller adresse ovenfor.
Waiting for location permission…|Venter på tilgang til posisjon…|Очікуємо дозвіл на геолокацію…|Väntar på platsbehörighet…|Venter på adgang til placering…
Current location selected. You can now open your route.|Nåværende posisjon valgt. Du kan nå åpne ruten.|Поточне місце вибрано. Можна відкрити маршрут.|Aktuell plats vald. Du kan nu öppna rutten.|Aktuel placering valgt. Du kan nu åbne ruten.
Could not access your location. Enter your starting city or address instead.|Kunne ikke hente posisjonen din. Skriv startbyen eller adressen i stedet.|Не вдалося визначити місце. Введіть місто відправлення або адресу.|Kunde inte hämta din plats. Ange din startstad eller adress i stället.|Kunne ikke hente din placering. Angiv din startby eller adresse i stedet.
Check weather, road closures and local access before travelling.|Sjekk vær, stengte veier og lokal adkomst før reisen.|Перевірте погоду, перекриття доріг і доступ перед подорожжю.|Kontrollera väder, vägavstängningar och lokal tillgång före resan.|Tjek vejr, lukkede veje og lokal adgang før rejsen.
Play|Spill av|Відтворити|Spela|Afspil
Pause|Pause|Пауза|Pausa|Pause
Replay|Spill igjen|Повторити|Spela igen|Afspil igen
Mute|Slå av lyd|Вимкнути звук|Stäng av ljud|Slå lyd fra
Unmute|Slå på lyd|Увімкнути звук|Slå på ljud|Slå lyd til
Full screen|Fullskjerm|На весь екран|Helskärm|Fuld skærm
Loading video controls…|Laster videokontroller…|Завантаження керування відео…|Laddar videokontroller…|Indlæser videoknapper…
Ready — press play for sound.|Klar — trykk spill av for lyd.|Готово — натисніть відтворення для звуку.|Redo — tryck spela för ljud.|Klar — tryk afspil for lyd.
Playing|Spiller av|Відтворення|Spelar|Afspiller
Paused|Pauset|Призупинено|Pausad|Sat på pause
Film ended|Filmen er ferdig|Відео завершено|Filmen är slut|Filmen er slut
Press play inside the video to start playback.|Trykk spill av i videoen for å starte.|Натисніть відтворення у відео.|Tryck spela i videon för att starta.|Tryk afspil i videoen for at starte.
This film cannot play here.|Denne filmen kan ikke spilles av her.|Це відео тут недоступне.|Den här filmen kan inte spelas här.|Denne film kan ikke afspilles her.
Open original video ↗|Åpne originalvideo ↗|Відкрити оригінальне відео ↗|Öppna originalvideon ↗|Åbn originalvideoen ↗
▶ Visit film|▶ Besøksfilm|▶ Відеопрогулянка|▶ Besöksfilm|▶ Besøgsfilm
▶ Watch the film|▶ Se filmen|▶ Дивитися відео|▶ Se filmen|▶ Se filmen
▶ Drone film|▶ Dronefilm|▶ Відео з дрона|▶ Drönarfilm|▶ Dronefilm
Play visit film|Spill av besøksfilm|Відтворити відеопрогулянку|Spela besöksfilm|Afspil besøgsfilm
Play drone film|Spill av dronefilm|Відтворити відео з дрона|Spela drönarfilm|Afspil dronefilm
Please try again.|Prøv igjen.|Спробуйте ще раз.|Försök igen.|Prøv igen.
Request failed|Forespørselen mislyktes|Запит не виконано|Förfrågan misslyckades|Anmodningen mislykkedes
TRY THE AUTOMATION|PRØV BESTILLINGEN|СПРОБУЙТЕ БРОНЮВАННЯ|PROVA BOKNINGEN|PRØV BESTILLINGEN
Seats|Plasser|Місця|Platser|Pladser
Webhook event ID|Webhook-hendelses-ID|ID події webhook|Webhook-händelse-ID|Webhook-hændelses-ID
Payment method|Betalingsmåte|Спосіб оплати|Betalningsmetod|Betalingsmetode
Test payment|Testbetaling|Тестова оплата|Testbetalning|Testbetaling
Not connected · no charge|Ikke tilkoblet · ingen belastning|Не підключено · без списання|Inte anslutet · ingen debitering|Ikke tilsluttet · ingen betaling
Manual confirmation|Manuell bekreftelse|Ручне підтвердження|Manuell bekräftelse|Manuel bekræftelse
Simulated payment event|Simulert betalingshendelse|Симуляція оплати|Simulerad betalningshändelse|Simuleret betalingshændelse
Simulated payment received|Simulert betaling mottatt|Симульовану оплату отримано|Simulerad betalning mottagen|Simuleret betaling modtaget
Confirm test reservation ↗|Bekreft testbestilling ↗|Підтвердити тестове бронювання ↗|Bekräfta testbokning ↗|Bekræft testbestilling ↗
Close booking|Lukk bestilling|Закрити бронювання|Stäng bokning|Luk bestilling
`;
const dictionaries={en:{},nb:{},uk:{},sv:{},da:{}};
function addRows(text){text.trim().split('\n').forEach(line=>{const [en,...v]=line.split('|');if(v.length!==4)throw Error('Invalid translation: '+en);dictionaries.en[en]=en;['nb','uk','sv','da'].forEach((l,i)=>dictionaries[l][en]=v[i])})}addRows(rows);
addRows(`
An extraordinary ledge above Lake Ringedalsvatnet.|En enestående fjellhylle over Ringedalsvatnet.|Незвичайний скельний виступ над озером Ringedalsvatnet.|En enastående klippavsats över Ringedalsvatnet.|En enestående klippehylde over Ringedalsvatnet.
Water, stone and a remarkable valley.|Vann, stein og en bemerkelsesverdig dal.|Вода, скелі й дивовижна долина.|Vatten, sten och en storslagen dal.|Vand, sten og en bemærkelsesværdig dal.
A journey through the monumental fjord landscape.|En reise gjennom et storslått fjordlandskap.|Подорож величними краєвидами фіорду.|En resa genom ett storslaget fjordlandskap.|En rejse gennem et storslået fjordlandskab.
A granite plateau above the Lysefjord.|Et granittplatå over Lysefjorden.|Гранітне плато над Lysefjord.|En granitplatå över Lysefjorden.|Et granitplateau over Lysefjorden.
Sharp peaks, sheltered harbours and open sea.|Spisse fjell, lune havner og åpent hav.|Гострі вершини, затишні гавані й відкрите море.|Spetsiga berg, skyddade hamnar och öppet hav.|Spidse bjerge, beskyttede havne og åbent hav.
Narrow waters beneath steep mountains.|Smalt farvann under bratte fjell.|Вузькі води під стрімкими горами.|Smala vatten under branta berg.|Smalt farvand under stejle bjerge.
A waterfall with a path behind its curtain of water.|En foss med sti bak vannsløret.|Водоспад зі стежкою за водяною завісою.|Ett vattenfall med en stig bakom vattenridån.|Et vandfald med en sti bag vandtæppet.
Island bridges at the edge of the Norwegian Sea.|Øybroer ved kanten av Norskehavet.|Мости між островами на краю Норвезького моря.|Öbroar vid Norska havets kant.|Øbroer ved Norskehavets kant.
Sculpted mountains meet the open Atlantic.|Formfulle fjell møter det åpne Atlanterhavet.|Виразні гори зустрічають відкриту Атлантику.|Skulpterade berg möter öppna Atlanten.|Skulpturelle bjerge møder det åbne Atlanterhav.
An Arctic city framed by islands and mountains.|En arktisk by omgitt av øyer og fjell.|Арктичне місто в оточенні островів і гір.|En arktisk stad omgiven av öar och berg.|En arktisk by omgivet af øer og bjerge.
A fishing village beneath dramatic coastal peaks.|Et fiskevær under dramatiske kystfjell.|Рибальське селище під вражаючими прибережними вершинами.|Ett fiskeläge under dramatiska kustberg.|Et fiskerleje under dramatiske kystbjerge.
A mountain perspective across islands and fjords.|Fjellutsikt over øyer og fjorder.|Гірський краєвид на острови й фіорди.|Bergsutsikt över öar och fjordar.|Bjergudsigt over øer og fjorde.
A fjord town surrounded by mountains, with a celebrated viewpoint above the valley.|En fjordby omgitt av fjell, med et kjent utsiktspunkt over dalen.|Містечко біля фіорду серед гір, із відомим оглядовим майданчиком над долиною.|En fjordstad omgiven av berg, med en berömd utsiktsplats över dalen.|En fjordby omgivet af bjerge, med et kendt udsigtspunkt over dalen.
Powerful water in a steep mountain valley.|Mektige vannmasser i en bratt fjelldal.|Потужний потік у стрімкій гірській долині.|Kraftfullt vatten i en brant fjälldal.|Kraftfuldt vand i en stejl bjergdal.
Twin cascades in a landscape shaped by water.|To fossefall i et landskap formet av vann.|Два каскади серед краєвиду, створеного водою.|Två vattenfall i ett landskap format av vatten.|To vandfald i et landskab formet af vand.
Blue ice and a remarkable glacial landscape.|Blå is og et enestående brelandskap.|Блакитна крига й дивовижний льодовиковий краєвид.|Blå is och ett enastående glaciärlandskap.|Blå is og et enestående gletsjerlandskab.
Colourful waterfront lanes beneath the seven mountains.|Fargerike smug ved vannet under de sju fjell.|Барвисті вулички набережної під сімома горами.|Färgglada gränder vid vattnet under de sju bergen.|Farverige stræder ved vandet under de syv bjerge.
Art Nouveau streets and islands seen from Aksla.|Jugendstilgater og øyer sett fra Aksla.|Вулиці в стилі модерн та острови з вершини Aksla.|Jugendgator och öar sedda från Aksla.|Jugendstilgader og øer set fra Aksla.
A harbour city where forests meet contemporary architecture.|En havneby der skogen møter moderne arkitektur.|Портове місто, де ліси зустрічаються із сучасною архітектурою.|En hamnstad där skog möter modern arkitektur.|En havneby, hvor skov møder moderne arkitektur.
Timber wharves, the old town bridge and a medieval cathedral.|Trebrygger, den gamle bybroen og en middelalderkatedral.|Дерев’яні причали, старовинний міський міст і середньовічний собор.|Träbryggor, den gamla stadsbron och en medeltida katedral.|Træbrygger, den gamle bybro og en middelalderkatedral.
A historic mining town of timber houses and mountain light.|En historisk bergstad med trehus og fjelllys.|Історичне шахтарське містечко з дерев’яними будинками та гірським світлом.|En historisk gruvstad med trähus och fjälljus.|En historisk mineby med træhuse og bjerglys.
A small fjord village at the foot of a spectacular railway valley.|Ei lita fjordbygd ved foten av en spektakulær jernbanedal.|Невелике селище біля фіорду під дивовижною залізничною долиною.|En liten fjordby vid foten av en spektakulär järnvägsdal.|En lille fjordlandsby ved foden af en spektakulær jernbanedal.
A viewing platform suspended above the Aurlandsfjord.|En utsiktsplattform som svever over Aurlandsfjorden.|Оглядовий майданчик над Aurlandsfjord.|En utsiktsplattform som svävar över Aurlandsfjorden.|En udsigtsplatform, der svæver over Aurlandsfjorden.
Hairpin bends and waterfalls in a dramatic mountain pass.|Hårnålssvinger og fossefall i et dramatisk fjellpass.|Серпантини й водоспади на вражаючому гірському перевалі.|Hårnålskurvor och vattenfall i ett dramatiskt bergspass.|Hårnålesving og vandfald i et dramatisk bjergpas.
An alpine ridge above the Rauma valley and fjord.|En alpin fjellrygg over Raumadalen og fjorden.|Альпійський хребет над долиною Rauma та фіордом.|En alpin bergskam över Raumadalen och fjorden.|En alpin bjergkam over Raumadalen og fjorden.
A celebrated ridge between the blue waters of Gjende and Bessvatnet.|En berømt fjellrygg mellom de blå vannene Gjende og Bessvatnet.|Відомий хребет між блакитними озерами Gjende та Bessvatnet.|En berömd bergskam mellan de blå sjöarna Gjende och Bessvatnet.|En berømt bjergkam mellem de blå søer Gjende og Bessvatnet.
High peaks, mountain lakes and wide horizons.|Høye topper, fjellvann og vide horisonter.|Високі вершини, гірські озера й широкі обрії.|Höga toppar, fjällsjöar och vida horisonter.|Høje tinder, bjergsøer og vide horisonter.
A glacier arm framed by steep valley walls and rushing water.|En brearm omgitt av bratte dalsider og brusende vann.|Рукав льодовика серед стрімких схилів і бурхливої води.|En glaciärarm omgiven av branta dalsidor och forsande vatten.|En gletsjerarm omgivet af stejle dalsider og brusende vand.
Emerald water beneath the mountains of Nordfjord.|Smaragdgrønt vann under fjellene i Nordfjord.|Смарагдова вода під горами Nordfjord.|Smaragdgrönt vatten under Nordfjords berg.|Smaragdgrønt vand under Nordfjords bjerge.
An Atlantic island with grassy cliffs and seasonal seabird colonies.|Ei atlanterhavsøy med gresskledde klipper og sesongvise sjøfuglkolonier.|Атлантичний острів із зеленими скелями та сезонними колоніями морських птахів.|En atlantö med gräsbevuxna klippor och säsongsvisa sjöfågelkolonier.|En atlanterhavsø med græsklædte klipper og sæsonbestemte havfuglekolonier.
Long beaches, mountain roads and an Arctic horizon.|Lange strender, fjellveier og en arktisk horisont.|Довгі пляжі, гірські дороги й арктичний обрій.|Långa stränder, fjällvägar och en arktisk horisont.|Lange strande, bjergveje og en arktisk horisont.
Polar mountains and glacial landscapes around Longyearbyen.|Polarfjell og brelandskap rundt Longyearbyen.|Полярні гори й льодовикові краєвиди навколо Longyearbyen.|Polarberg och glaciärlandskap runt Longyearbyen.|Polarbjerge og gletsjerlandskaber omkring Longyearbyen.
A lighthouse on the rocky southern edge of mainland Norway.|Et fyr på den steinete sørspissen av Fastlands-Norge.|Маяк на скелястому південному краю материкової Норвегії.|En fyr på Norges klippiga sydspets.|Et fyr på den klippefyldte sydspids af Norges fastland.
A vast mountain plateau of lakes and open moorland.|Et vidstrakt fjellplatå med vann og åpen vidde.|Величезне гірське плато з озерами й відкритими просторами.|En vidsträckt fjällplatå med sjöar och öppna hedar.|Et vidstrakt bjergplateau med søer og åben hede.
`);
addRows(`
Driving plans end at access points. Leave time for visits, hikes and ferry crossings; mountain roads are seasonal.|Kjørerutene slutter ved adkomstpunktene. Beregn tid til besøk, fotturer og ferger; fjellveier er sesongåpne.|Автомаршрути закінчуються біля точок доступу. Плануйте час на огляд, походи й пороми; гірські дороги відкриті сезонно.|Körrutterna slutar vid tillfartspunkterna. Avsätt tid för besök, vandringar och färjor; fjällvägar är säsongsöppna.|Køreruterne slutter ved adgangspunkterne. Afsæt tid til besøg, vandreture og færger; bjergveje er sæsonåbne.
Stand before the waterfalls of Hardanger. Follow the water into the fjords. Slow down, look up, and make room for a different kind of journey.|Stå foran fossene i Hardanger. Følg vannet ut i fjordene. Senk tempoet, løft blikket og gi plass til en annerledes reise.|Відчуйте водоспади Хардангера. Рушайте за водою до фіордів. Сповільніться, озирніться й відкрийте для себе іншу подорож.|Stå framför Hardangers vattenfall. Följ vattnet ut i fjordarna. Sakta ner, lyft blicken och ge plats åt en annorlunda resa.|Stå foran Hardangers vandfald. Følg vandet ud i fjordene. Sæt tempoet ned, løft blikket, og giv plads til en anderledes rejse.
Follow the fjords, the coast or the mountains. Choose the landscape that speaks to you.|Følg fjordene, kysten eller fjellene. Velg landskapet som snakker til deg.|Рушайте до фіордів, узбережжя або гір. Оберіть краєвид, що вам до душі.|Följ fjordarna, kusten eller bergen. Välj det landskap som talar till dig.|Følg fjordene, kysten eller bjergene. Vælg det landskab, der taler til dig.
Open the photo journals. Explore different views before choosing your next stop.|Åpne bildegalleriene. Se ulike vinkler før du velger neste stopp.|Відкрийте фотогалереї. Розгляньте різні ракурси перед вибором наступної зупинки.|Öppna bildgallerierna. Se olika vyer innan du väljer nästa stopp.|Åbn billedgallerierne. Se forskellige vinkler, før du vælger næste stop.
A village cafe, a harbour at dusk, a road that asks you to slow down.|En bygdekafé, en havn i skumringen, en vei som ber deg senke tempoet.|Кав’ярня в селищі, гавань у сутінках, дорога, що запрошує сповільнитися.|Ett bykafé, en hamn i skymningen, en väg som ber dig sakta ner.|En landsbycafé, en havn i skumringen, en vej, der beder dig sætte tempoet ned.
Collect moments, photographs and a reason to return to the North.|Samle øyeblikk, fotografier og en grunn til å vende tilbake til Norden.|Збирайте миті, фотографії та приводи повернутися на Північ.|Samla ögonblick, fotografier och en anledning att återvända till Norden.|Saml øjeblikke, fotografier og en grund til at vende tilbage til Norden.
Ask about routes, share a useful stop, or leave a review of a place you have visited.|Spør om ruter, del et nyttig stopp, eller skriv en omtale av et sted du har besøkt.|Запитайте про маршрути, поділіться цікавою зупинкою або залиште відгук про відвідане місце.|Fråga om rutter, dela ett bra stopp eller recensera en plats du besökt.|Spørg om ruter, del et godt stop, eller anmeld et sted, du har besøgt.
Local preview: accounts and posts are stored on this computer. Use a test password. No public community has been launched.|Lokal forhåndsvisning: Kontoer og innlegg lagres på denne datamaskinen. Bruk et testpassord. Fellesskapet er ikke offentlig lansert.|Локальний перегляд: облікові записи та дописи зберігаються на цьому комп’ютері. Використовуйте тестовий пароль. Публічну спільноту ще не запущено.|Lokal förhandsvisning: konton och inlägg sparas på denna dator. Använd ett testlösenord. Gemenskapen är inte offentligt lanserad.|Lokal forhåndsvisning: konti og indlæg gemmes på denne computer. Brug en testadgangskode. Fællesskabet er ikke offentligt lanceret.
No posts in this selection yet. Share a real experience or ask a travel question.|Ingen innlegg i dette utvalget ennå. Del en ekte opplevelse eller still et reisespørsmål.|У цьому розділі ще немає дописів. Поділіться власним досвідом або запитайте про подорож.|Inga inlägg i detta urval ännu. Dela en verklig upplevelse eller ställ en resefråga.|Ingen indlæg i dette udvalg endnu. Del en ægte oplevelse, eller stil et rejsespørgsmål.
External searches. Choose dates and check availability with the provider. No affiliate commission is connected.|Eksterne søk. Velg datoer og sjekk tilgjengelighet hos leverandøren. Ingen partnerprovisjon er tilkoblet.|Зовнішній пошук. Оберіть дати й перевірте наявність у постачальника. Партнерську комісію ще не підключено.|Externa sökningar. Välj datum och kontrollera tillgänglighet hos leverantören. Ingen partnerprovision är ansluten.|Eksterne søgninger. Vælg datoer, og tjek ledighed hos udbyderen. Ingen partnerprovision er tilsluttet.
Extra driving estimates are for each stop added on its own. Update the route to calculate the selected stops together. Visiting and hiking time is additional.|Ekstra kjøretid anslås for hvert stopp alene. Oppdater ruten for å beregne valgte stopp samlet. Besøk og fotturer kommer i tillegg.|Додатковий час розраховано окремо для кожної зупинки. Оновіть маршрут для спільного розрахунку. Час на огляд і походи не враховано.|Extra körtid uppskattas för varje stopp separat. Uppdatera rutten för att beräkna valda stopp tillsammans. Besök och vandring tillkommer.|Ekstra køretid anslås for hvert stop separat. Opdater ruten for at beregne valgte stop samlet. Besøg og vandring kommer oveni.
Finding stops uses Kartverket and OSRM / OpenStreetMap to look up your starting point and calculate the road route. Your origin is not saved. Google Maps opens when you choose a navigation link.|Kartverket og OSRM / OpenStreetMap brukes til å finne startpunktet og beregne kjøreruten. Startpunktet lagres ikke. Google Maps åpnes når du velger en navigasjonslenke.|Kartverket та OSRM / OpenStreetMap визначають початкову точку й розраховують маршрут. Початкова точка не зберігається. Google Maps відкриється після натискання посилання навігації.|Kartverket och OSRM / OpenStreetMap används för att hitta startpunkten och beräkna körrutten. Startpunkten sparas inte. Google Maps öppnas när du väljer en navigeringslänk.|Kartverket og OSRM / OpenStreetMap bruges til at finde startpunktet og beregne køreruten. Startpunktet gemmes ikke. Google Maps åbnes, når du vælger et navigationslink.
Update the route to recalculate distance and driving time.|Oppdater ruten for å beregne avstand og kjøretid på nytt.|Оновіть маршрут, щоб перерахувати відстань і час.|Uppdatera rutten för att räkna om avstånd och körtid.|Opdater ruten for at genberegne afstand og køretid.
No other catalog places were found with a reasonable road detour. Try a suggested road trip or another destination.|Ingen andre steder i utvalget ble funnet med en rimelig omvei. Prøv en foreslått biltur eller et annet reisemål.|Інших місць із прийнятним об’їздом не знайдено. Спробуйте готовий маршрут або інше місце.|Inga andra platser hittades med en rimlig omväg. Prova en föreslagen bilresa eller ett annat resmål.|Ingen andre steder blev fundet med en rimelig omvej. Prøv en foreslået biltur eller et andet rejsemål.
The trip is split into legs so every selected stop works with mobile Google Maps.|Turen er delt i etapper slik at alle valgte stopp fungerer i Google Maps på mobil.|Подорож поділена на етапи, щоб усі зупинки працювали в мобільному Google Maps.|Resan är uppdelad i etapper så att alla valda stopp fungerar i Google Maps på mobilen.|Turen er opdelt i etaper, så alle valgte stop fungerer i Google Maps på mobilen.
No places match this selection. Try another name or choose All journeys.|Ingen steder passer med dette utvalget. Prøv et annet navn eller velg Alle reiser.|За цим запитом місць не знайдено. Спробуйте іншу назву або оберіть Усі подорожі.|Inga platser matchar detta urval. Prova ett annat namn eller välj Alla resor.|Ingen steder matcher dette udvalg. Prøv et andet navn, eller vælg Alle rejser.
Independent portfolio demonstration · No payments or real bookings. Enquiries are emailed only when you confirm.|Uavhengig porteføljedemo · Ingen betalinger eller ekte bestillinger. Henvendelser sendes på e-post bare når du bekrefter.|Незалежний демонстраційний проєкт · Без платежів і реальних бронювань. Звернення надсилаються електронною поштою лише після вашого підтвердження.|Oberoende portföljdemo · Inga betalningar eller riktiga bokningar. Förfrågningar skickas via e-post först när du bekräftar.|Uafhængig porteføljedemo · Ingen betalinger eller rigtige bookinger. Henvendelser sendes kun via e-mail, når du bekræfter.
Destination references are provided for context. Check official advice before real travel.|Reisemålskilder er gitt som bakgrunn. Sjekk offisielle råd før en faktisk reise.|Джерела про місця наведено для ознайомлення. Перед подорожжю перевірте офіційні рекомендації.|Resmålskällor anges som bakgrund. Kontrollera officiella råd före en verklig resa.|Kilder om rejsemål gives som baggrund. Tjek officielle råd før en rigtig rejse.
BUILT TO BE UNDERSTOOD.|LAGET FOR Å FORSTÅS.|СТВОРЕНО ДЛЯ ЗРОЗУМІЛОСТІ.|BYGGT FÖR ATT FÖRSTÅS.|BYGGET TIL AT BLIVE FORSTÅET.
`);
addRows(`
Continue on foot. Check parking and shuttle access with the operator.|Fortsett til fots. Sjekk parkering og skytteltransport med operatøren.|Далі пішки. Уточніть паркування й трансфер в оператора.|Fortsätt till fots. Kontrollera parkering och transfer med operatören.|Fortsæt til fods. Tjek parkering og shuttle med operatøren.
Road access to Fossli; continue on foot to the viewing platforms.|Kjør til Fossli; fortsett til fots til utsiktsplattformene.|Їдьте до Fossli, далі пішки до оглядових майданчиків.|Kör till Fossli; fortsätt till fots till utsiktsplattformarna.|Kør til Fossli; fortsæt til fods til udsigtsplatformene.
Geiranger belongs to Stranda municipality.|Geiranger ligger i Stranda kommune.|Geiranger належить до комуни Stranda.|Geiranger ligger i Stranda kommun.|Geiranger ligger i Stranda kommune.
Continue on foot. There is no road to the summit.|Fortsett til fots. Det er ingen vei til toppen.|Далі пішки. Автодороги на вершину немає.|Fortsätt till fots. Det finns ingen väg till toppen.|Fortsæt til fods. Der er ingen vej til toppen.
Lofoten spans several municipalities. This badge represents Moskenes, the municipality of the selected gateway Reine.|Lofoten omfatter flere kommuner. Våpenet tilhører Moskenes, kommunen der det valgte startpunktet Reine ligger.|Lofoten охоплює кілька комун. Тут герб Moskenes, де розташована вибрана точка Reine.|Lofoten omfattar flera kommuner. Vapnet tillhör Moskenes, kommunen för den valda utgångspunkten Reine.|Lofoten omfatter flere kommuner. Våbnet tilhører Moskenes, kommunen for det valgte udgangspunkt Reine.
Road access to Gudvangen; continue along the fjord by boat.|Kjør til Gudvangen; fortsett med båt langs fjorden.|Їдьте до Gudvangen; далі вздовж фіорду човном.|Kör till Gudvangen; fortsätt längs fjorden med båt.|Kør til Gudvangen; fortsæt langs fjorden med båd.
The pin identifies the waterfall. Use designated roadside parking and continue on foot.|Markøren viser fossen. Bruk anvist parkering ved veien og fortsett til fots.|Позначено водоспад. Зупиняйтеся на визначеній парковці й далі йдіть пішки.|Markören visar vattenfallet. Använd anvisad parkering och fortsätt till fots.|Markøren viser vandfaldet. Brug anvist parkering ved vejen, og fortsæt til fods.
The road crosses Averøy and Hustadvika. This badge represents Averøy, the municipality of the selected stop.|Veien krysser Averøy og Hustadvika. Våpenet tilhører Averøy, kommunen for det valgte stoppet.|Дорога проходить через Averøy і Hustadvika. Герб належить Averøy, де вибрано зупинку.|Vägen går genom Averøy och Hustadvika. Vapnet tillhör Averøy, kommunen för det valda stoppet.|Vejen krydser Averøy og Hustadvika. Våbnet tilhører Averøy, kommunen for det valgte stop.
Senja island is much larger than this selected gateway.|Senja er mye større enn dette valgte startpunktet.|Острів Senja значно більший за вибрану точку доступу.|Ön Senja är mycket större än denna valda utgångspunkt.|Øen Senja er meget større end dette valgte udgangspunkt.
Route to the city, not to a specific northern-lights viewing site.|Ruten går til byen, ikke til et bestemt sted for nordlys.|Маршрут веде до міста, а не до конкретного місця спостереження за сяйвом.|Rutten går till staden, inte till en särskild norrskensplats.|Ruten går til byen, ikke til et bestemt sted at se nordlys.
Use designated parking in Reine, then walk to the steps.|Bruk anvist parkering i Reine, og gå deretter til trappen.|Скористайтеся визначеною парковкою в Reine, далі пішки до сходів.|Använd anvisad parkering i Reine och gå sedan till trappan.|Brug anvist parkering i Reine, og gå derefter til trappen.
Continue on foot to the viewpoint.|Fortsett til fots til utsiktspunktet.|Далі пішки до оглядового майданчика.|Fortsätt till fots till utsiktsplatsen.|Fortsæt til fods til udsigtspunktet.
There is no normal road access to Kjosfossen. Continue by Flåmsbana train, which stops at the waterfall.|Det er ingen vanlig bilvei til Kjosfossen. Reis med Flåmsbana, som stopper ved fossen.|Звичайної автодороги до Kjosfossen немає. Їдьте потягом Flåmsbana, який зупиняється біля водоспаду.|Det finns ingen vanlig bilväg till Kjosfossen. Ta Flåmsbana som stannar vid vattenfallet.|Der er ingen almindelig bilvej til Kjosfossen. Tag Flåmsbana, der stopper ved vandfaldet.
The pin identifies the waterfall. Stop only in designated areas along the busy road.|Markøren viser fossen. Stopp bare på anviste steder langs den trafikkerte veien.|Позначено водоспад. Зупиняйтеся лише у визначених місцях біля жвавої дороги.|Markören visar vattenfallet. Stanna bara på anvisade platser längs den trafikerade vägen.|Markøren viser vandfaldet. Stop kun på anviste steder langs den trafikerede vej.
Continue by the local access road, on foot or by seasonal boat. Glacier walks require a guide.|Fortsett langs adkomstveien, til fots eller med sesongbåt. Brevandring krever guide.|Далі місцевою дорогою, пішки або сезонним човном. Для походу льодовиком потрібен гід.|Fortsätt längs tillfartsvägen, till fots eller med säsongsbåt. Glaciärvandring kräver guide.|Fortsæt ad adgangsvejen, til fods eller med sæsonbåd. Gletsjervandring kræver guide.
Mountain-road access. Check seasonal conditions and parking restrictions.|Adkomst via fjellvei. Sjekk sesongforhold og parkeringsregler.|Доступ гірською дорогою. Перевірте сезонні умови й правила паркування.|Tillfart via fjällväg. Kontrollera säsongsförhållanden och parkeringsregler.|Adgang via bjergvej. Tjek sæsonforhold og parkeringsregler.
Road access depends on season, weather and closures. Check current road status before departure.|Veiadkomst avhenger av sesong, vær og stengninger. Sjekk veistatus før avreise.|Доступ залежить від сезону, погоди й перекриттів. Перевірте стан дороги перед виїздом.|Vägtillgång beror på säsong, väder och avstängningar. Kontrollera vägstatus före avresa.|Vejadgang afhænger af sæson, vejr og lukninger. Tjek vejstatus før afgang.
Take the seasonal hiking bus to Venjedalssetra, then hike back to Åndalsnes. This route ends at the town, not on the ridge.|Ta sesongbussen til Venjedalssetra og gå tilbake til Åndalsnes. Denne ruten ender i byen, ikke på fjellryggen.|Їдьте сезонним автобусом до Venjedalssetra, потім пішки до Åndalsnes. Цей маршрут закінчується в місті, не на хребті.|Ta säsongsbussen till Venjedalssetra och vandra tillbaka till Åndalsnes. Denna rutt slutar i staden, inte på bergskammen.|Tag sæsonbussen til Venjedalssetra, og gå tilbage til Åndalsnes. Denne rute slutter i byen, ikke på bjergkammen.
Continue on foot, or take the seasonal boat to Memurubu first. Check bookings and season.|Fortsett til fots, eller ta sesongbåten til Memurubu først. Sjekk bestilling og sesong.|Далі пішки або спочатку сезонним човном до Memurubu. Перевірте бронювання й сезон.|Fortsätt till fots eller ta säsongsbåten till Memurubu först. Kontrollera bokning och säsong.|Fortsæt til fods, eller tag først sæsonbåden til Memurubu. Tjek bestilling og sæson.
Jotunheimen spans several municipalities. This badge represents Vågå, the municipality of the selected gateway.|Jotunheimen omfatter flere kommuner. Våpenet tilhører Vågå, kommunen for det valgte startpunktet.|Jotunheimen охоплює кілька комун. Тут герб Vågå, комуни вибраної точки доступу.|Jotunheimen omfattar flera kommuner. Vapnet tillhör Vågå, kommunen för den valda utgångspunkten.|Jotunheimen omfatter flere kommuner. Våbnet tilhører Vågå, kommunen for det valgte udgangspunkt.
Road access to the valley; continue on foot or by local transport to the glacier viewpoint.|Kjør til dalen; fortsett til fots eller med lokaltransport til utsiktspunktet ved breen.|Їдьте до долини; далі пішки або місцевим транспортом до оглядового майданчика біля льодовика.|Kör till dalen; fortsätt till fots eller med lokal transport till glaciärens utsiktsplats.|Kør til dalen; fortsæt til fods eller med lokal transport til gletsjerens udsigtspunkt.
Herøy municipality in Møre og Romsdal, not Herøy in Nordland.|Herøy kommune i Møre og Romsdal, ikke Herøy i Nordland.|Комуна Herøy у Møre og Romsdal, не Herøy у Nordland.|Herøy kommun i Møre og Romsdal, inte Herøy i Nordland.|Herøy kommune i Møre og Romsdal, ikke Herøy i Nordland.
Andøya is the island; Andøy is the municipality.|Andøya er øya; Andøy er kommunen.|Andøya — острів; Andøy — комуна.|Andøya är ön; Andøy är kommunen.|Andøya er øen; Andøy er kommunen.
Svalbard is not a municipality. Travel from mainland Norway requires a flight or ship; there is no driving route.|Svalbard er ikke en kommune. Fra fastlandet må du reise med fly eller båt; det finnes ingen kjørerute.|Svalbard не є комуною. З материкової Норвегії потрібно летіти або пливти; автомобільного маршруту немає.|Svalbard är ingen kommun. Från fastlandet krävs flyg eller fartyg; det finns ingen körrutt.|Svalbard er ikke en kommune. Fra fastlandet kræves fly eller skib; der er ingen kørerute.
Hardangervidda spans several municipalities. This badge represents Hol, the municipality of the selected gateway Geilo.|Hardangervidda omfatter flere kommuner. Våpenet tilhører Hol, kommunen der det valgte startpunktet Geilo ligger.|Hardangervidda охоплює кілька комун. Тут герб Hol, де розташована вибрана точка Geilo.|Hardangervidda omfattar flera kommuner. Vapnet tillhör Hol, kommunen för den valda utgångspunkten Geilo.|Hardangervidda omfatter flere kommuner. Våbnet tilhører Hol, kommunen for det valgte udgangspunkt Geilo.
Incorrect username or password.|Feil brukernavn eller passord.|Неправильне ім’я користувача або пароль.|Fel användarnamn eller lösenord.|Forkert brugernavn eller adgangskode.
This username is already taken.|Brukernavnet er allerede i bruk.|Це ім’я користувача вже зайняте.|Användarnamnet är redan taget.|Brugernavnet er allerede taget.
Too many login attempts. Try again in 15 minutes.|For mange innloggingsforsøk. Prøv igjen om 15 minutter.|Забагато спроб входу. Спробуйте через 15 хвилин.|För många inloggningsförsök. Försök igen om 15 minuter.|For mange loginforsøg. Prøv igen om 15 minutter.
Please log in first.|Logg inn først.|Спочатку увійдіть.|Logga in först.|Log ind først.
Password must contain 8–256 characters.|Passordet må ha 8–256 tegn.|Пароль має містити 8–256 символів.|Lösenordet måste innehålla 8–256 tecken.|Adgangskoden skal indeholde 8–256 tegn.
`);
/* Guide vocabulary; accommodation reservations remain with external providers. */
addRows(`
Places|Steder|Місця|Platser|Steder
External search. Choose dates and check prices and availability with the provider. Reservations are completed on their website.|Eksternt søk. Velg datoer og sjekk priser og tilgjengelighet hos tilbyderen. Bestillingen gjennomføres på deres nettside.|Зовнішній пошук. Оберіть дати й перевірте ціни та наявність у постачальника. Бронювання завершується на його сайті.|Extern sökning. Välj datum och kontrollera priser och tillgänglighet hos leverantören. Bokningen slutförs på deras webbplats.|Ekstern søgning. Vælg datoer og tjek priser og ledighed hos udbyderen. Bookingen afsluttes på deres hjemmeside.
All places|Alle steder|Усі місця|Alla platser|Alle steder
Explore this place|Utforsk dette stedet|Дізнатися про місце|Utforska denna plats|Udforsk dette sted
NORWAY GUIDE|NORGESGUIDE|ПУТІВНИК НОРВЕГІЄЮ|NORGEGUIDE|NORGESGUIDE
DISCOVER NORWAY · NEAR & FAR|OPPDAG NORGE · NÆRT OG FJERNT|ВІДКРИЙТЕ НОРВЕГІЮ · ПОРУЧ І ДАЛІ|UPPTÄCK NORGE · NÄRA OCH LÅNGT BORT|OPLEV NORGE · NÆRT OG FJERNT
Discover places nearby|Oppdag steder i nærheten|Відкрийте місця поруч|Upptäck platser i närheten|Opdag steder i nærheden
PLACES TO DISCOVER / NORWAY|STEDER Å OPPDAGE / NORGE|МІСЦЯ ДЛЯ ВІДКРИТТІВ / НОРВЕГІЯ|PLATSER ATT UPPTÄCKA / NORGE|STEDER AT OPDAGE / NORGE
Choose a place, then plan your own visit.|Velg et sted, og planlegg ditt eget besøk.|Оберіть місце та сплануйте власну подорож.|Välj en plats och planera ditt eget besök.|Vælg et sted, og planlæg dit eget besøg.
No places match this selection. Try another name or choose All places.|Ingen steder passer med dette utvalget. Prøv et annet navn eller velg Alle steder.|За цим запитом місць не знайдено. Спробуйте іншу назву або оберіть Усі місця.|Inga platser matchar detta urval. Prova ett annat namn eller välj Alla platser.|Ingen steder matcher dette udvalg. Prøv et andet navn, eller vælg Alle steder.
`);
let language='nb';try{const saved=localStorage.getItem('fjordflow.language');if(dictionaries[saved])language=saved}catch{}
const originals=new WeakMap(),attributes=new WeakMap(),reverse=new Map();
function rebuildReverse(){reverse.clear();for(const d of Object.values(dictionaries))for(const [en,value] of Object.entries(d))if(!reverse.has(value))reverse.set(value,en)}rebuildReverse();
const skip='script,style,textarea,input,[data-i18n-ignore],[translate="no"],.post-body,.post-meta,.community-post h3,.creator-credit a';
function t(text){const raw=String(text??''),key=raw.trim(),source=reverse.get(key)||key;let out=dictionaries[language][source];if(out===undefined){out=dynamic(source,language);if(out===undefined)return raw}return raw.slice(0,raw.indexOf(key))+out+raw.slice(raw.indexOf(key)+key.length)}
function dynamic(s,l){const vals=(en,nb,uk,sv,da)=>({en,nb,uk,sv,da}[l]);let m;
if(m=s.match(/^(\d+) (?:places|journeys)$/))return vals(`${m[1]} places`,`${m[1]} steder`,`${m[1]} місць`,`${m[1]} platser`,`${m[1]} steder`);
if(m=s.match(/^(.*?)(\d+) of (\d+) seats$/))return vals(s,`${m[1]}${m[2]} av ${m[3]} plasser`,`${m[1]}${m[2]} з ${m[3]} місць`,`${m[1]}${m[2]} av ${m[3]} platser`,`${m[1]}${m[2]} af ${m[3]} pladser`);
if(m=s.match(/^(\d+) selected stops · \+(\d+) min vs\. direct · driving only$/))return vals(s,`${m[1]} valgte stopp · +${m[2]} min mot direkte rute · kun kjøring`,`${m[1]} зупинок · +${m[2]} хв проти прямого шляху · лише їзда`,`${m[1]} valda stopp · +${m[2]} min mot direkt rutt · endast körning`,`${m[1]} valgte stop · +${m[2]} min mod direkte rute · kun kørsel`);
if(m=s.match(/^(\d+) stops selected$/))return vals(s,`${m[1]} stopp valgt`,`${m[1]} зупинок вибрано`,`${m[1]} stopp valda`,`${m[1]} stop valgt`);
if(m=s.match(/^About \+(\d+) min driving$/))return vals(s,`Omtrent +${m[1]} min kjøring`,`Приблизно +${m[1]} хв їзди`,`Cirka +${m[1]} min körning`,`Omkring +${m[1]} min kørsel`);
if(m=s.match(/^(Explore |To: |View photographs of |View photograph |Fly over |Watch a visit to |Start trip · |Continue trip · |Same access point: )(.*)$/)){const pref={'Explore ':['Utforsk ','Докладніше: ','Utforska ','Udforsk '],'To: ':['Til: ','До: ','Till: ','Til: '],'View photographs of ':['Se fotografier av ','Переглянути фото ','Se fotografier av ','Se fotografier af '],'View photograph ':['Se fotografi ','Переглянути фото ','Se fotografi ','Se fotografi '],'Fly over ':['Fly over ','Політ над ','Flyg över ','Flyv over '],'Watch a visit to ':['Se et besøk til ','Відеопрогулянка: ','Se ett besök till ','Se et besøg til '],'Start trip · ':['Start turen · ','Почати подорож · ','Starta resan · ','Start turen · '],'Continue trip · ':['Fortsett turen · ','Продовжити подорож · ','Fortsätt resan · ','Fortsæt turen · '],'Same access point: ':['Samme adkomstpunkt: ','Спільна точка доступу: ','Samma tillfartspunkt: ','Samme adgangssted: ']}[m[1]];return l==='en'?s:pref[['nb','uk','sv','da'].indexOf(l)]+m[2]}
if(m=s.match(/^(.*) · Original soundtrack$/))return m[1]+' · '+vals('Original soundtrack','Originalt lydspor','Оригінальна звукова доріжка','Originalljud','Originalt lydspor');
if(m=s.match(/^(.*) per guest · (\d+) seats available$/))return vals(s,`${m[1]} per gjest · ${m[2]} ledige plasser`,`${m[1]} за гостя · ${m[2]} вільних місць`,`${m[1]} per gäst · ${m[2]} lediga platser`,`${m[1]} pr. gæst · ${m[2]} ledige pladser`);
if(m=s.match(/^(.*) \/ 5 · (\d+) visitor reviews$/))return vals(s,`${m[1]} / 5 · ${m[2]} omtaler`,`${m[1]} / 5 · ${m[2]} відгуків`,`${m[1]} / 5 · ${m[2]} recensioner`,`${m[1]} / 5 · ${m[2]} anmeldelser`);
}
function textNode(node){if(node.parentElement?.closest(skip)||node.parentElement?.closest('#postTitle')&&typeof replyTo!=='undefined'&&replyTo)return;const current=node.nodeValue;let state=originals.get(node);if(!state||current!==state.output){state={source:current,output:current};originals.set(node,state)}const translated=t(state.source);if(current!==translated)node.nodeValue=translated;state.output=translated}
function apply(root=document.body){if(!root||root.closest?.(skip))return;observer.disconnect();try{if(root.nodeType===3)textNode(root);else{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walk.nextNode())textNode(walk.currentNode);const els=root.querySelectorAll?.('[placeholder],[aria-label],[title]')||[];for(const el of els){if(el.closest(skip.replace('textarea,input,','')))continue;let state=attributes.get(el);if(!state){state={};attributes.set(el,state)}for(const attr of ['placeholder','aria-label','title']){if(!el.hasAttribute(attr))continue;const now=el.getAttribute(attr);if(!state[attr]||now!==state[attr].output)state[attr]={source:now,output:now};const out=t(state[attr].source);if(now!==out)el.setAttribute(attr,out);state[attr].output=out}}}}finally{observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']})}}
let pending=false;const observer=new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;apply()})}});
function setLanguage(lang){if(!dictionaries[lang])return;language=lang;document.documentElement.lang=lang;document.title=t('FJORD / FLOW — Norway, beautifully connected');try{localStorage.setItem('fjordflow.language',lang)}catch{}const select=document.getElementById('siteLanguage');if(select)select.value=lang;apply();window.dispatchEvent(new CustomEvent('fjord:language',{detail:{language:lang}}));window.dispatchEvent(new CustomEvent('fjordlanguagechange',{detail:{language:lang}}))}
window.FjordI18n={t,apply,setLanguage,get language(){return language}};
const select=document.getElementById('siteLanguage');if(select){select.value=language;select.addEventListener('change',e=>setLanguage(e.target.value))}setLanguage(language);
})();
