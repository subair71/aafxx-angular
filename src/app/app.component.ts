import { Component, HostListener, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lessons, catalogueMeta } from './learning-content';
import { BOOKS, BUNDLE, AUTHOR, Book, BookFormat } from './catalogue';
import { checkoutFor, bundleCheckout, formatPrice, integrationAvailable, submitContact, submitWaitlist, downloadRecoveryAvailable, recoverDownloads } from './commerce';
import { integrationConfig } from './integration-config';
import { updateSeo } from './seo';
import { BookCardComponent } from './book-card.component';
import { LeadFormComponent } from './lead-form.component';
import { OrderConfirmationComponent } from './order-confirmation.component';
import { TestimonialsComponent } from './testimonials.component';
import { funnelConfig } from './funnel-config';
import { purchaseAction, notificationHref, checkoutHref, selectedCheckout, whatsappUrl, LeadKind, leadsAvailable } from './funnel';
import { track, analyticsConfigured, analyticsConsent, analyticsPreference } from './analytics';
import { IconComponent } from './icon.component';

type Page = 'Home'|'Books'|'Book'|'Academy'|'Course'|'Checklist'|'About'|'EAs'|'Contact'|'CheckoutSuccess'|'CheckoutCancel'|'Privacy'|'Terms'|'Refund'|'Resources'|'Lesson'|'FAQ'|'Webinars'|'Checkout'|'Account'|'NotFound'|'Launch'|'LeadConfirmation'|'Mentorship'|'Risk'|'Author';
interface Course {id: number; title: string; description: string; topics: string[]}

@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule,BookCardComponent,IconComponent,LeadFormComponent,OrderConfirmationComponent,TestimonialsComponent],templateUrl:'./app.component.html',styleUrls:['./app.component.css','./stitch-layout.css']})
export class AppComponent {
  funnel = funnelConfig;
  whatsapp = whatsappUrl();
  analyticsReady = analyticsConfigured();
  analyticsChoice = signal(analyticsPreference());
  leadReceipt = signal<{kind: LeadKind;delivery?:string}|null>(null);
  launchBook = 'all';
  launchFormat: 'pdf'|'print'|'undecided' = 'undecided';
  checkoutSku = '';
  popupStartedAt = Date.now();
  base = new URL(document.baseURI).pathname;
  books = BOOKS;
  bundle = BUNDLE;
  author = AUTHOR;
  config = integrationConfig;
  lessons = lessons;
  meta = catalogueMeta;
  price = formatPrice;
  page = signal<Page>('Home');
  book = signal<Book>(BOOKS[0]);
  bookFormat = signal<BookFormat>('pdf');
  menu = signal(false);
  dark = signal(true);
  query = signal('');
  topic = signal('All');
  level = signal('All');
  learningFormat = signal('All');
  answer = signal(-1);
  checked = signal(false);
  lesson = signal(lessons[0]);
  course = signal<Course>({id:4,title:'Forex Foundations',description:'Learn the essentials of forex trading.',topics:[]});
  busy = signal(false);
  formMessage = signal('');
  formError = signal(false);
  waitBusy = signal(false);
  waitMessage = signal('');
  waitError = signal(false);
  waitJoined = signal(false);
  recoveryBusy = signal(false); recoveryMessage = signal(''); recoveryError = signal(false);
  recoveryEmail = ''; recoverySession = ''; recoveryWebsite = ''; recoveryStartedAt = Date.now();
  name = ''; email = ''; subject = 'General enquiry'; message = ''; consent = false; website = '';
  waitEmail = ''; waitConsent = false; waitWebsite = '';
  startedAt = Date.now(); waitStartedAt = Date.now();
  pages: Page[] = ['Home','Books','Academy','Checklist','About'];
  topics = ['Forex Fundamentals','Technical Analysis','Fundamental Analysis','Risk Management','Trading Psychology','Trading Journals'];
  paths: Record<Page,string> = {Home:'',Books:'books',Book:'books',Academy:'academy',Course:'courses',Checklist:'checklist',About:'about',EAs:'expert-advisors',Contact:'contact',CheckoutSuccess:'checkout/success',CheckoutCancel:'checkout/cancel',Privacy:'privacy-policy',Terms:'terms',Refund:'refund-policy',Resources:'resources',Lesson:'resources',FAQ:'faq',Webinars:'webinars',Checkout:'checkout',Account:'account',NotFound:'404',Launch:'launch-notifications',LeadConfirmation:'registration-confirmed',Mentorship:'mentorship',Risk:'risk-disclaimer',Author:'about-author'};
  courses: Course[] = [
    {id:4,title:'Forex Foundations',description:'Currency pairs, market terminology and the essentials of risk.',topics:['Currency pairs, pips and spreads','Reading price and chart structure','Practice and a considered learning plan']},
    {id:5,title:'The AAFXX Method',description:'An introduction to the academy’s focus on chart context and structured study.',topics:['Market structure and context','Moving averages as analytical tools','Disciplined observation and trade review']},
    {id:6,title:'Risk & Trade Management',description:'Understand exposure, plan your process and reflect on decisions.',topics:['Position sizing and exposure','Risk and the limitations of stop orders','Trading journals and reflective practice']},
  ];
  methods = [
    {number:'01',name:'The Standard Checklist',detail:'The central framework of AAFXX’s educational approach, bringing a structured focus to forex study.',icon:'book-open'},
    {number:'02',name:'LOW IN, MIDDLE OUT',detail:'The academy’s named methodology with a stated 5-minute and 15-minute execution focus.',icon:'chart-no-axes-combined'},
    {number:'03',name:'BBB FLOW',detail:'A named AAFXX methodology focused on understanding trend flow within its educational framework.',icon:'globe'},
    {number:'04',name:'Leader Alignment',detail:'A methodology taught alongside BBB FLOW as part of the academy’s approach to market context.',icon:'shield-check'},
  ];
  faqs = [
    ['What does each book cost?','Each individual book is listed at USD 27 for PDF or USD 47 for print. The four-book library is USD 97. The bundle includes PDF + Paperback + Bonus. Contact AAFXX for current purchase and delivery availability.'],
    ['Can I purchase a book now?','PayPal is the selected payment method. The supplied payment page could not be verified, so purchases are currently blocked. Contact admin@aafxx.com before paying.'],
    ['How will I receive a PDF or printed book?','Digital delivery will be available only after payment is verified. Print destinations, shipping costs and fulfilment arrangements must be confirmed before print ordering opens. No delivery timeframe is promised here.'],
    ['Where should I begin learning?','Start with the free forex foundations guides. They cover currency pairs, pips, spreads and leverage before you move on to chart context, risk planning and trading discipline.'],
    ['Are courses open for enrolment?','The academy presents proposed learning paths and free introductory reading. Course schedules, teaching formats, final curricula and fees have not yet been confirmed.'],
    ['When will the Expert Advisors launch?','The planned release year is 2027. The Expert Advisors page is for launch interest only. There are no EA purchases, prices or verified performance results available here.'],
    ['Does the academy guarantee trading results?','No. Anybody Wins is the brand tagline and 1000 Wealth Creators is an educational aspiration. Forex and leveraged trading involve risk, and education does not guarantee financial outcomes.'],
  ];
  bookTopic = signal(0);
  bookFilters = [{value:0,label:'All Volumes (4)'},{value:1,label:'Checklist & Foundational'},{value:2,label:'Execution (5M/15M)'},{value:3,label:'Trend & Alignment'},{value:4,label:'Mentorship Playbook'}];
  visibleBooks = computed(()=>BOOKS.filter(b=>(this.bookTopic()===0||b.number===this.bookTopic())&&(b.title+' '+b.subtitle+' '+b.topics.join(' ')).toLowerCase().includes(this.query().trim().toLowerCase())));
  visibleCourses = computed(()=>this.courses.filter(c=>(c.title+' '+c.description+' '+this.meta[c.id].topic).toLowerCase().includes(this.query().trim().toLowerCase())&&(this.topic()==='All'||this.meta[c.id].topic===this.topic())&&(this.level()==='All'||this.meta[c.id].level===this.level())&&(this.learningFormat()==='All'||this.learningFormat()==='To be confirmed')));
  filteredLessons = computed(()=>lessons.filter(l=>(this.topic()==='All'||l.category===this.topic())&&(l.title+' '+l.category).toLowerCase().includes(this.query().trim().toLowerCase())));
  relatedBooks = computed(()=>BOOKS.filter(b=>b.id!==this.book().id));

  constructor(){
    try { this.dark.set(localStorage.getItem('aafxx-theme')!=='light'); } catch {}
    if(this.analyticsChoice()==='granted')analyticsConsent(true);
    this.setTheme(); this.readLocation();
    window.addEventListener('popstate',()=>{this.resetFilters();this.menu.set(false);this.readLocation();});
    window.addEventListener('seo-origin',()=>this.seo());
  }
  setTheme(){document.documentElement.dataset['theme']=this.dark()?'dark':'light';}
  toggleTheme(){this.dark.update(v=>!v);this.setTheme();try{localStorage.setItem('aafxx-theme',this.dark()?'dark':'light');}catch{}}
  toggleMenu(){this.menu.update(v=>!v);if(this.menu())setTimeout(()=>document.querySelector<HTMLElement>('#primary-navigation a')?.focus());}
  @HostListener('document:keydown.escape') escape(){if(this.menu()){this.menu.set(false);document.querySelector<HTMLElement>('.menu-toggle')?.focus();}}
  @HostListener('document:click',['$event']) outside(event:MouseEvent){if(this.menu()&&event.target instanceof Element&&!event.target.closest('.site-header'))this.menu.set(false);}
  resetFilters(){this.bookTopic.set(0);this.query.set('');this.topic.set('All');this.level.set('All');this.learningFormat.set('All');}
  label(p:Page):string{return ({Books:'Books Shop',Academy:'Academy',Checklist:'The Checklist',EAs:'Expert Advisors',Privacy:'Privacy Policy',Terms:'Terms & Conditions',Refund:'Refund Policy',Resources:'Learning Resources',FAQ:'Frequently Asked Questions',CheckoutSuccess:'Checkout status',CheckoutCancel:'Checkout cancelled',NotFound:'Page not found',Launch:'Book Launch Notifications',LeadConfirmation:'Registration Confirmation',Mentorship:'1000 Wealth Creators Mentorship',Risk:'Forex Risk Disclaimer',Author:'About the Author'} as Partial<Record<Page,string>>)[p]||p;}
  href(p:Page){return this.base+(this.paths[p]?this.paths[p]+'/':'');}
  bookHref(b:Book){return this.href('Books')+b.slug+'/';}
  courseHref(c:Course){return this.base+'courses/'+this.meta[c.id].slug+'/';}
  lessonHref(slug:string){return this.href('Resources')+slug+'/';}
  active(p:Page){return this.page()===p||(p==='Books'&&this.page()==='Book')||(p==='Academy'&&['Course','Resources','Lesson'].includes(this.page()));}
  navigate(url:string,event?:Event){
    if(event instanceof MouseEvent&&(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0))return;
    event?.preventDefault();history.pushState({},'',url);this.menu.set(false);this.resetFilters();this.formMessage.set('');this.waitMessage.set('');this.readLocation();window.scrollTo(0,0);setTimeout(()=>document.querySelector<HTMLElement>('main h1')?.focus());
  }
  go(p:Page,event?:Event){this.navigate(this.href(p),event);}
  skipToContent(event:Event){event.preventDefault();this.menu.set(false);const main=document.getElementById('main-content');main?.focus({preventScroll:true});main?.scrollIntoView({block:'start'});}
  openBook(b:Book,event?:Event){this.navigate(this.bookHref(b),event);}
  enquiryHref(title:string){return this.href('Contact')+'?subject='+encodeURIComponent(title);}
  enquiry(title:string,event?:Event){this.navigate(this.enquiryHref(title),event);}
  readLocation(){
    let route='';try{route=decodeURIComponent(location.pathname).slice(this.base.length).replace(/^\/+|\/+$/g,'');}catch{this.page.set('NotFound');this.seo();return;}
    const aliases:Record<string,string>={'courses':'academy','privacy':'privacy-policy','strategies':'checklist','achievements':'about','books/why-they-call-me-prof':'books','books/the-5-minute-chart':'books','books/trading-with-discipline':'books'};
    for(const c of this.courses)aliases['academy/'+this.meta[c.id].slug]='courses/'+this.meta[c.id].slug;
    if(aliases[route]){route=aliases[route];history.replaceState({},'',this.base+route+'/'+location.search+location.hash);}
    this.answer.set(-1);this.checked.set(false);this.bookFormat.set('pdf');
    const parts=route.split('/');
    if(parts[0]==='books'&&parts.length===2){const b=BOOKS.find(b=>b.slug===parts[1]);if(b)this.book.set(b);this.page.set(b?'Book':'NotFound');}
    else if(parts[0]==='courses'&&parts.length===2){const c=this.courses.find(c=>this.meta[c.id].slug===parts[1]);if(c)this.course.set(c);this.page.set(c?'Course':'NotFound');}
    else if(parts[0]==='resources'&&parts.length===2){const l=lessons.find(l=>l.slug===parts[1]);if(l)this.lesson.set(l);this.page.set(l?'Lesson':'NotFound');}
    else this.page.set((Object.keys(this.paths) as Page[]).find(p=>!['Book','Course','Lesson'].includes(p)&&this.paths[p]===route)||'NotFound');
    if(this.page()==='Contact'){this.subject=new URLSearchParams(location.search).get('subject')?.slice(0,200)||'General enquiry';this.startedAt=Date.now();}
    if(this.page()==='EAs')this.waitStartedAt=Date.now();
    if(this.page()==='CheckoutSuccess'){this.recoveryStartedAt=Date.now();const id=new URLSearchParams(location.search).get('session_id')||'';this.recoverySession=/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(id)?id:'';}
    if(this.page()==='Launch'){
      const params=new URLSearchParams(location.search);const id=params.get('book')||'all';
      this.launchBook=['all',BUNDLE.id,...BOOKS.map(b=>b.id)].includes(id)?id:'all';
      const format=params.get('format');this.launchFormat=format==='pdf'||format==='print'?format:'undecided';
    }
    if(this.page()==='Checkout')this.checkoutSku=new URLSearchParams(location.search).get('sku')||'';
    if(this.page()==='Book')track('book_viewed',{product:this.book().id});
    this.seo(); track('page_view');
  }
  action(){return purchaseAction(this.book(),this.bookFormat(),this.base);}
  buy(event:MouseEvent){const a=this.action();if(a.available)track('buy_now_clicked',{product:this.book().formats[this.bookFormat()].sku});if(!a.external)this.navigate(a.href,event);}
  bundleHref(){const state=this.bundleStatus();return state.available?state.url!:checkoutHref(this.base,BUNDLE.sku);}
  selectBundle(event:Event){if(this.bundleStatus().available)track('buy_now_clicked',{product:BUNDLE.sku});track('bundle_selected',{product:BUNDLE.sku});if(!this.bundleStatus().available)this.navigate(this.bundleHref(),event);}
  checkoutSelection(){return selectedCheckout(this.checkoutSku);}
  beginCheckout(){track('begin_checkout',{product:this.checkoutSku});}
  notificationHref(){return notificationHref(this.base);}
  whatsappClick(){track('whatsapp_mentorship_clicked');}
  registered(receipt:{kind:LeadKind;delivery?:string}){this.leadReceipt.set(receipt);this.go('LeadConfirmation');}
  setAnalytics(allow:boolean){analyticsConsent(allow);this.analyticsChoice.set(allow?'granted':'denied');}
  @HostListener('document:mouseout',['$event']) exitIntent(event:MouseEvent){
    if(event.relatedTarget||event.clientY>0||!['Home','Books'].includes(this.page())||Date.now()-this.popupStartedAt<25000||!matchMedia('(pointer:fine) and (min-width:900px)').matches||!leadsAvailable())return;
    try{if(sessionStorage.getItem('aafxx-exit-shown'))return;sessionStorage.setItem('aafxx-exit-shown','1');}catch{return;}
    document.querySelector<HTMLDialogElement>('#checklist-dialog')?.showModal();
  }
  closePopup(){document.querySelector<HTMLDialogElement>('#checklist-dialog')?.close();}
  popupChecklist(event:Event){this.closePopup();this.go('Checklist',event);}
  checkout(){return checkoutFor(this.book(),this.bookFormat());}
  bundleStatus(){return bundleCheckout();}
  bundlePdfSavings(){const b=this.config.payments.bundle;return b.contentsConfirmed&&b.format==='pdf'&&b.includedSkus.length===4&&this.books.every(book=>b.includedSkus.includes(book.formats.pdf.sku));}
  changeFormat(format:BookFormat){this.bookFormat.set(format);}
  contactAvailable(){return integrationAvailable('contact');}
  waitlistAvailable(){return integrationAvailable('waitlist');}
  async contact(){
    if(this.busy())return;this.busy.set(true);this.formMessage.set('');
    try{const r=await submitContact({name:this.name,email:this.email,subject:this.subject,message:this.message,consent:this.consent,website:this.website,startedAt:this.startedAt});this.formError.set(!r.ok);this.formMessage.set(r.message);if(r.ok){this.message='';this.consent=false;}}
    finally{this.busy.set(false);}
  }
  async joinWaitlist(){
    if(this.waitBusy()||this.waitJoined())return;this.waitBusy.set(true);this.waitMessage.set('');
    try{const r=await submitWaitlist({email:this.waitEmail,consent:this.waitConsent,website:this.waitWebsite,startedAt:this.waitStartedAt});this.waitError.set(!r.ok);this.waitMessage.set(r.message);if(r.ok)this.waitJoined.set(true);}
    finally{this.waitBusy.set(false);}
  }
  recoveryAvailable(){return downloadRecoveryAvailable();}
  async recover(){if(this.recoveryBusy())return;this.recoveryBusy.set(true);try{const r=await recoverDownloads({sessionId:this.recoverySession,email:this.recoveryEmail,website:this.recoveryWebsite,startedAt:this.recoveryStartedAt});this.recoveryError.set(!r.ok);this.recoveryMessage.set(r.message);}finally{this.recoveryBusy.set(false);}}
  draft(){return `AAFXX enquiry: ${this.subject.trim()}\n\nName: ${this.name.trim()}\nReply email: ${this.email.trim()}\n\n${this.message.trim()}`;}
  async copyDraft(){try{await navigator.clipboard.writeText(this.draft());this.formError.set(false);this.formMessage.set('Enquiry copied. Nothing has been sent. Share it with your existing AAFXX contact.');}catch{this.formError.set(true);this.formMessage.set('Copy is unavailable. You can download your enquiry and share it with your existing AAFXX contact. Nothing has been sent.');}}
  downloadDraft(){this.download('aafxx-enquiry.txt',this.draft(),'text/plain');this.formError.set(false);this.formMessage.set('Enquiry downloaded. Nothing has been sent.');}
  downloadJournal(){this.download('aafxx-practice-journal.csv','Date,Time zone,Instrument,Timeframe,Hypothesis,Invalidation,Planned risk,Costs,Outcome,Followed plan,Reflection\n','text/csv');}
  download(name:string,content:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  courseLessons(id:number){return id===4?lessons.slice(0,3):id===5?lessons.slice(3,5):lessons.slice(5);}
  relatedLessons(){return lessons.filter(l=>l.slug!==this.lesson().slug).slice(0,3);}
  canonicalPath(){return this.page()==='Book'?this.bookHref(this.book()):this.page()==='Course'?this.courseHref(this.course()):this.page()==='Lesson'?this.lessonHref(this.lesson().slug):this.href(this.page());}
  seo(){
    const descriptions:Record<Page,string>={
      Home:'Discover AAFXX – Anybody Wins Trading Academy. Explore four forex education books, the Standard Checklist and structured learning with Prince Prof. Berthram Chidi Eke.',
      Books:'Explore the four-book AAFXX collection. Individual PDF editions are USD 27, print editions USD 47, and the complete library USD 97. Check edition availability.',
      Book:this.book().description,Academy:'Explore AAFXX forex education: foundations, market structure, SMA20 / EMA23, named methodologies, discipline and risk awareness.',Course:this.course().description,
      Checklist:'Discover the educational focus of the AAFXX Standard Checklist, LOW IN MIDDLE OUT, BBB FLOW and Leader Alignment. Official checklist artwork is pending.',
      About:'Meet Prince Prof. Berthram Chidi Eke, founder of AAFXX – Anybody Wins Trading Academy in Manama, Bahrain, with an online global educational mission.',
      EAs:'AAFXX Expert Advisors are planned for 2027. Learn about automated trading risks and check availability of the launch-interest waitlist.',
      Contact:'Contact AAFXX about its forex education books, learning programmes and Expert Advisors. Check online enquiry availability or prepare a message.',
      CheckoutSuccess:'Review the next steps after AAFXX checkout. Payment and delivery must be verified before any order or download can be confirmed.',
      CheckoutCancel:'Return to the AAFXX books collection after leaving checkout. Review payment confirmation before making another purchase.',
      Privacy:'Read how the AAFXX website currently handles theme preferences, enquiry drafts, optional forms and payment information.',
      Terms:'Read AAFXX website terms for educational material, named trading methodologies, publication information and responsible use.',
      Refund:'Review the status of AAFXX purchase and refund terms. Merchant-approved product, delivery and refund conditions are required before orders open.',
      Resources:'Read eight free introductory forex guides with practice questions, glossary explanations and a downloadable trading study journal.',
      Lesson:this.lesson().intro,FAQ:'Answers about AAFXX book formats, USD pricing, delivery readiness, academy learning paths, Expert Advisors and trading risk.',
      Webinars:'Check AAFXX live-learning availability and explore free study guides while webinar schedules await confirmation.',
      Checkout:'AAFXX purchasing uses configured book-specific checkout links. Find your chosen edition and its current availability in the Books Shop.',
      Account:'Explore AAFXX free learning resources without an account. Account services and paid learning access are not currently available.',
      Launch:'Register for AAFXX book ordering updates. Choose a book and preferred format. No payment is taken.',
      LeadConfirmation:'Review the status of your AAFXX launch, checklist or mentorship registration. Registration does not confirm a purchase.',
      Mentorship:'Apply for the AAFXX 1000 Wealth Creators mentorship programme. Explore structured forex education, disciplined learning and the Standard Checklist.',
      Risk:'Forex trading involves significant financial risk. Read the AAFXX risk disclaimer before using its educational material.',
      Author:'Meet Prince Prof. Berthram Chidi Eke, founder of AAFXX Anybody Wins Trading Academy, and explore the four-book learning collection.',
      NotFound:'The requested AAFXX page could not be found. Return to the Books Shop, academy or learning resources.',
    };
    const titles:Partial<Record<Page,string>>={Home:'AAFXX | Anybody Wins Trading Academy & Books',Books:'Books Shop | AAFXX Trading Library',Academy:'Forex Education & Learning Paths | AAFXX Academy',Checklist:'The AAFXX Standard Checklist | Anybody Wins',About:'Our Founder & Mission | AAFXX',EAs:'Expert Advisors — Coming 2027 | AAFXX'};
    const title=this.page()==='Book'?this.book().title+' | AAFXX':this.page()==='Course'?this.course().title+' | AAFXX Academy':this.page()==='Lesson'?this.lesson().title+' | AAFXX':titles[this.page()]||this.label(this.page())+' | AAFXX';
    const crumbs=[{name:'Home',path:this.base}];
    if(this.page()==='Book')crumbs.push({name:'Books Shop',path:this.href('Books')},{name:this.book().title,path:this.bookHref(this.book())});
    else if(this.page()==='Course')crumbs.push({name:'Academy',path:this.href('Academy')},{name:this.course().title,path:this.courseHref(this.course())});
    else if(this.page()==='Lesson')crumbs.push({name:'Resources',path:this.href('Resources')},{name:this.lesson().title,path:this.lessonHref(this.lesson().slug)});
    else if(this.page()!=='Home')crumbs.push({name:this.label(this.page()),path:this.canonicalPath()});
    updateSeo({title,description:descriptions[this.page()],path:this.canonicalPath(),noindex:['CheckoutSuccess','CheckoutCancel','Checkout','Account','NotFound','Refund','Privacy','Terms','LeadConfirmation','Launch'].includes(this.page()),breadcrumbs:crumbs,learningResource:this.page()==='Lesson',...(this.page()==='Book'?{book:{id:this.book().id,title:this.book().title,subtitle:this.book().subtitle,description:this.book().description,author:this.book().author,cover:this.book().cover,offers:(['pdf','print'] as BookFormat[]).flatMap(format=>{const c=checkoutFor(this.book(),format);return format==='pdf'&&c.available&&c.environment==='live'&&c.url?[{sku:c.sku,format,price:this.book().formats[format].price,url:c.url}]:[]})}}:{})});
  }
}
