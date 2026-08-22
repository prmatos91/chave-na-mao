import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime } from 'rxjs';
import { StatusVeiculo, VeiculoRequest } from '../../../core/models/veiculo.model';
import { NotificationService } from '../../../core/services/notification.service';
import { VeiculoService } from '../../../core/services/veiculo.service';
import { SelectOnFocusDirective } from '../../../shared/directives/select-on-focus.directive';
import { STATUS_VEICULO_LABELS, enumValues } from '../../../shared/utils/labels';

@Component({
  selector: 'app-veiculo-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    SelectOnFocusDirective,
  ],
  templateUrl: './veiculo-form.html',
  styleUrl: './veiculo-form.scss',
})
export class VeiculoForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly veiculoService = inject(VeiculoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  protected readonly editando = signal(false);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  private veiculoId: number | null = null;

  protected readonly statusOptions = enumValues(STATUS_VEICULO_LABELS);
  protected readonly statusLabels = STATUS_VEICULO_LABELS;

  private todasMarcas: string[] = [];
  private todosModelos: string[] = [];
  private todasCores: string[] = [];

  protected readonly marcasFiltradas = signal<string[]>([]);
  protected readonly modelosFiltrados = signal<string[]>([]);
  protected readonly coresFiltradas = signal<string[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    marca: ['', [Validators.required, Validators.maxLength(100)]],
    modelo: ['', [Validators.required, Validators.maxLength(100)]],
    ano: [new Date().getFullYear(), [Validators.required, Validators.min(1950)]],
    preco: [0, [Validators.required, Validators.min(0.01)]],
    cor: ['', [Validators.required, Validators.maxLength(50)]],
    quilometragem: [0, [Validators.required, Validators.min(0)]],
    status: ['DISPONIVEL' as StatusVeiculo, Validators.required],
  });

  ngOnInit(): void {
    this.carregarListasDeApoio();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.veiculoId = Number(idParam);
      this.editando.set(true);
      this.carregando.set(true);
      this.veiculoService.buscarPorId(this.veiculoId).subscribe({
        next: (veiculo) => {
          this.form.patchValue(veiculo);
          this.carregando.set(false);
          this.carregarModelosDaMarca(veiculo.marca);
        },
        error: () => {
          this.carregando.set(false);
          this.router.navigate(['/veiculos']);
        },
      });
    }

    this.form.controls.marca.valueChanges.pipe(debounceTime(150)).subscribe((valor) => {
      this.marcasFiltradas.set(this.filtrar(this.todasMarcas, valor));
    });

    this.form.controls.modelo.valueChanges.pipe(debounceTime(150)).subscribe((valor) => {
      this.modelosFiltrados.set(this.filtrar(this.todosModelos, valor));
    });

    this.form.controls.cor.valueChanges.pipe(debounceTime(150)).subscribe((valor) => {
      this.coresFiltradas.set(this.filtrar(this.todasCores, valor));
    });
  }

  protected marcaSelecionada(marca: string): void {
    this.carregarModelosDaMarca(marca);
  }

  private carregarListasDeApoio(): void {
    this.veiculoService.listarMarcas().subscribe((marcas) => {
      this.todasMarcas = marcas;
      this.marcasFiltradas.set(marcas);
    });
    this.veiculoService.listarCores().subscribe((cores) => {
      this.todasCores = cores;
      this.coresFiltradas.set(cores);
    });
  }

  private carregarModelosDaMarca(marca: string): void {
    if (!marca) {
      this.todosModelos = [];
      this.modelosFiltrados.set([]);
      return;
    }
    this.veiculoService.listarModelosPorMarca(marca).subscribe((modelos) => {
      this.todosModelos = modelos;
      this.modelosFiltrados.set(modelos);
    });
  }

  private filtrar(opcoes: string[], valor: string | null): string[] {
    const texto = (valor || '').trim().toLowerCase();
    if (!texto) return opcoes;
    return opcoes.filter((opcao) => opcao.toLowerCase().includes(texto));
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const request: VeiculoRequest = this.form.getRawValue();
    const obs =
      this.editando() && this.veiculoId !== null
        ? this.veiculoService.atualizar(this.veiculoId, request)
        : this.veiculoService.criar(request);

    obs.subscribe({
      next: () => {
        this.notification.success(`Veículo ${this.editando() ? 'atualizado' : 'cadastrado'} com sucesso.`);
        this.router.navigate(['/veiculos']);
      },
      error: () => this.salvando.set(false),
    });
  }

  protected cancelar(): void {
    this.router.navigate(['/veiculos']);
  }
}
