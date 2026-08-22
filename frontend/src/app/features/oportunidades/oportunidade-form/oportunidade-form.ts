import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../../core/models/cliente.model';
import { OportunidadeRequest, StatusOportunidade } from '../../../core/models/oportunidade.model';
import { Veiculo } from '../../../core/models/veiculo.model';
import { ClienteService } from '../../../core/services/cliente.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OportunidadeService } from '../../../core/services/oportunidade.service';
import { VeiculoService } from '../../../core/services/veiculo.service';
import { SelectOnFocusDirective } from '../../../shared/directives/select-on-focus.directive';
import { STATUS_OPORTUNIDADE_LABELS, enumValues } from '../../../shared/utils/labels';

@Component({
  selector: 'app-oportunidade-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    SelectOnFocusDirective,
  ],
  templateUrl: './oportunidade-form.html',
  styleUrl: './oportunidade-form.scss',
})
export class OportunidadeForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly oportunidadeService = inject(OportunidadeService);
  private readonly clienteService = inject(ClienteService);
  private readonly veiculoService = inject(VeiculoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  protected readonly editando = signal(false);
  protected readonly carregando = signal(true);
  protected readonly salvando = signal(false);
  private oportunidadeId: number | null = null;

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly veiculos = signal<Veiculo[]>([]);

  protected readonly statusOptions = enumValues(STATUS_OPORTUNIDADE_LABELS);
  protected readonly statusLabels = STATUS_OPORTUNIDADE_LABELS;

  protected readonly form = this.fb.nonNullable.group({
    clienteId: [null as number | null, Validators.required],
    veiculoId: [null as number | null, Validators.required],
    status: ['NOVO_LEAD' as StatusOportunidade, Validators.required],
    valorProposto: [null as number | null],
    observacoes: [''],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.oportunidadeId = idParam ? Number(idParam) : null;
    this.editando.set(this.oportunidadeId !== null);

    const listasBase = {
      clientes: this.clienteService.listar({ size: 200 }),
      veiculos: this.veiculoService.listar({ size: 200 }),
    };

    forkJoin(listasBase).subscribe(({ clientes, veiculos }) => {
      this.clientes.set(clientes.content);
      this.veiculos.set(veiculos.content);

      if (this.oportunidadeId !== null) {
        this.oportunidadeService.buscarPorId(this.oportunidadeId).subscribe({
          next: (oportunidade) => {
            this.form.patchValue({
              clienteId: oportunidade.cliente.id,
              veiculoId: oportunidade.veiculo.id,
              status: oportunidade.status,
              valorProposto: oportunidade.valorProposto,
              observacoes: oportunidade.observacoes ?? '',
            });
            this.carregando.set(false);
          },
          error: () => {
            this.carregando.set(false);
            this.router.navigate(['/oportunidades']);
          },
        });
      } else {
        this.carregando.set(false);
      }
    });
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    const raw = this.form.getRawValue();
    const request: OportunidadeRequest = {
      clienteId: raw.clienteId!,
      veiculoId: raw.veiculoId!,
      status: raw.status,
      valorProposto: raw.valorProposto,
      observacoes: raw.observacoes || null,
    };
    const obs =
      this.editando() && this.oportunidadeId !== null
        ? this.oportunidadeService.atualizar(this.oportunidadeId, request)
        : this.oportunidadeService.criar(request);

    obs.subscribe({
      next: () => {
        this.notification.success(
          `Oportunidade ${this.editando() ? 'atualizada' : 'cadastrada'} com sucesso.`
        );
        this.router.navigate(['/oportunidades']);
      },
      error: () => this.salvando.set(false),
    });
  }

  protected cancelar(): void {
    this.router.navigate(['/oportunidades']);
  }
}
