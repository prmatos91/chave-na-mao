import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime } from 'rxjs';
import { StatusVeiculo, Veiculo } from '../../../core/models/veiculo.model';
import { NotificationService } from '../../../core/services/notification.service';
import { VeiculoService } from '../../../core/services/veiculo.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { STATUS_VEICULO_COLOR, STATUS_VEICULO_LABELS, enumValues } from '../../../shared/utils/labels';
import { VeiculoDetailDialog } from '../veiculo-detail-dialog/veiculo-detail-dialog';

@Component({
  selector: 'app-veiculo-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './veiculo-list.html',
  styleUrl: './veiculo-list.scss',
})
export class VeiculoList implements OnInit {
  private readonly veiculoService = inject(VeiculoService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  protected readonly displayedColumns = [
    'marca',
    'modelo',
    'ano',
    'preco',
    'cor',
    'quilometragem',
    'status',
    'acoes',
  ];

  protected readonly data = signal<Veiculo[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly loading = signal(true);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  protected readonly statusControl = new FormControl<StatusVeiculo | ''>('');
  protected readonly searchControl = new FormControl('');

  protected readonly statusOptions = enumValues(STATUS_VEICULO_LABELS);
  protected readonly statusLabels = STATUS_VEICULO_LABELS;
  protected readonly statusColor = STATUS_VEICULO_COLOR;

  protected statusLabel(status: StatusVeiculo): string {
    return this.statusLabels[status];
  }

  protected statusClass(status: StatusVeiculo): string {
    return this.statusColor[status];
  }

  ngOnInit(): void {
    this.carregar();

    this.statusControl.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.carregar();
    });

    this.searchControl.valueChanges.pipe(debounceTime(400)).subscribe(() => {
      this.pageIndex.set(0);
      this.carregar();
    });
  }

  protected carregar(): void {
    this.loading.set(true);
    this.veiculoService
      .listar({
        status: this.statusControl.value || undefined,
        q: this.searchControl.value || undefined,
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

  protected visualizar(veiculo: Veiculo): void {
    this.dialog.open(VeiculoDetailDialog, { data: veiculo, width: '480px' });
  }

  protected excluir(veiculo: Veiculo): void {
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
              this.carregar();
            },
          });
        }
      });
  }
}
