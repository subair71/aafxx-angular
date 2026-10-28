import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { Book, BookFormat } from './catalogue';
import { checkoutFor, formatPrice } from './commerce';
import { purchaseAction } from './funnel';
import { track } from './analytics';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-book-card', standalone: true, imports: [IconComponent],
  template: `
    <article class="book-card">
      <a class="book-visual" [class.has-cover]="!!book.cover" [href]="href" (click)="open($event)" [attr.aria-label]="'View ' + book.title">
        @if(book.cover) {
          <img [src]="base + (book.coverThumbnail || book.cover)"
            [attr.srcset]="book.coverThumbnail ? base + book.coverThumbnail + ' 480w, ' + base + book.cover + ' 1066w' : null"
            sizes="(max-width: 380px) calc(100vw - 96px), (max-width: 1150px) 280px, 240px"
            [alt]="book.coverAlt" width="1066" height="1599" loading="lazy" decoding="async" />
        } @else {
          <span class="visual-top"><span>AAFXX / THE COLLECTION</span><app-icon name="book-open" /></span>
          <span class="volume-number" aria-hidden="true">0{{book.number}}</span>
          <span class="visual-bottom"><span>BOOK 0{{book.number}}</span><span>Cover artwork pending</span></span>
        }
      </a>
      <div class="book-copy">
        <p class="eyebrow">VOLUME 0{{book.number}}</p>
        <h3><a [href]="href" (click)="open($event)">{{book.title}}</a></h3>
        <p class="book-subtitle">{{book.subtitle}}</p>
        <p class="book-author">{{book.author}}</p>
        <div class="format-price-row">
          <div class="format-selector" role="group" [attr.aria-label]="'Format for ' + book.title">
            <button type="button" (click)="format.set('pdf')" [attr.aria-pressed]="format() === 'pdf'">eBook</button>
            <button type="button" (click)="format.set('print')" [attr.aria-pressed]="format() === 'print'">Paperback</button>
          </div>
          <strong class="book-price" aria-live="polite">{{price(book.formats[format()].price)}}</strong>
        </div>
        <p class="price-guide">EBOOK: $27 | PAPERBACK: $47<br />BUNDLE (4 Books): $97</p>
        <div class="book-actions"><a class="text-link" [href]="href" (click)="open($event)">View Details <app-icon name="arrow-up-right" /></a></div>
        @if(action().available){<a class="button gold purchase-action" [href]="action().href" (click)="purchase($event)">{{action().label}} <app-icon name="arrow-right" /></a><p class="availability-note">Secure checkout with Stripe.</p>}
        @else{<button type="button" class="button gold purchase-action" disabled>{{action().label}}</button><p class="availability-note">Stripe checkout is not open yet. No payment is collected.</p><a class="text-link notification-action" [href]="action().href" (click)="purchase($event)">Notify me when ordering opens <app-icon name="arrow-right" /></a>}
      </div>
    </article>`,
  styleUrl: './book-card.component.css',
})
export class BookCardComponent {
  @Input({ required: true }) book!: Book;
  @Input() base = '/';
  @Output() navigate = new EventEmitter<{url:string,event:MouseEvent}>();
  format = signal<BookFormat>('pdf');
  price = formatPrice;
  get href() { return this.base + 'books/' + this.book.slug + '/'; }
  action() { return purchaseAction(this.book,this.format(),this.base); }
  purchase(event: MouseEvent) { const action=this.action(); if(action.available)track('buy_now_clicked',{product:this.book.formats[this.format()].sku}); if(!action.external)this.navigate.emit({url:action.href,event}); }
  checkout() { return checkoutFor(this.book, this.format()); }
  open(event: MouseEvent) { this.navigate.emit({url:this.href,event}); }
}
