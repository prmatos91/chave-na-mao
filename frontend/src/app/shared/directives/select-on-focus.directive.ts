import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Seleciona todo o conteudo do campo ao ganhar foco - assim digitar substitui
 * o valor padrao (ex.: "0" num campo numerico) em vez de exigir apagar antes.
 * Uso: <input matInput type="number" formControlName="preco" selectOnFocus />
 */
@Directive({
  selector: 'input[selectOnFocus]',
  standalone: true,
})
export class SelectOnFocusDirective {
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  @HostListener('focus')
  protected onFocus(): void {
    this.elementRef.nativeElement.select();
  }
}
