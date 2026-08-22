import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SelectOnFocusDirective } from './select-on-focus.directive';

@Component({
  standalone: true,
  imports: [SelectOnFocusDirective],
  template: `<input selectOnFocus value="0" />`,
})
class TestHostComponent {}

describe('SelectOnFocusDirective', () => {
  it('seleciona todo o conteudo do input ao ganhar foco', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    input.focus();

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });
});
