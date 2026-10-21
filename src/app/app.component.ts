import {Component,signal,computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
type Page='Home'|'About'|'Books'|'Courses'|'Strategies'|'Achievements'|'Contact';
interface Item {id:number;name:string;detail:string;price:number;type:'Books'|'Courses';tag:string}
@Component({selector:'app-root',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./app.component.html',styleUrl:'./app.component.css'})
export class AppComponent {
 page=signal<Page>('Home'); menu=signal(false); cartVisible=signal(false); loginVisible=signal(false); alert=signal('');
 email='';password='';name='';message='';
 pages:Page[]=['Home','About','Books','Courses','Strategies','Achievements','Contact'];
 items:Item[]=[{id:1,name:'Why They Call Me Prof.',detail:'An introduction to the AAFXX trading philosophy',price:29,type:'Books',tag:'FEATURED'},{id:2,name:'The 5-Minute Chart',detail:'Chart reading and market structure essentials',price:24,type:'Books',tag:'EBOOK'},{id:3,name:'Trading With Discipline',detail:'Mindset and risk management foundations',price:19,type:'Books',tag:'PREVIEW'},{id:4,name:'Forex Foundations',detail:'Learn the essentials of forex trading',price:99,type:'Courses',tag:'BEGINNER'},{id:5,name:'The AAFXX Method',detail:'Explore the frameworks and trading setups',price:199,type:'Courses',tag:'INTERMEDIATE'},{id:6,name:'Risk & Trade Management',detail:'Position sizing and trading plans',price:149,type:'Courses',tag:'ALL LEVELS'}];
 strategies=[['SMA20 & EMA23','Explore moving-average relationships and market context.'],['Low In · Middle Out','Study entries and exits across the 5-minute and 15-minute charts.'],['BBB Flow','Learn an educational approach to price action and momentum.'],['Leader Alignment','Understand 30-minute and 1-hour market direction.'],['Risk Management','Build trading plans with defined risk and capital protection.']];
 images=['fe9b14fe-1a82-4e0c-92a7-ec8b0747807e.jpeg','d6d34d47-c09e-4fe7-b52b-32f168c35934.jpeg','e6bb140e-0abc-4df5-8310-6c1b15a74194.jpeg','2d392788-070e-4e9f-8538-21b24af8138b.jpeg'];
 cart=signal<{item:Item;quantity:number}[]>([]); count=computed(()=>this.cart().reduce((s,x)=>s+x.quantity,0)); total=computed(()=>this.cart().reduce((s,x)=>s+x.quantity*x.item.price,0));
 go(p:Page){this.page.set(p);this.menu.set(false);window.scrollTo(0,0)}
 add(item:Item){this.cart.update(a=>a.some(x=>x.item.id===item.id)?a.map(x=>x.item.id===item.id?{...x,quantity:x.quantity+1}:x):[...a,{item,quantity:1}]);this.cartVisible.set(true)}
 remove(id:number){this.cart.update(a=>a.filter(x=>x.item.id!==id))}
 demo(){this.alert.set('Demo interface only. Connect a secure backend and payment/authentication provider to activate this feature.');}
}
