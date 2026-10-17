/* Small, source-checked road journeys. City points are meeting areas, not parking guarantees. */
((root)=>{'use strict';
 const copy=values=>Object.fromEntries(['en','nb','uk','sv','da'].map((language,i)=>[language,values[i]]));
 const photos=[
  {image:'./images/catalog/sorlandet-lindesnes-day.jpg',title:'Lindesnes fyr',author:'Christian Schuster',license:'CC BY-SA 3.0 no',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/no/deed.en',source:'https://commons.wikimedia.org/wiki/File:Lindesnes_Fyr.jpg'},
  {image:'./images/catalog/sorlandet-sjosanden.jpg',title:'Sjøsanden · Mandal',author:'Yosh3000',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0/',source:'https://commons.wikimedia.org/wiki/File:Sjosanden_fra_piren.JPG'},
  {image:'./images/catalog/sorlandet-lindesnes-coast.jpg',title:'Lindesnes · kysten',author:'Ssu',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',source:'https://commons.wikimedia.org/wiki/File:Lindesnes_fyr_-_utsikt_(4).jpg'}
 ];
 const routes={sorlandet:{
  label:'SØRLANDET · AGDER',
  title:copy(['White towns and the southern cape','Hvite byer og sørspissen','Білі містечка й південний мис','Vita städer och sydspetsen','Hvide byer og sydspidsen']),
  summary:copy(['Kristiansand · Mandal · Lindesnes · allow 2–3 days','Kristiansand · Mandal · Lindesnes · sett av 2–3 dager','Kristiansand · Mandal · Lindesnes · плануйте 2–3 дні','Kristiansand · Mandal · Lindesnes · avsätt 2–3 dagar','Kristiansand · Mandal · Lindesnes · afsæt 2–3 dage']),
  checkedAt:'2026-10-18',photos,optionalExperienceIds:[],
  points:[
   {id:'sorlandet-kristiansand',name:'Kristiansand · Posebyen / Fiskebrygga',latitude:58.14615,longitude:7.99573,extra:true,local:true,routeQuery:'Kristiansand sentrum, Norway',website:'https://en.visitsorlandet.com/listing/city-walk-in-kristiansand/140287301/',
    description:copy(['Day 1: leave time for Posebyen’s wooden streets and the harbour walk via Fiskebrygga. The city marker is an orientation point: choose a signed public car park and explore on foot. Stay in Kristiansand or Mandal; accommodation is not included.','Dag 1: sett av tid til trehusgatene i Posebyen og havnepromenaden via Fiskebrygga. Bypunktet er til orientering: velg en skiltet offentlig parkeringsplass og gå videre til fots. Overnatt i Kristiansand eller Mandal; overnatting er ikke inkludert.','День 1: залиште час на дерев’яні вулички Posebyen та набережну через Fiskebrygga. Міська позначка — для орієнтиру: оберіть громадську парковку за знаками, далі гуляйте пішки. Ночуйте в Kristiansand або Mandal; житло не включено.','Dag 1: avsätt tid för trähusgatorna i Posebyen och hamnpromenaden via Fiskebrygga. Stadspunkten är för orientering: välj skyltad allmän parkering och fortsätt till fots. Övernatta i Kristiansand eller Mandal; boende ingår inte.','Dag 1: afsæt tid til træhusgaderne i Posebyen og havnepromenaden via Fiskebrygga. Bypunktet er til orientering: vælg skiltet offentlig parkering og fortsæt til fods. Overnat i Kristiansand eller Mandal; overnatning er ikke inkluderet.'])},
   {id:'sorlandet-mandal',name:'Mandal · Sjøsanden',latitude:58.02682,longitude:7.45347,extra:true,local:true,routeQuery:'Mandal sentrum, Norway',website:'https://en.visitsorlandet.com/destinations/mandal-lindesnes/',
    description:copy(['Day 2: stroll along Mandal’s river and white wooden houses, then walk to Sjøsanden beach. The road route stops in town, not on the sand. Add a food stop and check local parking signs; swimming depends on weather and conditions.','Dag 2: rusle langs elva og de hvite trehusene i Mandal, og gå videre til Sjøsanden. Bilruten stopper i byen, ikke på stranden. Legg inn en matpause og sjekk lokale parkeringsskilt; bading avhenger av vær og forhold.','День 2: прогуляйтеся вздовж річки та білих дерев’яних будинків Mandal, потім до пляжу Sjøsanden. Автомаршрут веде в місто, а не на пісок. Залиште час на обід, перевірте знаки парковки; купання залежить від погоди й умов.','Dag 2: promenera längs älven och de vita trähusen i Mandal och vidare till Sjøsanden. Bilrutten stannar i staden, inte på sanden. Lägg in en matpaus och kontrollera parkeringsskyltar; bad beror på väder och förhållanden.','Dag 2: gå langs elven og de hvide træhuse i Mandal og videre til Sjøsanden. Bilruten stopper i byen, ikke på sandet. Afsæt tid til mad og tjek parkeringsskilte; badning afhænger af vejr og forhold.'])},
   {id:'sorlandet-lindesnes',name:'Lindesnes fyr',latitude:57.98229486990713,longitude:7.047650772711434,extra:true,local:true,routeQuery:'Lindesnes fyr, Lindesnesveien 1139, 4521 Lindesnes',website:'https://lindesnesfyr.no/',
    description:copy(['Day 2 or 3: follow the mainland road to Lindesnes Lighthouse, then walk from the visitor parking area. Allow time for the museum and coastal views. Check current admission, opening hours and wind; stay back from wet rocks and the water’s edge. The itinerary ends here: plan your return or overnight stay separately.','Dag 2 eller 3: følg fastlandsveien til Lindesnes fyr, og gå fra besøksparkeringen. Sett av tid til museet og kystutsikten. Sjekk billetter, åpningstider og vind; hold avstand til våte svaberg og sjøkanten. Ruten slutter her: planlegg retur eller overnatting separat.','День 2 або 3: їдьте материковою дорогою до Lindesnes fyr, далі пішки від гостьової парковки. Залиште час на музей і морські краєвиди. Перевірте квитки, години роботи й вітер; уникайте мокрих скель та краю води. Маршрут закінчується тут: повернення або ночівлю плануйте окремо.','Dag 2 eller 3: följ fastlandsvägen till Lindesnes fyr och gå från besöksparkeringen. Avsätt tid för museet och kustutsikten. Kontrollera biljetter, öppettider och vind; håll avstånd till våta klippor och vattenbrynet. Rutten slutar här: planera retur eller övernattning separat.','Dag 2 eller 3: følg fastlandsvejen til Lindesnes fyr og gå fra besøgsparkeringen. Afsæt tid til museet og kystudsigten. Tjek billetter, åbningstider og vind; hold afstand til våde klipper og vandkanten. Ruten slutter her: planlæg retur eller overnatning separat.'])}
  ],
  sources:['https://en.visitsorlandet.com/listing/city-walk-in-kristiansand/140287301/','https://en.visitsorlandet.com/destinations/mandal-lindesnes/','https://lindesnesfyr.no/','https://ws.geonorge.no/stedsnavn/v1/navn?sok=Kristiansand&fuzzy=false&utkoordsys=4258&treffPerSide=5','https://ws.geonorge.no/stedsnavn/v1/navn?sok=Mandal&fuzzy=false&utkoordsys=4258&treffPerSide=5','https://ws.geonorge.no/adresser/v1/sok?sok=Lindesnesveien%201139&treffPerSide=5&utkoordsys=4258']
 }};
 routes.oslofjord={
  label:'OSLO · OSLOFJORD',navigationOnly:true,checkedAt:'2026-10-18',optionalExperienceIds:[],
  title:copy(['Oslo: marble and the sea','Oslo: marmor og sjø','Осло: мармур і море','Oslo: marmor och hav','Oslo: marmor og hav']),
  summary:copy(['Bjørvika · Opera waterfront · Huk / Bygdøy · a relaxed day','Bjørvika · Operaen ved fjorden · Huk / Bygdøy · en rolig dag','Bjørvika · набережна опери · Huk / Bygdøy · неспішний день','Bjørvika · Operans strandpromenad · Huk / Bygdøy · en lugn dag','Bjørvika · Operaens havnefront · Huk / Bygdøy · en rolig dag']),
  photos:[
   {image:'./images/catalog/oslo-opera.webp',title:'Operahuset · Bjørvika',author:'Pierre Blaché',license:'CC0 1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',source:'https://commons.wikimedia.org/wiki/File:Oslo_Opera_House_-_2025.jpg'},
   {image:'./images/catalog/oslo-huk.webp',title:'Huk · Bygdøy',author:'Ryan Hodnett',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',source:'https://commons.wikimedia.org/wiki/File:Huk_-_Oslo,_Norway_2020-08-12.jpg'}
  ],
  points:[
   {id:'oslofjord-opera-arrival',name:'Bjørvika · Operahuset',latitude:59.90739244358862,longitude:10.757032202609812,extra:true,local:true,coordinatePrecision:'area',routeQuery:'Operagata P-hus, Oslo, Norway',website:'https://onepark.no/parkering/oslo/operagata-p-hus/',description:copy([
    'Start at Operagata P-hus, then walk to the Opera waterfront and explore Bjørvika. Follow signs and roof closures. The marker uses a street-address position, not the garage entrance; open Google Maps for the actual driving approach and check parking prices.',
    'Start ved Operagata P-hus og gå til Operaen og Bjørvika. Følg skilting og eventuelle sperringer på taket. Markøren bruker et adressepunkt, ikke garasjeinnkjørselen; åpne Google Maps for kjøreveien og sjekk parkeringsprisene.',
    'Почніть з Operagata P-hus, далі пішки до опери й набережної Bjørvika. Дотримуйтеся знаків і обмежень на даху. Позначка — адресна точка, не в’їзд у гараж: автомобільний під’їзд і тарифи парковки перевірте в Google Maps та оператора.',
    'Börja vid Operagata P-hus och gå till Operan och Bjørvika. Följ skyltar och eventuella takavspärrningar. Markören är en adresspunkt, inte garageinfarten; öppna Google Maps för körvägen och kontrollera parkeringspriserna.',
    'Start ved Operagata P-hus og gå til Operaen og Bjørvika. Følg skilte og eventuelle afspærringer på taget. Markøren er et adressepunkt, ikke garageindkørslen; åbn Google Maps for kørselsvejen og tjek parkeringspriserne.'
   ])},
   {id:'oslofjord-huk',name:'Huk · Bygdøy',latitude:59.89536,longitude:10.67666,extra:true,local:true,coordinatePrecision:'area',routeQuery:'Huk parkeringsplass, Oslo, Norway',website:'https://www.oslo.kommune.no/natur-kultur-og-fritid/tur-og-friluftsliv/badeplasser/huk/',description:copy([
    'Drive to the named Huk parking area on Bygdøy, then walk the final stretch to the lawns, beach and coastal trails. Parking is limited. This marker shows the beach area, not a car entrance; Google Maps resolves the named parking destination. Check bathing-water advice before swimming.',
    'Kjør til Huk parkeringsplass på Bygdøy og gå siste strekning til gressplenene, stranden og kyststiene. Parkeringen er begrenset. Markøren viser strandområdet, ikke en bilinnkjørsel; Google Maps finner den navngitte parkeringsplassen. Sjekk badevannsinformasjon før bading.',
    'Їдьте до Huk parkeringsplass на Bygdøy, далі пішки до галявин, пляжу й прибережних стежок. Місць для авто небагато. Позначка показує пляж, а не в’їзд: Google Maps визначить названу парковку. Перед купанням перевірте інформацію про якість води.',
    'Kör till Huk parkeringsplass på Bygdøy och gå sista biten till gräsmattorna, stranden och kuststigarna. Parkeringen är begränsad. Markören visar strandområdet, inte en bilinfart; Google Maps hittar den namngivna parkeringen. Kontrollera badvatteninformationen före bad.',
    'Kør til Huk parkeringsplass på Bygdøy og gå det sidste stykke til græsarealer, strand og kyststier. Parkeringen er begrænset. Markøren viser strandområdet, ikke en bilindkørsel; Google Maps finder den navngivne parkeringsplads. Tjek badevandsinformationen før badning.'
   ])}
  ],
  sources:['https://onepark.no/parkering/oslo/operagata-p-hus/','https://www.oslo.kommune.no/natur-kultur-og-fritid/tur-og-friluftsliv/badeplasser/huk/','https://ws.geonorge.no/adresser/v1/sok?sok=Operagata%2022%20Oslo&treffPerSide=5','https://ws.geonorge.no/stedsnavn/v1/navn?sok=Huk&treffPerSide=5']
 };
 routes.agdercoast={
  label:'SØRLANDSKYSTEN · AGDER',checkedAt:'2026-10-18',optionalExperienceIds:[],
  title:copy(['Four harbour towns, at your own pace','Fire havnebyer i rolig tempo','Чотири портові містечка без поспіху','Fyra hamnstäder i lugn takt','Fire havnebyer i roligt tempo']),
  summary:copy(['Lillesand · Grimstad · Arendal · Risør · allow 3–4 days','Lillesand · Grimstad · Arendal · Risør · sett av 3–4 dager','Lillesand · Grimstad · Arendal · Risør · плануйте 3–4 дні','Lillesand · Grimstad · Arendal · Risør · avsätt 3–4 dagar','Lillesand · Grimstad · Arendal · Risør · afsæt 3–4 dage']),
  photos:[
   {image:'./images/catalog/eastcoast-lillesand.webp',title:'Lillesand · havnen',author:'Jan-Tore Egge',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0',source:'https://commons.wikimedia.org/wiki/File:Lillesand_havn.jpg'},
   {image:'./images/catalog/eastcoast-grimstad.webp',title:'Grimstad · havnen',author:'Havstad112',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0',source:'https://commons.wikimedia.org/wiki/File:Grimstad1.jpeg'},
   {image:'./images/catalog/eastcoast-arendal.webp',title:'Arendal · Pollen',author:'YosemiteYamper',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0',source:'https://commons.wikimedia.org/wiki/File:Pollen_panorama,_Arendal.jpg'},
   {image:'./images/catalog/eastcoast-risor.webp',title:'Risør · havnen',author:'Zairon',license:'CC BY-SA 3.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/3.0',source:'https://commons.wikimedia.org/wiki/File:Risör_Hafen_2.JPG'}
  ],
  points:[
   {id:'agdercoast-lillesand',name:'Lillesand · havnen',latitude:58.24945,longitude:8.37719,extra:true,local:true,coordinatePrecision:'area',routeQuery:'Lillesand sentrum, Norway',website:'https://www.visitsorlandet.com/destinasjoner/lillesand/',description:copy([
    'Day 1: begin with Lillesand’s harbour and white wooden streets. Leave the car in a signed public car park and explore on foot; the town marker is not a reserved parking space. Stay locally before continuing east. Boat trips through Blindleia are optional and seasonal: check the operator’s timetable rather than treating the waterway as a driving route.',
    'Dag 1: start ved havnen og de hvite trehusgatene i Lillesand. Sett bilen på en skiltet offentlig parkeringsplass og gå videre; bymarkøren er ikke en reservert parkeringsplass. Overnatt i området før du fortsetter østover. Båtturer i Blindleia er valgfrie og sesongavhengige: sjekk operatørens rutetider, for dette er ingen bilvei.',
    'День 1: почніть із гавані Lillesand та вуличок із білими дерев’яними будинками. Залиште авто на громадській парковці за знаками й гуляйте пішки: міська позначка не є заброньованим паркомісцем. Ночуйте поблизу перед дорогою на схід. Прогулянка човном через Blindleia — окрема сезонна можливість: перевірте розклад оператора, це не автомобільна дорога.',
    'Dag 1: börja vid Lillesands hamn och de vita trähusgatorna. Ställ bilen på skyltad allmän parkering och fortsätt till fots; stadsmarkören är ingen reserverad parkeringsplats. Övernatta i området innan du fortsätter österut. Båtturer genom Blindleia är ett säsongsberoende tillval: kontrollera operatörens tidtabell, vattenleden är ingen bilväg.',
    'Dag 1: start ved Lillesands havn og de hvide træhusgader. Stil bilen på skiltet offentlig parkering og fortsæt til fods; bymarkøren er ikke en reserveret parkeringsplads. Overnat i området inden turen østpå. Bådture gennem Blindleia er et sæsonbestemt tilvalg: tjek operatørens sejlplan, vandvejen er ingen bilvej.'
   ])},
   {id:'agdercoast-grimstad',name:'Grimstad · havnen',latitude:58.34046,longitude:8.59337,extra:true,local:true,coordinatePrecision:'area',routeQuery:'Grimstad sentrum, Norway',website:'https://www.visitsorlandet.com/destinasjoner/grimstad/',description:copy([
    'Day 2: take the short mainland drive to Grimstad, then stroll between the harbour and the old wooden town. Plan a café break and leave the afternoon unhurried. The Ibsen Museum is an optional indoor visit; check its current opening hours. Choose signed parking before entering narrow streets. Spend the night near Grimstad or Arendal; accommodation is booked separately.',
    'Dag 2: kjør den korte etappen på fastlandet til Grimstad og rusle mellom havnen og den gamle trehusbyen. Legg inn en kafépause og en rolig ettermiddag. Ibsen-museet er et valgfritt innendørsbesøk; sjekk gjeldende åpningstider. Velg skiltet parkering før du kjører inn i trange gater. Overnatt ved Grimstad eller Arendal; overnatting bestilles separat.',
    'День 2: короткий переїзд материковою дорогою до Grimstad, потім прогулянка від гавані до старих дерев’яних кварталів. Зробіть кавову паузу й залиште другу половину дня вільною. Музей Ібсена — додаткова можливість: перевірте актуальні години роботи. Оберіть парковку за знаками до в’їзду у вузькі вулиці. Ночуйте біля Grimstad або Arendal; житло бронюйте окремо.',
    'Dag 2: kör den korta etappen på fastlandet till Grimstad och promenera mellan hamnen och den gamla trästaden. Lägg in en kafépaus och en lugn eftermiddag. Ibsenmuseet är ett valfritt inomhusbesök; kontrollera aktuella öppettider. Välj skyltad parkering innan du kör in på smala gator. Övernatta nära Grimstad eller Arendal; boende bokas separat.',
    'Dag 2: kør den korte etape på fastlandet til Grimstad og gå mellem havnen og den gamle træhusby. Afsæt tid til en cafépause og en rolig eftermiddag. Ibsenmuseet er et valgfrit indendørsbesøg; tjek aktuelle åbningstider. Vælg skiltet parkering inden de smalle gader. Overnat ved Grimstad eller Arendal; overnatning bestilles separat.'
   ])},
   {id:'agdercoast-arendal',name:'Arendal · Pollen / Tyholmen',latitude:58.46121,longitude:8.76695,extra:true,local:true,coordinatePrecision:'area',routeQuery:'Arendal sentrum, Norway',website:'https://www.visitsorlandet.com/destinasjoner/arendal/',description:copy([
    'Day 3: continue to Arendal for Pollen harbour and the wooden houses of Tyholmen. Park in a signed city car park and make this a walking stop with a meal by the waterfront. Island ferries are an optional separate outing, not part of this road route; verify their timetable. For a three-day trip, continue to Risør today. For four days, stay in this area and keep Risør for tomorrow.',
    'Dag 3: fortsett til Arendal for Pollen og trehusene på Tyholmen. Parker på en skiltet byparkering og utforsk til fots med en matpause ved vannet. Øyferger er en egen valgfri utflukt, ikke en del av bilruten; sjekk rutetidene. På en tredagerstur fortsetter du til Risør i dag. Med fire dager kan du overnatte i området og besøke Risør i morgen.',
    'День 3: далі до Arendal — гавані Pollen і дерев’яних будинків Tyholmen. Оберіть міську парковку за знаками, гуляйте пішки та пообідайте біля води. Пором до островів — окрема необов’язкова прогулянка, не частина автомаршруту; перевірте розклад. Для трьох днів їдьте в Risør сьогодні, для чотирьох — ночуйте тут і залиште Risør на завтра.',
    'Dag 3: fortsätt till Arendal för Pollen och trähusen på Tyholmen. Parkera på skyltad stadsparkering och utforska till fots med en matpaus vid vattnet. Öfärjor är en separat valfri utflykt, ingen del av bilrutten; kontrollera tidtabellen. På en tredagarstur fortsätter du till Risør idag. Med fyra dagar kan du övernatta här och besöka Risør imorgon.',
    'Dag 3: fortsæt til Arendal for Pollen og træhusene på Tyholmen. Parker på skiltet byparkering og gå en tur med en madpause ved vandet. Øfærger er en særskilt valgfri udflugt, ikke en del af bilruten; tjek sejlplanen. På en tredagestur fortsætter du til Risør i dag. Med fire dage kan du overnatte her og besøge Risør i morgen.'
   ])},
   {id:'agdercoast-risor',name:'Risør · trehusbyen',latitude:58.72058,longitude:9.23421,extra:true,local:true,coordinatePrecision:'area',routeQuery:'Risør sentrum, Norway',website:'https://www.visitsorlandet.com/destinasjoner/risor/',description:copy([
    'Day 3 or 4: finish in Risør with a slow walk around the harbour and white wooden town. Find signed parking first; the route’s city marker does not identify a car-park entrance. Enjoy a final food stop and check local opening hours outside summer. This is a one-way journey ending in Risør: allow additional time for your return or onward drive. Cabins, meals and optional boat trips are not included.',
    'Dag 3 eller 4: avslutt i Risør med en rolig tur rundt havnen og den hvite trehusbyen. Finn skiltet parkering først; bymarkøren viser ikke en parkeringsinnkjørsel. Ta en siste matpause og sjekk lokale åpningstider utenom sommeren. Dette er en enveisreise som slutter i Risør: sett av ekstra tid til hjemreise eller videre kjøring. Hytter, mat og valgfrie båtturer er ikke inkludert.',
    'День 3 або 4: завершіть подорож у Risør неспішною прогулянкою гаванню та білим дерев’яним містечком. Спочатку знайдіть парковку за знаками: міська позначка не показує в’їзд. Зробіть останню зупинку на їжу й перевірте години роботи поза літом. Це маршрут в один бік із фінішем у Risør: врахуйте час на повернення чи подальшу дорогу. Будиночки, їжа й прогулянки човном не включені.',
    'Dag 3 eller 4: avsluta i Risør med en lugn promenad runt hamnen och den vita trästaden. Hitta skyltad parkering först; stadsmarkören visar ingen parkeringsinfart. Ta en sista matpaus och kontrollera lokala öppettider utanför sommaren. Det är en enkelresa som slutar i Risør: avsätt extra tid för hemresa eller fortsatt körning. Stugor, mat och valfria båtturer ingår inte.',
    'Dag 3 eller 4: slut i Risør med en rolig tur omkring havnen og den hvide træhusby. Find skiltet parkering først; bymarkøren viser ingen parkeringsindkørsel. Tag en sidste madpause og tjek lokale åbningstider uden for sommeren. Dette er en envejsrejse, der slutter i Risør: afsæt ekstra tid til hjemrejse eller videre kørsel. Hytter, mad og valgfrie bådture er ikke inkluderet.'
   ])}
  ],
  sources:['https://www.visitsorlandet.com/destinasjoner/lillesand/','https://www.visitsorlandet.com/destinasjoner/grimstad/','https://www.visitsorlandet.com/destinasjoner/arendal/','https://www.visitsorlandet.com/destinasjoner/risor/',...['Lillesand','Grimstad','Arendal','Risør'].map(name=>'https://ws.geonorge.no/stedsnavn/v1/navn?sok='+encodeURIComponent(name)+'&treffPerSide=20')]
 };
 routes.telemarkcoast={
  "label": "TELEMARK · VESTFOLD",
  "checkedAt": "2026-10-18",
  "optionalExperienceIds": [],
  "title": {
    "en": "From white harbours to the open coast",
    "nb": "Fra hvite havner til åpen kyst",
    "uk": "Від білих гаваней до відкритого моря",
    "sv": "Från vita hamnar till öppen kust",
    "da": "Fra hvide havne til åben kyst"
  },
  "summary": {
    "en": "Risør · Kragerø · Langesund · Nevlunghavn · Stavern · allow 3–4 days",
    "nb": "Risør · Kragerø · Langesund · Nevlunghavn · Stavern · sett av 3–4 dager",
    "uk": "Risør · Kragerø · Langesund · Nevlunghavn · Stavern · плануйте 3–4 дні",
    "sv": "Risør · Kragerø · Langesund · Nevlunghavn · Stavern · avsätt 3–4 dagar",
    "da": "Risør · Kragerø · Langesund · Nevlunghavn · Stavern · afsæt 3–4 dage"
  },
  "photos": [
    {
      "image": "./images/catalog/telemark-place-kragero.webp",
      "title": "Kragerø · brygger & trehus",
      "author": "Bjoertvedt",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:130720086512kragerø_øya.jpg"
    },
    {
      "image": "./images/catalog/telemark-place-langesund.webp",
      "title": "Langesund · havn & smågater",
      "author": "Orf3us",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "source": "https://commons.wikimedia.org/wiki/File:Fra_havnen_i_Langesund.jpg"
    },
    {
      "image": "./images/catalog/telemark-place-nevlunghavn.webp",
      "title": "Nevlunghavn · fiskehavn",
      "author": "Dort~commonswiki (attributed on Commons)",
      "license": "Public domain",
      "licenseUrl": "https://commons.wikimedia.org/wiki/File:Nevlunghavn_-_brygga.jpg#Licensing",
      "source": "https://commons.wikimedia.org/wiki/File:Nevlunghavn_-_brygga.jpg"
    },
    {
      "image": "./images/catalog/telemark-place-stavern.webp",
      "title": "Stavern · havn & Fredriksvern",
      "author": "Eaglestein",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "source": "https://commons.wikimedia.org/wiki/File:Stavern_havn.jpg"
    }
  ],
  "points": [
    {
      "id": "telemarkcoast-risor",
      "name": "Risør · videre langs kysten",
      "latitude": 58.72058,
      "longitude": 9.23421,
      "extra": true,
      "local": true,
      "coordinatePrecision": "area",
      "routeQuery": "Risør sentrum, Norway",
      "website": "https://www.visitsorlandet.com/destinasjoner/risor/",
      "description": {
        "en": "Start where the previous coastal route ends: Risør. Enjoy a harbour walk before driving. City markers are orientation areas, not parking entrances. Plan three or four days; accommodation and meals are booked separately.",
        "nb": "Start der forrige kystrute slutter: Risør. Ta en havnetur før kjøreturen. Bymarkørene er orienteringspunkter, ikke parkeringsinnkjørsler. Planlegg tre eller fire dager; overnatting og mat bestilles separat.",
        "uk": "Почніть там, де закінчився попередній маршрут: у Risør. Прогуляйтеся гаванню перед дорогою. Міські позначки — орієнтири, не в’їзди на парковки. Плануйте три-чотири дні; житло та їжу бронюйте окремо.",
        "sv": "Börja där förra kustrutten slutar: Risør. Ta en hamnpromenad före körningen. Stadsmarkörerna är orienteringsområden, inga parkeringsinfarter. Planera tre eller fyra dagar; boende och mat bokas separat.",
        "da": "Start hvor forrige kystrute slutter: Risør. Gå en havnetur inden kørslen. Bymarkørerne er orienteringspunkter, ikke parkeringsindkørsler. Planlæg tre eller fire dage; overnatning og mad bestilles separat."
      }
    },
    {
      "id": "telemarkcoast-kragero",
      "name": "Kragerø · trehusbyen",
      "latitude": 58.8693,
      "longitude": 9.41493,
      "extra": true,
      "local": true,
      "coordinatePrecision": "area",
      "routeQuery": "Kragerø sentrum, Norway",
      "website": "https://www.visittelemark.no/produkter/kragero",
      "description": {
        "en": "Day 1: drive to Kragerø, choose signed public parking and explore the wooden streets and harbour on foot. Add a café stop and stay nearby. Island boat trips are separate, optional outings.",
        "nb": "Dag 1: kjør til Kragerø, velg skiltet offentlig parkering og utforsk trehusgatene og havnen til fots. Ta en kafépause og overnatt i området. Båtturer til øyene er egne, valgfrie utflukter.",
        "uk": "День 1: їдьте до Kragerø, оберіть громадську парковку за знаками та гуляйте дерев’яними вуличками й гаванню пішки. Зробіть кавову паузу й ночуйте поблизу. Човнові поїздки на острови — окремі необов’язкові екскурсії.",
        "sv": "Dag 1: kör till Kragerø, välj skyltad allmän parkering och utforska trähusgatorna och hamnen till fots. Ta en kafépaus och övernatta nära staden. Båtturer till öarna är separata, valfria utflykter.",
        "da": "Dag 1: kør til Kragerø, vælg skiltet offentlig parkering og udforsk træhusgaderne og havnen til fods. Tag en cafépause og overnat i området. Bådture til øerne er særskilte, valgfrie udflugter."
      }
    },
    {
      "id": "telemarkcoast-langesund",
      "name": "Langesund · havnen",
      "latitude": 59.00066,
      "longitude": 9.74873,
      "extra": true,
      "local": true,
      "coordinatePrecision": "area",
      "routeQuery": "Langesund sentrum, Norway",
      "website": "https://www.visittelemark.no/produkter/langesund",
      "description": {
        "en": "Day 2: visit Langesund harbour; optionally walk towards Tangen Fort for views towards Langøya. Park first and assess weather and footing. Stay nearby. The next driving leg goes inland via E18 and bridges, without the Langesund–Helgeroa ferry.",
        "nb": "Dag 2: besøk Langesund havn; gå eventuelt mot Tangen fort med utsikt mot Langøya. Parker først og vurder vær og underlag. Overnatt i området. Neste kjøreetappe går via E18 og broer, uten Langesund–Helgeroa-fergen.",
        "uk": "День 2: відвідайте гавань Langesund; за бажанням пройдіться до Tangen fort із видом на Langøya. Припаркуйтеся й оцініть погоду та стежку. Ночуйте поблизу. Наступний переїзд — через E18 і мости, без порома Langesund–Helgeroa.",
        "sv": "Dag 2: besök Langesunds hamn; promenera gärna mot Tangen fort med utsikt mot Langøya. Parkera först och bedöm väder och underlag. Övernatta i området. Nästa köretapp går via E18 och broar, utan färjan Langesund–Helgeroa.",
        "da": "Dag 2: besøg Langesunds havn; gå eventuelt mod Tangen fort med udsigt mod Langøya. Parker først og vurder vejr og underlag. Overnat i området. Næste køreetape går via E18 og broer, uden færgen Langesund–Helgeroa."
      }
    },
    {
      "id": "telemarkcoast-nevlunghavn",
      "name": "Nevlunghavn · fiskehavnen",
      "latitude": 58.96741,
      "longitude": 9.86748,
      "extra": true,
      "local": true,
      "coordinatePrecision": "area",
      "routeQuery": "Nevlunghavn sentrum, Norway",
      "website": "https://visitvestfold.com/no/sted/nevlunghavn",
      "description": {
        "en": "Day 3: take the mainland road around the fjord to Nevlunghavn, then walk to the fishing harbour. Driving is longer than crossing the water directly. Allow time for lunch and a short walk. The coastal footpath is not a car road.",
        "nb": "Dag 3: følg fastlandsveien rundt fjorden til Nevlunghavn og gå til fiskehavnen. Kjøreturen er lengre enn avstanden over vannet. Sett av tid til lunsj og en kort tur. Kyststien er ikke en bilvei.",
        "uk": "День 3: материковою дорогою навколо фіорду до Nevlunghavn, далі пішки до рибальської гавані. Автомобілем шлях довший, ніж напряму через воду. Залиште час на обід і коротку прогулянку. Прибережна пішохідна стежка — не автодорога.",
        "sv": "Dag 3: följ fastlandsvägen runt fjorden till Nevlunghavn och gå till fiskehamnen. Körsträckan är längre än avståndet över vattnet. Avsätt tid för lunch och en kort promenad. Kuststigen är ingen bilväg.",
        "da": "Dag 3: følg fastlandsvejen rundt om fjorden til Nevlunghavn og gå til fiskerihavnen. Køreturen er længere end afstanden over vandet. Afsæt tid til frokost og en kort tur. Kyststien er ingen bilvej."
      }
    },
    {
      "id": "telemarkcoast-stavern",
      "name": "Stavern · havnen / Fredriksvern",
      "latitude": 58.9983,
      "longitude": 10.03557,
      "extra": true,
      "local": true,
      "coordinatePrecision": "area",
      "routeQuery": "Stavern sentrum, Norway",
      "website": "https://www.visitvestfold.com/no/larvik/artikler/stavern",
      "description": {
        "en": "Day 3 or 4: finish at Stavern harbour and walk around Fredriksvern. Keep a fourth day for a slower visit. Find signed parking; the marker is not its entrance. Check venue hours outside summer. This one-way trip ends here; plan your return separately.",
        "nb": "Dag 3 eller 4: avslutt ved Stavern havn og gå rundt Fredriksvern. Sett av en fjerde dag for roligere tempo. Finn skiltet parkering; markøren er ikke innkjørselen. Sjekk åpningstider utenom sommeren. Enveisruten slutter her; planlegg retur separat.",
        "uk": "День 3 або 4: завершіть подорож гаванню Stavern і прогулянкою Fredriksvern. Четвертий день залиште для спокійнішого відпочинку. Знайдіть парковку за знаками: позначка не показує в’їзд. Перевірте години закладів поза літом. Маршрут в один бік; повернення плануйте окремо.",
        "sv": "Dag 3 eller 4: avsluta vid Staverns hamn och promenera runt Fredriksvern. Avsätt en fjärde dag för lugnare tempo. Hitta skyltad parkering; markören är ingen infart. Kontrollera öppettider utanför sommaren. Enkelresan slutar här; planera retur separat.",
        "da": "Dag 3 eller 4: slut ved Staverns havn og gå omkring Fredriksvern. Afsæt en fjerde dag til roligere tempo. Find skiltet parkering; markøren er ingen indkørsel. Tjek åbningstider uden for sommeren. Envejsruten slutter her; planlæg retur separat."
      }
    }
  ],
  "sources": [
    "https://www.visitsorlandet.com/destinasjoner/risor/",
    "https://www.visittelemark.no/produkter/kragero",
    "https://www.visittelemark.no/produkter/langesund",
    "https://www.visittelemark.com/things-to-do/tangen-fort-p502643",
    "https://visitvestfold.com/no/sted/nevlunghavn",
    "https://www.visitvestfold.com/no/larvik/artikler/stavern",
    "https://ws.geonorge.no/stedsnavn/v1/navn?sok=Krager%C3%B8&treffPerSide=10&utkoordsys=4258",
    "https://ws.geonorge.no/stedsnavn/v1/navn?sok=Langesund&treffPerSide=10&utkoordsys=4258",
    "https://ws.geonorge.no/stedsnavn/v1/navn?sok=Nevlunghavn&treffPerSide=10&utkoordsys=4258",
    "https://ws.geonorge.no/stedsnavn/v1/navn?sok=Stavern&treffPerSide=10&utkoordsys=4258"
  ]
};
 if(typeof module!=='undefined'&&module.exports)module.exports=routes;
 if(root.FjordTripTools)Object.assign(root.FjordTripTools.localRoutes,routes);
})(typeof window!=='undefined'?window:globalThis);
