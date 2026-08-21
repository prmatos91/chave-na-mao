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
import { ClienteRequest, InteressePrincipal } from '../../../core/models/cliente.model';
import { ClienteService } from '../../../core/services/cliente.service';
import { NotificationService } from '../../../core/services/notification.service';
import { INTERESSE_LABELS, enumValues } from '../../../shared/utils/labels';

@Component({
  selector: 'app-cliente-form',
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
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.scss',
})
export class ClienteForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clienteService = inject(ClienteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  protected readonly editando = signal(false);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  private clienteId: number | null = null;

  protected readonly interesseOptions = enumValues(INTERESSE_LABELS);
  protected readonly interesseLabels = INTERESSE_LABELS;

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telefone: ['', [Validators.required, Validators.maxLength(20)]],
    interessePrincipal: ['SUV' as InteressePrincipal, Validators.required],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.clienteId = Number(idParam);
      this.editando.set(true);
      this.carregando.set(true);
      this.clienteService.buscarPorId(this.clienteId).subscribe({
        next: (cliente) => {
          this.form.patchValue(cliente);
          this.carregando.set(false);
        },
        error: () => {
          this.carregando.set(false);
          this.router.navigate(['/clientes']);
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
    const request: ClienteRequest = this.form.getRawValue();
    const obs =
      this.editando() && this.clienteId !== null
        ? this.clienteService.atualizar(this.clienteId, request)
        : this.clienteService.criar(request);

    obs.subscribe({
      next: () => {
        this.notification.success(`Cliente ${this.editando() ? 'atualizado' : 'cadastrado'} com sucesso.`);
        this.router.navigate(['/clientes']);
      },
      error: () => this.salvando.set(false),
    });
  }

  protected cancelar(): void {
    this.router.navigate(['/clientes']);
  }
}
