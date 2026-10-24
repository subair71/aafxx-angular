import { Component, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VerifiedOrder, verifyOrder, whatsappUrl } from './funnel';
import { downloadRecoveryAvailable, recoverDownloads } from './commerce';
import { track } from './analytics';

@Component({selector:'app-order-confirmation',standalone:true,imports:[FormsModule],template:`
  <section class="wrap section confirmation">
    @if(order();as paid){
      <p class="eyebrow">PAYMENT VERIFIED / AAFXX</p><h1 tabindex="-1">Thank You for Joining the AAFXX Learning Community!</h1>
      <p class="lead">Your journey toward disciplined forex education continues here. Discover the AAFXX mentorship programme and connect with our team.</p>
      <div class="order-details"><h2>Your order</h2><dl><dt>Publication</dt><dd>{{paid.title}}</dd><dt>Format</dt><dd>{{paid.format}}</dd><dt>Total paid (USD)</dt><dd>{{(paid.amountTotal/100).toFixed(2)}}</dd></dl>
      @if(paid.files.length){<h3>Your digital library</h3>@for(file of paid.files;track file.url){<a class="button outline" [href]="file.url" rel="noreferrer">Download {{file.name}}</a>}<p class="small-text">Private, time-limited access. Keep these links private.</p>}@else{<p>Request fresh download links below if your access has expired.</p>}</div>
      <div class="button-row"><a class="button gold" [href]="base+'mentorship/'">Join 1000 Wealth Creators</a>@if(whatsapp){<a class="button outline" [href]="whatsapp" target="_blank" rel="noopener noreferrer" (click)="whatsappClick()">Contact on WhatsApp</a>}@else{<span class="pending">Official WhatsApp number pending</span>}<a class="text-link" [href]="base+'books/'">Explore More Books</a></div>
    } @else {
      <p class="eyebrow">SECURE ORDER CONFIRMATION</p><h1 tabindex="-1">Verify your <em>purchase.</em></h1><p class="lead">Enter your checkout email to view a verified order and its eligible downloads.</p><p>A redirect or order reference alone does not confirm payment. Pending, failed and cancelled transactions do not unlock books.</p>
    }
    <form #form="ngForm" (ngSubmit)="verify()" class="verification-form">
      <label>Checkout reference<input name="orderReference" required maxlength="150" [(ngModel)]="sessionId" autocomplete="off" /></label>
      <label>Checkout email<input name="checkoutEmail" type="email" email required maxlength="254" [(ngModel)]="email" autocomplete="email" /></label>
      <button class="button gold" type="submit" [disabled]="form.invalid||busy()||!available()">{{busy()?'Verifying payment…':'Verify payment & view order'}}</button>
      @if(!available()){<p class="notice">Order verification is pending setup. Refer to your payment receipt for support. No purchase is confirmed on this page.</p>}
      <p role="status" [class.error]="error()">{{message()}}</p>
      @if(available()){<button class="text-link" type="button" [disabled]="form.invalid||busy()" (click)="recover()">Email fresh download links</button>}
    </form>
    <a class="text-link" [href]="base+'contact/?subject=Order%20support'">Order & download support</a>
  </section>`,styles:[`.confirmation{max-width:900px}h1{font-size:clamp(36px,5vw,60px)}.verification-form,.order-details{display:grid;gap:20px;padding:30px;border:1px solid var(--line-strong);background:var(--surface);margin:30px 0}dt{color:var(--gold);font-size:12px;margin-top:14px}dd{margin:5px 0}.small-text,.pending{font-size:12px;color:var(--muted)}.button-row{flex-wrap:wrap}.notice{font-size:13px}.error{color:var(--error)}@media(max-width:500px){.verification-form,.order-details{padding:20px}}`]})
export class OrderConfirmationComponent {
  @Input() base = '/';
  sessionId = new URLSearchParams(location.search).get('session_id') || '';
  email = ''; order = signal<VerifiedOrder|null>(null); busy = signal(false); error = signal(false); message = signal('');
  whatsapp = whatsappUrl(); available = downloadRecoveryAvailable; startedAt = Date.now();
  constructor() { if(this.sessionId) history.replaceState(history.state,'',location.pathname); }
  whatsappClick(){track('whatsapp_mentorship_clicked');}
  async verify(){
    if(this.busy())return;this.busy.set(true);this.order.set(null);this.error.set(false);this.message.set('');
    try { const result = await verifyOrder(this.sessionId.trim(),this.email.trim().toLowerCase()); this.order.set(result);
      if(result){track('purchase',{product:result.sku,amount:result.amountTotal/100,transactionId:result.transactionId});setTimeout(()=>document.querySelector<HTMLElement>('main h1')?.focus());}
      else this.message.set('No completed order could be confirmed with these details. Check your receipt; delayed payments may still be processing.');
    } catch(error){this.error.set(true);this.message.set(error instanceof Error?error.message:'Verification failed. Please try again.');}
    finally{this.busy.set(false);}
  }
  async recover(){if(this.busy())return;this.busy.set(true);try{const r=await recoverDownloads({sessionId:this.sessionId,email:this.email,website:'',startedAt:this.startedAt});this.message.set(r.message);this.error.set(!r.ok);}finally{this.busy.set(false);}}
}
