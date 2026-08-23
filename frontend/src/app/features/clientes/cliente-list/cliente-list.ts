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
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime } from 'rxjs';
import { Cliente, InteressePrincipal } from '../../../core/models/cliente.model';
import { ClienteService } from '../../../core/services/cliente.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog';
import { INTERESSE_LABELS, enumValues } from '../../../shared/utils/labels';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
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
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.scss',
})
export class ClienteList implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  protected readonly displayedColumns = ['nome', 'email', 'telefone', 'interesse', 'acoes'];

  protected readonly data = signal<Cliente[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly loading = signal(true);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly sortState = signal<Sort>({ active: '', direction: '' });

  protected readonly interesseControl = new FormControl<InteressePrincipal | ''>('');
  protected readonly searchControl = new FormControl('');

  protected readonly interesseOptions = enumValues(INTERESSE_LABELS);
  protected readonly interesseLabels = INTERESSE_LABELS;

  protected interesseLabel(interesse: InteressePrincipal): string {
    return this.interesseLabels[interesse];
  }

  ngOnInit(): void {
    this.carregar();

    this.interesseControl.valueChanges.subscribe(() => {
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
    const sort = this.sortState();
    this.clienteService
      .listar({
        interesse: this.interesseControl.value || undefined,
        q: this.searchControl.value || undefined,
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: sort.direction ? `${sort.active},${sort.direction}` : undefined,
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

  protected onSort(sort: Sort): void {
    this.sortState.set(sort);
    this.pageIndex.set(0);
    this.carregar();
  }

  protected excluir(cliente: Cliente): void {
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
              this.carregar();
            },
          });
        }
      });
  }
}
