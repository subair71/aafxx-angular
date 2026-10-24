import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BOOKS, BUNDLE } from './catalogue';
import { LeadKind, submitLead, leadsAvailable } from './funnel';
import { track } from './analytics';
import { funnelConfig } from './funnel-config';

@Component({
  selector: 'app-lead-form', standalone: true, imports: [FormsModule],
  template: `
    <form #form="ngForm" (ngSubmit)="submit()" class="lead-form">
      @if(kind==='books'){<p class="notice">Launch notification only. This is not a paid pre-order, an Amazon reservation, or a purchase. No payment is collected.</p>}
      @if(kind==='checklist'&&!pdfReady){<p class="notice">The approved checklist PDF is being prepared. Register for its launch notification; no download is available yet.</p>}
      <div class="form-row">
        <label>Full Name<input name="fullName" autocomplete="name" required maxlength="100" [(ngModel)]="name" [disabled]="done()" /></label>
        <label>Email Address<input name="leadEmail" type="email" autocomplete="email" email required maxlength="254" [(ngModel)]="email" [disabled]="done()" /></label>
      </div>
      @if(kind==='books'){
        <label>Book selection<select name="book" required [(ngModel)]="bookId" [disabled]="done()"><option value="all">All four books — launch updates</option>@for(b of books;track b.id){<option [value]="b.id">{{b.title}}</option>}<option [value]="bundle.id">Four-book bundle — $97</option></select></label>
        <label>Preferred format<select name="format" required [(ngModel)]="format" [disabled]="done()"><option value="undecided">Undecided</option><option value="pdf">eBook (PDF) — $27 per book</option><option value="print">Paperback — $47 per book</option></select></label>
        @if(bookId===bundle.id){<p class="small-text">The $97 bundle format is awaiting confirmation. Your preference does not confirm the bundle contents.</p>}
      } @else {<label>Country (optional)<input name="country" autocomplete="country-name" maxlength="80" [(ngModel)]="country" [disabled]="done()" /></label>}
      <div class="honeypot" aria-hidden="true"><label>Leave this empty<input name="companyWebsite" tabindex="-1" autocomplete="off" [(ngModel)]="website" /></label></div>
      <label class="checkbox-label"><input name="leadConsent" type="checkbox" required [(ngModel)]="consent" [disabled]="done()" /><span>{{consentText}} <a [href]="base+'privacy-policy/'">Privacy Policy</a>.</span></label>
      <button class="button gold full" type="submit" [disabled]="!available()||form.invalid||busy()||done()">{{busy()?'Registering…':done()?'Interest registered':buttonLabel}}</button>
      @if(!available()){<p class="form-note">Registration is pending setup. Your details are not sent or saved while this form is unavailable.</p>}
      <p role="status" class="form-status" [class.error]="error()">{{message()}}</p>
    </form>`,
  styles: [`:host{display:block}.lead-form{display:grid;gap:20px}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:18px}.form-note,.small-text{font-size:12px;margin:0}.notice{font-size:13px;margin:0;padding:16px;border:1px solid var(--line-strong);background:var(--gold-wash)}.form-status{margin:0}.honeypot{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}@media(max-width:560px){.form-row{grid-template-columns:1fr}}`],
})
export class LeadFormComponent {
  @Input() kind: LeadKind = 'books';
  @Input() base = '/';
  @Input() bookId = 'all';
  @Input() format: 'pdf'|'print'|'undecided' = 'undecided';
  @Output() registered = new EventEmitter<{kind: LeadKind; delivery?: string}>();
  books = BOOKS; bundle = BUNDLE; pdfReady = funnelConfig.checklist.approvedPdfReady;
  name = ''; email = ''; country = ''; consent = false; website = ''; startedAt = Date.now();
  busy = signal(false); done = signal(false); error = signal(false); message = signal('');
  available = leadsAvailable;
  get consentText() { return this.kind==='books'?'I agree to receive AAFXX launch updates for my selection.':this.kind==='checklist'?'I agree to receive the AAFXX checklist or its launch notification by email.':'I agree to AAFXX using these details to respond to my mentorship application.'; }
  get buttonLabel() { return this.kind==='books'?'Register for Launch Notifications':this.kind==='checklist'?(this.pdfReady?'Get My Free Checklist':'Notify Me When the Checklist Is Ready'):'Submit Mentorship Application'; }
  async submit() {
    if (this.busy() || this.done()) return;
    this.busy.set(true); this.message.set('');
    try {
      const result = await submitLead({ name: this.name, email: this.email, country: this.country, kind: this.kind, bookId: this.kind==='books'?this.bookId:'all', format: this.kind==='books'?this.format:'undecided', consent: this.consent, website: this.website, startedAt: this.startedAt });
      this.error.set(!result.ok); this.message.set(result.message);
      if (result.ok) {
        this.done.set(true); track('email_lead_submitted', {kind:this.kind});
        if(this.kind==='checklist') track('checklist_requested');
        if(this.kind==='mentorship') track('mentorship_applied');
        this.name=''; this.email=''; this.country=''; this.registered.emit({kind:this.kind,delivery:result.delivery});
      }
    } finally { this.busy.set(false); }
  }
}
