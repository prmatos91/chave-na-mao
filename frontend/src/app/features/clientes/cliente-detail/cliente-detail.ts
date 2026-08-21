import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Cliente } from '../../../core/models/cliente.model';
import { ClienteService } from '../../../core/services/cliente.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { INTERESSE_LABELS } from '../../../shared/utils/labels';

@Component({
  selector: 'app-cliente-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cliente-detail.html',
  styleUrl: './cliente-detail.scss',
})
export class ClienteDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clienteService = inject(ClienteService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  protected readonly cliente = signal<Cliente | null>(null);
  protected readonly carregando = signal(true);

  protected readonly interesseLabels = INTERESSE_LABELS;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.clienteService.buscarPorId(id).subscribe({
      next: (c) => {
        this.cliente.set(c);
        this.carregando.set(false);
      },
      error: () => this.router.navigate(['/clientes']),
    });
  }

  protected excluir(): void {
    const cliente = this.cliente();
    if (!cliente) return;

    const data: ConfirmDialogData = {
      titulo: 'Excluir cliente',
      mensagem: `Tem certeza que deseja excluir "${cliente.nome}"? Essa ação não pode ser desfeita.`,
      textoConfirmar: 'Excluir',
      perigoso: true,
    };
    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          this.clienteService.excluir(cliente.id).subscribe({
            next: () => {
              this.notification.success('Cliente excluído com sucesso.');
              this.router.navigate(['/clientes']);
            },
          });
        }
      });
  }
}
