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
import { StatusVeiculo, VeiculoRequest } from '../../../core/models/veiculo.model';
import { NotificationService } from '../../../core/services/notification.service';
import { VeiculoService } from '../../../core/services/veiculo.service';
import { STATUS_VEICULO_LABELS, enumValues } from '../../../shared/utils/labels';

@Component({
  selector: 'app-veiculo-form',
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
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.veiculoId = Number(idParam);
      this.editando.set(true);
      this.carregando.set(true);
      this.veiculoService.buscarPorId(this.veiculoId).subscribe({
        next: (veiculo) => {
          this.form.patchValue(veiculo);
          this.carregando.set(false);
        },
        error: () => {
          this.carregando.set(false);
          this.router.navigate(['/veiculos']);
        },
      });
    }
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
