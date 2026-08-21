import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../../core/models/cliente.model';
import { Oportunidade, StatusOportunidade } from '../../../core/models/oportunidade.model';
import { Veiculo } from '../../../core/models/veiculo.model';
import { ClienteService } from '../../../core/services/cliente.service';
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
  enumValues,
} from '../../../shared/utils/labels';
import { OportunidadeDetailDialog } from '../oportunidade-detail-dialog/oportunidade-detail-dialog';

@Component({
  selector: 'app-oportunidade-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './oportunidade-list.html',
  styleUrl: './oportunidade-list.scss',
})
export class OportunidadeList implements OnInit {
  private readonly oportunidadeService = inject(OportunidadeService);
  private readonly clienteService = inject(ClienteService);
  private readonly veiculoService = inject(VeiculoService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  protected readonly displayedColumns = ['cliente', 'veiculo', 'status', 'valorProposto', 'acoes'];

  protected readonly data = signal<Oportunidade[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly loading = signal(true);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly veiculos = signal<Veiculo[]>([]);

  protected readonly statusControl = new FormControl<StatusOportunidade | ''>('');
  protected readonly clienteControl = new FormControl<number | ''>('');
  protected readonly veiculoControl = new FormControl<number | ''>('');

  protected readonly statusOptions = enumValues(STATUS_OPORTUNIDADE_LABELS);
  protected readonly statusLabels = STATUS_OPORTUNIDADE_LABELS;
  protected readonly statusColor = STATUS_OPORTUNIDADE_COLOR;

  protected statusLabel(status: StatusOportunidade): string {
    return this.statusLabels[status];
  }

  protected statusClass(status: StatusOportunidade): string {
    return this.statusColor[status];
  }

  ngOnInit(): void {
    forkJoin({
      clientes: this.clienteService.listar({ size: 200 }),
      veiculos: this.veiculoService.listar({ size: 200 }),
    }).subscribe(({ clientes, veiculos }) => {
      this.clientes.set(clientes.content);
      this.veiculos.set(veiculos.content);
    });

    this.carregar();

    this.statusControl.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.carregar();
    });
    this.clienteControl.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.carregar();
    });
    this.veiculoControl.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.carregar();
    });
  }

  protected carregar(): void {
    this.loading.set(true);
    this.oportunidadeService
      .listar({
        status: this.statusControl.value || undefined,
        clienteId: this.clienteControl.value || undefined,
        veiculoId: this.veiculoControl.value || undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
      })
      .subscribe({
        next: (page) => {
          this.data.set(page.content);
          this.totalElements.set(page.totalElements);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregar();
  }

  protected visualizar(oportunidade: Oportunidade): void {
    this.dialog.open(OportunidadeDetailDialog, { data: oportunidade, width: '520px' });
  }

  protected excluir(oportunidade: Oportunidade): void {
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
              this.carregar();
            },
          });
        }
      });
  }
}
