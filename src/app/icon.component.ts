import { Component, Input } from '@angular/core';

/** Local Lucide SVGs; upstream licence and attribution are in assets/icons/. */
@Component({
  selector: 'app-icon', standalone: true,
  template: `<span aria-hidden="true" [style.mask-image]="source" [style.-webkit-mask-image]="source"></span>`,
  styles: [`:host{display:inline-flex;flex:none;vertical-align:middle}span{display:block;width:1.15em;height:1.15em;background:currentColor;mask-position:center;mask-size:contain;mask-repeat:no-repeat;-webkit-mask-position:center;-webkit-mask-size:contain;-webkit-mask-repeat:no-repeat}`],
})
export class IconComponent {
  @Input() name = 'arrow-right';
  get source() { return `url("${new URL(document.baseURI).pathname}assets/icons/${this.name}.svg")`; }
}
