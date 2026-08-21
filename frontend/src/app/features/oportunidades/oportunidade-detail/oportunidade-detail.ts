import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { Oportunidade, OportunidadeHistorico } from '../../../core/models/oportunidade.model';
import { NotificationService } from '../../../core/services/notification.service';
import { OportunidadeService } from '../../../core/services/oportunidade.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { STATUS_OPORTUNIDADE_COLOR, STATUS_OPORTUNIDADE_LABELS } from '../../../shared/utils/labels';

@Component({
  selector: 'app-oportunidade-detail',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './oportunidade-detail.html',
  styleUrl: './oportunidade-detail.scss',
})
export class OportunidadeDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly oportunidadeService = inject(OportunidadeService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  protected readonly oportunidade = signal<Oportunidade | null>(null);
  protected readonly historico = signal<OportunidadeHistorico[]>([]);
  protected readonly carregando = signal(true);

  protected readonly statusLabels = STATUS_OPORTUNIDADE_LABELS;
  protected readonly statusColor = STATUS_OPORTUNIDADE_COLOR;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    forkJoin({
      oportunidade: this.oportunidadeService.buscarPorId(id),
      historico: this.oportunidadeService.buscarHistorico(id),
    }).subscribe({
      next: ({ oportunidade, historico }) => {
        this.oportunidade.set(oportunidade);
        this.historico.set(historico);
        this.carregando.set(false);
      },
      error: () => this.router.navigate(['/oportunidades']),
    });
  }

  protected excluir(): void {
    const oportunidade = this.oportunidade();
    if (!oportunidade) return;

    const data: ConfirmDialogData = {
      titulo: 'Excluir oportunidade',
      mensagem: `Tem certeza que deseja excluir a oportunidade de "${oportunidade.cliente.nome}" com o veículo "${oportunidade.veiculo.marca} ${oportunidade.veiculo.modelo}"?`,
      textoConfirmar: 'Excluir',
      perigoso: true,
    };
    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          this.oportunidadeService.excluir(oportunidade.id).subscribe({
            next: () => {
              this.notification.success('Oportunidade excluída com sucesso.');
              this.router.navigate(['/oportunidades']);
            },
          });
        }
      });
  }
}
