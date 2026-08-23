import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Oportunidade } from '../../../core/models/oportunidade.model';
import { Veiculo } from '../../../core/models/veiculo.model';
import { NotificationService } from '../../../core/services/notification.service';
import { OportunidadeService } from '../../../core/services/oportunidade.service';
import { VeiculoService } from '../../../core/services/veiculo.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import {
  STATUS_OPORTUNIDADE_COLOR,
  STATUS_OPORTUNIDADE_LABELS,
  STATUS_VEICULO_COLOR,
  STATUS_VEICULO_LABELS,
} from '../../../shared/utils/labels';

@Component({
  selector: 'app-veiculo-detail',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './veiculo-detail.html',
  styleUrl: './veiculo-detail.scss',
})
export class VeiculoDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly veiculoService = inject(VeiculoService);
  private readonly oportunidadeService = inject(OportunidadeService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  protected readonly veiculo = signal<Veiculo | null>(null);
  protected readonly oportunidades = signal<Oportunidade[]>([]);
  protected readonly carregando = signal(true);
  protected readonly carregandoOportunidades = signal(true);

  protected readonly statusLabels = STATUS_VEICULO_LABELS;
  protected readonly statusColor = STATUS_VEICULO_COLOR;
  protected readonly statusOportunidadeLabels = STATUS_OPORTUNIDADE_LABELS;
  protected readonly statusOportunidadeColor = STATUS_OPORTUNIDADE_COLOR;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.veiculoService.buscarPorId(id).subscribe({
      next: (v) => {
        this.veiculo.set(v);
        this.carregando.set(false);
      },
      error: () => this.router.navigate(['/veiculos']),
    });

    this.oportunidadeService.listar({ veiculoId: id, size: 50, sort: 'createdAt,desc' }).subscribe({
      next: (page) => {
        this.oportunidades.set(page.content);
        this.carregandoOportunidades.set(false);
      },
      error: () => this.carregandoOportunidades.set(false),
    });
  }

  protected excluir(): void {
    const veiculo = this.veiculo();
    if (!veiculo) return;

    const data: ConfirmDialogData = {
      titulo: 'Excluir veículo',
      mensagem: `Tem certeza que deseja excluir "${veiculo.marca} ${veiculo.modelo}" (${veiculo.ano})? Essa ação não pode ser desfeita.`,
      textoConfirmar: 'Excluir',
      perigoso: true,
    };
    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmado) => {
        if (confirmado) {
          this.veiculoService.excluir(veiculo.id).subscribe({
            next: () => {
              this.notification.success('Veículo excluído com sucesso.');
              this.router.navigate(['/veiculos']);
            },
          });
        }
      });
  }
}
