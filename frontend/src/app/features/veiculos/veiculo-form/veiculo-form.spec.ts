import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { VeiculoForm } from './veiculo-form';

describe('VeiculoForm', () => {
  async function setup(paramMap: Record<string, string> = {}) {
    await TestBed.configureTestingModule({
      imports: [VeiculoForm, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(paramMap) } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(VeiculoForm);
    fixture.detectChanges();
    return fixture;
  }

  it('deve iniciar em modo de criacao com o formulario invalido (campos obrigatorios vazios)', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    expect(component['editando']()).toBe(false);
    expect(component['form'].valid).toBe(false);
  });

  it('deve ficar valido quando todos os campos obrigatorios sao preenchidos corretamente', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component['form'].setValue({
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2023,
      preco: 145900,
      cor: 'Prata',
      quilometragem: 12000,
      status: 'DISPONIVEL',
    });

    expect(component['form'].valid).toBe(true);
  });

  it('deve marcar o campo preco como invalido quando o valor e zero ou negativo', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component['form'].controls.preco.setValue(0);

    expect(component['form'].controls.preco.hasError('min')).toBe(true);
  });

  it('deve entrar em modo de edicao quando a rota possui um id', async () => {
    const fixture = await setup({ id: '1' });
    const component = fixture.componentInstance;

    expect(component['editando']()).toBe(true);
  });
});
