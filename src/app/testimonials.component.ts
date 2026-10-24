import { Component, OnDestroy, signal } from '@angular/core';
import { funnelConfig } from './funnel-config';

@Component({selector:'app-testimonials',standalone:true,template:`
  @if(items.length){<section class="wrap section" aria-roledescription="carousel" aria-label="Client testimonials" (focusin)="pause()" (mouseenter)="pause()">
    <p class="eyebrow">FROM THE LEARNING COMMUNITY</p><h2>In their <em>own words.</em></h2>
    <div class="testimonial" tabindex="0" (keydown.arrowleft)="move(-1)" (keydown.arrowright)="move(1)" (touchstart)="touchStart($event)" (touchend)="touchEnd($event)" aria-label="Use left and right arrow keys to change testimonial">
      @for(item of items;track item.id;let i=$index){@if(index()===i){<figure><blockquote>“{{item.quote}}”</blockquote><figcaption>@if(item.photo){<img [src]="item.photo" [alt]="item.name" width="56" height="56" loading="lazy" />}<span><strong>{{item.name}}</strong>@if(item.designation){<small>{{item.designation}}</small>}</span></figcaption></figure>}}
    </div><div class="controls"><button class="button outline" type="button" (click)="move(-1)" [disabled]="items.length<2" aria-label="Previous testimonial">←</button><span role="status" aria-live="polite">{{index()+1}} / {{items.length}}</span><button class="button outline" type="button" (click)="move(1)" [disabled]="items.length<2" aria-label="Next testimonial">→</button>@if(items.length>1){<button class="text-link" type="button" (click)="playing()?pause():play()">{{playing()?'Pause':'Play'}} slideshow</button>}</div>
  </section>}`,styles:[`.testimonial{border:1px solid var(--line-strong);background:var(--surface);padding:clamp(24px,5vw,60px);touch-action:pan-y}figure{margin:0;animation:fade-in .35s ease}blockquote{font:clamp(23px,3vw,36px)/1.5 var(--serif);margin:0 0 25px}figcaption{display:flex;gap:16px;align-items:center}figcaption img{border-radius:50%;object-fit:cover}small{display:block;color:var(--muted);margin-top:5px}.controls{display:flex;align-items:center;gap:20px;margin-top:20px}@keyframes fade-in{from{opacity:.3}to{opacity:1}}@media(prefers-reduced-motion:reduce){figure{animation:none}}`]})
export class TestimonialsComponent implements OnDestroy {
  items = funnelConfig.testimonials.filter(t=>t.approved&&t.name.trim()&&t.quote.trim());
  index=signal(0);playing=signal(false);timer?:ReturnType<typeof setInterval>;x=0;
  constructor(){if(this.items.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches)this.play();}
  pause(){clearInterval(this.timer);this.playing.set(false);}
  play(){this.pause();if(this.items.length<2)return;this.playing.set(true);this.timer=setInterval(()=>{if(!document.hidden)this.index.update(i=>(i+1)%this.items.length);},6500);}
  move(step:number){this.pause();this.index.update(i=>(i+step+this.items.length)%this.items.length);}
  touchStart(e:TouchEvent){this.pause();this.x=e.changedTouches[0].clientX;}
  touchEnd(e:TouchEvent){const d=e.changedTouches[0].clientX-this.x;if(Math.abs(d)>50)this.move(d>0?-1:1);}
  ngOnDestroy(){this.pause();}
}
