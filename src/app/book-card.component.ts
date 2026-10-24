import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { Book, BookFormat } from './catalogue';
import { checkoutFor, formatPrice } from './commerce';
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
            <button type="button" (click)="format.set('pdf')" [attr.aria-pressed]="format() === 'pdf'">PDF</button>
            <button type="button" (click)="format.set('print')" [attr.aria-pressed]="format() === 'print'">Print</button>
          </div>
          <strong class="book-price" aria-live="polite">{{price(book.formats[format()].price)}}</strong>
        </div>
        <div class="book-actions">
          <a class="text-link" [href]="href" (click)="open($event)">View Details <app-icon name="arrow-up-right" /></a>
          @if(checkout().available) {
            <a class="button gold small" [href]="checkout().url" rel="noopener">Buy Now <app-icon name="arrow-right" /></a>
          } @else {
            <button type="button" class="button gold small" disabled [attr.aria-describedby]="book.id + '-availability'">Buy Now</button>
          }
        </div>
        <p class="availability-note" [id]="book.id + '-availability'" role="status">{{checkout().message}}</p>
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
  checkout() { return checkoutFor(this.book, this.format()); }
  open(event: MouseEvent) { this.navigate.emit({url:this.href,event}); }
}
